Components.utils.import("resource://modules/fdl-data-debug.jsm");var EXPORTED_SYMBOLS = [ "Fdl", "JSON" ];
/*!
 * Offline Class
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.OfflineCore
 * @param {Object}
 *            config
 * @cfg {Fdl.context} context the current context connection
 * @cfg {String} name the application name
 * @constructor
 */

Fdl.OfflineCore = function(config) {
	if (config && config.context) {
		this.context = config.context;
		var u = this.context.getUser();
		if (u) {
			this.login = u.login;
		}
		this.context.addFamilyMap({
			familyName : 'OFFLINEDOMAIN',
			className : 'Fdl.OfflineDomain'
		});
	}
};

Fdl.OfflineCore.prototype = {
	/**
	 * context
	 * 
	 * @private
	 * @type {Fdl.Context}
	 */
	context : null,
	/**
	 * user login
	 * 
	 * @type {String}
	 */
	login : null,
	

	/**
	 * @return {Fdl.DocumentList} list of domain documents
	 */
	getOfflineDomains : function() {
		if (!this.context)
			return null;

	
		var data = this.context.retrieveData({
			app : 'OFFLINE',
			action : 'OFF_DOMAINAPI',
			method : 'getDomains'
		});
		if (data) {
			if (!data.error) {
				data.context = this.context;
				return new Fdl.DocumentList(data);
			} else {
				this.context.setErrorMessage(data.error);
			}
		}
		return null;
	},
	/**
	 * version like 1.0.6-3
	 * 
	 * @return {String} the version of offline module
	 */
	getVersion : function() {
		var app = new Fdl.Application({
			context : this.context,
			name : 'OFFLINE'
		});
		if (app) {
			return app.version;
		}

		return 0;
	},
	

	toString : function() {
		return 'Fdl.OfflineCore';
	}
};/*!
 * Offline Class
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.OfflineDomain
 * @param {Object}
 *            config
 * @cfg {Fdl.context} context the current context connection
 * @cfg {String} name the application name
 * @constructor
 */

Fdl.OfflineDomain = function(config) {
	Fdl.Document.call(this, config);
};
Fdl.OfflineDomain.prototype = new Fdl.Document();
Fdl.OfflineDomain.prototype.toString = function() {
	return 'Fdl.OfflineDomain';
};

/**
 * Call a method for domain api
 * 
 * @param object
 *            config include method attribute and specific parameters
 * @private
 * @return {Object}
 */
Fdl.OfflineDomain.prototype.callDomainMethod = function(config) {
	if (config && config.method) {
		var data = this.context.retrieveData({
			app : 'OFFLINE',
			action : 'OFF_DOMAINAPI',
			method : config.method,
			id : this.id
		}, config);

		if (data) {
			if (!data.error) {
				return data;
			} else {
				this.context.setErrorMessage(data.error);
			}
		} else {
			this.context.setErrorMessage(config.method + ' : no data');
		}
	}
	return null;
};

/**
 * retrieve content (recursive) of shared folder
 * 
 * @param object config
 *            <ul>
 *            <li><b>until : </b>{String} date since documents has been
 *            modified</li>
 *            </ul>
 * @return {Fdl.DocumentList} list of document of user's domain
 */
Fdl.OfflineDomain.prototype.getSharedDocuments = function(config) {
	var until = null;
	if (config && config.until) {
		until = config.until;
	}
	var data = this.callDomainMethod({
		method : 'getSharedDocuments',
		until : until
	});
	if (data) {
		data.context = this.context;
		return new Fdl.DocumentList(data);

	} else {
		return null;
	}
};

/**
 * get user mode : standard or advanced
 * 
 * @return {String} "standard" or "advanced"
 */
Fdl.OfflineDomain.prototype.getUserMode = function() {
	if (!this.userMode) {
		var data = this.callDomainMethod({
			method : 'getUserMode'
		});
		if (data) {
			this.userMode = data.userMode;
		} else {
			return null;
		}
	}
	return this.userMode;
};
/**
 * retrieve content (recursive) of user folder
 * @param object config
 *            <ul>
 *            <li><b>until : </b>{String} date since documents has been
 *            modified</li>
 *            </ul>
 * @return {Fdl.DocumentList} list of document of user's domain
 */
