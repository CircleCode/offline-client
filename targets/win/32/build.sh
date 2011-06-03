#!/bin/bash

BUILD_OS="win"
BUILD_ARCH="32"

ORIG_DIR=`pwd`
WORK_DIR=`mktemp -d "$ORIG_DIR/build.XXXXXXXXX"`

cd "$WORK_DIR"

function on_exit {
    local EXITCODE=$?
    cd "$ORIG_DIR"
    if [ -n "$WORK_DIR" ]; then
	rm -Rf "$WORK_DIR"
    fi
    exit $EXITCODE
}

trap on_exit EXIT

function _usage {
    echo ""
    echo "  $0 <package_name> <output_file>"
    echo ""
}

function _check_env {
    if [ -z "$XULRUNTIMES_DIR" ]; then
	XULRUNTIMES_DIR="$ORIG_DIR/../../../../xulruntimes"
    fi
    if [ ! -d "$XULRUNTIMES_DIR" ]; then
	echo "Error: XULRUNTIMES_DIR '$XULRUNTIMES_DIR' is not a valid directory."
	exit 1
    fi

    if [ -z "$XULAPP_DIR" ]; then
	XULAPP_DIR="$ORIG_DIR/../../../xulapp"
    fi
    if [ ! -d "$XULAPP_DIR" ]; then
	echo "Error: XULAPP_DIR '$XULAPP_DIR' is not a valid directory."
	exit 1
    fi
}

function _main {
    set -e

    _check_env

    local PKG_NAME=$1
    local OUTPUT=$2

    if [ -z "$PKG_NAME" ]; then
	echo "Missing or undefined PKG_NAME."
	_usage
	exit 1
    fi
    if [ -z "$OUTPUT" ]; then
	echo "Missing or undefined OUTPUT."
	_usage
	exit 1
    fi

    mkdir -p "$PKG_NAME/dist"

    tar -C "$XULAPP_DIR" -cf - . | tar -C "$PKG_NAME/dist" -xf -
    tar -C "$XULRUNTIMES_DIR/$BUILD_OS/$BUILD_ARCH" -cf - "xulrunner" | tar -C "$PKG_NAME/dist" -xf -

    if [ -n "$CUSTOMIZE_DIR" ]; then
	tar -C "$CUSTOMIZE_DIR" -cf - . | tar -C "$PKG_NAME/dist" -xf -
    fi

    cp "$PKG_NAME/dist/xulrunner/xulrunner-stub.exe" "$PKG_NAME/dist/dynacase-offline.exe"
    cp "$PKG_NAME/dist/xulrunner/mozcrt19.dll" "$PKG_NAME/dist/mozcrt19.dll"
    cp "$ORIG_DIR/dynacase-offline.ico" "$PKG_NAME/dist/dynacase-offline.ico"
    cp "$ORIG_DIR/LICENSE.txt" "$PKG_NAME/dist/LICENSE.txt"

    if [ "$OUTPUT" != "-" -a "${OUTPUT:0:1}" != "/" ]; then
	OUTPUT="$ORIG_DIR/$OUTPUT"
    fi

    cp "$ORIG_DIR/build.nsi" "$PKG_NAME/build.nsi"
    cp -pR "$ORIG_DIR/l10n" "$PKG_NAME/l10n"
    ( cd "$PKG_NAME/dist" && find . -maxdepth 1 -type f ) | sed -e 's:\./\(.*\)$:Delete "$INSTDIR\\\1":' > "$PKG_NAME/uninstall_files.nsi"
    ( cd "$PKG_NAME/dist" && ls -d */ ) | sed -e 's:^\(.*\)$:RMDir /r "$INSTDIR\\\1":' > "$PKG_NAME/uninstall_dirs.nsi"

    ( cd "$PKG_NAME" && makensis -V2 build.nsi)

    cp "$PKG_NAME/dynacase-offline-setup.exe" "$OUTPUT"

    set +e
}

_main "$@"