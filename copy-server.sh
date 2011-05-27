#!/bin/bash

pubdir=/var/www/eric/
echo 'Components.utils.import("resource://modules/fdl-data-debug.jsm");var EXPORTED_SYMBOLS = [ "Fdl", "JSON" ];' > chrome/modules/offline-debug.jsm
cat $pubdir/lib/offline/offline-debug.js >> chrome/modules/offline-debug.jsm
echo  'var EXPORTED_SYMBOLS = [ "Fdl" , "JSON" ];' > chrome/modules/fdl-data-debug.jsm
cat  $pubdir/lib/data/fdl-data-debug.js |  sed -e "s/alert(/throw(/" >> chrome/modules/fdl-data-debug.jsm