Fdl.OfflineDomain.prototype.getUserDocuments = function(config) {
	var until = null;
	if (config && config.until) {
		until = config.until;
	}
	var data = this.callDomainMethod({
		method : 'getUserDocuments',until:until
	});
	if (data) {
		data.context = this.context;
		return new Fdl.DocumentList(data);

	} else {
		return null;
	}

};

/**
 * retrieve all document id of reserved document for current user ids are
 * initial id (initid)
 * 
 * @return {Array} of integer
 */
Fdl.OfflineDomain.prototype.getReservedDocumentIds = function() {
	var data = this.callDomainMethod({
		method : 'getReservedDocumentIds'
	});
	if (data) {
		return data.reservedDocumentIds;
	}
	return null;
};

/**
 * retrieve family document set in offline domain
 * 
 * @return {Fdl.DocumentList} list of document family
 */
Fdl.OfflineDomain.prototype.getAvailableFamilies = function() {
	if (!this.availableFamilies) {
		var data = this.callDomainMethod({
			method : 'getAvailableFamilies'
		});
		if (data) {
			data.context = this.context;
			return new Fdl.DocumentList(data);
		} else {
			return null;
		}
	}
	return this.availableFamilies;
};
/**
 * put a lock to document
 * 
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>document : </b>{Fdl.Document} the document to reserve</li>
 *            </ul>
 * @return {Fdl.Document} reverted document (null if error)
 */
Fdl.OfflineDomain.prototype.bookDocument = function(config) {
	if (config && config.document) {
		config.method = 'bookDocument';
		config.docid = config.document.id;
		var data = this.callDomainMethod(config);

		if (data) {
			if (!data.error) {
				return this.context.getDocument({
					data : data
				});
			}
		}
	}

	return null;
};

/**
 * cancel the reservation if local document is changed a revert is also
 * completed
 * 
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>document : </b>{Fdl.Document} the document where cancel
 *            the reservation</li>
 *            </ul>
 * @return {Fdl.Document} cancelled document (null if error)
 */
Fdl.OfflineDomain.prototype.unbookDocument = function(config) {
	if (config && config.document) {
		config.method = 'unbookDocument';
		config.docid = config.document.id;
		var data = this.callDomainMethod(config);

		if (data) {
			if (!data.error) {
				return this.context.getDocument({
					data : data
				});
			}
		}
	}

	return null;
};

/**
 * delete waiting changes and return update document 
 * 
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>document : </b>{Fdl.Document} the document where cancel
 *            the reservation</li>
 *            </ul>
 * @return {Fdl.Document} reverted document (null if error)
 */
Fdl.OfflineDomain.prototype.revertDocument = function(config) {
	if (config && config.document) {
		config.method = 'revertDocument';
		config.docid = config.document.id;
		var data = this.callDomainMethod(config);

		if (data) {
			if (!data.error) {
				return this.context.getDocument({
					data : data
				});
			}
		}
	}

	return null;
};

/**
 * remove document from user space the document is not deleted. It is just
 * remove from collection set to synchronize
 * 
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>document : </b>{Fdl.Document} the document to remove</li>
 *            </ul>
 * @return {Fdl.Document} removed document (null if error)
 */
Fdl.OfflineDomain.prototype.removeDocument = function(config) {
	if (config && config.document) {
		config.method = 'removeDocument';
		config.docid = config.document.id;
		var data = this.callDomainMethod(config);

		if (data) {
			if (!data.error) {
				return this.context.getDocument({
					data : data
				});
			}
		}
	}
	return null;
};

/**
 * @return {Array} list of xml form template for each available families
 */
Fdl.OfflineDomain.prototype.getFamilyForms = function() {
};
/**
 * @return {Array} list of xml template for each available families
 */
Fdl.OfflineDomain.prototype.getFamilyViews = function() {
};

/**
 * list of file content needed to change skin (overlay.css or others)
 * 
 * @return {Object}
 */
Fdl.OfflineDomain.prototype.getSkin = function() {
};

Fdl.OfflineDomain.prototype.syncObject = null;
/**
 * return sync object
 * 
 * @returns {Fdl.OfflineSync}
 */
