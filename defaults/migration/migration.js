var migrate = function migrate(from, to){
    alert("to "+to);
    if(to == "1.1.1"){
        alert("please drop your profile and restart application");
        throw "please drop your profile and restart application";
    }
};