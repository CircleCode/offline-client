var EXPORTED_SYMBOLS = [ "Fdl" , "JSON" ];

/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/*
    http://www.JSON.org/json2.js
    2008-11-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html

    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the object holding the key.

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint evil: true */

/*global JSON */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    JSON = {};
}
(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z';
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
})();

/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl
 * @singleton
 */

if (typeof window != 'undefined') {
if ((!("console" in window))) {
	window.console = {
		'log' : function(s) {
		}
	};
}; // to debug
}
var Fdl = {
	version : "0.1",
	_isAuthenticate : null,
	_isConnected : null,
	_serverTime : null
};
Fdl._print_r = function(obj, level, maxlevel) {
	if (!obj)
		return '';

	if (!level)
		level = 0;
	if (!maxlevel)
		maxlevel = 1;
	if (typeof obj != 'object')
		return obj.toString();
	if (level > maxlevel)
		return '';
	var slev = '';
	if (!level)
		level = 0;
	for ( var i = 0; i < level; i++)
		slev += '......';
	var names = obj.toString() + "\n";
	if ('splice' in obj && 'join' in obj)
		names = 'Array';
	else if (typeof obj == 'object')
		names = obj.toString();
	else
		names = typeof obj;
	names += "\n";
	for ( var name in obj) {
		try {
			if (typeof obj[name] == 'function')
				names += '';// slev+name +" (function)\n";
			else if (typeof obj[name] == 'object')
				names += slev + name + " -"
						+ Fdl._print_r(obj[name], level + 1, maxlevel) + "\n";
			else
				names += slev + name + " - [" + obj[name] + "]\n";
		} catch (ex) {
			names += name + " - [" + "unreadable" + "]\n";
		}
	}
	return names;
};

Fdl.print_r = function(obj, maxlevel) {
	if (!maxlevel)
		maxlevel = 1;
	var names = Fdl._print_r(obj, 0, maxlevel);
	alert(names);
};
/**
 * to record url to access to freedom server
 * 
 * @hide
 * @deprecated
 */
Fdl.connect = function(config) {
	if (config) {
		if (!this.context)
			this.context = new Object();
		if (config.url) {
			this.context.url = config.url;
			if (this.context.url.substr(-4, 4) == '.php')
				this.context.url += '?';
			else if (this.context.url.substr(-1, 1) != '/')
				this.context.url += '/';
			this.url = this.context.url;
		}
	}
};
Fdl.getCookie = function(c_name) {
	if (document.cookie.length > 0) {
		c_start = document.cookie.indexOf(c_name + "=");
		if (c_start != -1) {
			c_start = c_start + c_name.length + 1;
			c_end = document.cookie.indexOf(";", c_start);
			if (c_end == -1)
				c_end = document.cookie.length;
			return unescape(document.cookie.substring(c_start, c_end));
		}
	}
	return "";
};

/**
 * @param string isodate date to format YYYY-MM-DD HH:MM:SS
 * @param string fmt return format like %d/%m/%Y
 * @return string
 */

Fdl.formatDate = function (isodate, fmt) {
	if (isodate && fmt) {
		var year=isodate.substring(0,4);
		var month=isodate.substring(5,7);
		var day=isodate.substring(8,10);
		var hour=isodate.substring(11,13);
		var minute=isodate.substring(14,16);
		var second=isodate.substring(17,19);

		var r=fmt;
		r=r.replace('%d',day);
		r=r.replace('%m',month);
		r=r.replace('%Y',year);
		r=r.replace('%H',hour);
		r=r.replace('%M',minute);
		r=r.replace('%S',second);
		return r;
	}
	return '';
}
/**
 * @deprecated
 */
Fdl.isAuthenticated = function(config) {
	if (config && config.reset)
		this._isAuthenticate = null;
	if (this._isAuthenticate === null) {
		var userdata = Fdl.retrieveData( {
			app : 'DATA',
			action : 'USER'
		});
		if (userdata) {
			if (userdata.error) {
				Fdl.setErrorMessage(userdata.error);
				this._isAuthenticate = false;
			} else {
				if (!this.user)
					this.user = new Fdl.User( {
						data : userdata
					});
				this._isAuthenticate = true;
			}
		}
	}
	return this._isAuthenticate;
};

/**
 * @deprecated
 */
Fdl.setAuthentification = function(config) {
	if (config) {
		if (!config.login) {
			Fdl.setErrorMessage('login not defined');
			return null;
		}
		if (!config.password) {
			Fdl.setErrorMessage('password not defined');
			return null;
		}
		var userdata = Fdl.retrieveData( {
			app : 'DATA',
			action : 'USER',
			method : 'authent'
		}, config, true);
		if (userdata.error) {
			this._isAuthenticate = false;
			Fdl.setErrorMessage(userdata.error);
			return null;
		} else {
			this._isAuthenticate = true;
			this.user = new Fdl.User( {
				data : userdata
			});
			return this.user;
		}
	}
};
/**
 * @deprecated
 */
Fdl.setErrorMessage = function(msg) {
	if (msg)
		this.lastErrorMessage = msg;
};
/**
 * @deprecated
 */
Fdl.getLastErrorMessage = function() {
	return this.lastErrorMessage;
};
/**
 * @deprecated
 */
Fdl.retrieveData = function(urldata, parameters, anonymousmode) {
	var bsend = '';
	var ANAKEENBOUNDARY = '--------Anakeen www.anakeen.com 2009';
	
	/*
	 * if ((!anonymousmode) && ! Fdl.isAuthenticated()) { alert('not
	 * authenticate'); return null; }
	 */
	var xreq=null;
	if (typeof window != 'undefined') {
		if (window.XMLHttpRequest) {
			xreq = new XMLHttpRequest();
		} else if (window.ActiveXObject) {
			// branch for IE/Windows ActiveX version
			xreq = new ActiveXObject("Microsoft.XMLHTTP");
		}
	} else {
		xreq = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
	}
	var sync = true;

	if (xreq) {
		var url = this.context.url;
		if (!url)
			url = '/';
		if (anonymousmode)
			url += 'guest.php';
		else
			url += 'data.php';
		// url+='?';
		xreq.open("POST", url, (!sync));
		var pvars = true;
		if (!pvars) {
			xreq.setRequestHeader("Content-type",
					"application/x-www-form-urlencoded");
			// xreq.setRequestHeader("Content-Length", "0");
		} else {

			var params = '';
			var ispost = false;
			xreq
					.setRequestHeader("Content-Type",
							"multipart/form-data; boundary=\""
									+ ANAKEENBOUNDARY + "\"");
			for ( var name in urldata) {
				bsend += "\r\n--" + ANAKEENBOUNDARY + "\r\n";
				bsend += "Content-Disposition: form-data; name=\"" + name
						+ "\"\r\n\r\n";
				bsend += urldata[name];
			}
			if (parameters) {
				for ( var name in parameters) {
					bsend += "\r\n--" + ANAKEENBOUNDARY + "\r\n";
					bsend += "Content-Disposition: form-data; name=\"" + name
							+ "\"\r\n\r\n";
					bsend += parameters[name];
				}
			}
		}
		try {
			if (bsend.length == 0)
				xreq.send('');
			else
				xreq.send(bsend);
		} catch (e) {
			Fdl.setErrorMessage('HTTP status: unable to send request');
		}
		if (xreq.status == 200) {
			var r = false;
			try {
				r = eval('(' + xreq.responseText + ')');
				if (r.error)
					Fdl.setErrorMessage(r.error);
			} catch (ex) {
				alert('error on serveur data');
				alert(xreq.responseText);
			}
			return r;
		} else {
			if (xreq)
				Fdl.setErrorMessage('HTTP status:' + xreq.status);
		}
	}
	return false;
};
/**
 * @deprecated
 */
Fdl.isConnected = function(config) {
	if (config && config.reset)
		this._isConnected = null;
	if (this._isConnected === null && (typeof this.context == 'object') && this.context.url) {
		var data = Fdl.retrieveData( {
			app : 'DATA',
			action : 'USER',
			method : 'ping'
		}, config, true);
		this._serverTime = null;
		if (data) {
			if (data.error) {
				Fdl.setErrorMessage(data.error);
				this._isConnected = false;
			} else {
				this._isConnected = true;
				this._serverTime = data.time;
			}
		}
	}
	return this._isConnected;
};

/**
 * @deprecated
 */
Fdl.getUser = function(config) {
	if (config) {
		if (config.reset)
			this.user = null;
	}
	if (!this.user) {
		this.user = new Fdl.User();
	}
	return this.user;
};

// construct an iframe target to send form in background
Fdl.getHiddenTarget = function(config) {
	if (!this._hiddenTarget) {
		this._hiddenTarget = 'fdlhiddeniframe';
		if (!config) {
			if (! document.getElementById(this._hiddenTarget)) {
			var o = document.createElement("div");
			o.innerHTML = '<iframe style="display:none;width:100%" id="'
					+ this._hiddenTarget + '" name="' + this._hiddenTarget
					+ '"></iframe>';
			document.body.appendChild(o);
			}
		}
	}
	return this._hiddenTarget;
};
Fdl._completeSave = function(callid, data) {
	var s = Fdl._getWaitSave(parseInt(callid));
	s.data = data;
	if (s.document) {
		s.document.affect(data);
		s.config.callback.call(null, s.document);
	}
	Fdl._clearWaitSave(parseInt(callid));
};

Fdl._memoWaitSave = [];
Fdl._waitSave = function(me, config) {
	Fdl._memoWaitSave.push( {
		document : me,
		config : config
	});
	return Fdl._memoWaitSave.length - 1;
};
Fdl._getWaitSave = function(callid) {
	return Fdl._memoWaitSave[callid];
};
Fdl._clearWaitSave = function(callid) {
	if (Fdl._memoWaitSave[callid])
		Fdl._memoWaitSave[callid] = null;
};
Fdl.resizeImage = function(icon, width) {
	var u = Fdl.context.url;
	var src = Fdl.context.url + icon;
	var ps = u.lastIndexOf('/');
	if (ps) {
		u = u.substring(0, ps + 1);
		src = u + icon;
	}
	src = u + 'resizeimg.php?size=' + width + '&img=' + escape(src);
	return src;
};

Fdl.getTime = function() {
	var d = new Date();
	var t = d.getTime();
	var i = '--';
	if (this._dtime)
		i = ((t - this._dtime) / 1000).toFixed(3);
	this._dtime = t;
	return i;
};
/**
 * JSON to XML
 * 
 * @param {Object}
 *            JSON
 * @return string the xml string
 */
Fdl.json2xml = function(json, node, childs) {
	var root = false;
	if (!node) {
		node = document.createElement('root');
		root = true;
		childs = [];
	}
	if (json === null) {
		node.appendChild(document.createTextNode(''));
	} else if (typeof json != 'object') {
		node.appendChild(document.createTextNode(json));
	} else {
		var found = false;
		if ((typeof json == 'object')) {
			for ( var i = 0; i < childs.length; i++) {
				if (childs[i] === json) {
					childs[i]['_xmlrecursive'] = true;
					if (childs[i]['_xmlrecursive'] == json['_xmlrecursive']) {
						found = true; // detect really same object
					}
					delete childs[i]['_xmlrecursive'];
				}
			}
			if (!found) {
				childs.push(json);
			}
		}
		if (found) {
			node.appendChild(document.createTextNode('--recursive--'));
		} else {
			for ( var x in json) {
				// ignore inherited properties
				if (json.hasOwnProperty(x)) {
					if ((x == '#text')) { // text
						node.appendChild(document.createTextNode(json[x]));
					} else if (x == '@attributes') { // attributes
						for ( var y in json[x]) {
							if (json[x].hasOwnProperty(y)) {
								node.setAttribute(y, json[x][y]);
							}
						}
					} else if (x == '#comment') { // comment
						// ignore

					} else { // elements
						if ((json[x] instanceof Array) ) { // handle arrays
							for ( var i = 0; i < json[x].length; i++) {
								node
										.appendChild(Fdl
												.json2xml(
														json[x][i],
														document
																.createElement((x == 'link') ? '_xmllink': x),
														childs));
							}
						} else {
							if (x) {
								node
										.appendChild(Fdl
												.json2xml(
														json[x],
														document.createElement((x == 'link') ? '_xmllink': x),
														childs));
							}
						}
					}
				}
			}
		}
	}

	if (root == true) {
		return node.innerHTML.replace(/_xmllink/g, 'link');
	} else {
		return node;
	}

};

/**
 * Convert TEXT to XML DOM document Object
 * 
 * @param {string}
 *            strXML the xml string
 * @return {Object} XML DOM Document
 */
Fdl.text2xml = function(strXML) {
	var xmlDoc = null;
	try {
		xmlDoc = (document.all) ? new ActiveXObject("Microsoft.XMLDOM"): new DOMParser();
		xmlDoc.async = false;
	} catch (e) {
		throw new Error("XML Parser could not be instantiated");
	}
	var out;
	try {
		if (document.all) {
			out = (xmlDoc.loadXML(strXML)) ? xmlDoc : false;
		} else {
			out = xmlDoc.parseFromString(strXML, "text/xml");
		}
	} catch (e) {
		throw new Error("Error parsing XML string");
	}
	return out;
};
/**
 * Convert XML to JSON Object
 * 
 * @param {Object}
 *            XML DOM Document
 */
Fdl.xml2json = function(xml) {
	var obj = {};
	if (!xml)
		return false;
	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
			obj['@attributes'] = {};
			for ( var j = 0; j < xml.attributes.length; j++) {
				obj['@attributes'][xml.attributes[j].nodeName] = xml.attributes[j].nodeValue;
			}
		}

	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		if ((!obj['@attributes']) && (xml.childNodes.length == 1)
				&& (xml.childNodes[0].nodeName == '#text')) {
			obj = xml.childNodes[0].nodeValue;
		} else {
			for ( var i = 0; i < xml.childNodes.length; i++) {
				if (typeof (obj[xml.childNodes[i].nodeName]) == 'undefined') {
					obj[xml.childNodes[i].nodeName] = Fdl
							.xml2json(xml.childNodes[i]);
				} else {
					if (typeof (obj[xml.childNodes[i].nodeName].length) == 'undefined') {
						var old = obj[xml.childNodes[i].nodeName];
						obj[xml.childNodes[i].nodeName] = [];
						obj[xml.childNodes[i].nodeName].push(old);
					}
					obj[xml.childNodes[i].nodeName].push(Fdl
							.xml2json(xml.childNodes[i]));
				}
			}
		}
	}

	return obj;
};
/**
 * clone an object
 * the object must not be recursive
 * @return {Object} the cloned object
 */
Fdl.cloneObject= function(srcInstance) {
	if (typeof(srcInstance) != 'object' || srcInstance == null) {
		return srcInstance;
	}
	/*On appel le constructeur de l'instance source pour crée une nouvelle instance de la même classe*/
	var newInstance = srcInstance.constructor();
	/*On parcourt les propriétés de l'objet et on les recopies dans la nouvelle instance*/
	for(var i in srcInstance) {
		newInstance[i] = Fdl.cloneObject(srcInstance[i]);
	}
	/*On retourne la nouvelle instance*/
	return newInstance;
};

/**
 * transform &,< and > characters into their html equivalents
 * @return {string} the formatted string
 */
Fdl.encodeHtmlTags= function(v) {
    if (v && (typeof v == 'string')) {
        v = v.replace(/\&/g,'&amp;');
        v = v.replace(/\</g,'&lt;');
        v = v.replace(/\>/g,'&gt;');
    } else if (v && (typeof v == 'object')) {
        for (var i=0;i<v.length;i++) {
        	 if (v[i] && (typeof v[i] == 'string')) {
            v[i]=v[i].replace(/\&/g,'&amp;');
            v[i]= v[i].replace(/\</g,'&lt;');
            v[i]= v[i].replace(/\>/g,'&gt;');
        	 }
        }
    }
    return v;
};
	
// ---------------------
// Not prototype
// @deprecated
Fdl.createDocument = function(config) {
	if (config && config.familyId) {
		data = this.context.retrieveData( {
			app : 'DATA',
			action : 'DOCUMENT',
			method : 'create',
			id : config.familyId
		});
		if (data) {
			if (!data.error) {
				var nd;
				if (data.properties.defdoctype == 'D')
					nd = new Fdl.Collection( {
						context : this.context
					});
				else
					nd = new Fdl.Document( {
						context : this.context
					});
				nd.affect(data);
				nd._mvalues.familyid = nd.getProperty('fromid');
				return nd;
			} else {
				this.context.setErrorMessage(data.error);
			}
		}
		return false;
	}
};
/*!
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */
/**
 * @class Fdl.Context The connection context object to access to freedom
 *        documents
 * 
 * <pre><code>
  var C=new Fdl.Context({url:'http://my.freedom/'});
  if (! C.isConnected()) {   
    alert('error connect:'+C.getLastErrorMessage());
    return;
  }
  
  if (! C.isAuthenticated()) {
    var u=C.setAuthentification({login:'admin',password:'anakeen'});
    if (!u)  alert('error authent:'+C.getLastErrorMessage());    
  }
  &lt;core&gt;
 * </pre>
 * @param {Object} config
 * @cfg {String} url the url to reach freedom server 
 * @constructor
 */
Fdl.Context = function(config) {
	if (! config) config={};
	if (config) {
		if (! config.url) this.url = window.location.protocol+'//'+window.location.host+window.location.pathname;
		else this.url = config.url;
		if (this.url.substr(-4, 4) == '.php')
			this.url += '?';
		else if (this.url.substr(-1, 1) != '/')
			this.url += '/';
	}
};
Fdl.Context.prototype = {
		url : '',
		_isConnected : null,
		_isAuthenticated : null,
		_serverTime : null,
		_documents : new Object(), // cache for latest revision document
		_fixDocuments : new Object(),// cache for fix revision document
		notifier : null,
		lastErrorMessage : '',
		lastErrorCode : '',
		/** debug mode @type {boolean} */
		debug : false,
		propertiesInformation:null,
		catalog:null,
		/** translation catalog is autoloaded, set to false if you don't wan't autoload @type {Boolean}*/
		autoLoadCatalog:true, 
		/** default locale 'fr' (french) or 'en' (english) @type {String}*/
		locale:null, 
		/** mapping family's document to special js class @type {Object}*/
		familyMap:null,
		getPropertiesInformation: function() {
	if (! this.propertiesInformation) {
			// not initialised yet i retreive the folder family
			this.getDocument({id:2,useCache:false,onlyValues:false,propertiesInformation:true});			
	}
	return this.propertiesInformation;
}

};



Fdl.Context.prototype.toString = function() {
	return 'Fdl.Context';
};

/**
 * load catalog of translation
 * @param {String} (optional) define an other locale
 * @return {Boolean} true if loaded is done
 */
Fdl.Context.prototype.loadCatalog = function(locale) { 
	if (! locale) locale=this.locale;
	if (!locale) {
		var u=this.getUser();
		if (u.locale) {
			this.locale=u.locale.substr(0,u.locale.indexOf('_'));
			locale=this.locale;
		} else locale='fr';
	}
	var url='locale/'+locale+'/js/catalog.js';
	console.log("load catalog"+url);
	var c=this.retrieveData('', '', true, url);
	if (c) {
		this.catalog=c;
		return true;
	} else this.catalog=false;
	return false;
};
/**
 * get all sortable properties
 * @return {array} of property identificators
 */
Fdl.Context.prototype.getSortableProperties = function() { 
	var f=[];
		var pi=this.getPropertiesInformation();
		for (var i in pi) {
			if (pi[i].sortable) f.push(i);
		}
	
	return f;
};
/**
 * get information about property
 * @param {String} id the property id
 * @return {Object} example : {"type":"integer","displayable":true,"sortable":true,"filterable":true,"label":"identificateur"},
 */
Fdl.Context.prototype.getPropertyInformation = function(id) { 
	var pis=this.getPropertiesInformation();
	
	if (pis) {
		var pi=pis[id];
		if (pi) return pi;
	} 
	return null;
};
/**
  * get all displayable properties
  * @return {array} of property identificators
  */
Fdl.Context.prototype.getDisplayableProperties = function() { 
	var f=[];
	
		var pi=this.getPropertiesInformation();
		for (var i in pi) {
			if (pi[i].displayable) f.push(i);
		}
	
	return f;
};

/**
 * get all filterable properties
 * @return {array} of property identificators
 */
Fdl.Context.prototype.getFilterableProperties = function() { 
	var f=[];
	
		var pi=this.getPropertiesInformation();
		for (var i in pi) {
			if (pi[i].filterable) f.push(i);
		}
	
	return f;
};

/**
 * To reconnect to another freedom server context
 * 
 * @param {object}
 *            config
 *            <p>
 *            <ul>
 *            <li><b>url:</b> String the url to reach freedom server</li>
 *            </ul>
 *            </p>
 * @return {Void}
 */
Fdl.Context.prototype.connect = function(config) {
	if (config) {
		if (config.url) {
			this.url = config.url;
			if (this.url.substr(-4, 4) == '.php')
				this.url += '?';
			else if (this.url.substr(-1, 1) != '/')
				this.url += '/';
		}
	}
};
/**
 * Try to ping server if connection is detected one time return always true
 * 
 * @param {object}
 *            config
 *            <p>
 *            <ul>
 *            <li><b>reset:</b> Boolean (Optional) set to true to force a new
 *            ping
 *            </ul>
 *            </p>
 * @return {Boolean} true if connected
 */
