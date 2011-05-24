// start_venkman();
Components.utils.import("resource://modules/logger.jsm");
Components.utils.import("resource://modules/docManager.jsm");

Components.utils.import("resource://modules/storageManager.jsm");
Components.utils.import("resource://modules/fdl-context.jsm");
Components.utils.import("resource://modules/fdl-data-debug.jsm");
Components.utils.import("resource://modules/offlineSynchronize.jsm");

function initEricContext() {
	context.url = 'http://dynacase.r2d2.paris.lan/dev/';

	if (!context.isAuthenticated()) {
		var u = context.setAuthentification({
			login : 'admin',
			password : 'anakeen'
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
		modifyAntilope();
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