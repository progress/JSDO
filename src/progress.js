/*eslint no-global-assign: ["error", {"exceptions": ["localStorage"]}]*/
/*global XMLHttpRequest:true, require, console, localStorage:true, sessionStorage:true, $:true, Promise, setTimeout */
/*global progress:true, btoa:true*/
/*jslint nomen: true*/
(function() {
    // Pre-release code to detect enviroment and load required modules for Node.js and NativeScript
    // Requirements:
    // - XMLHttpRequest
    // - localStorage
    // - sessionStorage
    // - Promise object (Promises with the same interface as jQuery Promises)

    // Notes:
    // Required packages should be installed before loading progress-jsdo.
    // Node.js:
    // - xmlhttprequest
    // - node-localstorage
    // NativeScript:
    // - nativescript-localstorage
    // - base-64

    var isNativeScript = false,
        isNodeJS = false;

    var pkg_xmlhttprequest = "xmlhttprequest",
        pkg_nodeLocalstorage = "node-localstorage",
        pkg_nativescriptLocalstorage = "nativescript-localstorage",
        pkg_fileSystemAccess = "file-system/file-system-access",
        pkg_base64 = "base-64";

    // If XMLHttpRequest is undefined, enviroment would appear to be Node.js
    // load xmlhttprequest module
    // Web browser and NativeScript clients have a built-in XMLHttpRequest object
    if (typeof XMLHttpRequest === "undefined") {
        isNodeJS = true;
        try {
            XMLHttpRequest = require("" + pkg_xmlhttprequest).XMLHttpRequest;
            // xhrc = require("xmlhttprequest-cookie");
            // XMLHttpRequest = xhrc.XMLHttpRequest;
        } catch (e) {
            console.error("Error: JSDO library requires XMLHttpRequest object in Node.js.\n" +
                "Please install xmlhttprequest package.");
        }
    }

    // Detect if the environment is NativeScript
    if (!isNodeJS &&
        (typeof localStorage === "undefined" ||
            typeof sessionStorage === "undefined")) {
        try {
            require("" + pkg_fileSystemAccess);
            isNativeScript = true;
        } catch (exception1) {
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
throw new Error(msg.getMsgText("jsdoMSG007", "find()"));
}
if (result) {
    return this.record;
}
}

this._setRecord(null);
return null;
};

/*
 * Loops through the records  
 */
this.foreach = function(fn) {
    if (typeof(fn) != 'function') {
        throw new Error(msg.getMsgText("jsdoMSG003", "foreach()"));
    }
    var numEmptyBlocks = 0;
    if (this._needCompaction)
        this._compact();

    var data = this._getRelatedData();

    this._inforeach = true;
    for (var i = 0; i < data.length; i++) {
        var block = data[i];
        if (!block) {
            numEmptyBlocks++;
            continue;
        }

        this._setRecord(new progress.data.JSRecord(this, data[i]));
        var result = fn(this.record);
        if ((typeof(result) != 'undefined') && !result)
            break;
    }

    this._inforeach = false;

    if ((numEmptyBlocks * 100 / this._data.length) >= PROGRESS_JSDO_PCT_MAX_EMPTY_BLOCKS)
        this._needCompaction = true;
};

this._equalRecord = function(rec1, rec2, keyFields) {
    var field;
    var match = true;
    for (var i = 0; i < keyFields.length; i++) {
        var fieldName = keyFields[i];
        var value1 = rec1[fieldName];
        var value2 = rec2[fieldName];

        if (!jsdo[tableName].caseSensitive) {
            field = jsdo[tableName]._fields[fieldName.toLowerCase()];
            if (field && field.type == "string") {
                if (value1 !== undefined && value1 !== null)
                    value1 = value1.toUpperCase();
                if (value2 !== undefined && value2 !== null)
                    value2 = value2.toUpperCase();
            }
        }

        match = (value1 == value2);
        if (!match) return false;
    }
    return true;
};

// Private method to merge changes using merge modes: APPEND, EMPTY, MERGE and REPLACE
this._getKey = function(record, keyFields) {
    var keyObject = {};
    for (var i = 0; i < keyFields.length; i++) {
        var fieldName = keyFields[i];
        var value = record[fieldName];

        if (!jsdo[tableName].caseSensitive) {
            var field = jsdo[tableName]._fields[fieldName.toLowerCase()];
            if (field && field.type == "string") {
                if (value !== undefined && value !== null)
                    value = value.toUpperCase();
            }
        }
        keyObject[fieldName] = value;
    }
    return JSON.stringify(keyObject);
};

this._getCompareFn = function(sortObject) {
    if (typeof sortObject == 'function') {
        return function(rec1, rec2) {
            if (rec1 === null) return 1;
            if (rec2 === null) return -1;

            var jsrec1 = new progress.data.JSRecord(this, rec1);
            var jsrec2 = new progress.data.JSRecord(this, rec2);
            return sortObject(jsrec1, jsrec2);
        };
    } else return function(rec1, rec2) {
        var tableRef = sortObject.tableRef;
        var sortFields = sortObject.sortFields;
        if (!(sortFields instanceof Array)) return 0;
        var sortAscending = sortObject.sortAscending;

        if (rec1 === null) return 1;
        if (rec2 === null) return -1;

        var field;
        for (var i = 0; i < sortFields.length; i++) {
            var fieldName = sortFields[i];
            var value1 = rec1[fieldName];
            var value2 = rec2[fieldName];

            if (!tableRef.caseSensitive) {
                field = tableRef._fields[fieldName.toLowerCase()];
                if (field && field.type == "string") {
                    if (value1 !== undefined && value1 !== null)
                        value1 = value1.toUpperCase();
                    if (value2 !== undefined && value2 !== null)
                        value2 = value2.toUpperCase();
                }
            }
            if (value1 > value2 || (value1 === undefined || value1 === null))
                return sortAscending[i] ? 1 : -1;
            else if (value1 < value2 || (value2 === undefined && value2 === null))
                return sortAscending[i] ? -1 : 1;
        }
        return 0;
    };
};

this._sortObject = {};
this._sortObject.tableRef = this;
this._sortObject.sortFields = undefined;
this._sortObject.sortAscending = undefined;
this._compareFields = this._getCompareFn(this._sortObject);

// _sortRecords - Tells the table reference whether to sort on add, assign and addRecords		
this._sortRecords = true;
// Tells the table reference whether an autoSort is required on an add or assign
this._needsAutoSorting = false;
this._sortFn = undefined;
if ((typeof Object.defineProperty) == 'function') {
    this._autoSort = true;
    Object.defineProperty(
        this,
        "autoSort", {
            get: function() {
                return this._autoSort;
            },
            set: function(value) {
                if (value) {
                    this._autoSort = true;
                    if (this._sortFn || this._sortObject.sortFields) {
                        this._sort();
                        this._createIndex();
                    }
                } else
                    this._autoSort = false;
            },
            enumerable: true,
            writeable: true
        });
    this._caseSensitive = false;
    Object.defineProperty(
        this,
        "caseSensitive", {
            get: function() {
                return this._caseSensitive;
            },
            set: function(value) {
                if (value) {
                    this._caseSensitive = true;
                } else
                    this._caseSensitive = false;
                if (this.autoSort &&
                    (this._sortObject.sortFields && !this._sortFn)) {
                    this._sort();
                    this._createIndex();
                }
            },
            enumerable: true,
            writeable: true
        });
} else {
    this.autoSort = true;
    this.caseSensitive = false; // caseSensitive is false by default		
}

this._processSortFields = function(sortFields) {
    var sortObject = {};
    if (sortFields instanceof Array) {
        sortObject.sortFields = sortFields;
        sortObject.sortAscending = [];
        sortObject.fields = {};
        for (var i = 0; i < sortObject.sortFields.length; i++) {
            var idx;
            var fieldName;
            var field;

            if (typeof(sortObject.sortFields[i]) != 'string') {
                throw new Error(msg.getMsgText("jsdoMSG030", "sort field name", "string element"));
            }
            if ((idx = sortObject.sortFields[i].indexOf(':')) != -1) {
                fieldName = sortObject.sortFields[i].substring(0, idx);
                var sortOrder = sortObject.sortFields[i].substring(idx + 1);
                switch (sortOrder.toUpperCase()) {
                    case 'ASCENDING':
                    case 'ASC':
                        sortObject.sortAscending[i] = true;
                        break;
                    case 'DESCENDING':
                    case 'DESC':
                        sortObject.sortAscending[i] = false;
                        break;
                    default:
                        throw new Error(msg.getMsgText("jsdoMSG030",
                            "sort order '" + sortObject.sortFields[i].substring(idx + 1) + "'",
                            "ASCENDING or DESCENDING"));
                }
            } else {
                fieldName = sortObject.sortFields[i];
                sortObject.sortAscending[i] = true;
            }
            if (fieldName != "_id" && this._fields) {
                field = this._fields[fieldName.toLowerCase()];
                if (field) {
                    if (field.type == "array")
                        throw new Error(msg.getMsgText("jsdoMSG030", "data type found in sort",
                            "scalar field"));
                    fieldName = field.name;
                } else
                    throw new Error(msg.getMsgText("jsdoMSG031", fieldName));
            }
            sortObject.sortFields[i] = fieldName;
            sortObject.fields[fieldName] = fieldName;
        }
    } else {
        sortObject.sortFields = undefined;
        sortObject.sortAscending = undefined;
        sortObject.fields = undefined;
    }
    return sortObject;
};

this.setSortFields = function(sortFields) {
    if (sortFields === undefined || sortFields === null) {
        this._sortObject.sortFields = undefined;
        this._sortObject.sortAscending = undefined;
    } else if (sortFields instanceof Array) {
        var sortObject = this._processSortFields(sortFields);
        this._sortObject.sortFields = sortObject.sortFields;
        this._sortObject.sortAscending = sortObject.sortAscending;
        this._sortObject.fields = sortObject.fields;

        if (this.autoSort) {
            this._sort();
            this._createIndex();
        }
    } else
        throw new Error(msg.getMsgText("jsdoMSG024", "JSDO", "setSortFields()"));
};

this.setSortFn = function(fn) {
    // Check that fn parameter is a function
    // Valid values are a function, undefined, or null
    // Documentation mentions null as a way to clear the sort function
    if (fn && typeof(fn) != 'function') {
        throw new Error(msg.getMsgText("jsdoMSG030", "parameter in setSortFn()",
            "function parameter"));
    }
    this._sortFn = fn ? this._getCompareFn(fn) : undefined;
    if (this.autoSort) {
        this._sort();
        this._createIndex();
    }
};

this.sort = function(arg1) {
    if (arg1 === undefined || arg1 === null) {
        throw new Error(msg.getMsgText("jsdoMSG025", "JSDO", "sort()"));
    }
    if (arguments.length !== 1 ||
        (!(arg1 instanceof Array) && typeof(arg1) != 'function')) {
        throw new Error(msg.getMsgText("jsdoMSG024", "JSDO", "sort()"));
    }

    if (arg1 instanceof Array) {
        var sortObject = this._processSortFields(arg1);
        if (sortObject.sortFields && sortObject.sortFields.length > 0)
            this._sort(sortObject);
    } else {
        this._sort(arg1);
    }
    this._createIndex();
};

this._sort = function(arg1) {
    if (arguments.length === 0 &&
        (!this.autoSort || (this._sortFn === undefined && this._sortObject.sortFields === undefined)))
        return;

    if (arguments.length === 0) {
        if (this._sortFn) {
            // Sort using function
            this._data.sort(this._sortFn);
        } else {
            // Sort using sort fields
            this._data.sort(this._compareFields);
        }
        this._needsAutoSorting = false;
    } else {
        if (typeof(arg1) == 'function') {
            // Sort using function
            this._data.sort(this._getCompareFn(arg1));
        } else {
            // Sort using sort fields
            arg1.tableRef = this;
            this._data.sort(this._getCompareFn(arg1));
        }
        if (this.autoSort)
            this._needsAutoSorting = true;
    }
};

/*
 * Reads a JSON object into the JSDO memory for the specified table reference.
 */
this.addRecords = function(jsonObject, addMode, keyFields, trackChanges, isInvoke) {
    this._jsdo._addRecords(this._name, jsonObject, addMode, keyFields, trackChanges, isInvoke);
};

/*
 * Accepts changes for the specified table reference. 
 */
this.acceptChanges = function() {
    var tableRef = this;

    // First, let's remove any "prods:" properties from created and updated records.
    // Don't have to worry about deleted records, since they're going away.
    for (var id in tableRef._beforeImage) {
        //  Create
        if (tableRef._beforeImage[id] === null) {
            var jsrecord = tableRef._findById(id, false);
            if (jsrecord !== null) {
                tableRef._jsdo._deleteProdsProperties(jsrecord.data, true);
            }

        }
        // Update
        else if (this._changed[id] !== undefined) {
            var jsrecord = this._findById(id, false);
            if (jsrecord !== null) {
                tableRef._jsdo._deleteProdsProperties(jsrecord.data, true);
            }
        }
    }

    tableRef._processed = {};
    tableRef._added = [];
    tableRef._changed = {};
    tableRef._deleted = [];
    tableRef._beforeImage = {};
};

/*
 * Rejects changes for the specified table reference.
 */
this.rejectChanges = function() {
    // Reject changes
    for (var id in this._beforeImage) {
        if (this._beforeImage[id] === null) {
            // Undo create
            this._jsdo._undoCreate(this, id);
        } else if (this._changed[id] !== undefined) {
            // Undo update
            this._jsdo._undoUpdate(this, id, true);
        } else {
            // Undo delete
            this._jsdo._undoDelete(this, id, true);
        }
    }

    var tableRef = this;
    tableRef._processed = {};
    tableRef._added = [];
    tableRef._changed = {};
    tableRef._deleted = [];
};

this.hasChanges = function() {
    return (Object.keys(this._beforeImage).length !== 0);
};

this.getChanges = function() {
    var result = [];
    for (var id in this._beforeImage) {
        var item = { rowState: "", record: null };
        // Create
        if (this._beforeImage[id] === null) {
            item.rowState = PROGRESS_JSDO_ROW_STATE_STRING[progress.data.JSDO._OP_CREATE];
            item.record = this._findById(id, false);
        }
        // Update
        else if (this._changed[id] !== undefined) {
            item.rowState = PROGRESS_JSDO_ROW_STATE_STRING[progress.data.JSDO._OP_UPDATE];
            item.record = this._findById(id, false);
        }
        // Delete
        else {
            item.rowState = PROGRESS_JSDO_ROW_STATE_STRING[progress.data.JSDO._OP_DELETE];
            item.record = new progress.data.JSRecord(this, this._beforeImage[id]);
        }
        result.push(item);
    }
    return result;
};

/*
 * Private method to clear out _errorString for the specified table reference.
 * If a row change was rejected, _errorString was set.
 * If saveChanges() is called to retry the row change, _errorString needs to be reset.
 * This could occur if the autoApplyChanges property is false.
 */
this._clearErrorStrings = function() {
    var record = null;

    for (var id in this._beforeImage) {
        // Create has id only in _beforeImage entry
        if (this._beforeImage[id] === null) {
            record = this._findById(id, false);
            if (record) {
                delete record.data._errorString;
            }
        } else {
            // Get Updated entry
            record = this._findById(id, false);
            if (record) {
                delete record.data._errorString;
            } else {
                //  Deleted entry only in beforeImage table
                delete this._beforeImage[id]._errorString;
            }
        }
    }
};

/*
 * Private method to apply changes for the specified table reference.
 * If _errorString has been set for a row, row change is rejected. 
 * If it has not been set, acceptRowChanges() is called.
 */
this._applyChanges = function() {
    var i;

    for (var id in this._beforeImage) {
        //  Create
        if (this._beforeImage[id] === null) {
            var jsrecord = this._findById(id, false);

            // Check _tmpIndex for temporary _id
            if (jsrecord === null &&
                this._jsdo._resource.idProperty !== undefined) {
                if (this._tmpIndex[id]) {
                    var record = this._data[this._tmpIndex[id].index];
                    jsrecord = record ? (new progress.data.JSRecord(this, record)) : null;
                    delete this._tmpIndex[id];
                }
            }

            if (jsrecord !== null) {
                if (jsrecord.data._rejected ||
                    (jsrecord.data._errorString !== undefined)) {
                    this._jsdo._undoCreate(this, id);
                } else {
                    jsrecord.acceptRowChanges();
                }
            } else {
                // Record not present in JSDO memory
                // Delete after Create
                var found = false;
                for (var i = 0; i < this._deleted.length; i++) {
                    found = (this._deleted[i].data._id == id);
                    if (found) break;
                }
                if (!found) {
                    throw new Error(msg.getMsgText("jsdoMSG000",
                        "Created record appears to be deleted without a delete operation."));
                }
            }
        }
        // Update
        else if (this._changed[id] !== undefined) {
            var jsrecord = this._findById(id, false);
            if (jsrecord !== null) {
                // Record found in JSDO memory
                if (jsrecord.data._rejected ||
                    (jsrecord.data._errorString !== undefined)) {
                    this._jsdo._undoUpdate(this, id);
                } else {
                    jsrecord.acceptRowChanges();
                }
            } else {
                // Record not present in JSDO memory
                // Delete after Update
                if (this._beforeImage[id]._rejected ||
                    (this._beforeImage[id]._errorString !== undefined)) {
                    this._jsdo._undoDelete(this, id);
                } else {
                    var found = false;
                    for (i = 0; i < this._deleted.length; i++) {
                        found = (this._deleted[i].data._id == id);
                        if (found) break;
                    }
                    if (!found) {
                        throw new Error(msg.getMsgText("jsdoMSG000",
                            "Updated record appears to be deleted without a delete operation."));
                    }
                }
            }
        }
        // Delete
        else {
            if (this._beforeImage[id]._rejected ||
                (this._beforeImage[id]._errorString !== undefined)) {
                this._jsdo._undoDelete(this, id);
            }
        }
    }

    var tableRef = this;
    tableRef._processed = {};
    tableRef._added = [];
    tableRef._changed = {};
    tableRef._deleted = [];
    tableRef._beforeImage = {};
};


/*
 * Accepts row changes for the working record at the table reference level.
 */
this.acceptRowChanges = function() {
    if (this.record)
        return this.record.acceptRowChanges();
    throw new Error(msg.getMsgText("jsdoMSG002", this._name));
};

/*
 * Rejects row changes for the working record at the table reference level.
 */
this.rejectRowChanges = function() {
    if (this.record)
        return this.record.rejectRowChanges();
    throw new Error(msg.getMsgText("jsdoMSG002", this._name));
};


/* This method returns true 
 * if this table has any child tables and at least one of those tables is nested.
 * Else if returns false.
 */
this._hasNestedChild = function() {
    var hasNestedChild = false;
    var childBufObj;

    // If table has children, see if any relationship is NESTED	
    if (this._children.length > 0) {
        for (var i = 0; i < this._children.length; i++) {
            childBufObj = this._jsdo._buffers[this._children[i]];

            if (childBufObj._isNested) {
                hasNestedChild = true;
                break;
            }
        }
    }

    return hasNestedChild;
};
};

/*
 * Returns a JSRecord for the specified JSDO.
 * @param jsdo the JSDO
 * @param record the values of the record
 */
progress.data.JSRecord = function JSRecord(tableRef, record) {
    this._tableRef = tableRef;
    this.data = record;

    this.getId = function() {
        return this.data._id ? this.data._id : null;
    };

    this.getErrorString = function() {
        return this.data._errorString;
    };

    /*
     * Saves a copy of the current record to the before image.
     */
    this._saveBeforeImageUpdate = function() {
        // Save before image 
        if (this._tableRef._beforeImage[this.data._id] === undefined) {
            // this.data._index = index;
            var copy = {};
            this._tableRef._jsdo._copyRecord(
                this._tableRef, this.data, copy);
            this._tableRef._beforeImage[this.data._id] = copy;
        }

        if (this._tableRef._changed[this.data._id] === undefined) {
            this._tableRef._changed[this.data._id] = this.data;
        }
        // End - Save before image			
    };

    /*
     * 
     */
    this._sortRecord = function(fields) {
        var index = this._tableRef._index[this.data._id].index;
        var record = this._tableRef._data[index];

        if (this._tableRef.autoSort &&
            this._tableRef._sortRecords &&
            (this._tableRef._sortFn !== undefined ||
                this._tableRef._sortObject.sortFields !== undefined)) {

            if (this._tableRef._sortObject.fields) {
                if (typeof fields == 'string') {
                    if (this._tableRef._sortObject.fields[fields] === undefined)
                        return; // Only sort records if the the specified field is in the sort fields
                } else if (fields instanceof Array) {
                    var found = false;
                    for (var i = 0; i < fields.length; i++) {
                        if (this._tableRef._sortObject.fields[fields[i]] !== undefined) {
                            found = true;
                            break;
                        }
                    }
                    if (!found)
                        return; // Only sort records if the the specified fields are in the sort fields
                }
            }

            if (this._tableRef._needsAutoSorting) {
                this._tableRef._sort();
                this._tableRef._createIndex();
            } else {
                // Find position of new record in _data and use splice
                for (var i = 0; i < this._tableRef._data.length; i++) {
                    if (this._tableRef._data[i] === null) continue; // Skip null elements
                    if (i == index) continue; // Skip changed record
                    var ret = this._tableRef._sortFn ?
                        this._tableRef._sortFn(record, this._tableRef._data[i]) :
                        this._tableRef._compareFields(record, this._tableRef._data[i]);
                    if (ret == -1) break;
                }

                if (i > index) {
                    i--;
                }
                if (i != index) {
                    this._tableRef._data.splice(index, 1);
                    this._tableRef._data.splice(i, 0, record);
                    this._tableRef._createIndex();
                }
            }
        }
    };

    /*
     * Assigns the specified values.
     * @param record parameter with the record values
     */
    this.assign = function(record) {
        if (record === undefined)
            throw new Error(msg.getMsgText("jsdoMSG024", "JSDO", "assign() or update()"));

        this._saveBeforeImageUpdate();

        var fieldName,
            i,
            j,
            value,
            schema = this._tableRef.getSchema(),
            prefixElement,
            name;

        if (record) {
            for (i = 0; i < schema.length; i += 1) {
                fieldName = schema[i].name;
                value = record[fieldName];
                if (typeof value != "undefined") {
                    if (typeof value == 'string' && schema[i].type != 'string') {
                        value = this._tableRef._jsdo._convertType(value,
                            schema[i].type,
                            schema[i].items ? schema[i].items.type : null);
                    }
                    this.data[fieldName] = value;
                }
                if (schema[i].type === "array") {
                    // Assign values from individual fields from flattened arrays                      
                    prefixElement = this._tableRef._jsdo._getArrayField(fieldName);
                    if (!this.data[fieldName]) {
                        this.data[fieldName] = [];
                    }
                    for (j = 0; j < schema[i].maxItems; j += 1) {
                        name = prefixElement.name + (j + 1);
                        value = record[name];
                        if (typeof value != "undefined") {
                            // Skip element if a field with the same name exists
                            if (!this._tableRef._fields[name.toLowerCase()]) {
                                if (typeof value == 'string' && schema[i].items.type != 'string') {
                                    value = this._tableRef._jsdo._convertType(value,
                                        schema[i].items.type,
                                        null);
                                }
                                this.data[fieldName][j] = value;
                            }
                        }
                    }
                }
            }

            this._sortRecord();
        }
        return true;
    };

    // Alias for assign() method
    this.update = this.assign;

    /*
     * Removes the JSRecord.
     */
    this.remove = function() {
        return this._remove(true);
    };

    this._remove = function(bTrackChanges) {
        if (typeof(bTrackChanges) == 'undefined') {
            bTrackChanges = true;
        }

        var index = this._tableRef._index[this.data._id].index;
        var jsrecord = this._tableRef._findById(this.data._id, false);

        if (bTrackChanges) {
            // Save before image
            var record = this._tableRef._beforeImage[this.data._id];
            if (record === undefined) {
                // Record does not exist in the before image
                this.data._index = index;
                this._tableRef._beforeImage[this.data._id] = this.data;
            } else {
                // Record exists in the before image
                if (record) {
                    // Record is not null - a null entry in the before image indicates 
                    // corresponds to an add
                    // Save the index of the record
                    // so that an undo would restore the record in the same position in _data
                    record._index = index;
                }
            }
            // End - Save before image
            this._tableRef._deleted.push(jsrecord);
        }

        // Set entry to null instead of removing entry - index requires positions to be persistent
        this._tableRef._data[index] = null;
        this._tableRef._hasEmptyBlocks = true;
        delete this._tableRef._index[this.data._id];

        // Set record property
        this._tableRef._setRecord(null);

        return true;
    };

    /*
     * Accepts row changes for the specified record.
     */
    this.acceptRowChanges = function() {
        var id = this.data._id;
        if (this._tableRef._beforeImage[id] !== undefined) {
            if (this.data._rejected) {
                throw new Error(msg.getMsgText("jsdoMSG127"));
            }
            if (this._tableRef._beforeImage[id] === null) {
                // Accept create				
                // Remove element from _added
                for (var i = 0; i < this._tableRef._added.length; i++) {
                    if (this._tableRef._added[i] == id) {
                        this._tableRef._added.splice(i, 1);
                        break;
                    }
                }
                this._tableRef._jsdo._deleteProdsProperties(this.data, true);
            } else if (this._tableRef._changed[id] !== undefined) {
                // Accept update
                delete this._tableRef._changed[id];
                this._tableRef._jsdo._deleteProdsProperties(this.data, true);
            } else {
                // Accept delete
                // Remove element from _deleted
                for (var i = 0; i < this._tableRef._deleted.length; i++) {
                    if (this._tableRef._deleted[i].data._id == id) {
                        this._tableRef._deleted.splice(i, 1);
                        break;
                    }
                }
            }
            delete tableRef._beforeImage[id];
        }
    };

    /*
     * Rejects row changes for the specified record.
     */
    this.rejectRowChanges = function() {
        var id = this.data._id;
        if (this._tableRef._beforeImage[id] !== undefined) {
            if (this._tableRef._beforeImage[id] === null) {
                // Undo create				
                this._tableRef._jsdo._undoCreate(this._tableRef, id);
                // Remove element from _added
                for (var i = 0; i < this._tableRef._added.length; i++) {
                    if (this._tableRef._added[i] == id) {
                        this._tableRef._added.splice(i, 1);
                        break;
                    }
                }
            } else if (this._tableRef._changed[id] !== undefined) {
                // Undo update
                this._tableRef._jsdo._undoUpdate(this._tableRef, id, true);
                delete this._tableRef._changed[id];
            } else {
                // Undo delete
                this._tableRef._jsdo._undoDelete(this._tableRef, id, true);
                // Remove element from _deleted
                for (var i = 0; i < this._tableRef._deleted.length; i++) {
                    if (this._tableRef._deleted[i].data._id == id) {
                        this._tableRef._deleted.splice(i, 1);
                        break;
                    }
                }
            }
            delete tableRef._beforeImage[id];
        }
    };

};