Fdl.Context.prototype.isConnected = function(config) {
	if (typeof config == 'object' && config.reset) this._isConnected = null;
	if (this._isConnected === null && this.url) {
		var data = this.retrieveData( {
			app : 'DATA',
			action : 'USER',
			method : 'ping'
		}, config, true);
		this._serverTime = null;
		if (data) {
			if (data.error) {
				this.setErrorMessage(data.error);
				this._isConnected = false;
			} else {
				this._isConnected = true;
				this._serverTime = data.time;
			}
		}
	}
	return this._isConnected;
};
/**
 * Verify is user is already authenticated
 * 
 * @param {object}
 *            config
 *            <p>
 *            <ul>
 *            <li><b>reset :</b> Boolean set to true to force new detection</li>
 *            </ul>
 *            </p>
 * @return {Boolean} true if authentication succeded
 */
Fdl.Context.prototype.isAuthenticated = function(config) {
	if (config && config.reset) this._isAuthenticated = null;
	if (this._isAuthenticated === null) {
		var userdata = this.retrieveData( {
			app : 'DATA',
			action : 'USER'
		});
		if (userdata) {
			if (userdata.error) {
				this.setErrorMessage(userdata.error);
				this._isAuthenticated = false;
			} else {
				if (!this.user)
					this.user = new Fdl.User( {
						data : userdata,
						context : this
					});
				if (this.autoLoadCatalog) this.loadCatalog();
				this._isAuthenticated = true;
			}
		}
	}
	return this._isAuthenticated;
};

/**
 * Authenticate to server
 * 
 * @param {object}
 *            config
 *            <p>
 *            <ul>
 *            <li><b>login :</b> String the login</li>
 *            <li><b>password :</b> String the password (clear password)</li>
 *            </ul>
 *            </p>
 * @return {Fdl.User} the current user authentication succeded, null if no
 *         succeed.
 */
Fdl.Context.prototype.setAuthentification = function(config) {
	if (config) {
		if (!config.login) {
			this.setErrorMessage(this._("data::login not defined"));
			return null;
		}
		if (!config.password) {
			this.setErrorMessage(this._("data::password not defined"));
			return null;
		}
		var userdata = this.retrieveData( {
			app : 'DATA',
			action : 'USER',
			method : 'authent'
		}, config, true);
		if (userdata.error) {
			this._isAuthenticated = false;
			this.setErrorMessage(userdata.error);
			return null;
		} else {
			this._isAuthenticated = true;
			this.user = new Fdl.User( {
				data : userdata,
				context : this
			});
			if (this.user.locale) this.locale=this.user.locale.substr(0,this.user.locale.indexOf('_'));
			return this.user;
		}
	}
};
/**
 * set error message
 * @param {String} msg the text message 
 * @param {String} code the code message
 * @return boolean
 */
Fdl.Context.prototype.setErrorMessage = function(msg, code) {
	if (msg) {
		this.lastErrorMessage = msg;
	    if (code) this.lastErrorCode = code;
	}
};
/**
 * return last error message
 * @return {String}
 */
Fdl.Context.prototype.getLastErrorMessage = function() {
	return this.lastErrorMessage;
};
/**
 * return translate message
 * @param {String} s the text to translate 
 * @return {String}
 */
Fdl.Context.prototype.getText = function(s) {
	return this._(s);
};
/**
 * return translate message
 * @param {String} s the text to translate 
 * @return {String}
 */
Fdl.Context.prototype._ = function(s) {
	if ((this.catalog===null) && (this.autoLoadCatalog)) this.loadCatalog();
	if (this.catalog && s && this.catalog[s]) return this.catalog[s];
	return s;
};

/**
 * Return user currently connected if already authenticate return always the
 * same object
 * 
 * @param {object}
 *            config
 *            <p>
 *            <ul>
 *            <li><b>reset:</b> Boolean (Optional) set to true to force a new
 *            request to update user information
 *            </ul>
 *            </p>
 * @return {Fdl.User} the user object
 */
Fdl.Context.prototype.getUser = function(config) {
	if (config) {
		if (config.reset)
			this.user = null;
	}
	if (!this.user) {
		this.user = new Fdl.User( {
			context : this
		});			
		if (this.user.locale) this.locale=this.user.locale.substr(0,this.user.locale.indexOf('_'));

	}
	return this.user;
};
Fdl.Context.prototype.resizeImage = function(icon, width) {
	var u = this.url;
	var src = this.url + icon;
	var ps = u.lastIndexOf('/');
	if (ps) {
		u = u.substring(0, ps + 1);
		src = u + icon;
	}
	src = u + 'resizeimg.php?size=' + width + '&img=' + escape(src);
	return src;
};
/**
 * Send a request to the server
 * @param Object urldata object list of key:value : {a:2,app:MYTEST,action:MYACTION}
 * @param Object parameters other parameters to complte urldata
 * @param Boolean anonymousmode 
 * @param String otherroot to call another file in same domain (it is forbidden to call another server domain) 
 * @return Boolean true if ok
 */
Fdl.Context.prototype.retrieveData = function(urldata, parameters,
		anonymousmode, otherroot) {
	var bsend = '';
	var ANAKEENBOUNDARY = '--------Anakeen www.anakeen.com 2009';
	var xreq=null;
	if (typeof window != 'undefined') {
		if (window.XMLHttpRequest) {
			xreq = new XMLHttpRequest();
		} else if (window.ActiveXObject) {
			// branch for IE/Windows ActiveX version
			xreq = new ActiveXObject("Microsoft.XMLHTTP");
		}
	} else {
		xreq = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
	}
	var sync = true;

	if (xreq) {
		var url = this.url;
		if (!url)
			url = '/';
		if (otherroot)
			url += otherroot;
		else if (anonymousmode)
			url += 'guest.php';
		else
			url += 'data.php';
		// url+='?';
		var method = "POST";
		if( (!urldata) && (!parameters) && otherroot ) {
			method = "GET";
		}
		xreq.open(method, url, (!sync));
		if (method) {
			var name=null;
			xreq.setRequestHeader("Content-Type",
							"multipart/form-data; boundary=\""
									+ ANAKEENBOUNDARY + "\"");
			for (name in urldata) {
				bsend += "\r\n--" + ANAKEENBOUNDARY + "\r\n";
				bsend += "Content-Disposition: form-data; name=\"" + name
						+ "\"\r\n\r\n";
				bsend += urldata[name];
			}
			if (parameters) {
				for (name in parameters) {
					if (name != 'context') {
						bsend += "\r\n--" + ANAKEENBOUNDARY + "\r\n";
						bsend += "Content-Disposition: form-data; name=\"" + name
						+ "\"\r\n\r\n";
						if (typeof parameters[name]=='object') {
							try {

								bsend += JSON.stringify(parameters[name]);
							} catch (e){
								bsend += parameters[name];
							}
						} else bsend += parameters[name];
					}
				}
			}
		}
		try {
			if (bsend.length == 0)
				xreq.send('');
			else
				xreq.send(bsend);
		} catch (e) {
			this.setErrorMessage('HTTP status: unable to send request');
		}
		if (xreq.status == 200) {
			var r = false;
			try {
				var db1=new Date().getTime();
				if (parameters && parameters.plainfile) {
					r =  xreq.responseText;
				} else {
				r = eval('(' + xreq.responseText + ')');
				if (this.debug) r["evalDebugTime"]=(new Date().getTime())-db1;
				if (r.error) this.setErrorMessage(r.error);
                if (r.log) {
                	console.log('datalog:',r.log);
                	delete r.log;
                }
				if (r.spentTime)
					console.log( {
						time : r.spentTime
					});
            	    delete r.spentTime;
				}
			} catch (ex) {
				alert('error on serveur data');
				alert(xreq.responseText);
			}
			return r;
		} else {
			if (xreq)
				this.setErrorMessage('HTTP status:' + xreq.status);
		}
	}
	return false;
};

/**
 * Send a request to the server
 * @param Object filepath 
 * @param Object parameters other parameters to complte urldata
 * @param Boolean anonymousmode 
 * @param String otherroot to call another file in same domain (it is forbidden to call another server domain) 
 * @return Boolean true if ok
 */
Fdl.Context.prototype.retrieveFile = function(filepath, parameters) {
	return this.retrieveData(parameters,{plainfile:true},false,filepath);
};
/**
 * Send a form to the server
 * @param Object urldata object list of key:value : {a:2,app:MYTEST,action:MYACTION}
 * @param String target target where send result (can be _hidden to not see the result or if result is a file which will be downloading in your desktop)
 * @param String otherroot to call another file in same domain (it is forbidden to call another server domain) 
 * @return Boolean true if ok
 */
Fdl.Context.prototype.sendForm = function(urldata, target, otherroot) {
	var url = this.url;
	if (!url) url = '/';
	if (otherroot) url += otherroot;
	else url += 'data.php';
	var form=document.getElementById('fdlsendform');
	if (form) document.body.removeChild(form);
	form = document.createElement('form');
	form.setAttribute('action',url);
	form.setAttribute('enctype','multipart/form-data');
	form.setAttribute('id','fdlsendform');
	if (target=='_hidden' ) form.setAttribute('target',Fdl.getHiddenTarget());
	else form.setAttribute('target',target);
	form.setAttribute('method', 'POST');
	form.style.display='none';
	document.body.appendChild(form);
	for ( var name in urldata) {
		var newElement = document.createElement("input");
		newElement.setAttribute('type','hidden');
		newElement.setAttribute('name',name);
		form.appendChild(newElement);
		if (typeof urldata[name]=='object') {
			try {
				newElement.value= JSON.stringify(urldata[name]);
			} catch (e){
				newElement.value = urldata[name];
			} 
		}else newElement.value = urldata[name];
	}
	form.submit();
	return true;
};

/**
 * get a document object
 * 
 * @param {object} config
 *     <p><ul>
 *          <li><b>familyName</b> family name to map</li>
 *          <li><b>className</b> class name to map</li>
 *     </ul></p>
 *     
 * @return {Boolean}
 */
Fdl.Context.prototype.addFamilyMap = function(config) {
	if (config.familyName && config.className) {
		if (this.familyMap == null) this.familyMap={};
		this.familyMap[config.familyName]=config.className;
	}
	return true;
};
Fdl.Context.prototype.stringToFunction = function(str) {
	  var arr = str.split(".");

	  var fn=eval(str);
	  /*
	  if (typeof window != 'undefined') {
		  fn = window;
	  } else {
		  fn=this;
	  }
	  for (var i = 0, len = arr.length; i < len; i++) {
	    fn = fn[arr[i]];
	  }
*/
	  if (typeof fn !== "function") {
	    throw new Error("function not found");
	  }

	  return  fn;
	};

/**
 * get a document object
 * 
 * @param {object}
 *            config
 *            <p>
 *            <ul>
 *            <li><b>id</b> String/Number the document identificator to
 *            retrieve</li>
 *            <li><b>latest</b> Boolean (Optional) the latest revision
 *            (default is true)
 *            <li><b>needWorkflow</b> Boolean (Optional) set to true for
 *            workflow document to retrieve more informations about workflow
 *            (default is false)</li>
 *            <li><b>useCache</b> Boolean (Optional) set to true if you don't
 *            want a explicit new request to the server. In this case you reuse
 *            the latest document retrieved (default is set to false)</li>
 *            <li><b>noCache</b> Boolean (Optional) set to true if you don't
 *           want set the document in cache</li>
 *            <li><b>getUserTags</b> Boolean (Optional) set to true if you want user tags also</li>
 *            <li><b>contentStore</b> Boolean (Optional) set to true if you want also retriev content of o a collection. This is possible only for collection. After get you can retrieve content with method getStoredContent of Fdl.collection</li>
 *            <li><b>contentConfig : </b> {Object}(optional)  Option for content (see Fdl.Collection.getContent() </li>
 *            </ul>
 *            <pre><code>
 		var d = C.getDocument( {
			id : 9,
			contentStore : true,
			contentConfig : {
				slice : 25,
				orderBy : 'title desc'
			}
		});
		if (d.isAlive()) {
			var dl = d.getStoredContent(); // document list object			
			var p = dl.getDocuments();  // array of Fdl.Documents   
 *            </code></pre>
 *            </li>
 *            </ul>
 *            </p>
 *            <code><pre>
 * var C = new Fdl.Context( {
 * 	url : 'http://my.freedom/'
 * });
 * var d = C.getDocument( {
 * 	id : 9
 * });
 * </pre><core>
 * @return {Fdl.Document} One of these classes Fdl.Document, Fdl.Collection, Fdl.Workflow, Fdl.Family return null if document not exist or cannot be readed
 */
Fdl.Context.prototype.getDocument = function(config) {
	if (config)
		config.context = this;
	else
		config = {
			context : this
		};
	var docid = config.id;

	var latest=true;
	if (typeof config == 'object' && config.latest === false) latest=false;
	
	if (docid && (typeof docid == 'object') && (docid.length==1)) {
		docid=docid[0];
		config.id=docid;
	}
	if (typeof docid == 'object') {
		this.setErrorMessage(this._("data:document id must not be an object"));
		return null;
	}
	if ((!docid) && (config.data))
		docid = config.data.properties.id;
	if (config.data && config.data.properties.id && this._documents[docid] && this._documents[docid]._data) {
		// verify revdate
		if (docid && 
				(config.data.requestDate <= this._documents[docid]._data.requestDate)) {
			// use cache if data is oldest cache
			return this._documents[docid];
		}
	} else if (docid) {
		// no data
		if (config.useCache && this._documents[docid])
			return this._documents[docid];
	}
   if (! docid) {
	   this.setErrorMessage(this._("data:document id not set"));
	   return null;
   }
	var wdoc = new Fdl.Document(config);
	
	if (! wdoc._data) return null;
	if (this.familyMap != null && this.familyMap[wdoc.getProperty('fromname')]) {
		var sname=wdoc.getProperty('fromname');
		config.data = wdoc._data;
		
		var sclass=this.stringToFunction(this.familyMap[sname]);
		wdoc = new sclass(config);
	}else if ((wdoc.getProperty('defdoctype') == 'D')
			|| (wdoc.getProperty('defdoctype') == 'S')) {
		config.data = wdoc._data;
		wdoc = new Fdl.Collection(config);
	} else if (wdoc.getProperty('doctype') == 'C') {
		config.data = wdoc._data;
		wdoc = new Fdl.Family(config);
	} else if (wdoc.getProperty('doctype') == 'W') {
		config.data = wdoc._data;
		wdoc = new Fdl.Workflow(config);
	}
	if (config && (! config.noCache)) {
		if (latest) {
			this._documents[wdoc.getProperty('initid')] = wdoc;
			if (wdoc.getProperty('id') != wdoc.getProperty('initid')) {
				this._documents[wdoc.getProperty('id')] = wdoc; // alias cache
			}
			if ((docid!=wdoc.getProperty('id')) && (docid!=wdoc.getProperty('initid'))) {
				this._documents[docid] = wdoc; // other alias cache
			}
		} else {	
			this._fixDocuments[wdoc.getProperty('id')] = wdoc;
		}
	}
	return wdoc;
};

/**
 * get the notifier object after the first call retrun always the same notifier
 * object : one notifier by context
 * 
 * @param {object}
 *            config
 *            <p>
 *            <ul>
 *            <li><b>reset : </b> Boolean (Optional) set to true to return a
 *            new notifier
 *            </ul>
 *            </p>
 * @return {Fdl.Notifier} return the object notifier
 */
Fdl.Context.prototype.getNotifier = function(config) {
	if (config) {
		if (config.reset)
			this.notifier = null;
	}
	if (!this.notifier) {
		if (config)
			config.context = this;
		else
			config = {
				context : this
			};
		this.notifier = new Fdl.Notifier(config);
	}
	return this.notifier;
};
/**
 * get a new search document
 * 
 * @param {object}
 *            config (see
 *            {@link Fdl.SearchDocument configuration of Fdl.SearchDocument } )
 * @return {Fdl.SearchDocument} return the object notifier
 */
Fdl.Context.prototype.getSearchDocument = function(config) {
	if (config)
		config.context = this;
	else
		config = {
			context : this
		};
	return new Fdl.SearchDocument(config);
};

/**
 * get available operators for search criteria by attribute type
 * @return {Object} the operator available by attribute type  
{text:[{operator:'=', label:'equal', operand:['left','right'],labelTpl:'{left} is equal to {right}'},{operator:'~*', label:'include',operand:['left','right'],labelTpl:'{left} is equal to {right}'}],integer:[{operator:'=', label:'equal'},{operator:'>', label:'&gt;'}],...
 */
Fdl.Context.prototype.getSearchCriteria = function() { 
	if (this._opcriteria) return this._opcriteria;
	
	var r= this.retrieveData({app:'DATA',action:'DOCUMENT',
		method:'getsearchcriteria'});
	if (! r.error) {
		this._opcriteria=r.operators;
		return this._opcriteria;
	}
	return null;
};

/**
 * get a groupRequest object
 * 
 * @param {object}
 *            config
 * @return {Fdl.GroupRequest} return the object group request
 */
Fdl.Context.prototype.createGroupRequest = function(config) {
	if (config)
		config.context = this;
	else
		config = {
			context : this
		};
	return new Fdl.GroupRequest(config);
};
/**
 * get home folder of current user
 * 
 * @return {Fdl.Collection} the home folder, null is no home
 */
Fdl.Context.prototype.getHomeFolder = function(config) {
	if (this._homeFolder)
		return this._homeFolder;
	var u = this.getUser();
	if ((u != null) && u.id) {
		var idhome = 'FLDHOME_' + u.id;
		if (! config) config={};
		config.id=idhome;
		var h = this.getDocument(config);
		if (h.isAlive()) {
			this._homeFolder = h;
			return h;
		}
	}
	return null;
};
/**
 * get desktop folder of current user
 * 
 * @return {Fdl.Collection} the home folder, null is no home
 */
Fdl.Context.prototype.getDesktopFolder = function(config) {
	if (this._desktopFolder)
		return this._desktopFolder;
	var u = this.getUser();
	if ((u!=null) && u.id) {
		var idhome = 'FLDDESKTOP_' + u.id;
		if (! config) config={};
		config.id=idhome;
		var h = this.getDocument(config);
		if (h.isAlive()) {
			this._desktopFolder = h;
			return h;
		}
	}
	return null;
};
/**
 * get offline folder of current user
 * 
 * @return {Fdl.Collection} the home folder, null is no home
 */
Fdl.Context.prototype.getOfflineFolder = function(config) {
	if (this._offlineFolder)
		return this._offlineFolder;
	var u = this.getUser();
	if ((u!=null) && u.id) {
		var idhome = 'FLDOFFLINE_' + u.id;
		if (! config) config={};
		config.id=idhome;
		var h = this.getDocument(config);
		if (h.isAlive()) {
			this._offlineFolder = h;
			return h;
		}
	}
	return null;
};
/**
 * get basket folder of current user
 * 
 * @return {Fdl.Collection} the home folder, null is no home
 */
Fdl.Context.prototype.getBasketFolder = function(config) {
	if (this._basketFolder)
		return this._basketFolder;
	var u = this.getUser();
	if ((u!=null) && u.id) {
		var idhome = 'FLDHOME_' + u.id;
		if (! config) config={};
		config.id=idhome;
		var h = this.getDocument(config);
		if (h.isAlive()) {
			this._basketFolder = h;
			return h;
		} else {
			var f=new Fdl.DocumentFilter({family:'DIR strict',  
				criteria:[{operator:'=',
					left:'owner',
					right:'-'+u.id}]});
			var s=this.context.getSearchDocument({filter:f});
			var dl=s.search();
			if (dl && (dl.count>0)) {
				var p=dl.getDocuments();
				this._basketFolder = p[0];
				return this._basketFolder;
			}
		}
	}
	return null;
};
/**
 * create a new object document (not set in database since it is saved)
 * 
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>familyId : </b> The family identificator for the new document</li>
 *            <li><b>temporary : </b> (optional) boolean set to true if want only a working document</li>
 *            </ul>
 * @return {Fdl.Document} a new document
 */
Fdl.Context.prototype.createDocument = function(config) {
	if (config && (config.family || config.familyId)) {
		var data = this.retrieveData( {
			app : 'DATA',
			action : 'DOCUMENT',
			method : 'create',
			id : (config.family)?config.family:config.familyId,
			temporary:config.temporary
		});
		if (data) {
			if (!data.error) {
				var nd;
				if ((data.properties.defdoctype == 'D') || (data.properties.defdoctype == 'S'))
					nd = new Fdl.Collection( {
						context : this
					});
				else
					nd = new Fdl.Document( {
						context : this
					});
				nd.affect(data);
				nd._mvalues.family = nd.getProperty('fromid');
				return nd;
			} else {
				this.setErrorMessage(data.error);
			}
		}
		return null;
	}
};


/**
 * get application object
 * 
 * @param {object} config
 * <ul>
 * <li><b>name : </b> (String) the application name</li>
 * </ul>
 * @return {Fdl.Application} return the application if exist else return null
 */
Fdl.Context.prototype.getApplication = function(config) {
	if (config) config.context = this;
	else config = {context : this};
	
	var a= new Fdl.Application(config);
	if (! a.id ) return null;
	return a;
};
/**
 * 
 * @param config .id the param identificator
 * <ul><li><b>id : </b>the param identificator</li>
 * </ul>
 * @return {string} the value of parameter
 */
Fdl.Context.prototype.getParameter = function (config) {
    if (config) {
      if (config.id) {
	if (! this.application) this.application=new Fdl.Application({context:this,name:'CORE'});
	return this.application.getParameter(config);
      }
    }
  };
/**
 * 
 * @param config .id the param identificator
 * <ul><li><b>id : </b>the param identificator</li>
 *     <li><b>value : </b>the value</li>
 * </ul>
 * @return {string} the value of parameter
 */
  Fdl.Context.prototype.setParameter = function (config) {
    if (config) {
      if (config.id) {
	if (! this.application) this.application=new Fdl.Application({context:this,name:'CORE'});
	return this.application.setParameter(config);
      }
    }
  };
