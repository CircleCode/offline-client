include ../../config.mk

PKG_FILE="$(PKG_NAME)-$(VERSION).tar.gz"

all: customize

customize: prep

prep: clean
	mkdir -p "dist/"
	tar -C ../../ -cf - $(XUL_ELEMENTS) | tar -C "dist/" -xf -
	tar -C "dist/" -cf "$(PKG_FILE)" .

clean:
	[ -d "dist" ] && rm -Rf dist || true
	[ -f "$(PKG_FILE)" ] && rm "$(PKG_FILE)" || true
