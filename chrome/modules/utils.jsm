
var EXPORTED_SYMBOLS = [ "utils" ];

function Protoutils(config) {

};

Protoutils.prototype = {
	toString : function() {
		return 'utils';
	}
};

Protoutils.prototype.twoDigits = function(n) {
	if (n > 9)
		return n.toString();
	else
		return '0' + n.toString();
};
Protoutils.prototype.toIso8601 = function(now, withoutT) {
	var T='T';
	if (withoutT) T=' ';
	return now.getFullYear() + '-' + this.twoDigits(now.getMonth() + 1) + '-'
			+ this.twoDigits(now.getDate()) + T
			+ this.twoDigits(now.getHours()) + ':'
			+ this.twoDigits(now.getMinutes()) + ':'
			+ this.twoDigits(now.getSeconds());

};

var utils = new Protoutils();