/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.Notifier 
 * this class can be use to notify javascript object of freedom activity
 * <pre><code>
var C=new Fdl.Context({url:'http://my.freedom/'});
var d=C.getDocument({id:9});
d.fireEvent=function (code,args) {
      alert("fireevent"+code+args);
}

var n=C.getNotifier();
n.loop(); 
var x=n.subscribe(d);
 // or var x=n.subscribe({object:d,callback:'fireEvent'});
 * </core></pre>
 * @namespace Fdl.Notifier
 * @param {Object} config
 * @cfg {Fdl.Context} context the connection {@link Fdl.Context context}
 */
Fdl.Notifier = function (config) {
    if (config) {
	this.context=config.context;
    }
};
Fdl.Notifier.prototype = {
    lastRetrieveTime:null,
    nextDelay:30,
   /**
     * Connection context
     * @type Fdl.Context
     * @property
     */
    context:null,
   /**
     * Array of object's subscriptions
     * @type Array
     * @property
     */
    subscribeItems:[]
    
};
Fdl.Notifier.prototype.toString= function() {
      return 'Fdl.Notifier';
};
/**
 * subscribe an object to be prevent when notification
 * @param {object} config
 * <ul><li><b>object : </b> the javascript object </li>
 * <li><b>callback</b> the method to call when detect new notification (fireEvent by default)</li>
 * </ul>
 * The object to prevent when notification is detected. By default call the fireEvent method of object with two arguments : the event name end the event argument
 * <pre><code>
var C=new Fdl.Context({url:'http://my.freedom/'});
var d=C.getDocument({id:9});
d.fireEvent=function (code,args) {
      alert("fireevent"+code+args);
}

var n=C.getNotifier();
var x=n.subscribe(d);
 // or var x=n.subscribe({object:d,callback:'fireEvent'});
 * </core></pre>
 * @return {Boolean}
 */
Fdl.Notifier.prototype.subscribe = function(obj) {
    var sobj=obj;
    var scall='fireEvent';
       
    if (obj && obj.object) {
	sobj=obj.object;
	if (! obj.callback) {
	    if (obj.object.fireEvent) obj.callback='fireEvent';
	    else return false;
	} else {
	    scall=obj.callback;
	}
	for (var i=0;i<this.subscribeItems.length;i++) {
	    if (this.subscribeItems[i].object==obj.object) return false;
	}	
	this.subscribeItems.push({object:sobj,callback:scall});
	return true;
    }
    return null;
};
/**
 * unsubscribe an object to be prevent when notification
 * @param {object} sobj object to unsubscribe
 * <pre><code>
var C=new Fdl.Context({url:'http://my.freedom/'});
var d=C.getDocument({id:9});
var n=C.getNotifier();
var x=n.unsubscribe(d);
 * </core></pre>
 * @return {Boolean}
 */
Fdl.Notifier.prototype.unsubscribe = function(sobj) {
    if (sobj) {
	for (var i=0;i<this.subscribeItems.length;i++) {
	    if (this.subscribeItems[i].object==sobj) {
		if (this.subscribeItems.length==1) {
		    this.subscribeItems=[];
		} else {
		    if (i < (this.subscribeItems.length-1)) this.subscribeItems[i]=this.subscribeItems[this.subscribeItems.length-1];
		    this.subscribeItems.pop();
		}
		return true;
	    }
	}
    }
    return false;
};


/**
 * retrieve new {@link Fdl.Notifier.Notification notifications} since last retrievement
 * 
 * @return {Array} the Fdl.Notifier.Notification array 
 */
Fdl.Notifier.prototype.retreive = function(config) {
    if (this.context) {
	var r=this.context.retrieveData({date:this.lastRetrieveTime},null,false,'notifier.php');
	if (r.error) {
	    this.context.setErrorMessage(r.error);
	    return null;
	} else {
	    if (r.date) this.lastRetrieveTime=r.date;
	    if (r.delay) this.nextDelay=r.delay;
	    if (r.notifications) return r.notifications;
	}
    }
    return [];
};

/**
 * launch notify polling loop
 * the delay between two polls is done by the server
 * <pre><code>
var C=new Fdl.Context({url:'http://my.freedom/'});
var n=C.getNotifier();
n.loop();
 * </core></pre>
 * @return {Boolean} true if loop is launched
 */
Fdl.Notifier.prototype.loop = function(config) {
	if (this.context) {
		if ((! this.activated) || (config && config.auto)) {
			var r=this.retreive();
			if (r && r.length) {
				for (var i=0;i<r.length;i++) {
					for (var j=0;j<this.subscribeItems.length;j++) {
						try {
							this.subscribeItems[j].object[this.subscribeItems[j].callback](r[i].code,r[i]);
						} catch(exception) {
							//alert(exception);
						}
					}
				}
			}
			var me=this;
			this.activated=true;
			window.setTimeout(function () {me.loop({auto:true});},this.nextDelay*1000);
			return true;
		}
	}
	return false;
};


/**
 * @class Fdl.Notifier.Notification
 * @namespace Fdl.Notifier
 * @param {Object} config
 */
Fdl.Notifier.Notification = function (config) {
    
};
Fdl.Notifier.Notification.prototype = {
   /**
     * Event code
     * the system codes are  
     * <ul>
<li><b>create : </b> When a new document is created</li>
<li><b>changed : </b> when document is modified</li>
<li><b>unlock : </b> when document is unlocked</li>
<li><b>lock : </b>when document is locked</li>
<li><b>delete : </b>when document is deleted</li>
<li><b>revive : </b>when document is undeleted</li>
<li><b>clearcontent : </b>when the containt of folder is cleared</li>
<li><b>addcontent : </b>when document is inserted in a folder</li>
<li><b>delcontent : </b>when document is unlinked from a folder</li>
<li><b>allocate : </b>when new allocation is set</li>
<li><b>unallocate : </b>when allocation is removed</li>
<li><b>attachtimer : </b>when a new timer is attached</li>
<li><b>unattachtimer : </b>when a timer is unattached</li>
<li><b>revision : </b>when document is revised</li>
     *</ul>
     * @type String
     * @property
     */
    code:null,
   /**
     * Argument of the notification
     * @type Object
     * @property
     */
    arg:null,
   /**
     * Date of the notification
     * @type Date
     * @property
     */
    date:null,
   /**
     * Identificator of notified document 
     * @type Number
     * @property
     */
    id:null,
    /**
     * Initial identificator of notified document 
     * @type Number
     * @property
     */
    initid:null,
    /**
     * Title of notified document 
     * @type Date
     * @property
     */
    title:null,
   /**
     * Level of notification
     * @type Number
     * @property
     */
    level:null,
   /**
     * User identificator which produce notification
     * @type Number
     * @property
     */
    uid:null,
   /**
     * User name which produce notification
     * @type String
     * @property
     */
    uname:null    
};

/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.Document
 * The document object
 * <pre><code>
var C=new Fdl.Context({url:'http://my.freedom/'});
  
var d=C.getDocument({id:9});
if (d && d.isAlive()) {
    alert(d.getTitle());
}
 * </code></pre>
 * @namespace Fdl.Document
 * @param {Object} config
 * @cfg {String/Number} id document identificator. Could be a logical identificator (a string) or a system identificator (a number)
 * @cfg {Boolean} latest (Optional)  set to false if you don't want the latest revision but the exact revision given by id
 * @cfg {Number} revision (Optional) retrieve a specific revision of the document. 0 is the first. 
 * @cfg {Object} data (Optional) initialize document object from raw data (internal use)
 */

Fdl.Document = function(config){
    if (config) {
	var data=null;
	if (config.context) {
		this.context=config.context;
	}
	if (! config.data) {
	    this.id = config.id;
	    
	    this.latest = (config.latest == null) ? false : config.latest;
	    this.revision = (this.latest == true) ? null : config.revision;	
	    
	    this._data=null;
	    if (this.id)  data=this.context.retrieveData({app:'DATA',action:'DOCUMENT'},config);
	} else data=config.data;
	if (data) this.affect(data);  else return false;
    }
};


Fdl.Document.prototype = {
    id: null,
    latest: null,
    revision: null,
    context:Fdl,
    followingStates:null,
    _mvalues:new Object(),
    _attributes:null,
    /**
     * Initialize object with raw data
     * @param {Object} data row data
     * @return {Boolean} return true if no errors
     */ 
    affect: function (data) {
	if (data && (typeof data == 'object')) {
	    if (! data.error) {	  
		this._mvalues=new Object();
		this._data=data;
		//	      this._properties=data.properties;
		if (data.properties) {
		    this.id=data.properties.id;
		    if (data.properties.informations) this.context.propertiesInformation=data.properties.informations;
		    //this._values=data.values;
		    if (data.attributes) this.completeAttributes(data.attributes);
		    if (data.followingStates) this.followingStates=data.followingStates;
		    if (data.userTags) this.userTags=data.userTags;
		    return true;
		} else {
		    alert('error no properties');
		}
	    } else {
		this.context.setErrorMessage(data.error);
		return false;
	    }
	}
	return false;
    },
    toString: function() {
	return 'Fdl.Document';
    },
    /**
     * Return the title of the document
     * @return {String} the title
     */ 
    getTitle: function(otherid){
	if (! this._data) return null;
	if (otherid) {
	    
	    return "search "+otherid;
	} else {
	    return this._data.properties.title;
	}
    },	
    /**
     * Get url to the file icon of the document
     * @param {Number} width the width of icon in pixel
     * @return {String} return the url
     */ 
    getIcon: function(config) {
	if (! this._data) return null;
	var width=false;
	var src=this.context.url+this._data.properties.icon;
	if (config && config.width)  {
	    width=config.width;
	    var u=this.context.url;
	    var ps=u.lastIndexOf('/');
	    if (ps) {
		u=u.substring(0,ps+1);
		src=u+this._data.properties.icon;
	    }
	    src=u+'resizeimg.php?size='+width+'&img='+escape(src);
	}
	return src;
    },	
    /**
     * Get state of document 
     * @return {String} return the state key
     */ 
    getState: function(){
	return this._data.properties.state;
    }, 
    /**
     * Get label state of document 
     * @return {String} return the state key
     */ 
    getLocalisedState: function(){
	return this._data.properties.labelstate;
    },
    /**
     * Get associated color of the current state
     * @return {String} return RGB color (#RRGGBB)
     */ 
    getColorState: function(){
	return this._data.properties.colorstate;
    },
    /**
     * Get current activity of the document
     * @return {String} return description of activity
     */
    getActivityState: function(){
	return this._data.properties.activitystate;
    },
    /**
     * Get value of a attribute
     * @param {String} id the attribute identificator
     * @return {Any} return value of document
     */
    getValue: function(id, def) {
    	var v=this._data.values[id];
    	return ((v==null)?def:v);
    }, 
   
    /**
     * return all values of the array
     * @param {String} id the attribute identificator
     * @return {Object} array Rows composed of columns (attributes) values
     */
    getArrayValues: function(id) {
    	var oa=this.getAttribute(id);
    	var rv=[];
    	if (oa) {
    		var oas=oa.getElements();
    		var vc;

    		if (oas.length > 0 && this.getValue(oas[0].id).length > 0) {
    			// first find max rows
    			var i=0;
    			for ( i=0;i<this.getValue(oas[0].id).length;i++) {
    				rv[i]=new Object();
    			}
    			for ( i=0; i< oas.length; i++) {
    				vc=this.getValue(oas[i].id);
    				for (var ic=0;ic<vc.length;ic++) {	    
    					rv[ic][oas[i].id]=vc[ic];
    				}
    			}
    		}
    	}
    	return rv;

    }, 
    /**
     * Get formated value of a attribute
     * For relation attributes return document title, for enumerate return label
     * @param {String} id the attribute identificator
     * @return {Any} return value of document
     */
    getDisplayValue: function(id,config) {
    	var oa=this.getAttribute(id);
    	var i=0,vs=null,tv=[];
    	if (oa) {
    		if (oa.toString() == 'Fdl.RelationAttribute') return Fdl.encodeHtmlTags(this.getValue(id+'_title',this._data.values[id]));
    		if (oa.toString() == 'Fdl.ThesaurusAttribute') return Fdl.encodeHtmlTags(this.getValue(id+'_title',this._data.values[id]));
    		if (oa.toString() == 'Fdl.EnumAttribute') {
    			if (oa.inArray() || oa.isMultiple()) {
    				 tv=[];
    				 vs=this._data.values[id];
    				if (vs) {
    				for (i=0;i<vs.length;i++) {   
    					tv.push(oa.getEnumLabel({key:vs[i]}));
    				}
    				}
    				return tv;
    			} else {
    			return oa.getEnumLabel({key:this._data.values[id]});
    			}
    		}
    		if (oa.toString() == 'Fdl.FileAttribute') {
    			if (oa.inArray()) {
    				 tv=[];
    				 vs=this._data.values[id];
    				if (vs) {
    				for (i=0;i<vs.length;i++) {   					
    					if (config && config.url) {
    						if (config.dav) {
        						tv.push(oa.getDavUrl(vs[i],this.id));
    						} else {
    						config.index=i;
    						tv.push(oa.getUrl(vs,this.id,config));
    						}
    					} else tv.push(Fdl.encodeHtmlTags(oa.getFileName(vs[i])));
    				}
    				}
    				return tv;
    			} else {
    			if (config && config.url) {
    				if (config.dav) return oa.getDavUrl(this._data.values[id],this.id);
    				else return oa.getUrl(this._data.values[id],this.id,config);
    			} else return Fdl.encodeHtmlTags(oa.getFileName(this._data.values[id]));
    			}
    		}
    		if (oa.toString() == 'Fdl.DateAttribute') {
    			var fmt=this.context.getUser().getLocaleFormat();
    			var dateFmt='';
    			if (oa.type=='date') {
    				dateFmt=fmt.dateFormat;
    			} else if (oa.type=='timestamp') {
    				dateFmt=fmt.dateTimeFormat;
    			}  else if (oa.type=='time') {
    				dateFmt=fmt.timeFormat;
    			}  
    			if (dateFmt) {
    				return Fdl.formatDate(this._data.values[id],dateFmt);
    			} 
    			
    		}
    	}
    	return Fdl.encodeHtmlTags(this._data.values[id]);
    },
    
    /**
     * set value to an attribute
     * the document is not updated in database server until it will saved
     * @param {string } id the attribute identificator 
     * @param {String} value the new value to set
     * @return {boolean} true if set succeed
     */
    setValue: function(id,value) {
    	var oa=this.getAttribute(id);
    	if (! oa)  {
    		this.context.setErrorMessage('setValue: attribute '+id+' not exist');
    		return null;
    	}
    	if (this.getProperty('locked')==-1) {
    		this.context.setErrorMessage(this.context._("setValue: document is fixed"));
    		return null;
    	}
    	if (value != this._data.values[oa.id]) {      	
    		this._data.values[oa.id]=value;
    		this._mvalues[oa.id]=value;
    	}
    	return true;
    },
    /**
     * Modify the logical identificator of a document
     * the document is not updated in database server until it will saved
     * @param {string} name the new identificator
     * @return {boolean} true if succeed
     */
    setLogicalIdentificator: function(name) {
    	this._data.properties['name']=name;
    	this._mvalues['name']=name;
    	return true;
    },
    /**
     * Verify if an attribute value has changed by a setValue
     * not verify from database
     * @return {boolean} true if changed
     */
    hasChanged: function() {
    	if (typeof this._mvalues === 'object') {
    		for (i in this._mvalues) {
    			v = this._mvalues[i];
    			if (v !== undefined && typeof v !== 'function') {
    				return true;
    			}
    		}
    	}
	return false;
    },
    /**
     * Return value of a property of the document
     * @param {String} id property identificator can be one of
     * <ul><li>id</li><li>owner</li><li>title</li><li>revision</li><li>version</li><li>initid</li><li>fromid</li><li>doctype</li><li>locked</li><li>allocated</li><li>icon</li><li>lmodify</li><li>profid</li><li>usefor</li><li>cdate</li><li>adate</li><li>revdate</li><li>comment</li><li>classname</li><li>state</li><li>wid</li><li>postitid</li><li>forumid</li><li>cvid</li><li>name</li><li>dprofid</li><li>atags</li><li>prelid</li><li>confidential</li><li>ldapdn</li></ul>
     * @return {String} return the value
     */
    getProperty: function(id) {
    	if (! this._data) return null;
    	return this._data.properties[id];
    },
    /**
     * Return all properties of the document
     * @return {Object} return all properties {id:9, initid:9, locked:0,...}
     */
    getProperties: function(id) {
    	if (! this._data) return null;
    	return this._data.properties;
    },

    /**
     * return all attrtibutes values 
     * @return {Object} indexed array [{key:value},{key:value}....]
     */
    getValues: function() {
    	if (! this._data) return null;
    	return this._data.values;
    },
    /**
     * get attribute definition
     * @param {string} id the attribute identificator
     * @return {Fdl.Attribute}
     */
    getAttribute: function(id) {
    	if (! this._attributes) this.getFamilyAttributes();
    	if (! this._attributes) return null;
    	if (typeof this._attributes == 'object' && this._attributes[id]) return this._attributes[id];
    	return null;
    },
    /**
     * Return all attributes definition of the document
     * @return {Array} return all attribute Fdl.Attribut definition
     */
    getAttributes: function() {
    	if (! this._attributes) {
    		return this.getFamilyAttributes();
    	}
	return this._attributes;
    },	   
    /**
     * Return all attributes definition of the document
     * @return {Array} return all attribute Fdl.Attribut definition
     */
    getFamilyAttributes: function() {
    	if (! this._attributes) {
    		// retrieve attributes from family
    		var f=this.context.getDocument({id:(this.getProperty('doctype')=='C'?this.getProperty('id'):this.getProperty('fromid')),useCache:true,onlyValues:false,propertiesInformation:(this.context.propertiesInformation==null)});
    		if (f && f._attributes) this._attributes=f._attributes;
    		else if (f && (! f._attributes)) {
    			f=this.context.getDocument({id:(this.getProperty('doctype')=='C'?this.getProperty('id'):this.getProperty('fromid')),useCache:false,onlyValues:false,propertiesInformation:(this.context.propertiesInformation==null)});
    			if (f && f._attributes) this._attributes=f._attributes;
    		} else {
    			// family not found
    			this._attributes=[];
    		}
    	}
	  return this._attributes;
    },	
    /**
     * Return all attributes of the document which can be sorted
     * @return {Array} return all attribute Fdl.Attribut definition
     */
    getSortableAttributes: function() {
	var s=[];
	if (! this._attributes) this.getFamilyAttributes();
	if (this._attributes) {
	    for (var i in this._attributes) {
		if (this._attributes[i].isSortable())
		    s.push(this._attributes[i]);
	    }
	}
	return s;
    },	
    /**
     * Return all attributes of the document which can be filtered or searchable
     * @return {Array} return all attribute Fdl.Attribut definition
     */
    getFilterableAttributes: function() {
	var s=[];

	if (! this._attributes) this.getFamilyAttributes();
	if (this._attributes) {
	    for (var i in this._attributes) {
		if (this._attributes[i].isLeaf() &&
		    (this._attributes[i].type != 'htmltext') &&
		    (this._attributes[i].type != 'color') )
		    s.push(this._attributes[i]);
	    }
	}
	return s;
    },	
    /**
     * verify if document exist and it is not in the trash
     * @return {Boolean} return true if exists
     */
    isAlive: function() {
    	return this._data && this._data.properties && (this._data.properties.id > 0) && (this._data.properties.doctype != 'Z');
    },
    /**
     * verify if current user can edit document
     * @return {Boolean} return true if can
     */
    canEdit: function() {
    	return (this.getProperty('readonly')==false);
    },
    /**
     * verify if document is controlled by a workflow
     * @return {Boolean} return true if is controlled by a workflow
     */
    hasWorkflow: function() {
    	return (this.getProperty('wid') > 0);
    },
    /**
     * verify if document is in the trash
     * @return {Boolean} return true if in the trash
     */
    isDeleted: function() {
    	return (this.getProperty('doctype') == 'Z');
    },
    /**
     * verify if document is a fixed revision. It cannot be modified
     * @return {Boolean} return true if fixed
     */
    isFixed: function() {
    	return (this.getProperty('locked') == -1);
    },
    /**
     * verify if document is a collection (see {@link Fdl.Collection method isFolder(), isSearch()} )
     * @return {Boolean} return true if it is a collection (folder or search)
     */
    isCollection: function() {
    	var dt=this.getProperty('defdoctype');
    	return ((dt =='S')||(dt=='D'));
    }
    

};




