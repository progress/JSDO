/*global XMLHttpRequest:true, localStorage: true, sessionStorage: true, btoa:true*/
/*jslint nomen: true*/

(function() {
    // Pre-release code to detect enviroment and load required modules for Node.js
    // Requirements:
    // - XMLHttpRequest
    // - localStorage
    // - sessionStorage
    // - btoa

    // Notes:
    // Required packages should be installed before loading jsdo-node.
    // These packages are specified via package.json    
    // Node.js:
    // - xmlhttprequest
    // - node-localstorage
    // - base-64

    try {
        XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
        // xhrc = require("xmlhttprequest-cookie");
        // XMLHttpRequest = xhrc.XMLHttpRequest;
    } catch (e) {
        console.error("Error: JSDO library requires XMLHttpRequest object in Node.js.\n" +
            "Please install xmlhttprequest package.");
    }

    // If environment is NodeJS, load module node-localstorage
    var LocalStorage;
    if (typeof localStorage === "undefined") {
        try {
            var module = require('node-localstorage');
            LocalStorage = module.LocalStorage;
            localStorage = new LocalStorage('./scratch1');
        } catch (e) {
            console.error("Error: JSDO library requires localStorage and sessionStorage objects in Node.js.\n" +
                "Please install node-localstorage package.");
        }
    }

    if (typeof sessionStorage === "undefined" &&
        typeof LocalStorage !== "undefined") {
        sessionStorage = new LocalStorage('./scratch2');
    }

    // load module base-64
    try {
        if (typeof btoa === "undefined") {
            btoa = require("base-64").encode;
        }
    } catch (exception3) {
        console.error("Error: JSDO library requires btoa() function in Node.js.\n" +
            "Please install base-64 package.");
    }
}());
isNativeScript = false;
}
}

// If localStorage or sessionStorage is not defined,
// we need to load the corresponding support module

// If environment is NativeScript, load required modules
if (isNativeScript) {
    try {
        // load module nativescript-localstorage
        if (typeof sessionStorage === "undefined") {
            sessionStorage = require("" + pkg_nativescriptLocalstorage);
        }
        if (typeof localStorage === "undefined") {
            localStorage = require("" + pkg_nativescriptLocalstorage);
        }
    } catch (exception2) {
        console.error("Error: JSDO library requires localStorage and sessionStorage objects in NativeScript.\n" +
            "Please install nativescript-localstorage package.");
    }

    // load module base-64
    try {
        if (typeof btoa === "undefined") {
            btoa = require("" + pkg_base64).encode;
        }
    } catch (exception3) {
        console.error("Error: JSDO library requires btoa() function in NativeScript.\n" +
            "Please install base-64 package.");
    }
}

// If environment is NodeJS, load module node-localstorage
if (isNodeJS) {
    var LocalStorage;
    if (typeof localStorage === "undefined") {
        try {
            var module = require("" + pkg_nodeLocalstorage);
            LocalStorage = module.LocalStorage;
            localStorage = new LocalStorage('./scratch1');
        } catch (e) {
            console.error("Error: JSDO library requires localStorage and sessionStorage objects in Node.js.\n" +
                "Please install node-localstorage package.");
        }
    }

    if (typeof sessionStorage === "undefined" &&
        typeof LocalStorage !== "undefined") {
        sessionStorage = new LocalStorage('./scratch2');
    }

    // load module base-64
    try {
        if (typeof btoa === "undefined") {
            btoa = require("" + pkg_base64).encode;
        }
    } catch (exception3) {
        console.error("Error: JSDO library requires btoa() function in Node.js.\n" +
            "Please install base-64 package.");
    }
}
}());