Fdl.OfflineDomain.prototype.sync = function() {
	if (!this.syncObject) {
		this.syncObject = new Fdl.OfflineSync({
			context : this.context,
			domain : this
		});
	}
	return this.syncObject;
};


Fdl.OfflineDomain.prototype.viewObject = null;
/**
 * return sync object
 * 
 * @returns {Fdl.OfflineSync}
 */
Fdl.OfflineDomain.prototype.view = function() {
    if (!this.viewObject) {
        this.viewObject = new Fdl.OfflineView({
            context : this.context,
            domain : this
        });
    }
    return this.viewObject;
};/*!
 * Offline Class
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.OfflineSync
 * @param {Object}
 *            config
 * @cfg {Fdl.context} context the current context connection
 * @cfg {String} name the application name
 * @constructor
 */

/**
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>context : </b>{Fdl.Context} the current context</li>
 *            <li><b>domain : </b>{Fdl.OfflineDomain} the current domain</li>
 *            </ul>
 * @return {Fdl.Document} reverted document
 */
Fdl.OfflineSync = function(config) {
    if (config && config.context) {
        this.context = config.context;
        this.domain = config.domain;

    }
};

Fdl.OfflineSync.prototype = {
    /**
     * context
     * 
     * @private
     * @type {Fdl.Context}
     */
    context : null,
    /**
     * context
     * 
     * @private
     * @type {Fdl.OfflineDomain}
     */
    domain : null,
    /**
     * indicate transaction as began
     * 
     * @private
     * @type {Numeric}
     */
    transactionId : null,
    /**
     * is set after endTransaction indique detail about transaction
     * 
     * @type {Object}
     */
    transactionStatus : null,

    /**
     * document init to delete detected after pull reequest
     * 
     * @type {Array}
     */
    sharedDocumentsToDelete : [],
    userDocumentsToDelete : [],

    /**
     * begin transaction
     * 
     * @param {Object}
     *            config
     *            <ul>
     * 
     * </ul>
     * @return {Numeric} transactionId if ok, false if a transaction is already
     *         in progress
     */
    beginTransaction : function(config) {
        var data = this.callSyncMethod({
            method : 'beginTransaction'
        });
        if (data) {
            if (data.error) {
                this.transactionId = null;
                this.context.setErrorMessage(data.error);
            } else {
                this.transactionId = data.transactionId;
            }
            return this.transactionId;
        }
        return null;
    },

    /**
     * return last transaction status
     */
    getTransactionStatus : function() {
        return this.transactionStatus;
    },
    /**
     * end transaction
     * 
     * @param {Object}
     *            config
     *            <ul>
     * 
     * </ul>
     * @return {Boolean} true if ok, false if a transaction is not began
     */
    endTransaction : function(config) {
        var data = this.callSyncMethod({
            method : 'endTransaction',
            transaction : this.transactionId
        });

        if (data) {
            this.transactionStatus = data;
            if (data.error) {
                this.context.setErrorMessage(data.error);
                return false;
            } else {
                this.transactionId = null;
                return true;
            }

        }
        return null;
    },

    /**
     * resetWaitingDocs
     * 
     * @param {Object}
     *            config
     *            <ul>
     * 
     * </ul>
     * @return {Boolean} true if ok
     */
    resetWaitingDocs : function() {
        var data = this.callSyncMethod({
            method : 'resetWaitingDocs'
        });
        if (data) {
            if (data.error) {
                this.context.setErrorMessage(data.error);
                return false;
            }
            return true;
        }
        return null;
    },
    /**
     * save document to the server
     * 
     * @param {Object}
     *            config
     *            <ul>
     *            <li><b>document : </b>{Fdl.Document} the document to save</li>
     * 
     * </ul>
     * @return {Fdl.Document} pushed document (null if error)
     */
    pushDocument : function(config) {
        if (config && config.document) {
            config.method = 'pushDocument';
            config.transaction = this.transactionId;
            if (parseInt(config.transaction) > 0) {
                var data = this.callSyncMethod(config);
                if (data) {
                    if (!data.error) {
                        if (data.properties.id > 0) {
                            return this.context.getDocument({
                                data : data
                            });
                        } else {
                            // new document: not already activated so return
                            // temporary document
                            return config.document;
                        }
                    }
                }
            } else {
                this.context.setErrorMessage("no transaction id found");
            }
        }
        return null;
    },
    /**
     * save file into document to the server
     * 
     * @param {Object}
     *            config
     *            <ul>
     *            <li><b>path : </b>{String} local path</li>
     *            <li><b>documentId : </b>{Numeric} document identificator</li>
     *            <li><b>attributeId : </b>{String} attribute identificator use
     *            bracket to specify index : my_attr[2] indicate third file of a
     *            multiple value</li>
     *            </ul>
     * @return {Fdl.Document} pushed document (null if error)
     */
    pushFile : function(config) {
        // Make a stream from a file.
        if (config && config.path && config.documentId && config.attributeId) {

            var path = config.path;
            var file = Components.classes["@mozilla.org/file/local;1"]
                    .createInstance(Components.interfaces.nsILocalFile);
            file.initWithPath(path);

            if (file.exists() == false) {
                throw new Error('file ' + path + ' not exists');
            }
            var url = this.context.url
                    + '?app=OFFLINE&action=OFF_DOMAINAPI&use=sync&method=pushFile&id='
                    + this.domain.id + '&docid=' + config.documentId + '&aid='
                    + config.attributeId + '&filename=' + file.leafName
                    + '&transaction=' + this.transactionId;
            var stream = Components.classes["@mozilla.org/network/file-input-stream;1"]
                    .createInstance(Components.interfaces.nsIFileInputStream);
            stream.init(file, 0x01 | 0x08, 0644, 0x04); // file is an nsIFile
            // instance

            // Try to determine the MIME type of the file
            var mimeType = "text/plain";
            try {
                var mimeService = Components.classes["@mozilla.org/mime;1"]
                        .getService(Components.interfaces.nsIMIMEService);
                mimeType = mimeService.getTypeFromFile(file); // file is an
                // nsIFile instance
            } catch (e) { /* eat it; just use text/plain */
            }

            // Send
            var req = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                    .createInstance(Components.interfaces.nsIXMLHttpRequest);
            req.open('PUT', url, false); /* synchronous! */
            req.setRequestHeader('Content-Type', mimeType);
            req.send(stream);
        }
        return null;
    },

    /**
     * save or update document to/ from the server if document is reserved =>
     * save else update
     * 
     * @param {Object}
     *            config
     *            <ul>
     *            <li><b>document : </b>{Fdl.Document} the document to
     *            synchronise</li>
     *            </ul>
     * @return {Fdl.Document} reverted document (null if error)
     */
    synchronizeDocument : function(config) {
        return null; // TODO
    },

    /**
     * retrieve server document and replace local document
     * 
     * @param {Object}
     *            config
     *            <ul>
     *            <li><b>document : </b>{Fdl.Document} the document to revert</li>
     *            </ul>
     * @return {Fdl.Document} reverted document (null if error)
     */
    revertDocument : function(config) {
        if (config && config.document) {
            config.method = 'revertDocument';
            config.docid = config.document.id;
            var data = this.callSyncMethod(config);

            if (data) {
                if (!data.error) {
                    return this.context.getDocument({
                        data : data
                    });
                }
            }
        }
        return null;
    },
    /**
     * retrieve server document and replace local document
     * 
     * @param {Object}
     *            config
     * 
     * @return {Fdl.Document} reverted document (null if error)
     */
    getReport : function(config) {
        if (!config)
            config = {};
        config.method = 'getReport';
        var data = this.callSyncMethod(config);

        if (data) {
            if (!data.error) {
                return data.report;
            }
        }

        return null;
    },

    toString : function() {
        return 'Fdl.OfflineSync';
    }
};