Fdl.Document.prototype.completeAttributes = function(attrs) {
	if (attrs) {
		this._attributes=new Object();
		for (var name in attrs) {
			switch (attrs[name].type) {
			case 'text':
			case 'longtext':
			case 'htmltext':
				this._attributes[attrs[name].id]=new Fdl.TextAttribute(attrs[name]);
				break;
			case 'int':
			case 'double':
			case 'float':
			case 'money':
				this._attributes[attrs[name].id]=new Fdl.NumericAttribute(attrs[name]);
				break;
			case 'date':
			case 'time':
			case 'timestamp':
				this._attributes[attrs[name].id]=new Fdl.DateAttribute(attrs[name]);
				break;
			case 'docid':
				this._attributes[attrs[name].id]=new Fdl.RelationAttribute(attrs[name]);
				break;
			case 'color':
				this._attributes[attrs[name].id]=new Fdl.ColorAttribute(attrs[name]);
				break;
			case 'enum':
				this._attributes[attrs[name].id]=new Fdl.EnumAttribute(attrs[name]);
				break;
			case 'thesaurus':
				this._attributes[attrs[name].id]=new Fdl.ThesaurusAttribute(attrs[name]);
				break;
			case 'file':
			case 'image':
				this._attributes[attrs[name].id]=new Fdl.FileAttribute(attrs[name]);
				break;
			case 'tab':
				this._attributes[attrs[name].id]=new Fdl.TabAttribute(attrs[name]);
				break;
			case 'frame':
				this._attributes[attrs[name].id]=new Fdl.FrameAttribute(attrs[name]);
				break;
			case 'array':
				this._attributes[attrs[name].id]=new Fdl.ArrayAttribute(attrs[name]);
				break;
			case 'menu':
			case 'action':
				this._attributes[attrs[name].id]=new Fdl.MenuAttribute(attrs[name]);
				break;
			default:
				this._attributes[attrs[name].id]=new Fdl.Attribute(attrs[name]);
			}
			this._attributes[attrs[name].id]._family=this;
		}

	}
};
/**
 * convert document object to json string
 * @return {String} return document to json
 */
Fdl.Document.prototype.toJSON = function(key) {
    return JSON.parse(JSON.stringify(this._data));
    
};

Fdl.Document.prototype.send = function(config){
	
	var result = this.context.retrieveData({
		app: 'DATA',
		action: 'DOCUMENT',
		id: this.id,
		method: 'send'
	},config);
	
	if(result){
		return true;
	} else {
		this.context.setErrorMessage('send : no result');
		return false ;
	}
	
	
};

/**
 * save document to server
 * the document must be modified by setValue before
 * @return {Boolean} true if saved is done. If false error can be retrieve with getLastErrorMessage()
 */
Fdl.Document.prototype.save = function(config) {
	if (this.getProperty('locked')==-1) {
		this.context.setErrorMessage(this.context._("save : document is fixed"));
		return false;
	}
    if (config && config.form) {
	return this.savefromform(config);
    } else {
	var autounlock=false;
	if (config && config.autounlock) autounlock=true;
	if (!this.hasChanged()) return true; // nothing to save
	var newdata=this.context.retrieveData({app:'DATA',action:'DOCUMENT',
				      method:'save',
				      temporary:this.getProperty('doctype')=='T',
				      id:this.id,autounlock:autounlock},this._mvalues);
	
	if (newdata) {
	    if (! newdata.error) {
		this.affect(newdata);
		return true;
	    } else {	
		this.context.setErrorMessage(newdata.error);
	    }
	} else {      
	    this.context.setErrorMessage('save : no data');
	}
	return false;    
    }
};

/**
 * save document to server from a HTML form useful for file upload
 * inputs of document mult named with attribute ids
 * <pre>
&lt;form id="myform"
       method="POST" ENCTYPE="multipart/form-data" &gt;    
&lt;label for="i_ba_dec"&gt;ba _desc&lt;/label&gt;&lt;input id="i_ba_desc" type="text" name="ba_desc"/&gt;
&lt;label for="i_fi_ofile"&gt;File&lt;/label&gt;&lt;input id="i_fi_ofile" type="file" name="fi_ofile[1]"/&gt;
&lt;label for="i_fi_subject"&gt;Subject&lt;/label&gt;&lt;input id="i_fi_subject" type="text" name="fi_subject"/&gt;
&lt;/form&gt;
 * </pre>
 * <pre><code>
 var doc=context.getDocument({id:6790});
 if (! doc.save({form:document.getElementById('myform'),callback:mycallback })) {    
    var t='ERROR:'+Fdl.getLastErrorMessage();
    alert(t);
  }
  
function mycallback(doc) {
  // I am after saved
  alert(doc.getValue('ba_desc'));
}

 * </code><pre>
 * @return {Boolean} true if saved is done. If false error can be retrieve with getLastErrorMessage()
 */
Fdl.Document.prototype.savefromform = function(config) {
	if (config && config.form!==null) {
		if (config.form.nodeName != 'FORM' && config.form.nodeName != 'html:form') {	  
			this.context.setErrorMessage('not a form object');
			return false;
		}
		var f=config.form;
		var oriaction=f.action;
		var oritarget=f.target;
		var t=null;
		if (oritarget) t=document.getElementById(f.target);

		if (t && t.contentDocument.body.firstChild) {
			t.contentDocument.body.innerHTML='';	  
		}
		var callid=Fdl._waitSave(this, config);
		f.action=this.context.url+'?app=DATA&action=DOCUMENT&method=saveform&id='+this.id+'&callid='+callid;
		if (config.autounlock) f.action += '&autounlock=true';

		f.target=Fdl.getHiddenTarget();
		f.submit();
		if (t && t.contentDocument.body.firstChild) {
			try {
				var v=eval('('+t.contentDocument.body.innerHTML+')');	  
				//	  Fdl.print_r(v);
			} catch (ex) {
			}
		}
		//	if (t.contentDocument.body.firstChild) alert(t.contentDocument.body.firstChild.innerHTML);

		//	console.log(document.getElementById(f.target));
		f.action=oriaction;
		f.target=oritarget;
		return true;
	}
	return false;
};




/**
 * reload document from server
 * a reload cannot be done if current changed are not saved
 * @return {Boolean} true if saved is done. If false error can be retrieve with getLastErrorMessage()
 */
Fdl.Document.prototype.reload = function(config) {
	if (this.hasChanged()) {
		this.context.setErrorMessage('reload : cannot reload because data are locally modified');
	} else {
		if (! config) config=new Object();
		config.method='reload';
		return this.callMethod(config);	
	}
	return false;    
}; 

/**
 * set new state to document
 * @param {Object} config
 * <ul><li><b>state : </b> the new state</li>
 * </ul>
 * @return {Boolean} true if saved is done. If false error can be retrieve with getLastErrorMessage()
 */
Fdl.Document.prototype.changeState = function(config) {
	if (! config) config=new Object();
	config.method='changestate';
	return this.callMethod(config);
}; 

/**
 * add user tag to document
 * @param {Object} config
 * <ul><li><b>tag : </b> the key tag</li>
 * <li><b>comment : </b> the comment</li>
 * </ul>
 * @return {Boolean} true if saved is done. If false error can be retrieve with getLastErrorMessage()
 */
Fdl.Document.prototype.addUserTag = function(config) {
	if (! config) config=new Object();
	config.method='addusertag';
	if (! config.tag){
		this.context.setErrorMessage(this.context._("data::no tag specified"));
		return null;
	}  
	return this.callMethod(config);
}; 
/**
 * delete user tag to document
 * @param {Object} config
 * <ul><li><b>tag : </b> the key tag</li>
 * </ul>
 * @return {Boolean} true if deletion is done. If false error can be retrieve with getLastErrorMessage()
 */
Fdl.Document.prototype.deleteUserTag = function(config) {
	if (! config) config=new Object();
	config.method='deleteusertag';
	if (! config.tag){
		this.context.setErrorMessage(this.context._("data::no tag specified"));
		return null;
	}  
	return this.callMethod(config);
}; 
/**
 * get user tags from document
 * @param {Object} config
 * <ul><li><b>reset : </b> (boolean) force ask to the server if already set</li>
 * </ul>
 * @return {Object} return key,value list of tags . If null error can be retrieve with getLastErrorMessage()
 */
Fdl.Document.prototype.getUserTags = function(config) {
	if (! config) config=new Object();
	config.method='getusertags';
	if (this.userTags && (!config.reset)) return this.userTags;

	var r=this.callMethod(config);
	if (! r.error) {
		this.userTags=r.userTags;
		return r.userTags;
	}
	return null;
}; 
/**
 * affect a user to the document
 * @param {Object} config
 * <ul><li><b> userSystemId: </b>  (integer) the user identificator</li>
 * <li><b>comment : </b> (text) describe why it is affected</li>
 * <li><b>lock : </b> (boolean) auto lock for the user</li>
 * <li><b>revision : </b> (boolean) auto revision for the user</li>
 * </ul>
 * @return {Boolean} true if allocation is done. If false error can be retrieve with getLastErrorMessage()
 */
Fdl.Document.prototype.allocate = function(config) {
	if (! config) config=new Object();
	config.method='allocate';
	return this.callMethod(config);
}; 
/**
 * unaffect user to the document. The document has not allocated user after
 * @param {Object} config
 * <li><b>comment : </b> (text) describe why it is unaffected</li>
 * <li><b>revision : </b> (boolean) auto revision for the user</li>
 * </ul>
 * @return {Boolean} true if desallocation is done. If false error can be retrieve with getLastErrorMessage()
 */
Fdl.Document.prototype.unallocate = function(config) {
	if (! config) config=new Object();
	config.method='unallocate';
	return this.callMethod(config);
}; 

/**
 * set document to the trash
 * a remove cannot be done if current changed are not saved
 * @return {Boolean} true if removed is done. If false error can be retrieve with getLastErrorMessage()
 */
Fdl.Document.prototype.remove = function(config) {
	if (this.hasChanged()) {
		this.context.setErrorMessage('remove : cannot remove because data are locally modified');
	} else {
		if (! config) config=new Object();
		config.method='delete';
		return this.callMethod(config);
	}
	return false;    
}; 

/**
 * go out document from the trash
 * a restore cannot be done if current changed are not saved
 * @return {Boolean} true if removed is done. If false error can be retrieve with getLastErrorMessage()
 */
Fdl.Document.prototype.restore = function(config) {
	if (this.hasChanged()) {
		this.context.setErrorMessage('restore : cannot restore because data are locally modified');
	} else {
		if (! config) config=new Object();
		config.method='restore';
		return this.callMethod(config);	
	}
	return false;    
};

/**
 * lock document
 * @param bool auto if true a temporary lock
 */
Fdl.Document.prototype.lock = function(config) {
	if (! config) config=new Object();
	config.method='lock';
	return this.callMethod(config);
};
/**
   * unlock document
   * @param bool auto if true delete temporary lock
   */
Fdl.Document.prototype.unlock = function(config) {
    if (! config) config=new Object();
    config.method='unlock';
    return this.callMethod(config);
};


Fdl.Document.prototype.hasWaitingFiles = function() {   
    var data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',
			       method:'haswaitingfiles',
			       id:this.id});
    if (data) {
	if (! data.error) {	  
	    return data.haswaitingfiles;
	} else {	
	    this.context.setErrorMessage(data.error);
	}
    } else {      
	this.context.setErrorMessage('hasWaitingFiles : no data');
    }
    
    return false;    
};

Fdl.Document.prototype.getFollowingStates = function() {
    if (! this.id) return null;
    if (this.followingStates) return this.followingStates;
    else {
	var data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',
				   method:'getfollowingstates',
				   id:this.id});
	if (data) {
	    if (! data.error) {	  
		this.followingStates=data.followingStates;
		return data.followingStates;
	    } else {	
		this.context.setErrorMessage(data.error);
	    }
	} else {      
	    this.context.setErrorMessage('getFollowingStates : no data');
	}	
    }
    return false;    
};


/**
 * retrieve history items
 * @return {Fdl.DocumentHistory} the history object
 */
Fdl.Document.prototype.getHistory = function() {
    this.history=new Fdl.DocumentHistory({id:this.id,context:this.context});
    if (this.history.items == null) return null;
    return this.history;
};

/**
   * create a new revision
   * @param string comment
   * @param string version
   */
Fdl.Document.prototype.addRevision = function(config) {
    if (! config) config=new Object();
    config.method='addrevision';
    return this.callMethod(config);
};

Fdl.Document.prototype.callMethod = function(config) {
    if (config && config.method) {
	var data=null;
	if (config.norequest) {
	    data=this._data;
	} else {
	    data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',
						method:config.method,
						id:this.id},config);
	}
	if (data) {
	    if (! data.error) {
		if (! config.norequest) {
		    if (data.properties) this.affect(data);
		    else return data;
		}
		return true;
	    } else {	
		this.context.setErrorMessage(data.error);
	    }
	} else {      
	    this.context.setErrorMessage(config.method+' : no data');
	}
    }
    return false;    
};

/**
  * create a new document from another one
  * @param {Object} config
  * <ul><li><b>cloneFiles : </b>(Boolean)(optional) set to true if you want also clone atached files else the document references same files (default is false)</li>
  * <li><b>linkFolder : </b> (Boolean)(optional) set to false iy you don't want the copy will be inserted in the same primary folder than the source (default is true) </li>
  * <li><b>temporary : </b> (Boolean)(optional) the clone is a temporary document</li>
  * <li><b>title : </b> (String)(optional) the new title of document else it is the same as original</li>
  * </ul>
  * @return {Fdl.Document}  if clone suceeded, return null if no success
  */
Fdl.Document.prototype.cloneDocument = function(config) {
	var data=null;
	if (config && config.norequest) {
	    data=this._data;
	} else {
	 data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',
				   method:'clone',
	 			   id:this.id},config);
	}
	if (data) {
	    if (! data.error) {
		var clone=eval('new '+this.toString()+'()');
		clone.context=this.context;
		clone.affect(data);

		return clone;
	    } else {	
		this.context.setErrorMessage(data.error);
	    }
	} else {      
	    this.context.setErrorMessage(config.method+' : no data');
	}
    
    return null;    
};

/**
   * move document from primary folder to another folder
   * @param {Object} config
   * <ul><li><b>folderId : </b> the identificator of folder destination</li>
   * <li><b>fromFolderId : </b> (optional) the source folder, if not defined it is the primary folder of the document</li>
   * </ul>
   * @return {Boolean} true if move suceeded
   */
Fdl.Document.prototype.moveTo = function(config) {
    if (config && config.folderId) {
	if (! config) config=new Object();
	config.method='moveto';
	return this.callMethod(config);
    }
    return false;    
};

/**
 * get all possible views for this document
 * @return {Object} set of available view
 */
Fdl.Document.prototype.getViews = function() {
	if (! this._data) {
		this.context.setErrorMessage('getviews : no data');
		return null;
	} else if (this._data.configuration && this._data.configuration.views) {
		return this._data.configuration.views;
	}        
	return false;    
};
/**
 * get the default consultation view for this document
 * @return {Object} information about view, false if none
 */
Fdl.Document.prototype.getDefaultConsultationView = function() {
	var vs=this.getViews();
	if (vs) {
		for (v in vs) {
			if ((vs[v]['default']=="yes") && (vs[v].kind=="consultation")) return vs[v];
		}
	}
	return false;    
};
/**
 * get all possible edition views for this document
 * @return {Object} information about view, false if none
 */
Fdl.Document.prototype.getDefaultEditionView = function() {
	var vs=this.getViews();
	if (vs) {
		for (v in vs) {
			if ((vs[v]['default']=="yes") && (vs[v].kind=="edition")) return vs[v];
		}
	}
	return false;    
};

/**
   * get all attached timers informations
   * <pre>2 -[object Object]
......level - [4]
......delay - [0]
......actions -[object Object]
............state - []
............tmail - [47645
47593]
............method - []

......execdate - [2009-11-19 20:51]
......execdelay - [-5.85903333267]
......timerid - [47232]
......timertitle - [Mon minuteur]
......local -[object Object]
............lstate - [false]
............lmethod - [false]
............tmailtitle - [Expédition Rapport
MAIL_ARTICLE_TO_APPROUV]
............hdelay - []
    </pre>
   * @param bool reset : if true force another request
   * @return {array} of object
   */
Fdl.Document.prototype.getAttachedTimers = function(config) {   
	if (! this.id) return null;
	if (this.attachedTimers && ((!config) || (config && (!config.reset)))) return this.attachedTimers;
	else {
		var data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',
			method:'getAttachedTimers',
			id:this.id});
		if (data) {
			if (! data.error) {	  
				this.attachedTimers=data.attachedTimers;
				return data.attachedTimers;
			} else {	
				this.context.setErrorMessage(data.error);
			}
		} else {      
			this.context.setErrorMessage('getAttachedTimers : no data');
		}	
	}

	return false; 
};

/**
   * control a particular access of a document such as 'view' or 'delete'
   * @param string : the acl
   * @return {Boolean} true is acces granted
   */
Fdl.Document.prototype.control = function(acl) {   
	if (! this.id) return null;
	if (! this._data.security) return null;
	if (! acl) return null;
	if (acl.acl) acl=acl.acl;
	if (this._data.security[acl]) {    
		return this._data.security[acl].control;
	}	
	return null; 
};
/**
   * get all attached timers informations
   * @param bool reset : if true force another request
   * @return array
   */
Fdl.Document.prototype.getProfilAcls = function() {   
	if (! this.id) return null;
	if (this._data.security) return this._data.security;
	return false; 
};
/**
  * get all filterable properties
  * @return {array} of property identificators
  */
Fdl.Document.prototype.getFilterableProperties = function() { 
	f=[];
	if (this.context) {
		return this.context.getFilterableProperties();
	}
	return f;
};

/**
  * get all displayable properties
  * @return {array} of property identificators
  */
Fdl.Document.prototype.getDisplayableProperties = function() { 
	f=[];
	if (this.context) {
		return this.context.getDisplayableProperties();
	}
	return f;
};
/**
  * get all sortable properties
  * @return {array} of property identificators
  */
Fdl.Document.prototype.getSortableProperties = function() { 
	f=[];
	if (this.context) {
		return this.context.getSortableProperties();
	}
	return f;
};
/**
 * get information about property
 * @param {String} id the property id
 * @return {Object} example : {"type":"integer","displayable":true,"sortable":true,"filterable":true,"label":"identificateur"},
 */
Fdl.Document.prototype.getPropertyInformation = function(id) { 
	if (this.context) {
		return this.context.getPropertyInformation(id);
	}
	return null;
};
/**
 * get available operators for search criteria by attribute type
 * @return {Object} the operator available by attribute type  
{text:[{operator:'=', label:'equal', operand:['left','right'],labelTpl:'{left} is equal to {right}'},{operator:'~*', label:'include',operand:['left','right'],labelTpl:'{left} is equal to {right}'}],integer:[{operator:'=', label:'equal'},{operator:'>', label:'&gt;'}],...
 */
Fdl.Document.prototype.getSearchCriteria = function() { 
	if (this.context) return this.context.getSearchCriteria();
	return null;
};

/**
 * Can be use after a search with hightlight option
 * <pre><code>
 * </code></pre>
 * @param {String} id the attribute identificator
 * @return {String} the key is between &gt;b<&lt; HTML tag
 */
Fdl.Document.prototype.getHighlight = function() { // in case of search with highlight
	return this._data.highlight;
};



/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.DocumentList describe the object returned by getContent or Search
 * 
 * 
 * 
 * @namespace Fdl.Document
 * @cfg {String} mainSelector indicate selection scheme none or all
 * @cfg {Fdl.Collection} collection the collection reference
 * @cfg {Fdl.DocumentFilter} filter of the collection
 * @cfg {Fdl.Context} connection context
 * @cfg {Fdl.Document} selectionItems array of documents
 */
Fdl.DocumentList = function(config) {
	this.content = [];
	if (config) {
		for ( var i in config)
			this[i] = config[i];
	}
	if (this.content) this.length=this.content.length;
};
Fdl.DocumentList.prototype = {
	/**
	 * total number of matches document
	 * 
	 * @type Numeric none or all
	 */
	totalCount : 0,
	/**
	 * The array of raw document
	 * 
	 * @type Array
	 */
	content : null,
	/**
	 * Additionnal informations about collection
	 * 
	 * @type Object
	 */
	info : null,

	/**
	 * count of document list
	 * 
	 * @type Numeric
	 */
	length : 0,
	/**
	 * Connexion context
	 * 
	 * @type Fdl.Context
	 */
	context : null,
	/**
	 * return all document objects return by Fdl.Collection::getContent() or
	 * Fdl.SearchDocument::search()
	 * 
	 * @return {Array} document (FDl.Document) array
	 */
	getDocuments : function() {
		var out = [];
		for ( var i = 0; i < this.content.length; i++) {
			if (typeof this.content[i] == 'object') {
				out.push(this.context.getDocument( {
					data : this.content[i]
				}));
			} else
				alert('FdlDocuments: error in returned');
		}
		return out;
	},
	/**
	 * return document at index position
	 * Fdl.SearchDocument::search()
	 * 
	 * @return {Fdl.Document} document 
	 */
	getDocument : function(index) {
		
			if (typeof this.content[index] == 'object') {
				return (this.context.getDocument( {
					data : this.content[index]
				}));
			}
		
		return null;
	},
	/**
	 * return total count of folder content or search result
	 * 
	 * @return {Numeric} number of documents found
	 */
	count : function() {
		return this.totalCount;
	},
	
	toString : function() {
		return 'Fdl.DocumentList';
	}

};

/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.Collection ; The collection document object
 * 
 * <pre><code>
  var C = new Fdl.Context( {
  	url : 'http://my.freedom/'
  });
  var d = C.getDocument( {
  	id : 9
  });
  if (d &amp;&amp; d.isAlive()) {
  	if (d.isCollection()) {
  		var dl = d.getContent(); // get Document List
  		var p = dl.getDocuments(); // get array of Documents from document List
  		var ht = '&lt;table&gt;';
  		for ( var i in p) {
  			doc = p[i];
  			ht += '&lt;tr&gt;&lt;td&gt;' + i + '&lt;/td&gt;&lt;td&gt;' + doc.getProperty('id')
  					+ '&lt;/td&gt;&lt;td style=&quot;width:200px;overflow:hidden&quot;&gt;'
  					+ doc.getTitle() + '&lt;/td&gt;&lt;td&gt;&lt;img src=&quot;' + doc.getIcon( {
  						'width' : 20
  					}) + '&quot;&gt;&lt;/td&gt;&lt;td&gt;' + doc.getProperty('mdate')
  					+ '&lt;/td&gt;&lt;/tr&gt;';
  		}
  		ht += '&lt;/table&gt;';
  	}
  }
 * </code></pre>
 * 
 * @namespace Fdl.Document
 * @extends Fdl.Document
 * @param {Object}   config
 */

