include ../../../config.mk

APP="$(APP_NAME).app"

all: clean
	mkdir -p "dist/$(APP)"

	tar -C "Dynacase Offline.app.template" -cf - . | tar -C "dist/$(APP)" -xf -
	tar -C "../../../" -cf - "application.ini"	"chrome/" "chrome.manifest" "defaults/"	"distribution/"	| tar -C "dist/$(APP)/Contents/Resources" -xf -
	tar -C "../../../runtimes/mac/universal" -cf - "XUL.framework" | tar -C "dist/Dynacase Offline.app/Contents/Frameworks" -xf -

	cp "dist/$(APP)/Contents/Frameworks/XUL.framework/Versions/Current/xulrunner" "dist/$(APP)/Contents/MacOS"

	mv "dist/$(APP)" "$(APP)"

clean:
	[ -d "dist" ] && rm -Rf "dist" || true
	[ -d "$(APP)" ] && rm -Rf "$(APP)" || true
