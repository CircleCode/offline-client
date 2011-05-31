#!/bin/bash
rm -fr  ~/.anakeen/dynacase-offline-client/*/startupCache
./xulrunner-stub -jsconsole $*
