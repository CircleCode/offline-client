
var EXPORTED_SYMBOLS = [ "utils" , "ArgException"];

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
    if (! now) return '';
	var T='T';
	if (withoutT) T=' ';
	return now.getFullYear() + '-' + this.twoDigits(now.getMonth() + 1) + '-'
			+ this.twoDigits(now.getDate()) + T
			+ this.twoDigits(now.getHours()) + ':'
			+ this.twoDigits(now.getMinutes()) + ':'
			+ this.twoDigits(now.getSeconds());

};

/**
 * only date without hours
 * @param Date now
 * @returns {String}
 */
Protoutils.prototype.DateToIso8601 = function(now) {
    return now.getFullYear() + '-' + this.twoDigits(now.getMonth() + 1) + '-'
            + this.twoDigits(now.getDate());

};
var utils = new Protoutils();

