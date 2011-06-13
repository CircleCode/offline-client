// start_venkman();
Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/docManager.jsm");

Components.utils.import("resource://modules/preferences.jsm");
Components.utils.import("resource://modules/storageManager.jsm");
Components.utils.import("resource://modules/fdl-context.jsm");
Components.utils.import("resource://modules/fdl-data-debug.jsm");
Components.utils.import("resource://modules/offlineSynchronize.jsm");

Components.utils.import("resource://modules/formater.jsm");

function initEricContext() {
	context.url = Preferences.get("offline.user.applicationURL");

	if (!context.isAuthenticated()) {
		var u = context.setAuthentification({
			login : Preferences.get("offline.user.login"),
			password : Preferences.get("offline.user.password")
		});
		if (!u)
			alert('error authent:' + context.getLastErrorMessage());
		logConsole(u.lastname + ' is log in');
	}

}

function clicPullDomain(domainid) {
	// var initCore=new Fdl.OfflineCore({context:context}); // need init mapping
	// Fdl core
	var domain = context.getDocument({
		id : domainid
	});
	if (domain) {
		docManager.setActiveDomain({
			domain : domain.id
		});

		myObservers();
		/*
		 * offlineSync.setProgressElements({ global :
		 * document.getElementById('progressGlobal'), detail :
		 * document.getElementById('progressDetail'), label :
		 * document.getElementById('detailLabel'), documentsToRecord :
		 * document.getElementById('documentsToRecord'), documentsRecorded :
		 * document.getElementById('documentsRecorded'), filesToRecord :
		 * document.getElementById('filesToRecord'), filesRecorded :
		 * document.getElementById('filesRecorded') });
		 */
		var label = document.getElementById('domain');

		label.value = domain.getTitle();
		offlineSync.synchronizeDomain({
			domain : domain
		});

		label.value += "\n FINISH";
	} else {
		throw "clicPullDomain no domain";
	}
}

function clicPushDomain(domainid) {
	// var initCore=new Fdl.OfflineCore({context:context}); // need init mapping
	// Fdl core
	var domain = context.getDocument({
		id : domainid
	});

	if (domain) {
		docManager.setActiveDomain({
			domain : domain.id
		});
		myObservers();
		/*
		 * offlineSync.setProgressElements({ global :
		 * document.getElementById('progressGlobal'), detail :
		 * document.getElementById('progressDetail'), label :
		 * document.getElementById('detailLabel'), documentsToSave :
		 * document.getElementById('documentsToSave'), documentsSaved :
		 * document.getElementById('documentsSaved'), filesToSave :
		 * document.getElementById('filesToSave'), filesSaved :
		 * document.getElementById('filesSaved') });
		 */
		
		var label = document.getElementById('domain');

		label.value = domain.getTitle();
		offlineSync.pushDocuments({
			domain : domain
		});

		label.value += "\n FINISH";
	} else {
		throw "clicPushDomain no domain";
	}
}

function clicGetDomains() {
	var sdomains = document.getElementById('sdomains');
	var boxDomain = document.getElementById('boxDomain');
	var domains = offlineSync.recordOfflineDomains();
	var onedom = null;
	for ( var i = 0; i < domains.length; i++) {
		onedom = domains.getDocument(i);
		sdomains.options[sdomains.options.length] = new Option(onedom
				.getTitle(), onedom.id);

	}
	boxDomain.style.visibility = 'visible';

}
function clicReset() {
    offlineSync.resetAll();
}
function clicMiscTest(domainid) {
    var ldoc=docManager.getLocalDocument({initid:1170});
    if (ldoc) {
        logConsole(ldoc.getBinding('view'));
        logConsole(ldoc.getIcon());
        logConsole(ldoc.canEdit());
        logConsole(formater.getEnumLabel({attrid:'an_sexe',famid:1112,key:'M'}));
        logConsole(formater.getDocumentTitle({initid:1128}));
        logConsole(context.getUser(), context.getUser());

    }
    //window.setTimeout( function () {clicPullDomain(domainid);}, 4000);
    /*
    var workerFactory = Components.classes["@mozilla.org/threads/workerfactory;1"]
                                     .createInstance(Components.interfaces.nsIWorkerFactory);
        
      var worker = workerFactory.newChromeWorker('chrome://dcpoffline/content/debug/debug-work-eric.js');
    //var myWorker = new Worker('chrome://dcpoffline/content/debug/debug-work-eric.js');
    */
    
}

