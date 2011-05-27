outfile "dynacase-offline-setup.exe"
installDir "$PROGRAMFILES\Dynacase Offline"

section
	setOutPath $INSTDIR
	writeUninstaller "$INSTDIR\uninstall.exe"

	; files
	file dist/application.ini
	file dist/chrome.manifest
	file dist/dynacase-offline.exe	
	file dist/dynacase-offline.ico
	file dist/xulrunner/mozcrt19.dll

	; dirs
	file /r dist\*

	; shortcuts
	createShortcut "$SMPROGRAMS\Dynacase Offline\Dynacase Offline.lnk" "$INSTDIR\dynacase-offline.exe" "" "$INSTDIR\dynacase-offline.ico"
	createShortcut "$SMPROGRAMS\Dynacase Offline\uninstall.lnk" "$INSTDIR\uninstall.exe"
	createShortcut "$DESKTOP\Dynacase Offline.lnk" "$INSTDIR\dynacase-offline.exe" "" "$INSTDIR\dynacase-offline.ico"
sectionEnd

section "Uninstall"
	delete "$DESKTOP\Dynacase Offline.lnk"
	delete "$SMPROGRAMS\Dynacase Offline\Dynacase Offline.lnk"
	delete "$SMPROGRAMS\Dynacase Offline\uninstall.lnk"
	rmdir /r "$SMPROGRAMS\Dynacase Offline"
	rmdir /r "$INSTDIR"
sectionEnd