Fdl.Collection = function (config) {
  Fdl.Document.call(this,config);
};
Fdl.Collection.prototype = new Fdl.Document();
Fdl.Collection.prototype.toString= function() {
      return 'Fdl.Collection';
};

/**
 * return array of documents included in folder or result of a search
 * 
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>start : </b>{Number} (optional) offset where begin search ,
 *            0 is the first</li>
 *            <li><b>slice : </b> {Number}(optional) number of documents
 *            returned (default is 50)</li>
 *            <li><b>onlyValues : </b> {Boolean}(optional) does not return
 *            attribute definition - more quick. It true return also attribute
 *            definition (default is true)</li>
 *            <li><b>completeProperties : </b> {Boolean}(optional) does not
 *            return property locker and lastmodifiername and followg states
 *            informations (mode quick response). Set to true if you need theses
 *            informations (default is false)</li>
 *            <li><b>orderBy : </b> {string}(optional) ordered by title by
 *            default, can use any property .can use attribute when mono family
 *            search. To choose the direction use asc or desc after the property :
 *            "title desc" for example
 *            <li><b>filter : </b> {Fdl.Filter}(optional) a filter
 * 
 * <pre>
    {sql:&quot;us_fname = 'roy'&quot;,
     family : &quot;USER strict&quot;,
     criteria : [{ operator  : '&tilde;',
                   right : 'us_login',
                   left : 'carter'},
                 { operator : '&gt;&lt;',
                   right : 'us_date',
                    min : '2009-10-01',
                   max : '::getDate(3)'},
                 { operator : '&gt;',
                   right : 'us_date',
                   left : '@us_otherdate'},
                 { operator  : '=',
                   right : 'owner',
                   left : '::getSystemUserId()'},
                 {or : [{ locked : '!=',
                          right : 'locked',
                          left : 0},
                       { locked : '!=',
                         right : 'locked',
                         left : '::getSystemUserId()'}]},
                   { operator : '=&tilde;',
                     right : 'allocated',
                     left : 'roy'}]
     ]}
 * </pre>
 * 
 * </li>
 * <li><b>start : </b> {Numeric}(optional) the offset range (default is 0 : from first matches)  </li>
 * <li><b>slice : </b> {Numeric}(optional) the limit of result returned (default is 100), set to "ALL" for unlimited  </li>
 * <li><b>verifyhaschild : </b> {Boolean}(optional) (default is false) </li>
 * <li><b>searchProperty : </b> {String}(optional) main property or attribute
 * identicator where apply the key. The oprator is ~* (insensitive case include)
 * by default equal to any values ("svalues" property) </li>
 * <li><b>withHighlight : </b> {Boolean}(optional) to return highlight text in
 * concordance with the main keyword</li>
 * <li><b>key : </b> {String}(optional) main keyword filter  </li>
 * <li><b>mode : </b> {String}(optional) search mode fir main keyword must be 'word' or 'regexp' (default is word)</li>
 * <li><b>recursiveLevel : </b> {Numeric}(optional) inspect subdirectories until depth level. A limit is necessary because the graph can be cyclic </li>
 * <li><b>mode : </b> {String}(optional) search mode fir main keyword must be 'word' or 'regexp' (default is word)</li>
 * </ul>
 * @return {Fdl.DocumentList} list of Fdl.Document
 */
Fdl.Collection.prototype.getContent = function(config) {
	if (! this.getProperty('initid')) {
		this.context.setErrorMessage('getContent: no identificator set');
		return null;
	}
	var data=null;
	if (config && config.data) {
		data=config.data;
	} else {
		if (config && config.filter) config.filter=JSON.stringify(config.filter);
		data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',method:'getcontent',id:this.getProperty('initid')},config);
	}
	if (data) {
		if (! data.error) {
			data.context=this.context;
			return new Fdl.DocumentList(data);
		} else {
			this.context.setErrorMessage(data.error);
		}
	} else return null;
};


/**
 * return sub collections included in the collection return folder and searches
 * 
 * @return {Fdl.DocumentList} of Fdl.Document
 */
Fdl.Collection.prototype.getStoredContent = function() {
	if (this._data.storedContent) {
		return this.getContent({data:this._data.storedContent});
	}
  return null;
};
/**
 * return sub collections included in the collection return folder and searches
 * 
 * @return {Fdl.DocumentList} of Fdl.Document
 */
Fdl.Collection.prototype.getSubCollections = function() {
  return this.getContent({verifyhaschild:true,filter:"doctype = 'D' or doctype = 'S'"});
};
/**
 * return sub folders included in collection not return seareches
 * 
 * @return {Fdl.DocumentList} of Fdl.Document
 */
Fdl.Collection.prototype.getSubFolders = function() {
  return this.getContent({verifyhaschild:true,filter:"doctype = 'D'"});
};
/**
 * insert document into a folder
 * 
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>id : </b>{Number} the document identificator to add</li>
 *            </ul>
 * @return {Boolean} true if document is inserted
 */
Fdl.Collection.prototype.insertDocument = function(config) {
	if (config && config.id) {	
		var data=null;
		if (config.norequest) {
			data=this._data;
		} else {
			data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',method:'insertdocument',
				id:this.getProperty('initid'),
				idtoadd:config.id});
		}
		if (! data.error) {
			return true;
		} else {
			this.context.setErrorMessage(data.error);
		}
	}  
	return false;
};
/**
 * unlink document from a folder (the document is not deleted)
 * 
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>id : </b>{Number} the document identificator to remove
 *            from folder</li>
 *            </ul>
 * @return {Boolean} true if document is unlinked
 */
Fdl.Collection.prototype.unlinkDocument = function(config) {
	if (config && config.id) {
		var data=null;
		if (config.norequest) {
			data=this._data;
		} else {
			data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',method:'unlinkdocument',
				id:this.getProperty('initid'),
				idtounlink:config.id});
		}
		if (! data.error) {
			return true;
		} else {
			this.context.setErrorMessage(data.error);
		}
	}  
	return false;
};

/**
 * insert documents to a folder
 * 
 * <pre><code>
  // insert all documents of folder 9 to basket 1012 except three documents
  var basket = C.getDocument( {
  	id : 1012
  });
  var nine = C.getDocument( {
  	id : 9
  });
  if (basket &amp;&amp; nine) {
  	var s = new Fdl.DocumentSelection();
  	s.setAllCollection( {
  		collection : nine
  	});
  	s.insertToList( {
  		id : 52283
  	});
  	s.insertToList( {
  		id : 47219
  	});
  	s.insertToList( {
  		document : C.getDocument( {
  			id : 47882,
  			useCache : true
  		})
  	});
  	var r = basket.insertDocuments( {
  		selection : s
  	});
  }
 * </code></pre>
 * 
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>selection : </b>{Fdl.DocumentSelection} the references to
 *            documents to insert</li>
 *            </ul>
 * @return {Object} insertedCount:the number of document inserted,
 *         notInsertedCount : the number of document not inserted , inserted :
 *         array of message (indexed ny id), notInserted : array of message
 *         (indexed by id)
 */
Fdl.Collection.prototype.insertDocuments = function(config) {
	if (config && config.selection) {
		var data=null;
		if (config.norequest) {
			data=this._data;
		} else {
			console.log('insert',config);
			if (config.selection) config.selection=JSON.stringify(config.selection);
			data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',method:'insertdocuments',
				id:this.getProperty('initid')},config);
		}
		if (! data.error) {
			return data;
		} else {
			this.context.setErrorMessage(data.error);
		}
	}  
	return false;
};

/**
 * move documents to a folder
 * 
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>selection : </b>{Fdl.DocumentSelection} the references to
 *            documents to insert</li>
 *            <li><b>targetIdentificator : </b>{Number} Folder identificator</li>
 *            </ul>
 * @return {Object} insertedCount:the number of document inserted,
 *         notInsertedCount : the number of document not inserted , inserted :
 *         array of message (indexed ny id), notInserted : array of message
 *         (indexed by id)
 */
Fdl.Collection.prototype.moveDocuments = function(config) {
	if (config && config.selection) {
		var data=null;
		if (config.norequest) {
			data=this._data;
		} else {
			if (config.selection) config.selection=JSON.stringify(config.selection);
			data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',method:'movedocuments',
				id:this.getProperty('initid')},config);
		}
		if (! data.error) {
			return data;
		} else {
			this.context.setErrorMessage(data.error);
		}
	}  
	return false;
};
/**
 * unlink documents from a folder (the document is not deleted)
 * 
 * @param {Object}
 *            config
 *            <ul>
 *            <li><b>selection : </b>{Fdl.DocumentSelection} the references to
 *            documents to unlink</li>
 *            </ul>
 * @return {Object} unlinkedCount:the number of document unlinked,
 *         notUnlinkedCount : the number of document not unlinked , unlinked :
 *         array of message (indexed ny id), notUnlinked : array of message
 *         (indexed by id)
 */
Fdl.Collection.prototype.unlinkDocuments = function(config) {
	if (config && config.selection) {
		var data=null;
		if (config.norequest) {
			data=this._data;
		} else {
			if (config.selection) config.selection=JSON.stringify(config.selection);
			data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',method:'unlinkdocuments',
				id:this.getProperty('initid')},config);
		}
		if (! data.error) {
			return data;
		} else {
			this.context.setErrorMessage(data.error);
		}
	}  
	return false;
};

/**
 * unlink all documents from a folder ( documents are not deleted)
 * 
 * @return {Boolean} true if folder is cleaned
 */
Fdl.Collection.prototype.unlinkAllDocuments = function(config) {
	var data=null;
	if (config && config.norequest) {
		data=this._data;
	} else {
		data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',method:'unlinkalldocuments',
			id:this.getProperty('initid')},config);
	}
	if (! data.error) {
		return true;
	} else {
		this.context.setErrorMessage(data.error);
	}
	return false;
};

/**
 * get restricted families when folder has restrcition
 * 
 * @param {Object}
 *            config (optional)
 *            <ul>
 *            <li><b>reset : </b>if true force another request </li>
 *            </ul>
 * @return array of object {id:<identificator>,title:<family title>}
 */
Fdl.Collection.prototype.getAuthorizedFamilies = function(config) {
	if (this.id) {
		if (this.authorizedFamilies && ((!config) || (config && (!config.reset)))) return this.authorizedFamilies;
		var data=null;
		if (config && config.data) {
			data=config.data;
		} else {
			data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',method:'getAuthorizedFamilies',
				id:this.getProperty('initid')});
		}
		if (! data.error) {
			this.authorizedFamilies=new Object();
			if (data.authorizedFamilies.restriction) {
				this.authorizedFamilies.families=new Object();
				for (var i in data.authorizedFamilies.families) {
					this.authorizedFamilies.families[i]={id:i,
							title:data.authorizedFamilies.families[i]['title']};
				}
			} else {
				this.authorizedFamilies.families=null;
			}
			this.authorizedFamilies.restriction=data.authorizedFamilies.restriction;
			return this.authorizedFamilies;  
		} else {
			this.context.setErrorMessage(data.error);
		}
	}  
	return false;
};

/**
 * verify if collection is restriction on family type
 * 
 * @return {Boolean} return true if has restriction
 */
Fdl.Collection.prototype.hasRestriction = function(config) {
  if (this.id) {
      var authfam=this.getAuthorizedFamilies(config);
      if (authfam) return authfam.restriction;
  }  
  return false;
};
/**
 * verify if collection is a folder
 * 
 * @return {Boolean} return true if it is a folder ( not a search)
 */
Fdl.Collection.prototype.isFolder = function() {
      return (this.getProperty('defdoctype')=="D");
};
/**
 * verify if collection is a search
 * 
 * @return {Boolean} return true if it is a search (not a folder)
 */
Fdl.Collection.prototype.isSearch = function() {
      return (this.getProperty('defdoctype')=="S");
};


/**
 * add a filter to a search
 * @param {Fdl.DocumentFilter} filter the filter to add
 * @return {Boolean} return true if succeed
 */
Fdl.Collection.prototype.addFilter = function(filter) {
	if (! this.isSearch()) return false;
	if (! filter) return false;
	if (filter.family) {
		var st=filter.family.indexOf('strict');
		if (st) {
			st=filter.family.indexOf(' ');
			this.setValue("se_famid",filter.family.substr(0,st));
			this.setValue("se_famonly","yes");
		} else {
			this.setValue("se_famid",filter.family);
		}
	}  
	if (filter.criteria || filter.sql || filter.family) {
		var fs=this.getValue("se_filter");
		var fsType=this.getValue("se_typefilter");
		var newfs=[];
		var newfsType=[];
		if (fs) newfs=newfs.concat(fs);
		if (fsType) newfsType=newfsType.concat(fsType);
		newfs.push(Fdl.json2xml({filter:filter.normalize()}));
		newfsType.push('specified');
		this.setValue("se_filter",newfs);
		this.setValue("se_typefilter",newfsType);
		//this.setValue("se_filter",[Fdl.json2xml(filter)]);
	}
	return true;
};


/**
 * delete all filters from search
 * @return {Boolean} return true if succeed
 */
Fdl.Collection.prototype.resetFilter = function() {
	if (! this.isSearch()) return false;	
		this.setValue("se_filter",'');
	
	return true;
};

/**
 * get filters used for a search
 * @return {Array} of Fdl.DocumentFilter
 */
Fdl.Collection.prototype.getFilters = function(filter) {

	if (! this.isSearch()) return null;
	var xmlfilters=this.getValue("se_filter");
	if (xmlfilters && (xmlfilters.length > 0)) {
		var filters=[];
		var xml;
		var ojs;
		for (var i=0;i<xmlfilters.length;i++) {
			xml=Fdl.text2xml(xmlfilters[i]);
			ojs=Fdl.xml2json(xml);
			if (ojs.filter && ojs.filter.criteria) {
				if (ojs.filter.criteria.operator || ojs.filter.criteria.or || ojs.filter.criteria.and) ojs.filter.criteria=[ojs.filter.criteria];
			}
			if (ojs.filter.criteria) {
			for (var j=0;j<ojs.filter.criteria.length;j++) {
				// if only one criteria means no operators needed
				if ((ojs.filter.criteria[j].or) && (ojs.filter.criteria[j].or.operator)) ojs.filter.criteria[j]=ojs.filter.criteria[j].or;
				if ((ojs.filter.criteria[j].and) && (ojs.filter.criteria[j].and.operator)) ojs.filter.criteria[j]=ojs.filter.criteria[j].and;
			}
			}
			var of=new Fdl.DocumentFilter(ojs.filter);
			filters.push(of);
		}
		return filters;
	} else {
		var se_attrids=this.getValue('se_attrids');
		console.log("old",se_attrids);
	}
};


// ========== NOT PROTOTYPE (DEPRECATED)================

// @deprecated
Fdl.getHomeFolder = function() {
  var u=Fdl.getUser();
  if (u != null && u.id) {
    var idhome='FLDHOME_'+u.id;
    var h=new Fdl.Collection({id:idhome});
    if (h.isAlive()) return h;
  }
  return null;
};
// @deprecated
Fdl.getDesktopFolder = function() {
  if (Fdl._desktopFolder) return Fdl._desktopFolder;
  var u=Fdl.getUser();
  if (u != null && u.id) {
    var idhome='FLDDESKTOP_'+u.id;
    var h=new Fdl.Collection({id:idhome});
    if (h.isAlive()) {
      Fdl._desktopFolder=h;
      return h;
    }
  }
  return null;
};
// @deprecated
Fdl.getOfflineFolder = function() {
  if (Fdl._offlineFolder) return Fdl._offlineFolder;
  var u=Fdl.getUser();
  if (u != null && u.id) {
    var idhome='FLDOFFLINE_'+u.id;
    var h=new Fdl.Collection({id:idhome});
    if (h.isAlive()) {
      Fdl._offlineFolder=h;
      return h;
    }
  }
  return null;
};

/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.DocumentFilter describe the object used to define a document
 *        filter this filter can be use in Fdl.Collection::getContent() method
 *        and in Fdl.SearchDocument object property
 *        <p>
 *        I want all folders document :
 *        </p>
 * 
 * <pre><code>
  var f = new Fdl.DocumentFilter( {
  	family : 'DIR'
  });
  var s = C.getSearchDocument( {
  	filter : f
  });
  var result = s.search();
 * </code></pre>
 * 
 * 
 * <p>
 * I want all folders document included in folder 9:
 * </p>
 * 
 * <pre><code>
  var f = new Fdl.DocumentFilter( {
  	family : 'DIR'
  });
  var nine = C.getDocument( {
  	id : 9
  });
  var result = nine.getContent( {
  	filter : f
  });
 * </code></pre>
 * 
 * <p>
 * I want all folders document where description include 'root':
 * </p>
 * 
 * <pre><code>
  var f = new Fdl.DocumentFilter( {
  	family : 'DIR',
  	criteria : [ {
  		operator : '&tilde;',
  		left : 'ba_desc',
  		right : 'root'
  	} ]
  });
  var s = C.getSearchDocument( {
  	filter : f
  });
  var result = s.search();
 * </code></pre>
 * 
 * <p>
 * I want all persons where locked by me or not locked :
 * </p>
 * 
 * <pre><code>
  var f = new Fdl.DocumentFilter( {
  	family : 'DIR',
  	criteria : [ {
  		or : [ {
  			operator : '=',
  			left : 'locked',
  			right : 0
  		}, {
  			operator : '=',
  			left : 'locked',
  			right : '::getSystemUserId()'
  		} ]
  	}, ]
  });
  var s = C.getSearchDocument( {
  	filter : f
  });
  var result = s.search();
 * </code></pre>
 * 
 * <p>
 * I want all folders with private profil :
 * </p>
 * 
 * <pre><code>
  var f = new Fdl.DocumentFilter( {
  	family : 'DIR strict',
  	criteria : [ {
  		or : [ {
  			operator : '=',
  			left : 'id',
  			right : ':@profid'
  		} ]
  	}, ]
  });
  var s = C.getSearchDocument( {
  	filter : f
  });
  var result = s.search();
 * </code></pre>
 * 
 * @namespace Fdl.Document
 * @cfg {String} mainSelector indicate filter scheme none or all
 * @cfg {Fdl.Collection} collection the collection reference
 * @cfg {Fdl.Filter} filter of the collection
 * @cfg {Fdl.Document} filterItems array of documents
 */
Fdl.DocumentFilter = function (config) {
    if (config) {
	for (var i in config) this[i]=config[i];
    }
};
Fdl.DocumentFilter.prototype = {
    /**
	 * family filterTo not include sub family (the default) use 'strict' after
	 * family name : 'USER strict' for example
	 * 
	 * @type String use the logical name of family.
	 */
    family:null,
    /**
	 * all detailed criteria
	 * 
	 * @type Object
	 */
    criteria:null,
    /**
	 * sql where part. Operator must be internal postgresql operators
	 * 
	 * @type String
	 */
    sql:null,
	toString: function(){
		return 'Fdl.DocumentFilter';
	},
	getCriteria: function (clone) {
		if (clone) return Fdl.cloneObject(this.criteria);
		else return this.criteria;
	},
	/**
	 * linearize criteria
	 * @return array like [{condition},{logical operator}, {condition},[logical operator}...]
	 */
	linearize: function(ca,ol) {
		var l=[];
		if (!ol) ol='and';
		var lp=false;
		var rp=false;
		var top=(!c);
		var c;
		if (!ca) c=this.getCriteria(true); // clone array
		else c=Fdl.cloneObject(ca);

		if (!c) return l;
		for (var i=0;i<c.length;i++) { 
			if (c[i].operator) {
				if (i >0) c[i].ol=ol;
				c[i].lp=lp;
				c[i].rp=rp;
				l.push(c[i]);
			} else if (c[i].or || c[i].and || c[i].length) {
				var ln=[];
				if (c[i].or)  ln=this.linearize(c[i].or,'or');
				else if (c[i].and) ln=this.linearize(c[i].and,'and');
				else if (c[i].length) ln=this.linearize(c[i],'and');
				else console.log("ERROR ADD",c[i]);
				
				if (ln.length> 0) {
					if (!ln[0].lp) {
					ln[0].lp=true;
					ln[ln.length-1].rp=true;
					}
					ln[0].ol=ol;
					for (var j=0;j<ln.length;j++) {
							l.push(ln[j]);
					}
				}				
			} 
		}
		
		if (top && l.length >0) l[0].ol=null;
		return l;
	},
	/**
	 * 
	 * @param {array} la array of linearized criteria
	 * @return {object} criteria object
	 */
	unLinearize: function(la,level) {
		if (!level) level=0;
		if (level > 4) {
			console.log('recursion detect');
			return;
		}
		var l=Fdl.cloneObject(la);
		var c=[];
		if (l.length==0) return c;
		if (l.length==1) {
			l[0].ol=null;
			l[0].lp=null;
			l[0].rp=null;
			return [l[0]];
		}
		var ol=l[1].ol;
		var onlyand=true;
		for (var i=1;i<l.length;i++) {
			if (l[i].ol != 'and') onlyand=false;
		}
		if (onlyand) {
			for (var i=0;i<l.length;i++) {
				l[i].ol=null;
				l[i].lp=null; //ignore parenthesis
				l[i].rp=null;
				if (l[i].ul) c.push(l[i].ul);
				else c.push(l[i]);
			}
		} else {
			var onlyor=true;
			for (var i=1;i<l.length;i++) {
				if (l[i].ol != 'or') onlyor=false;
			}
			if (onlyor) {
				var cor={or:[]};
				for (var i=0;i<l.length;i++) {
					l[i].ol=null;
					l[i].lp=null; //ignore parenthesis
					l[i].rp=null;
					if (l[i].ul) cor.or.push(l[i].ul);
					else cor.or.push(l[i]);
				}
				c.push(cor);
			} else {
				// mixing and or
				var pa=0;
				var bp=false;
				for (var i=1;i<l.length;i++) {
					if ((! bp) && (l[i].ol == 'and') && (!l[i].lp) && (!l[i].rp) ) {
						// begin parenthesis
						pa=i-1;
						bp=true;
						l[i].lp=false;
						l[i].rp=false;
						if (i==l.length-1) {
							l[pa].lp=true;							
							l[i].rp=true;	
						}
					} else if ( bp && (!l[i].lp) && (!l[i].rp)&& (l[i].ol == 'and') && (i<(l.length-1))) {
						l[i].lp=false;							
						l[i].rp=false;	
					} else if ( bp && (!l[i].lp) && (!l[i].rp) && (l[i].ol == 'and') && (i==l.length-1)) {
						l[pa].lp=true;							
						l[i].rp=true;	
					} else if ( bp && ((l[i].ol != 'and') || (l[i].lp)|| (l[i].rp))) {
						l[i-1].rp=true;							
						l[pa].lp=true;
						bp=false;
					} 
				}
				//console.log('mix orand',n2s(l));
				// search or
				var cp=0;
				var lu;
				var wu;
				var wi=0;
				var nl=[];
				for (var i=0;i<l.length;i++) {
					//console.log(l[i],cp);
					if ((l[i].lp) ) {
						wi=i;
						
					} 
					if ((l[i].rp)) {
						wu=l.slice(wi,i+1);
						lu=this.unLinearize(wu,level+1);
						//console.log('wu',wu,'lu',lu);
						nl.push({ol:l[wi].ol,ul:lu});
					}
					if ((!l[i].lp) && (!l[i].rp) && (cp==0)) {
						nl.push(l[i]);
					}
					if (l[i].lp) cp++;
					if (l[i].rp) cp--;					
				}
				//console.log('second pass',nl);
				return this.unLinearize(nl,level+1);
			}
		}
		return c;
	},
	/**
	 * explicit and operators 
	 * @return {object} self
	 */
	normalize: function() {
		if (this.criteria) {
			for (var j=0;j<this.criteria.length;j++) {
				if (this.criteria[j].or || this.criteria[j].and) {
					var ic=this.criteria[j].or;
					if (!ic) ic=this.criteria[j].and;
					for (var i=0;i<ic.length;i++) {
						if (ic[i].length > 0) {
							ic[i]={and:ic[i]};
						}
					}
				}
				
			}
		}
		return this;
	}
};





