Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/storageManager.jsm");
Components.utils.import("resource://modules/utils.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://modules/exceptions.jsm");
Components.utils.import("resource://modules/events.jsm");

var EXPORTED_SYMBOLS = [ "localDocument" ];

var _propertyNames = null;
function localDocument(config) {
    if (config) {
        this.values = {};
        this.properties = {};
        if (config.initid) {
            // existing document
            this.retrieve(config);
        } else if (config.fromid) {
            // new document
            this.create(config);
        } else {
            // FIXME
            throw "missing arguments";
        }
    }
}
localDocument.prototype = {
        _initid : null,
        _dirty : false,
        _modified : null,
        properties : null,
        values : null,
        labels : null,
        domainId : 0, // set by manager
        inMemoryDoc: false,
        retrieve : function(config) {
            try {
                var docRecord = null;
                if (config.docRecord) {
                    docRecord = config.docRecord;
                } else {
                    docRecord = storageManager.getDocument({
                        initid : config.initid
                    });
                }
                var props = this.getPropertiesName(docRecord.fromid);
                var val;
                for ( var id in docRecord) {
                    try {
                        val = JSON.parse(docRecord[id]);
                        if(typeof val !== 'object'){
                            //FIXME: this is a ugly workaround, please add json in attributesMapping
                            val = docRecord[id];
                        }
                        // val = eval('(' + docRecord[id] + ')');
                    } catch (e) {
                        val = docRecord[id];
                    }
                    if (props[id]) {
                        this.properties[id] = val;
                    } else {
                        this.values[id] = val;
                    }
                }
                // logConsole( "retrieved doc", this);
                this._initid = this.properties.initid;
            } catch (e) {
                log(e, "error when retrieving values");
                throw (e);
            }
        },
        create : function(config) {
            //True while the doc hasn't been saved
            this.inMemoryDoc = true;
            this._initid = 'DLID-' + Components.classes["@mozilla.org/uuid-generator;1"].getService(
                    Components.interfaces.nsIUUIDGenerator).generateUUID().toString().slice(1,-1);
            this.properties.initid = this._initid;
            this.properties.id = this._initid;
            this.properties.fromid = config.fromid;
            if (config.values) {
                for (var aid in config.values) {
                    this.setValue(aid, config.values[aid]);
                }
            }
            
            var r = storageManager.execQuery({
                query : 'select name from families where famid=:famId',
                params : {
                    famId : config.fromid
                }
            });
            
            if (r.length == 1) {
                this.properties.fromname = r[0].name;
            } else {
                throw "unknown famid: "+config.fromid;
            }
        },

        getInitid : function() {
            return this._initid;
        },

        getValue : function(id, index) {
            if (id) {
                if( (index === undefined) || (index === -1) ){
                    var value = this.values[id];
                    if(value === undefined){
                        value = '';
                    }
                    return value;
                } else {
                    if( isNaN(index) ){
                        throw new ArgException("setValue :: given index is not a number");
                    }
                    var arrayValue = this.getValue(id);
                    if( Array.isArray(arrayValue) ){
                        var value = arrayValue[index];
                        if(value === undefined){
                            value = '';
                        }
                        return value;
                    } else {
                        return arrayValue;
                    }
                }
            } else {
                // FIXME
                throw new ArgException("getValue :: missing arguments");
            }
        },
        getTitle : function() {
            return this.properties.title;
        },
        getProperty : function(id) {
            if (id) {
                return this.properties[id];
            } else {
                // FIXME
                throw new ArgException("getValue :: missing arguments");
            }
        },

        getPropertiesName : function(fromid) {
            if (!_propertyNames) {
                if (fromid) {
                    _propertyNames = [];
                    var r = storageManager
                    .execQuery({
                        query : 'select attrid from attrmappings where famid=:fromid and isproperty = 1',
                        params : {
                            fromid : fromid
                        }
                    });
                    for ( var i = 0; i < r.length; i++) {
                        _propertyNames[r[i].attrid] = true;
                    }

                } else {
                    throw new ArgException(" getPropertiesName:: missing arguments");
                }
            }
            return _propertyNames;
        },
        
        getPullExtraData : function () {
            return this.getProperty('pullextradata');
        },
        getPushExtraData : function () {
            return this.getProperty('pushextradata');
        },
        /**
         * add extra data values to be use in server hook when pushing document
         * @param string key
         * @param any value (can be object/string)
         * @returns {localDocument}
         */
        setPushExtraData : function (key,value) {
            if (this.properties.pushextradata == null) this.properties.pushextradata={};
            this.properties.pushextradata[key]=value;
            return this;
        },
        setChangeState : function (newState) {
            return this.setPushExtraData('changeState', newState);
        },
        setValue : function(id, value, index) {
            if (id && (value !== undefined)) {
                if( (index === undefined) || (index === -1) ){
                    this.values[id] = value;
                } else {
                    if( isNaN(index) ){
                        throw new ArgException("setValue :: given index is not a number");
                    }
                    var arrayValue = this.getValue(id);
                    if( Array.isArray(arrayValue) ){
                        arrayValue.splice(index, 1, value);
                    } else {
                        arrayValue = [value];
                    }
                    this.values[id] = arrayValue;
                }
            } else {
                // FIXME
                throw new ArgException("setValue :: missing arguments");
            }
            this._dirty = true;
            return this;
        },

        save : function(config) {
            if (this.inMemoryDoc){
                throw "This is an inMemoryDoc. You must store it before saving";
            };
            if (this.canEdit() || (config && config.force)) {
                var now = new Date();
                if ((!config) || (! config.noModificationDate)) {
                  this.properties.revdate = parseInt(now.getTime() / 1000);
                  this.properties.mdate = utils.toIso8601(now, true);
                }
                var saveConfig = {
                        attributes : this.values,
                        properties : this.properties
                };
                if (config && config.recomputeTitle) {
                   this.recomputeTitle();
                }
                storageManager.saveDocumentValues(saveConfig);
                if ((!config) || (! config.noModificationDate)) {
                   storageManager.execQuery({
                        query : 'update synchrotimes set lastsavelocal=:mdate where initid=:initid',
                        params : {
                            mdate : utils.toIso8601(now),
                            initid : this._initid
                        }
                   });
                }
                // update doctitles also
                storageManager.execQuery({
                     query : 'update doctitles set title=:title where initid=:initid',
                     params : {
                         title : this.getTitle(),
                         initid : this._initid
                     }
                });
            } else {
                throw "document " + this._initid + " is not editable";
            }
            this._dirty = false;
            this._modified = true;
            return this;
        },
        
        store: function(config){
            try{
                if (config && config.recomputeTitle) {
                   this.recomputeTitle();
                }
                storageManager.execQuery({
                    query : "insert into docsbydomain "+
                            "( initid,  domainid,  editable,  isshared,  isusered) values "+
                            "(:initid, :domainid, :editable, :isshared, :isusered)",
                    params:{
                        initid:this.getInitid(),
                        domainid:this.domainId,
                        editable:1, //XXX: why not boolean?
                        isshared:0, //XXX: why not boolean?
                        isusered:1 //XXX: why not boolean?
                    }
                });
                storageManager.execQuery({
                    query : "insert into doctitles "+
                            "( famname,  initid,  title) values "+
                            "(:famname, :initid, :title)",
                    params:{
                        initid:this.getInitid(),
                        title:this.getTitle(),
                        famname:this.getProperty('fromname')
                    }
                });
                storageManager.execQuery({
                    query : "insert into synchrotimes "+
                            "( lastsynclocal,  lastsavelocal,  lastsyncremote,  initid) values "+
                            "(:lastsynclocal, :lastsavelocal, :lastsyncremote, :initid)",
                    params:{
                        initid:this.getInitid(),
                        lastsynclocal:0, //XXX: why not boolean?
                        lastsyncremote:0, //XXX: why not boolean?
                        lastsavelocal:utils.toIso8601(new Date())
                    }
                });
    
                //says the doc has been saved in DB
                this.inMemoryDoc = false;
                this.save(config);
                applicationEvent.publish('postStoreDocument', {documentId: this.getInitid()});
            } catch(e) {
                throw(e);
            }
        },
        
        /*
         * Check if the document has been modified and not saved
         */
        isDirty : function(){
            return this._dirty;
        },
        
        /*
         * check if the document has been modified and saved since its last synchro
         */
        isModified : function(){
            if(this._modified === null){
                var r = storageManager.execQuery({
                    query : 'SELECT (lastsynclocal < lastsavelocal) as "modified"'
                            + ' FROM synchrotimes'
                            + ' WHERE initid = :initid',
                    params : {
                        initid: this._initid
                    }
                });
                this._modified = true && r[0].modified;
            }
            return this._modified;
        },
        
        /**
         * @return boolean true if can
         */
        canEdit : function() {
            if(this.isOnlyLocal()){
                return true;
            }
            if (!this.domainId) {
                throw new ArgException("canEdit :: missing arguments");
            }
            
            var r = storageManager
            .execQuery({
                query : 'select docsbydomain.editable from documents, docsbydomain where docsbydomain.initid = documents.initid and docsbydomain.domainid=:domainid and docsbydomain.initid=:initid',
                params : {
                    domainid : this.domainId,
                    initid : this._initid
                }
            });
           
            if (r.length == 1) {
                return (r[0].editable == 1);
            }
            // TODO
            // search in docsbydomain
            return false;
        },
        /**
         * @deprecated
         * @param id
         * @returns
         */
        getDisplayValue : function(id) {
            // TODO: getDisplayValue
            if (id) {
                return this.getValue(id);
            } else {
                // FIXME
                throw new ArgException("getDisplayValue :: missing arguments");
            }
        },
     
    
        /**
         * @param string
         *            mode view|edit
         * @return string path the absolute path to the file
         */
        getBinding : function (mode) {
            var famName=this.getProperty('fromname');
            var file= Services.dirsvc.get("ProfD", Components.interfaces.nsILocalFile);
            file.append('Bindings');
            file.append(famName+'.xml');
            
            Components.utils.import("resource://modules/formater.jsm");
            var fileURI = formater.getURI({file: file});
            
            if(file.exists()){
                return fileURI.spec+'#document-'+famName+'-'+mode;
            } else {
                //FIXME: throw an exception
                return null;
            }
        },

        /**
         * get icon path
         * @return string path the absolute path to the file
         */
        getIcon : function () {
            var famName=this.getProperty('fromname');
            if (this.getProperty('doctype')=="C") {
                famName=this.getProperty('name');
            }
            var r = storageManager.execQuery({
                query : 'select icon from families where name=:famname',
                params : {
                    famname : famName
                }
            });
            
            if (r.length > 0) {
                return r[0].icon;
            }
            return null;
        },
        getLabel : function(id) {
            if (! id) return "no id";
            if (! this.labels) {
                var r = storageManager.execQuery({
                    query : 'select attrid, label from attrmappings where famid=:fromid',
                    params : {
                        fromid : this.getProperty('fromid')
                    }
                });
                this.labels={};
                for (var i=0;i<r.length;i++) {
                    this.labels[r[i].attrid]=r[i].label;
                }
            }
            if (this.labels[id]) return this.labels[id];
            return "no label "+id;
        },
        /**
         * get row of an array
         * @param string attrid
         */
        getRowNumber: function (attrid) {
            
        },
        /**
         * test if document has been localy created and never synchronized
         */
        isOnlyLocal: function () {
            var id=this.getInitid();
            if (typeof id == 'string') return (id.substr(0,5)=='DLID-');
            return false;
        },
        /**
         * delete local document is never synchronized
         */
        remove: function() {
            if (this.isOnlyLocal()) {
                logConsole('removing:'+this.getTitle());
                log('removing:'+this.getTitle());
                storageManager.execQuery({
                    query : 'delete from documents where initid=:initid',
                    params : {
                        initid : this.getInitid()
                    }
                });
                storageManager.execQuery({
                    query : 'delete from doctitles where initid=:initid',
                    params : {
                        initid : this.getInitid()
                    }
                });
                storageManager.execQuery({
                    query : 'delete from docsbydomain where initid=:initid',
                    params : {
                        initid : this.getInitid()
                    }
                });
                storageManager.execQuery({
                    query : 'delete from files where initid=:initid',
                    params : {
                        initid : this.getInitid()
                    }
                });
            } else {
                throw this.getTitle()+":not a new local document";
            }
        },
        recomputeTitle: function() {
            var r=storageManager.execQuery({
                query : 'select attrid from attrmappings where famid=:fromid and istitle = 1',
                params : {
                    fromid : this.getProperty('fromid')
                }
            });
            if (r.length > 0) {
                var title='';
                for (var i=0;i<r.length; i++) {
                    title+=this.getValue(r[i].attrid)+' ';
                }
                title=title.trim();
                if (title != '') {
                   this.properties.title=title;
                }
                logConsole('new title'+title);
            }
            
            logConsole('recomputer',r);
        }
};