/**
 * retrieve content (recursive) of shared folder
 * 
 * @param object
 *            config
 *            <ul>
 *            <li><b>until : </b>{String} date since documents has been
 *            modified</li>
 *            </ul>
 * @return {Fdl.DocumentList} list of document of user's domain
 */
Fdl.OfflineSync.prototype.getSharedDocuments = function(config) {
    var until = null;
    if (config && config.until) {
        until = config.until;
    }

    var data = this.callSyncMethod({
        method : 'getSharedDocuments',
        until : until,
        stillRecorded : (config) ? config.stillRecorded : null
    });
    if (data) {
        data.acknowledgement = this.callSyncMethod({
            method : 'getSharedDocumentsAcknowledgement'
        });
        data.context = this.context;
        this.sharedDocumentsToDelete = data.documentsToDelete;
        return new Fdl.DocumentList(data);

    } else {
        return null;
    }
};

Fdl.OfflineSync.prototype.getSharedDocumentsToDelete = function(config) {
    return this.sharedDocumentsToDelete;
};
Fdl.OfflineSync.prototype.getUserDocumentsToDelete = function(config) {
    return this.userDocumentsToDelete;
};

/**
 * retrieve content (recursive) of user folder
 * 
 * @param object
 *            config
 *            <ul>
 *            <li><b>until : </b>{String} date since documents has been
 *            modified</li>
 *            </ul>
 * @return {Fdl.DocumentList} list of document of user's domain
 */