/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.DocumentSelection describe the object use for define a document
 *        selection
 *        <p>
 *        I want to select documents 2034 and 2045 :
 *        </p>
 * 
 * <pre><code>
  var s = new DocumentSelection();
  s.insertToList( {
 	id : 2024
 }); // first way : use only the identificator
  var d = C.getDocument( {
  	id : 2045
  }); // C is the context
  s.insertToList( {
  	document : d
  }); // second way : with the complete document object
 * </code></pre>
 * 
 * <p>
 * I want to select all documents of folder 9 except 2067 and 2098 :
 * </p>
 * 
 * <pre><code>
  var nine=C.getDocument({id:9}); // C is the context
  var s=new DocumentSelection({mainSelector:'all',collection:nine);
  s.insertToList({id:2067});
  s.insertToList({id:2098});
 * </code></pre>
 * 
 * <p>
 * I want to select only subfolders of folder 9 :
 * </p>
 * 
 * <pre><code>
  var nine=C.getDocument({id:9}); // C is the context
  var s=new DocumentSelection();
  s.setAllCollection({collection:nine};)
  s.filter=new Fdl.DocumentFilter({family:'DIR'});
 * </code></pre>
 * 
 * @namespace Fdl.Document
 * @cfg {String} mainSelector indicate selection scheme none or all
 * @cfg {Fdl.Collection} collection the collection reference
 * @cfg {Fdl.DocumentFilter} filter of the collection
 * @cfg {Fdl.Context} connection context
 * @cfg {Fdl.Document} selectionItems array of documents
 */
Fdl.DocumentSelection = function (config) {
    this.selectionItems=[];
    this.mainSelector='none';
    if (config) {
    	for (var i in config) this[i]=config[i];
    }
};
Fdl.DocumentSelection.prototype = {
    /**
	 * indicate selection scheme
	 * 
	 * @type String none or all
	 */
    mainSelector:'none',
    /**
	 * list of document selected
	 * 
	 * @type Array of Number of Fdl.Document
	 */
    selectionItems:[],
    /**
	 * collection identificator use for selection
	 * 
	 * @type Fdl.Collection
	 */
    collectionId:null,
    /**
	 * filter use for selection {@link Fdl.DocumentFilter filter}
	 * 
	 * @type Fdl.DocumentFilter
	 */
    filter:null,
    /**
	 * Connexion context
	 * 
	 * @type Fdl.Context
	 */
    context:null,
    /**
	 * if mainSelector is none, it means add document to selection, if
	 * mainSelector is all, it means unselect this document from collection
	 * containt (if exists of course)
	 * 
	 * @param config
	 *            {Nmmber/Fdl.Document} document identificator or document
	 *            object
	 *            <ul>
	 *            <li><b>id : </b>{Number} document identificator</li>
	 *            <li><b>document : </b>{Fdl.Document} document identificator</li>
	 *            </ul>
	 * @return {Boolean} add document to selection object
	 */
    insertToList:function (config) {
	var id=0;
	if (config) {
		if (config.document && config.document.getProperty) {
			config.id=config.document.getProperty('initid');
			if ((! this.context) && (config.document.context)) this.context=config.document.context;
		}
		if (config.id) {
			for (var i=0;i<this.selectionItems.length;i++) {
				if (this.selectionItems[i]==config.id) return false;
			}	
			this.selectionItems.push(config.id);
			return true;
		}
	}
	return null;
    },
    /**
	 * if mainSelector is none, it means remove document from selection, if
	 * mainSelector is all, it means unselectreadd this document from all
	 * document (if exists of course)
	 * 
	 * @return {Boolean} remove document to selection object
	 */
    removeFromList:function (config) {
    	if (config) {
    		for (var i=0;i<this.selectionItems.length;i++) {
    			if (this.selectionItems[i]==config.id) {
    				if (this.selectionItems.length==1) {
    					this.selectionItems=[];
    				} else {
    					if (i < (this.selectionItems.length-1)) this.selectionItems[i]=this.selectionItems[this.selectionItems.length-1];
    					this.selectionItems.pop();
    				}
    				return true;
    			}
    		}
    	}
    	return false;
    },
    toJSON: function(key) {
    	var o={};
    	for (var i in this) {
    		if ((typeof this[i] != 'function') && (i!='context')) o[i]=this[i];
    	}
        return JSON.parse(JSON.stringify(o));        
    },
/**
 * if mainSelector is none, it means remove all documents from selection, if
 * mainSelector is all, it means select all document from collection containt
 * 
 * @return {Boolean} remove document to selection object
 */
    clearSelection:function (config) {
    	this.selectionItems=[];
    },
    /**
	 * invert the selection by switching mainSelector between 'all' and 'none'
	 * value.
	 * 
	 * @return {void}
	 */
    invertSelection:function (config) {
    	if (this.mainSelector=='none') this.mainSelector='all';
    	else this.mainSelector='none';
    },
    /**
	 * Return the documentList identicators, this is no Fdl.Document but only
	 * document id Numbers.
	 * 
	 * @return {Array} of document identificator
	 */
    getDocumentIdList:function (config) {
    	if (this.mainSelector =='all') {
    		// [TODO] call server to getElementList
    	} else {
			return this.selectionItems;
    	}
    },   
    
    /**
	 * Return the documentList
	 * 
	 * @return {Array} of Fdl.Document
	 */
    getDocumentList:function (config) {
    	if (this.mainSelector =='all') {
    		if (this.collectionId) {
    			var tfilter=[];
    			for (var i=0;i<this.selectionItems.length;i++){
    				tfilter.push({operator:'!=',left:'id',right:this.selectionItems[i]});
    			}
    			var f=new Fdl.DocumentFilter({criteria:tfilter});
    			var c=this.context.getDocument({id:this.collectionId,usecache:true});
    			return c.getContent({filter:f});
    		}
    	} else {
    		var g=this.context.createGroupRequest();
    		for (var i=0;i<this.selectionItems.length;i++){
    			var o={};
    			o['d'+i]=g.getDocument({id:this.selectionItems[i]});
    			g.addRequest(o);
    		}
    		var r=g.submit();
    		if (r) {
    			var rt=[];
    			var d;
    			for (var i=0;i<this.selectionItems.length;i++){
    				d=r.get('d'+i);
    				if (d) rt.push(d);
    			}
    			return rt;
    		}
    	}
    	return null;
    },
    /**
	 * set selection to the content of a collection
	 * 
	 * @param {Object}
	 *            config
	 *            <ul>
	 *            <li><b>collection : </b>{Fdl.Collection} the collection
	 *            object</li>
	 *            </ul>
	 * @return {boolean} true if selection done, false if cannot (use
	 *         context.getLastErrorMessage() to see the reason
	 */
    setAllCollection:function (config) {
    	if (config) {
    		if (config.collection) {
    			if (config.collection.isAlive()) {
    				if (config.collection.isCollection()) {
    					this.collectionId=config.collection.getProperty('initid');
    					this.mainSelector='all';
    					if ((! this.context) && (config.collection.context)) this.context=config.collection.context;
    					return true;
    				} else config.collection.context.setErrorMessage('document is not a collection');
    			} else config.collection.context.setErrorMessage('document is not alive');
    			return false;
    		}
    	} 
    	return null;

    },
    toString: function() {
	return 'Fdl.DocumentSelection';
    },
	
	/**
	 * Return the number of currently selected documents.
	 * @method count
	 */
	count: function() {		
		
		if (this.mainSelector == 'all') {
			var count = this.totalCount; // this.totalCount must be stored in the selection by external calls
			return count - this.selectionItems.length;
		} else {
			return this.selectionItems.length;
		}
		
	}
};

/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.User
 * <pre><code>
var C=new Fdl.Context({url:'http://my.freedom/'});
var user;
if (! C.isAuthenticated()) {
  user=C.setAuthentification({login:'admin',password:'anakeen'});
  if (!user)  alert('error authent:'+C.getLastErrorMessage());    
} else {
  user=C.getUser();
}
if (user) {
  alert(user.getDisplayName());
  var duid=u.getUserDocumentIdentificator();
    if (duid) {
      var d=C.getDocument({id:duid});
      if (d && d.isAlive()) {
          var phone=d.getValue("us_phone");
	  alert('Phone:'+phone);
      }
    }
}
 * </core></pre>
 * @param {Object} config
 */

Fdl.User = function(config){
	if (config && config.context) this.context=config.context;

	if (config && config.data) {
		this.affect(config.data); 
	} else {
		var  data=this.context.retrieveData({app:'DATA',action:'USER'});   
		if (data) this.affect(data); else return false;
	}
};


Fdl.User.prototype = {
		/** system user identificator 
        @type Number */
		id:null,
		/** system user login 
        @type String */
		login:null,
		/** first name of user
        @type String */
		firstname:null,
		/** last name of user
        @type String */
		lastname:null,
		/** email of user
        @type String */
		mail:null,
		/** locale (language) of user
        @type String */
		mail:null,
		info:new Object(),
		context:Fdl,
		affect: function (data) {
	if (data) {
		if (! data.error) {	  
			this._data=data;
			if (data.info) this.completeData(data.info);
			return true;
		} else {
			this.context.setErrorMessage(data.error);
		}
	}
	return false;
},
toString: function() {
	return 'Fdl.User';
}
};

Fdl.User.prototype.completeData = function(data) {
	if (data) {
		for (var i in data) this.info[i]=data[i];
		this.id=data.id;
		this.login=data.login;
		this.firstname=data.firstname;
		this.lastname=data.lastname;
		this.locale=data.locale;
	}
};

/** get display name : first and last name
 * @return {String}
 */
Fdl.User.prototype.getDisplayName = function() {
	if (this.info) {
		return this.info.firstname+' '+this.info.lastname;
	}
	return null;
};

/** get all properties of user
 * @return {Object}
 */
Fdl.User.prototype.getInfo = function() {    
	if (this.info) {
		return this.info;
	}
	return null;
};

/** get all format of different locale
 * dateFormat
	"%m/%d/%Y"
	
   dateTimeFormat
	"%m/%d/%Y %H:%M"
	
   label
	"English"
	
   locale
	"en"
	
   timeFormat
	"%H:%M:%S"
 * @return {Object}
 */
Fdl.User.prototype.getLocaleFormat = function() {    
	if (this._data.localeFormat) {
		return this._data.localeFormat;
	}
	return null;
};

/** get document identificator associated with the user
 * @return {Number}
 */
Fdl.User.prototype.getUserDocumentIdentificator = function() {    
	if (this.info) {
		return parseInt(this.info.fid);
	}
	return null;
};
/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.Attribute
 * @namespace Fdl.Attribute
 * @param {Object} config
 */

Fdl.Attribute = function(config){
  if (config) {
    this._data=new Object();
    for (var name in config) {
      switch (name) {
      case 'id':
	this.id=config[name];
	break;
      case 'docid':
	this.famId=config[name];
	break;  
      case 'labelText':
	this.label=config[name];
	break;  
      case 'type':
      case 'options':
      case 'usefor':
      case 'mvisibility':
      case 'visibility':
	this[name]=config[name];
	break;    
      default:
	this._data[name]=config[name];
	break;
      }
    }

    this.rank = config.rank || 0 ;
    this.parentId = config.parentId || 0;
  }
};

Fdl.Attribute.prototype = {
    /** identificator of the attribute
      * @type Number */
    id: null,
    /** type of attribute : int, docid, date,...
      * @type String */
    type: null,
    /** family identificator
      * @type Number */
    famId: null,
    /** the node attribute where the attribute is inserted (could be null if top attribute)
      * @type String */
    parentId: null,	
    /** label of attribute use ::getLabel() to get it
      * @hide
      * @type String */
    label: null,	
    usefor: null,	
    options: null,
    visibility: null,
    mvisibility: null,
    options: new Object(),
    _isNode:null,
    _child:null,
    
    toString: function() {
	return 'Fdl.Attribute';
    },
    getLabel: function() {
	return this.label;
    },
    getVisibility: function() {
	return this.mvisibility;
    },
    getOption: function(optkey) {
	return this.options[optkey];
    },
    getParent: function() {
	if (! this.parentId) return null;
	var oa=this._family.getAttribute(this.parentId);
	return oa;
    },
    getChildAttributes: function() {
	if (this._childs) return this._childs;
	this._chids=[];
	var als=this._family.getAttributes();
	for (var aid in als) {
	    if (als[aid].parentId == this.id)
		this._chids.push(this._family.getAttribute(aid));
	}
	return this._chids;
    },
    /**
      * Verify if attribute is a leaf
      * @return {Boolean} return true if it is a leaf
      */
    isLeaf: function() { return (this._isNode!==null && (! this._isNode)); },
    /**
      * Verify if attribute is a node
      * @return {Boolean} return true if it is a node
      */
    isNode: function() { return (this._isNode!==null && this._isNode);  }
   
};
/**
  * get compatible filter criteria
  * @return {Array} of filter description object
  */
Fdl.Attribute.prototype.getFilterCriteria= function() {
    if (this._family) {
	var top=this._family.getSearchCriteria();
	if (top) {
	    if (top[this.type]) {
		if (this.type=="docid") {
		    if (this.relationFamilyId) {
			return top[this.type];
		    } else {
			var ftop=[];
			for (var i in top[this.type]) {
			    if (top[this.type][i].operator != '=~*') ftop.push(top[this.type][i]);
			}
			return ftop;
		    }
		} else return top[this.type];
	    } else return [];
	}
    }
    return false;  
};

/**
 * Test if attribute is sortable.
 * @return {Boolean} true if attribute is sortable
 */
Fdl.Attribute.prototype.isSortable=function(){
	if (this.isLeaf() &&
            (!this.inArray()) &&
            (this.type != 'longtext') &&
            (this.type != 'htmltext') &&
            (this.type != 'color') &&
            (this.type != 'image') &&
            (this.type != 'file')){
		return true ;
	} else {
		return false ;
	}
};

/**
 * @class Fdl.LeafAttribute
 * @extends Fdl.Attribute
 * @namespace Fdl.Attribute
 * @param {Object} config
 */
Fdl.LeafAttribute = function (config) {
  Fdl.Attribute.call(this,config);
  if (config) {
    for (var name in config) {
      switch (name) {
      case 'phpconstraint':
	this.constrain=config[name];
	break;      
      case 'ordered':
	this.rank=config[name];
	break;  
      case 'isInTitle':
	this.inTitle=config[name];
	break;      
      case 'isInAbstract':
	this.inAbstract=config[name];
	break;      
      case 'link':
	this[name]=config[name];
	break;       
      case 'needed':
	this[name]=config[name];
	break;      
      default:
	this._data[name]=config[name];
	break;
      }
    }
      if (!this.rank) this.rank=0;
  }
};
Fdl.LeafAttribute.prototype = new Fdl.Attribute();
Fdl.LeafAttribute.prototype._isNode =false;
Fdl.LeafAttribute.prototype.rank = 0;
Fdl.LeafAttribute.prototype.needed = null;
Fdl.LeafAttribute.prototype.inAbstract = null;
Fdl.LeafAttribute.prototype.inTitle = null;
/**
 * verify if attribute has a contraint defined
 * @return {Boolean} true if constrint detected
 */ 
Fdl.LeafAttribute.prototype.hasConstrain= function() {
      return this.constrain != '';
  };
Fdl.LeafAttribute.prototype.toString= function() {
      return 'Fdl.LeafAttribute';
  };

/**
 * Get associated value
 * @return {Any} return value of current document fot this attribute
 */
  /*
Fdl.LeafAttribute.prototype.getValue= function() {
  if (this._family) {
    return this._family.getValue(this.id);
  }
  return null;
};
*/
Fdl.LeafAttribute.prototype.hasInputHelp= function() {  
  return (this._data.phpfunc && this._data.phpfile && this.type!='enum');
};

/**
  * Verify if attribute is defined in a array
  * @return {Boolean} return true if is a part of array
  */
Fdl.LeafAttribute.prototype.inArray= function() { 
    if (this.isLeaf() && this.parentId && this.getParent().type=='array') return true;
    return false;  
};
/**
 * Get sort key
 * In main case it is the attribute id but in some case like relations attribute it is the title of relation
 * @return {String} return the sort key
 */
Fdl.LeafAttribute.prototype.getSortKey= function() { 
   return this.id;
};



/**
 * @class Fdl.TextAttribute
 * @extends Fdl.LeafAttribute
 * @namespace Fdl.Attribute
 * @param {Object} config
 */
Fdl.TextAttribute = function (config) {
  Fdl.LeafAttribute.call(this,config);
};
Fdl.TextAttribute.prototype = new Fdl.LeafAttribute();
Fdl.TextAttribute.prototype.toString= function() {
      return 'Fdl.TextAttribute';
};

/**
 * @class Fdl.EnumAttribute
 * Enum Attribute class
 * @extends Fdl.LeafAttribute 
 * @namespace Fdl.Attribute
 * @param {Object} config
 */
Fdl.EnumAttribute = function (config) {
  Fdl.LeafAttribute.call(this,config);
};
Fdl.EnumAttribute.prototype = new Fdl.LeafAttribute();
Fdl.EnumAttribute.prototype.toString= function() {
      return 'Fdl.EnumAttribute';
};
/**
 * return list of items for a enum attribute
 * @return {array} of object {key:'thefirst',label: 'my first key'}
 */
Fdl.EnumAttribute.prototype.getEnumItems= function() {
  if (this._data.enumerate) {
    var t=new Array();
    for (var i in this._data.enumerate) {
    	if (typeof this._data.enumerate[i] != 'function')
      t.push({key:i,label:this._data.enumerate[i]});
    }
    return t;
  }
  return null;
};
/**
 * return label for a key
 * @param {Object} config
 * <ul><li><b>key : </b>The key item</li>
 * </ul>
 * @return {String} the label, null if key not exists
 */
Fdl.EnumAttribute.prototype.getEnumLabel= function(config) {
    if (config && config.key) {
	if (this._data.enumerate) {
	    for (var i in this._data.enumerate) {
		if (i == config.key) return this._data.enumerate[i];
	    }	    
	}
    }
  return null;
};
/**
 * verify is enum accept several values
 * @return {Boolean} return true if accept several values, false if single value accepted
 */
Fdl.EnumAttribute.prototype.isMultiple= function() {  
  return this.getOption('multiple')=='yes';
};

/**
 * @class Fdl.MenuAttribute
 * Menu Attribute class
 * @extends Fdl.Attribute 
 * @namespace Fdl.Attribute
 * @param {Object} config
 */
Fdl.MenuAttribute = function (config) {
  Fdl.Attribute.call(this,config);
};
Fdl.MenuAttribute.prototype = new Fdl.Attribute();
Fdl.MenuAttribute.prototype.toString= function() {
      return 'Fdl.MenuAttribute';
};


/**
 * @class Fdl.ColorAttribute
 * Color Attribute class
 * @extends Fdl.LeafAttribute 
 * @namespace Fdl.Attribute
 * @param {Object} config
 */
Fdl.ColorAttribute = function (config) {
  Fdl.LeafAttribute.call(this,config);
};
Fdl.ColorAttribute.prototype = new Fdl.LeafAttribute();
Fdl.ColorAttribute.prototype.toString= function() {
      return 'Fdl.ColorAttribute';
};
/**
 * @class Fdl.ThesaurusAttribute
 * Thesaurus Attribute class
 * @extends Fdl.LeafAttribute 
 * @namespace Fdl.Attribute
 * @param {Object} config
 */
Fdl.ThesaurusAttribute = function (config) {
  Fdl.LeafAttribute.call(this,config);
};
Fdl.ThesaurusAttribute.prototype = new Fdl.LeafAttribute();
Fdl.ThesaurusAttribute.prototype.toString= function() {
      return 'Fdl.ThesaurusAttribute';
};


/**
 * @class Fdl.RelationAttribute
 * Relation Attribute class
 * @extends Fdl.LeafAttribute 
 * @namespace Fdl.Attribute
 * @param {Object} config
 */
Fdl.RelationAttribute = function (config) {
    Fdl.LeafAttribute.call(this,config);  
    if (this._data) this.relationFamilyId=this._data.format;
    if (config && config.relationFamilyId) this.relationFamilyId=config.relationFamilyId;
};
Fdl.RelationAttribute.prototype = new Fdl.LeafAttribute();
Fdl.RelationAttribute.prototype.toString= function() {
      return 'Fdl.RelationAttribute';
};
/**
 * return title of document relation
 * @deprecated
 * @return string the title of the document linked
 */
Fdl.RelationAttribute.prototype.getTitle= function() {
	alert('do not use relationAttribut::getTitle');
    return this._family.getValue(this.id+'_title');
};
/**
 * Get sort key
 * the title of relation
 * @return {String} return the sort key (null is it unsortable)
 */
Fdl.RelationAttribute.prototype.getSortKey= function() { 
   var atitle=this.getOption('doctitle');
   if (atitle) {
	   if (atitle=='auto') return this.id+'_title';
	   else return atitle;
   }
   return null;
};
/**
 * return possible document where could ne linked
 * @param string [TODO]...
 * @return array 
 */
Fdl.RelationAttribute.prototype.retrieveProposal= function(config) {    
    var data=this._family.context.retrieveData({app:'DATA',action:'DOCUMENT',
			       method:'retrieveproposal',
			       attributeId:this.id,
			       relationFamilyId:this.relationFamilyId,
			       id:(this._family)?(this._family.id?this._family.id:this._family.getProperty('fromid')):null},config);
    if (data) {
	if (! data.error) {
	    return data.proposal;
	} else {	
	    this._family.context.setErrorMessage(data.error);
	}
    } else {      
	this._family.context.setErrorMessage('retrieveProposal: no data');
    }
    return null;
};



/**
 * @class Fdl.DateAttribute
 * Date Attribute class
 * @extends Fdl.LeafAttribute 
 * @namespace Fdl.Attribute
 * @param {Object} config
 */
Fdl.DateAttribute = function (config) {
  Fdl.LeafAttribute.call(this,config);
};
Fdl.DateAttribute.prototype = new Fdl.LeafAttribute();
Fdl.DateAttribute.prototype.toString= function() {
      return 'Fdl.DateAttribute';
};



/**
 * @class Fdl.FileAttribute
 * File Attribute class
 * @extends Fdl.LeafAttribute 
 * @namespace Fdl.Attribute
 * @param {Object} config
 */
Fdl.FileAttribute = function (config) {
  Fdl.LeafAttribute.call(this,config);
};
Fdl.FileAttribute.prototype = new Fdl.LeafAttribute();
Fdl.FileAttribute.prototype.toString= function() {
      return 'Fdl.FileAttribute';
};
Fdl.FileAttribute.prototype.getUrl= function(v,documentId, config) {
    if (v) {
	var sinline='yes';
	var swidth=false;
	var stype=false;
	var spage=false;
	var index = -1;
	if (config) {
	    if (config.inline === false) sinline='no';
	    if (config.type) stype=config.type;
	    if (config.width) swidth=parseInt(config.width);
	    if (config.page!==null) spage=parseInt(config.page);
	    if (typeof(config.index) == 'number') {index =  parseInt(config.index); v=v[index];}
	}

	var p1=v.indexOf('|',0);
	var p2=v.indexOf('|',p1+1);
	if (p2 == -1) p2=v.length;
	
	if ((p1 >0) && (p2 > p1)) {
	    var vid=v.substring(p1+1,p2);
	    var url=this._family.context.url +'?app=FDL&action=EXPORTFILE&inline='+sinline+'&cache=no&vid='+vid+'&docid='+documentId+'&attrid='+this.id+'&index='+index;
	    if (swidth) url+='&width='+swidth;
	    if (stype) url+='&type='+stype;
	    if (spage!==false) url+='&page='+spage;
	    return url;
	}
    }
    return null;
};


Fdl.FileAttribute.prototype.getDavUrl= function(v,documentId) {
  data=this._family.context.retrieveData({app:'DATA',action:'DOCUMENT',method:'davurl',
	id:documentId,
	vid:this.getVaultId(v)});
  if (data) {
    if (! data.error) { 
      var url=data.url;
      return url;
       } else {
      this._family.context.setErrorMessage(data.error);
    }    
  }
  return null;
};
/* @deprecated
Fdl.FileAttribute.prototype.hasPDF= function(config) {
  var apdf=this.getOption('pdffile');
  if (apdf) {
    
    var vpdf=this._family.getValue(apdf);
    if (vpdf) {
      if (vpdf.indexOf('/pdf')>0) return true;
    }
  }
  return false;
}
*/
Fdl.FileAttribute.prototype.getFileName= function(v,config) {
  if (v) {
  	if (config && typeof(config.index) == 'number') {index =  parseInt(config.index); v=v[index];}
    var p1=v.indexOf('|',0);
    var p2=v.indexOf('|',p1+1);
    if ((p2 >0) && (p2 < v.length)) {
      return v.substring(p2+1,v.length);
    }
  }
  return null;
};
Fdl.FileAttribute.prototype.getVaultId= function(v) {
  if (v) {
    var p1=v.indexOf('|',0);
    var p2=v.indexOf('|',p1+1);

    if ((p1 >0) && (p2 > p1)) {
      var vid=v.substring(p1+1,p2);
      return vid;
    }
  }
  return null;
};



/**
 * @class Fdl.NumericAttribute
 * Numeric Attribute class
 * @extends Fdl.LeafAttribute 
 * @namespace Fdl.Attribute
 * @param {Object} config
 */
Fdl.NumericAttribute = function (config) {
  Fdl.LeafAttribute.call(this,config);
};
Fdl.NumericAttribute.prototype = new Fdl.LeafAttribute();
Fdl.NumericAttribute.prototype.toString= function() {
      return 'Fdl.NumericAttribute';
};

/**
 * @class Fdl.NodeAttribute
 * Node Attribute class
 * @extends Fdl.Attribute 
 * @namespace Fdl.Attribute
 * @param {Object} config
 */
Fdl.NodeAttribute = function (config) {
  Fdl.Attribute.call(this,config);
};
Fdl.NodeAttribute.prototype = new Fdl.Attribute();
Fdl.NodeAttribute.prototype._isNode =true;
Fdl.NodeAttribute.prototype.toString= function() {
      return 'Fdl.NodeAttribute';
};

/**
 * @class Fdl.ArrayAttribute
 * Array Attribute class
 * @extends Fdl.NodeAttribute 
 * @namespace Fdl.Attribute
 * @param {Object} config
 */
Fdl.ArrayAttribute = function (config) {
  Fdl.NodeAttribute.call(this,config);
    
};
Fdl.ArrayAttribute.prototype = new Fdl.NodeAttribute();
Fdl.ArrayAttribute.prototype.toString= function() {
      return 'Fdl.ArrayAttribute';
};

/**
 * return all attributes which compose the array
 * @return {Array} of Fdl.Attribute
 */
Fdl.ArrayAttribute.prototype.getElements= function() {
    return this.getChildAttributes();
};

Fdl.ArrayAttribute.prototype.getArrayValues= function(config) {
    var oas=this.getElements();
    var rv=[];
    var vc;

    if (oas.length > 0 && oas[0].getValue().length > 0) {
	// first find max rows
    	var i=0;
	for ( i=0;i<oas[0].getValue().length;i++) {
	    rv[i]=new Object();
	}

	for ( i=0; i< oas.length; i++) {
	    vc=oas[i].getValue();
	    for (var ic=0;ic<vc.length;ic++) {	    
		rv[ic][oas[i].id]=vc[ic];
	    }
	}
    }
    return rv;
};

/**
 * @class Fdl.TabAttribute
 * Tab Attribute class
 * @extends Fdl.NodeAttribute 
 * @namespace Fdl.Attribute
 * @param {Object} config
 */
Fdl.TabAttribute = function (config) {
  Fdl.NodeAttribute.call(this,config);
};
Fdl.TabAttribute.prototype = new Fdl.NodeAttribute();
Fdl.TabAttribute.prototype.toString= function() {
      return 'Fdl.TabAttribute';
};

/**
 * @class Fdl.FrameAttribute
 * Frame Attribute class
 * @extends Fdl.NodeAttribute 
 * @namespace Fdl.Attribute
 * @param {Object} config
 */
Fdl.FrameAttribute = function (config) {
  Fdl.NodeAttribute.call(this,config);
};
Fdl.FrameAttribute.prototype = new Fdl.NodeAttribute();
Fdl.FrameAttribute.prototype.toString= function() {
      return 'Fdl.FrameAttribute';
};

/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.SearchDocument
  * <pre><code>
  var C=new Fdl.Context({url:'http://my.freedom/'});    

  var s=C.getSearchDocument();
  if (s) {
    var f=new Fdl.DocumentFilter({criteria:[{operator:'~*',
					     left:'title',
				             right:'foo'}]});
    var dl=s.search({filter:f});	
    var p=dl.getDocuments();
    var doc;
    var ht+='&lt;table&gt;';
    for (var i in p) {
            doc=p[i];
            ht+='&lt;tr&gt;&lt;td&gt;'+i+'&lt;/td&gt;&lt;td&gt;'+doc.getProperty('id')
              +'&lt;/td&gt;&lt;td style="width:200px;overflow:hidden"&gt;'+doc.getTitle()+'&lt;/td&gt;&lt;td&gt;&lt;img src="'
              +doc.getIcon({'width':20})+'"&gt;&lt;/td&gt;&lt;td&gt;'+doc.getProperty('mdate')
              +'&lt;/td&gt;&lt;/tr&gt;';
     }
     ht+='&lt;/table&gt;';     
   }
 * </code></pre>
 * @extends Fdl.Document
 * @param {Object} config
 
 */
Fdl.SearchDocument = function (config) {
  Fdl.Document.call(this,config);
  if (config && config.filter) this.filter=config.filter;
};
Fdl.SearchDocument.prototype = new Fdl.Document();
Fdl.SearchDocument.prototype.toString= function() {
      return 'Fdl.SearchDocument';
};

Fdl.SearchDocument.prototype._count=-1;
/** offset where begin search , 0 is the first @type {Number}*/
Fdl.SearchDocument.prototype.start=0;
/** number of max documents returned @type {Number}*/
Fdl.SearchDocument.prototype.slice=50;
/** search mode must be 'word' or 'regexp' (default is word)@type {String}*/
Fdl.SearchDocument.prototype.mode='word';
/** the filtering criteria @type {Fdl.DocumentFilter}*/
Fdl.SearchDocument.prototype.filter=null;
/** the order by property @type {String}*/
Fdl.SearchDocument.prototype.orderBy=null;

/**
 * send a request to search documents 
 * @param {Object} config
 * <ul><li><b>start : </b>{Number} (optional) offset where begin search , 0 is the first</li>
 * <li><b>slice : </b> {Number}(optional) number of documents returned (default is 50)</li>
 * <li><b>mode : </b> {String}(optional) search mode must be 'word' or 'regexp' (default is word)</li>
 * <li><b>family : </b> {String}(optional) filter of document of the this family and descendants</li>
 * <li><b>filter : </b> {String/Fdl.DocumentFilter}(optional) sql filter such as : "us_mail ~* 'zoo.org'" </li>
 * <li><b>key : </b> {String}(optional) main keyword filter  </li>
 * <li><b>orderBy : </b> {String}(optional) the order by property  if withHighlight order is by default a pertinence degree else it is title by default</li>
 * <li><b>searchProperty : </b> {String}(optional) main property or attribute identicator where apply the key. The operator is ~* (insensitive case include) by default equal to any values ("svalues" property) </li>
 * <li><b>withHighlight : </b> {Boolean}(optional) to return highlight text in concordance with the main keyword</li>
 * </ul>
 * @return {Fdl.DocumentList} array of Fdl.Document
 */
Fdl.SearchDocument.prototype.search = function(config) {  
	if (config) {
		if (typeof (config.start) === "undefined") config.start=this.start;
		if (typeof (config.slice) === "undefined") config.slice=this.slice;
		if (typeof (config.mode) === "undefined") config.mode=this.mode;
	}
	var data=null;
	if (config && config.data) {
		data=config.data;
	} else {
		if (config && config.filter) {
			if (typeof(config.filter) == 'object') config.filter=JSON.stringify(config.filter);
			
		} else if (this.filter) {
			if (! config) config={};
			config.filter=JSON.stringify(this.filter);
		}
		 data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',method:'search'},config);
	}
	if (data) {
		this._info=data.info;
		if (! data.error) {
			data.context=this.context;
			return new Fdl.DocumentList(data);
		} else {
			this.context.setErrorMessage(data.error);
		}
	} else return false;
};



/**
 * search family document
 * @param config {object}
 * <ul><li><b>key</b>the title filter</li>
 * </ul>
 * @return {Fdl.DocumentList}  of Fdl.Family
 */
Fdl.SearchDocument.prototype.getFamilies = function(config) {
    if (! config) config=new Object();
    config.famid=-1;
    config.mode='regexp';
    config.searchProperty='title';
    config.slice="ALL";
    return this.search(config);
};   
/**
 * search sub family document
 * @param config {object}
 * <ul><li><b>famid</b>(Number) the family id</li>
 *     <li><b>controlCreation</b>(Boolean) control if user can create document of this family (default is false)</li>
 * </ul>
 * @return {Array} of Fdl.Family
 */
Fdl.SearchDocument.prototype.getSubFamilies = function(config) {
    if ((! config) || (!config.famid)) {
    	this.context.setErrorMessage('no family identificator set');
    	return null;
    }
    var data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',method:'getsubfamilies'},config);
    
    if (data) {
		this._info=data.info;
		if (! data.error) {
			data.context=this.context;
			return new Fdl.DocumentList(data);
		} else {
			this.context.setErrorMessage(data.error);
		}
	} 
   return null;
};   

/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.DocumentHistory
 * <pre><code>
var C=new Fdl.Context({url:window.location.protocol+'//'+window.location.hostname+'/freedom'});    
var d= C.getDocument({id:document.getElementById('docid').value});
if (d && d.isAlive()) {
    var H=d.getHistory();
    if (H) {
	var HI=H.getItems();
	var ht='&lt;table rules="all"&gt;';
	var hi;
	for (var i=0;i&lt;HI.length;i++) {
	    hi=HI[i];
	    ht+='&lt;tr&gt;&lt;td&gt;'+hi.id+'&lt;/td&gt;&lt;td&gt;'+hi.code+'&lt;/td&gt;&lt;td&gt;'+hi.date+'&lt;/td&gt;&lt;td&gt;'+hi.userName+'&lt;/td&gt;&lt;td&gt;'+hi.comment+'&lt;/td&gt;&lt;/tr&gt;';
        }
	ht+='&lt;/table&gt;';
 * </code></pre>
 * @param {Object} config
 */

Fdl.DocumentHistory = function(config){
    if (config) {
	var data;
	if (config.context) this.context=config.context;
	if (config.id) {
	    this.id = config.id;	     
	    this._data=null;
	    data=this.context.retrieveData({app:'DATA',action:'DOCUMENT',method:'history'},config);
	    if (data && data.error) {	
		this.error=data.error;
		return false;
	    }
	    if (data) {
		this.items=data.items;
		this.revisions=[];
		for (var i=0;i<data.revisions.length;i++) {
		    this.revisions.push(this.context.getDocument({data:data.revisions[i]})); 	
		}
	    }
	} 
    }
};

Fdl.DocumentHistory.prototype = {
	id: null,
	error:null,
        /** list of history items @type array */
	items:null,
        toString: function() {
           return 'Fdl.DocumentHistory';
        },
        /**
         * get history items objects
         * an item is compose of following fields
         * @param {Number} id (optional)the position an item, if no specify return all items
         * <ul><li><b>comment : </b> the comment</li>
         * <li><b>code : </b> specific key to describe action like 'CREATE', 'MODIFY'</li>
         * <li><b>date : </b> date of action</li>
         * <li><b>id : </b> document identificator</li>
         * <li><b>initid : </b>initial document identificator (always the same)</li>
         * <li><b>level : </b> message level <ul><li>1 : notice</li><li>2 : info</li><li>4 : message</li><li>8 : warning</li><li>16 : error</li></ul></li>
         * <li><b>userId : </b> the system identificator of the user</li>
         * <li><b>userName : </b>the user name</li>
         * </ul>
         * @return array of history items
         */
	getItems: function(id) {
            if (! id)   return this.items;
	    var it=[];
	    for (var i=0;i<this.items.length;i++) {
	      if (this.items[i].id==id) it.push(this.items[i]);
	    }
	    return it;
         },
        /**
         * get all document revised
         * @return array of Fdl.Document
         */
	getRevisions: function() {
            return this.revisions;
         }
};
/*!
 * Application Class
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.Application
 * @param {Object} config
 * @cfg {Fdl.context} context the current context connection
 * @cfg {String} name the application name
 * @constructor
 */

Fdl.Application = function(config) {
	if (config && config.context) {
		var data=null;
		this.context = config.context;

	    if (config.name)  {
	    	data=this.context.retrieveData({app:'DATA',action:'APPLICATION',method:'get'},config);
	    	if (data) this.completeData(data);
	    }
	    
	}

};

Fdl.Application.prototype = {
	/** application id @type {Numeric} */
	id : null,
	/** application name @type {String} */
	name : null,
	/** description @type {String} */
	description : null,
	/** icon url @type {String} */
	icon : null,
	/** version @type {Numeric} */
	version : null,
	/** internal data @type {Object} */
	_data:null,
	/** context @private @type {Fdl.Context} */
	context : null,
	affect : function(data) {
		if (data) {
			if (!data.error) {
				this._data = data;
				if (data)
					this.completeData(data);
				return true;
			} else {
				this.context.setErrorMessage(data.error);
			}
		}
		return false;
	},
	toString : function() {
		return 'Fdl.Application';
	}
};

Fdl.Application.prototype.completeData = function(data) {
	if (data) {
		if (! data.error) {
			this._data=data;
			this.id=this._data.id;
			this.name=this._data.name;
			this.description=this._data.description;
			this.label=this._data.label;
			this.available=this._data.available;
			this.icon=this._data.icon;
			this.displayable=this._data.displayable;
			this.version=this._data.version;
		} else {
			this.context.setErrorMessage(data.error);
		}
	}
};

/**
 * get value from application parameter
 * 
 * @param {object} config
 *            <ul>
 *            <li><b>id : </b>the param identificator</li>
 *            </ul>
 * @return {string}
 */
Fdl.Application.prototype.getParameter = function(config) {
	if (config && config.id) {
		var data = this.context.retrieveData( {
			app : 'DATA',
			action : 'APPLICATION',
			method : 'getParameter',
			id : config.id,
			name:this.name
		});
		if (data) {
			if (!data.error) {
				if (data.value)
					return data.value;
			} else {
				this.context.setErrorMessage(data.error);
			}
		}
	} else
		this.context.setErrorMessage("no parameter id set");

	return null;
};
/**
 * set new value to an application parameter
 * 
 * @param {object} config
 *            <ul>
 *            <li><b>id : </b>the param identificator</li>
 *            <li><b>value : </b>the value</li>
 *            </ul>
 * @return {string} the new value
 */
Fdl.Application.prototype.setParameter = function(config) {
	if (config && config.id) {
		var data = this.context.retrieveData( {
			app : 'DATA',
			action : 'APPLICATION',
			method : 'setParameter',
			name:this.name,
			id : config.id,
			value : config.value
		});
		if (data) {
			if (!data.error) {
				if (data.value)
					return data.value;
			} else {
				Fdl.setErrorMessage(data.error);
			}
		}
	} else
		Fdl.setErrorMessage("no parameter id set");

	return null;
};

/**
 * retrieve all actions executables
 * 
 * @param {object} config
 *            <ul>
 *            <li><b>reset:</b> Boolean (Optional) set to true to force an update from server
 *            </ul>
 * @return {Array} of Fdl.Action
 */
Fdl.Application.prototype.getExecutableActions = function(config) {
	if (config && config.reset) this._actions = null;
	if (this._actions) return this._actions;
	var data = this.context.retrieveData( {
		app : 'DATA',
		action : 'APPLICATION',
		method : 'getExecutableActions',
		name : this.name
	});
	if (data) {
		if (!data.error) {
			if (data.actions)
				this._actions=[];
				for (var i=0;i< data.actions.length;i++) {
					this._actions.push(new Fdl.Action({application:this,data:data.actions[i]}));
				}
				
			return this._actions;
		} else {
			this.context.setErrorMessage(data.error);
		}
	}
	return null;
};


/**
 * verify if user can execute action
 * 
 * @param {object} config
 *            <ul>
 *            <li><b> name : </b>the action name</li>
 *            </ul>
 * @return {Boolean} true if user can, false if not, null if error
 */
Fdl.Application.prototype.canExecuteAction = function(config) {
    if ((! config) || (! config.name)) {
		this.context.setErrorMessage(this.context._("data:action name not set"));
		return null;
    }
    if (! this._actions) {
    	this.getExecutableActions();
    }
    if (! this._actions) {
    	return null;
    }
    for (var i=0;i<this._actions.length;i++) {
    	if (this._actions[i].name==config.name) return true;
    }
	return false;
};
// ---------------------------------------
// add new methods to Fdl object to use application object
/**
 * @deprecated
 * @param {object} config
 *            <ul>
 *            <li><b>id : </b>the param identificator</li>
 *            </ul>
 * @return {string} the parameter's value
 */
Fdl.getParameter = function(config) {
	if (config) {
		if (config.id) {
			if (!this.application)
				this.application = new Fdl.Application();
			return this.application.getParameter(config);
		}
	}
};
/**
 * @deprecated
 * @param {object} config
 *            <ul>
 *            <li><b>id : </b>the param identificator</li>
 *            <li><b>value : </b>the value</li>
 *            </ul>
 * @return {string} the new value
 */
Fdl.setParameter = function(config) {
	if (config) {
		if (config.id) {
			if (!this.application)
				this.application = new Fdl.Application();
			return this.application.setParameter(config);
		}
	}
};

/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.Action
 * @param {Object} config
 * @cfg {Fdl.context} context the current context connection
 * @cfg {String} name the action name
 * @constructor
 */

Fdl.Action = function(config) {
	if (config) {
		if (config.application) this.application=config.application;
		if ((! this.context) && this.application.context) this.context=this.application.context;
	    if (config.data)  {
	    	this.completeData(config.data);
	    }
	    
	}

};

Fdl.Action.prototype = {
	id : null,
	/** action name @type {String} */
	name : null,
	/** label @type {String} */
	label : null,
	
	_data:null,
	/** context @type {Fdl.Context} */
	context : null,
	
	toString : function() {
		return 'Fdl.Action';
	}
};

Fdl.Action.prototype.completeData = function(data) {
	if (data) {
		if (! data.error) {
			this._data=data;
			this.id=this._data.id;
			this.name=this._data.name;
			this.label=this._data.label;
		} else {
			this.context.setErrorMessage(data.error);
		}
	}
};


/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.Family
 * @param {Object} config
 */
Fdl.Family = function (config) {
  Fdl.Document.call(this,config);
    if (this.getProperty('doctype') != 'C') {
	// it is not a family
	this._data=null;
	this._attributes=null;
	this.id=null;
	this.context.setErrorMessage('it is not a family document');
    }
};
Fdl.Family.prototype = new Fdl.Document();
Fdl.Family.prototype.toString= function() {
      return 'Fdl.Family';
};
/**
 * add a new attribute in family
 * @param {object} config
 * <ul>
 * <li><b> string attributeId : </b></li>
 * <li><b> string label : </b></li>
 * <li><b> string type : </b></li>
 * <li><b> string visibility : </b></li>
 * <li><b> string parent  : </b></li>
 * <li><b> bool needed : </b></li>
 * <li><b> bool inTitle : </b></li>
 * <li><b> bool inAbstract : </b></li>
 * <li><b> string link : </b></li>
 * <li><b> string elink : </b></li>
 * <li><b> int order : </b></li>
 * <li><b> string phpFile : </b></li>
 * <li><b> string phpFunction : </b></li>
 * <li><b> string constraint : </b></li>
 * <li><b> object options : </b></li>
 * </ul>
 * @return {Boolean} 
 */
Fdl.Family.prototype.addAttribute = function(config) {
    if (! config) {	
	this.context.setErrorMessage('addAttribute: need parameter');
	return false;
    }
    if ((! config.attributeId) || (! config.label) || (! config.type)) {	
	this.context.setErrorMessage('addAttribute: incomplete definition');
	return false;
    }
    config.method='addattribute';
    return this.callMethod(config);	
};

Fdl.Family.prototype.modifyAttribute = function(config) {
    if (! config) {	
	this.context.setErrorMessage('modifyAttribute: need parameter');
	return false;
    }
    if ((! config.attributeId)) {	
	this.context.setErrorMessage('modifyAttribute: incomplete definition');
	return false;
    }
    if (config.options && typeof config.options=='object') config.options=JSON.stringify(config.options);
   
    config.method='modifyattribute';
    return this.callMethod(config);	
};
Fdl.Family.prototype.removeAttribute = function(config) {
    if (! config) {	
	this.context.setErrorMessage('removeAttribute: need parameter');
	return false;
    }
    if ((! config.attributeId)) {	
	this.context.setErrorMessage('removeAttribute: incomplete definition');
	return false;
    }    
    config.method='removeattribute';
    return this.callMethod(config);	
};
/**
 * get value of parameter
 * @param {String} idParameter the parameter id
 * @return {String} the value of paramter
 */
Fdl.Family.prototype.getParameterValue = function(idParameter) {
    if (this._data) {
	var p=this._data.values.param;
	var tp=p.substring(1,p.length-1).split('][');
	var s;
	for (var i=0;i<tp.length;i++) {
	    s=tp[i].split('|');
	    if ((s.length==2) && (s[0]==idParameter)) {
		return s[1];
	    }
	}
    }
    return null;
};
/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.Workflow * 
 * @namespace Fdl.Document
 * @extends Fdl.Document
 * @param {Object}   config
 */
Fdl.Workflow = function (config) {
    if (config.needWorkflow !== false) config.needWorkflow=true; // to retrieve all information about definition of workflow
    Fdl.Document.call(this,config);
    if (this.getProperty('doctype') != 'W') {
	// it is not a workflow
	this._data=null;
	this._attributes=null;
	this.id=null;
	Fdl.setErrorMessage('it is not a workflow document');
    }
};
Fdl.Workflow.prototype = new Fdl.Document();
Fdl.Workflow.prototype.toString= function() {
      return 'Fdl.Workflow';
};
/**
 * 
 * @return {Array} Array of states.
 */
Fdl.Workflow.prototype.getStates = function() {
    if ((! this._data) || (! this._data.workflow)) return null;
    return this._data.workflow.states;   	
};



/**
 * 
 * @return {Array} Array of transitions.
 */
Fdl.Workflow.prototype.getTransitions = function() {
    if ((! this._data) || (! this._data.workflow)) return null;
    return this._data.workflow.transitions;   	
   	
};

/**
 * 
 * @return {Array} Array of transition types.
 */
Fdl.Workflow.prototype.getTransitionTypes = function() {   
    if ((! this._data) || (! this._data.workflow)) return null;
    return this._data.workflow.transitionTypes;   	
   	
};
/**
 * @param string start
 * @param string finish
 * @param string transitionType
 * @return {Boolean} True if successful.
 */
Fdl.Workflow.prototype.addTransition = function(config) {
    if ((! this._data) || (! this._data.workflow)) return null;
    
    var states=this.getStates();
    var types=this.getTransitionTypes();

    if (! states[config.start]) {
	Fdl.setErrorMessage('addTransition: start state not exists :'+config.start);
	return null;
    }
    if (! states[config.finish]) {
	Fdl.setErrorMessage('addTransition: finish state not exists :'+config.finish);
	return null;
    }
    if (! types[config.transitionType]) {
	Fdl.setErrorMessage('addTransition: transition type  not exists :'+config.transitionType);
	return null;
    }
    config.method='addTransition';
    return this.callMethod(config);    
};
/**
 * @param string start
 * @param string finish
 * @return {Boolean} True if successful.
 */
Fdl.Workflow.prototype.removeTransition = function(config) {
    if ((! this._data) || (! this._data.workflow)) return null;
    
    var states=this.getStates();
    var types=this.getTransitionTypes();

    if (! states[config.start]) {
	Fdl.setErrorMessage('addTransition: start state not exists :'+config.start);
	return null;
    }
    if (! states[config.finish]) {
	Fdl.setErrorMessage('addTransition: finish state not exists :'+config.finish);
	return null;
    }
    
    config.method='removeTransition';
    return this.callMethod(config);    
};
/**
 * @param string key
 * @param string activity 
 * @param string label
 * @return {Boolean} True if successful.
 */
Fdl.Workflow.prototype.addState = function(config) {
    if ((! this._data) || (! this._data.workflow)) return null;
    
    var states=this.getStates();

    if (! config) {
	Fdl.setErrorMessage('addState:  missing key');
	return null;
    }
    if (! config.key) {
	Fdl.setErrorMessage('addState:  missing key');
	return null;
    }
    var myRegxp = /^([a-z0-9_-]+)$/;
    if(myRegxp.test(config.key)==false) {
	Fdl.setErrorMessage('addState: syntax error in key , must be only alphanumeric:'+config.key);
	return null;
    }

    if (states[config.key]) {
	Fdl.setErrorMessage('addState:  state already exist :'+config.key);
	return null;
    }
    
    config.method='addState';
    return this.callMethod(config);    
};
/**
 * @param string key
 * @param string activity 
 * @param string label
 * @return {Boolean} True if successful.
 */
Fdl.Workflow.prototype.modifyState = function(config) {
    if ((! this._data) || (! this._data.workflow)) return null;
    
    var states=this.getStates();

    if (! config) {
	Fdl.setErrorMessage('modifystate:  missing key');
	return null;
    }
    if (! config.key) {
	Fdl.setErrorMessage('modifystate:  missing key');
	return null;
    }
   
    if (! states[config.key]) {
	Fdl.setErrorMessage('modifystate:  state not exist :'+config.key);
	return null;
    }
    
    config.method='modifystate';
    return this.callMethod(config);    
};

/**
 * @param string key
 * @return {Boolean} True if successful.
 */
Fdl.Workflow.prototype.removeState = function(config) {
    if ((! this._data) || (! this._data.workflow)) return null;
    
    var states=this.getStates();

    if (! config) {
	Fdl.setErrorMessage('removestate:  missing key');
	return null;
    }
    if (! config.key) {
	Fdl.setErrorMessage('removestate:  missing key');
	return null;
    }
   
    if (! states[config.key]) {
	Fdl.setErrorMessage('removestate:  state not exist :'+config.key);
	return null;
    }
    
    config.method='removestate';
    return this.callMethod(config);    
};

/**
 * @param string key
 * @param string label
 * @param string preMethod
 * @param string postMethod
 * @param array ask
 * @param bool noComment
 * @return {Boolean} True if successful.
 */
Fdl.Workflow.prototype.addTransitionType = function(config) {
    if ((! this._data) || (! this._data.workflow)) return null;
    
    
    var types=this.getTransitionTypes();
    if (! config) {
	Fdl.setErrorMessage('addTransitiontype:  missing key');
	return null;
    }
    if (! config.key) {
	Fdl.setErrorMessage('addTransitiontype:  missing key');
	return null;
    }
    if (types[config.key]) {
	Fdl.setErrorMessage('addTransitiontype: type already exists :'+config.key);
	return null;
    }
    
    config.method='addTransitionType';
    return this.callMethod(config);    
};
/**
 * @param string key
 * @param string label
 * @param string preMethod
 * @param string postMethod
 * @param array ask
 * @param bool noComment
 * @return {Boolean} True if successful.
 */
Fdl.Workflow.prototype.modifyTransitionType = function(config) {
    if ((! this._data) || (! this._data.workflow)) return null;
        
    var types=this.getTransitionTypes();
    if (! config) {
	Fdl.setErrorMessage('modifyTransitiontype:  missing key');
	return null;
    }
    if (! config.key) {
	Fdl.setErrorMessage('modifyTransitiontype:  missing key');
	return null;
    }
    if (! types[config.key]) {
	Fdl.setErrorMessage('modifyTransitiontype: type not exists :'+config.key);
	return null;
    }
    
    config.method='modifyTransitionType';
    return this.callMethod(config);    
};
/**
 * @return {Boolean} True if successful.
 * @param string key
 */
Fdl.Workflow.prototype.removeTransitionType = function(config) {
    if ((! this._data) || (! this._data.workflow)) return null;
    
    var types=this.getTransitionTypes();
    if (! config) {
	Fdl.setErrorMessage('removeTransitiontype:  missing key');
	return null;
    }
    if (! config.key) {
	Fdl.setErrorMessage('removeTransitiontype:  missing key');
	return null;
    }
    if (! types[config.key]) {
	Fdl.setErrorMessage('removeTransitiontype: type not exists :'+config.key);
	return null;
    }
    
    
    config.method='removeTransitionType';
    return this.callMethod(config);    
};
/**
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 */

/**
 * @class Fdl.GroupRequest
 * <pre><code>
  var C=new Fdl.Context({url:http://'my.freedom'});
  var g=C.createGroupRequest();
 
  g.addRequest({d:g.getDocument({id:9});
  g.addRequest({l:g.get('d').callMethod('lock')});
  g.addRequest({c:g.get('d').callMethod('getContent')});
  g.addRequest({a:g.get('d').callMethod('getAuthorizedFamilies')});
  g.addRequest({z:g.foreach('c').callMethod('lock')});
  var r=g.submit();
  // the result is :
  var mydoc=r.get('d');
  if (r.get('l')) alert('the doc '+mydoc.getTitle()+ 'is locked by me');
  else alert(r.getError('l'));
  var content=r.get('c');
  
  for (var ic=0;ic&lt;content.length;ic++) {
  	alert((ic+1)+') '+content[ic].getTitle());
  }
  var iter=r.get('z');
  alert('testing lock of content');
  for (var ic=0;ic&lt;iter.length;ic++) {
  	if (iter[ic].error) {
  	    alert((ic+1)+') lock failed for '+iter[ic].document.getTitle()+ ': &lt;span style="color:red"&gt;'+iter[ic].error+'&lt;/span&gt;');
  	} else {
  	    alert((ic+1)+') lock succeded for '+iter[ic].document.getTitle());
  	}
   }
 * </code></pre>
 * Usage with selection object
 * <pre><code>
    var C=new Fdl.Context({url:http://'my.freedom'});
    var s=new Fdl.DocumentSelection({selectionItems:[52283,47882,47219]});
	var g=C.createGroupRequest();
	g.addRequest({s:g.getSelection(s)});
	g.addRequest({locks:g.foreach('s').callMethod('lock')});
	var r=g.submit();
	var iter=r.get('locks');
    alert('testing lock of selection');
    for (var ic=0;ic&lt;iter.length;ic++) {
  	  if (iter[ic].error) {
  	    alert((ic+1)+') lock failed for '+iter[ic].document.getTitle()+ ': &lt;span style="color:red"&gt;'+iter[ic].error+'&lt;/span&gt;');
  	  } else {
  	    alert((ic+1)+') lock succeded for '+iter[ic].document.getTitle());
  	  }
    }
 * </code></pre>
 * @namespace Fdl.GroupRequest
 * @param {Object} config
 * @cfg {Fdl.Context} context the connection {@link Fdl.Context context}
 */
Fdl.GroupRequest = function (config) {
    if (config) {
	this.context=config.context;	
    }
    this.requestItems=[];
};
Fdl.GroupRequest.prototype = {
   /**
     * Connection context
     * @type Fdl.Context
     * @property
     */
    context:null,
   /**
     * Array of requests
     * @type Array
     * @property
     */
    requestItems:[]
};
Fdl.GroupRequest.prototype.toString= function() {
      return 'Fdl.GroupRequest';
};
/**
 * Add a new request to group
 * @param {object} request
 * 
 *
 * @return {Boolean}
 */
Fdl.GroupRequest.prototype.addRequest = function(request) {
    this.requestItems.push(request);
    return true;
};

/**
 * get information about a specific request
 * @param {String } name the identificator of the request
 * 
 *
 * @return {Object} the request information, null if not found
 */
Fdl.GroupRequest.prototype.getRequest = function(name) {
    for (var i=0;i<this.requestItems.length;i++) {
	if (this.requestItems[i][name]) return this.requestItems[i][name];
    }
    return null;
};

/**
 * to retrieve document from the server
 * @param {object} config {id:<document identificator>}
 * 
 * @return {Fdl.Document}
 */
Fdl.GroupRequest.prototype.getDocument = function(config) {    
    return {method:'',config:config};
};
/**
 * to save selection before call foreach
 * @param {Fdl.DocumentSelection} selection 
 * 
 * @return {Array} identificator objects
 */
Fdl.GroupRequest.prototype.getSelection = function(selection) {
    return {method:'getSelection',config:selection};
};
/**
 * Return request document to use it to call a method
 * @param {String} name Variable name
 * 
 * @return {Fdl.GroupRequestDocument}
 */
Fdl.GroupRequest.prototype.get = function(name) {
    return new Fdl.GroupRequestDocument({gr:this,name:name});
};
/**
 * Return request collection to use it to call a method on each document of the collection
 * @param {String} name Variable name
 * 
 * @return {Fdl.GroupRequestDocument}
 */
Fdl.GroupRequest.prototype.foreach = function(name) {    
    return new Fdl.GroupRequestCollection({gr:this,name:name});
};
/**
 * Send request to the server
 * 
 * 
 * @return {Fdl.GroupRequestResult} one response by request
 */
Fdl.GroupRequest.prototype.submit = function() {    
    if (this.context) {
	var r=this.context.retrieveData({app:'DATA',action:'GROUPREQUEST'},{request:JSON.stringify(this.requestItems)});
	if (r.error) {
	    this.context.setErrorMessage(r.error);
	    return null;
	} else {
	    return new Fdl.GroupRequestResult({gr:this,result:r});
	}
    }
    return null;
};
/**
 * @class Fdl.GroupRequestDocument
 * @namespace Fdl.GroupRequest
 * @param {Object} config
 * @cfg {Fdl.Context} context the connection {@link Fdl.Context context}
 */
Fdl.GroupRequestDocument = function (config) {
    if (config) {
	this.config=config;
    }
};
Fdl.GroupRequestDocument.prototype = {   
    /**
     * Return apply method description for call
     * @param method {String} the method to call
     * @param config {Object} argument for the method call
     */
    callMethod: function (method, config) {
	return {variable:this.config.name,method:method,config:config};
    },
    toString: function () {
	 return 'Fdl.GroupRequestDocument';
    }
    
};


/**
 * @class Fdl.GroupRequestCollection
 * @namespace Fdl.GroupRequest
 * @param {Object} config
 * @cfg {Fdl.Context} context the connection {@link Fdl.Context context}
 */
Fdl.GroupRequestCollection = function (config) {
    if (config) {
	this.config=config;
    }
};
Fdl.GroupRequestCollection.prototype = {   
    /**
     * Return apply method description for call
     * @param method {String} the method to call
     * @param config {Object} argument for the method call
     */
    callMethod: function (method, config) {
	return {iterative:true,variable:this.config.name,method:method,config:config};
    },
    toString: function () {
	 return 'Fdl.GroupRequestCollection';
    }
    
};



/**
 * @class Fdl.GroupRequestResult
 * @namespace Fdl.GroupRequest
 * @cfg {Fdl.GroupRequest} gr group request
 * @cfg {Object} result the server response
 * 
 */
Fdl.GroupRequestResult = function (config) {
	if (config) {
		if (config.gr) this.gr=config.gr;
		if (config.result) this.result=config.result;
	}
};
Fdl.GroupRequestResult.prototype = {   
		/**
		 * the group request caller
		 */ 
		gr:null,
		/**
		 * Return a request result
		 * @param name {String} the identificator of the request
		 */
		get: function (name) {
	if (this.gr) {
		var request=this.gr.getRequest(name);
		if (request) {
			if (this.result[name]) {
				var res1=this.result[name];
				if (res1.error) {
					this.gr.context.setErrorMessage('GroupRequestResult::get : '+res1.error);
					return false;
				} else if (res1.properties && res1.properties.id > 0) {
					var rd=this.gr.context.getDocument({data:res1});			
					try {
						if (rd[request.method]) {
							var rm=rd[request.method]({norequest:true});
							return rm;
						}
					}  catch (ex) {
					}
					return rd;
				} else {
					// not a document
					if (request.method && request.variable) {
						var rd=this.get(request.variable);
						if (rd) {
							try {
								if (request.iterative) {
									var ld;
									var lr=[];
									var ldr;
									var lerr='';
									for (var li=0;li<res1.iterative.length;li++) {
										lerr=res1.iterative[li].error;
										res1.iterative[li].error='';
										ld=this.gr.context.getDocument({data:res1.iterative[li]});
										try {
											if (ld[request.method]) {
												if (lerr) ldr=false;
												else ldr=ld[request.method]({norequest:true,data:res1.iterative[li]});					    
												res1.iterative[li].error=lerr;
												lr.push({error:lerr,document:ld,result:ldr});
											}
										} catch (ex) {
										}
									}
									return lr;
								} else if (rd[request.method]) {
									var rm=rd[request.method]({norequest:true,data:res1});
									return rm;
								}
							}  catch (ex) {
							}
						}
					}
				}
				return res1;		    
			} else {
				this.gr.context.setErrorMessage('GroupRequestResult::get :no result for '+name);
			}
		}

	}	
},
toString: function () {
	return 'Fdl.GroupRequestResult';
},
/**
 * Return error message for a specific request
 * @param name {String} the identificator of the request
 * @return  {String} error message - may be empty if no errors
 */
getError: function (name) {
	if (this.gr) {
		var request=this.gr.getRequest(name);
		if (request) {
			if (this.result[name]) {
				return this.result[name].error;
			}
		}
	}
}
};