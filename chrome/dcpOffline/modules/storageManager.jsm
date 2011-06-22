Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/preferences.jsm");
Components.utils.import("resource://modules/exceptions.jsm");

var EXPORTED_SYMBOLS = ["storageManager"];

const TABLES_DOCUMENTS = "documents";
const TABLES_MAPPING = "attrmappings";
const TABLES_FAMILIES = "families";
const TABLES_DOMAINS = "domains";

const VIEWS_ATTRIBUTES_SUFFIX = "_attributes";
const VIEWS_PROPERTIES_SUFFIX = "_properties";

const ANONATTRIBUTES_PREFIX = "anonattribute_";
const ANONATTRIBUTES_REGEXP = "^anonattribute_[0-9]*$";

const defaultDbName = 'default';

var Cc = Components.classes;
var Ci = Components.interfaces;

var file = Cc["@mozilla.org/file/directory_service;1"]
        .getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
log(file.path, "storage database dir");

file.append('storage.sqlite');
log(file.path+":storage database");

var storageService = Cc["@mozilla.org/storage/service;1"]
        .getService(Ci.mozIStorageService);

var _dbConnections = {};

var _attrMappings = {};

function getDocumentView(initid){
	// XXX Maybe a cache system could be welcome
	var r = storageManager.execQuery({
		query : 'select fromname from documents where initid=:initid',
		params:{
			initid:initid
		}});
	if (r.length == 1) {
		return r[0].fromname;
	}
	return '';
}

function getAttrMapping(config){
    if(config && config.fromid){
        var fromid = config.fromid;
        if(fromid){
            if( config.force || (! _attrMappings[config.fromid]) ){
                try{
                    var mapping = {
                         attributes: {},
                         properties: {}
                    };
                    var r = storageManager.execQuery({
                        query : "SELECT famid, attrid, columnid, ismultiple, isproperty, type, label"
                                + " FROM " + TABLES_MAPPING
                                + " WHERE famid = :fromid",
                        params : {
                            fromid: config.fromid
                        }
                    });
                    if( Array.isArray(r) ){
                        r.forEach(function(attr){
                            if(attr.isproperty){
                                mapping.properties[attr.attrid] = attr;
                            } else {
                                mapping.attributes[attr.attrid] = attr;
                            }
                        });
                    } else {
                        throw "there does not seem to be a mapping for "+fromid;
                    }
                    _attrMappings[config.fromid] = mapping;
                } catch(e){
                    throw(e);
                }
            }
            if(_attrMappings[config.fromid]){
                return _attrMappings[config.fromid];
            } else {
                throw "there does not seem to be a mapping for "+fromid;
            }
        } else {
            throw "no fromid given";
        }
    }
}

_dbConnections[defaultDbName] = storageService.openDatabase(file);


