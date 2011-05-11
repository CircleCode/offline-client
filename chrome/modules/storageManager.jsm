Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/preferences.jsm");
Components.utils.import("resource://gre/modules/ISO8601DateUtils.jsm");

var EXPORTED_SYMBOLS = ["storageManager"];

const TABLES_DOCUMENTS = "documents";
const TABLES_MAPPING = "attrmappings";
const ANONATTRIBUTES_PREFIX = "anonattribute_";
const ANONATTRIBUTES_REGEXP = "^anonattribute_\d*$";

var defaultDbName = 'default';

var _dbConnections = {};

var file = Components.classes["@mozilla.org/file/directory_service;1"]
.getService(Components.interfaces.nsIProperties).get("ProfD",
        Components.interfaces.nsIFile);
file.append('storage.sqlite');

var storageService = Components.classes["@mozilla.org/storage/service;1"]
.getService(Components.interfaces.mozIStorageService);

_dbConnections[defaultDbName] = storageService.openDatabase(file); 

storageManager = {
        execQuery : function(config) {
            if (config && config.query) {
                var dbCon = this.getDbConnection(config.dbName || defaultDbName);
                try{
                    try{
                        if (config.callBack) {
                            var stmt = dbCon.createAsyncStatement(config.query);
                        } else {
                            var stmt = dbCon.createStatement(config.query);
                        }
                        log(config, "statement created by storageManager::execQuery");
                    } catch(e){
                        log(e, "statement creation falied in storageManager::execQuery");
                        log(config, "statement that storageManager::execQuery tried to create");
                        throw "aborting execQuery";
                    }
                    if (config.params) {
                        // binding parameters
                        for (var param in stmt.params) {
                            stmt.params[param] = config.params[param];
                        }
                    }
                    if (config.callBack) {
                        var stmtCallback = {};
                        if ((typeof config.callBack) == "function") {
                            stmtCallback.handleResult = callback;
                        } else if ((typeof config.callBack) == "object") {
                            if (callback.handleResult)
                                stmtCallback.handleResult = callback.handleResult;
                            if (callback.handleError)
                                stmtCallback.handleError = callback.handleError;
                            if (callback.handleCompletion)
                                stmtCallback.handleCompletion = callback.handleCompletion;
                        }
                        stmt.executeAsync(stmtCallback);
                    } else {
                        var cols = stmt.columnCount;
                        var rows = [], colNames = [], colTypes = [];
                        if (cols) {
                            while (stmt.executeStep()) {
                                var row = {};
                                for (var col = 0; col < cols; col++) {
                                    if (colNames[col] == undefined) {
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
                    return (o && o.getProperty && (o.getProperty('doctype') == 'C'));
                };

                var addFamily = function(family) {
                    if (family) {
                        if ((typeof(family) == "string")
                                || (typeof(family) == "number")) {
                            // config is the name /id of a family we already know
                            var family = this.getFamily(family);
                            if (family) {
                                families.push(family);
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

                // now we make a view for each family

                // first we get all available virtual columns
                var re = new RegExp(ANONATTRIBUTES_REGEXP);
                var allColumns = this.execQuery({
                    query : "PRAGMA table_info("+TABLES_DOCUMENTS+")"
                });
                log(allColumns, "allColumns");
                var virtualColumns = [];
                var propertiesColumns = [];
                var propertiesMapping = [];
                allColumns.forEach(function(column){
                    if(re.test(column['name'])){
                        virtualColumns.push(column['name']);
                    } else {
                        propertiesColumns.push(column['name']);
                        propertiesMapping.push({
                            columnId : column['name'],
                            attrId   : column['name'],
                            multiple : false,
                            property : true
                        });
                    }
                });
                var nbVirtualColumns = virtualColumns.length;

                families.forEach(function(family) {
                    var virtualColumnRang = 0;

                    var virtualColumnsToAdd = [];
                    var attributesMapping = [];

                    var viewQueryWhere = "fromid = "
                        + family.getProperty('id');
                    // FIXME: viewQueryWhere must use inheritance tree

                    var attributes = family.getAttributes();
                    for each (var attribute in attributes){
                        // family.getAttributes().forEach(function(attribute) {
                        if (attribute.isLeaf()) {
                            // node attributes have no value
                            if (virtualColumnRang >= nbVirtualColumns) {
                                // there is not enough virtual columns,
                                // add one
                                virtualColumnsToAdd
                                .push(ANONATTRIBUTES_PREFIX
                                        + virtualColumnRang);
                                nbVirtualColumns++;
                            }
                            attributesMapping.push({
                                columnId : ANONATTRIBUTES_PREFIX + virtualColumnRang,
                                attrId   : attribute.id,
                                multiple : attribute.inArray() || (attribute.getOption('multiple')==='yes'),
                                property : false
                            });
                            virtualColumnRang++;
                        }
                    };

                    if (virtualColumnsToAdd.length) {
                        try{
                            var dbCon = this.getDbConnection();
                            if(!dbCon.tableExists(TABLES_DOCUMENTS)){
                                throw "table "+TABLES_DOCUMENTS+" does not exists";
                            }
                            dbCon.beginTransactionAs(dbCon.TRANSACTION_EXCLUSIVE);
                            try{
                                for each (virtualColumnToAdd in virtualColumnsToAdd){
                                    var query = "ALTER TABLE " + TABLES_DOCUMENTS + " ADD COLUMN "+ virtualColumnToAdd +" TEXT ";
                                    dbCon.executeSimpleSQL(query);
                                    log(query, "added column to "+TABLES_DOCUMENTS);
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

                    var viewQuerySelect = [];
                    var familyMapping = attributesMapping.concat(propertiesMapping);
                    familyMapping.forEach(function(mapping){
                        viewQuerySelect.push(mapping.columnId + " as " + mapping.attrId);
                    });
                    
                    // we insert the mappings in TABLES_MAPPING
                    var mappingStmt = dbCon.createStatement("INSERT INTO " + TABLES_MAPPING
                            + "(famid, attrid, columnid, multiple, property)"
                            + "VALUES(:famid, :attrid, :columnid, :multiple, :property)"
                    );
                    var mappingParams = mappingStmt.newBindingParamsArray();
                    for each (mapping in familyMapping) {
                      var bp = mappingParams.newBindingParams();
                      bp.bindByName("famid", family.getProperty('id'));
                      bp.bindByName("attrid", mapping.attrId);
                      bp.bindByName("columnid", mapping.columnId);
                      bp.bindByName("multiple", mapping.multiple);
                      bp.bindByName("property", mapping.property);
                      mappingParams.addParams(bp);
                    }
                    mappingStmt.bindParameters(mappingParams);
                    mappingStmt.executeAsync();//FIXME: add failure handler

                    var viewQuery = 'CREATE VIEW ' + family.getProperty('name')
                        + ' AS SELECT ' + viewQuerySelect.join(', ')
                        + ' FROM ' + TABLES_DOCUMENTS
                        + ' WHERE ' + viewQueryWhere;

                    this.execQuery({
                        query : viewQuery
                    });
                }, this);
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
            if (config && config.docid) {
                config.dbName = config.dbName || this.defaultDbName;
                config.query = "select jsonValues from documents where id=:docid";
                config.params = {
                        docid : config.docid
                };
                return this.execQuery(config);
            }
        },
        setDocumentValues : function(config) {
            if (config && config.docid && config.values) {
                config.dbName = config.dbName || this.defaultDbName;
                config.query = "INSERT INTO documents(jsonValues) VALUES(':values') where docid=:docid";
                config.params = {
                        values : config.values,
                        docid : config.docid,
                        lastSave : ISO8601DateUtils.create(Date())
                };
            } else {
                throw "missing arguments";
            }
        },

        getDocument : function(config) {
            if (config && 'config.docid=9999') {
                return {
                    docid : 9999,
                    fromid : 9999,
                    values : {
                        frame1 : 'frame1_value',
                        attr1 : 'attr1_value'
                    }
                }
            }
            if (config && config.docid) {
                config.dbName = config.dbName || this.defaultDbName;
                config.query = "select * from documents where docid=:docid";
                config.params = {
                        docid : config.docid
                };
                return this.execQuery(config);
            }
        }
};