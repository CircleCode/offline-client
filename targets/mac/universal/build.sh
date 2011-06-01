#!/bin/bash

BUILD_OS="mac"
BUILD_ARCH="universal"

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

    local APP="$PKG_NAME/Dynacase Offline.app"
    mkdir -p "$APP"

    tar -C "$ORIG_DIR/Dynacase Offline.app.template" -cf - . | tar -C "$APP" -xf -
    tar -C "$XULAPP_DIR" -cf - . | tar -C "$APP/Contents/Resources" -xf -
    mkdir -p "$APP/Contents/Frameworks"
    tar -C "$XULRUNTIMES_DIR/$BUILD_OS/$BUILD_ARCH" -cf - "XUL.framework" | tar -C "$APP/Contents/Frameworks" -xf -

    if [ -n "$CUSTOMIZE_DIR" ]; then
	tar -C "$CUSTOMIZE_DIR" -cf - . | tar -C "$APP/Contents/Resources" -xf -
    fi

    mkdir -p "$APP/Contents/MacOS"
    cp "$APP/Contents/Frameworks/XUL.framework/Versions/Current/xulrunner" "$APP/Contents/MacOS/xulrunner"

    if [ "$OUTPUT" != "-" -a "${OUTPUT:0:1}" != "/" ]; then
	OUTPUT="$ORIG_DIR/$OUTPUT"
    fi
    zip -q -y -r "$OUTPUT" "$APP"

    set +e
}

_main "$@"