function modifyAntilope() {
    try {
	var ldoc = docManager.getLocalDocument({
		initid : 7589
	});
	if (ldoc) {
		logConsole("modify:" + ldoc.getTitle());
		ldoc.setValue('es_habitat', "from offine client");
		ldoc.save();
	}
    } catch (e) {}
}

function myObservers() {
	/*
	 * offlineSync.setProgressElements({ global :
	 * document.getElementById('progressGlobal'), detail :
	 * document.getElementById('progressDetail'), label :
	 * document.getElementById('detailLabel'), documentsToRecord :
	 * document.getElementById('documentsToRecord'), documentsRecorded :
	 * document.getElementById('documentsRecorded'), filesToRecord :
	 * document.getElementById('filesToRecord'), filesRecorded :
	 * document.getElementById('filesRecorded') });
	 */

	offlineSync.setObservers({
		onDetailPercent : function(p) {
			myDetailPercent(p);
		},
		onGlobalPercent : function(p) {
			myGlobalPercent(p);
		},
		onDetailLabel : function(t) {
			myDetailLabel(t);
		},
		onAddDocumentsToRecord : function(t) {
			myAddDocumentsToRecord(t);
		},
		onAddDocumentsRecorded : function(t) {
			myAddDocumentsRecorded(t);
		},
		onAddFilesToRecord : function(t) {
			myAddFilesToRecord(t);
		},
		onAddFilesRecorded : function(t) {
			myAddFilesRecorded(t);
		},
		onAddDocumentsToSave : function(t) {
			myAddDocumentsToSave(t);
		},
		onAddDocumentsSaved : function(t) {
			myAddDocumentsSaved(t);
		},
		onAddFilesToSave : function(t) {
			myAddFilesToSave(t);
		},
		onAddFilesSaved : function(t) {
			myAddFilesSaved(t);
		}
	});
	
}

function myDetailPercent(p) {
	document.getElementById('progressDetail').value = p;
};

function myGlobalPercent(p) {
	document.getElementById('progressGlobal').value = p;

};
function myDetailLabel(t) {
	document.getElementById('detailLabel').setAttribute('label', t);

};
function myAddDocumentsToRecord(delta) {
	var r = document.getElementById('documentsToRecord')
	r.value = parseInt(r.value) + delta;
};

function myAddDocumentsRecorded(delta) {
	var r = document.getElementById('documentsRecorded');
	r.value = parseInt(r.value) + delta;

};
function myAddFilesToRecord(delta) {

	var r = document.getElementById('filesToRecord');
	r.value = parseInt(r.value) + delta;
};

function myAddFilesRecorded(delta) {

	var r = document.getElementById('filesRecorded');
	r.value = parseInt(r.value) + delta;
};

function myAddDocumentsToSave(delta) {
	var r = document.getElementById('documentsToSave')
	r.value = parseInt(r.value) + delta;
};

function myAddDocumentsSaved(delta) {
	var r = document.getElementById('documentsSaved');
	r.value = parseInt(r.value) + delta;
};
function myAddFilesToSave(delta) {
	var r = document.getElementById('filesToSave');
	r.value = parseInt(r.value) + delta;
};

function myAddFilesSaved(delta) {

	var r = document.getElementById('filesSaved');
	r.value = parseInt(r.value) + delta;
};
