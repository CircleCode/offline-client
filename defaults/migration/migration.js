var migrate = function migrate(from, to) {
    alert("migration from " + from + " to " + to);
    if (to == "1.1.1") {
        alert("please drop your profile and restart application");
        throw "please drop your profile and restart application";
    }
};