/*
 * Returns a JSDO for the specified resource.
 * @param resNameOrParmObj: the resource name or an object that contains the initial values for the JSDO
 *                     (if this is an object, it should include the name property with the resource name
 * @param serviceName : name of service (ignored if 1st param is an object containing the initial values)
 */
progress.data.JSDO = function JSDO(resNameOrParmObj, serviceName) {
    var _super = {};

    if (typeof progress.data.Session == 'undefined') {
        throw new Error('ERROR: You must include progress.session.js');
    }

    _super.subscribe = this.subscribe;

    // Override for Observable.subscribe
    this.subscribe = function(evt) {
        var args = Array.prototype.slice.call(arguments);
        if (typeof evt === "string") {
            // Aliases for events
            switch (evt.toLowerCase()) {
                case "beforeread":
                    args[0] = "beforefill";
                    break;
                case "afterread":
                    args[0] = "afterfill";
                    break;
            }
        }
        _super.subscribe.apply(this, args);
    };

    this._defineProperty = function(tableName, fieldName) {
        Object.defineProperty(
            this._buffers[tableName],
            fieldName, {
                get: function fnGet() {
                    var name,
                        index,
                        element,
                        fieldInfo;
                    if (this.record) {
                        index = fieldName.indexOf(progress.data.JSDO.ARRAY_INDEX_SEPARATOR);
                        if (index > 0 && !this._fields[fieldName.toLowerCase()]) {
                            // Skip element if a field with the same name exists                                
                            // Check if field is a flattened array field by quickly checking for the separator
                            // Extract name and index element
                            name = fieldName.substring(0, index);
                            element = fieldName.substring(index + progress.data.JSDO.ARRAY_INDEX_SEPARATOR.length);
                            fieldInfo = this._fields[name.toLowerCase()];
                            if (!isNaN(element) && fieldInfo && (fieldInfo.type === "array")) {
                                return this.record.data[name][element - 1];
                            }
                        }
                        return this.record.data[fieldName];
                    } else
                        return null;
                },
                set: function(value) {
                    var name = fieldName,
                        index,
                        element,
                        fieldInfo;
                    if (this.record) {
                        this.record._saveBeforeImageUpdate();

                        try {
                            index = fieldName.indexOf(progress.data.JSDO.ARRAY_INDEX_SEPARATOR);
                            if (index > 0 && !this._fields[fieldName.toLowerCase()]) {
                                // Skip element if a field with the same name exists                                    
                                name = fieldName.substring(0, index);
                                element = fieldName.substring(index + progress.data.JSDO.ARRAY_INDEX_SEPARATOR.length);
                                fieldInfo = this._fields[name.toLowerCase()];
                                if (!isNaN(element) && fieldInfo && (fieldInfo.type === "array")) {
                                    this.record.data[name][element - 1] = value;
                                    return;
                                }
                            }
                            this.record.data[fieldName] = value;
                        } finally {
                            this.record._sortRecord(name);
                        }
                    }
                },
                enumerable: true,
                writeable: true
            });
    };

    Object.defineProperty(
        this,
        'hasSubmitOperation', {
            get: function() {
                return this._hasSubmitOperation;
            },
            enumerable: true
        }
    );

    Object.defineProperty(
        this,
        'hasCUDOperations', {
            get: function() {
                return this._hasCUDOperations;
            },
            enumerable: true
        }
    );

    Object.defineProperty(
        this,
        'defaultTableRef', {
            get: function() {
                return this._defaultTableRef;
            },
            enumerable: true
        }
    );

    // Initial values
    this._buffers = {}; // Object of table references
    this._numBuffers = 0;
    this._defaultTableRef = null;

    this._async = true;
    this._dataProperty = null;
    this._dataSetName = null;
    this.operations = [];
    this.useRelationships = true;

    this._session = null;
    this._needCompaction = false;

    this._hasCUDOperations = false;
    this._hasSubmitOperation = false;
    this._useSubmit = false; // For saving saveChanges(useSubmit) param

    this.autoApplyChanges = true; // default should be true to support 11.2 behavior
    this._lastErrors = [];
    this._localStorage = null;
    this._convertForServer;
    this._fillMergeMode;
    var autoFill = false;

    // Initialize JSDO using init values
    if (!arguments[0]) {
        throw new Error("JSDO: Parameters are required in constructor.");
    }

    if (typeof(arguments[0]) == "string") {
        this.name = arguments[0];
        //		if ( arguments[1] && (typeof(arguments[1]) ==  "string") )
        //			localServiceName = serviceName;
    } else if (typeof(arguments[0]) == "object") {
        var args = arguments[0];
        for (var v in args) {
            switch (v) {
                case 'autoFill':
                    autoFill = args[v];
                    break;
                case 'events':
                    this._events = {};
                    for (var eventName in args[v]) {
                        this._events[eventName.toLowerCase()] = args[v][eventName];
                    }
                    break;
                case 'dataProperty':
                    this._dataProperty = args[v];
                    break;
                default:
                    this[v] = args[v];
            }
        }
    }
    /* error out if caller didn't pass the resource name */
    if ((!this.name) /*|| !(this._session)*/ ) {
        // make this error message more specific?
        throw new Error("JSDO: JSDO constructor is missing the value for 'name'");
    }

    /* perform some basic validation on the event object for the proper structure if provided */
    if (this._events) {
        if ((typeof this._events) !== 'object') {
            throw new Error("JSDO: JSDO constructor event object is not defined as an object");
        }

        /* make sure all the event handlers are sane */
        for (var prop in this._events) {
            var evt = this._events[prop];
            if (!(evt instanceof Array)) {
                throw new Error('JSDO: JSDO constructor event object for ' + prop + ' must be an array');
            }
            evt.forEach(function(el) {
                if ((typeof el) !== 'object') {
                    throw new Error("JSDO: JSDO constuctor event object for " +
                        prop + " is not defined as an object");
                }
                /* listener must have at least fn property defined as a function */
                if ((typeof el.fn) !== 'function') {
                    throw new Error("JSDO: JSDO event listener for " + prop + " is not a function.");
                }
                /* scope is optional, but must be an object if provided */
                if (el.scope && (typeof el.scope) !== 'object') {
                    throw new Error("JSDO: JSDO event listener scope for " + prop + " is not an object.");
                }
            });
        }
    }

    if (this.name) {
        // Read resource definition from the Catalog - save reference to JSDO
        // Enhance this to deal with multiple services loaded and the same resource
        // name is used by more than one service (use the local serviceName var)
        this._resource = progress.data.ServicesManager.getResource(this.name);
        if (this._resource) {
            if (!this.url)
                this.url = this._resource.url;
            if (!this._dataSetName && this._resource._dataSetName) {
                // Catalog defines a DataSet
                this._dataSetName = this._resource._dataSetName;

                // Define TableRef property in the JSDO
                if (this._resource.dataProperty) {
                    var buffer = this[this._resource.dataProperty] = new progress.data.JSTableRef(this, this._resource.dataProperty);
                    this._buffers[this._resource.dataProperty] = buffer;
                } else {
                    for (var tableName in this._resource.fields) {
                        var buffer = this[tableName] = new progress.data.JSTableRef(this, tableName);
                        this._buffers[tableName] = buffer;
                    }
                }
            }
            if (!this._dataProperty && this._resource.dataProperty)
                this._dataProperty = this._resource.dataProperty;

            if (!this._dataSetName) {
                var tableName = this._dataProperty ? this._dataProperty : "";
                this._buffers[tableName] = new progress.data.JSTableRef(this, tableName);
                if (tableName)
                    this[tableName] = this._buffers[tableName];
            }

            // Set idProperty from table reference level at the resource level
            var properties,
                tableName;
            if (this._dataSetName &&
                this._resource.schema &&
                this._resource.schema.properties[this._dataSetName]) {
                properties = this._resource.schema.properties[this._dataSetName].properties;
                if (Object.keys(properties).length === 1) {
                    tableName = Object.keys(properties)[0];
                    if (properties[tableName].idProperty) {
                        this._resource.idProperty = properties[tableName].idProperty;
                    }
                }
            } else if (this._resource.schema &&
                this._resource.schema.properties &&
                this._resource.schema.properties[tableName] &&
                this._resource.schema.properties[tableName].idProperty) {
                this._resource.idProperty = this._resource.schema.properties[tableName].idProperty;
            }

            // Add functions for operations to JSDO object
            for (var fnName in this._resource.fn) {
                this[fnName] = this._resource.fn[fnName]["function"];
            }
            // Check if CUD operations have been defined
            this._hasCUDOperations =
                this._resource.generic["create"] !== undefined ||
                this._resource.generic["update"] !== undefined ||
                this._resource.generic["delete"] !== undefined;
            this._hasSubmitOperation = this._resource.generic["submit"] !== undefined;

            /* get a session object, using name of the service to look it up in the list of
             * sessions maintained by the ServicesManager
             */
            if (!this._session) {
                var myservice = progress.data.ServicesManager.getService(this._resource.service.name);
                this._session = myservice._session;
                this._session._pushJSDOs(this);
            }
        } else {
            throw new Error(msg.getMsgText("jsdoMSG004", this.name));
        }
    } else {
        this._buffers[""] = new progress.data.JSTableRef(this, "");
    }

    if (!this._session) {
        throw new Error("JSDO: Unable to get user session for resource '" + this.name + "'");
    }

    // Calculate _numBuffers and _defaultTableRef
    for (var buf in this._buffers) {
        this._buffers[buf]._parent = null;
        this._buffers[buf]._children = [];
        // The _relationship object is only specified for the child buffer.
        // Currently it is limited to only a single relationship. ie. It does not support the
        // where the child buffer is involved in more than one data-relation
        this._buffers[buf]._relationship = null;
        this._buffers[buf]._isNested = false;
        if (!this._defaultTableRef)
            this._defaultTableRef = this._buffers[buf];
        this._numBuffers++;
    }
    if (this._numBuffers != 1)
        this._defaultTableRef = null;
    else {
        // record is used to represent the current record for a table reference
        // data corresponds to the values (JSON object) of the data
        this.record = null;
    }

    // Define caseSensitive property at the JSDO level
    if ((typeof Object.defineProperty) == 'function') {
        this._caseSensitive = false; // caseSensitive is false by default
        Object.defineProperty(
            this,
            "caseSensitive", {
                get: function() {
                    return this._caseSensitive;
                },
                set: function(value) {
                    this._caseSensitive = value ? true : false;

                    for (var buf in this._buffers) {
                        this._buffers[buf].caseSensitive = this._caseSensitive;
                    }
                },
                enumerable: true,
                writeable: true
            });
        this._autoSort = true; // autoSort is true by default
        Object.defineProperty(
            this,
            "autoSort", {
                get: function() {
                    return this._autoSort;
                },
                set: function(value) {
                    this._autoSort = value ? true : false;

                    for (var buf in this._buffers) {
                        this._buffers[buf].autoSort = this._autoSort;
                    }
                },
                enumerable: true,
                writeable: true
            });
    }

    // Define _properties property at the JSDO level
    this._properties = {};
    if ((typeof Object.defineProperty) == 'function') {
        Object.defineProperty(this,
            "this._properties", {
                get: function() {
                    return this._properties;
                },
                enumerable: false
            }
        );

    }


    // Set schema for TableRef
    if (this._resource && this._resource.fields) {
        for (var buf in this._buffers) {
            this._buffers[buf]._schema = this._resource.fields[buf];
            this._buffers[buf]._primaryKeys = this._resource.primaryKeys[buf];

            // Create _fields object used to validate fields as case-insensitive.
            this._buffers[buf]._fields = {};
            var fields = this._buffers[buf]._schema;
            for (var i = 0; i < fields.length; i++) {
                this._buffers[buf]._fields[fields[i].name.toLowerCase()] = fields[i];
                if (typeof(fields[i].origName) !== "undefined") {
                    if ((typeof(fields[i].origName) !== "string") ||
                        (fields[i].origName.trim() === "")) {
                        throw new Error(msg.getMsgText("jsdoMSG504",
                            "JSDO", "Field '" + fields[i].name + "' in resource '" + this._resource.name + "'", "origName"));
                    }
                }
            }

            if (this._buffers[buf]._schema && (typeof Object.defineProperty) == 'function') {
                // Add fields as properties of the TableRef object
                for (var i = 0; i < this._buffers[buf]._schema.length; i++) {
                    var fieldName = this._buffers[buf]._schema[i].name,
                        fieldInfo = this._buffers[buf]._schema[i];
                    if (typeof(this._buffers[buf][fieldName]) == 'undefined') {
                        this._defineProperty(buf, fieldName);
                    }
                    if (fieldInfo.type === "array") {
                        for (var j = 0; j < fieldInfo.maxItems; j += 1) {
                            var name = fieldName + progress.data.JSDO.ARRAY_INDEX_SEPARATOR + (j + 1);
                            // Skip element if a field with the same name exists                                
                            // Only create property if the name is not being used
                            if (!this._buffers[buf]._fields[name.toLowerCase()]) {
                                this._defineProperty(buf, name);
                            }
                        }
                    }
                }
            }
        }
        // Set schema for when dataProperty is used but not specified via the catalog
        if (this._defaultTableRef &&
            !this._defaultTableRef._schema &&
            this._resource.fields[""]) {
            this._defaultTableRef._schema = this._resource.fields[""];
        }
    } else {
        if (this._defaultTableRef)
            this._defaultTableRef._schema = [];
    }

    // Set isNested property
    if (this._numBuffers > 1) {
        for (var buf in this._buffers) {
            var fields = [];
            var found = false;
            for (var i = 0; i < this._buffers[buf]._schema.length; i++) {
                var field = this._buffers[buf]._schema[i];

                if (field.items &&
                    field.type == "array" && field.items.$ref) {
                    if (this._buffers[field.name]) {
                        found = true;
                        this._buffers[field.name]._isNested = true;
                    }
                } else
                    fields.push(field);
            }
            // Replace list of fields - removing nested datasets from schema
            if (found)
                this._buffers[buf]._schema = fields;
        }
    }

    // Process relationships
    if (this._resource && this._resource.relations) {
        for (var i = 0; i < this._resource.relations.length; i++) {
            var relationship = this._resource.relations[i];

            // Set relationship information ignoring self-referencing (recursive) relationships
            if (relationship.childName &&
                relationship.parentName &&
                (relationship.childName !== relationship.parentName)) {
                // Set casing of fields in relationFields to be the same as in the schema
                if (relationship.relationFields instanceof Array) {
                    for (var j = 0; j < relationship.relationFields.length; j++) {
                        var fieldName;
                        var field;
                        if (this._buffers[relationship.parentName]._fields) {
                            fieldName = relationship.relationFields[j].parentFieldName;
                            field = this._buffers[relationship.parentName]._fields[fieldName.toLowerCase()];
                            if (field) {
                                relationship.relationFields[j].parentFieldName = field.name;
                            } else
                                throw new Error(msg.getMsgText("jsdoMSG010", fieldName));
                        }
                        if (this._buffers[relationship.childName]._fields) {
                            fieldName = relationship.relationFields[j].childFieldName;
                            field = this._buffers[relationship.childName]._fields[fieldName.toLowerCase()];
                            if (field) {
                                relationship.relationFields[j].childFieldName = field.name;
                            } else
                                throw new Error(msg.getMsgText("jsdoMSG010", fieldName));
                        }
                    }
                }
                this._buffers[relationship.childName]._parent = relationship.parentName;
                this._buffers[relationship.childName]._relationship = relationship.relationFields;
                this._buffers[relationship.parentName]._children.push(relationship.childName);
            }
        }
    }


    this._getDefaultValue = function(field) {
        var defaultValue,
            t, m, d,
            isDate = false;

        if ((field.type === "string") &&
            field.format &&
            (field.format.indexOf("date") !== -1) &&
            (field["default"])) {
            isDate = true;
        } else if ((field.type === "array") &&
            field.ablType &&
            (field.ablType.indexOf("DATE") != -1) &&
            (field["default"])) {
            isDate = true;
        } else {
            defaultValue = field["default"];
        }

        if (isDate) {
            switch (field["default"].toUpperCase()) {
                case "NOW":
                    defaultValue = new Date().toISOString();
                    break;
                case "TODAY":
                    t = new Date();
                    m = String((t.getMonth() + 1));
                    if (m.length === 1) {
                        m = '0' + m;
                    }
                    d = String((t.getDate()));
                    if (d.length === 1) {
                        d = '0' + d;
                    }
                    defaultValue = t.getFullYear() + '-' + m + '-' + d;
                    break;
                default:
                    defaultValue = field["default"];
            }
        }

        return defaultValue;
    };

    // Method to calculate the element information of an array given the name, index, and value
    // Parameters:
    // arrayFieldName The name o the field
    // index Optional parameter - if index is null/undefined the name of the element is the prefix
    // value Optional parameter
    this._getArrayField = function(arrayFieldName, index, value) {
        var element = {};
        // ABL arrays are 1-based
        element.name = arrayFieldName + progress.data.JSDO.ARRAY_INDEX_SEPARATOR + ((index >= 0) ? (index + 1) : "");
        element.value = value ? value[index] : undefined;
        return element;
    };

    this.isDataSet = function() {
        return this._dataSetName ? true : false;
    };

    /* handler for invoke operation complete */
    this._invokeComplete = function(jsdo, success, request) {
        // only fire on async requests
        if (request.async && request.fnName) {
            jsdo.trigger('afterInvoke', request.fnName, jsdo, success, request);
        }

        if (request.deferred) {
            if (success) {
                request.deferred.resolve(jsdo, success, request);
            } else {
                request.deferred.reject(jsdo, success, request);
            }
        }
    };

    /* handler for invoke operation success */
    this._invokeSuccess = function( /* jsdo, success, request */ ) {
        // do nothing
    };

    /* handler for invoke operation error */
    this._invokeError = function( /* jsdo, success, request */ ) {
        // do nothing
    };

    /*
     * Performs an HTTP request using the specified parameters.  This is 
     * used to perform remote calls for the JSDO for operations defined.
     * 
     */
    this._httpRequest = function(xhr, method, url, reqBody, request) {

        function afterOpenRequest() {
            var input = null;
            if (reqBody) {
                xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                input = JSON.stringify(reqBody);
            }

            try {
                xhr.send(input);
            } catch (e) {
                request.success = false;
                request.exception = e;
                // let Session check for online/offline
                xhr.jsdo._session._checkServiceResponse(xhr, request.success, request);
            }
        }

        // if xhr wasn't passed we'll create our own since this is an invoke operation
        // if xhr is passed, then it is probably a CRUD operation which is setup with XHR
        // in call to session
        if (!xhr) {
            xhr = new XMLHttpRequest();

            // only setup the callback handlers if we're responsible for creating the 
            // xhr call which happens on invoke operations...which is the normal case
            // the CRUD operations setup their own callbacks and they have their own
            // event handlers so we don't use them here.
            xhr.onCompleteFn = this._invokeComplete;
            xhr.onSuccessFn = this._invokeSuccess;
            xhr.onErrorFn = this._invokeError;
            xhr.onreadystatechange = this.onReadyStateChangeGeneric;

            // for invokes we always fire the invoke when doing async
            if (request.async && request.fnName) {
                this.trigger('beforeInvoke', request.fnName, this, request);
            }

            // For Invoke operations, wrap reqBody in a request object
            // This is not required for CRUD operations since the whole
            // reqBody is mapped to the parameter
            if (reqBody) {
                if (this._resource && this._resource.service) {
                    var useRequest = this._resource.service.useRequest;
                    if (this._resource.service.settings &&
                        this._resource.service.settings.useRequest !== undefined) {
                        useRequest = this._resource.service.settings.useRequest;
                    }
                    if (useRequest) {
                        reqBody = { request: reqBody };
                    }
                }
            }
        }

        xhr.request = request;
        xhr.jsdo = this;
        request.jsdo = this;
        request.xhr = xhr;

        this._session._openRequest(xhr, method, url, request.async, afterOpenRequest);

        return request; // Note: for the async case, this does not give us exactly the same behavior
        // as when afterOpenRequest is called synchronously, because this returns
        // request before its xhr has had its open() called
    };


    // This method currently is just used by the JSDOReadService.
    // It returns data in its non-nested (default) format
    this._getDataObject = function() {
        var dataObject = {};
        if (this._dataSetName) {
            dataObject[this._dataSetName] = {};

            var oldUseRelationships = this.useRelationships;
            // Turn off useRelationships so that getData() returns all the records
            try {
                this.useRelationships = false;
                for (var buf in this._buffers) {
                    dataObject[this._dataSetName][buf] = this._buffers[buf].getData();
                }
            } finally {
                // Restore useRelationships
                this.useRelationships = oldUseRelationships;
            }
        } else {
            if (this._dataProperty) {
                dataObject[this._dataProperty] = this.getData();
            } else
                return this.getData(); // Array
        }
        return dataObject;
    };


    // This method currently is just used by the JSDOReadService.
    // Now that the JSDO Services support nested data, we want to return data nested for those 
    // relationships that are marked nested. 
    //
    // This method returns a data object containing the nested data.  
    // If a parent row is involved in nested relationship, 
    // then references to its child rows are added to the parent row in a child table array 
    // (providing the nested format).
    // We are using the internal jsdo _data arrays, 
    // and adding a child table array to each parent row that has children.
    // Once the caller is done with the nested data, 
    // they can call jsdo._unnestData() which removes these child table references
    // 
    this._getDataObjectAsNested = function() {
        var dataObject = {};
        if (this._dataSetName) {
            dataObject[this._dataSetName] = {};

            try {
                // First walk thru all buffers. We need to determine if any of the buffers are
                // involved in a nested relationship. If so, we want to return the child's 
                // data in nested format.
                for (var buf in this._buffers) {
                    var bufObj = this._buffers[buf];


                    // If this is a child table, and its involved in a nested relationship,
                    // then just skip.
                    // This table's data will be nested within each parent row when we 
                    // process the parent table.
                    if (bufObj._isNested) continue;

                    this._nestChildren = false; // default to false

                    // If table has children, see if any relationship is NESTED	
                    if (bufObj._children.length > 0) {
                        for (var i = 0; i < bufObj._children.length; i++) {
                            var childBufObj = this._buffers[bufObj._children[i]];

                            if (childBufObj._isNested) {
                                this._nestChildren = true;
                                break;
                            }
                        }
                    }

                    dataObject[this._dataSetName][buf] = this._buffers[buf].getData();
                }
            } catch (e) {
                throw new Error(msg.getMsgText("jsdoMSG000", e.message));
            } finally {
                // Set back to default avlue
                this._nestChildren = false;
            }
        } else {
            if (this._dataProperty) {
                dataObject[this._dataProperty] = this.getData();
            } else
                return this.getData(); // Array
        }
        return dataObject;
    };


    // This method is used in conjunction with _getDataObjectAsNested() in the JSDOReadService.
    // _getDataObjectAsNested() adds arrays of child row references to their parent rows.
    // Once the JSDOReadService has done its data mapping, we need to remove the references since
    // internally the JSDO stores its data in unnested format.
    this._unnestData = function() {

        if (this._dataSetName) {
            var parentRecord;
            var bufObj;
            var childBufObj;

            // First walk thru all buffers. We need to determine if any of the buffers are parent
            // buffers involved in a nested relationship. If so, then we'll look for any child row arrays
            // to delete
            for (var buf in this._buffers) {
                bufObj = this._buffers[buf];

                // If we know this table has at least one nested child table, we'll walk thru
                // all its rows to determine if the rows have any child row arrays.
                // It's more efficient to just walk thru the parent row list once, so we'll
                // check for all child row arrays here

                if (bufObj._hasNestedChild()) {
                    // Now must walk thru the parent rows and delete any child row arrays
                    for (var i = 0; i < bufObj._data.length; i++) {
                        parentRecord = bufObj._data[i];

                        for (var j = 0; j < bufObj._children.length; j++) {
                            childBufObj = this._buffers[bufObj._children[j]];

                            if (parentRecord[childBufObj._name]) {
                                delete parentRecord[childBufObj._name];
                            }
                        }

                    }
                }
            } // end for
        }
    };


    this._recToDataObject = function(record, includeChildren) {
        if (this._defaultTableRef)
            return this._defaultTableRef._recToDataObject(record, includeChildren);
        throw new Error(msg.getMsgText("jsdoMSG001", "_recToDataObject()"));
    };

    this._recFromDataObject = function(dataObject) {
        if (this._defaultTableRef)
            return this._defaultTableRef._recFromDataObject(dataObject);
        throw new Error(msg.getMsgText("jsdoMSG001", "_recFromDataObject()"));
    };

    this.add = function(obj) {
        if (this._defaultTableRef)
            return this._defaultTableRef.add(obj);
        throw new Error(msg.getMsgText("jsdoMSG001", "add() or create()"));
    };

    // Alias for add() method
    this.create = this.add;

    this.hasData = function() {
        for (var buf in this._buffers) {
            if (this._buffers[this._buffers[buf]._name].hasData())
                return true;
        }
        return false;
    };

    this.getData = function(params) {
        if (this._defaultTableRef)
            return this._defaultTableRef.getData(params);
        throw new Error(msg.getMsgText("jsdoMSG001", "getData()"));
    };

    this.getSchema = function() {
        if (this._defaultTableRef)
            return this._defaultTableRef.getSchema();
        throw new Error(msg.getMsgText("jsdoMSG001", "getSchema()"));
    };

    this.findById = function(id) {
        if (this._defaultTableRef)
            return this._defaultTableRef.findById(id);
        throw new Error(msg.getMsgText("jsdoMSG001", "findById()"));
    };

    this._convertType = function(value, type, itemType) {
        if ((typeof value != 'string') || (type === null)) return value;
        var result = value;
        try {
            if (type == 'array') {
                var result = [];

                value = value.slice(1, value.length - 1);
                var elements = value.split(',');
                var convertItem = (itemType && (itemType != 'string'));
                for (var i = 0; i < elements.length; i++) {
                    result[i] = convertItem ? this._convertType(elements[i], itemType, null) : elements[i];
                }
            } else if (type == 'integer') {
                result = parseInt(value);
            } else if (type == 'number') {
                result = parseFloat(value);
            } else {
                result = value;
            }
        } catch (e) {
            throw new Error(msg.getMsgText("jsdoMSG000",
                "Error converting string to native type: " + e.message));
        }
        return result;
    };

    this.assign = function(values) {
        if (this._defaultTableRef) {
            return this._defaultTableRef.assign(values);
        } else
            throw new Error(msg.getMsgText("jsdoMSG001", "assign() or update()"));
    };

    // Alias for assign() method
    this.update = this.assign;

    this.remove = function() {
        if (this._defaultTableRef) {
            return this._defaultTableRef.remove();
        } else
            throw new Error(msg.getMsgText("jsdoMSG001", "remove()"));
    };

    this.getId = function() {
        if (this._defaultTableRef)
            return this._defaultTableRef.getId();
        throw new Error(msg.getMsgText("jsdoMSG001", "getId()"));
    };

    // getErrors() - JSDO
    this.getErrors = function() {
        if (this._defaultTableRef)
            return this._defaultTableRef.getErrors();
        throw new Error(msg.getMsgText("jsdoMSG001", "getErrors()"));
    };

    this.getErrorString = function() {
        if (this._defaultTableRef)
            return this._defaultTableRef.getErrorString();
        throw new Error(msg.getMsgText("jsdoMSG001", "getErrorString()"));
    };

    /*
     * Finds a record in the JSDO memory using the specified function to determine the record.
     */
    this.find = function(fn) {
        if (this._defaultTableRef)
            return this._defaultTableRef.find(fn);
        throw new Error(msg.getMsgText("jsdoMSG001", "find()"));
    };

    this.foreach = function(fn) {
        if (this._defaultTableRef)
            return this._defaultTableRef.foreach(fn);
        throw new Error(msg.getMsgText("jsdoMSG001", "foreach()"));
    };

    this.setSortFields = function(sortFields) {
        if (this._defaultTableRef)
            return this._defaultTableRef.setSortFields(sortFields);
        throw new Error(msg.getMsgText("jsdoMSG001", "setSortFields()"));
    };

    this.setSortFn = function(fn) {
        if (this._defaultTableRef)
            return this._defaultTableRef.setSortFn(fn);
        throw new Error(msg.getMsgText("jsdoMSG001", "setSortFn()"));
    };

    this.sort = function(arg1) {
        if (this._defaultTableRef)
            return this._defaultTableRef.sort(arg1);
        throw new Error(msg.getMsgText("jsdoMSG001", "sort()"));
    };

    this._clearErrors = function(clearErrorString) {
        /* Default to false */
        if (typeof(clearErrorString) == 'undefined') {
            clearErrorString = false;
        }

        this._lastErrors = [];
        for (var buf in this._buffers) {
            this._buffers[buf]._lastErrors = [];

            // Clears out errorString for any rejected row change
            if (clearErrorString) {
                this._buffers[buf]._clearErrorStrings()
            }
        }
    };

    /**
     * setAllRecordsRejected
     * 
     * Sets _allRecordsRejected flag to indicate whether all records have been rejected
     * in a saveChanges() call.
     * If changes are specified as an array, the changes are used to calculate the flag.
     * 
     * @param {*} param - Array with changes or boolean with value
     */
    this._setAllRecordsRejected = function(param) {
        var changes,
            hasErrors,
            hasRejected,
            hasCommittedRecords,
            i;

        // Note: This function is a single one-stop convenient function to set             
        // _allRecordsRejected and _someRecordsRejected.
        // This logic can be optimized by setting the flags while processing the response.
        if (param instanceof Object) {
            if (param instanceof Array) {
                changes = param;
                hasErrors = false;

                this._allRecordsRejected = false;
                this._someRecordsRejected = false;

                for (var buf in this._buffers) {
                    if (this._buffers[buf]._lastErrors.length > 0) {
                        hasErrors = true;
                    }
                }
                if (hasErrors) {
                    this._allRecordsRejected = true;
                    this._someRecordsRejected = true;

                    for (i = 0; i < changes.length; i += 1) {
                        if (changes[i].record && !changes[i].record.data._rejected) {
                            this._allRecordsRejected = false;
                            return;
                        }
                    }
                } else if (changes.length > 0) {
                    this._allRecordsRejected = true;
                    this._someRecordsRejected = false;
                    hasCommittedRecords = false;

                    for (i = 0; i < changes.length; i += 1) {
                        if (changes[i].record) {
                            if (changes[i].record.data._rejected) {
                                this._someRecordsRejected = true;
                            } else {
                                hasCommittedRecords = true;
                            }
                        }
                    }
                    if (hasCommittedRecords && !this._someRecordsRejected) {
                        this._allRecordsRejected = false;
                    }
                }
            } else {
                if (param.operations instanceof Array) {
                    if (param.operations.length > 0 &&
                        !param.operations[0].success) {
                        // First operation failed
                        this._allRecordsRejected = true;
                        this._someRecordsRejected = true;

                        for (i = 0; i < param.operations.length; i += 1) {
                            if (param.operations[i].success) {
                                this._allRecordsRejected = false;
                                return;
                            }
                        }
                    } else {
                        // Not all operations were rejected
                        this._allRecordsRejected = false;
                        this._someRecordsRejected = false;

                        for (i = 0; i < param.operations.length; i += 1) {
                            if (!param.operations[i].success) {
                                this._someRecordsRejected = true;
                                return;
                            }
                        }
                    }
                }
            }
        } else {
            // Possible values: true, false, undefined
            this._allRecordsRejected = param;
            this._someRecordsRejected = param;
        }
    };

    /*
     * Loads data from the HTTP resource.
     */
    this.fill = function() {
        var objParam,
            promise,
            properties,
            mapping;

        try {
            // Clear errors before sending request                
            this._clearErrors();

            // Reset _allRecordsRejected
            this._setAllRecordsRejected(undefined);

            // Process parameters
            if (arguments.length !== 0) {
                // Call to fill() has parameters
                if (typeof(arguments[0]) == 'function') {
                    throw new Error(msg.getMsgText("jsdoMSG024", "JSDO", "fill() or read()"));
                }

                properties = this.getMethodProperties("read");

                // Get plugin if mappingType is not undefined, null, or ""
                if (properties && properties.mappingType) {
                    mapping = progress.data.PluginManager.getPlugin(properties.mappingType);
                    if (!mapping) {
                        throw new Error(msg.getMsgText("jsdoMSG118", properties.mappingType));
                    }
                }

                // fill( string);
                var filter;
                if (arguments[0] === null || arguments[0] === undefined) {
                    filter = "";
                } else if (typeof(arguments[0]) == "string") {
                    filter = arguments[0];
                    objParam = { filter: filter };
                } else if (typeof(arguments[0]) == "object") {
                    // options 
                    // ablFilter, id, top, skip, sort

                    if (arguments[0].mergeMode) {
                        this._fillMergeMode = arguments[0].mergeMode
                        switch (arguments[0].mergeMode) {
                            case progress.data.JSDO.MODE_APPEND:
                            case progress.data.JSDO.MODE_EMPTY:
                            case progress.data.JSDO.MODE_MERGE:
                            case progress.data.JSDO.MODE_REPLACE:
                                break;
                            default:
                                throw new Error(msg.getMsgText("jsdoMSG022"));
                        }

                    }

                    // Use plugin if mappingType is not undefined, null, or ""
                    if (mapping) {
                        if (typeof(mapping.requestMapping) === "function") {
                            objParam = mapping.requestMapping(this, arguments[0], { operation: "read" });
                        } else {
                            objParam = arguments[0];
                        }
                    } else {
                        if (properties.capabilities) {
                            throw new Error(msg.getMsgText("jsdoMSG119"));
                        }
                        objParam = arguments[0];
                    }
                } else {
                    throw new Error(msg.getMsgText("jsdoMSG025", "JSDO", "fill() or read()"));
                }
            } else {
                // fill();			
                objParam = null;
            }

            var xhr = new XMLHttpRequest();
            var request = {
                xhr: xhr,
                jsdo: this,
                objParam: objParam
            };

            xhr.request = request;
            xhr.jsdo = this;

            xhr.onSuccessFn = this._fillSuccess;
            xhr.onErrorFn = this._fillError;
            xhr.onCompleteFn = this._fillComplete;
            xhr.onreadystatechange = this.onReadyStateChangeGeneric;

            this.trigger("beforeFill", this, request);

            if (this._resource) {
                if (typeof(this._resource.generic.read) == "function") {
                    xhr.objParam = objParam;
                    this._resource.generic.read.call(this, xhr, this._async);
                    if (xhr.request.deferred) {
                        promise = xhr.request.deferred.promise();
                    }
                } else {
                    throw new Error("JSDO: READ operation is not defined.");
                }
            } else {
                // Old approach to call READ
                this._session._openRequest(xhr, 'GET', this.url, this._async);
                try {
                    xhr.send(null);
                } catch (e) {
                    request.exception = e;
                    // get the Client Context ID (AppServer ID)
                    xhr.jsdo._session._checkServiceResponse(xhr, request.success, request);
                }
            }

            // This is the scenario where the read.call did not reach server. i.e.,
            // some problem in between making successful call to server and we are 
            // completing the fill() operation with necessary cleanup operations
            if (request.success == false && request.exception) {

                if ((typeof xhr.onErrorFn) == 'function') {
                    xhr.onErrorFn(xhr.jsdo, request.success, request);
                }

                // get the Client Context ID (AppServer ID)
                xhr.jsdo._session._checkServiceResponse(xhr, request.success, request);

                if ((typeof xhr.onCompleteFn) == 'function') {
                    xhr.onCompleteFn(xhr.jsdo, request.success, request);
                }
            }
        } catch (error) {
            if (progress.util.Deferred.useJQueryPromises) {
                throw error;
            } else {
                var deferred;
                if (!(xhr && xhr.deferred)) {
                    deferred = new progress.util.Deferred();
                    promise = deferred.promise();
                }
                deferred.reject(this, false, {
                    errorObject: error
                });
            }
        }
        return promise;
    };

    // Alias for fill() method
    this.read = this.fill;

    /*
     * Clears all data (including any pending changes) for each buffer in JSDO
     */
    this._clearData = function() {
        for (var buf in this._buffers) {
            this._buffers[buf]._clearData();
        }
    };

    /*
     * Executes a CRUD operation using the built-in API.
     */
    this._execGenericOperation = function(operation, objParam, request,
        onCompleteFn, onSuccessFn, onErrorFn) {

        var xhr = new XMLHttpRequest();
        request.xhr = xhr;
        request.jsdo = this;
        request.objParam = objParam;
        request.operation = operation;
        xhr.jsdo = this;
        xhr.onCompleteFn = onCompleteFn;
        xhr.onSuccessFn = onSuccessFn;
        xhr.onErrorFn = onErrorFn;
        xhr.onreadystatechange = this.onReadyStateChangeGeneric;
        xhr.request = request;

        this._convertRequestData(objParam);

        var operationStr;
        switch (operation) {
            case progress.data.JSDO._OP_READ:
            case progress.data.JSDO._OP_CREATE:
            case progress.data.JSDO._OP_UPDATE:
            case progress.data.JSDO._OP_DELETE:
            case progress.data.JSDO._OP_SUBMIT:
                operationStr = PROGRESS_JSDO_OP_STRING[operation];
                break;
            default:
                throw new Error("JSDO: Unexpected operation " + operation + " in HTTP request.");
        }

        if (this._resource) {
            if (typeof(this._resource.generic[operationStr]) == "function") {
                xhr.objParam = objParam;
                this._resource.generic[operationStr](xhr, this._async);
            } else {
                // "JSDO: {1} operation is not defined."
                throw new Error(msg.getMsgText("jsdoMSG046", operationStr.toUpperCase()));
            }
        }
    };

    // Determines if any fields need a conversion when data sent to backend
    this._initConvertForServer = function() {
        var i, buf, schema;

        // If set, we're good. Field lists for conversion have already been created
        if (this._convertForServer !== undefined) {
            return;
        }

        this._convertForServer = false;
        for (buf in this._buffers) {
            schema = this._buffers[buf].getSchema();
            this._buffers[buf]._convertFieldsForServer = [];
            this._buffers[buf]._convertForServer = false;

            // Check if any fields need conversion
            for (i = 0; i < schema.length; i++) {
                if (schema[i].ablType && this._ablTypeNeedsConversion(schema[i].ablType)) {
                    this._buffers[buf]._convertFieldsForServer.push({
                        name: schema[i].name,
                        ablType: schema[i].ablType
                    });
                }
            }
            if (this._buffers[buf]._convertFieldsForServer.length > 0) {
                this._convertForServer = true;
                this._buffers[buf]._convertForServer = true;
            }
        }
    };

    this._convertRequestData = function(objParam) {
        var buf,
            beforeData;

        if (this._convertForServer === false) {
            return;
        }

        // We know at least one table has a field to convert 
        for (buf in this._buffers) {
            if (this._buffers[buf]._convertForServer) {
                if (objParam[this._dataSetName]) {
                    // First convert after-table
                    if (objParam[this._dataSetName][buf]) {
                        this._convertTableData(this._buffers[buf], objParam[this._dataSetName][buf]);
                    }

                    // Now let's convert before-image data 
                    beforeData = objParam[this._dataSetName]["prods:before"];
                    if (beforeData && beforeData[buf]) {
                        this._convertTableData(this._buffers[buf], beforeData[buf]);
                    }
                }
                // This is for case where saveChanges(false) is called with no before-image data
                else if (objParam[buf]) {
                    this._convertTableData(this._buffers[buf], objParam[buf]);
                }
            }
        }
    };

    this._convertTableData = function(tableRef, tableData) {
        var i;

        for (i = 0; i < tableData.length; i++) {
            this._convertRowData(tableRef, tableData[i]);
        }
    };

    this._convertRowData = function(tableRef, record) {
        var i,
            field;

        for (i = 0; i < tableRef._convertFieldsForServer.length; i += 1) {
            field = tableRef._convertFieldsForServer[i];
            record[field.name] = this._convertField(record[field.name], field.ablType);
        }
    };

    this._convertField = function(value, ablType) {
        var result;

        if (value === undefined || value === null) {
            return value;
        }

        if (value instanceof Array) {
            var resultArray = [];
            for (var i = 0; i < value.length; i++) {
                resultArray[i] = this._convertField(value[i], ablType);
            }
            return resultArray;
        }

        try {
            switch (ablType.toUpperCase()) {
                case "DATE":
                case "DATETIME":
                    if (typeof value === 'string') {
                        result = value;
                    } else if (value instanceof Date) {
                        result = this._convertDate(value, ablType.toUpperCase());
                    } else {
                        throw new Error("Unexpected value for  " + ablType.toUpperCase() + ".");
                    }
                    break;
                default:
                    result = value;
                    break;
            }
        } catch (e) {
            throw new Error(msg.getMsgText("jsdoMSG000",
                "Error in _convertField for value: " + value + ". " + e.message));
        }

        return result;
    };

    // Convert Date object to string for DATE and DATETIME ablTypes
    // Not necessary to do for DATETIME-TZ since JSON.stringify() will do correct conversion 
    this._convertDate = function(value, ablType) {
        var result = value;

        // DATE format should be in ISO 8601 format yyyy-mm-dd
        // DATETIME format should be in ISO 8601 format yyyy-mm-ddThh:mm:ss.sss
        if (ablType === "DATE" || ablType === "DATETIME") {
            result = progress.util._pad(value.getFullYear(), 4) + '-' +
                progress.util._pad(value.getMonth() + 1) + '-' +
                progress.util._pad(value.getDate());

            if (ablType === "DATETIME") {
                result = result + "T" +
                    progress.util._pad(value.getHours()) + ":" +
                    progress.util._pad(value.getMinutes()) + ":" +
                    progress.util._pad(value.getSeconds()) + "." +
                    progress.util._pad(value.getMilliseconds(), 3);
            }
        }

        return result;
    };


    this._ablTypeNeedsConversion = function(ablType) {

        var needsConversion = false;

        switch (ablType.toUpperCase()) {
            case "DATE":
            case "DATETIME":
                needsConversion = true;
                break;
        }

        return needsConversion;
    };



    this._undefWorkingRecord = function() {
        // Set record property
        for (var buf in this._buffers) {
            this._buffers[buf]._setRecord(null);
        }
    };

    /*
     * Saves changes in the JSDO. Save any outstanding changes for CREATES, UPDATE, and DELETEs
     */
    this.saveChanges = function(useSubmit) {
        var deferred,
            promise,
            request;

        try {
            if (useSubmit === undefined) {
                useSubmit = false;
            } else if (typeof(useSubmit) != 'boolean') {
                throw new Error(msg.getMsgText("jsdoMSG025", "JSDO", "saveChanges()"));
            }

            // _fireCUDTriggersForSubmit() needs to know how saveChanges() was called
            this._useSubmit = useSubmit;

            // confirm the availability of the operations required for executing this saveChanges call
            // (_checkThatJSDOHasRequiredOperations() throws an error if there's a missing operation,
            // which this method deliberately allows to bubble up to the caller)
            this._checkThatJSDOHasRequiredOperations();

            // Don't allow Submit with just a temp-table if autoApplyChanges is true
            if (!this._dataSetName && this._useSubmit && this.autoApplyChanges) {
                /* error message: "autoApplyChanges is not supported for submit with a temp-table */
                /* Use jsdo.autoApplyChanges = false." */
                throw new Error(msg.getMsgText("jsdoMSG124"));
            }

            // Check if any data being sent to server needs to first be converted
            this._initConvertForServer();

            // Clear errors before sending request
            this._clearErrors(true);

            // Reset _allRecordsRejected
            this._setAllRecordsRejected(undefined);

            request = {
                jsdo: this
            };

            this.trigger("beforeSaveChanges", this, request);

            if (useSubmit) {
                /* Pass in request object. 
                 * Need to use same request object so before and after saveChanges events 
                 * are in sync in JSDO Submit Service. */
                promise = this._syncDataSetForSubmit(request);
            } else if (this._dataSetName) {
                promise = this._syncDataSetForCUD();
            } else {
                promise = this._syncSingleTable();
            }
        } catch (error) {
            if (progress.util.Deferred.useJQueryPromises) {
                throw error;
            } else {
                deferred = new progress.util.Deferred();
                promise = deferred.promise();
                deferred.reject(this, false, {
                    errorObject: error
                });
            }
        }
        return promise;
    };

    /* 
     * _checkThatJSDOHasRequiredOperations
        
       This method is intended to be used by the saveChanges() method to determine whether 
       the JSDO's resource definition includes the operations necessary for executing the
       types of changes that are pending in the JSDO. It checks for Submit if saveChanges
       was called with useSubmit set to true, otherwise it checks whatever CUD operations are
       pending. 
       The JSDO's internal _useSubmit property must be set correctly before this method 
       is called
     */
    this._checkThatJSDOHasRequiredOperations = function() {
        var checkedDelete = false,
            checkedCreate = false,
            checkedUpdate = false,
            buf,
            tableRef;

        if (!this._hasCUDOperations && !this._hasSubmitOperation) {
            throw new Error(msg.getMsgText("jsdoMSG026"));
        }

        // Validate the use of Submit
        if (this._useSubmit) {
            if (!this._hasSubmitOperation) {
                // "JSDO: {1} operation is not defined.";  
                throw new Error(msg.getMsgText("jsdoMSG046", "SUBMIT"));
            } else {
                return;
            }
        }

        if (!this._resource) {
            // Need the _resource property to do the validation. If not present, just return 
            // and let execution run as normal (presumably there will be an error)
            return;
        }

        // Find the pending operations and make sure they are defined
        for (buf in this._buffers) {

            tableRef = this._buffers[buf];

            if (!checkedDelete && tableRef._deleted.length > 0) {
                this._confirmOperationExists(progress.data.JSDO._OP_DELETE);
                checkedDelete = true;
            }

            if (!checkedCreate && tableRef._added.length > 0) {
                this._confirmOperationExists(progress.data.JSDO._OP_CREATE);
                checkedCreate = true;
            }

            if (!checkedUpdate && Object.keys(tableRef._changed).length > 0) {
                this._confirmOperationExists(progress.data.JSDO._OP_UPDATE);
                checkedUpdate = true;
            }

            if (checkedDelete && checkedCreate && checkedUpdate) {
                break;
            }
        }

    };

    // Determines whether a given operation is defined by the JSDO's resource
    // throws an error if it's not defined
    this._confirmOperationExists = function(operation) {
        var operationStr = PROGRESS_JSDO_OP_STRING[operation];
        if (typeof(this._resource.generic[operationStr]) !== "function") {
            // "JSDO: {1} operation is not defined."
            throw new Error(msg.getMsgText("jsdoMSG046", operationStr.toUpperCase()));
        }
    };

    this.invoke = function(name, object) {
        var deferred, promise;

        try {
            var request = this[name](object);
            if (request.deferred) {
                deferred = request.deferred;
                promise = request.deferred.promise();
            }
        } catch (error) {
            if (progress.util.Deferred.useJQueryPromises) {
                throw error;
            } else {
                if (!deferred) {
                    deferred = new progress.util.Deferred();
                    promise = deferred.promise();
                }
                deferred.reject(this, false, {
                    errorObject: error
                });
            }
        }
        return promise;
    };

    /*
     * Synchronizes changes for a TableRef
     *
     * @param operation		HTTP operation to be performed
     * @param tableRef		Handle to the TableRef
     * @param batch         Optional. batch information associated with the sync operation. 
     *                      If not specified a new one will be created.  Used for saving datasets.
     */
    this._syncTableRef = function(operation, tableRef, batch) {
        var rowData,
            requestData,
            jsonObject,
            dataSetObject;

        if (tableRef._visited) return;
        tableRef._visited = true;

        //ensure batch object is sane 
        if (!batch) {
            batch = {
                operations: []
            };
        } else if (!batch.operations) {
            batch.operations = [];
        }

        // Before children
        // Create parent records before children
        switch (operation) {
            case progress.data.JSDO._OP_CREATE:
                for (var i = 0; i < tableRef._added.length; i++) {
                    var id = tableRef._added[i];
                    var jsrecord = tableRef._findById(id, false);

                    if (!jsrecord) continue;
                    if (tableRef._processed[id]) continue;
                    tableRef._processed[id] = jsrecord.data;

                    rowData = {};
                    jsonObject = {};

                    // Make copy of row data, in case we need to convert data for backend..
                    tableRef._jsdo._copyRecord(tableRef, jsrecord.data, rowData);

                    if (this.isDataSet()) {
                        jsonObject[this._dataSetName] = {};
                        dataSetObject = jsonObject[this._dataSetName];
                        if (this._useBeforeImage("create")) {
                            dataSetObject["prods:hasChanges"] = true;
                            dataSetObject[tableRef._name] = [];

                            // Dont need to send prods:id for create, 
                            // no before table or error table to match
                            // Dont need to send prods:clientId - since only sending one record
                            rowData["prods:rowState"] = "created";
                            rowData["prods:clientId"] = jsrecord.data._id;

                            delete rowData["_id"];

                            dataSetObject[tableRef._name].push(rowData);
                        } else {
                            dataSetObject[tableRef._name] = [];
                            dataSetObject[tableRef._name].push(rowData);
                        }
                    } else {
                        jsonObject = rowData;
                    }


                    var request = {
                        operation: operation,
                        batch: batch,
                        jsrecord: jsrecord,
                        jsdo: this
                    };
                    batch.operations.push(request);

                    jsrecord._tableRef.trigger("beforeCreate", this, jsrecord, request);
                    this.trigger("beforeCreate", this, jsrecord, request);

                    this._execGenericOperation(
                        progress.data.JSDO._OP_CREATE, jsonObject, request, this._createComplete,
                        this._createSuccess, this._createError);
                }
                break;
            case progress.data.JSDO._OP_UPDATE:
                for (var id in tableRef._changed) {
                    var jsrecord = tableRef._findById(id, false);

                    if (!jsrecord) continue;
                    if (tableRef._processed[id]) continue;
                    tableRef._processed[id] = jsrecord.data;

                    rowData = {};
                    jsonObject = {};
                    requestData = {};

                    // Make copy of row data, in case we need to convert data for backend..
                    tableRef._jsdo._copyRecord(tableRef, jsrecord.data, rowData);

                    var useBeforeImageFormat = false;
                    if (this.isDataSet()) {
                        if (this._useBeforeImage("update")) {
                            useBeforeImageFormat = true;
                            jsonObject[this._dataSetName] = {};
                            dataSetObject = jsonObject[this._dataSetName];
                            dataSetObject["prods:hasChanges"] = true;
                            dataSetObject[tableRef._name] = [];

                            // Dont need to send prods:clientId - since only sending one record
                            rowData["prods:id"] = jsrecord.data._id;
                            rowData["prods:rowState"] = "modified";
                            rowData["prods:clientId"] = jsrecord.data._id;
                            delete rowData["_id"];

                            dataSetObject[tableRef._name].push(rowData);

                            // Now create before-table data
                            dataSetObject["prods:before"] = {};
                            var beforeObject = dataSetObject["prods:before"];
                            beforeObject[tableRef._name] = [];

                            var beforeRowData = {};
                            // Dont need to send prods:clientId - since only sending one record
                            beforeRowData["prods:id"] = jsrecord.data._id;

                            tableRef._jsdo._copyRecord(tableRef,
                                tableRef._beforeImage[jsrecord.data._id], beforeRowData);
                            delete beforeRowData["_id"];

                            beforeObject[tableRef._name].push(beforeRowData);
                        }
                    }

                    if (!useBeforeImageFormat) {
                        if (this._resource.service &&
                            this._resource.service.settings &&
                            this._resource.service.settings.sendOnlyChanges) {
                            tableRef._jsdo._copyRecord(tableRef, jsrecord.data, requestData,
                                tableRef._beforeImage[jsrecord.data._id]);

                            if (this._resource.idProperty) {
                                requestData[this._resource.idProperty] =
                                    jsrecord.data[this._resource.idProperty];
                            } else {
                                throw new Error(msg.getMsgText("jsdoMSG110", this._resource.name,
                                    " for sendOnlyChanges property"));
                            }
                        } else
                            requestData = rowData;

                        if (this.isDataSet()) {
                            jsonObject[this._dataSetName] = {};
                            dataSetObject = jsonObject[this._dataSetName];
                            dataSetObject[tableRef._name] = [];
                            dataSetObject[tableRef._name].push(requestData);
                        } else {
                            jsonObject = rowData;
                        }
                    }

                    var request = {
                        jsrecord: jsrecord,
                        operation: operation,
                        batch: batch,
                        jsdo: this
                    };
                    batch.operations.push(request);

                    jsrecord._tableRef.trigger("beforeUpdate", this, jsrecord, request);
                    this.trigger("beforeUpdate", this, jsrecord, request);

                    this._execGenericOperation(
                        progress.data.JSDO._OP_UPDATE, jsonObject, request, this._updateComplete,
                        this._updateSuccess, this._updateError);
                }
                break;
        }

        // Call _syncTableRef on child tables
        for (var i = 0; i < tableRef._children.length; i++) {
            var childTableName = tableRef._children[i];
            this._syncTableRef(
                operation, this._buffers[childTableName], batch);
        }

        // After children
        // Delete parent records after children

        if (operation == progress.data.JSDO._OP_DELETE) {
            for (var i = 0; i < tableRef._deleted.length; i++) {
                var id = tableRef._deleted[i]._id;
                var jsrecord = tableRef._deleted[i];

                if (!jsrecord) continue;
                tableRef._processed[id] = jsrecord.data;

                rowData = {};
                jsonObject = {};
                requestData = {};

                // Make copy of row data, in case we need to convert data for backend..
                tableRef._jsdo._copyRecord(tableRef, jsrecord.data, rowData);

                var useBeforeImageFormat = false;
                if (this.isDataSet()) {
                    if (this._useBeforeImage("delete")) {
                        useBeforeImageFormat = true;
                        jsonObject[this._dataSetName] = {};
                        dataSetObject = jsonObject[this._dataSetName];
                        dataSetObject["prods:hasChanges"] = true;

                        // There is no after tables for deletes, so just create before-table data
                        dataSetObject["prods:before"] = {};
                        var beforeObject = dataSetObject["prods:before"];
                        beforeObject[tableRef._name] = [];

                        var beforeRowData = {};

                        // Dont need to send prods:id for delete, no after table or error table to match
                        // Dont need to send prods:clientId - since only sending one record
                        beforeRowData["prods:rowState"] = "deleted";
                        beforeRowData["prods:clientId"] = jsrecord.data._id;

                        tableRef._jsdo._copyRecord(tableRef,
                            tableRef._beforeImage[rowData._id], beforeRowData);
                        beforeObject[tableRef._name].push(beforeRowData);
                    }
                }

                if (!useBeforeImageFormat) {
                    if (this._resource.service &&
                        this._resource.service.settings &&
                        this._resource.service.settings.sendOnlyChanges) {
                        if (this._resource.idProperty) {
                            requestData[this._resource.idProperty] =
                                jsrecord.data[this._resource.idProperty];
                        } else {
                            throw new Error(msg.getMsgText("jsdoMSG110", this._resource.name,
                                " for sendOnlyChanges property"));
                        }
                    } else {
                        requestData = rowData;
                    }

                    if (this.isDataSet()) {
                        jsonObject[this._dataSetName] = {};
                        dataSetObject = jsonObject[this._dataSetName];
                        dataSetObject[tableRef._name] = [];
                        dataSetObject[tableRef._name].push(requestData);
                    } else {
                        jsonObject = rowData;
                    }
                }

                var request = {
                    batch: batch,
                    jsrecord: jsrecord,
                    operation: operation,
                    jsdo: this
                };

                batch.operations.push(request);

                jsrecord._tableRef.trigger("beforeDelete", this, jsrecord, request);
                this.trigger("beforeDelete", this, jsrecord, request);

                this._execGenericOperation(
                    progress.data.JSDO._OP_DELETE, jsonObject, request, this._deleteComplete,
                    this._deleteSuccess, this._deleteError);
            }
        }
    };

    /*
     * Returns true if the specified operation type was specified in the catalog as useBeforeImage,
     * else it returns false.
     */
    this._useBeforeImage = function(opType) {

        for (var idx = 0; idx < this._resource.operations.length; idx++) {
            if (this._resource.operations[idx].type == opType) {
                return this._resource.operations[idx].useBeforeImage;
            }
        }

        return false;
    };


    /*
     * Synchronizes changes for a DataSet. This is called when we send over one row at at time
     * to Create, Update and Delete methods.
     * It handles row with or without before-image data.
     */
    this._syncDataSetForCUD = function() {
        var batch = {
                operations: []
            },
            deferred,
            promise;

        deferred = new progress.util.Deferred();
        promise = deferred.promise();
        batch.deferred = deferred;

        // Process buffers
        // Synchronize deletes
        for (var buf in this._buffers) {
            this._buffers[buf]._visited = false;
        }
        for (var buf in this._buffers) {
            var tableRef = this._buffers[buf];
            this._syncTableRef(
                progress.data.JSDO._OP_DELETE, tableRef, batch);
        }

        // Synchronize adds
        for (var buf in this._buffers) {
            this._buffers[buf]._visited = false;
        }
        for (var buf in this._buffers) {
            var tableRef = this._buffers[buf];
            this._syncTableRef(
                progress.data.JSDO._OP_CREATE, tableRef, batch);
        }

        // Synchronize updates
        for (var buf in this._buffers) {
            this._buffers[buf]._visited = false;
        }
        for (var buf in this._buffers) {
            var tableRef = this._buffers[buf];
            this._syncTableRef(
                progress.data.JSDO._OP_UPDATE, tableRef, batch);
        }

        if (this.autoApplyChanges) {
            for (var buf in this._buffers) {
                var tableRef = this._buffers[buf];
                tableRef._processed = {};
                tableRef._added = [];
                tableRef._changed = {};
                tableRef._deleted = [];
            }
        }

        // OE00229270 If _async is false, this ensures that afterSaveChanges() is called just once 
        // We now do this after all operations have been processed
        // Alternatively, scenario where the saveChanges() is invoked without
        // performing any operations. In that scenario we have to process this.
        if (!this._async || (batch.operations && batch.operations.length === 0)) {
            if (this._isBatchComplete(batch)) {
                var success = this._isBatchSuccess(batch);
                var request = {
                    batch: batch,
                    success: success
                };
                this._undefWorkingRecord();

                // Save error messages
                this._lastErrors = [];
                if (!success && batch.operations) {
                    this._updateLastErrors(this, batch, null);
                }
                this._setAllRecordsRejected(batch);

                this._fireAfterSaveChanges(success, request);
            }
        }
        // end OE00229270

        return promise;
    };


    /*
     * Synchronizes changes for a single table
     */
    this._syncSingleTable = function() {
        var deferred, promise;
        if (!this._defaultTableRef) return;
        var tableRef = this._defaultTableRef;

        var batch = {
            operations: []
        };

        deferred = new progress.util.Deferred();
        promise = deferred.promise();
        batch.deferred = deferred;

        var fireAfterSaveChanges = false;

        // Skip delete for records that were added
        // mark them as processed
        var addedRecords = {};
        for (var i = 0; i < tableRef._added.length; i++) {
            var id = tableRef._added[i];
            addedRecords[id] = id;
        }
        for (var i = 0; i < tableRef._deleted.length; i++) {
            var jsrecord = tableRef._deleted[i];
            if (!jsrecord) continue;

            var id = jsrecord.data._id;
            if (addedRecords[id]) {
                // Set request object
                // Properties async, fnName, objParam, and response 
                // are not set when the HTTP request is suppressed 
                var request = {
                    success: true,
                    xhr: undefined,
                    operation: progress.data.JSDO._OP_DELETE,
                    batch: batch,
                    jsrecord: jsrecord,
                    jsdo: this
                };
                batch.operations.push(request);
                tableRef._processed[id] = jsrecord.data;

                var jsdo = request.jsdo;
                try {
                    request.jsrecord._tableRef.trigger("afterDelete", jsdo, request.jsrecord,
                        request.success, request);
                    jsdo.trigger("afterDelete", jsdo, request.jsrecord, request.success, request);
                } finally {
                    request.complete = true;
                }

                fireAfterSaveChanges = true;
            }
        }
        addedRecords = null;

        // Synchronize deletes
        for (var i = 0; i < tableRef._deleted.length; i++) {
            var jsrecord = tableRef._deleted[i];
            if (!jsrecord) continue;

            var id = jsrecord.data._id;
            if (tableRef._processed[id]) continue;

            tableRef._processed[id] = jsrecord.data;
            fireAfterSaveChanges = false;

            var xhr = new XMLHttpRequest();
            xhr.jsdo = this;

            var request = {
                xhr: xhr,
                operation: progress.data.JSDO._OP_DELETE,
                batch: batch,
                jsrecord: jsrecord,
                jsdo: this
            };
            batch.operations.push(request);
            xhr.onCompleteFn = this._deleteComplete;
            xhr.onSuccessFn = this._deleteSuccess;
            xhr.onErrorFn = this._deleteError;
            xhr.onreadystatechange = this.onReadyStateChangeGeneric;
            xhr.request = request;

            jsrecord._tableRef.trigger("beforeDelete", this, jsrecord, request);
            this.trigger("beforeDelete", this, jsrecord, request);

            var requestData = {};
            if (this._resource.service &&
                this._resource.service.settings &&
                this._resource.service.settings.sendOnlyChanges) {
                if (this._resource.idProperty) {
                    requestData[this._resource.idProperty] = jsrecord.data[this._resource.idProperty];
                } else {
                    throw new Error(msg.getMsgText("jsdoMSG110", this._resource.name,
                        " for sendOnlyChanges property"));
                }
            } else {
                // We must copy record in case _convertRowData() needs to make conversion
                tableRef._jsdo._copyRecord(tableRef, jsrecord.data, requestData);
            }

            if (tableRef._convertForServer) {
                this._convertRowData(tableRef, requestData);
            }

            if (this._resource) {
                if (typeof(this._resource.generic["delete"]) == "function") {
                    xhr.objParam = requestData;
                    this._resource.generic["delete"].call(this, xhr, this._async);
                } else {
                    throw new Error("JSDO: DELETE operation is not defined.");
                }
            } else {
                this._session._openRequest(xhr, 'DELETE', this.url + '/' + id, true);
                try {
                    xhr.send(null);
                } catch (e) {
                    request.success = false;
                    request.exception = e;
                    // let Session check for online/offline
                    xhr.jsdo._session._checkServiceResponse(xhr, request.success, request);
                }

            }
        }

        // Synchronize adds
        for (var i = 0; i < tableRef._added.length; i++) {
            var id = tableRef._added[i];
            var jsrecord = tableRef._findById(id, false);
            var requestData = {};

            if (!jsrecord) continue;
            if (tableRef._processed[id]) continue;
            tableRef._processed[id] = jsrecord.data;
            fireAfterSaveChanges = false;

            var xhr = new XMLHttpRequest();
            xhr.jsdo = this;
            var request = {
                xhr: xhr,
                jsrecord: jsrecord,
                batch: batch,
                operation: progress.data.JSDO._OP_CREATE,
                jsdo: this
            };
            batch.operations.push(request);
            xhr.onCompleteFn = this._createComplete;
            xhr.onSuccessFn = this._createSuccess;
            xhr.onErrorFn = this._createError;
            xhr.onreadystatechange = this.onReadyStateChangeGeneric;
            xhr.request = request;

            jsrecord._tableRef.trigger("beforeCreate", this, jsrecord, request);
            this.trigger("beforeCreate", this, jsrecord, request);

            if (this._resource) {
                if (typeof(this._resource.generic.create) == "function") {
                    this._copyRecord(tableRef, jsrecord.data, requestData);
                    if (this._resource.idProperty !== undefined && jsrecord.data._id !== undefined) {
                        // Remove _id when idProperty is set
                        delete requestData._id;
                    }

                    if (tableRef._convertForServer) {
                        this._convertRowData(tableRef, requestData);
                    }

                    xhr.objParam = requestData;

                    this._resource.generic.create.call(this, xhr, this._async);
                } else {
                    throw new Error("JSDO: CREATE operation is not defined.");
                }

            } else {
                this._session._openRequest(xhr, 'POST', this.url, true);
                xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                this._copyRecord(tableRef, jsrecord.data, requestData);

                if (tableRef._convertForServer) {
                    this._convertRowData(tableRef, requestData);
                }
                var input = JSON.stringify(requestData);

                try {
                    xhr.send(input);
                } catch (e) {
                    request.success = false;
                    request.exception = e;
                    // let Session check for online/offline
                    xhr.jsdo._session._checkServiceResponse(xhr, request.success, request);
                }

            }
        }

        // Synchronize updates
        for (var id in tableRef._changed) {
            var jsrecord = tableRef._findById(id, false);

            if (!jsrecord) continue;
            if (tableRef._processed[id]) continue;
            tableRef._processed[id] = jsrecord.data;
            fireAfterSaveChanges = false;

            var xhr = new XMLHttpRequest();
            var request = {
                xhr: xhr,
                jsrecord: jsrecord,
                operation: progress.data.JSDO._OP_UPDATE,
                batch: batch,
                jsdo: this
            };
            xhr.request = request;
            xhr.jsdo = this;
            batch.operations.push(request);
            xhr.onCompleteFn = this._updateComplete;
            xhr.onSuccessFn = this._updateSuccess;
            xhr.onErrorFn = this._updateError;
            xhr.onreadystatechange = this.onReadyStateChangeGeneric;

            jsrecord._tableRef.trigger("beforeUpdate", this, jsrecord, request);
            this.trigger("beforeUpdate", this, jsrecord, request);

            var requestData = {};
            if (this._resource.service &&
                this._resource.service.settings &&
                this._resource.service.settings.sendOnlyChanges) {

                tableRef._jsdo._copyRecord(tableRef, jsrecord.data, requestData,
                    tableRef._beforeImage[jsrecord.data._id]);

                if (this._resource.idProperty) {
                    requestData[this._resource.idProperty] = jsrecord.data[this._resource.idProperty];
                } else {
                    throw new Error(msg.getMsgText("jsdoMSG110", this._resource.name,
                        " for sendOnlyChanges property"));
                }
            } else {
                // We must copy record in case _convertRowData() needs to make conversion
                tableRef._jsdo._copyRecord(tableRef, jsrecord.data, requestData);
            }

            if (tableRef._convertForServer) {
                this._convertRowData(tableRef, requestData);
            }

            if (this._resource) {
                if (typeof(this._resource.generic.update) == "function") {
                    xhr.objParam = requestData;
                    this._resource.generic.update.call(this, xhr, this._async);
                } else {
                    throw new Error("JSDO: UPDATE operation is not defined.");
                }
            } else {
                this._session._openRequest(xhr, 'PUT', this.url + '/' + id, this._async);
                xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");

                var input = JSON.stringify(requestData);

                try {
                    xhr.send(input);
                } catch (e) {
                    request.success = false;
                    request.exception = e;
                    // let Session check for online/offline
                    xhr.jsdo._session._checkServiceResponse(xhr, request.success, request);
                }
            }
        }

        if (this.autoApplyChanges) {
            // Arrays to keep track of changes
            tableRef._added = [];
            tableRef._changed = {};
            tableRef._deleted = [];
            tableRef._processed = {};
        }

        // OE00229270 If _async is false, fire afterSaveChanges() after all operations are processed 
        if (!this._async)
            fireAfterSaveChanges = true;

        if (fireAfterSaveChanges) {
            var jsdo = this;
            var request = {
                batch: batch,
                success: true
            };

            // Save error messages
            jsdo._lastErrors = [];
            if (batch.operations) {
                jsdo._updateLastErrors(jsdo, batch, null);
            }

            jsdo._undefWorkingRecord();
            jsdo._fireAfterSaveChanges(request.success, request);
        }

        return promise;
    };

    /************************************************************************
     *
     * Synchronizes changes for a DataSet or a temp-table, sending over the entire change-set
     * to saveChanges() on server
     * If sync'ing a DataSet, sends over before-image and after-image data.
     */
    this._syncDataSetForSubmit = function(request) {
        var deferred,
            promise,
            jsonObject,
            completeFn = this._saveChangesComplete,
            successFn = this._saveChangesSuccess,
            errorFn = this._saveChangesError;

        deferred = new progress.util.Deferred();
        promise = deferred.promise();
        request.deferred = deferred;

        request.jsrecords = [];

        // First thing to do is to create jsonObject with before and after image data for all 
        // records in change-set (creates, updates and deletes)
        if (this._dataSetName) {
            jsonObject = this._createChangeSet(this._dataSetName, false, request);
        } else {
            // just a temp-table. Need to create it somewhat differently from DS 
            // (no before and after image data)
            jsonObject = this._createTTChangeSet(this._defaultTableRef, request);
            successFn = this._saveChangesSuccessTT; // will process success response differently from DS
        }

        this._execGenericOperation(progress.data.JSDO._OP_SUBMIT, jsonObject, request,
            completeFn, successFn, errorFn);

        return promise;
    };

    /************************************************************************
     *
     * Private method that creates a jsonObject with before and after image data for all
     * records in change-set (creates, updates and deletes)
     *
     * Params: dataSetName is required.
     *         alwaysCreateTable is required. If true, always create table array (even if no data/changes)
     *         request is optional
     */
    this._createChangeSet = function(dataSetName, alwaysCreateTable, request) {
        var changeSetJsonObject = {};

        changeSetJsonObject[dataSetName] = {};
        var dataSetJsonObject = changeSetJsonObject[dataSetName];

        var hasChanges = dataSetJsonObject["prods:hasChanges"] = this._hasChanges();
        if (hasChanges) {
            if ((alwaysCreateTable === true)) {
                for (var buf in this._buffers) {
                    dataSetJsonObject[this._buffers[buf]._name] = [];
                }
            }

            // First do deletes
            //for (var buf in this._buffers) { this._buffers[buf]._visited = false; }
            for (var buf in this._buffers) {
                var tableRef = this._buffers[buf];
                this._addDeletesToChangeSet(tableRef, dataSetJsonObject, request);
            }

            //  Adds
            //for (var buf in this._buffers) { this._buffers[buf]._visited = false; }
            for (var buf in this._buffers) {
                var tableRef = this._buffers[buf];
                this._addCreatesToChangeSet(tableRef, dataSetJsonObject, request);
            }

            // Updates
            //for (var buf in this._buffers) { this._buffers[buf]._visited = false; }
            for (var buf in this._buffers) {
                var tableRef = this._buffers[buf];
                this._addChangesToChangeSet(tableRef, dataSetJsonObject, request);
            }

            // Clear _processed map
            for (var buf in this._buffers) {
                this._buffers[buf]._processed = {};
            }
        }

        // Check if change set is empty
        // A saveChanges() with a delete of new record would result in an empty change set        
        // An empty DataSet is sent to the server to ensure that AfterSaveChanges fires
        var keys = Object.keys(changeSetJsonObject[dataSetName]);
        if (keys.length == 1 && keys[0] == "prods:hasChanges") {
            for (var buf in this._buffers) {
                dataSetJsonObject[this._buffers[buf]._name] = [];
            }
            dataSetJsonObject["prods:hasChanges"] = false;
        }

        return changeSetJsonObject;
    };

    /************************************************************************
     *
     * Private method that creates a jsonObject for the created and changed records
     * in a temp-table. There is no before-image information. This is used in the
     * case of a Submit operation when the JSDO is just for a temp-table 
     *
     * Params: dataSetName is required.
     *         alwaysCreateTable is required. If true, always create table array (even if no data/changes)
     *         request is optional
     */
    this._createTTChangeSet = function(tableRef, request) {
        var changeSetJsonObject = {},
            hasChanges,
            tempTableJsonObject,
            i,
            id,
            jsrecord;

        changeSetJsonObject[tableRef._name] = [];
        tempTableJsonObject = changeSetJsonObject[tableRef._name];

        hasChanges = this._hasChanges();
        if (hasChanges) {

            // (note that we do not send deleted rows on submit for a temp-table)

            //  Adds
            for (i = 0; i < tableRef._added.length; i++) {
                id = tableRef._added[i];
                jsrecord = tableRef._findById(id, false);
                if (jsrecord) {
                    if (!tableRef._processed[jsrecord.data._id]) {
                        this._addRowToTTChangeSet(tableRef, jsrecord, tempTableJsonObject,
                            request, "beforeCreate");
                    }
                }
            }

            // changed rows
            for (id in tableRef._changed) {
                if (tableRef._changed.hasOwnProperty(id)) {
                    jsrecord = tableRef._findById(id, false);
                    if (jsrecord) {
                        if (!tableRef._processed[jsrecord.data._id]) {
                            this._addRowToTTChangeSet(tableRef, jsrecord, tempTableJsonObject,
                                request, "beforeUpdate");
                        }
                    }
                }
            }

            // Clear _processed map
            tableRef._processed = {};
        }

        return changeSetJsonObject;
    };

    this._addRowToTTChangeSet = function(tableRef, jsrecord, tempTableJsonObject, request, event) {
        var rowData = {};

        tableRef._processed[jsrecord.data._id] = jsrecord.data;

        // Store jsrecord in request object so we can access it when saveChanges completes, 
        // in order to run afterCreate events
        if (typeof(request) != 'undefined') {
            request.jsrecords.push(jsrecord);

            // Need to call beforeCreate trigger when saveChanges(true) is called
            jsrecord._tableRef.trigger(event, this, jsrecord, request);
            this.trigger(event, this, jsrecord, request);
        }

        tableRef._jsdo._copyRecord(tableRef, jsrecord.data, rowData);
        delete rowData["_id"];

        tempTableJsonObject.push(rowData);
    };

    /************************************************************************
     *
     * Private method that creates a jsonObject with data and also before image data
     *  for all records in change-set (creates, updates and deletes)
     *
     * Params: dataSetName is required.
     * It returns jsonObject that can be used as input to addRecords()
     */
    this._createDataAndChangeSet = function(dataSetName) {
        var jsonObject = {};

        jsonObject[dataSetName] = {};
        var dataSetJsonObject = jsonObject[dataSetName];

        /* We always want to create tables (even if there's no data) so we can compare schemas
         * of data in local storage to JSDO's schema */
        for (var buf in this._buffers)
            dataSetJsonObject[this._buffers[buf]._name] = [];

        if (this._hasChanges()) {
            dataSetJsonObject["prods:hasChanges"] = true;
        }

        // Add data from each table. This will also add bi data for any created or updated rows
        for (var buf in this._buffers) {
            var tableRef = this._buffers[buf];
            this._addRecordsToObject(tableRef, dataSetJsonObject);
        }

        // Now do deletes
        for (var buf in this._buffers) {
            var tableRef = this._buffers[buf];
            this._addDeletesToChangeSet(tableRef, dataSetJsonObject);
        }

        // Clear _processed map
        for (var buf in this._buffers) {
            this._buffers[buf]._processed = {};
        }
        return jsonObject;
    };

    // This method adds all record for specified table into dataSetJsonObject.
    // If record has bi data, it adds that as well
    this._addRecordsToObject = function(tableRef, dataSetJsonObject) {

        if (tableRef._data.length > 0 && !dataSetJsonObject[tableRef._name])
            dataSetJsonObject[tableRef._name] = [];

        for (var i = 0; i < tableRef._data.length; i++) {
            var record = tableRef._data[i];
            if (!record) continue;

            // Check if record has bi data, can only determine if it's created or changed since
            // deleted rows are not in after data
            if (this._doesRecordHaveCreateBIData(tableRef, record._id) === true) {
                var jsrecord = tableRef._findById(record._id, false);
                if (!jsrecord) continue;
                if (tableRef._processed[jsrecord.data._id]) continue;
                this._addCreatedRowToChangeSet(tableRef, jsrecord, dataSetJsonObject);
            }
            if (this._doesRecordHaveUpdateBIData(tableRef, record._id) === true) {
                var jsrecord = tableRef._findById(record._id, false);
                if (!jsrecord) continue;
                if (tableRef._processed[jsrecord.data._id]) continue;
                this._addChangedRowToChangeSet(tableRef, jsrecord, dataSetJsonObject);
            } else {
                if (tableRef._processed[record._id]) continue;
                tableRef._processed[record._id] = record;

                var rowData = {};

                tableRef._jsdo._copyRecord(tableRef, record, rowData);
                delete rowData["_id"];

                dataSetJsonObject[tableRef._name].push(rowData);
            }
        }
    };


    // Check if specified after record has bi data for newly created record.
    // Returns True if after record has corresponding bi data, else false
    this._doesRecordHaveCreateBIData = function(tableRef, id) {
        for (var i = 0; i < tableRef._added.length; i++) {
            if (tableRef._added[i] === id)
                return true;
        }

        return false;
    };

    // Check if specified after record has bi data for updated record.
    // Returns True if after record has corresponding bi data, else false
    this._doesRecordHaveUpdateBIData = function(tableRef, id) {
        for (var changedId in tableRef._changed) {
            if (changedId === id)
                return true;
        }

        return false;
    };


    // If a create, remove or update exists, method returns true, else returns false
    this._hasChanges = function() {
        var hasChanges = false;

        for (var buf in this._buffers) {
            var tableRef = this._buffers[buf];

            var hasUpdates = false;
            for (var id in tableRef._changed) {
                hasUpdates = true;
                break;
            }

            if (tableRef._deleted.length > 0 || tableRef._added.length > 0 || hasUpdates) {
                hasChanges = true;
                break;
            }
        }

        return hasChanges;
    };

    // This method is used when saveChanges() is called, and also when storing data to local storage.
    // The request param should be defined for saveChanges(),
    // but not needed when storing data to local storage
    this._addDeletesToChangeSet = function(tableRef, dataSetJsonObject, request) {
        // There is no after table for deletes, so just create before-table data
        for (var i = 0; i < tableRef._deleted.length; i++) {
            var jsrecord = tableRef._deleted[i];

            if (!jsrecord) continue;

            if (jsrecord.data &&
                jsrecord.data._id !== undefined &&
                tableRef._beforeImage[jsrecord.data._id] === null) {
                // Deleted record is for a new record - do not send deleted record to server
                continue;
            }

            this._addDeletedRowToChangeSet(tableRef, jsrecord, dataSetJsonObject, request);
        }
    };

    this._addDeletedRowToChangeSet = function(tableRef, jsrecord, dataSetJsonObject, request) {
        tableRef._processed[jsrecord.data._id] = jsrecord.data;

        // Store jsrecord in request object so we can access it when saveChanges completes, 
        // in order to run afterDelete events
        jsrecord.data["prods:rowState"] = "deleted";

        if (typeof(request) != 'undefined') {
            request.jsrecords.push(jsrecord);

            // Need to call beforeDelete trigger if saveChanges(true) is called
            jsrecord._tableRef.trigger("beforeDelete", this, jsrecord, request);
            this.trigger("beforeDelete", this, jsrecord, request);
        }

        var beforeRowData = {};
        // AppServer will roundtrip this back to jsdo client
        beforeRowData["prods:clientId"] = jsrecord.data._id;
        beforeRowData["prods:rowState"] = "deleted";

        var beforeTableJsonObject = this._getTableInBeforeJsonObject(dataSetJsonObject, tableRef._name);
        tableRef._jsdo._copyRecord(tableRef, tableRef._beforeImage[jsrecord.data._id], beforeRowData);
        delete beforeRowData["_id"];

        beforeTableJsonObject.push(beforeRowData);
    };

    // This method is used when saveChanges() is called, and also when storing data to local storage.
    // The request param should be defined for saveChanges(), 
    // but not needed when storing data to local storage
    this._addCreatesToChangeSet = function(tableRef, dataSetJsonObject, request) {
        // There is no before table for creates, so just create after-table data
        for (var i = 0; i < tableRef._added.length; i++) {
            var id = tableRef._added[i];
            var jsrecord = tableRef._findById(id, false);
            if (!jsrecord) continue;
            if (tableRef._processed[jsrecord.data._id]) continue;

            this._addCreatedRowToChangeSet(tableRef, jsrecord, dataSetJsonObject, request);
        }
    };

    this._addCreatedRowToChangeSet = function(tableRef, jsrecord, dataSetJsonObject, request) {
        tableRef._processed[jsrecord.data._id] = jsrecord.data;

        if (!dataSetJsonObject[tableRef._name]) {
            dataSetJsonObject[tableRef._name] = [];
        }

        // Store jsrecord in request object so we can access it when saveChanges completes, 
        // in order to run afterCreate events
        jsrecord.data["prods:rowState"] = "created";

        if (typeof(request) != 'undefined') {
            request.jsrecords.push(jsrecord);

            // Need to call beforeCreate trigger when saveChanges(true) is called
            jsrecord._tableRef.trigger("beforeCreate", this, jsrecord, request);
            this.trigger("beforeCreate", this, jsrecord, request);
        }

        var rowData = {};
        // AppServer will roundtrip this back to jsdo client
        rowData["prods:clientId"] = jsrecord.data._id;
        rowData["prods:rowState"] = "created";

        tableRef._jsdo._copyRecord(tableRef, jsrecord.data, rowData);
        delete rowData["_id"];

        dataSetJsonObject[tableRef._name].push(rowData);
    };

    // This method is used when saveChanges() is called, and also when storing data to local storage.
    // The request param should be defined for saveChanges(),
    // but not needed when storing data to local storage
    this._addChangesToChangeSet = function(tableRef, dataSetJsonObject, request) {
        // For Changes, there is both before and after table data
        for (var id in tableRef._changed) {
            var jsrecord = tableRef._findById(id, false);
            if (!jsrecord) continue;
            if (tableRef._processed[jsrecord.data._id]) continue;

            this._addChangedRowToChangeSet(tableRef, jsrecord, dataSetJsonObject, request);
        }
    };

    this._addChangedRowToChangeSet = function(tableRef, jsrecord, dataSetJsonObject, request) {
        tableRef._processed[jsrecord.data._id] = jsrecord.data;

        if (!dataSetJsonObject[tableRef._name]) {
            dataSetJsonObject[tableRef._name] = [];
        }

        // Store jsrecord in request object so we can access it when saveChanges completes, in order
        // to run afterUpdate events
        jsrecord.data["prods:rowState"] = "modified";

        if (typeof(request) != 'undefined') {
            request.jsrecords.push(jsrecord);

            // Need to call beforeUpdate trigger when saveChanges(true) is called
            jsrecord._tableRef.trigger("beforeUpdate", this, jsrecord, request);
            this.trigger("beforeUpdate", this, jsrecord, request);
        }

        var rowData = {};
        // Required by AppServer in before-image data. Matches before row
        rowData["prods:id"] = jsrecord.data._id;
        // AppServer will roundtrip this back to jsdo client
        rowData["prods:clientId"] = jsrecord.data._id;
        rowData["prods:rowState"] = "modified";

        tableRef._jsdo._copyRecord(tableRef, jsrecord.data, rowData);
        delete rowData["_id"];

        dataSetJsonObject[tableRef._name].push(rowData);

        // Now add before-image data
        var beforeTableJsonObject = this._getTableInBeforeJsonObject(dataSetJsonObject, tableRef._name);
        var beforeRowData = {};
        // Required by AppServer in before-image data. Matches after row
        beforeRowData["prods:id"] = jsrecord.data._id;

        tableRef._jsdo._copyRecord(tableRef, tableRef._beforeImage[jsrecord.data._id], beforeRowData);
        //delete beforeRowData["_id"]; 

        beforeTableJsonObject.push(beforeRowData);
    };


    // Private method to get table's json object from the specified dataset json object.
    // If it hasn't been created yet, this method creates it.
    this._getTableInBeforeJsonObject = function(dataSetJsonObject, tableName) {
        if (!dataSetJsonObject["prods:before"]) {
            dataSetJsonObject["prods:before"] = {};
        }
        var beforeObject = dataSetJsonObject["prods:before"];

        if (!beforeObject[tableName]) {
            beforeObject[tableName] = [];
        }

        return beforeObject[tableName];
    };


    /*********************************************************************
     *
     * Reads a JSON object into the JSDO memory.
     */
    this.addRecords = function(jsonObject, addMode, keyFields, trackChanges, isInvoke) {
        if (this.isDataSet()) {
            if (jsonObject instanceof Array) {
                if (!this._defaultTableRef) {
                    throw new Error(msg.getMsgText("jsdoMSG998"));
                }
            } else {
                if (jsonObject === undefined || jsonObject === null) {
                    jsonObject = {};
                }

                if (jsonObject[this._dataSetName]) {
                    jsonObject = jsonObject[this._dataSetName];
                }
            }

            // Allow empty object in addRecords with MODE_EMPTY
            if (addMode != progress.data.JSDO.MODE_EMPTY) {
                if (Object.keys(jsonObject).length === 0)
                    throw new Error(msg.getMsgText("jsdoMSG006"));
            }

            var oldUseRelationships = this.useRelationships;
            // Turn off useRelationships since addRecords() does not use the working record			
            this.useRelationships = false;
            try {
                for (var buf in this._buffers) {
                    // Read data for tables in JSON object
                    if (jsonObject[this._buffers[buf]._name])
                        this._addRecords(this._buffers[buf]._name, jsonObject, addMode,
                            keyFields, trackChanges, isInvoke);
                    else if (addMode == progress.data.JSDO.MODE_EMPTY) {
                        this._buffers[this._buffers[buf]._name]._clearData();
                    }
                }
            } finally {
                // Restore useRelationships
                this.useRelationships = oldUseRelationships;
            }
        } else if (this._defaultTableRef) {
            this._addRecords(this._defaultTableRef._name, jsonObject, addMode, keyFields,
                trackChanges, isInvoke);
        }
    };

    /*
     * Copies the fields of the source record to the target record.
     * Preserves the _id of the target record.
     */
    this._copyRecord = function(tableRef, source, target, onlyChangesRecord) {
        for (var field in source) {

            if (onlyChangesRecord !== undefined) {
                if (source[field] == onlyChangesRecord[field])
                    continue;
            }

            // Fix for PSC00277769
            if (source[field] === undefined || source[field] === null) {
                target[field] = source[field];
            } else if (source[field] instanceof Date) {
                target[field] = source[field];
            } else if (typeof source[field] === 'object') {
                var newObject = source[field] instanceof Array ? [] : {};
                this._copyRecord(tableRef, source[field], newObject);
                target[field] = newObject;
            } else
                target[field] = source[field];
        }
    };

    /*
     * Deletes the "prods:" properties when no longer needed, 
     * typically when doing acceptChanges, rejectChanges, or _applyChanges.
     * These properties are used to transfer before-image info between client JSDO and AppServer.
     *
     * Also, it optionally clears out the errorString field depending upon value of clearErrorString. 
     * To be consistent with the handling of 
     * the ABL's Buffer ERROR-STRING attribute, 
     * the errorString field should be cleared out when doing acceptChanges() or rejectChanges().
     */
    this._deleteProdsProperties = function(record, clearErrorString, deleteRowState) {

        /* Default to false */
        if (typeof(clearErrorString) == 'undefined') {
            clearErrorString = false;
        }

        /* Default to true */
        if (typeof(deleteRowState) == 'undefined') {
            deleteRowState = true;
        }

        if (record) {
            delete record["prods:id"];
            delete record["prods:hasErrors"];
            delete record["prods:clientId"];
            delete record["prods:rejected"];
            delete record._rejected;

            if (deleteRowState) {
                delete record["prods:rowState"];
            }

            if (clearErrorString) {
                delete record._errorString;
            }
        }
    };

    this._addRecords = function(tableName, jsonObject, addMode, keyFields, trackChanges, isInvoke) {
        var beforeImageJsonObject = null;
        var beforeImageJsonIndex = null;

        if (jsonObject && (this._dataSetName !== undefined)) {
            if (jsonObject[this._dataSetName] &&
                jsonObject[this._dataSetName]["prods:hasChanges"]) {
                beforeImageJsonObject = jsonObject;
                beforeImageJsonIndex = {};
            } else if (jsonObject["prods:hasChanges"]) {
                beforeImageJsonObject = {};
                beforeImageJsonObject[this._dataSetName] = jsonObject;
                beforeImageJsonIndex = {};
            }
        }

        if (typeof(tableName) != 'string')
            throw new Error(msg.getMsgText("jsdoMSG020"));
        if (!addMode)
            throw new Error(msg.getMsgText("jsdoMSG021"));

        switch (addMode) {
            case progress.data.JSDO.MODE_APPEND:
            case progress.data.JSDO.MODE_EMPTY:
            case progress.data.JSDO.MODE_MERGE:
            case progress.data.JSDO.MODE_REPLACE:
                break;
            default:
                throw new Error(msg.getMsgText("jsdoMSG022"));
        }

        if (!keyFields)
            keyFields = [];
        else {
            if (!(keyFields instanceof Array) && (typeof(keyFields) == 'object')) {
                if (keyFields[tableName]) {
                    keyFields = keyFields[tableName];
                } else {
                    keyFields = [];
                }
            }
        }

        if (!(keyFields instanceof Array)) {
            throw new Error(msg.getMsgText("jsdoMSG008"));
        }

        // Check that the specified field names are in the schema
        if (this._buffers[tableName]._fields) {
            for (var i = 0; i < keyFields.length; i++) {
                var field = this._buffers[tableName]._fields[keyFields[i].toLowerCase()];
                if (field === undefined) {
                    throw new Error(msg.getMsgText("jsdoMSG009", keyFields[i]));
                } else {
                    keyFields[i] = field.name;
                }
            }
        }

        trackChanges = trackChanges ? true : false;

        if (tableName) {
            if (!(jsonObject instanceof Array)) {
                var data = null;

                if (jsonObject === undefined || jsonObject === null) {
                    jsonObject = {};
                }

                if (this.isDataSet()) {
                    if (jsonObject[this._dataSetName])
                        data = jsonObject[this._dataSetName][tableName];
                    else if (jsonObject[tableName])
                        data = jsonObject[tableName];
                } else {
                    if (this._dataProperty)
                        data = jsonObject[this._dataProperty];
                    else if (jsonObject.data)
                        data = jsonObject.data;
                }


                if (data instanceof Array) {
                    // saveJsonObject = jsonObject;
                    jsonObject = data;
                } else if ((addMode == progress.data.JSDO.MODE_EMPTY) &&
                    (typeof(jsonObject) == 'object') &&
                    (Object.keys(jsonObject).length === 0)) {
                    jsonObject = []; // Allow empty object in addRecords with
                    // MODE_EMPTY
                }
                // Allow empty object when called by restoreChangesOnlyForTable()
                // where there are only deletes - in bi data
                else if ((addMode == progress.data.JSDO.MODE_REPLACE) &&
                    (typeof(jsonObject) == 'object') &&
                    (beforeImageJsonObject)) {
                    jsonObject = [];
                }
            }

            if (!(jsonObject instanceof Array)) {
                throw new Error(msg.getMsgText("jsdoMSG005", tableName));
            }

            var dataHasBeenProcessed = false;
            try {
                this._buffers[tableName]._sortRecords = false;
                if (keyFields.length === 0 || addMode == progress.data.JSDO.MODE_EMPTY) {
                    // Quick merge
                    if (addMode == progress.data.JSDO.MODE_EMPTY) {
                        this._buffers[tableName]._clearData();
                    }
                    // APPEND, MERGE, REPLACE
                    for (var i = 0; i < jsonObject.length; i++) {
                        var jsrecord = this._buffers[tableName]._add(jsonObject[i], trackChanges, false);
                        jsonObject[i]._id = jsrecord.data._id;
                        if (beforeImageJsonIndex && jsonObject[i]["prods:id"]) {
                            beforeImageJsonIndex[jsonObject[i]["prods:id"]] = jsrecord.data._id;
                        }
                        if (beforeImageJsonObject) {
                            this._deleteProdsProperties(jsrecord.data);
                        }
                    }
                } else {
                    // Build temporary index
                    var tmpIndex;

                    if (this._buffers[tableName]._data.length * jsonObject.length >= 10) {
                        tmpIndex = {};

                        for (var i = 0; i < this._buffers[tableName]._data.length; i++) {
                            var record = this._buffers[tableName]._data[i];
                            if (!record) continue;

                            var key = this._buffers[tableName]._getKey(record, keyFields);
                            tmpIndex[key] = record;
                        }

                    } else
                        tmpIndex = null; // Do not use an index
                    var checkBeforeImage =
                        (Object.keys(this._buffers[tableName]._beforeImage).length !== 0);
                    for (var i = 0; i < jsonObject.length; i++) {
                        var match = false;
                        var record = null;

                        // Check for duplicates
                        if (tmpIndex) {
                            var key = this._buffers[tableName]._getKey(jsonObject[i], keyFields);
                            record = tmpIndex[key];
                            match = (record !== undefined);
                        } else {
                            for (var j = 0; j < this._buffers[tableName]._data.length; j++) {
                                record = this._buffers[tableName]._data[j];
                                if (!record) continue;
                                match =
                                    (this._buffers[tableName]._equalRecord(jsonObject[i], record, keyFields));
                                if (match) {
                                    // Duplicate found
                                    break;
                                }
                            }
                        }

                        if (match) {
                            if (isInvoke &&
                                (this._resource.idProperty !== undefined) &&
                                (jsonObject[i]._id === undefined)) {
                                // Add _id to jsonObject
                                jsonObject[i]._id = record._id;
                            }

                            // If beforeRecord is null, there is entry in _beforeImage for a create.
                            // If beforeRecord is undefined, there is no entry
                            var beforeRecord = this._buffers[tableName]._beforeImage[record._id];
                            if (checkBeforeImage &&
                                (jsonObject[i]["prods:id"] !== undefined) &&
                                (typeof beforeRecord !== 'undefined')) {
                                // Only throw exception if the existing bi data 
                                // is not the same as the new bi data
                                var isAfterSame = this._sameData(jsonObject[i], record);
                                var isBeforeSame = true;

                                // For creates, beforeRecord will be null
                                if (beforeRecord) {
                                    var beforeObject = this._getBeforeRecordFromObject(jsonObject[i],
                                        beforeImageJsonObject, tableName);
                                    if (beforeObject)
                                        isBeforeSame = this._sameData(beforeObject, beforeRecord);
                                }

                                if (!isAfterSame || !isBeforeSame)
                                    throw new Error(msg.getMsgText("jsdoMSG032"));
                            }

                            switch (addMode) {
                                case progress.data.JSDO.MODE_APPEND:
                                    throw new Error(msg.getMsgText("jsdoMSG023"));
                                case progress.data.JSDO.MODE_MERGE:
                                    /* Ignore duplicate */
                                    if (beforeImageJsonIndex && jsonObject[i]["prods:id"]) {
                                        beforeImageJsonIndex[jsonObject[i]["prods:id"]] = record._id;
                                    }
                                    break;
                                case progress.data.JSDO.MODE_REPLACE:
                                    if (beforeImageJsonIndex && jsonObject[i]["prods:id"]) {
                                        beforeImageJsonIndex[jsonObject[i]["prods:id"]] = record._id;
                                    }

                                    if (jsonObject[i]._id === undefined)
                                        jsonObject[i]._id = record._id;
                                    this._copyRecord(
                                        this._buffers[tableName],
                                        jsonObject[i], record);
                                    this._deleteProdsProperties(record);
                                    break;
                                default:
                                    break;
                            }
                        } else {
                            // Add record
                            var jsrecord =
                                this._buffers[tableName]._add(jsonObject[i], trackChanges, false);
                            jsonObject[i]._id = jsrecord.data._id;
                            if (beforeImageJsonIndex && jsonObject[i]["prods:id"]) {
                                beforeImageJsonIndex[jsonObject[i]["prods:id"]] = jsrecord.data._id;
                            }
                            if (beforeImageJsonObject) {
                                this._deleteProdsProperties(jsrecord.data);
                            }
                            if (tmpIndex) {
                                var key = this._buffers[tableName]._getKey(jsrecord.data, keyFields);
                                tmpIndex[key] = jsrecord.data;
                            }
                        }

                    }
                    tmpIndex = null;
                }
                dataHasBeenProcessed = true;
            } finally {
                this._buffers[tableName]._sortRecords = true;
                this._buffers[tableName]._sort();
                this._buffers[tableName]._createIndex();

                if (dataHasBeenProcessed && beforeImageJsonObject) {
                    this._buffers[tableName]._loadBeforeImageData(beforeImageJsonObject,
                        beforeImageJsonIndex, keyFields);
                }
            }
        }
    };

    // This method returns corresponding bi record of the afterRecord from specified jsonObject
    this._getBeforeRecordFromObject = function(afterRecord, jsonObject, tablename) {
        var beforeData = jsonObject[this._dataSetName]["prods:before"];
        var id = afterRecord["prods:id"];
        var beforeRecord;

        if (!beforeData) return beforeRecord;

        // First check to see if the before data is the same
        for (var i = 0; i < beforeData[tablename].length; i++) {
            var record = beforeData[tablename][i];
            if (record["prods:id"] && id == record["prods:id"]) {
                beforeRecord = record;
                break;
            }
        }

        return beforeRecord;
    };

    this._sameData = function(record1, record2) {
        var value1, value2;
        for (var fieldName in record1) {
            if (fieldName.substring(0, 5) != "prods" && fieldName != "_id") {
                value1 = record1[fieldName];
                value2 = record2[fieldName];

                if (value1 > value2 || value1 === null)
                    return false;
                else if (value1 < value2 || value2 === null)
                    return false;
            }
        }

        return true;
    };


    // private method to merge changes after a read operation    
    this._mergeRead = function(jsonObject, xhr) {
        if (this.isDataSet()) {
            if (this._dataProperty) {
                var datasetBuffer = this._buffers[this._dataProperty];
                datasetBuffer._data = jsonObject[this._dataSetName][this._dataProperty];
                if (datasetBuffer.autoSort) {
                    datasetBuffer._sort();
                }
                datasetBuffer._createIndex();
            } else {
                // Load data from JSON object into _data
                for (var buf in this._buffers) {
                    var data;
                    if (jsonObject[this._dataSetName])
                        data = jsonObject[this._dataSetName][buf];
                    else
                        data = null;
                    data = data ? data : [];

                    // We want to merge records based on the mergeMode that is coming to fill() operation.
                    // i.e., a mergeMode can be APPEND, MERGE, REPLACE or EMPTY. Excluding EMPTY because this is already
                    // taken care in the _fillSuccess

                    if (this._fillMergeMode) {

                        // Check for the availability of the buffer (temp-table). If we don't find any, then we want to assign an
                        // empty array such that we proceed with addRecords() operation with an empty dataset
                        if (this.isDataSet() && jsonObject[this._dataSetName] && !jsonObject[this._dataSetName][this._buffers[buf]._name]) {
                            jsonObject[this._dataSetName][this._buffers[buf]._name] = [];
                        }

                        switch (this._fillMergeMode) {
                            case progress.data.JSDO.MODE_APPEND:
                                this._buffers[buf].addRecords(jsonObject, progress.data.JSDO.MODE_APPEND);
                                break;
                            case progress.data.JSDO.MODE_MERGE:
                                this._buffers[buf].addRecords(jsonObject, progress.data.JSDO.MODE_MERGE, this._buffers[buf]._primaryKeys);
                                break;
                            case progress.data.JSDO.MODE_REPLACE:
                                this._buffers[buf].addRecords(jsonObject, progress.data.JSDO.MODE_REPLACE, this._buffers[buf]._primaryKeys);
                                break;
                            default:
                                throw new Error(msg.getMsgText("jsdoMSG022"));
                        }

                    } else {
                        this._buffers[buf]._data = data;
                    }

                    if (this._buffers[buf].autoSort) {
                        this._buffers[buf]._sort();
                    }
                    this._buffers[buf]._createIndex();
                    if (jsonObject[this._dataSetName] &&
                        jsonObject[this._dataSetName]["prods:hasChanges"]) {
                        this._buffers[buf]._loadBeforeImageData(jsonObject);
                    }
                }

                // Reset the fillMergeMode back to default such that it will not affect upcoming fill() operations
                this._fillMergeMode = undefined;

                // Load nested data into _data
                if (this._numBuffers > 1) {
                    for (var buf in this._buffers) {
                        if (this._buffers[buf]._isNested &&
                            this._buffers[buf]._parent &&
                            this._buffers[this._buffers[buf]._parent]) {
                            var srcData = this._buffers[this._buffers[buf]._parent]._data;
                            var data = [];
                            for (var i = 0; i < srcData.length; i++) {
                                if (srcData[i][buf] !== undefined) {
                                    for (var j = 0; j < srcData[i][buf].length; j++) {
                                        data.push(srcData[i][buf][j]);
                                    }
                                    delete srcData[i][buf];
                                }
                            }
                            this._buffers[buf]._data = data;
                            if (this._buffers[buf].autoSort) {
                                this._buffers[buf]._sort();
                            }
                            this._buffers[buf]._createIndex();
                        }
                    }
                }
            }
        } else {
            if (jsonObject instanceof Array) {
                this._defaultTableRef._data = jsonObject;
            } else {
                if (this._dataProperty)
                    this._defaultTableRef._data = jsonObject[this._dataProperty];
                else if (jsonObject.data)
                    this._defaultTableRef._data = jsonObject.data;
                else {
                    this._defaultTableRef._data = [];
                    this._defaultTableRef._data[0] = jsonObject;
                }
            }
        }

        for (var buf in this._buffers) {
            if (this._buffers[buf].autoSort) {
                this._buffers[buf]._sort();
            }
            this._buffers[buf]._createIndex();
        }
    };

    /**
     * Replace existing record data and index entry with new record data.
     */
    this._mergeUpdateRecord = function(tableRef, recordId, record) {
        var index = tableRef._index[recordId].index;
        record._id = recordId;

        if (!tableRef._data[index]) {
            tableRef._data[index] = {};
        }
        this._copyRecord(this._tableRef, record, tableRef._data[index]);
        record = tableRef._data[index];

        if (tableRef._jsdo._resource.idProperty !== undefined) {
            var id = tableRef._data[index][tableRef._jsdo._resource.idProperty];
            if (id !== undefined) {
                id += ""; // ID Property

                // Delete index entry for recordId (_id)
                delete tableRef._index[recordId];

                if (tableRef._beforeImage[recordId] === null) {
                    // Save old recordId (_id) to _tmpIndex
                    tableRef._tmpIndex[recordId] = new progress.data.JSIndexEntry(index);
                }

                // Create index entry with new id
                tableRef._index[id] = new progress.data.JSIndexEntry(index);
                record._id = id;
            }
        }

        return record;
    };


    /**
     *update existing record data with specified error string
     */
    this._setErrorString = function(tableRef, recordId, errorString, setInBeforeTable) {

        if (setInBeforeTable) {
            // Ensure that object exists, it's null for deleted rows
            if (tableRef._beforeImage[recordId]) {
                tableRef._beforeImage[recordId]._errorString = errorString;
            }
        } else {
            var index = tableRef._index[recordId].index;
            tableRef._data[index]._errorString = errorString;
        }
    };

    /*
     * Returns the array with the data from the specified dataObject. 
     */
    this._arrayFromDataObject = function(dataObject, tableRef) {
        var data;

        if (dataObject === undefined) return undefined;
        if (this._dataSetName) {
            if (dataObject[this._dataSetName])
                data = dataObject[this._dataSetName][tableRef._name];
        } else {
            // check if data returned as array
            if (dataObject instanceof Array) {
                data = dataObject;
            } else {
                // or if data property is set
                if (this._dataProperty) {
                    data = dataObject[this._dataProperty];
                } else if (dataObject.data) {
                    // or just try with 'data' as the data property name
                    data = dataObject.data;
                }
            }
        }

        return data;
    };

    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private method to merge changes after a create or update operation.
    // This method is called to merge changes when server's Create or Update methods were called. 
    //
    // It returns true if it found error for row in before-image data (prods:hasErrors = true)
    // It returns false if there is no before-image data or prods:hasErrors property is absent
    this._mergeUpdateForCUD = function(jsonObject, xhr) {
        var hasError = false,
            errorString;

        // Update dataset with changes from server
        if (this._dataSetName) {
            var dataSetJsonObject = jsonObject[this._dataSetName];

            // only updates the specified record
            var tableRef = xhr.request.jsrecord._tableRef;
            var tableJsonObject = this._arrayFromDataObject(jsonObject, tableRef);

            if (tableJsonObject instanceof Array) {
                if (tableJsonObject.length > 1) {
                    xhr.request.success = false;
                    throw new Error(msg.getMsgText("jsdoMSG100"));
                }

                for (var i = 0; i < tableJsonObject.length; i++) {
                    var recordId = xhr.request.jsrecord.getId();

                    if (!recordId) {
                        throw new Error(msg.getMsgText("jsdoMSG034", "_mergeUpdateForCUD()"));
                    }

                    // Determine if error string (get prods_id before _mergeUpdateRecord() is called, 
                    // since it removes all prods properties)
                    errorString = undefined;

                    if (tableJsonObject[i]["prods:hasErrors"]) {
                        var prods_id = tableJsonObject[i]["prods:id"];
                        errorString =
                            this._getErrorStringFromJsonObject(dataSetJsonObject, tableRef, prods_id);
                        hasError = true;
                    }

                    var record = this._mergeUpdateRecord(tableRef, recordId, tableJsonObject[i]);
                    if (errorString)
                        this._setErrorString(tableRef, recordId, errorString, false);

                    // Set _rejected property
                    if (tableJsonObject[i]["prods:rejected"] ||
                        errorString) {
                        record._rejected = true;
                        if (errorString === "REJECTED") {
                            delete record._errorString;
                        }
                    }

                    xhr.request.jsrecord = new progress.data.JSRecord(tableRef, record);
                }
            }
        } else {
            // update single record with changes from server
            var tableRef = this._defaultTableRef;
            var data = this._arrayFromDataObject(jsonObject);

            if (data instanceof Array) {
                if (data.length > 1) {
                    xhr.request.success = false;
                    throw new Error(msg.getMsgText("jsdoMSG100"));
                }

                for (var i = 0; i < data.length; i++) {
                    var recordId = xhr.request.jsrecord.getId();

                    if (!recordId) {
                        throw new Error(msg.getMsgText("jsdoMSG034", "_mergeUpdateForCUD()"));
                    }

                    var record = this._mergeUpdateRecord(tableRef, recordId, data[i]);
                    xhr.request.jsrecord = new progress.data.JSRecord(tableRef, record);
                }
            }
        }

        return hasError;
    };


    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private method to determine if deleted row (from delete operation) returned from AppServer 
    // was returned with an error in the before-image data.
    //
    // It returns true if it found an error for row in before-image data (prods:hasErrors = true)
    // It returns false if there is no before-image data or prods:hasErrors property is absent

    this._checkForDeleteError = function(dataSetJsonObject, xhr) {
        var hasError = false;
        var tableRef = xhr.request.jsrecord._tableRef;

        var beforeJsonObject = dataSetJsonObject["prods:before"];

        // No merge is necessary for deletes, but we need to see 
        // if there are any errors on deletes records.
        // delete records are not in after table, only in before table
        if (beforeJsonObject) {
            var beforeTableJsonObject = beforeJsonObject[tableRef._name];

            if (beforeTableJsonObject.length > 1) {
                xhr.request.success = false;
                throw new Error(msg.getMsgText("jsdoMSG100"));
            }
            // clientId is same as _id
            var recordId = beforeTableJsonObject[0]["prods:clientId"];
            if (!recordId) {
                throw new Error(msg.getMsgText("jsdoMSG035", "_checkForDeleteError()"));
            }

            // Determine if row was returned with error string
            if (beforeTableJsonObject[0]["prods:hasErrors"]) {
                var prods_id = beforeTableJsonObject[0]["prods:id"];
                var errorString =
                    this._getErrorStringFromJsonObject(dataSetJsonObject, tableRef, prods_id);
                this._setErrorString(tableRef, recordId, errorString, true);
                hasError = true;
            }
        }

        return hasError;
    };

    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private method to merge changes after a call to saveChanges.
    // This method is called when saveChanges(useSubmit) was called with useSubmit=true.
    // This can process/merge one or more created, deleted or updated records.
    // In order for a jsonObject to have before-image data, it must be associated with a dataset.
    //
    // It only merges changes in the after table. But we need to look at before-image table to see 
    // if there were any errors passed back for the deletes 
    // 
    this._mergeUpdateForSubmit = function(jsonObject, xhr) {
        var errorString;

        //if (!this._dataSetName || !jsonObject[this._dataSetName]["prods:hasChanges"])
        if (!this._dataSetName) {
            // "_mergeUpdateForSubmit() can only be called for a dataset"
            throw new Error(msg.getMsgText("jsdoMSG036", "_mergeUpdateForSubmit()"));
        }

        // response is sent back with extra dataset object wrapper
        var dataSetJsonObject = jsonObject[this._dataSetName];
        if (dataSetJsonObject[this._dataSetName])
            dataSetJsonObject = dataSetJsonObject[this._dataSetName];

        var beforeJsonObject = dataSetJsonObject["prods:before"];

        for (var buf in this._buffers) {
            var tableRef = this._buffers[buf];

            var tableJsonObject = dataSetJsonObject[tableRef._name];
            if (tableJsonObject instanceof Array) {
                for (var i = 0; i < tableJsonObject.length; i++) {

                    var recordId = tableJsonObject[i]["prods:clientId"];
                    if (!recordId) {
                        throw new Error(msg.getMsgText("jsdoMSG035", "_mergeUpdateForSubmit()"));
                    }

                    // Determine if error string (get prods_id before _mergeUpdateRecord() is called, 
                    // since it removes all prods properties)
                    errorString = undefined;

                    if (tableJsonObject[i]["prods:hasErrors"]) {
                        var prods_id = tableJsonObject[i]["prods:id"];
                        errorString =
                            this._getErrorStringFromJsonObject(dataSetJsonObject, tableRef, prods_id);
                    }
                    var record = this._mergeUpdateRecord(tableRef, recordId, tableJsonObject[i]);
                    if (errorString) {
                        this._setErrorString(tableRef, recordId, errorString, false);
                    }

                    // Set _rejected property so it can be checked in applyChanges()
                    if (tableJsonObject[i]["prods:rejected"] ||
                        errorString) {
                        record._rejected = true;
                        if (errorString === "REJECTED") {
                            delete record._errorString;
                        }
                    }

                    // Now need to update jsrecords. 
                    // We use this data when we fire create, update and delete events.
                    // Updating so that it contains latest data (data sent back from server) 
                    var jsrecords = xhr.request.jsrecords;
                    for (var idx = 0; idx < jsrecords.length; idx++) {
                        if (jsrecords[idx].data["_id"] == recordId) {
                            jsrecords[idx].data = record;
                            break;
                        }
                    }
                }
            }
        }

        // No merge is necessary for deletes, 
        // but we need to see if there are any errors on deletes records.
        // delete records are not in after table, only in before table
        if (beforeJsonObject) {
            for (var buf in this._buffers) {
                var tableRef = this._buffers[buf];
                var beforeTableJsonObject = beforeJsonObject[tableRef._name];
                var errorString;

                if (beforeTableJsonObject instanceof Array) {
                    for (var i = 0; i < beforeTableJsonObject.length; i++) {

                        if (beforeTableJsonObject[i]["prods:rowState"] == "deleted") {
                            var recordId = beforeTableJsonObject[i]["prods:clientId"];
                            if (!recordId) {
                                throw new Error(msg.getMsgText("jsdoMSG035", "_mergeUpdateForSubmit()"));
                            }

                            errorString = undefined;
                            // If row was returned with error string, just copy that over to jsdo record
                            if (beforeTableJsonObject[i]["prods:hasErrors"]) {
                                var prods_id = beforeTableJsonObject[i]["prods:id"];

                                errorString = this._getErrorStringFromJsonObject(dataSetJsonObject,
                                    tableRef, prods_id);
                                this._setErrorString(tableRef, recordId, errorString, true);
                            }

                            // Set _rejected property so it can be checked in applyChanges()
                            if ((beforeTableJsonObject[i]["prods:rejected"] ||
                                    errorString) &&
                                tableRef._beforeImage[recordId]) {
                                tableRef._beforeImage[recordId]._rejected = true;
                                if (errorString === "REJECTED") {
                                    delete tableRef._beforeImage[recordId]._errorString;
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private method that fires afterCreate, afterUpdate and afterDelete (CUD) triggers after
    // saveChanges(true) is called. We must fire create, update and delete triggers 
    // for each record that was sent to backend submit operation 
    this._fireCUDTriggersForSubmit = function(request) {
        // Before firing triggers, delete prods properties (except rowState) so they don't appear in data
        for (var idx = 0; idx < request.jsrecords.length; idx++) {
            this._deleteProdsProperties(request.jsrecords[idx].data, false, false);
        }

        for (var idx = 0; idx < request.jsrecords.length; idx++) {
            var jsrecord = request.jsrecords[idx];
            switch (jsrecord.data["prods:rowState"]) {
                case "created":
                    jsrecord._tableRef.trigger("afterCreate", this, jsrecord, request.success, request);
                    this.trigger("afterCreate", this, jsrecord, request.success, request);
                    break;
                case "modified":
                    jsrecord._tableRef.trigger("afterUpdate", this, jsrecord, request.success, request);
                    this.trigger("afterUpdate", this, jsrecord, request.success, request);
                    break;
                case "deleted":
                    jsrecord._tableRef.trigger("afterDelete", this, jsrecord, request.success, request);
                    this.trigger("afterDelete", this, jsrecord, request.success, request);
                    break;
            }
        }
    };

    //////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Private method to return error for specified row 
    // from jsonObject's prods:errors object (before-data) sent over from AppServer
    //
    this._getErrorStringFromJsonObject = function(dataSetJsonObject, tableRef, prods_id) {
        var tableJsonObject;
        var errorsJsonObject = dataSetJsonObject["prods:errors"];

        if (errorsJsonObject) {
            tableJsonObject = errorsJsonObject[tableRef._name];
        }

        if (tableJsonObject instanceof Array) {
            for (var i = 0; i < tableJsonObject.length; i++) {

                var id = tableJsonObject[i]["prods:id"];
                if (id === prods_id) {
                    var errorString = tableJsonObject[i]["prods:error"];
                    return errorString === null ?
                        "Server returned unspecified error. Please check log files." : errorString;
                }
            }
        }

        return undefined;
    };

    this._fillSuccess = function(jsdo, success, request) {
        var xhr = request.xhr,
            properties,
            mapping;

        // Need to check if responseMapping was specified; developer can specify
        // plug-in to manipulate response 
        properties = jsdo.getMethodProperties("read");

        if (properties && properties.mappingType) {
            mapping = progress.data.PluginManager.getPlugin(properties.mappingType);
            if (!mapping) {
                throw new Error(progress.data._getMsgText("jsdoMSG118", properties.mappingType));
            }

            if (typeof(mapping.responseMapping) === "function") {
                request.response = mapping.responseMapping(jsdo, request.response, { operation: "read" });
            }
        }

        // Here check for the mergeMode flag of fill() operation and performing accordingly.
        // When the mergeMode is EMPTY or if the fillMergeMode is NOT set then only we will be performing clearData operation
        if (!request.jsdo._fillMergeMode || request.jsdo._fillMergeMode === progress.data.JSDO.MODE_EMPTY) {
            jsdo._clearData();
        }
        jsdo._mergeRead(request.response, xhr);

        // Set working record
        for (var buf in jsdo._buffers) {
            if (!jsdo._buffers[buf]._parent || !jsdo.useRelationships) {
                jsdo._buffers[buf]._setRecord(jsdo._buffers[buf]._findFirst());
            }
        }
    };

    this._fillComplete = function(jsdo, success, request) {
        jsdo.trigger("afterFill", jsdo, request.success, request);
        if (request.deferred) {
            if (success) {
                request.deferred.resolve(jsdo, success, request);
            } else {
                request.deferred.reject(jsdo, success, request);
            }
        }
    };

    this._fillError = function(jsdo, success, request) {
        jsdo._clearData();
        jsdo._updateLastErrors(jsdo, null, null, request);
    };

    this._undoCreate = function(tableRef, id) {
        // Undo operation 
        // Remove record from JSDO memory
        var entry = tableRef._index[id];
        if (entry !== undefined) {
            var index = entry.index;
            tableRef._data[index] = null;
        }
        tableRef._hasEmptyBlocks = true;
        delete tableRef._index[id];
        delete tableRef._beforeImage[id];
        // End - Undo operation		
    };

    this._undoUpdate = function(tableRef, id, deleteProdsProps) {
        /* Default to false */
        if (typeof(deleteProdsProps) == 'undefined') {
            deleteProdsProps = false;
        }

        // Undo operation
        // Restore from before image
        var record = tableRef._beforeImage[id];

        // Before image points to an existing record
        if (record) {
            var index = tableRef._index[id].index;
            tableRef._jsdo._copyRecord(tableRef, record, tableRef._data[index]);
            if (deleteProdsProps)
                tableRef._jsdo._deleteProdsProperties(tableRef._data[index], true);
        }
        delete tableRef._beforeImage[id];
        // End - Restore before image		
    };

    this._undoDelete = function(tableRef, id, deleteProdsProps) {
        /* Default to false */
        if (typeof(deleteProdsProps) == 'undefined') {
            deleteProdsProps = false;
        }

        // Restore from before image
        var record = tableRef._beforeImage[id];

        // Before image points to an existing record
        if (record) {
            var index = record._index;
            delete record._index;
            if (deleteProdsProps)
                tableRef._jsdo._deleteProdsProperties(record, true);

            if ((index !== undefined) && (tableRef._data[index] === null)) {
                tableRef._data[index] = record;
            } else {
                tableRef._data.push(record);
                index = tableRef._data.length - 1;
            }
            tableRef._index[id] = new progress.data.JSIndexEntry(index);
        }
        delete tableRef._beforeImage[id];
        // End - Restore before image		
    };

    this._deleteComplete = function(jsdo, success, request) {
        var xhr = request.xhr;
        var jsrecord = request.jsrecord;

        try {
            // Before firing trigger, delete prods properties so they don't appear in data
            jsdo._deleteProdsProperties(jsrecord.data, false);

            jsrecord._tableRef.trigger("afterDelete", jsdo, jsrecord, request.success, request);
            jsdo.trigger("afterDelete", jsdo, jsrecord, request.success, request);

        } finally {
            request.complete = true;
            jsdo._checkSaveComplete(xhr);
        }
    };

    this._deleteSuccess = function(jsdo, success, request) {
        var xhr = request.xhr;
        var jsonObject = request.response;
        var beforeJsonObject = null;
        var dataSetJsonObject = null;
        var data;

        //Even though this is _deleteSuccess, if before-image data is returned, the call of 
        // delete operation could return a success, but we have to check if error was returned 
        // in before-image data 
        var hasError = false;
        if (jsdo._useBeforeImage("delete")) {
            dataSetJsonObject = jsonObject[jsdo._dataSetName];
            beforeJsonObject = dataSetJsonObject["prods:before"];

            if (beforeJsonObject) {
                data = beforeJsonObject[request.jsrecord._tableRef._name];
            }
        } else {
            data = jsdo._arrayFromDataObject(jsonObject, request.jsrecord._tableRef);
        }

        if (data instanceof Array) {
            if (data.length > 1) {
                request.success = false;
                throw new Error(msg.getMsgText("jsdoMSG100"));
            }
        }

        if (beforeJsonObject) {
            hasError = jsdo._checkForDeleteError(dataSetJsonObject, xhr);
        }

        if (hasError)
            request.success = false;

        if (jsdo.autoApplyChanges) {
            if (!hasError) {
                // Clear before image
                delete request.jsrecord._tableRef._beforeImage[request.jsrecord.data._id];
                // End - Clear before image
            } else {
                jsdo._deleteError(jsdo, success, request);
            }
        }
    };

    this._deleteError = function(jsdo, success, request) {
        if (jsdo.autoApplyChanges) {
            jsdo._undoDelete(request.jsrecord._tableRef, request.jsrecord.data._id);
        }
    };

    this._createComplete = function(jsdo, success, request) {
        var xhr = request.xhr;
        var jsrecord = request.jsrecord;

        try {
            // Before firing trigger, delete prods properties so they don't appear in data
            jsdo._deleteProdsProperties(jsrecord.data, false);

            jsrecord._tableRef.trigger("afterCreate", jsdo, jsrecord, request.success, request);
            jsdo.trigger("afterCreate", jsdo, jsrecord, request.success, request);
        } finally {
            request.complete = true;
            jsdo._checkSaveComplete(xhr);
        }
    };

    this._createSuccess = function(jsdo, success, request) {
        var xhr = request.xhr;
        var record = request.response;
        var hasError = jsdo._mergeUpdateForCUD(record, xhr);

        if (hasError)
            request.success = false;

        if (jsdo.autoApplyChanges) {
            if (!hasError) {
                // Clear before image
                delete request.jsrecord._tableRef._beforeImage[request.jsrecord.data._id];
                // End - Clear before image
            } else {
                jsdo._createError(jsdo, success, request);
            }
        }
    };

    this._createError = function(jsdo, success, request) {
        if (jsdo.autoApplyChanges) {
            jsdo._undoCreate(request.jsrecord._tableRef, request.jsrecord.data._id);
        }
    };


    this._updateComplete = function(jsdo, success, request) {
        var xhr = request.xhr;
        var jsrecord = request.jsrecord;
        try {
            // Before firing trigger, delete prods properties so they don't appear in data
            jsdo._deleteProdsProperties(jsrecord.data, false);

            jsrecord._tableRef.trigger("afterUpdate", jsdo, jsrecord, request.success, request);
            jsdo.trigger("afterUpdate", jsdo, jsrecord, request.success, request);
        } finally {
            request.complete = true;
            jsdo._checkSaveComplete(xhr);
        }
    };

    this._updateSuccess = function(jsdo, success, request) {
        var xhr = request.xhr;
        var hasError = jsdo._mergeUpdateForCUD(request.response, xhr);

        if (hasError) {
            request.success = false;
        }

        if (jsdo.autoApplyChanges) {
            if (!hasError) {
                request.success = true;
                // Clear before image
                delete request.jsrecord._tableRef._beforeImage[request.jsrecord.data._id];
                // End - Clear before image		
            } else {
                jsdo._updateError(jsdo, success, request);
            }
        }
    };

    this._updateError = function(jsdo, success, request) {

        if (jsdo.autoApplyChanges) {
            request.success = false;
            jsdo._undoUpdate(request.jsrecord._tableRef, request.jsrecord.data._id);
        }
    };


    this._saveChangesSuccess = function(jsdo, success, request) {
        var records = request.response;
        jsdo._mergeUpdateForSubmit(records, request.xhr);

        // Ensure that that the _lastErrors variable has been cleared 
        jsdo._clearErrors();
        var changes = jsdo.getChanges();
        jsdo._updateLastErrors(jsdo, null, changes);

        jsdo._setAllRecordsRejected(changes);

        if (jsdo.autoApplyChanges) {
            jsdo._applyChanges();
        }
    };


    this._saveChangesError = function(jsdo, success, request) {
        jsdo._setAllRecordsRejected(true);
        if (jsdo.autoApplyChanges) {
            jsdo.rejectChanges();
        }
        jsdo._updateLastErrors(jsdo, null, null, request);
    };

    /*  _saveChangesSuccessTT
        internal function called after a Submit of a temp-table (not DataSet) returns success
        This method does not attempt to do any merging of records into the JSDO memory. The
        absence of _id for the records means that the only way we could possibly do a "merge"
        would be to delete the changed rceords in the JSDO memory and then add the records
        that were returned form the data service, but that would invalidate the _id's that
        the Kendo datasource depends on. The application programmmer must do the merging in
        the afterSaveChanges handler

        *** Submit(temp-table) is not supported. This method will be removed in a future version. ***
     */
    this._saveChangesSuccessTT = function(jsdo, success, request) {
        var changes;

        // Ensure that that the _lastErrors variable has been cleared 
        jsdo._clearErrors();
        changes = jsdo.getChanges();
        jsdo._updateLastErrors(jsdo, null, changes);
        jsdo._setAllRecordsRejected(false);
    };

    this._saveChangesComplete = function(jsdo, success, request) {
        // Success with errors
        if ((request.xhr.status >= 200 && request.xhr.status < 300) &&
            (jsdo._lastErrors.length > 0 || jsdo._someRecordsRejected)) {
            request.success = false;
        }

        // If saveChanges(true) was called, then we must fire create, update and delete triggers 
        // for each record that was sent to submit operation
        if (jsdo._useSubmit === true) {
            jsdo._fireCUDTriggersForSubmit(request);
        }

        jsdo._undefWorkingRecord();
        jsdo._fireAfterSaveChanges(request.success, request);

    };

    this._fireAfterSaveChanges = function(success, request) {
        this.trigger("afterSaveChanges", this, success, request);

        if (request.jsrecords) {
            if (request.deferred) {
                if (success) {
                    request.deferred.resolve(this, success, request);
                } else {
                    request.deferred.reject(this, success, request);
                }
            }
        } else if (request.batch && request.batch.deferred) {
            if (success) {
                request.batch.deferred.resolve(this, success, request);
            } else {
                request.batch.deferred.reject(this, success, request);
            }
        }

        // Clear error string when autoApplyChanges is true
        var clearErrorString = this.autoApplyChanges;

        // This will be set if submit operation was performed
        if (request.jsrecords) {
            for (var idx = 0; idx < request.jsrecords.length; idx++) {
                var jsrecord = request.jsrecords[idx];
                if (clearErrorString) {
                    delete jsrecord.data._errorString;
                }
                delete jsrecord.data["prods:rowState"];
            }
        } else if (request.batch && request.batch.operations) {
            for (var idx = 0; idx < request.batch.operations.length; idx++) {
                var jsrecord = request.batch.operations[idx].jsrecord;
                if (clearErrorString) {
                    delete jsrecord.data._errorString;
                }
            }
        }
    };

    /*
     * Returns errors in response associated with the HTTP request.records related to the specified jsrecord.
     */
    this._getErrorsFromRequest = function(request) {
        var errors = [], // Array of objects with properties: type, id, error, errorNum, responseText
            errorArray = [],
            errorObject,
            retValString,
            j,
            i;

        if (request && !request.success) {
            if (request.xhr.status >= 400 && request.xhr.status < 600) {
                try {
                    var responseObject = JSON.parse(request.xhr.responseText);

                    // responseText could be an array, an object or just text.
                    // If it is an array, each object would have properties _errors and optional _retVal.
                    // If it is not an array, the object would have properties _errors and optional _retVal.
                    // If it is text, the content could also be an HTML page, this error is handle using "HTTP Status".
                    if (responseObject instanceof Array) {
                        errorArray = responseObject;
                    } else if (responseObject instanceof Object) {
                        errorArray.push(responseObject);
                    }
                    for (i = 0; i < errorArray.length; i += 1) {
                        errorObject = errorArray[i];
                        if (errorObject._retVal) {
                            errors.push({
                                type: progress.data.JSDO.RETVAL,
                                error: errorObject._retVal
                            });
                            retValString = errorObject._retVal;
                        } else {
                            retValString = null;
                        }
                        if (errorObject._errors instanceof Array) {
                            for (j = 0; j < errorObject._errors.length; j += 1) {
                                if ((errorObject._errors[j]._errorNum === 0) &&
                                    (errorObject._errors[j]._errorMsg === retValString)) {
                                    // Suppress additional error msg if it is same as return value
                                    continue;
                                }
                                errors.push({
                                    type: progress.data.JSDO.APP_ERROR,
                                    error: errorObject._errors[j]._errorMsg,
                                    errorNum: errorObject._errors[j]._errorNum
                                });
                            }
                        }
                    }
                } catch (e) {
                    // Ignore exceptions
                }
            }
            if (request.exception) {
                errors.push({
                    type: progress.data.JSDO.ERROR,
                    error: request.exception
                });
            }
            if (errors.length === 0 &&
                request.xhr &&
                (request.xhr.status >= 400 && request.xhr.status < 600)) {
                errors.push({
                    type: progress.data.JSDO.ERROR,
                    error: "Error: HTTP Status " + request.xhr.status + " " + request.xhr.statusText,
                    responseText: request.xhr.responseText
                });
            }
        }
        return errors;
    };

    this._updateLastErrors = function(jsdo, batch, changes, request) {
        var errors,
            errorText,
            responseObject,
            i,
            j,
            buf;

        if (batch) {
            if (batch.operations === undefined) return;
            for (i = 0; i < batch.operations.length; i++) {
                request = batch.operations[i];
                if (!request.success && request.xhr) {
                    if (request.xhr.status >= 200 && request.xhr.status < 300) {
                        // Add error string to jsdo._lastErrors
                        jsdo._lastErrors.push({ errorString: request.jsrecord.data._errorString });
                        // Add error object to jsdo.<table-ref>._lastErrors
                        jsdo._buffers[request.jsrecord._tableRef._name]._lastErrors.push({
                            type: progress.data.JSDO.DATA_ERROR,
                            id: request.jsrecord.data._id,
                            error: request.jsrecord.data._errorString
                        });
                    } else {
                        errors = this._getErrorsFromRequest(request);
                        errorText = "";
                        for (j = 0; j < errors.length; j += 1) {
                            if (errors.length > 1 && errors[j].error.indexOf("(7243)") != -1) {
                                // If there are more error messages
                                //      supress error "The Server application has returned an error. (7243)"
                                continue;
                            }
                            // Add error to table reference
                            if (request.jsrecord &&
                                (errors[j].type === progress.data.JSDO.APP_ERROR ||
                                    errors[j].type === progress.data.JSDO.RETVAL)) {
                                errors[j].id = request.jsrecord.data._id;
                                request.jsrecord._tableRef._lastErrors.push(errors[j]);
                            }
                            if (errorText.length === 0) {
                                errorText = errors[j].error;
                            } else {
                                errorText += "\n" + errors[j].error;
                            }
                        }
                        // Add error string to jsdo._lastErrors                            
                        jsdo._lastErrors.push({ errorString: errorText });
                    }
                }
            }
        } else if (changes instanceof Array) {
            for (i = 0; i < changes.length; i++) {
                if (changes[i].record && changes[i].record.data._errorString !== undefined) {
                    jsdo._lastErrors.push({ errorString: changes[i].record.data._errorString });
                    jsdo._buffers[changes[i].record._tableRef._name]._lastErrors.push({
                        type: progress.data.JSDO.DATA_ERROR,
                        id: changes[i].record.data._id,
                        error: changes[i].record.data._errorString
                    });
                }
            }
        } else if (request &&
            !request.success &&
            request.xhr &&
            ((request.xhr.status >= 400 && request.xhr.status < 600) || request.xhr.status === 0)) {
            errors = this._getErrorsFromRequest(request);
            errorText = "";
            for (j = 0; j < errors.length; j += 1) {
                if (errors.length > 1 && errors[j].error.indexOf("(7243)") != -1) {
                    // If there are more error messages
                    //      supress error "The Server application has returned an error. (7243)"     
                    continue;
                }
                // Add error to all table references
                for (buf in this._buffers) {
                    this._buffers[buf]._lastErrors.push(errors[j]);
                }
                if (errorText.length === 0) {
                    errorText = errors[j].error;
                } else {
                    errorText += "\n" + errors[j].error;
                }
            }
            jsdo._lastErrors.push({ errorString: errorText });
        }
    };

    // Check if all the xhr operations associated with the batch for which
    // this xhr object is related have completed (not necessarily to success).
    // If all XHR operations have completed this fires 'afterSaveChanges' event
    this._checkSaveComplete = function(xhr) {
        if (xhr.request) {
            var jsdo = xhr.request.jsdo;
            var batch = xhr.request.batch;
            // OE00229270 Should only do afterSaveChanges if _async
            if (jsdo && batch && jsdo._async) {
                if (jsdo._isBatchComplete(batch)) {
                    var success = jsdo._isBatchSuccess(batch);
                    var request = {
                        batch: batch,
                        success: success
                    };
                    jsdo._undefWorkingRecord();

                    // Save error messages
                    jsdo._lastErrors = [];
                    if (!success && batch.operations) {
                        jsdo._updateLastErrors(jsdo, batch, null);
                    }
                    this._setAllRecordsRejected(batch);

                    jsdo._fireAfterSaveChanges(success, request);
                }
            }
        }
    };


    /*
     * determine if a batch of XHR requests has completed in which all requests are successful
     */
    this._isBatchSuccess = function(batch) {
        if (batch.operations) {
            for (var i = 0; i < batch.operations.length; i++) {
                if (!batch.operations[i].success) {
                    return false;
                }
            }
        }
        return true;
    };

    /*
     * determine if all XHR requests from the batch of saves have completed (not necessarily to success) 
     */
    this._isBatchComplete = function(batch) {
        if (batch.operations) {
            for (var i = 0; i < batch.operations.length; i++) {
                var request = batch.operations[i];
                // we have to check against the 'complete' flag because xhr.readyState 
                // might be set async by the browser
                // while we're still in the middle of processing some other requests's response
                if (!request.complete) {
                    return false;
                }
            }
        }
        return true;
    };

    this._mergeInvoke = function(jsonObject, xhr) {
        var operation, i;

        if (xhr.request.fnName !== undefined &&
            xhr.jsdo._resource.fn[xhr.request.fnName] !== undefined) {
            operation = xhr.jsdo._resource.fn[xhr.request.fnName].operation;
        } else
            operation = null;
        if (operation === undefined) {
            // Operation data is only required for invoke operations with mergeMode: true
            operation = null;
            for (i = 0; i < xhr.jsdo._resource.operations.length; i++) {
                if (xhr.jsdo._resource.operations[i].name == xhr.request.fnName) {
                    operation = xhr.jsdo._resource.operations[i];
                    break;
                }
            }
            xhr.jsdo._resource.fn[xhr.request.fnName].operation = operation;
        }
        if (operation !== null && operation.mergeMode) {
            try {
                var mergeMode = progress.data.JSDO["MODE_" + operation.mergeMode.toUpperCase()];
                if (mergeMode === null) {
                    throw new Error(msg.getMsgText("jsdoMSG030", "mergeMode property",
                        "EMPTY, APPEND, MERGE or REPLACE"));
                }
                if (xhr.jsdo._resource.idProperty === undefined) {
                    throw new Error(msg.getMsgText("jsdoMSG110", this._resource.name,
                        " by mergeMode property in invoke operation"));
                }
                var dataParameterName;
                if (xhr.jsdo.isDataSet()) {
                    dataParameterName = xhr.jsdo._resource._dataSetName;
                } else if (xhr.jsdo._resource.dataProperty !== undefined) {
                    dataParameterName = xhr.jsdo._resource.dataProperty;
                } else if (xhr.jsdo._resource._tempTableName !== undefined) {
                    dataParameterName = xhr.jsdo._resource._tempTableName;
                } else {
                    throw new Error(msg.getMsgText("jsdoMSG111", ""));
                }

                var found = false;
                for (i = 0; i < operation.params.length; i++) {
                    if (operation.params[i].name == dataParameterName) {
                        if (operation.params[i].type.indexOf('RESPONSE_BODY') != -1) {
                            if ((operation.params[i].xType !== undefined) &&
                                (operation.params[i].xType != 'DATASET') &&
                                (operation.params[i].xType != 'TABLE') &&
                                (operation.params[i].xType != 'ARRAY')) {
                                throw new Error(msg.getMsgText("jsdoMSG113", operation.params[i].xType,
                                    dataParameterName, xhr.request.fnName));
                            }
                            found = true;
                            break;
                        }
                    }
                }

                if (!found) {
                    throw new Error(msg.getMsgText("jsdoMSG112", dataParameterName, xhr.request.fnName));
                }
                xhr.jsdo.addRecords(xhr.request.response[dataParameterName],
                    mergeMode, [xhr.jsdo._resource.idProperty], false, true);
            } catch (e) {
                xhr.request.success = false;
                xhr.request.exception = e;
            }
        }
    };

    this.onReadyStateChangeGeneric = function() {
        var xhr = this;
        if (xhr.readyState == 4) {
            var request = xhr.request;

            /* try to parse response even if request is considered "failed" due to http status */
            try {
                request.response = JSON.parse(xhr.responseText);
                // in some cases the object back from appserver has a "response" property which represents
                // the real content of the JSON...happens when multiple output parameters are returned.
                // this of course assumes no one names their root object "response".
                if (request.response && request.response.response) {
                    request.response = request.response.response;
                }
            } catch (e) {
                request.response = undefined;
            }

            try {
                if ((xhr.status >= 200 && xhr.status < 300) ||
                    (xhr.status === 0 && xhr.responseText !== "")) {

                    request.success = true;
                    // get the Client Context ID (AppServer ID)
                    xhr.jsdo._session._saveClientContextId(xhr);
                    if ((typeof xhr.onSuccessFn) == 'function') {
                        var operation;
                        if (xhr.request.fnName !== undefined &&
                            xhr.jsdo._resource.fn[xhr.request.fnName] !== undefined) {
                            operation = xhr.jsdo._resource.fn[xhr.request.fnName].operation;
                        } else
                            operation = null;
                        if ((operation === undefined) || (operation !== null && operation.mergeMode))
                            xhr.jsdo._mergeInvoke(request.response, xhr);
                        if (request.success)
                            xhr.onSuccessFn(xhr.jsdo, request.success, request);
                        else if ((typeof xhr.onErrorFn) == 'function')
                            xhr.onErrorFn(xhr.jsdo, request.success, request);
                    }

                } else {
                    request.success = false;
                    if (xhr.status === 0) {
                        request.exception = new Error(msg.getMsgText("jsdoMSG101"));
                    }
                    if ((typeof xhr.onErrorFn) == 'function') {
                        xhr.onErrorFn(xhr.jsdo, request.success, request);
                    }
                }
            } catch (e) {
                request.success = false;
                request.exception = e;
                if ((typeof xhr.onErrorFn) == 'function') {
                    xhr.onErrorFn(xhr.jsdo, request.success, request);
                }
            }
            // get the Client Context ID (AppServer ID)
            xhr.jsdo._session._checkServiceResponse(xhr, request.success, request);

            if ((typeof xhr.onCompleteFn) == 'function') {
                xhr.onCompleteFn(xhr.jsdo, request.success, request);
            }

        }
    };

    /*
     * Accepts changes for all table references in the JSDO.
     */
    this.acceptChanges = function() {
        for (var buf in this._buffers) {
            this._buffers[this._buffers[buf]._name].acceptChanges();
        }
    };

    /*
     * Rejects changes for the table references in the JSDO.
     */
    this.rejectChanges = function() {
        for (var buf in this._buffers) {
            this._buffers[this._buffers[buf]._name].rejectChanges();
        }
    };

    /*
     * Returns an array with changes for all table references in the JSDO.
     */
    this.getChanges = function() {
        var result = [];
        for (var buf in this._buffers) {
            var changes = this._buffers[this._buffers[buf]._name].getChanges();
            result = result.concat(changes);
        }
        return result;
    };

    this.hasChanges = function() {
        for (var buf in this._buffers) {
            if (this._buffers[this._buffers[buf]._name].hasChanges())
                return true;
        }
        return false;
    };

    /*
     * Private method to apply changes for all table references in the JSDO.
     * If _errorString has been set for a row, rejectRowChanges() is called. 
     * If it has not been set, acceptRowChanges() is called.
     */
    this._applyChanges = function() {
        for (var buf in this._buffers) {
            this._buffers[this._buffers[buf]._name]._applyChanges();
        }
    };

    /*
     * Accepts row changes for the working record using the JSDO reference.
     */
    this.acceptRowChanges = function() {
        if (this._defaultTableRef)
            return this._defaultTableRef.acceptRowChanges();
        throw new Error(msg.getMsgText("jsdoMSG001", "acceptRowChanges()"));
    };

    /*
     * Reject row changes for the working record using the JSDO reference.
     */
    this.rejectRowChanges = function() {
        if (this._defaultTableRef)
            return this._defaultTableRef.rejectRowChanges();
        throw new Error(msg.getMsgText("jsdoMSG001", "rejectRowChanges()"));
    };

    /*
     * Sets complete set of properties for the jsdo. All existing properties are replaced with new set
     */
    this.setProperties = function(propertiesObject) {
        var prop;

        if (arguments.length < 1) {
            // {1}: Incorrect number of arguments in {2} call. There should be {3}.
            throw new Error(progress.data._getMsgText("jsdoMSG122", 'JSDO', 'setProperties', 1));
        }
        if (arguments.length > 1) {
            // {1}: Incorrect number of arguments in {2} call. There should be only {3}.";
            throw new Error(progress.data._getMsgText("jsdoMSG122", 'JSDO', 'setProperties', 1));
        }
        if (typeof propertiesObject == "object") {
            /* Copy properties of the propertiesObject argument into _properties.
             * Note that if object passed in has a prototype, this code copies them too)
             */
            this._properties = {};

            for (prop in propertiesObject) {
                if (propertiesObject.hasOwnProperty(prop)) {
                    if (typeof propertiesObject[prop] !== "function") {
                        this._properties[prop] = propertiesObject[prop];
                    }
                }
            }
        } else if ((propertiesObject === undefined) || (propertiesObject === null)) {
            this._properties = {};
        } else {
            // {1}: Parameter {1} must be of type {3} in {4} call.
            throw new Error(progress.data._getMsgText("jsdoMSG121", 'JSDO', 1, 'Object',
                'setProperties'));
        }
    };

    /* 
     *  Set or remove an individual property in the property set maintained by the jsdo. 
     *  This operates only on the property identified by propertyName; 
     *  all other existing properties remain as they are.
     *  If the propertyName is not part of the context, this call adds it.
     *  If it exists, it is updated, unless -
     *  If propertyValue is undefined, this call removes the property
     */
    this.setProperty = function(propertyName, propertyValue) {
        if (arguments.length < 2) {
            // {1}: Incorrect number of arguments in {2} call. There should be {3}.
            throw new Error(progress.data._getMsgText("jsdoMSG122", 'JSDO',
                'setProperty', 2));
        }
        if (arguments.length !== 2) {
            // {1}: Incorrect number of arguments in {2} call. There should be only {3}.";
            throw new Error(progress.data._getMsgText("jsdoMSG122", "JSDO",
                "setProperty", 2));
        }
        if (typeof propertyName !== "string") {
            // {1}: Parameter {1} must be of type {3} in {4} call.
            throw new Error(progress.data._getMsgText("jsdoMSG121", 'JSDO', 1, 'string',
                'setProperty'));
        }

        if (propertyValue === undefined) {
            delete this._properties[propertyName]; // OK if it doesn't exist -- no error
        } else {
            this._properties[propertyName] = propertyValue;
        }
    };

    /* 
     * Gets the set of jsdo properties. Returns an object containing all the properties
     */
    this.getProperties = function() {
        if (arguments.length > 0) {
            // {1}: Incorrect number of arguments in {2} call. There should be {3}.";
            throw new Error(progress.data._getMsgText("jsdoMSG122", 'JSDO', 'getProperties', 0));
        }
        return this._properties;
    };

    /*  Gets the value of an individual property in the jsdo property set
     */
    this.getProperty = function(propertyName) {
        if (arguments.length < 1) {
            // {1}: Incorrect number of arguments in {2} call. There should be {3}.
            throw new Error(progress.data._getMsgText("jsdoMSG122", 'JSDO', 'getProperty', 1));
        }
        if (arguments.length > 1) {
            // {1}: Incorrect number of arguments in {2} call. There should be only {3}.";
            throw new Error(progress.data._getMsgText("jsdoMSG122", 'JSDO', 'getProperty', 1));
        }
        return this._properties[propertyName];

    };

    ///////////////////////////////////////////////////////////////////////////
    //
    //  The following methods provide support for Object Pesistence

    /*
     * Saves JSDO memory (and optionally pending changes) to local storage.
     *
     * saveLocal()
     * saveLocal(name)
     * saveLocal(dataMode)
     * saveLocal(name, dataMode)
     *
     */
    this.saveLocal = function saveLocal(arg1, arg2) {
        var name;
        var dataMode;

        if (arguments.length > 2) {
            throw new Error(msg.getMsgText("jsdoMSG024", "JSDO", arguments.callee.name + "()"));
        }

        if (typeof(arg1) == 'string' || arg1 === null || arg1 === undefined) {
            name = arg1;
            dataMode = arg2;
        } else {
            name = null;
            dataMode = arg1;
        }

        if (name === undefined || name === null || name === "") {
            name = "jsdo_" + this._resource.service.name + "_" + this._resource.name;
        }
        if (typeof(dataMode) == 'undefined') {
            dataMode = progress.data.JSDO.ALL_DATA;
        } else {
            switch (dataMode) {
                case progress.data.JSDO.ALL_DATA:
                case progress.data.JSDO.CHANGES_ONLY:
                    break;
                default:
                    throw new Error(msg.getMsgText("jsdoMSG115", arguments.callee.name));
            }
        }

        if (this._localStorage === null) {
            // Must first instantiate _localStorage object
            this._localStorage = new progress.data.LocalStorage();
        }

        var dataObj = this._prepareDataObjectForLocalStorage(dataMode);
        this._localStorage.saveToLocalStorage(name, dataObj);
    };

    /*
     * Reads localStorage (based upon name) into JSDO memory 
     * (localStorage may or may not have pending changes).
     * readLocal()
     * readLocal(name)
     *
     */
    this.readLocal = function readLocal(name) {
        if (arguments.length > 1) {
            throw new Error(msg.getMsgText("jsdoMSG024", "JSDO", arguments.callee.name + "()"));
        }
        if (name === undefined || name === null || name === "") {
            name = "jsdo_" + this._resource.service.name + "_" + this._resource.name;
        } else if (typeof(name) != 'string') {
            throw new Error(msg.getMsgText("jsdoMSG116", "name", arguments.callee.name + "()"));
        }

        if (this._localStorage === null) {
            this._localStorage = new progress.data.LocalStorage();
        }

        var object = this._localStorage.readFromLocalStorage(name);

        // If storage area does not exist (i.e. object = null) then don't update JSDO local memory
        if (object) {
            if (this._hasMatchingSchema(object) === false)
                throw new Error(msg.getMsgText("jsdoMSG117", name));

            // For readLocal(), JSDO should first be emptied of data, so using MODE_EMPTY
            this._restoreFromLocalStorage(object, progress.data.JSDO.MODE_EMPTY);
        }

        return object !== null;
    };

    /*
     * Reads localStorage (based upon name) into JSDO memory 
     * (localStorage may or may not have pending changes).
     * addLocalRecords(addMode)
     * addLocalRecords(addMode, keyFields)
     * addLocalRecords(name, addMode)
     * addLocalRecords(name, addMode, keyFields)	
     */
    this.addLocalRecords = function addLocalRecords(arg1, arg2, arg3) {
        var name;
        var addMode;
        var keyFields;

        if (arguments.length < 1) {
            throw new Error(msg.getMsgText("jsdoMSG024", "JSDO", arguments.callee.name + "()"));
        }

        if (typeof(arg1) == 'string') {
            name = arg1;
            addMode = arg2;
            keyFields = arg3;
        } else {
            name = "jsdo_" + this._resource.service.name + "_" + this._resource.name;
            addMode = arg1;
            keyFields = arg2;
        }

        if (typeof(name) == 'undefined' || name === null || name === "") {
            name = "jsdo_" + this._resource.service.name + "_" + this._resource.name;
        } else if (typeof(name) != 'string') {
            throw new Error(msg.getMsgText("jsdoMSG116", "name", arguments.callee.name + "()"));
        }

        if (addMode != progress.data.JSDO.MODE_REPLACE) {
            throw new Error(msg.getMsgText("jsdoMSG115", arguments.callee.name));
        }

        if (this._localStorage === null) {
            this._localStorage = new progress.data.LocalStorage();
        }

        var object = this._localStorage.readFromLocalStorage(name);

        // If storage area does not exist (i.e. object = null) then don't update JSDO local memory
        if (object) {
            if (this._hasMatchingSchema(object) === false)
                throw new Error(msg.getMsgText("jsdoMSG117", name));

            try {
                this._restoreFromLocalStorage(object, addMode, keyFields);
            } catch (e) {
                var text = e.message;
                throw new Error(text.replace(new RegExp('addRecords', 'g'), 'addLocalRecords'));
            }
        }

        return object !== null;
    };


    /*
     * This method returns True if each buffer in the jsdo contains a primary key.
     */
    this._containsPrimaryKeys = function _containsPrimaryKeys() {

        for (var buf in this._buffers) {
            if (this._buffers[buf]._primaryKeys === null)
                return false;
        }

        return true;
    };

    /*
     * Compares JSDO's dataset/table names with those in specified storage object.
     * Returns true if they match (or if storageObject is null or empty), else false.
     */
    this._hasMatchingSchema = function _hasMatchingSchema(storageObject) {
        var isValid = true;

        if (storageObject === null || (Object.keys(storageObject).length === 0))
            return true;


        if (this._dataSetName) {
            if (storageObject[this._dataSetName]) {
                for (var buf in this._buffers)
                    if (storageObject[this._dataSetName][buf] === undefined) {
                        isValid = false;
                        break;
                    }
            } else
                isValid = false; // dataset should be in storage area
        } else if (this._dataProperty) {
            // If array, we had to wrap in "fake" dataset, so unwrap it
            storageObject = storageObject["_localStorage"];
            if (storageObject === undefined || storageObject[this._dataProperty] === undefined)
                isValid = false;
        } else {
            // If temp-table, we had to wrap in "fake" dataset, so unwrap it
            storageObject = storageObject["_localStorage"];
            if (storageObject === undefined || storageObject[this._defaultTableRef._name] === undefined)
                isValid = false;
        }

        return isValid;
    };


    /*
     * Clears the data saved to local storage.
     *
     * deleteLocal()
     * deleteLocal(name)
     */
    this.deleteLocal = function deleteLocal(name) {
        if (arguments.length > 1) {
            throw new Error(msg.getMsgText("jsdoMSG024", "JSDO", arguments.callee.name + "()"));
        }
        if (name === undefined || name === null || name === "") {
            name = "jsdo_" + this._resource.service.name + "_" + this._resource.name;
        } else if (typeof(name) != 'string') {
            throw new Error(msg.getMsgText("jsdoMSG116", "name", arguments.callee.name + "()"));
        }

        if (this._localStorage === null) {
            this._localStorage = new progress.data.LocalStorage();
        }
        this._localStorage.clearLocalStorage(name);
    };


    // This method is used by saveLocal() to return a jsonObject with current JSDO data based upon option.
    //
    // In order to take advantage of existing code (createChangeSet() and addRecords()) and particularly
    // to use the processing of before-data in addRecords(), for tables and arrays, we create a dummy
    // dataset name: _localStorage.
    this._prepareDataObjectForLocalStorage = function(option) {

        var storageObject = {};

        // DataSets
        if (this._dataSetName) {
            switch (option) {
                case progress.data.JSDO.ALL_DATA:
                    storageObject = this._createDataAndChangeSet(this._dataSetName);
                    break;

                case progress.data.JSDO.CHANGES_ONLY:
                    storageObject = this._createChangeSet(this._dataSetName, true);
                    break;
            }
        }
        // Arrays
        else if (this._dataProperty) {
            switch (option) {
                case progress.data.JSDO.ALL_DATA:
                    storageObject = this._createDataAndChangeSet("_localStorage");
                    break;

                case progress.data.JSDO.CHANGES_ONLY:
                    storageObject = this._createChangeSet("_localStorage", true);
                    break;
            }
        }
        // Temp Tables
        else {
            switch (option) {
                case progress.data.JSDO.ALL_DATA:
                    storageObject = this._createDataAndChangeSet("_localStorage");
                    break;

                case progress.data.JSDO.CHANGES_ONLY:
                    storageObject = this._createChangeSet("_localStorage", true);
                    break;
            }
        }

        return storageObject;
    };


    // Restore the data retrieved from local storage to the JSDO based upon the specified addMode
    this._restoreFromLocalStorage = function(storageObject, addMode, keyFields) {

        if (storageObject && (Object.keys(storageObject).length > 0)) {
            if (this._dataSetName) {
                // Walk thru all tables to retrieve data
                for (var buf in this._buffers)
                    this._restoreDataForTable(this._buffers[buf], storageObject, addMode, keyFields);
            }
            // Either temp-table or array
            else
                this._restoreDataForTable(this._defaultTableRef, storageObject, addMode, keyFields);
        } else if (addMode === progress.data.JSDO.MODE_EMPTY)
            this._clearData();
    };


    this._restoreDataForTable = function(tableRef, jsonObject, addMode, keyFields) {

        // If primaryKeys not found, check if the idProperty is there
        keyFields = keyFields !== undefined ? keyFields : tableRef._primaryKeys;
        if (keyFields === undefined && this._resource.idProperty) {
            keyFields = [];
            keyFields[0] = this._resource.idProperty;
        }

        if (this._dataSetName) {
            var oldUseRelationships = this.useRelationships;
            // Turn off useRelationships since addRecords() does not use the working record			
            this.useRelationships = false;

            try {
                tableRef.addRecords(jsonObject, addMode, keyFields);
            } finally {
                // Restore useRelationships
                this.useRelationships = oldUseRelationships;
            }
        }
        // else it's either an array (this._dataProperty) or a temp-table
        else {
            // Creating  dummy dataset name: "_localStorage" for tables and arrays
            this._dataSetName = "_localStorage";
            tableRef.addRecords(jsonObject, addMode, keyFields);
            this._dataSetName = null;
        }
    };

    this.getMethodProperties = function(operation, name) {
        var idx;

        if (this._resource._operations) {
            if (this._resource._operations[operation]) {
                return this._resource._operations[operation];
            }
        } else {
            this._resource._operations = {};
        }
        for (var idx = 0; idx < this._resource.operations.length; idx++) {
            if (this._resource.operations[idx].type == operation) {
                return (this._resource._operations[operation] = this._resource.operations[idx]);
            }
        }
    };

    ///////////////////////////////////////////////////////////////////////////

    // Load data
    if (autoFill)
        this.fill();

}; // End of JSDO

// Constants for progress.data.JSDO
if ((typeof Object.defineProperty) == 'function') {
    Object.defineProperty(progress.data.JSDO, 'MODE_APPEND', {
        value: 1,
        enumerable: true
    });
    Object.defineProperty(progress.data.JSDO, 'MODE_EMPTY', {
        value: 2,
        enumerable: true
    });
    Object.defineProperty(progress.data.JSDO, 'MODE_MERGE', {
        value: 3,
        enumerable: true
    });
    Object.defineProperty(progress.data.JSDO, 'MODE_REPLACE', {
        value: 4,
        enumerable: true
    });
    Object.defineProperty(progress.data.JSDO, 'ERROR', {
        value: -1,
        enumerable: true
    });
    Object.defineProperty(progress.data.JSDO, 'APP_ERROR', {
        value: -2,
        enumerable: true
    });
    Object.defineProperty(progress.data.JSDO, 'RETVAL', {
        value: -3,
        enumerable: true
    });
    Object.defineProperty(progress.data.JSDO, 'DATA_ERROR', {
        value: -4,
        enumerable: true
    });
} else {
    progress.data.JSDO.MODE_APPEND = 1;
    progress.data.JSDO.MODE_EMPTY = 2;
    progress.data.JSDO.MODE_MERGE = 3;
    progress.data.JSDO.MODE_REPLACE = 4;
}

/* CRUD */
progress.data.JSDO._OP_CREATE = 1;
progress.data.JSDO._OP_READ = 2;
progress.data.JSDO._OP_UPDATE = 3;
progress.data.JSDO._OP_DELETE = 4;
progress.data.JSDO._OP_SUBMIT = 5;

/* Offline support: saving data to local storage  */
progress.data.JSDO.ALL_DATA = 1;
progress.data.JSDO.CHANGES_ONLY = 2;

// Arrays elements as individual fields 
// Separator must have at least one characters
progress.data.JSDO.ARRAY_INDEX_SEPARATOR = "_";

// setup inheritance for JSDO
progress.data.JSDO.prototype = new progress.util.Observable();
progress.data.JSDO.prototype.constructor = progress.data.JSDO;
progress.data.JSDO.prototype.toString = function(radix) {
    return "JSDO";
};

// setup inheritance for table reference
progress.data.JSTableRef.prototype = new progress.util.Observable();
progress.data.JSTableRef.prototype.constructor = progress.data.JSTableRef;
progress.data.JSTableRef.prototype.toString = function(radix) {
    return "JSTableRef";
};

// Built-in Plugins
progress.data.PluginManager.addPlugin("JFP", {
    requestMapping: function(jsdo, params, info) {
        var sortFields,
            field,
            fieldName,
            fieldInfo,
            tableName,
            filter,
            sortDir,
            ablFilter,
            sqlQuery,
            methodProperties,
            capabilities,
            index,
            position,
            option,
            capabilitiesObject,
            reqCapabilities = {
                filter: { options: ["ablFilter", "sqlQuery"], mapping: undefined },
                top: { options: ["top"], mapping: undefined },
                skip: { options: ["skip"], mapping: undefined },
                id: { options: ["id"], mapping: undefined },
                sort: { options: ["orderBy"], mapping: undefined }
            },
            doConversion = true,
            param;

        if (info.operation === "read") {
            capabilitiesObject = {};
            methodProperties = jsdo.getMethodProperties(info.operation);
            capabilities = methodProperties.capabilities;

            if (capabilities) {
                capabilities = capabilities.replace(/\s/g, "").split(",");
                for (index = 0; index < capabilities.length; index += 1) {
                    capabilitiesObject[capabilities[index]] = true;
                }
            }
            for (param in params) {
                if (param && (params[param] !== undefined) && reqCapabilities[param]) {
                    for (index = 0; index < reqCapabilities[param].options.length; index += 1) {
                        option = reqCapabilities[param].options[index];
                        if (capabilitiesObject[option]) {
                            reqCapabilities[param].mapping = option;
                            break;
                        }
                    }
                    if (!reqCapabilities[param].mapping) {
                        throw new Error(msg.getMsgText("jsdoMSG120",
                            reqCapabilities[param].options.join("' or '"), param));
                    }
                }
            }

            if (jsdo._defaultTableRef && params.tableRef === undefined) {
                tableName = jsdo._defaultTableRef._name;
            } else {
                tableName = params.tableRef;
            }

            if (params.sort) {
                // Convert sort expression to JFP format

                if (typeof(params.sort) === "object" && !(params.sort instanceof Array)) {
                    // Kendo UI sort format - object
                    // Make params.sort an array
                    params.sort = (Object.keys(params.sort).length > 1) ? [params.sort] : [];
                }
                sortFields = "";
                for (index = 0; index < params.sort.length; index += 1) {
                    field = params.sort[index];
                    sortDir = "";

                    if (typeof(field) === "string") {
                        // setSortFields format
                        // Extract fieldName and sortDir from string
                        fieldName = field;
                        position = field.indexOf(":");
                        if (position !== -1) {
                            sortDir = fieldName.substring(position + 1);
                            fieldName = fieldName.substring(0, position);
                            switch (sortDir.toLowerCase()) {
                                case "desc":
                                case "descending":
                                    sortDir = "desc";
                                    break;
                            }
                        }
                    } else {
                        // Kendo UI sort format - array
                        // Extract fieldName and sortDir from object
                        fieldName = field.field;
                        if (params.sort[index].dir === "desc") {
                            sortDir = params.sort[index].dir;
                        }
                    }
                    if (tableName) {
                        // Use original fieldName instead of serialized name
                        fieldInfo = jsdo[tableName]._fields[fieldName.toLowerCase()];
                        if (fieldInfo && fieldInfo.origName) {
                            fieldName = fieldInfo.origName;
                        }
                    }
                    if (sortDir === "desc") {
                        fieldName += " DESC";
                    }
                    sortFields += fieldName;
                    if (index < params.sort.length - 1) {
                        sortFields += ",";
                    }
                }
            }
            // Check for empty object
            if (typeof(params.filter) === "object" && !(params.filter instanceof Array)) {
                params.filter = (Object.keys(params.filter).length >= 1) ? params.filter : undefined;
            }

            if (params.filter) {
                // If filter is specified as string, then no conversion is necessary
                if (typeof params.filter === 'string') {
                    doConversion = false;
                }

                params.tableRef = tableName;

                if (doConversion && (params.tableRef === undefined)) {
                    throw new Error(msg.getMsgText("jsdoMSG045", "fill() or read()", "params",
                        "tableRef"));
                }

                if (reqCapabilities["filter"].mapping === "ablFilter") {
                    if (doConversion) {
                        ablFilter = progress.util._convertToABLWhereString(
                            jsdo._buffers[params.tableRef], params.filter);
                    } else {
                        ablFilter = params.filter;
                    }
                } else if (reqCapabilities["filter"].mapping === "sqlQuery") {
                    if (doConversion) {
                        sqlQuery = progress.util._convertToSQLQueryString(
                            jsdo._buffers[params.tableRef], params.filter, true);
                    } else {
                        sqlQuery = params.filter;
                    }
                }
            }

            filter = JSON.stringify({
                ablFilter: ablFilter,
                sqlQuery: sqlQuery,
                orderBy: sortFields,
                skip: params.skip,
                top: params.top,
                id: params.id
            });

            params = { filter: filter };
        }
        return params;
    }
});

if (typeof progress.ui == 'undefined')
    progress.ui = {};
progress.ui.UITableRef = function UITableRef(tableRef) {
    this._tableRef = tableRef;
    this._listview = null;
    this._detailPage = null;
    this._listviewContent = undefined;

    this.addItem = function(format) {
        var detailForm;

        if (!this._tableRef.record)
            throw new Error(msg.getMsgText("jsdoMSG002", this._name));

        if (!this._listview) return;

        format = format ? format : this._listview.format;
        detailForm = (this._detailPage && this._detailPage.name) ? this._detailPage.name : "";

        if (this._listviewContent === undefined) {
            this.clearItems();
        }
        var text = this._listview.itemTemplate ?
            this._listview.itemTemplate : progress.ui.UIHelper._itemTemplate;

        text = text.replace(new RegExp('{__format__}', 'g'), format);
        text = text.replace(new RegExp('{__id__}', 'g'), this._tableRef.record.data._id);
        text = text.replace(new RegExp('{__page__}', 'g'), detailForm);

        for (var field in this._tableRef.record.data) {
            var value = this._tableRef.record.data[field];
            text = text.replace(new RegExp('{' + field + '}', 'g'),
                (value !== undefined && value !== null) ? value : "");
        }

        this._listviewContent += text;
    };

    this.clearItems = function() {
        if (this._listview) {
            this._listviewContent = '';
            var listviewElement = document.getElementById(this._listview.name);
            if (listviewElement) {
                listviewElement.innerHTML = '';
            }
        }
    };

    this._getFormFieldValue = function(fieldName, detailPageName) {
        var value = null,
            field;

        if (detailPageName === undefined) {
            if (this._detailPage && this._detailPage.name)
                detailPageName = this._detailPage.name;
        }

        if (typeof($) == 'function' && detailPageName) {
            field = $("#" + detailPageName + " #" + fieldName);
            if (!field || field.length === 0)
                field = $("#" + detailPageName + ' [dsid="' + fieldName + '"]');
            if (field && field.length == 1)
                value = field.val();
        } else {
            field = document.getElementById(fieldName);
            if (field) {
                value = field.value;
            }
        }

        return value;
    };

    this._setFormField = function(fieldName, value, detailPageName) {
        var field = null;

        if (detailPageName === undefined) {
            if (this._detailPage && this._detailPage.name)
                detailPageName = this._detailPage.name;
        }

        if (typeof($) == 'function' && detailPageName) {
            field = $("#" + detailPageName + " #" + fieldName);
            if (!field || field.length === 0)
                field = $("#" + detailPageName + ' [dsid="' + fieldName + '"]');
            if (field && field.length == 1)
                field.val(value);
        } else {
            field = document.getElementById(fieldName);
            if (field) {
                field.value = value;
            }
        }
    };

    /*
     * Assigns field values from the form.
     */
    this.assign = function(detailPageName) {
        if (!this._tableRef.record)
            throw new Error(msg.getMsgText("jsdoMSG002", this._tableRef._name));
        if ((arguments.length !== 0) && (typeof detailPageName != 'string'))
            throw new Error(msg.getMsgText("jsdoMSG024", "UIHelper", "assign()"));

        // Ensure creation of before image record
        this._tableRef.record.assign(null);

        var fieldName;
        var schema = this._tableRef.getSchema();
        for (var i = 0; i < schema.length; i++) {
            fieldName = schema[i].name;
            if (fieldName == '_id') continue;
            var value = this._getFormFieldValue(fieldName, detailPageName);
            // CR OE00241289 Should always copy over field value unless undefined, 
            // user may have explicitly set it to blank
            if (typeof value != 'undefined') {
                if (typeof value == 'string' && schema[i].type != 'string') {
                    value = this._tableRef._jsdo._convertType(value,
                        schema[i].type,
                        schema[i].items ? schema[i].items.type : null);
                }
                this._tableRef.record.data[fieldName] = value;
            }
        }

        // Ensure order of record
        this._tableRef.record._sortRecord();

        return true;
    };

    this.display = function(pageName) {
        if (!this._tableRef.record)
            throw new Error(msg.getMsgText("jsdoMSG002", this._tableRef._name));

        // Display record to form
        var schema = this._tableRef.getSchema();
        for (var i = 0; i < schema.length; i++) {
            this._setFormField(schema[i].name, this._tableRef.record.data[schema[i].name], pageName);
        }
        this._setFormField('_id', this._tableRef.record.data._id, pageName);
    };

    this.showListView = function() {
        if (!this._listview) return;

        var uiTableRef = this;
        var listviewElement;
        if (typeof($) == 'function') {
            listviewElement = $("#" + this._listview.name);
            if (listviewElement && listviewElement.length == 1) {
                listviewElement.html(this._listviewContent ? this._listviewContent : '');
                try {
                    if (listviewElement.attr("data-filter") === "true" &&
                        typeof listviewElement.filterable === "function") {
                        listviewElement.filterable("refresh");
                    } else {
                        listviewElement.listview("refresh");
                    }
                } catch (e) {
                    // Workaround for issue with JQuery Mobile throwning exception on refresh
                }
            }

            if (this._listview.autoLink) {
                // Add trigger for 'tap' event to items
                $("#" + this._listview.name + " li").each(
                    function( /* index */ ) {
                        $(this).bind('click',
                            function( /* event, ui */ ) {
                                var jsrecord = uiTableRef.getListViewRecord(this);
                                uiTableRef.display();
                                if (typeof(uiTableRef._listview.onSelect) == 'function') {
                                    uiTableRef._listview.onSelect(event, this, jsrecord);
                                }
                            });
                    });
            }
        } else {
            listviewElement = document.getElementById(this._listview.name);
            if (listviewElement) {
                listviewElement.innerHTML = this._listviewContent;
            }

            if (this._listview.autoLink) {
                var element = document.getElementById(this._listview.name);
                if (element && element.childElementCount > 0) {
                    for (var i = 0; i < element.children.length; i++) {
                        element.children[i].onclick = function() {
                            var jsrecord = this.getListViewRecord(this);
                            this.display();
                            if (typeof(uiTableRef._listview.onSelect) == 'function') {
                                uiTableRef._listview.onSelect(event, this, jsrecord);
                            }
                        };
                    }
                }
            }
        }

        this._listviewContent = undefined;
    };

    this.getFormFields = function(fields) {
        var i;

        if (!this._tableRef._schema)
            return '';
        if (!(fields instanceof Array))
            fields = null;
        else {
            var tmpFields = {};
            for (i = 0; i < fields.length; i++) {
                tmpFields[fields[i]] = fields[i];
            }
            fields = tmpFields;
        }
        var htmltext;
        if (!fields || fields['_id']) {
            htmltext = '<input type="hidden" id="_id" name="_id" value="" />';
        } else
            htmltext = '';
        htmltext += '<fieldset data-role="controlgroup">';

        for (i = 0; i < this._tableRef._schema.length; i++) {
            var fieldName = this._tableRef._schema[i].name;
            if (fieldName == '_id') continue;
            if (fieldName.length > 0 && fieldName.charAt(0) == '_') continue;
            if (fields && fields[fieldName] === undefined) continue;
            var fieldLabel = this._tableRef._schema[i].title ?
                this._tableRef._schema[i].title : this._tableRef._schema[i].name;
            var text = (this._detailPage && this._detailPage.fieldTemplate) ?
                this._detailPage.fieldTemplate : progress.ui.UIHelper._fieldTemplate;
            text = text.replace(new RegExp('{__label__}', 'g'), fieldLabel);
            text = text.replace(new RegExp('{__name__}', 'g'), this._tableRef._schema[i].name);
            htmltext += text;
        }
        htmltext += '</fieldset>';
        fields = null;
        return htmltext;
    };

    this.getListViewRecord = function(htmlIElement) {
        var id = htmlIElement.getAttribute('data-id');
        return this._tableRef.findById(id);
    };

    this.getFormRecord = function(detailPageName) {
        var id = this._getFormFieldValue('_id', detailPageName);
        return this._tableRef.findById(id);
    };

    this._getIdOfElement = function(name) {
        if (typeof($) == 'function') {
            var element = $("#" + name);
            if (!element || element.length === 0) {
                element = $('[dsid="' + name + '"]');
                if (element && element.length == 1) {
                    var id = element.attr("id");
                    if (id)
                        return id;
                }
            }
        }
        return name;
    };

    this.setDetailPage = function setDetailPage(obj) {
        if (!obj || (typeof(obj) != 'object'))
            throw new Error(msg.getMsgText("jsdoMSG012", arguments.callee.name, "object"));
        if (!obj.name || (typeof(obj.name) != 'string'))
            throw new Error(msg.getMsgText("jsdoMSG012", arguments.callee.name, "name"));
        this._detailPage = obj;
        this._detailPage.name = this._getIdOfElement(this._detailPage.name);
    };
    this.setListView = function setListView(obj) {
        if (!obj || (typeof(obj) != 'object'))
            throw new Error(msg.getMsgText("jsdoMSG012", arguments.callee.name, "object"));
        if (!obj.name || (typeof(obj.name) != 'string'))
            throw new Error(msg.getMsgText("jsdoMSG012", arguments.callee.name, "name"));
        if (obj.format && (typeof(obj.name) != 'string'))
            throw new Error(msg.getMsgText("jsdoMSG012", arguments.callee.name, "format"));

        this._listview = obj;
        this._listview.name = this._getIdOfElement(this._listview.name);
        if (!this._listview.format) {
            if (typeof($) == 'function') {
                for (var i = 0; i < this._tableRef._schema.length; i++) {
                    var fieldName = this._tableRef._schema[i].name;

                    var field = $("#" + this._listview.name + ' [dsid="' + fieldName + '"]');
                    if (field && field.length == 1) {
                        field.html('{' + fieldName + '}');
                    }
                }
            }
            var text = document.getElementById(this._listview.name).innerHTML;
            var pos = text.indexOf('<li ');
            if (pos != -1) {
                // Add data-id so that getListViewRecord() can obtain the _id of the record
                text = text.substring(0, pos) + '<li data-id="{__id__}"' + text.substring(pos + 3);
            }
            this._listview.itemTemplate = text;
        }
    };

};

progress.ui.UIHelper = function UIHelper() {

    if (typeof(arguments[0]) == "object") {
        var args = arguments[0];
        for (var v in args) {
            if (v == 'jsdo') {
                this._jsdo = args[v];
            } else {
                this[v] = args[v];
            }
        }
    }

    this._defaultUITableRef = null;
    this._uiTableRef = {};
    var cnt = 0;
    for (var buf in this._jsdo._buffers) {
        this[buf] = this._uiTableRef[buf] = new progress.ui.UITableRef(this._jsdo._buffers[buf]);
        if (!this._defaultUITableRef)
            this._defaultUITableRef = this._uiTableRef[buf];
        cnt++;
    }
    if (cnt != 1) {
        this._defaultUITableRef = null;
    }

    this.addItem = function(format) {
        if (this._defaultUITableRef) {
            this._defaultUITableRef.addItem(format);
        } else
            throw new Error(msg.getMsgText("jsdoMSG011", "addItem()"));
    };

    this.clearItems = function() {
        if (this._defaultUITableRef) {
            this._defaultUITableRef.clearItems();
        } else
            throw new Error(msg.getMsgText("jsdoMSG011", "clearItems()"));
    };

    this.assign = function(detailPageName) {
        if (arguments.length !== 0)
            throw new Error(msg.getMsgText("jsdoMSG024", "UIHelper", "assign()"));
        if (this._defaultUITableRef) {
            return this._defaultUITableRef.assign(detailPageName);
        } else
            throw new Error(msg.getMsgText("jsdoMSG011", "assign()"));
    };

    this.display = function(detailPageName) {
        if (this._defaultUITableRef) {
            this._defaultUITableRef.display(detailPageName);
        } else
            throw new Error(msg.getMsgText("jsdoMSG011", "display()"));
    };

    this.showListView = function() {
        if (this._defaultUITableRef) {
            this._defaultUITableRef.showListView();
        } else
            throw new Error(msg.getMsgText("jsdoMSG011", "showListView()"));
    };

    this.getFormFields = function(fields) {
        if (this._defaultUITableRef) {
            return this._defaultUITableRef.getFormFields(fields);
        } else
            throw new Error(msg.getMsgText("jsdoMSG011", "getFormFields()"));
    };

    this.getListViewRecord = function(htmlIElement) {
        if (this._defaultUITableRef) {
            return this._defaultUITableRef.getListViewRecord(htmlIElement);
        } else
            throw new Error(msg.getMsgText("jsdoMSG011", "getListViewRecord()"));
    };

    this.getFormRecord = function(detailPageName) {
        if (this._defaultUITableRef) {
            return this._defaultUITableRef.getFormRecord(detailPageName);
        } else
            throw new Error(msg.getMsgText("jsdoMSG011", "getFormRecord()"));
    };

    this.setDetailPage = function(obj) {
        if (this._defaultUITableRef)
            return this._defaultUITableRef.setDetailPage(obj);
        throw new Error(msg.getMsgText("jsdoMSG011", "setDetailPage()"));
    };

    this.setListView = function(obj) {
        if (this._defaultUITableRef)
            return this._defaultUITableRef.setListView(obj);
        throw new Error(msg.getMsgText("jsdoMSG011", "setListView()"));
    };

};
progress.ui.UIHelper._defaultItemTemplate = '<li data-theme="c" data-id="{__id__}">' +
    '<a href="#{__page__}" class="ui-link" data-transition="slide">{__format__}</a></li>';
progress.ui.UIHelper._defaultFieldTemplate = '<div data-role="fieldcontain">' +
    '<label for="{__name__}">{__label__}</label>' +
    '<input id="{__name__}" name="{__name__}" placeholder="" value="" type="text" /></div>';
progress.ui.UIHelper._itemTemplate = progress.ui.UIHelper._defaultItemTemplate;
progress.ui.UIHelper._fieldTemplate = progress.ui.UIHelper._defaultFieldTemplate;

progress.ui.UIHelper.setItemTemplate = function(template) {
    progress.ui.UIHelper._itemTemplate = template ? template : progress.ui.UIHelper._defaultItemTemplate;
};

progress.ui.UIHelper.setFieldTemplate = function(template) {
progress.ui.UIHelper._fieldTemplate =
    template ? template : progress.ui.UIHelper._defaultFieldTemplate;
};

})();

//this is so that we can see the code in Chrome's Source tab when script is loaded via XHR