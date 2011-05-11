echo ""
echo "#######################"
echo "# updating BuildID"
echo "#######################"
UUID=`uuidgen` 
sed "s/^BuildID=.*$/BuildID=$UUID/" <application.ini >application.ini.tmp 
mv application.ini.tmp application.ini

echo ""
echo "#######################"
echo "# launching application"
echo "#     (quit it properly to reinit database)"
echo "#######################"
./xulrunner-stub

echo ""
echo "#######################"
echo "# copying database to new profile"
echo "#######################"
cp ./chrome/content/data/storage.sqlite ~/.anakeen/dynacase-offline-client/*.default/

echo ""
echo "#######################"
echo "# done"
echo "#######################"
#./xulrunner-stub -jsconsole -chromebug
#./xulrunner-stub -jsconsole -inspector
#./xulrunner-stub -jsconsole