Fdl.OfflineSync.prototype.getUserDocuments = function(config) {
    var until = null;
    if (config && config.until) {
        until = config.until;
    }
    var data = this.callSyncMethod({
        method : 'getUserDocuments',
        until : until,
        stillRecorded : (config) ? config.stillRecorded : null
    });
    if (data) {
        data.acknowledgement = this.callSyncMethod({
            method : 'getUserDocumentsAcknowledgement'
        });
        data.context = this.context;
        this.userDocumentsToDelete = data.documentsToDelete;
        return new Fdl.DocumentList(data);

    } else {
        return null;
    }
};

/**
 * Call a method for domain api
 * 
 * @param object
 *            config include method attribute and specific parameters
 * @private
 * @return {Object}
 */
Fdl.OfflineSync.prototype.callSyncMethod = function(config) {
    if (config && config.method) {
        var data = this.context.retrieveData({
            app : 'OFFLINE',
            action : 'OFF_DOMAINAPI',
            method : config.method,
            use : 'sync',
            id : this.domain.id
        }, config);

        if (data) {
            if (!data.error) {
                return data;
            } else {
                this.context.setErrorMessage(data.error);
            }
        } else {
            this.context.setErrorMessage(config.method + ' : no data');
        }
    }
    return null;
};/*!
 * Offline Class
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.OfflineView
 * @param {Object}
 *            config
 * @cfg {Fdl.context} context the current context connection
 * @cfg {String} name the application name
 * @constructor
 */

/**
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>context : </b>{Fdl.Context} the current context</li>
 *            <li><b>domain : </b>{Fdl.OfflineDomain} the current domain</li>
 *            </ul>
 * @return {Fdl.Document} reverted document
 */
Fdl.OfflineView = function(config) {
    if (config && config.context) {
        this.context = config.context;
        this.domain = config.domain;

    }
};

Fdl.OfflineView.prototype = {
    /**
     * context
     * 
     * @private
     * @type {Fdl.Context}
     */
    context : null,
    /**
     * context
     * 
     * @private
     * @type {Fdl.OfflineDomain}
     */
    domain : null,
    /**
     * retrieve all family views from server
     * 
     * @param {Object}
     * 
     * 
     * @return {Fdl.Document} reverted document (null if error)
     */
    getFamiliesBindings : function() {
        var config = {};
        config.method = 'getFamiliesBindings';
        var data = this.callViewMethod(config);

        if (data) {
            if (!data.error) {
                return data.bindings;
            }
        }

        return null;
    },

    toString : function() {
        return 'Fdl.OfflineView';
    }
};

/**
 * Call a method for domain api
 * 
 * @param object
 *            config include method attribute and specific parameters
 * @private
 * @return {Object}
 */
Fdl.OfflineView.prototype.callViewMethod = function(config) {
    if (config && config.method) {
        var data = this.context.retrieveData({
            app : 'OFFLINE',
            action : 'OFF_DOMAINAPI',
            method : config.method,
            use : 'view',
            id : this.domain.id
        }, config);

        if (data) {
            if (!data.error) {
                return data;
            } else {
                this.context.setErrorMessage(data.error);
            }
        } else {
            this.context.setErrorMessage(config.method + ' : no data');
        }
    }
    return null;
};