var storageManager = {
		/**
         * execute a query
         * 
         * @param {object}
         *            config
         * @param {boolean}
         *            config.lock set to true to lock/ false to unlock
         */
		lockDatabase : function(config) {
			if (config) {
                var dbCon = this.getDbConnection(config.dbName || defaultDbName);
                if (config.lock) {
                dbCon.executeSimpleSQL("PRAGMA locking_mode = EXCLUSIVE");	
                } else {
                    dbCon.executeSimpleSQL("PRAGMA locking_mode = NORMAL");	
                }
			}
		},
    /**
     * execute a query
     * 
     * @param {object}
     *            config
     * @param {String}
     *            config.query The query to execute.
     * @param {object}
     *            [config.params] The parameters to be bound to this query
     * @param {object}
     *            [config.dbName={@link defaultDbName}] the dbConnection
     *            to use (the connection must already be registered with
     *            {@link addDbConnection})
     * @param {mozIStorageStatementCallback|function}
     *            [config.callback] The callback to be used (if provided,
     *            will autmatically make an asynchronous query)
     * @see http://mxr.mozilla.org/mozilla-central/source/storage/public/mozIStorageStatementCallback.idl
     */
    execQuery : function(config) {
    	var rows=false;
    	var cols=false;
        if (config && config.query) {
            var dbCon = this.getDbConnection(config.dbName || defaultDbName);
            try{
                var stmt = null;
                try{
                    if (config.callback) {
                        stmt = dbCon.createStatement(config.query);
                        //stmt = dbCon.createAsyncStatement(config.query);
                        //logConsole("async" + config.query);
                    } else {
                        stmt = dbCon.createStatement(config.query);
                    }
                    log(config, "statement created by storageManager::execQuery");
                } catch(e){
                    logError("statement creation failed in storageManager::execQuery :" + config.query);
                    logError(e);
                    log(config, "statement that storageManager::execQuery tried to create");
                    throw(e);
                }
                if (config.params) {
                    // binding parameters
                    for (let param in stmt.params) {
                        stmt.params[param] = config.params[param];
                    }
                }
                if (config.callback) {
                    var stmtCallback = {};
                    if ((typeof config.callback) === "function") {
                        stmtCallback.handleResult = config.callback;
                    	
                        stmtCallback.handleError = function(error){
                            logError('storage mapping Stmt error');
                            logError(error);
                        };
                        stmtCallback.handleCompletion=function(reason) {};
                    } else if ((typeof config.callback) === "object") {
                        var callback = config.callback;
                        if (callback.handleResult){
                            stmtCallback.handleResult = callback.handleResult;
                        }
                        if (callback.handleError){
                            stmtCallback.handleError = callback.handleError;
                        }
                        if (callback.handleCompletion){
                            stmtCallback.handleCompletion = callback.handleCompletion;
                        }
                    }

                    stmt.executeAsync(stmtCallback);
                } else {
                     cols = stmt.columnCount;
                     rows = [];
                     var colNames = [], colTypes = [];
                    if (cols) {
                        while (stmt.executeStep()) {
                            var row = {};
                            for (let col = 0; col < cols; col++) {
                                if (colNames[col] === undefined) {
                                    colNames[col] = stmt.getColumnName(col);
                                    colTypes[col] = stmt.getTypeOfIndex(col);
                                }
                                var value = null;
                                switch (colTypes[col]) {
                                    case stmt.VALUE_TYPE_NULL :
                                        value = null;
                                        break;
                                    case stmt.VALUE_TYPE_INTEGER :
                                        value = stmt.getInt64(col);
                                        break;
                                    case stmt.VALUE_TYPE_FLOAT :
                                        value = stmt.getDouble(col);
                                        break;
                                    case stmt.VALUE_TYPE_TEXT :
                                        value = stmt.getUTF8String(col);
                                        break;
                                    case stmt.VALUE_TYPE_BLOB :
                                        value = stmt.getBlob(col);
                                        break;
                                    default :
                                        throw "unknown coltype for col " + col;
                                }
                                row[colNames[col]] = value;
                            }
                            rows.push(row);
                        }
                    } else {
                        stmt.execute();
                    }
                    stmt.reset();
                    if (cols) {
                        return rows;
                    }
                    // If there is no result, we return lastInsertRowID
                    return dbCon.lastInsertRowID;
                    //FIXME: lastInsertRowID is not always optimal...
                }
            } catch(e){
                logError("storageManager::execQuery failed");
                logError(e);
                logError(config.query);
                logConsole('params',config.params);
                log(e, "storageManager::execQuery failed");
            }
        }
    },

    initFamilyView : function(config) {
        var dbCon = this.getDbConnection();
        if (config) {
            var families = [];

            var isFamily = function(o) {
                return (o && o.getProperty && (o.getProperty('doctype') === 'C'));
            };

            var addFamily = function(family) {
                if (family) {
                    if ((typeof(family) === "string")
                            || (typeof(family) === "number")) {
                        // config is the name / id of a family we already
                        // know
                        var fam = this.getFamily(family);
                        if (fam) {
                            families.push(fam);
                        }
                    } else if (isFamily(family)) {
                        families.push(family);
                    }
                }
            };

            if (Array.isArray(config)) {
                // config is an array of families or family names / id
                config.forEach(addFamily);
            } else {
                addFamily(config);
            }

            // first we get all available virtual columns
            var re = new RegExp(ANONATTRIBUTES_REGEXP);
            var allColumns = this.execQuery({
                query : "PRAGMA table_info("+TABLES_DOCUMENTS+")"
            });
            var virtualColumns = [];
            var propertiesColumns = [];
            var propertiesMapping = [];
            allColumns.forEach(function(column){
                if(re.test(column.name)){
                    virtualColumns.push(column.name);
                } else {
                    propertiesColumns.push(column.name);
                }
            });
            var nbVirtualColumns = virtualColumns.length;

            families.forEach(function(family) {
                var virtualColumnRang = 0;

                var columnsToAdd = [];
                var attributesMapping = [];

                var viewQueryWhere = "fromid = "
                    + family.getProperty('id');
                // FIXME: viewQueryWhere must use inheritance tree
                
                // Here we go across all properties this family has
                var properties = family.getProperties();
                for( let property in properties ){
                    columnId = property;
                    if(propertiesColumns.indexOf(property) === -1){
                        // this property does not exists in documents table
                        // add it
                        columnsToAdd.push(columnId);
                        propertiesColumns.push(columnId);
                    }
                    propertiesMapping.push({
                        columnId    : columnId,
                        attrId      : columnId,
                        istitle     : false,
                        isabstract  : false,
                        label       : '',
                        ismultiple  : typeof(properties[columnId]) === 'object',
                        isproperty  : true,
                        type        : 'property'
                    });
                }
                
             // Here we go across all attributes this family has
                var attributes = family.getAttributes();
                for each (let attribute in attributes){
                    if (attribute.isLeaf()) {
                        // only leaf attributes have storable value
                        var columnId = ANONATTRIBUTES_PREFIX + virtualColumnRang;
                        if (virtualColumnRang >= nbVirtualColumns) {
                            // there is not enough virtual columns,
                            // add one
                            columnsToAdd.push(columnId);
                            virtualColumns.push(columnId);
                            nbVirtualColumns++;
                        }
                        attributesMapping.push({
                            columnId    : columnId,
                            attrId      : attribute.id,
                            istitle     :  attribute.inTitle,
                            isabstract  :  attribute.inAbstract,
                            ismultiple  : attribute.inArray() || (attribute.getOption('multiple')==='yes'),
                            isproperty  : false,
                            label       : attribute.getLabel(),
                            type        : attribute.type
                        });
                        virtualColumnRang++;
                    }
                };

                // do we have some columns to add?
                // if yes, alter documents table with new columns
                if (columnsToAdd.length) {
                    try{
                        if(!dbCon.tableExists(TABLES_DOCUMENTS)){
                            throw "table "+TABLES_DOCUMENTS+" does not exists";
                        }
                        dbCon.beginTransactionAs(dbCon.TRANSACTION_EXCLUSIVE);
                        try{
                            for each (let columnToAdd in columnsToAdd){
                                try{
                                    var query = "ALTER TABLE " + TABLES_DOCUMENTS + " ADD COLUMN "+ columnToAdd +" TEXT DEFAULT ''";
                                    dbCon.executeSimpleSQL(query);
                                } catch(e){
                                    logError("failed to add column " + columnToAdd);
                                    logError(e);
                                    throw(e);
                                }
                            }
                            dbCon.commitTransaction();
                        }
                        catch(e){
                            dbCon.rollbackTransaction();
                            logError('storageManager::initFamilyView (transaction aborted)');
                            logError(e);
                            throw(e);
                        }
                    } catch(e){
                        logError('storageManager::initFamilyView (could not create an exclusive transaction)');
                        logError(e);
                        throw(e);
                    }
                };

                // Now, we juste have to create the 3 views:
                // - family
                // - family_properties
                // - family_attributes
                var viewDocumentQuerySelect = [];
                var viewPropertiesQuerySelect = [];
                var viewAttributesQuerySelect = [];
                attributesMapping.forEach(function(mapping){
                    viewDocumentQuerySelect.push(mapping.columnId + ' as "' + mapping.attrId +'"');
                    viewAttributesQuerySelect.push(mapping.columnId + ' as "' + mapping.attrId+'"');
                });
                propertiesMapping.forEach(function(mapping){
                    viewDocumentQuerySelect.push(mapping.columnId + ' as "' + mapping.attrId+'"');
                    viewPropertiesQuerySelect.push(mapping.columnId + ' as "' + mapping.attrId+'"');
                });

                var viewName = family.getProperty('name');
                
                var viewDocumentQuery = 'CREATE VIEW ' + viewName
                        + ' AS SELECT ' + viewDocumentQuerySelect.join(', ')
                        + ' FROM ' + TABLES_DOCUMENTS
                        + ' WHERE ' + viewQueryWhere;
                try {
                    this.execQuery({
                        query : "DROP VIEW IF EXISTS " + viewName
                    });
                    this.execQuery({
                        query : viewDocumentQuery
                    });
                } catch(e){
                    logError('storageManager::initFamilyView (document view creation)');
                    logError(e);
                    throw(e);
                }
/*
                viewName = family.getProperty('name') + VIEWS_PROPERTIES_SUFFIX;
                
                var viewPropertiesQuery = 'CREATE VIEW ' + viewName
                        + ' AS SELECT ' + viewPropertiesQuerySelect.join(', ')
                        + ' FROM ' + TABLES_DOCUMENTS
                        + ' WHERE ' + viewQueryWhere;
                
                try{
                    this.execQuery({
                        query : "DROP VIEW IF EXISTS " + viewName
                    });
                    this.execQuery({
                        query : viewPropertiesQuery
                    });
                } catch(e){
                    logError('storageManager::initFamilyView (properties view creation)');
                    logError(e);
                    throw(e);
                }
*/
                /*
                viewName = family.getProperty('name') + VIEWS_ATTRIBUTES_SUFFIX;

                // we add initid to the list of selected attributes
                // to ensure you can still join when using views
                viewAttributesQuerySelect.push('initid as initid');
                var viewAttributesQuery = 'CREATE VIEW ' + viewName
                        + ' AS SELECT ' + viewAttributesQuerySelect.join(', ')
                        + ' FROM ' + TABLES_DOCUMENTS
                        + ' WHERE ' + viewQueryWhere;
                
                try{
                    this.execQuery({
                        query : "DROP VIEW IF EXISTS " + viewName
                    });
                    this.execQuery({
                        query : viewAttributesQuery
                    });
                } catch(e){
                    logError('storageManager::initFamilyView (attributes view creation)');
                    logError(e);
                    throw(e);
                }
*/
                // at the end, we insert the mappings in TABLES_MAPPING
                var mappingQuery = "INSERT INTO " + TABLES_MAPPING
                        + " (famid, attrid, columnid, ismultiple, isabstract, istitle, isproperty, type, label)"
                        + " VALUES (:famid, :attrid, :columnid, :ismultiple, :isabstract, :istitle, :isproperty, :type, :label)";
                try{
                    var mappingStmt = dbCon.createStatement(mappingQuery);
                    var mappingParams = mappingStmt.newBindingParamsArray();
                    for each (let mapping in attributesMapping.concat(propertiesMapping)) {
                        var bp = mappingParams.newBindingParams();
                        bp.bindByName("famid", family.getProperty('id'));
                        bp.bindByName("attrid", mapping.attrId);
                        bp.bindByName("columnid", mapping.columnId);
                        bp.bindByName("ismultiple", mapping.ismultiple);
                        bp.bindByName("istitle", mapping.istitle);
                        bp.bindByName("isabstract", mapping.isabstract);
                        bp.bindByName("isproperty", mapping.isproperty);
                        bp.bindByName("label", mapping.label);
                        bp.bindByName("type", mapping.type);
                        mappingParams.addParams(bp);
                    }
                    mappingStmt.bindParameters(mappingParams);
                    
                    mappingStmt.executeAsync({
                        handleCompletion: function(reason){},
                        handleError: function(reason){
                            logError('mapping Stmt error');
                            logError(reason);
                        }
                    });
                    
                    // mappingStmt.execute();
                    
                    // FIXME: add failure handler
                } catch(e) {
                    logError('storageManager::initFamilyView (mapping query failed)');
                    logError(e);
                    throw(e);
                }
            }, this);
        } else {
            // FIXME
            throw "missing arguments";
        }
        return this;
    },

    addDbConnection : function(config) {
        if (config && config.file && config.name) {
            if (_dbConnections.hasOwnProperty(name)) {
                if (!config.silent) {
                    // XXX: throw correct exception
                    throw "this connection already exists";
                }
            }
            _dbConnections[name] = storageService.openDatabase(file);
            return _dbConnections[name];
        }
    },
    getDbConnection : function(config) {
        config = config || {};
        var dbName = config.dbName || defaultDbName;
        return _dbConnections[dbName];
    },
    
   
    getDocument : function (config){
    	if( config ){
    		var initid = config.initid;
    		if(! initid ) {
    			throw  new ArgException("getDocument :: missing initid argument");
    		}
    		var tableview=getDocumentView(initid);
    		if (tableview) {
    			var r = storageManager.execQuery({
    				query : 'select * from '+tableview+' where initid=:initid',
    				params:{
    					initid:initid
    				}});
    			//logConsole("getdoc", r);
    			if (r.length == 1) {
    				return r[0];
    			} else {
    				throw new StorageException("getDocument in view :: not found "+ initid);
    			}

    		} else {
    		    throw new StorageException("getDocument :: not found "+ initid);
    			
    		}
    	}
    },
    saveDocumentValues : function(config){
        if( config ){
            var initid = config.initid || config.properties.initid;
            if(! initid ){
                throw "saveDocumentValues ::missing initid argument";
            }
            var fromid = config.fromid || config.properties.fromid;
            if(fromid){
                try{
                    var attributes = config.attributes || [];
                    var properties = config.properties || [];
                    var mapping = getAttrMapping({
                        fromid: fromid
                    });
                    
                    var params = {};
                    var columns = [];
                    for( let propertyId in properties ){
                        
                        var value = properties[propertyId];
                        if (Array.isArray(value)) {
                            value = JSON.stringify(value);
                        } 
                        columns.push(propertyId);
                        params[propertyId] = value;
                    }
                    
                    for( let attrId in attributes ){
                        var value = attributes[attrId];
                        var mapAttribute = mapping.attributes[attrId];
                        if(mapAttribute){
                            //ignore "virtual" attributes (like *_title, for example)
                            
                            if( mapAttribute.ismultiple ){
                            	if (value) {
                                if(Array.isArray(value)){
                                    value = JSON.stringify(value);
                                } else {
                                    throw "value '+JSON.stringify(value)+' is not an array for " + attrId + " which is marked as multiple";
                                }
                            	}
                            } else {
                                switch( mapAttribute.type ){
                                    // XXX add specific attributes pre-save
                                    // formatting
                                    case 'text' :
                                    case 'longtext' :
                                    case 'time' :
                                    case 'htmltext' :
                                    case 'image' :
                                    case 'file' :
                                    case 'enum' :
                                    case 'thesaurus' :
                                    case 'docid' :
                                    case 'timestamp' :
                                    case 'date' :
                                    case 'array' :
                                    case 'int' :
                                    case 'integer' :
                                    case 'float' :
                                    case 'money' :
                                    case 'color' :
                                    default :
                                        value = value;
                                }
                            }
                            
                            columns.push(mapAttribute.columnid);
                            params[mapAttribute.columnid] = value;
                        }
                    }
                    
                    config.query = "INSERT INTO " + TABLES_DOCUMENTS
                            + "(" + columns.join(', ') + ")"
                            + " VALUES (:" + columns.join(', :') + ")";
                    config.params = params;
                
                    
                    return this.execQuery(config);
                } catch(e){
                    logError('storageManager::saveDocumentValues');
                    logError(e);
                    throw(e);
                }
            } else {
                // XXX throws correct exception
                log("storageManager::saveDocumentValues (missing fromid parameters)");
                throw "storageManager::saveDocumentValues (missing fromid parameters)";
            }
        } else {
            // XXX throws correct exception
            throw "storageManager::saveDocumentValues (missing parameters)";
        }
    },

    getFamilyValues : function(config){
        if(config){
            if(config.famid){
                var where = "famid = :famid";
                var params = {
                    famid: famid
                };
            } else if (config.name){
                var where = "name = :name";
                var params = {
                    name: name
                };
            } else {
                throw "missing parameters";
            }
            config.query = "SELECT famid, name, json_object as values"
                    + " FROM " + TABLES_FAMILIES
                    + " WHERE " + where;
            config.params = params;
            try{
                var values = this.execQuery(config);
            } catch(e){
                logError('storageManager::getFamilyValues');
                logError(e);
                throw(e);
            }
            return values;
        }
    },
    
    
    getDomainValues : function(config){
        if(config){
            if(config.domainid){
                var where = "id = :domainid";
                var params = {
                    domainid : config.domainid
                };
            } else if (config.name){
                var where = "name = :domainname";
                var params = {
                        name: config.name
                };
            } else {
                throw "storageManager::getDomainValues (missing parameters)";
            }
            config.query = "SELECT *"
                    + " FROM " + TABLES_DOMAINS
                    + " WHERE " + where;
            config.params = params;
            try{
                var values = this.execQuery(config);
            } catch(e){
                logError('storageManager::getDomainValues');
                logError(e);
                throw(e);
            }
        } else {
            throw "storageManager::getDomainValues (missing parameters)";
        }
        if (values.length == 1) {
            return values[0];
        } else {
            throw "storageManager::no domain find";
        }
        
    },
    saveDomainValues : function(config){
        if(config){
            //FIXME: write storageManager::saveDomainValues
        } else {
            throw "storageManager::saveDomainValues (missing parameters)";
        }
    }
};