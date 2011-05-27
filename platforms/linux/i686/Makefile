include ../../../config.mk

PKG="$(PKG_NAME)-$(VERSION).tar.gz"

all: clean
	mkdir -p "dist/dynacase-offline"

	tar -C "../../../" -cf - $(XUL_ELEMENTS) | tar -C "dist/$(PKG_NAME)" -xf -
	tar -C "../../../runtimes/linux/i686" -cf - "xulrunner"	| tar -C "dist/$(PKG_NAME)" -xf -

	cp "dist/$(PKG_NAME)/xulrunner/xulrunner-stub" "dist/$(PKG_NAME)/$(PKG_NAME)"

	tar -C "dist" -zcf "$(PKG)" "dynacase-offline"

clean:
	[ -d "dist" ] && rm -Rf dist || true
	[ -f "$(PKG)" ] && rm "$(PKG)" || true
