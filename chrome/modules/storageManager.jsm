Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/preferences.jsm");
Components.utils.import("resource://gre/modules/ISO8601DateUtils.jsm");

var EXPORTED_SYMBOLS = ["storageManager"];

var TABLES_DOCUMENTS = "documents";
var TABLES_MAPPING = "attrmappings";

var VIEWS_ATTRIBUTES_SUFFIX = "_attributes";
var VIEWS_PROPERTIES_SUFFIX = "_properties";

var ANONATTRIBUTES_PREFIX = "anonattribute_";
var ANONATTRIBUTES_REGEXP = "^anonattribute_\d*$";

var defaultDbName = 'default';

var cc = Components.classes;
var ci = Components.interfaces;

var file = Components.classes["@mozilla.org/file/directory_service;1"]
        .getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
log(file.path, "storage database dir");

file.append('storage.sqlite');
log(file.path, "storage database");

var storageService = cc["@mozilla.org/storage/service;1"]
        .getService(ci.mozIStorageService);

var _dbConnections = {};

var _attrMappings = {};

function getDocumentView(initid){
    // XXX Maybe a cache system could be welcome
    var r = storageManager.execQuery({
        query : "SELECT fromname, fromid"
                + " FROM " + TABLES_DOCUMENTS
                + " WHERE initid = :id",
        params : {
            initid: initid
        }
    });
    return r.fromname;
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
                        query : "SELECT famid, attrid, columnid, ismultiple, isproperty, type"
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
         * @param {String}
         *            config.query The query to execute.
         * @param {object}
         *            [config.params] The parameters to be bound to this query
         * @param {object}
         *            [config.dbName={@link defaultDbName}] the dbConnection
         *            to use (the connection must already be registered with
         *            {@link addDbConnection})
         * @param {mozIStorageStatementCallback|function}
         *            [config.callBack] The callback to be used (if provided,
         *            will autmatically make an asynchronous query)
         * @see http://mxr.mozilla.org/mozilla-central/source/storage/public/mozIStorageStatementCallback.idl
         */
        execQuery : function(config) {
            if (config && config.query) {
                var dbCon = this.getDbConnection(config.dbName || defaultDbName);
                try{
                    var stmt = null;
                    try{
                        if (config.callBack) {
                            stmt = dbCon.createAsyncStatement(config.query);
                        } else {
                            stmt = dbCon.createStatement(config.query);
                        }
                        log(config, "statement created by storageManager::execQuery");
                    } catch(e){
                        log(e, "statement creation falied in storageManager::execQuery");
                        log(config, "statement that storageManager::execQuery tried to create");
                        throw "aborting execQuery";
                    }
                    if (config.params) {
                        // binding parameters
                        for (let param in stmt.params) {
                            stmt.params[param] = config.params[param];
                        }
                    }
                    if (config.callBack) {
                        var stmtCallback = {};
                        if ((typeof config.callBack) === "function") {
                            stmtCallback.handleResult = callback;
                        } else if ((typeof config.callBack) === "object") {
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
                        var cols = stmt.columnCount;
                        var rows = [], colNames = [], colTypes = [];
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
                        if (rows.length) {
                            return rows;
                        }
                        // If there is no result, we return
                        return dbCon.lastInsertRowID;
                    }
                } catch(e){
                    log(e, "storageManager::execQuery failed");
                }
            }
        },

        initFamilyView : function(config) {
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
                        if(propertiesColumns.indexOf(property) === -1){
                            // this property does not exists in documents table
                            // add it
                            columnId = property;
                            columnsToAdd.push(columnId);
                            propertiesColumns.push(columnId);
                        }
                        propertiesMapping.push({
                            columnId    : property,
                            attrId      : property,
                            ismultiple  : typeof(properties[property]) === 'object',
                            isproperty  : true,
                            type        : 'property'
                        });
                    }
                    
                 // Here we go across all attributes this family has
                    var attributes = family.getAttributes();
                    for each (let attribute in attributes){
                        if (attribute.isLeaf()) {
                            // only leaf attributes have storable value
                            if (virtualColumnRang >= nbVirtualColumns) {
                                // there is not enough virtual columns,
                                // add one
                                var columnId = ANONATTRIBUTES_PREFIX + virtualColumnRang;
                                columnsToAdd.push(columnId);
                                virtualColumns.push(columnId);
                                nbVirtualColumns++;
                            }
                            attributesMapping.push({
                                columnId    : columnId,
                                attrId      : attribute.id,
                                ismultiple  : attribute.inArray() || (attribute.getOption('multiple')==='yes'),
                                isproperty  : false,
                                type        : attribute.type
                            });
                            virtualColumnRang++;
                        }
                    };

                    // do we have some columns to add?
                    // if yes, alter documents table with new columns
                    if (columnsToAdd.length) {
                        try{
                            var dbCon = this.getDbConnection();
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
                                        log(query, "failed to add column " + columnToAdd);
                                        throw(e);
                                    }
                                }
                                dbCon.commitTransaction();
                            }
                            catch(e){
                                dbCon.rollbackTransaction();
                                log(e, 'transaction aborted');
                            }
                        } catch(e){
                            log(e, "could not create an exclusive transaction");
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
                        viewDocumentQuerySelect.push(mapping.columnId + " as " + mapping.attrId);
                        viewAttributesQuerySelect.push(mapping.columnId + " as " + mapping.attrId);
                    });
                    propertiesMapping.forEach(function(mapping){
                        viewDocumentQuerySelect.push(mapping.columnId + " as " + mapping.attrId);
                        viewPropertiesQuerySelect.push(mapping.columnId + " as " + mapping.attrId);
                    });

                    var viewDocumentQuery = 'CREATE VIEW ' + family.getProperty('name')
                    + ' AS SELECT ' + viewDocumentQuerySelect.join(', ')
                    + ' FROM ' + TABLES_DOCUMENTS
                    + ' WHERE ' + viewQueryWhere;

                    this.execQuery({
                        query : viewDocumentQuery
                    });

                    var viewPropertiesQuery = 'CREATE VIEW ' + family.getProperty('name') + VIEWS_PROPERTIES_SUFFIX
                    + ' AS SELECT ' + viewPropertiesQuerySelect.join(', ')
                    + ' FROM ' + TABLES_DOCUMENTS
                    + ' WHERE ' + viewQueryWhere;

                    this.execQuery({
                        query : viewPropertiesQuery
                    });

                    // we add initid to the list of selected attributes
                    // to ensure you can still join when using views
                    viewAttributesQuerySelect.push('initid as initid');
                    var viewAttributesQuery = 'CREATE VIEW ' + family.getProperty('name') + VIEWS_ATTRIBUTES_SUFFIX
                    + ' AS SELECT ' + viewAttributesQuerySelect.join(', ')
                    + ' FROM ' + TABLES_DOCUMENTS
                    + ' WHERE ' + viewQueryWhere;

                    this.execQuery({
                        query : viewAttributesQuery
                    });

                    // at the end, we insert the mappings in TABLES_MAPPING
                    var mappingQuery = "INSERT INTO " + TABLES_MAPPING
                            + " (famid, attrid, columnid, ismultiple, isproperty, type)"
                            + " VALUES (:famid, :attrid, :columnid, :ismultiple, :isproperty, :type)";
                    log(mappingQuery, "mappingQuery");
                    try{
                        var mappingStmt = dbCon.createStatement(mappingQuery);
                        var mappingParams = mappingStmt.newBindingParamsArray();
                        for each (let mapping in attributesMapping.concat(propertiesMapping)) {
                            var bp = mappingParams.newBindingParams();
                            bp.bindByName("famid", family.getProperty('id'));
                            bp.bindByName("attrid", mapping.attrId);
                            bp.bindByName("columnid", mapping.columnId);
                            bp.bindByName("ismultiple", mapping.ismultiple);
                            bp.bindByName("isproperty", mapping.isproperty);
                            bp.bindByName("type", mapping.type);
                            mappingParams.addParams(bp);
                        }
                        mappingStmt.bindParameters(mappingParams);
                        
                        mappingStmt.executeAsync({
                            handleCompletion: function(reason){
                                log(reason, "completion reason");
                            },
                            handleError: function(reason){
                                log(reason, "mapping Stmt error");
                            }
                        });
                        
                        // mappingStmt.execute();
                        // FIXME: add failure handler
                    } catch(e) {
                        log(e, "mapping query failed");
                    }
                }, this);
            } else {
                // FIXME
                throw "missing arguments";
            }
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
            var config = config || {};
            var dbName = config.dbName || defaultDbName;
            return _dbConnections[dbName];
        },
        
        getDocumentValues : function(config) {
            // TESTME
            if (config && 'config.docid=9999') {
                return {
                    initid : 9999,
                    fromid : 9999,
                    values : {
                        frame1 : 'frame1_value',
                        attr1 : 'attr1_value'
                    }
                };
            }
            if (config && config.initid ) {
                var view = getDocumentView(config);
                
                // get the properties
                config.query = "SELECT *"
                    + " FROM " + view + VIEWS_PROPERTIES_SUFFIX
                    + " WHERE initid=:initid";
                config.params = {
                        initid : config.initid
                };
                var properties = this.execQuery(config);
                
                // get the attributes
                config.query = "SELECT *"
                    + " FROM " + view + VIEWS_ATTRIBUTES_SUFFIX
                    + " WHERE initid=:initid";
                config.params = {
                        initid : config.initid
                };
                var attributes = this.execQuery(config);
                
                return {
                    properties: properties,
                    attributes: attributes
                }
            }
        },
        saveDocumentValues : function(config){
            // TESTME storageManager::saveDocumentValues
            // @JSD_BREAK
            if( config ){
                var initid = config.initid || config.properties.initid;
                if(! initid ){
                    throw "missing initid argument";
                }
                var fromid = config.fromid || config.properties.fromid;
                log(fromid, "fromid");
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
                            var value = JSON.stringify(properties[propertyId]);
                            
                            columns.push(propertyId);
                            params[propertyId] = value;
                        }
                        
                        for( let attrId in attributes ){
                            var value = attributes[attrId];
                            var mapAttribute = mapping.attributes[attrId];
                            if( mapAttribute.ismultiple ){
                                if(Array.isArray(value)){
                                    value = JSON.stringify(value);
                                } else {
                                    throw "value is not an array for " + attrId
                                            " which is marked as multiple";
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
                        
                        config.query = "INSERT INTO " + TABLES_DOCUMENTS
                                + "(" + columns.join(', ') + ")"
                                + " VALUES (:" + columns.join(', :') + ")";
                        config.params = params;
                        
                        return this.execQuery(config,{
                            handleCompletion: function(reason){
                                log(reason, "completion reason");
                            },
                            handleError: function(reason){
                                log(reason, "mapping Stmt error");
                            }
                        });
                    } catch(e){
                        log(e, "storageManager::saveDocumentValues");
                        throw e;
                    }
                } else {
                    // XXX throws correct exception
                    log("missing fromid arguments");
                    throw "missing fromid arguments";
                }
            } else {
                // XXX throws correct exception
                throw "missing arguments";
            }
        },

        getFamilyValues : function(config){
            // FIXME write storageManager::getFamily
        },
        saveFamilyValues : function(config){
            // FIXME write storageManager::saveFamily
        }
};