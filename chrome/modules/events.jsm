var EXPORTED_SYMBOLS = ["applicationEvent"]

function MicroEvent(){};

MicroEvent.prototype = {
        
        subscribe   : function(event, fct, config){
            this._events = this._events || {};
            this._events[event] = this._events[event]   || [];
            this._events[event].push({ fct : fct, config : config});
            return this;
        },
        
        unsubscribe : function(event, fct){
            this._events = this._events || {};
            if(this._events.hasOwnProperty(event) === false  ) {
                return this;
            }
            var index = -1;
            for(var i = 0; i < this._events[event].length ; i++) {
                if (this._events[event][i].fct === fct) {
                    index = i;
                }
                break;
            }
            this._events[event].splice(index, 1);
            return this;
        },
        
        publish : function(event /* , args... */){
            var returnValue = true;
            this._events = this._events || {};
            if( event in this._events === false  )  return this;
            for(var i = 0; i < this._events[event].length; i++){
                var currentSubscriber = this._events[event][i];
                var scope;
                if (currentSubscriber.config && currentSubscriber.config.scope) {
                    scope = this._events[event][i].scope;
                }else {
                    scope = this;
                }
                if (!currentSubscriber.fct.apply(scope, Array.prototype.slice.call(arguments, 1))) {
                    returnValue = false;
                }
            }
            return returnValue;
        }
};

var applicationEvent = new MicroEvent();