(function() {

    /* Define these if not defined yet - they may already be defined if
     * progress.js was included first */
    if (typeof progress === "undefined") {
        progress = {};
    }

    if (typeof progress.data === "undefined") {
        progress.data = {};
    }

    progress.util = {};

    var STRING_OBJECT_TYPE = "String",
        DATE_OBJECT_TYPE = "Date",
        CHARACTER_ABL_TYPE = "CHARACTER";

    /**
     * Deferred class to provide access to ES6 and JQuery Promises.
     *
     * @class
     */
    progress.util.Deferred = /** @class */ (function() {
        function Deferred() {
            this._deferred = {};
        }

        /**
         * Returns a Promise object.
         */
        Deferred.prototype.promise = function() {
            var that = this;

            if (progress.util.Deferred.useJQueryPromises) {
                if (typeof($) !== 'undefined' && typeof($.Deferred) === 'function') {
                    this._deferred._jQuerydeferred = $.Deferred();
                    this._promise = this._deferred._jQuerydeferred.promise();
                } else {
                    throw new Error("JQuery Promises not found in environment.");
                }
            } else {
                this._promise = new Promise(function(resolve, reject) {
                    that._deferred.resolve = resolve;
                    that._deferred.reject = reject;
                });
            }

            if (this._resolveArguments || this._rejectArguments) {
                setTimeout(function() {
                    if (that._resolveArguments) {
                        that.resolve.apply(that, that._resolveArguments);
                    } else if (that._rejectArguments) {
                        that.reject.apply(that, that._rejectArguments);
                    }
                }, 500);
            }

            // return null;
            return this._promise;

        };

        /**
         * Calls the underlying resolve() method.
         */
        Deferred.prototype.resolve = function(arg1, arg2, arg3) {
            if (this._promise) {
                if (this._deferred._jQuerydeferred) {
                    this._deferred._jQuerydeferred.resolve.apply(this, arguments);
                } else {
                    var object = progress.util.Deferred.getParamObject1(arg1, arg2, arg3);
                    this._deferred.resolve(object);
                }
            } else {
                this._resolveArguments = arguments;
            }
        };

        /**
         * Calls the underlying reject() method.
         */
        Deferred.prototype.reject = function(arg1, arg2, arg3) {
            if (this._promise) {
                if (this._deferred._jQuerydeferred) {
                    this._deferred._jQuerydeferred.reject.apply(this, arguments);
                } else {
                    var object = progress.util.Deferred.getParamObject1(arg1, arg2, arg3);
                    this._deferred.reject(object);
                }
            } else {
                this._rejectArguments = arguments;
            }
        };

        /**
         * @property {boolean} useJQueryPromises - Tells the Deferred object to use jQuery Promises.
         */
        Deferred.useJQueryPromises = false;

        /**
         * Returns a deferred object based on a collection.
         */
        Deferred.when = function(deferreds) {
            if (progress.util.Deferred.useJQueryPromises) {
                return $.when.apply($, deferreds);
            } else {
                return Promise.all(deferreds);
            }
        }

        /**
         * Returns an object with the parameters to resolve()/reject().
         */
        Deferred.getParamObject1 = function(arg1, arg2, arg3) {
            var object = {},
                objectName;

            try {
                if ((typeof(arg1) === "undefined") || (arg1 === null)) {
                    object.result = arg2;
                    object.info = arg3;
                } else {
                    // Map some object name to use a particular property name
                    // We should probably spend some time down the line to truly use
                    // ES6 promises.
                    if (arg1 instanceof progress.data.JSDOSession) {
                        objectName = "jsdosession";
                    } else if (arg1 instanceof progress.data.AuthenticationProvider) {
                        objectName = "provider";
                    } else if (arg1 instanceof progress.data.JSDO) {
                        objectName = "jsdo";
                    } else if (typeof(arg1) === "number") {
                        objectName = "result";
                    } else {
                        objectName = typeof(arg1);
                    }

                    object[objectName] = arg1;
                    if (objectName === "jsdo") {
                        object.success = arg2;
                        if (arg3 && arg3.xhr) {
                            object.request = arg3;
                        } else if (arg3 && arg3.batch) {
                            object.request = arg3;
                        } else {
                            object.info = arg3;
                        }
                    } else {
                        if (objectName === "result") {
                            object.info = arg2;
                            if (arg3) {
                                object.info2 = arg3;
                            }
                        } else {
                            object.result = arg2;
                            object.info = arg3;
                        }
                    }
                }
            } catch (e) {
                console.log("Error: Undetermined argument in getParamObject() call.");
            }

            return object;
        }

        /**
         * Returns an object with the parameters to resolve()/reject() based on the Promise type.
         */
        Deferred.getParamObject = function(arg1, arg2, arg3) {
            var object = {};

            if (progress.util.Deferred.useJQueryPromises) {
                object = progress.util.Deferred.getParamObject1(arg1, arg2, arg3);
            } else {
                if (typeof(arg1) === "undefined") {
                    object.result = arg2;
                    object.info = arg3;
                    arg1 = object;
                }
                return arg1;
            }

            return object;
        };

        return Deferred;
    }());

    /**
     * Utility class that allows subscribing and unsubscribing from named events.
     *
     * @returns {progress.util.Observable}
     */
    progress.util.Observable = function() {
        /*
         * Example format of the events object.  Some event delegates may only
         * have a function setup, others may optionally have scope, and possibly an operation filter
         *
         * var  events = {
         *   afterfill : [{
         *     scope : {},  // this is optional
         *     fn : function () {},
         *     operation : 'getCustomers'  // this is optional
         *   }, ...]
         *
         * }
         *
         *
         *
         */

        /*
         * remove the given function from the array of observers
         */
        function _filterObservers(observers, fn, scope, operation) {
            return observers.filter(function(el) {
                if (el.fn !== fn || el.scope !== scope || el.operation !== operation) {
                    return el;
                }
            }, this);
        }

        /*
         * validate the arguments passed to the subscribe function
         */
        this.validateSubscribe = function(args, evt, listenerData) {

            if (args.length >= 2 && (typeof args[0] === 'string') && (typeof args[1] === 'string')) {
                listenerData.operation = args[1];
                listenerData.fn = args[2];
                listenerData.scope = args[3];

            } else if (args.length >= 2 && (typeof args[0] === 'string') && (typeof args[1] === 'function')) {
                listenerData.operation = undefined;
                listenerData.scope = args[2];
                listenerData.fn = args[1];
            } else {
                throw new Error();
            }

        };


        /*
         * bind the specified function so it receives callbacks when the
         * specified event name is called. Event name is not case sensitive.
         * An optional scope can be provided so that the function is executed
         * in the given scope.  If no scope is given, then the function will be
         * called without scope.
         *
         * If the same function is registered for the same event a second time with
         * the same scope the original subscription is removed and replaced with the new function
         * to be called in the new scope.
         *
         * This method has two signatures.
         *
         * Signature 1:
         * @param evt    The name of the event to bind a handler to. String. Not case sensitive.
         * @param fn     The function callback for the event . Function.
         * @param scope  The scope the function is to be run in. Object. Optional.
         *
         * Signature 2:
         *
         * @param evt        The name of the event to bind a handler to. String. Not case sensitive
         * @param operation  The name of the operation to bind to. String. Case sensitive.
         * @param fn         The function callback for the event . Function.
         * @param scope      The scope the function is to be run in. Object. Optional.

         */
        this.subscribe = function(evt, operation, fn, scope) {
            var listenerData,
                observers;

            if (!evt) {
                throw new Error(progress.data._getMsgText("jsdoMSG037", this.toString(), "subscribe"));
            }

            if (typeof evt !== 'string') {
                throw new Error(progress.data._getMsgText("jsdoMSG033", this.toString(),
                    "subscribe", progress.data._getMsgText("jsdoMSG039")));
            }

            this._events = this._events || {};
            evt = evt.toLowerCase();
            listenerData = { fn: undefined, scope: undefined, operation: undefined };

            try {
                this.validateSubscribe(arguments, evt, listenerData);
            } catch (e) {
                throw new Error(progress.data._getMsgText("jsdoMSG033", this.toString(),
                    "subscribe", e.message));
            }

            observers = this._events[evt] || [];

            // make sure we don't add duplicates
            observers = _filterObservers(observers, listenerData.fn,
                listenerData.scope, listenerData.operation);
            observers.push(listenerData);
            this._events[evt] = observers;

            return this;
        };

        /*
         * remove the specified function so it no longer receives events from
         * the given name. event name is not case sensitive.
         *
         * This method has two signaturues.
         * Signature 1:
         * @param evt    Required. The name of the event for which to unbind the given function. String.
         * @param fn     Required. The function to remove from the named event. Function.
         * @param scope  Optional. The function scope in which to remove the listener. Object.
         *
         * Signature 2:
         *
         * @param evt       Required. The name of the event for which to unbind the given function. 
                            String. Not case sensitive
         * @param operation Required.  The name of the operation to receive events. String. Case Sensitive
         * @param fn        Required. The function to remove from the named event. Function.
         * @param scope     Optional. The function scope in which to remove the listener. Object.
         *
         */
        this.unsubscribe = function(evt, operation, fn, scope) {
            var listenerData,
                observers;

            if (!evt) {
                throw new Error(progress.data._getMsgText("jsdoMSG037", this.toString(), "unsubscribe"));
            }

            if (typeof evt !== 'string') {
                throw new Error(progress.data._getMsgText("jsdoMSG033", this.toString(),
                    "unsubscribe", progress.data._getMsgText("jsdoMSG037")));
            }

            this._events = this._events || {};
            evt = evt.toLowerCase();
            listenerData = { fn: undefined, scope: undefined, operation: undefined };
            try {
                this.validateSubscribe(arguments, evt, listenerData);
            } catch (e) {
                //  throw new Error("Invalid signature for unsubscribe. " + e.message);
                throw new Error(progress.data._getMsgText("jsdoMSG033", this.toString(),
                    "unsubscribe", e.message));
            }

            observers = this._events[evt] || [];
            if (observers.length > 0) {
                this._events[evt] = _filterObservers(observers, listenerData.fn,
                    listenerData.scope, listenerData.operation);
            }

            return this;
        };

        /*
         * trigger an event of the given name, and pass the specified data to
         * the subscribers of the event. Event name is not case sensitive.
         * A variable numbers of arguments can be passed as arguments to the event handler.
         *
         * This method has two signatures
         * Signature 1:
         * @param evt  The name of the event to fire.  String.  Not case sensitive.
         * @param operation The name of the operation. String.  Case sensitive
         * @param args Optional.  A variable number of arguments to pass to the event handlers.
         *
         * Signature 2:
         * @param evt  The name of the event to fire. String.  Not case sensitive
         * @param args Optional.  A variable number of arguments to pass to the event handlers.
         */
        this.trigger = function(evt, operation, args) {
            var observers,
                op;

            if (!evt) {
                throw new Error(progress.data._getMsgText("jsdoMSG037", this.toString(), "trigger"));
            }

            this._events = this._events || {};
            evt = evt.toLowerCase();
            observers = this._events[evt] || [];
            if (observers.length > 0) {
                args = Array.prototype.slice.call(arguments);

                if ((arguments.length >= 2) &&
                    (typeof evt === 'string') &&
                    (typeof operation === 'string')) {
                    // in alt format the second argument is the event name, 
                    // and the first is the operation name
                    op = operation;
                    args = args.length > 2 ? args.slice(2) : [];
                } else if (arguments.length >= 1 && (typeof evt === 'string')) {
                    op = undefined;
                    args = args.length > 1 ? args.slice(1) : [];
                } else {
                    throw new Error(progress.data._getMsgText("jsdoMSG033", this.toString(), "trigger"));
                }

                observers.forEach(function(el) {
                    if (el.operation === op) {
                        el.fn.apply(el.scope, args);
                    }
                });

            }

            return this;
        };

        // unbind all listeners from the given event. If the
        // evt is undefined, then all listeners for all events are unbound
        // evnt name is not case sensitive
        // @param evt  Optional. The name of the event to unbind.  If not passed, then all events are unbound
        this.unsubscribeAll = function(evt, operation) {
            var observers;

            if (evt) {
                this._events = this._events || {};
                if (typeof evt === 'string') {
                    evt = evt.toLowerCase();
                    observers = this._events[evt] || [];

                    observers.forEach(function(el) {
                        if (el.operation) {
                            this.unsubscribe(evt, el.operation, el.fn, el.scope);
                        } else {
                            this.unsubscribe(evt, el.fn, el.scope);
                        }
                    }, this);
                }
            } else {
                this._events = {};
            }

            return this;
        };
    };


    /**
     * Utility class that saves/reads data to localStorage
     *
     * @returns {progress.data.LocalStorage}
     */
    progress.data.LocalStorage = function LocalStorage() {

        /*global localStorage */
        if (typeof localStorage === "undefined") {
            // "progress.data.LocalStorage: No support for localStorage."
            throw new Error(progress.data._getMsgText("jsdoMSG126", "progress.data.LocalStorage", "localStorage"));
        }


        // "Methods"

        this.saveToLocalStorage = function(name, dataObj) {
            localStorage.setItem(name, JSON.stringify(dataObj));
        };

        this.readFromLocalStorage = function(name) {

            var jsonStr = localStorage.getItem(name),
                dataObj = null;

            if (jsonStr !== null) {
                try {
                    dataObj = JSON.parse(jsonStr);
                } catch (e) {
                    dataObj = null;
                }
            }
            return dataObj;
        };

        this.clearLocalStorage = function(name) {
            localStorage.removeItem(name);
        };

    }; // End of LocalStorage


    /////////////////////////////////////////////////////////////////////////////////////////
    //        Utility Functions

    /*
     * Converts the specified filter object to an OpenEdge ABL Where String.
     *
     * @param tableRef  - handle to the table in jsdo, where string is applied to.
     * @param filter - the filter object to convert.
     *
     * @returns - translated OE where string.
     */
    progress.util._convertToABLWhereString = function(tableRef, filter) {
        var result = [],
            logic = filter.logic || "and",
            idx,
            length,
            field,
            fieldInfo,
            type,
            format,
            operator,
            value,
            ablType,
            //filters = (filter.filters) ? filter.filters : [filter],
            filters = filter.filters || [filter],

            whereOperators = {
                eq: "=",
                neq: "<>",
                gt: ">",
                gte: ">=",
                lt: "<",
                lte: "<=",
                contains: "INDEX",
                doesnotcontain: "INDEX",
                endswith: "R-INDEX",
                startswith: "BEGINS",
                isnull: "ISNULL",
                isnotnull: "ISNOTNULL",
                isempty: "ISEMPTY",
                isnotempty: "ISNOTEMPTY"
            };

        for (idx = 0, length = filters.length; idx < length; idx += 1) {
            filter = filters[idx];
            field = filter.field;
            value = filter.value;

            if (filter.filters) {
                filter = progress.util._convertToABLWhereString(tableRef, filter);
            } else {
                // Use original field name instead of serialized name
                if (field && tableRef._name) {
                    fieldInfo = tableRef._jsdo[tableRef._name]._fields[field.toLowerCase()];
                    if (fieldInfo && fieldInfo.origName) {
                        field = fieldInfo.origName;
                    }
                }

                operator = whereOperators[filter.operator];

                if (operator === undefined) {
                    throw new Error("The operator " + filter.operator + " is not valid.");
                }

                switch (filter.operator) {
                    case "isnull":
                    case "isnotnull":
                    case "isempty":
                    case "isnotempty":
                        value = undefined;
                        break;
                }

                if (operator && value !== undefined) {
                    type = progress.util._getObjectType(value);

                    // We need to build a template format string for the where string. 
                    // We'll first add positional info for the value
                    if (type === STRING_OBJECT_TYPE) {
                        format = "'{1}'";
                        value = value.replace(/'/g, "~'");
                    } else if (type === DATE_OBJECT_TYPE) {
                        ablType = tableRef._getABLType(filter.field);
                        if (ablType === "DATE") {
                            format = "DATE({1:MM, dd, yyyy})";
                        } else if (ablType === "DATETIME-TZ") {
                            // zzz here means to translate timezone offset into minutes
                            format = "DATETIME-TZ({1:MM, dd, yyyy, hh, mm, ss, fff, zzz})";
                        } else {
                            format = "DATETIME({1:MM, dd, yyyy, hh, mm, ss, fff})";
                        }
                    } else {
                        format = "{1}";
                    }

                    // Most where strings are in the format: field operator value. Ex. custnum < 100
                    // An exception to this is INDEX() and R-INDEX() which have format: operator field value
                    // Ex. R-INDEX(name, "LTD")
                    if (operator === "INDEX" || operator === "R-INDEX") {
                        if (type !== STRING_OBJECT_TYPE) {
                            throw new Error("Error parsing filter object. The operator " + filter.operator +
                                " requires a string value");
                        }
                        if (filter.operator === "doesnotcontain") {
                            format = "{0}(" + "{2}, " + format + ") = 0";
                        } else if (filter.operator === "contains") {
                            format = "{0}(" + "{2}, " + format + ") > 0";
                        } else { // else filter.operator = "endswith"
                            format = "{2} MATCHES '*{1}'";
                        }
                    } else {
                        format = "{2} {0} " + format;
                    }

                    filter = progress.util._format(format, operator, value, field);
                } else if (operator && value === undefined) {
                    if (filter.operator === "isempty" || filter.operator === "isnotempty") {
                        ablType = tableRef._getABLType(field);
                        if (ablType !== CHARACTER_ABL_TYPE) {
                            throw new Error("Error parsing filter object. The operator " + filter.operator +
                                " requires a CHARACTER field");
                        }
                        if (filter.operator === "isempty") {
                            format = "{2} = ''";
                        } else if (filter.operator === "isnotempty") {
                            format = "{2} <> ''";
                        }
                    } else {
                        if (filter.operator === "isnull") {
                            format = "{2} = ?";
                        } else if (filter.operator === "isnotnull") {
                            format = "{2} <> ?";
                        } else {
                            format = "{2} {0} ?";
                        }
                    }

                    // format, operator {0}, value {1}, field {2}
                    filter = progress.util._format(format, operator, value, field);
                }
            }

            result.push(filter);
        }

        filter = result.join(" " + logic + " ");

        if (result.length > 1) {
            filter = "(" + filter + ")";
        }

        return filter;
    };


    /*
     * Converts the specified filter object to an SQL Query String.
     *
     * @param tableName  - tableName of table in jsdo, where clause is applied to.
     * @param filter - the filter object to convert.
     *
     * @returns - translated SQL where clause.
     */
    progress.util._convertToSQLQueryString = function(tableRef, filter, addSelect) {
        var result = [],
            logic = filter.logic || "and",
            idx,
            length,
            field,
            type,
            format,
            operator,
            value,
            fieldFormat,
            filters = filter.filters || [filter],
            filterStr,
            usingLike = true,

            whereOperators = {
                eq: "=",
                neq: "!=",
                gt: ">",
                gte: ">=",
                lt: "<",
                lte: "<=",
                contains: "LIKE",
                doesnotcontain: "NOT LIKE",
                endswith: "LIKE",
                startswith: "LIKE",
                isnull: "ISNULL",
                isnotnull: "ISNOTNULL",
                isempty: "ISEMPTY",
                isnotempty: "ISNOTEMPTY"
            };

        if (typeof addSelect === "undefined") {
            addSelect = false;
        }

        for (idx = 0, length = filters.length; idx < length; idx += 1) {
            filter = filters[idx];
            field = filter.field;
            value = filter.value;

            if (filter.filters) {
                filterStr = progress.util._convertToSQLQueryString(tableRef, filter, false);
            } else {
                operator = whereOperators[filter.operator];

                if (operator === undefined) {
                    throw new Error("The operator " + filter.operator + " is not valid.");
                }

                switch (filter.operator) {
                    case "isnull":
                    case "isnotnull":
                    case "isempty":
                    case "isnotempty":
                        value = undefined;
                        break;
                }

                if (operator && value !== undefined) {
                    type = progress.util._getObjectType(value);

                    if (operator === "LIKE" || operator === "NOT LIKE") {
                        if (type !== STRING_OBJECT_TYPE) {
                            throw new Error("Error parsing filter object. The operator " + filter.operator +
                                " requires a string value");
                        }
                    }

                    if (type === STRING_OBJECT_TYPE) {
                        format = "'{1}'";
                        value = value.replace(/'/g, "''");
                    } else if (type === DATE_OBJECT_TYPE) {
                        fieldFormat = tableRef._getFormat(field);
                        if (fieldFormat === "date") {
                            format = "'{1:yyyy-MM-dd}'";
                        } else if (fieldFormat === "date-time") {
                            format = "{1:#ISO(iso)}";
                        } else if (fieldFormat === "time") {
                            format = "'{1:FFF}'";
                        }
                    } else {
                        format = "{1}";
                    }

                    // We need to build a template format string for the where string. 
                    // We'll first add positional info for the value, which is represented by {1}
                    if (filter.operator === "startswith") {
                        format = "'{1}%'";
                    } else if (filter.operator === "endswith") {
                        format = "'%{1}'";
                    } else if (filter.operator === "contains" || filter.operator === "doesnotcontain") {
                        format = "'%{1}%'";
                    } else {
                        usingLike = false;
                    }

                    if (usingLike) {
                        value = value.replace(/%/g, '\\%');
                        value = value.replace(/_/g, '\\_');
                    }

                    format = "{2} {0} " + format;
                    filterStr = progress.util._format(format, operator, value, field);
                } else if (operator && value === undefined) {
                    if (filter.operator === "isempty" || filter.operator === "isnotempty") {
                        type = tableRef._fields[field.toLowerCase()].type;
                        if (type !== STRING_OBJECT_TYPE.toLowerCase()) {
                            throw new Error("Error parsing filter object. The operator " + filter.operator +
                                " requires a string field");
                        }
                        if (filter.operator === "isempty") {
                            format = "{2} = ''";
                        } else if (filter.operator === "isnotempty") {
                            format = "{2} != ''";
                        }
                    } else {
                        if (filter.operator === "isnull") {
                            format = "{2} IS NULL";
                        } else if (filter.operator === "isnotnull") {
                            format = "{2} IS NOT NULL";
                        } else {
                            format = "{2} {0} NULL";
                        }
                    }

                    // format, operator {0}, value {1}, field {2}					
                    filterStr = progress.util._format(format, operator, value, field);
                }
            }

            result.push(filterStr);
        }

        filterStr = result.join(" " + logic + " ");

        if (result.length > 1) {
            filterStr = "(" + filterStr + ")";
        }

        if (addSelect === true) {
            filterStr = "SELECT * FROM " + tableRef._name + " WHERE " + filterStr;
        }

        return filterStr;
    };


    /*
     * Returns the object type; Example "String", "Date"
     * Constants for object type values are defined above.
     *
     * @param value - the object whose type is returned
     */
    progress.util._getObjectType = function(value) {
        // Returns [object xxx]. Removing [object ]
        return Object.prototype.toString.call(value).slice(8, -1);
    };


    /*
     * Substitutes in a variable number of arguments into specified format string (with place-holders)
     *
     * @param fmt - the format string with place-holders, eg. "{0} text {1}".
     *
     * @returns - formatted string.
     */
    progress.util._format = function(fmt) {
        /*jslint regexp: true*/
        var values = arguments,
            formatRegExp = /\{(\d+)(:[^\}]+)?\}/g;
        /*jslint regexp: false*/

        return fmt.replace(formatRegExp, function(match, index, placeholderFormat) {
            var value = values[parseInt(index, 10) + 1];

            return progress.util._toString(value, placeholderFormat ? placeholderFormat.substring(1) : "");
        });

    };

    /*
     * Converts the specified value param to a string.
     *
     * @param value  - object to convert
     * @param fmt - optional format string with place-holders, eg. "MM dd yyyy".
     *
     * @returns - converted string.
     */
    progress.util._toString = function(value, fmt) {
        var str;

        if (fmt) {
            if (progress.util._getObjectType(value) === "Date") {
                return progress.util._formatDate(value, fmt);
            }
        }

        if (typeof value === "number") {
            str = value.toString();
        } else {
            str = (value !== undefined ? value : "");
        }

        return str;
    };

    /*
     * Accepts string representing number and optionally pads it with "0"'s to conform to 
     * specified number of digits.
     *
     * @param number  - string representing number to pad.
     * @param digit - number of digits desired for padded string. If not specified, default is 2.
     *
     * @returns - padded string representing number.
     */
    progress.util._pad = function(number, digits) {
        var zeros = ["", "0", "00", "000", "0000"],
            end;

        number = String(number);
        digits = digits || 2;
        end = digits - number.length;

        if (end) {
            return zeros[digits].substring(0, end) + number;
        }
        return number;
    };

    /*
     * Converts the specified date param to a string.
     *
     * @param date  - date object to convert
     * @param fmt - format string with place-holders, eg. "MM dd yyyy".
     *
     * @returns - converted string.
     */
    progress.util._formatDate = function(date, format) {
        /*jslint regexp: true*/
        var dateFormatRegExp =
            /dd|MM|yyyy|hh|mm|fff|FFF|ss|zzz|iso|"[^"]*"|'[^']*'/g;
        /*jslint regexp: false*/

        return format.replace(dateFormatRegExp, function(match) {
            var minutes,
                result,
                sign;

            if (match === "dd") {
                result = progress.util._pad(date.getDate());
            } else if (match === "MM") {
                result = progress.util._pad(date.getMonth() + 1);
            } else if (match === "yyyy") {
                result = progress.util._pad(date.getFullYear(), 4);
            } else if (match === "hh") {
                result = progress.util._pad(date.getHours());
            } else if (match === "mm") {
                result = progress.util._pad(date.getMinutes());
            } else if (match === "ss") {
                result = progress.util._pad(date.getSeconds());
            } else if (match === "fff") {
                result = progress.util._pad(date.getMilliseconds(), 3);
            } else if (match === "FFF") {
                result = String(date.getTime());
            } else if (match === "zzz") {
                // timezone is returned in minutes
                minutes = date.getTimezoneOffset();
                sign = minutes < 0;
                result = (sign ? "+" : "-") + minutes;
            } else if (match === "iso") {
                result = date.toISOString();
            }

            return result !== undefined ? result : match.slice(1, match.length - 1);
        });
    };

    /*
     * Processes settings in a jsdoSettings object.
     * This method is used by project templates.
     */
    progress.util.jsdoSettingsProcessor = function jsdoSettingsProcessor(jsdoSettings) {
        if (typeof jsdoSettings === 'object') {
            if (jsdoSettings.authenticationModel === undefined || jsdoSettings.authenticationModel === "") {
                jsdoSettings.authenticationModel = "ANONYMOUS";
            }
        }
    };

}());