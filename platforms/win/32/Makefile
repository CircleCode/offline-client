include ../../../config.mk

all: clean
	mkdir -p "dist"

	tar -C "../../../" -cf - $(XUL_ELEMENTS) | tar -C dist/ -xf -
	tar -C "../../../runtimes/win/32" -cf - "xulrunner" | tar -C "dist/" -xf -

	cp "dist/xulrunner/xulrunner-stub.exe" "dist/dynacase-offline.exe"
	cp "dist/xulrunner/mozcrt19.dll" "dist/"
	cp "dynacase-offline.ico" "dist/"

	makensis build.nsi

clean:
	[ -d "dist" ] && rm -Rf dist || true
	[ -f "dynacase-offline-setup.exe" ] && rm "dynacase-offline-setup.exe" || true
