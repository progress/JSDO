/*
Progress JSDO Version: 4.3.0

Copyright 2012-2016 Progress Software Corporation and/or its subsidiaries or affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/* 
progress.util.js    Version: 4.3.0-1

Copyright (c) 2014-2015 Progress Software Corporation and/or its subsidiaries or affiliates.

Contains support objects used by the jsdo and/or session object

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
 
    http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

 */

(function () {
    
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
        DATE_OBJECT_TYPE = "Date";
    
    
    /**
     * Utility class that allows subscribing and unsubscribing from named events.
     *
     * @returns {progress.util.Observable}
     */
    progress.util.Observable = function () {
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
            return observers.filter(function (el) {
                if (el.fn !== fn || el.scope !== scope || el.operation !== operation) {
                    return el;
                }
            }, this);
        }

        /*
         * validate the arguments passed to the subscribe function
         */
        this.validateSubscribe = function (args, evt, listenerData) {

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
        this.subscribe = function (evt, operation, fn, scope) {
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
            listenerData = {fn: undefined, scope: undefined, operation: undefined};

            try {
                this.validateSubscribe(arguments, evt, listenerData);
            }
            catch (e) {
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
        this.unsubscribe = function (evt, operation, fn, scope) {
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
            listenerData = {fn: undefined, scope: undefined, operation: undefined};
            try {
                this.validateSubscribe(arguments, evt, listenerData);
            }
            catch (e) {
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
        this.trigger = function (evt, operation, args) {
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

                if ((arguments.length >= 2) 
                    && (typeof evt === 'string') 
                    && (typeof operation === 'string')) {
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

                observers.forEach(function (el) {
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
        this.unsubscribeAll = function (evt, operation) {
            var observers;
            
            if (evt) {
                this._events = this._events || {};
                if (typeof evt === 'string') {
                    evt = evt.toLowerCase();
                    observers = this._events[evt] || [];

                    observers.forEach(function (el) {
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
            throw new Error(progress.data._getMsgText("jsdoMSG002", this._name));
        }


        // "Methods"

        this.saveToLocalStorage = function (name, dataObj) {
            localStorage.setItem(name, JSON.stringify(dataObj));
        };

        this.readFromLocalStorage = function (name) {

            var jsonStr = localStorage.getItem(name),
                dataObj = null;
                
            if (jsonStr !== null) {
                try {
                    dataObj = JSON.parse(jsonStr);
                }
                catch (e) {
                    dataObj = null;
                }
            }
            return dataObj;
        };

        this.clearLocalStorage = function (name) {
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
    progress.util._convertToABLWhereString = function (tableRef, filter) {
        var result = [],
            logic = filter.logic || "and",
            idx,
            length,
            field,
            type,
            format,
            operator,
            value,
            ablType,
            filters = (filter.filters) ?  filter.filters : [filter],
			
            whereOperators = {
                eq: "=",
                neq: "<>",
                gt: ">",
                gte: ">=",
                lt: "<",
                lte: "<=",
                contains : "INDEX", 
                doesnotcontain: "INDEX",
                endswith: "R-INDEX", 
                startswith: "BEGINS"
        };
        
        for (idx = 0, length = filters.length; idx < length; idx=idx+1) {
            filter = filters[idx];
            field = filter.field;
            value = filter.value;

            if (filter.filters) {
                filter = progress.util._convertToABLWhereString(tableRef, filter);
            } else {
                operator = whereOperators[filter.operator];
                
                if (operator === undefined) {
                    throw new Error("The operator " + filter.operator + " is not valid.");
                }

                if (operator && value !== undefined) {
                    type = progress.util._getObjectType(value);
  
                    // We need to build a template format string for the where string. 
                    // We'll first add positional info for the value
                    if (type === STRING_OBJECT_TYPE) {
                        format = "'{1}'";
                    } 
                    else if (type === DATE_OBJECT_TYPE) {
                        ablType = tableRef._getABLType(field);
                        if (ablType === "DATE") {
                            format = "DATE({1:MM, dd, yyyy})";
                        }
                        else if (ablType === "DATETIME-TZ") {
                            // zzz here means to translate timezone offset into minutes
                            format = "DATETIME-TZ({1:MM, dd, yyyy, hh, mm, ss, fff, zzz})";
                        }
                        else {
                            format = "DATETIME({1:MM, dd, yyyy, hh, mm, ss, fff})";
                        }
                    } 
					else {
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
                        }
                        else if (filter.operator === "contains") {
                            format = "{0}(" + "{2}, " + format + ") > 0";
                        }
                        // else filter.operator = "endswith"
                        else  {
                            format = "{2} MATCHES '*{1}'";
                        }
                    }
                    else {
                        format = "{2} {0} " + format;
                    }

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
    progress.util._convertToSQLQueryString = function (tableRef, filter, addSelect) {
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
            filters = (filter.filters) ?  filter.filters : [filter],
            filterStr,
            usingLike = true,
			
            whereOperators = {
                eq: "=",
                neq: "!=",
                gt: ">",
                gte: ">=",
                lt: "<",
                lte: "<=",
                contains : "LIKE", 
                doesnotcontain: "NOT LIKE",
                endswith: "LIKE", 
                startswith: "LIKE"
        };
        
        if (typeof addSelect === "undefined") {
            addSelect = false;
        }

        for (idx = 0, length = filters.length; idx < length; idx=idx+1) {
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
                    } 
                    else if (type === DATE_OBJECT_TYPE) {
                        fieldFormat = tableRef._getFormat(field);
                        if (fieldFormat === "date") {
                            format = "'{1:yyyy-MM-dd}'";
                        }
                        else if (fieldFormat === "date-time") {
                            format = "{1:#ISO(iso)}";
                        }
                        else if (fieldFormat === "time") {
                            format = "'{1:FFF}'";
                        } 
                    } 
					else {
                        format = "{1}";
                    }
                    
                    // We need to build a template format string for the where string. 
                    // We'll first add positional info for the value, which is represented by {1}
                    if (filter.operator === "startswith") {
                        format = "'{1}%'";
                    }
                    else if (filter.operator === "endswith") { 
                        format = "'%{1}'";
                    }
                    else if (filter.operator === "contains" || filter.operator === "doesnotcontain") {
                        format = "'%{1}%'";
                    }
                    else {
                       usingLike = false;
                    }
                    
                    if (usingLike) {
                        value = value.replace(/%/g, '\\%');
                        value = value.replace(/_/g, '\\_');
                    }

                   
                    format = "{2} {0} " + format;
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
            str =  value.toString();
        }
        else {
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
    progress.util._pad = function (number, digits) {
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
    progress.util._formatDate = function (date, format) {
        /*jslint regexp: true*/
        var dateFormatRegExp = 
            /dd|MM|yyyy|hh|mm|fff|FFF|ss|zzz|iso|"[^"]*"|'[^']*'/g;
        /*jslint regexp: false*/
       
        return format.replace(dateFormatRegExp, function (match) {
            var minutes,
                result,
                sign;

            if (match === "dd") {
                result = progress.util._pad(date.getDate());
            }
            else if (match === "MM") {
                result = progress.util._pad(date.getMonth() + 1);
            } 
            else if (match === "yyyy") {
                result = progress.util._pad(date.getFullYear(), 4);
            } 
            else if (match === "hh") {
                result = progress.util._pad(date.getHours());
            } 
            else if (match === "mm") {
                result = progress.util._pad(date.getMinutes());
            } 
            else if (match === "ss") {
                result = progress.util._pad(date.getSeconds());
            } 
            else if (match === "fff") {
                result = progress.util._pad(date.getMilliseconds(), 3);
            } 
            else if (match === "FFF") {
                result = String(date.getTime());
            } 
            else if (match === "zzz") {
                // timezone is returned in minutes
                minutes = date.getTimezoneOffset();
                sign = minutes < 0;
                result = (sign ? "+" : "-") + minutes;
            } 
            else if (match === "iso") {
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
            if (jsdoSettings.authenticationModel  === undefined || jsdoSettings.authenticationModel  === "") {
                jsdoSettings.authenticationModel = "ANONYMOUS";
            }
        }
    };

}()); 



//# sourceURL=progress.jsdo.js

/* 
progress.js    Version: 4.3.0-24

Copyright (c) 2012-2016 Progress Software Corporation and/or its subsidiaries or affiliates.
 
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
 
    http://www.apache.org/licenses/LICENSE-2.0
  
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

 */

(function () {

    // "use strict";
    
    var PROGRESS_JSDO_PCT_MAX_EMPTY_BLOCKS = 20,
        PROGRESS_JSDO_OP_STRING = ["none", "create", "read", "update", "delete", "submit"],
        PROGRESS_JSDO_ROW_STATE_STRING = ["", "created", "", "modified", "deleted"];
    
    /* define these if not defined yet - they may already be defined if
     progress.session.js was included first */
    if (typeof progress === 'undefined') {
        progress = {};
    }
    if (typeof progress.data === 'undefined') {
        progress.data = {};
    }

    progress.data._nextid = 0;
    progress.data._uidprefix = "" + ( Date.now ? Date.now() : (new Date().getTime()));

    /* 15 - 9 */
    var UID_MAX_VALUE = 999999999999999;

    progress.data._getNextId = function () {
        var uid = ++progress.data._nextid;
        if (uid >= UID_MAX_VALUE) {
            progress.data._nextid = uid = 1;
            progress.data._uidprefix = "" + ( Date.now ? Date.now() : (new Date().getTime()));
        }

        return progress.data._uidprefix + "-" + uid;
    };


    var msg = {};
    msg.msgs = {};
//        msg numbers   0 -  99 are related to use of the API (methods and properties we expose to developers)
//                    100 - 109 relate to network errors
//                    110 - 998 are for miscellaneous errors
                    
    msg.msgs.jsdoMSG000 = "JSDO, Internal Error: {1}";
    msg.msgs.jsdoMSG001 = "JSDO: JSDO has multiple tables. Please use {1} at the table reference level.";
    msg.msgs.jsdoMSG002 = "JSDO: Working record for '{1}' is undefined.";
    msg.msgs.jsdoMSG003 = "JSDO: {1} function requires a function as a parameter.";
    msg.msgs.jsdoMSG004 = "JSDO: Unable to find resource '{1}' in the catalog.";
    msg.msgs.jsdoMSG005 = "JSDO: Data for table '{1}' was not specified in addRecords() call.";
    msg.msgs.jsdoMSG006 = "JSDO: Data for JSDO was not specified in addRecords() call.";
    msg.msgs.jsdoMSG007 = "JSDO: Test function in {1} must return a boolean.";
    msg.msgs.jsdoMSG008 = "JSDO: Invalid keyFields parameter in addRecords() call.";
    msg.msgs.jsdoMSG009 = "JSDO: KeyField '{1}' in addRecords() call was not found in the schema.";
    msg.msgs.jsdoMSG010 = "JSDO: Field '{1}' in relationship was not found in the schema.";
    msg.msgs.jsdoMSG011 = "UIHelper: JSDO has multiple tables. " +
        "Please use {1} at the table reference level.";
    msg.msgs.jsdoMSG012 = "UIHelper: Invalid {2} parameter in {1} call.";
    msg.msgs.jsdoMSG020 = "JSDO: tableName parameter must be a string in addRecords() call.";
    msg.msgs.jsdoMSG021 = "JSDO: addMode parameter must be specified in addRecords() call.";
    msg.msgs.jsdoMSG022 = "JSDO: Invalid addMode specified in addRecords() call.";
    msg.msgs.jsdoMSG023 = "JSDO: Duplicate found in addRecords() call using APPEND mode.";
    msg.msgs.jsdoMSG024 = "{1}: Unexpected signature in call to {2} function.";
    msg.msgs.jsdoMSG025 = "{1}: Invalid parameters in call to {2} function.";
    msg.msgs.jsdoMSG026 = "JSDO: saveChanges requires a " +
        "CREATE, UPDATE, DELETE or SUBMIT operation to be defined.";
    msg.msgs.jsdoMSG030 = "JSDO: Invalid {1}, expected {2}.";
    msg.msgs.jsdoMSG031 = "JSDO: Specified sort field name '{1}' was not found in the schema.";
    msg.msgs.jsdoMSG032 = "JSDO: Before-image data already exists for record in addRecords() call.";
    msg.msgs.jsdoMSG033 = "{1}: Invalid signature for {2}. {3}";
    msg.msgs.jsdoMSG034 = "JSDO: In '{1}' function, JSON data is missing _id";
    msg.msgs.jsdoMSG035 = "JSDO: In '{1}' function, before-image JSON data is missing prods:clientId";
    msg.msgs.jsdoMSG036 = "JSDO: '{1}' can only be called for a dataset";
    msg.msgs.jsdoMSG037 = "{1}: Event name must be provided for {2}.";
    msg.msgs.jsdoMSG038 = "Too few arguments. There must be at least {1}.";
    msg.msgs.jsdoMSG039 = "The name of the event is not a string.";
    msg.msgs.jsdoMSG040 = "The event listener is not a function.";
    msg.msgs.jsdoMSG041 = "The event listener scope is not an object.";
    msg.msgs.jsdoMSG042 = "'{1}' is not a defined event for this object.";
    msg.msgs.jsdoMSG043 = "{1}: A session object was requested to check the status of a Mobile " +
        "Service named '{2}', but it has not loaded the definition of that service.";
    msg.msgs.jsdoMSG044 = "JSDO: In '{1}' function, {2} is missing {3} property.";
    msg.msgs.jsdoMSG045 = "JSDO: {1} function: {2} is missing {3} property.";    
    msg.msgs.jsdoMSG046 = "JSDO: {1} operation is not defined.";
    msg.msgs.jsdoMSG047 = "{1} timeout expired.";
    msg.msgs.jsdoMSG048 = "{1}: {2} method has argument '{3}' that is missing property '{4}'.";
    msg.msgs.jsdoMSG049 = "{1}: Unexpected error authenticating: {2}";
    msg.msgs.jsdoMSG050 = "No token returned from server";
    msg.msgs.jsdoMSG051 = "{1} authenticate() failed because the AuthenticationProvider is already managing a successful authentication.";
    msg.msgs.jsdoMSG052 = "{1}: Login was not attempted because no credentials were supplied.";
    
    //                    100 - 109 relate to network errors
    msg.msgs.jsdoMSG100 = "JSDO: Unexpected HTTP response. Too many records.";
    msg.msgs.jsdoMSG101 = "Network error while executing HTTP request.";

    //                    110 - 499 are for miscellaneous errors
    msg.msgs.jsdoMSG110 = "Catalog error: idProperty not specified for resource '{1}'. " +
        "idProperty is required {2}.";
    msg.msgs.jsdoMSG111 = "Catalog error: Schema '{1}' was not found in catalog.";
    msg.msgs.jsdoMSG112 = "Catalog error: Output parameter '{1}' was not found for operation '{2}'.";
    msg.msgs.jsdoMSG113 = "Catalog error: Found xType '{1}' for output parameter '{2}' " +
        "for operation '{3}' but xType DATASET, TABLE or ARRAY was expected.";
    msg.msgs.jsdoMSG114 = "JSDO: idProperty '{1}' is missing from '{2}' record.";
    msg.msgs.jsdoMSG115 = "JSDO: Invalid option specified in {1}() call.";
    msg.msgs.jsdoMSG116 = "JSDO: {1} parameter must be a string in {2} call.";
    msg.msgs.jsdoMSG117 = "JSDO: Schema from storage area '{1}' does not match JSDO schema";
	msg.msgs.jsdoMSG118 = "JSDO: Plugin '{1}' was not found.";
	msg.msgs.jsdoMSG119 = "JSDO: A mappingType is expected when 'capabilities' is set." +
                                " Please specify a plugin (ex: JFP).";
	msg.msgs.jsdoMSG120 = "JSDO: Parameter '{2}' requires capability '{1}' in the catalog.";
    msg.msgs.jsdoMSG121 = "{1}: Argument {2} must be of type {3} in {4} call.";
    msg.msgs.jsdoMSG122 = "{1}: Incorrect number of arguments in {2} call. There should be {3}.";
    msg.msgs.jsdoMSG123 = "{1}: A server response included an invalid '{2}' header.";
    msg.msgs.jsdoMSG124 = "JSDO: autoApplyChanges is not supported for saveChanges(true) " + 
                            "with a temp-table. Use jsdo.autoApplyChanges = false.";
    msg.msgs.jsdoMSG125 = "JSDOSession: The AuthenticationProvider needs to be managing a valid token.";
    
    //                    500 - 998 are for generic errors
    msg.msgs.jsdoMSG500 = "{1}: '{2}' objects must contain a '{3}' property.";
    msg.msgs.jsdoMSG501 = "{1}: '{2}' cannot be an empty string.";
    msg.msgs.jsdoMSG502 = "{1}: The object '{2}' has an invalid value in the '{3}' property.";
    msg.msgs.jsdoMSG503 = "{1}: '{2}' must be of type '{3}'";

    msg.msgs.jsdoMSG998 = "JSDO: JSON object in addRecords() must be DataSet or Temp-Table data.";

    msg.getMsgText = function (n, args) {
        var text = msg.msgs[n],
            i;
        if (!text) {
            throw new Error("Message text was not found by getMsgText()");
        }
        for (i = 1; i < arguments.length; i += 1) {
            text = text.replace(new RegExp('\\{' + i + '\\}', 'g'), arguments[i]);
        }

        return text;
    };

    progress.data._getMsgText = msg.getMsgText;
	
	progress.data.PluginManager = {};
	progress.data.PluginManager._plugins = {};
	
	progress.data.PluginManager.addPlugin = function(name, plugin) {
        if (progress.data.PluginManager._plugins[name] === undefined) {
            progress.data.PluginManager._plugins[name] = plugin;
		}
        else {
            throw new Error("A plugin named '" + name + "' is already registered.");
		}
	};
		
    progress.data.PluginManager.getPlugin = function (name) {
        return progress.data.PluginManager._plugins[name];
    };
	
    progress.data.JSIndexEntry = function JSIndexEntry(index) {
        this.index = index;
    };

    progress.data.JSTableRef = function JSTableRef(jsdo, tableName) {
        this._jsdo = jsdo;
        this._name = tableName;
        this._schema = null;
        this._primaryKeys = null;
        this._fields = null;
        this._processed = {};
        this._visited = false;

        // record is used to represent the current record for a table reference
        this.record = null;

        // Data structure
        this._data = [];
        this._index = {};
        this._hasEmptyBlocks = false;

        // Arrays to keep track of changes
        this._beforeImage = {};
        this._added = [];
        this._changed = {};
        this._deleted = [];
        this._lastErrors = [];
        this._convertForServer;

        this._createIndex = function () {
            var i, block, id, idProperty;
            this._index = {};
            this._hasEmptyBlocks = false;
            for (i = 0; i < this._data.length; i += 1) {
                block = this._data[i];
                if (!block) {
                    this._hasEmptyBlocks = true;
                    continue;
                }
                id = this._data[i]._id;
                if (!id) {
                    idProperty = this._jsdo._resource.idProperty;
                    if (typeof(idProperty) == "string") {
                        id = this._data[i][idProperty];
                        if (!id) {
                            throw new Error(msg.getMsgText("jsdoMSG114", idProperty, this._name));
                        }
                        id += "";
                    }
                    else {
                        id = progress.data._getNextId();
                    }
                    this._data[i]._id = id;
                }
                this._index[id] = new progress.data.JSIndexEntry(i);
            }
            this._needCompaction = false;
        };

        this._compact = function () {
            var newDataArray = [], i, block;
            
            for (i = 0; i < this._data.length; i += 1) {
                block = this._data[i];
                if (block) {
                    newDataArray.push(block);
                }
            }
            this._data = newDataArray;
            this._createIndex();
        };

        this._loadBeforeImageData = function (jsonObject, beforeImageJsonIndex, keyFields) {
            var prodsBeforeData = jsonObject[this._jsdo._dataSetName]["prods:before"],
                tmpIndex = {},
                record,
                record2,                
                recordId,
                key,
                tmpKeyIndex,
                id,
                jsrecord,
                tmpDataIndex,
                tmpDeletedIndex,
                i;

                if (prodsBeforeData && prodsBeforeData[this._name]) {

                if ((Object.keys(this._beforeImage).length !== 0) && keyFields && (keyFields.length !== 0)) {
                    tmpKeyIndex = {};
                    for (id in this._beforeImage) {
                        jsrecord = this._findById(id, false);

                        if (jsrecord) {
                            key = this._getKey(jsrecord.data, keyFields);
                            tmpKeyIndex[key] = jsrecord.data;
                        }
                    }
                }

                for (i = 0; i < prodsBeforeData[this._name].length; i++) {
                    record = prodsBeforeData[this._name][i];
                    tmpIndex[record["prods:id"]] = record;

                    if (record["prods:rowState"] == "deleted") {
                        key = undefined;

                        if (keyFields && (keyFields.length !== 0)) {
                            key = this._getKey(record, keyFields);
                        }

                        if (tmpKeyIndex) {
                            if (tmpKeyIndex[key] !== undefined) {
                                throw new Error(msg.getMsgText("jsdoMSG032"));
                            }
                        }

                        if ((tmpDataIndex === undefined) && keyFields && (keyFields.length !== 0)) {
                            tmpDataIndex = {};
                            tmpDeletedIndex = {};

                            for (var j = 0; j < this._data.length; j++) {
                                record2 = this._data[j];
                                if (!record2) continue;

                                var key2 = this._getKey(record2, keyFields);
                                tmpDataIndex[key2] = record2;
                            }

                            // We also want to check if _deleted record already exists
                            for (var j = 0; j < this._deleted.length; j++) {
                                record2 = this._deleted[j].data;
                                if (!record2) continue;

                                var key2 = this._getKey(record2, keyFields);
                                tmpDeletedIndex[key2] = record2;
                            }
                        }

                        // First check to see if this deleted record is already in _deleted array
                        if (key !== undefined) {
                            record2 = tmpDeletedIndex[key];
                            if (record2 !== undefined) {
                                // If record is already in _deleted array, then nothing more to do here
                                continue;
                            }
                        }

                        if (key !== undefined) {
                            record2 = tmpDataIndex[key];
                            if (record2 !== undefined) {
                                var jsrecord = this._findById(record2._id, false);
                                if (jsrecord) jsrecord._remove(false);
                                record._id = record2._id;
                            }
                        }

                        if (record._id === undefined)
                            record._id = progress.data._getNextId();
                        var copy = {};
                        this._jsdo._copyRecord(
                            this._tableRef, record, copy);
                        this._jsdo._deleteProdsProperties(copy);
                        this._beforeImage[record._id] = copy;
                        var jsrecord = new progress.data.JSRecord(this, copy);
                        this._deleted.push(jsrecord);
                    }
                }
            }

            // Process data using jsonObject instead of _data
            // First check if there is after-data for table. Can be called with just before-image data
            var tableObject = jsonObject[this._jsdo._dataSetName][this._name];
            if (tableObject) {
                for (var i = 0; i < jsonObject[this._jsdo._dataSetName][this._name].length; i++) {
                    record = jsonObject[this._jsdo._dataSetName][this._name][i];
                    recordId = undefined;
                    if (beforeImageJsonIndex && record["prods:id"]) {
                        recordId = beforeImageJsonIndex[record["prods:id"]];
                    }
                    switch (record["prods:rowState"]) {
                        case "created":
                            if (recordId === undefined) {
                                recordId = record._id;
                            }

                            // If recordId and record._id are undefined, the record was not processed
                            if (recordId !== undefined) {
                                this._beforeImage[recordId] = null;
                                this._added.push(recordId);
                            }
                            break;
                        case "modified":
                            var beforeRecord = tmpIndex[record["prods:id"]];
                            if (beforeRecord === undefined) {
                                beforeRecord = {};
                            }

                            if (recordId === undefined) {
                                recordId = record._id;
                            }
                            // If recordId and record._id are undefined, the record was not processed
                            if (recordId !== undefined) {
                                beforeRecord._id = record._id;

                                var copy = {};
                                this._jsdo._copyRecord(
                                    this._tableRef, beforeRecord, copy);
                                this._jsdo._deleteProdsProperties(copy);

                                this._beforeImage[recordId] = copy;
                                this._changed[recordId] = record;

                                this._beforeImage[beforeRecord._id] = copy;
                                this._changed[beforeRecord._id] = record;
                            }
                            break;
                        case undefined:
                            break; // rowState is only specified for records that have changed
                        default:
                            throw new Error(msg.getMsgText("jsdoMSG030", 
                                "rowState value in before-image data", "'created' or 'modified'"));
                    }
                }
            }

            // Process prods:errors
            var prodsErrors = jsonObject[this._jsdo._dataSetName]["prods:errors"];
            if (prodsErrors) {
                for (var i = 0; i < prodsErrors[this._name].length; i++) {
                    var item = prodsErrors[this._name][i];
                    var recordId = beforeImageJsonIndex[item["prods:id"]];
                    var jsrecord = this._findById(recordId, false);
                    if (jsrecord) {
                        jsrecord.data._errorString = item["prods:error"];
                    }
                }
            }

            tmpIndex = null;
        };

        /*
         * Clears all data (including any pending changes) in buffer
         */
        this._clearData = function () {
            this._setRecord(null);

            // Data structure
            this._data = [];
            this._index = {};
            this._createIndex();

            // Arrays to keep track of changes
            this._beforeImage = {};
            this._added = [];
            this._changed = {};
            this._deleted = [];
        };

        this.hasData = function () {
            var data;

            // Check if we should return this table with its nested child table's data as nested
            if (this._jsdo._nestChildren) {
                data = this._getDataWithNestedChildren(this._data);
            }
            else {
                data = this._getRelatedData();
            }

            if (this._hasEmptyBlocks) {
                for (var i = 0; i < data.length; i++) {
                    var block = data[i];
                    if (!block) {
                        return true;
                    }
                }
            }

            return data.length !== 0;
        };

        this.getData = function (params) {
            var i, 
                data,
                numEmptyBlocks,
                newDataArray,
                block;
                
            if (this._needCompaction) {
                this._compact();
            }

            if (params && params.filter) {
                throw new Error("Not implemented in current version");
            }
            // Check if we should return this table with its nested child table's data as nested
            else if (this._jsdo._nestChildren) {
                data = this._getDataWithNestedChildren(this._data);
            }
            else {
                data = this._getRelatedData();
            }

            if (this._hasEmptyBlocks) {
                numEmptyBlocks = 0;
                newDataArray = [];   
                for (i = 0; i < data.length; i += 1) {
                    block = data[i];
                    if (block) {
                        newDataArray.push(block);
                    }
                    else {
                        numEmptyBlocks++;
                    }
                }
                if ((numEmptyBlocks * 100 / this._data.length) >= PROGRESS_JSDO_PCT_MAX_EMPTY_BLOCKS)
                    this._needCompaction = true;

                data = newDataArray;
            }
            else {
                // Creates a copy of the data if sort and top are specified
                // so that the sorting does not happen in the JSDO memory but 
                // in a copy of the records
                if (params && (params.sort || params.top)) {
                    newDataArray = [];
                    for (i = 0; i < data.length; i += 1) {
                        newDataArray.push(data[i]);
                    }
                    data = newDataArray;
                }
            }

            if (params && (params.sort || params.top)) {
                if (params.sort) {
                    // Converts sort option from Kendo UI to sort option used by the JSDO
                    sortFields = [];
                    for (i = 0; i < params.sort.length; i += 1) {
                        field = params.sort[i].field;
                        if (params.sort[i].dir == "desc") {
                            field += ":DESC";
                        }
                        sortFields.push(field);
                    }                                                                             
                    
                    // Obtain sortObject from sort options to get compare functions
                    var sortObject = this._processSortFields(sortFields);
                    if (sortObject.sortFields && sortObject.sortFields.length > 0) {
                        sortObject.tableRef = this;
                        data.sort(this._getCompareFn(sortObject));
                    }                
                }

                if (params.top) {
                    if (typeof(params.skip) == "undefined") {
                        params.skip = 0;
                    }
                
                    data = data.splice(params.skip, params.top);
                }
            }
            
            return data;
        };

        this._recToDataObject = function (record, includeChildren) {
            var array = [record];
            var dataObject = array;

            if (typeof(includeChildren) == 'undefined') {
                includeChildren = false;
            }
            if (this._jsdo._dataSetName) {
                dataObject = {};
                dataObject[this._jsdo._dataSetName] = {};
                dataObject[this._jsdo._dataSetName][this._name] = array;
                if (includeChildren && this._children.length > 0) {
                    var jsrecord = this._findById(record._id, false);
                    if (jsrecord) {
                        for (var i = 0; i < this._children.length; i++) {
                            var tableName = this._children[i];
                            dataObject[this._jsdo._dataSetName][tableName] = 
                                this._jsdo._buffers[tableName]._getRelatedData(jsrecord);
                        }
                    }
                }
            }
            else {
                if (this._jsdo._dataProperty) {
                    dataObject = {};
                    dataObject[this._jsdo._dataProperty] = array;
                }
            }
            return dataObject;
        };

        this._recFromDataObject = function (dataObject) {
            var data = {};
            if (dataObject) {
                if (this._jsdo._dataSetName) {
                    if (dataObject[this._jsdo._dataSetName])
                        data = dataObject[this._jsdo._dataSetName][this._name];
                }
                else {
                    if (this._jsdo._dataProperty) {
                        if (dataObject[this._jsdo._dataProperty])
                            data = dataObject[this._jsdo._dataProperty];
                    }
                    else if (dataObject.data) {
                        data = dataObject.data;
                    }
                    else {
                        data = dataObject;
                    }
                }
            }

            return data instanceof Array ? data[0] : data;
        };

        // Property: schema
        this.getSchema = function () {
            return this._schema;
        };
        this.setSchema = function (schema) {
            this._schema = schema;
        };
        
        // Private method that returns the ABL data type for the specified field
        this._getABLType = function (fieldName) {
            var i, schema;
		
            schema = this.getSchema();
		
            for (i = 0; i < schema.length; i++) {
                if (schema[i].name == fieldName) {
                    return  schema[i].ablType;
                }
            }

            return undefined;	
        };  

        // Private method that returns format property (from catalog) for the specified field
        this._getFormat = function (fieldName) {
            var i, schema;
		
            schema = this.getSchema();
		
            for (i = 0; i < schema.length; i++) {
                if (schema[i].name == fieldName) {
                    return  schema[i].format;
                }
            }

            return undefined;	
        };  



        this.add = function (values) {
            return this._add(values, true, true);
        };
 
        // Alias for add() method
        this.create = this.add;

        this._add = function (values, trackChanges, setWorkingRecord) {
            if (typeof(trackChanges) == 'undefined') {
                trackChanges = true;
            }
            if (typeof(setWorkingRecord) == 'undefined') {
                setWorkingRecord = true;
            }
            var record = {},
                i,
                j,
                value,
                prefixElement,
                name;

            if (typeof values === "undefined") {
                values = {};
            }
            
            // Assign values from the schema
            var schema = this.getSchema();
            for (i = 0; i < schema.length; i++) {
                var fieldName = schema[i].name;
                if (schema[i].type == "array") {
                    record[fieldName] = [];
                    if (schema[i].maxItems) {
                        for (var j = 0; j < schema[i].maxItems; j++) {
                            record[fieldName][j] = this._jsdo._getDefaultValue(schema[i]);
                        }
                    }
                    
                    // Assign array values from object parameter
                    value = values[fieldName];
                    if (typeof value != "undefined") {
                        record[fieldName] = value;
                        delete values[fieldName];
                    }                    
                    // Assign values from individual fields from flattened arrays
                    prefixElement = this._jsdo._getArrayField(fieldName);
                    if (!record[fieldName]) {
                        record[fieldName] = [];
                    }
                    for (j = 0; j < schema[i].maxItems; j += 1) {
                        name = prefixElement.name + (j+1);
                        value = values[name];
                        if (typeof value != "undefined") {
                            if (!this._fields[name.toLowerCase()]) {
                                // Skip element if a field with the same name exists                                
                                // Remove property from object for element since it is not part of the actual schema
                                delete values[prefixElement.name + (j+1)];                            
                                if (typeof value == 'string' && schema[i].items.type != 'string') {
                                    value = this._jsdo._convertType(value,
                                                                              schema[i].items.type,
                                                                              null);
                                }                                
                                record[fieldName][j] = value;                                
                            }
                        }
                    }
                }
                else {
                    record[fieldName] = this._jsdo._getDefaultValue(schema[i]);
                }
            }

            // Assign values based on a relationship
            if (this._jsdo.useRelationships && this._relationship && this._parent) {
                if (this._jsdo._buffers[this._parent].record) {
                    for (var j = 0; j < this._relationship.length; j++) {
                        record[this._relationship[j].childFieldName] =
                        this._jsdo._buffers[this._parent].record.data[this._relationship[j].parentFieldName];
                    }
                }
                else
                    throw new Error(msg.getMsgText("jsdoMSG002", this._parent));
            }
            // Assign values from object parameter
            for (var v in values) {
                record[v] = values[v];
            }

            // Specify _id field - do not use schema default        
            var id;
            var idProperty;
            if ((idProperty = this._jsdo._resource.idProperty) !== undefined) {
                id = record[idProperty];
            }
            if (!id) {
                id = progress.data._getNextId();
            }
            else {
                id += "";
            }
            record._id = id;

            if (this.autoSort
                && this._sortRecords
                && (this._sortFn !== undefined || this._sortObject.sortFields !== undefined)) {
                if (this._needsAutoSorting) {
                    this._data.push(record);
                    this._sort();
                }
                else {
                    // Find position of new record in _data and use splice
                    for (var i = 0; i < this._data.length; i++) {
                        if (this._data[i] === null) continue; // Skip null elements
                        var ret = this._sortFn ?
                            this._sortFn(record, this._data[i]) :
                            this._compareFields(record, this._data[i]);
                        if (ret == -1) break;
                    }
                    this._data.splice(i, 0, record);
                }
                this._createIndex();
            }
            else {
                this._data.push(record);
                this._index[record._id] = new progress.data.JSIndexEntry(this._data.length - 1);
            }

            var jsrecord = new progress.data.JSRecord(this, record);

            // Set record property ignoring relationships
            if (setWorkingRecord)
                this._setRecord(jsrecord, true);

            if (trackChanges) {
                // Save before image
                this._beforeImage[record._id] = null;
                // End - Save before image
                this._added.push(record._id);
            }
            return jsrecord;
        };

        /*
         * Returns records related to the specified jsrecord.
         * If jsrecord is not specified the parent working record is used.
         */
        this._getRelatedData = function (jsrecord) {
            var data = [];

            if (this._data.length === 0) return data;

            if (typeof(jsrecord) == 'undefined') {
                if (this._jsdo.useRelationships && this._relationship && this._parent) {
                    jsrecord = this._jsdo._buffers[this._parent].record;
                    if (!jsrecord)
                        throw new Error(msg.getMsgText("jsdoMSG002", this._parent));
                }
            }
            if (jsrecord) {
                // Filter records using relationship
                for (var i = 0; i < this._data.length; i++) {
                    var block = this._data[i];
                    if (!block) continue;

                    var match = false;
                    for (var j = 0; j < this._relationship.length; j++) {
                        match = (jsrecord.data[this._relationship[j].parentFieldName] == 
                            this._data[i][this._relationship[j].childFieldName]);
                        if (!match) break;
                    }
                    if (match)
                        data.push(this._data[i]);
                }
            }
            else
                data = this._data;

            return data;
        };


        // This method is called on a parent table that has child tables 
        // where the relationship is specified as NESTED.
        // It returns a json array that contains the parent rows. 
        // If a parent row is involved in nested relationship,
        // then references to the child rows are added 
        // to the parent row in a child table array (providing the nested format)
        // We are using the internal jsdo _data arrays,
        // and adding a child table array to each parent row that has children.
        // Once the caller is done with the nested data, they can call jsdo._unnestData() 
        // which removes these child table references
        this._getDataWithNestedChildren = function (data) {

            // Walk through all the rows and determine if any of its child tables
            // should be associated (nested) with the current record
            for (var i = 0; i < data.length; i++) {
                var parentRecord = data[i];

                // Now walk thru the parent's children to find any nested children
                if (this._children && this._children.length > 0) {
                    for (var j = 0; j < this._children.length; j++) {
                        var childBuf = this._jsdo._buffers[this._children[j]];

                        if (childBuf._isNested) {
                            // If child is nested, then we should walk child records to find matches
                            for (var k = 0; k < childBuf._data.length; k++) {
                                var childRecord = childBuf._data[k];
                                if (!childRecord) continue;

                                var match = false;
                                for (var m = 0; m < childBuf._relationship.length; m++) {
                                    match = (parentRecord[childBuf._relationship[m].parentFieldName] ==
                                    childRecord[childBuf._relationship[m].childFieldName]);
                                    if (!match) break;
                                }
                                if (match) {
                                    // Make sure that this parentRecord has an array for its child rows
                                    if (!parentRecord[childBuf._name]) {
                                        parentRecord[childBuf._name] = [];
                                    }
                                    parentRecord[childBuf._name].push(childRecord);
                                }


                            } // end for; finished adding all child rows for parentRecord

                            // The child table may have its own nested children so call recursively
                            // Use child row array in current parentRecord
                            if (childBuf._hasNestedChild()) {
                                childBuf._getDataWithNestedChildren(parentRecord[childBuf._name]);
                            }


                        } // end if (childBuf._isNested)
                    }
                }


            }
            return data;

        };

        this._findFirst = function () {
            if (this._jsdo.useRelationships && this._relationship && this._parent) {
                if (this._jsdo._buffers[this._parent].record) {
                    // Filter records using relationship
                    for (var i = 0; i < this._data.length; i++) {
                        var block = this._data[i];
                        if (!block) continue;

                        var match = false;
                        var parentFieldName, childFieldName;
                        for (var j = 0; j < this._relationship.length; j++) {
                            parentFieldName = this._relationship[j].parentFieldName;
                            childFieldName = this._relationship[j].childFieldName;
                            match = (this._jsdo._buffers[this._parent].record.data[parentFieldName] == 
                                this._data[i][childFieldName]);
                            if (!match) break;
                        }
                        if (match) {
                            return new progress.data.JSRecord(this, this._data[i]);
                        }
                    }
                }
            }
            else {
                for (var i = 0; i < this._data.length; i++) {
                    var block = this._data[i];
                    if (!block) continue;

                    return new progress.data.JSRecord(this, this._data[i]);
                }
            }


            return undefined;
        };

        this._setRecord = function (jsrecord, ignoreRelationships) {
            if (jsrecord) {
                this.record = jsrecord;
            }
            else {
                this.record = undefined;
            }

            // Set child records only if useRelationships is true
            if (this._jsdo.useRelationships) {
                ignoreRelationships = ((typeof(ignoreRelationships) == 'boolean') && ignoreRelationships);

                if (this._children && this._children.length > 0) {
                    for (var i = 0; i < this._children.length; i++) {
                        var childTable = this._jsdo._buffers[this._children[i]];
                        if (!ignoreRelationships && this.record && childTable._relationship) {
                            childTable._setRecord(childTable._findFirst());
                        }
                        else {
                            childTable._setRecord(undefined, ignoreRelationships);
                        }
                    }
                }
            }

            if (this._jsdo._defaultTableRef) {
                this._jsdo.record = this.record;
            }
        };

        this.assign = function (values) {
            if (this.record) {
                return this.record.assign(values);
            }
            else
                throw new Error(msg.getMsgText("jsdoMSG002", this._name));
        };

        // Alias for assign() method
        this.update = this.assign;

        this.remove = function () {
            if (this.record) {
                return this.record._remove(true);
            }
            else
                throw new Error(msg.getMsgText("jsdoMSG002", this._name));
        };

        this._remove = function (bTrackChanges) {
            if (this.record) {
                return this.record._remove(bTrackChanges);
            }
            else
                throw new Error(msg.getMsgText("jsdoMSG002", this._name));
        };

        this.getId = function () {
            if (this.record) {
                return this.record.data._id;
            }
            else
                return 0;
        };

		// getErrors() - JSTableRef
		this.getErrors = function () {
			return this._lastErrors;
		};

        this.getErrorString = function () {
            if (this.record) {
                return this.record.data._errorString;
            }
            else
                return 0;
        };

        this.findById = function (id) {
            return this._findById(id, true);
        };

        this._findById = function (id, setWorkingRecord) {
            if (typeof(setWorkingRecord) == 'undefined') {
                setWorkingRecord = true;
            }
            if (id && this._index[id]) {
                var record = this._data[this._index[id].index];
                this.record = record ? (new progress.data.JSRecord(this, record)) : null;
                if (setWorkingRecord)
                    this._setRecord(this.record);
                return this.record;
            }

            if (setWorkingRecord)
                this._setRecord(null);
            return null;
        };

        /*
         * Finds a record in the JSDO memory using the specified function to determine the record.
         */
        this.find = function (fn) {
            if (typeof(fn) != 'function') {
                throw new Error(msg.getMsgText("jsdoMSG003", "find()"));
            }
            var data = this._getRelatedData();

            for (var i = 0; i < data.length; i++) {
                var block = data[i];
                if (!block) {
                    continue;
                }
                this._setRecord(new progress.data.JSRecord(this, data[i]));
                var result = fn(this.record);
                if (typeof(result) != 'boolean') {
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
        this.foreach = function (fn) {
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

        this._equalRecord = function (rec1, rec2, keyFields) {
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
        this._getKey = function (record, keyFields) {
            var keyObject = {};
            for (var i = 0; i < keyFields.length; i++) {
                var fieldName = keyFields[i];
                var value = record[fieldName];

                if (!jsdo[tableName].caseSensitive) {
                    field = jsdo[tableName]._fields[fieldName.toLowerCase()];
                    if (field && field.type == "string") {
                        if (value !== undefined && value !== null)
                            value = value.toUpperCase();
                    }
                }
                keyObject[fieldName] = value;
            }
            return JSON.stringify(keyObject);
        };

        this._getCompareFn = function (sortObject) {
            if (typeof sortObject == 'function') {
                return function (rec1, rec2) {
                    if (rec1 === null) return 1;
                    if (rec2 === null) return -1;

                    var jsrec1 = new progress.data.JSRecord(this, rec1);
                    var jsrec2 = new progress.data.JSRecord(this, rec2);
                    return sortObject(jsrec1, jsrec2);
                };
            }
            else return function (rec1, rec2) {
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
                "autoSort",
                {
                    get: function () {
                        return this._autoSort;
                    },
                    set: function (value) {
                        if (value) {
                            this._autoSort = true;
                            if (this._sortFn || this._sortObject.sortFields) {
                                this._sort();
                                this._createIndex();
                            }
                        }
                        else
                            this._autoSort = false;
                    },
                    enumerable: true,
                    writeable: true
                });
            this._caseSensitive = false;
            Object.defineProperty(
                this,
                "caseSensitive",
                {
                    get: function () {
                        return this._caseSensitive;
                    },
                    set: function (value) {
                        if (value) {
                            this._caseSensitive = true;
                        }
                        else
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
        }
        else {
            this.autoSort = true;
            this.caseSensitive = false; // caseSensitive is false by default		
        }

        this._processSortFields = function (sortFields) {
            var sortObject = {};
            if (sortFields instanceof Array) {
                sortObject.sortFields = sortFields;
                sortObject.sortAscending = [];
                sortObject.fields = {};
                for (var i = 0; i < sortObject.sortFields.length; i++) {
                    var idx;
                    var fieldName;
                    var field;

                    if (typeof (sortObject.sortFields[i]) != 'string') {
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
                    }
                    else {
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
                        }
                        else
                            throw new Error(msg.getMsgText("jsdoMSG031", fieldName));
                    }
                    sortObject.sortFields[i] = fieldName;
                    sortObject.fields[fieldName] = fieldName;
                }
            }
            else {
                sortObject.sortFields = undefined;
                sortObject.sortAscending = undefined;
                sortObject.fields = undefined;
            }
            return sortObject;
        };

        this.setSortFields = function (sortFields) {
            if (sortFields === undefined || sortFields === null) {
                this._sortObject.sortFields = undefined;
                this._sortObject.sortAscending = undefined;
            }
            else if (sortFields instanceof Array) {
                var sortObject = this._processSortFields(sortFields);
                this._sortObject.sortFields = sortObject.sortFields;
                this._sortObject.sortAscending = sortObject.sortAscending;
                this._sortObject.fields = sortObject.fields;

                if (this.autoSort) {
                    this._sort();
                    this._createIndex();
                }
            }
            else
                throw new Error(msg.getMsgText("jsdoMSG024", "JSDO", "setSortFields()"));
        };

        this.setSortFn = function (fn) {
            // Check that fn parameter is a function
            // Valid values are a function, undefined, or null
            // Documentation mentions null as a way to clear the sort function
            if (fn && typeof (fn) != 'function') {
                throw new Error(msg.getMsgText("jsdoMSG030", "parameter in setSortFn()", 
                    "function parameter"));
            }
            this._sortFn = fn ? this._getCompareFn(fn) : undefined;
            if (this.autoSort) {
                this._sort();
                this._createIndex();
            }
        };

        this.sort = function (arg1) {
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
            }
            else {
                this._sort(arg1);
            }
            this._createIndex();
        };

        this._sort = function (arg1) {
            if (arguments.length === 0 &&
                (!this.autoSort || (this._sortFn === undefined && this._sortObject.sortFields === undefined)))
                return;

            if (arguments.length === 0) {
                if (this._sortFn) {
                    // Sort using function
                    this._data.sort(this._sortFn);
                }
                else {
                    // Sort using sort fields
                    this._data.sort(this._compareFields);
                }
                this._needsAutoSorting = false;
            }
            else {
                if (typeof(arg1) == 'function') {
                    // Sort using function
                    this._data.sort(this._getCompareFn(arg1));
                }
                else {
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
        this.addRecords = function (jsonObject, addMode, keyFields, trackChanges, isInvoke) {
            this._jsdo._addRecords(this._name, jsonObject, addMode, keyFields, trackChanges, isInvoke);
        };

        /*
         * Accepts changes for the specified table reference. 
         */
        this.acceptChanges = function () {
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
        this.rejectChanges = function () {
            // Reject changes
            for (var id in this._beforeImage) {
                if (this._beforeImage[id] === null) {
                    // Undo create
                    this._jsdo._undoCreate(this, id);
                }
                else if (this._changed[id] !== undefined) {
                    // Undo update
                    this._jsdo._undoUpdate(this, id, true);
                }
                else {
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

        this.hasChanges = function () {
            return (Object.keys(this._beforeImage).length !== 0);
        };

        this.getChanges = function () {
            var result = [];
            for (var id in this._beforeImage) {
                var item = {rowState: "", record: null};
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
         * Private method to apply changes for the specified table reference.
         * If _errorString has been set for a row, row change is rejected. 
         * If it has not been set, acceptRowChanges() is called.
         */
        this._applyChanges = function () {
            for (var id in this._beforeImage) {
                //  Create
                if (this._beforeImage[id] === null) {
                    var jsrecord = this._findById(id, false);
                    if (jsrecord !== null) {
                        if (jsrecord.data._errorString !== undefined) {
                            this._jsdo._undoCreate(this, id);
                        }
                        else {
                            jsrecord.acceptRowChanges();
                        }
                    }
                    else {
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
                        if (jsrecord.data._errorString !== undefined) {
                            this._jsdo._undoUpdate(this, id);
                        }
                        else {
                            jsrecord.acceptRowChanges();
                        }
                    }
                    else {
                        // Record not present in JSDO memory
                        // Delete after Update
                        if (this._beforeImage[id]._errorString !== undefined) {
                            this._jsdo._undoDelete(this, id);
                        }
                        else {
                            var found = false;
                            for (var i = 0; i < this._deleted.length; i++) {
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
                    if (this._beforeImage[id]._errorString !== undefined) {
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
        this.acceptRowChanges = function () {
            if (this.record)
                return this.record.acceptRowChanges();
            throw new Error(msg.getMsgText("jsdoMSG002", this._name));
        };

        /*
         * Rejects row changes for the working record at the table reference level.
         */
        this.rejectRowChanges = function () {
            if (this.record)
                return this.record.rejectRowChanges();
            throw new Error(msg.getMsgText("jsdoMSG002", this._name));
        };


        /* This method returns true 
         * if this table has any child tables and at least one of those tables is nested.
         * Else if returns false.
         */
        this._hasNestedChild = function () {
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

        this.getId = function () {
            return this.data._id ? this.data._id : null;
        };

        this.getErrorString = function () {
            return this.data._errorString;
        };

        /*
         * Saves a copy of the current record to the before image.
         */
        this._saveBeforeImageUpdate = function () {
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
        this._sortRecord = function (fields) {
            var index = this._tableRef._index[this.data._id].index;
            var record = this._tableRef._data[index];

            if (this._tableRef.autoSort 
                && this._tableRef._sortRecords 
                && (this._tableRef._sortFn !== undefined 
                    || this._tableRef._sortObject.sortFields !== undefined)) {

                if (this._tableRef._sortObject.fields) {
                    if (typeof fields == 'string') {
                        if (this._tableRef._sortObject.fields[fields] === undefined)
                            return; // Only sort records if the the specified field is in the sort fields
                    }
                    else if (fields instanceof Array) {
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
                }
                else {
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
        this.assign = function (record) {
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
                            name = prefixElement.name + (j+1);
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
        this.remove = function () {
            return this._remove(true);
        };

        this._remove = function (bTrackChanges) {
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
                }
                else {
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
        this.acceptRowChanges = function () {
            var id = this.data._id;
            if (this._tableRef._beforeImage[id] !== undefined) {
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
                }
                else if (this._tableRef._changed[id] !== undefined) {
                    // Accept update
                    delete this._tableRef._changed[id];
                    this._tableRef._jsdo._deleteProdsProperties(this.data, true);
                }
                else {
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
        this.rejectRowChanges = function () {
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
                }
                else if (this._tableRef._changed[id] !== undefined) {
                    // Undo update
                    this._tableRef._jsdo._undoUpdate(this._tableRef, id, true);
                    delete this._tableRef._changed[id];
                }
                else {
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
                switch(evt.toLowerCase()) {
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
        
        this._defineProperty = function (tableName, fieldName) {
            Object.defineProperty(
                this._buffers[tableName],
                fieldName,
                {
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
                        }
                        else
                            return null;
                    },
                    set: function (value) {
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
                            }
                            finally {
                                this.record._sortRecord(name);
                            }
                        }
                    },
                    enumerable: true,
                    writeable: true
                });
        };

        // Initial values
        this._buffers = {};         // Object of table references
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
        var autoFill = false;

        // Initialize JSDO using init values
        if (!arguments[0]) {
            throw new Error("JSDO: Parameters are required in constructor.");
        }

        if (typeof(arguments[0]) == "string") {
            this.name = arguments[0];
//		if ( arguments[1] && (typeof(arguments[1]) ==  "string") )
//			localServiceName = serviceName;
        }
        else if (typeof(arguments[0]) == "object") {
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
        if ((!this.name) /*|| !(this._session)*/) {
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
                evt.forEach(function (el) {
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
                        var buffer = this[this._resource.dataProperty] 
                            = new progress.data.JSTableRef(this, this._resource.dataProperty);
                        this._buffers[this._resource.dataProperty] = buffer;
                    }
                    else {
                        for (var tableName in this._resource.fields) {
                            var buffer = this[tableName] 
                                = new progress.data.JSTableRef(this, tableName);
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

                // Add functions for operations to JSDO object
                for (var fnName in this._resource.fn) {
                    this[fnName] = this._resource.fn[fnName]["function"];
                }
                // Check if CUD operations have been defined
                this._hasCUDOperations =
                    this._resource.generic["create"] !== undefined
                    || this._resource.generic["update"] !== undefined
                    || this._resource.generic["delete"] !== undefined;
                this._hasSubmitOperation = this._resource.generic["submit"] !== undefined;

                /* get a session object, using name of the service to look it up in the list of
                 * sessions maintained by the ServicesManager
                 */
                if (!this._session) {
                    var myservice = progress.data.ServicesManager.getService(this._resource.service.name);
                    this._session = myservice._session;
                    this._session._pushJSDOs(this);
                }
            }
            else {
                throw new Error(msg.getMsgText("jsdoMSG004", this.name));
            }
        }
        else {
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
            this._caseSensitive = false;	// caseSensitive is false by default
            Object.defineProperty(
                this,
                "caseSensitive",
                {
                    get: function () {
                        return this._caseSensitive;
                    },
                    set: function (value) {
                        this._caseSensitive = value ? true : false;

                        for (var buf in this._buffers) {
                            this._buffers[buf].caseSensitive = this._caseSensitive;
                        }
                    },
                    enumerable: true,
                    writeable: true
                });
            this._autoSort = true;	// autoSort is true by default
            Object.defineProperty(
                this,
                "autoSort",
                {
                    get: function () {
                        return this._autoSort;
                    },
                    set: function (value) {
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
            Object.defineProperty( this, 
                                   "this._properties",
                                   {  
                                       get: function () {
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
            if (this._defaultTableRef
                && !this._defaultTableRef._schema
                && this._resource.fields[""]) {
                this._defaultTableRef._schema = this._resource.fields[""];
            }
        }
        else {
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

                    if (field.items
                        && field.type == "array" && field.items.$ref) {
                        if (this._buffers[field.name]) {
                            found = true;
                            this._buffers[field.name]._isNested = true;
                        }
                    }
                    else
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

                if (relationship.childName && relationship.parentName) {
                    // Set casing of fields in relationFields to be the same as in the schema
                    if (relationship.relationFields instanceof Array) {
                        for (var j = 0; j < relationship.relationFields.length; j++) {
                            var fieldName;
                            var field;
                            if (this._buffers[relationship.parentName]._fields) {
                                fieldName = relationship.relationFields[j].parentFieldName;
                                field=this._buffers[relationship.parentName]._fields[fieldName.toLowerCase()];
                                if (field) {
                                    relationship.relationFields[j].parentFieldName = field.name;
                                }
                                else
                                    throw new Error(msg.getMsgText("jsdoMSG010", fieldName));
                            }
                            if (this._buffers[relationship.childName]._fields) {
                                fieldName = relationship.relationFields[j].childFieldName;
                                field=this._buffers[relationship.childName]._fields[fieldName.toLowerCase()];
                                if (field) {
                                    relationship.relationFields[j].childFieldName = field.name;
                                }
                                else
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
        
        this._getDefaultValue = function (field) {
            var defaultValue,
                t, m, d,
                isDate = false;

            if ((field.type === "string")
                && field.format
                && (field.format.indexOf("date") !== -1)
                && (field["default"])) {
                isDate = true;
            } else if ((field.type === "array")
                       && field.ablType
                       && (field.ablType.indexOf("DATE") != -1)
                       && (field["default"])) {
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
        this._getArrayField = function (arrayFieldName, index, value) {
            var element = {};
            // ABL arrays are 1-based
            element.name = arrayFieldName + progress.data.JSDO.ARRAY_INDEX_SEPARATOR + ((index >= 0) ? (index + 1) : "");
            element.value = value ? value[index] : undefined;
            return element;
        };

        this.isDataSet = function () {
            return this._dataSetName ? true : false;
        };

        /* handler for invoke operation complete */
        this._invokeComplete = function (jsdo, success, request) {
            // only fire on async requests
            if (request.async && request.fnName) {
                jsdo.trigger('afterInvoke', request.fnName, jsdo, success, request);
            }
            
            if (request.deferred) {
                if (success) {
                    request.deferred.resolve(jsdo, success, request);
                }
                else {
                    request.deferred.reject(jsdo, success, request);
                }
            }            
        };

        /* handler for invoke operation success */
        this._invokeSuccess = function (/* jsdo, success, request */) {
            // do nothing
        };

        /* handler for invoke operation error */
        this._invokeError = function (/* jsdo, success, request */) {
            // do nothing
        };

        /*
         * Performs an HTTP request using the specified parameters.  This is 
         * used to perform remote calls for the JSDO for operations defined.
         * 
         */
        this._httpRequest = function (xhr, method, url, reqBody, request) {

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
                        if (this._resource.service.settings 
                            && this._resource.service.settings.useRequest !== undefined) {
                            useRequest = this._resource.service.settings.useRequest;
                        }
                        if (useRequest) {
                            reqBody = {request: reqBody};
                        }
                    }
                }
            }

            xhr.request = request;
            xhr.jsdo = this;
            request.jsdo = this;
            request.xhr = xhr;

            this._session._openRequest(xhr, method, url, request.async);

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

            return request;
        };


        // This method currently is just used by the JSDOReadService.
        // It returns data in its non-nested (default) format
        this._getDataObject = function () {
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
                }
                finally {
                    // Restore useRelationships
                    this.useRelationships = oldUseRelationships;
                }
            }
            else {
                if (this._dataProperty) {
                    dataObject[this._dataProperty] = this.getData();
                }
                else
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
        this._getDataObjectAsNested = function () {
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

                        this._nestChildren = false;  // default to false

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
                }
                catch (e) {
                    throw new Error(msg.getMsgText("jsdoMSG000", e.message));
                }
                finally {
                    // Set back to default avlue
                    this._nestChildren = false;
                }
            }
            else {
                if (this._dataProperty) {
                    dataObject[this._dataProperty] = this.getData();
                }
                else
                    return this.getData(); // Array
            }
            return dataObject;
        };


        // This method is used in conjunction with _getDataObjectAsNested() in the JSDOReadService.
        // _getDataObjectAsNested() adds arrays of child row references to their parent rows.
        // Once the JSDOReadService has done its data mapping, we need to remove the references since
        // internally the JSDO stores its data in unnested format.
        this._unnestData = function () {

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


        this._recToDataObject = function (record, includeChildren) {
            if (this._defaultTableRef)
                return this._defaultTableRef._recToDataObject(record, includeChildren);
            throw new Error(msg.getMsgText("jsdoMSG001", "_recToDataObject()"));
        };

        this._recFromDataObject = function (dataObject) {
            if (this._defaultTableRef)
                return this._defaultTableRef._recFromDataObject(dataObject);
            throw new Error(msg.getMsgText("jsdoMSG001", "_recFromDataObject()"));
        };

        this.add = function (obj) {
            if (this._defaultTableRef)
                return this._defaultTableRef.add(obj);
            throw new Error(msg.getMsgText("jsdoMSG001", "add() or create()"));
        };
        
        // Alias for add() method
        this.create = this.add;
        
        this.hasData = function () {
            for (var buf in this._buffers) {
                if (this._buffers[this._buffers[buf]._name].hasData())
                    return true;
            }
            return false;
        };

        this.getData = function (params) {
            if (this._defaultTableRef)
                return this._defaultTableRef.getData(params);
            throw new Error(msg.getMsgText("jsdoMSG001", "getData()"));
        };

        this.getSchema = function () {
            if (this._defaultTableRef)
                return this._defaultTableRef.getSchema();
            throw new Error(msg.getMsgText("jsdoMSG001", "getSchema()"));
        };

        this.findById = function (id) {
            if (this._defaultTableRef)
                return this._defaultTableRef.findById(id);
            throw new Error(msg.getMsgText("jsdoMSG001", "findById()"));
        };

        this._convertType = function (value, type, itemType) {
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
                }
                else if (type == 'integer') {
                    result = parseInt(value);
                }
                else if (type == 'number') {
                    result = parseFloat(value);
                }
                else {
                    result = value;
                }
            }
            catch (e) {
                throw new Error(msg.getMsgText("jsdoMSG000", 
                    "Error converting string to native type: " + e.message));
            }
            return result;
        };

        this.assign = function (values) {
            if (this._defaultTableRef) {
                return this._defaultTableRef.assign(values);
            }
            else
                throw new Error(msg.getMsgText("jsdoMSG001", "assign() or update()"));
        };

        // Alias for assign() method
        this.update = this.assign;

        this.remove = function () {
            if (this._defaultTableRef) {
                return this._defaultTableRef.remove();
            }
            else
                throw new Error(msg.getMsgText("jsdoMSG001", "remove()"));
        };

        this.getId = function () {
            if (this._defaultTableRef)
                return this._defaultTableRef.getId();
            throw new Error(msg.getMsgText("jsdoMSG001", "getId()"));
        };

		// getErrors() - JSDO
		this.getErrors = function () {
            if (this._defaultTableRef)
                return this._defaultTableRef.getErrors();
            throw new Error(msg.getMsgText("jsdoMSG001", "getErrors()"));
		};

        this.getErrorString = function () {
            if (this._defaultTableRef)
                return this._defaultTableRef.getErrorString();
            throw new Error(msg.getMsgText("jsdoMSG001", "getErrorString()"));
        };

        /*
         * Finds a record in the JSDO memory using the specified function to determine the record.
         */
        this.find = function (fn) {
            if (this._defaultTableRef)
                return this._defaultTableRef.find(fn);
            throw new Error(msg.getMsgText("jsdoMSG001", "find()"));
        };

        this.foreach = function (fn) {
            if (this._defaultTableRef)
                return this._defaultTableRef.foreach(fn);
            throw new Error(msg.getMsgText("jsdoMSG001", "foreach()"));
        };

        this.setSortFields = function (sortFields) {
            if (this._defaultTableRef)
                return this._defaultTableRef.setSortFields(sortFields);
            throw new Error(msg.getMsgText("jsdoMSG001", "setSortFields()"));
        };

        this.setSortFn = function (fn) {
            if (this._defaultTableRef)
                return this._defaultTableRef.setSortFn(fn);
            throw new Error(msg.getMsgText("jsdoMSG001", "setSortFn()"));
        };

        this.sort = function (arg1) {
            if (this._defaultTableRef)
                return this._defaultTableRef.sort(arg1);
            throw new Error(msg.getMsgText("jsdoMSG001", "sort()"));
        };

		this._clearErrors = function () {
			this._lastErrors = [];
            for (var buf in this._buffers) {
				this._buffers[buf]._lastErrors = [];
			}
		};

        /*
         * Loads data from the HTTP resource.
         */
        this.fill = function () {
            var objParam,
                promise,
				properties,
				mapping;
                
			this._clearErrors();

            // Process parameters
            if (arguments.length !== 0) {
                // Call to fill() has parameters
                if (typeof(arguments[0]) == 'function') {
                    throw new Error(msg.getMsgText("jsdoMSG024", "JSDO", "fill() or read()"));                
                }
                
                // fill( string);
                var filter;
                if (arguments[0] === null || arguments[0] === undefined) {
                    filter = "";
                }
                else if (typeof(arguments[0]) == "string") {
                    filter = arguments[0];
					objParam = {filter: filter};     
				}
                else if (typeof(arguments[0]) == "object") {
                    // options 
                    // ablFilter, id, top, skip, sort
					
					properties = this.getMethodProperties("read");
					
                    // Use plugin if mappingType is not undefined, null, or ""
					if (properties && properties.mappingType) {
						mapping = progress.data.PluginManager.getPlugin(properties.mappingType);
						if (!mapping) {
							throw new Error(msg.getMsgText("jsdoMSG118", properties.mappingType));		
						}
						if (typeof(mapping.requestMapping) === "function") {
							objParam = mapping.requestMapping(this, arguments[0], { operation: "read" });
						}
						else {
							objParam = arguments[0];
						} 
					}
					else {
                        if (properties.capabilities) {
                            throw new Error(msg.getMsgText("jsdoMSG119"));
                        }
						objParam = arguments[0];						
					}
                }
                else {
                    throw new Error(msg.getMsgText("jsdoMSG025", "JSDO", "fill() or read()"));
                }                  
            }
            else {
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
                    this._resource.generic.read(xhr, this._async);
                    if (xhr.request.deferred) {
                        promise = xhr.request.deferred.promise();
                    }
                }
                else {
                    throw new Error("JSDO: READ operation is not defined.");
                }
            }
            else {                
                // Old approach to call READ
                this._session._openRequest(xhr, 'GET', this.url, this._async);
                try {
                    xhr.send(null);
                }
                catch (e) {
                    request.exception = e;
                    // get the Client Context ID (AppServer ID)
                    xhr.jsdo._session._checkServiceResponse(xhr, request.success, request);
                }
            }

            return promise;
        };

        // Alias for fill() method
        this.read = this.fill;

        /*
         * Clears all data (including any pending changes) for each buffer in JSDO
         */
        this._clearData = function () {
            for (var buf in this._buffers) {
                this._buffers[buf]._clearData();
            }
        };

        /*
         * Executes a CRUD operation using the built-in API.
         */
        this._execGenericOperation = function (operation, objParam, request, 
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
                }
                else {
                    // "JSDO: {1} operation is not defined."
                    throw new Error(msg.getMsgText("jsdoMSG046", operationStr.toUpperCase() ));
                }
            }
        };
        
        // Determines if any fields need a conversion when data sent to backend
        this._initConvertForServer = function () {
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
                        this._buffers[buf]._convertFieldsForServer.push({name: schema[i].name, 
                                                                         ablType: schema[i].ablType});
                    }
                }
                if (this._buffers[buf]._convertFieldsForServer.length > 0) {
                    this._convertForServer = true;
                    this._buffers[buf]._convertForServer = true;
                }
            } 
        };
        
        this._convertRequestData = function (objParam) {
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
        
        this._convertTableData = function (tableRef, tableData) {
            var i;
            
            for (i = 0; i < tableData.length; i++) {
                this._convertRowData(tableRef, tableData[i]);
            }
        };
         
        this._convertRowData = function (tableRef, record) {    
            var i,
                field;
            
            for (i = 0; i < tableRef._convertFieldsForServer.length; i += 1) {
                field = tableRef._convertFieldsForServer[i];
                record[field.name] = this._convertField(record[field.name], field.ablType);
            }
        };
        
        this._convertField = function (value, ablType) {
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
                        }
                        else if (value instanceof Date) {
                            result = this._convertDate(value, ablType.toUpperCase());
                        }
                        else {
                            throw new Error("Unexpected value for  " + ablType.toUpperCase() + ".");
                        }
                        break;
                    default:
                        result = value;
                        break;
                }
            }
            catch (e) {
                throw new Error(msg.getMsgText("jsdoMSG000", 
                    "Error in _convertField for value: " + value + ". " + e.message));
            }
            
            return result;
        };
        
        // Convert Date object to string for DATE and DATETIME ablTypes
        // Not necessary to do for DATETIME-TZ since JSON.stringify() will do correct conversion 
        this._convertDate = function (value, ablType) {
            var result = value;
            
            // DATE format should be in ISO 8601 format yyyy-mm-dd
            // DATETIME format should be in ISO 8601 format yyyy-mm-ddThh:mm:ss.sss
            if (ablType === "DATE" || ablType === "DATETIME") { 
                result =  progress.util._pad(value.getFullYear(), 4) + '-' + 
                          progress.util._pad(value.getMonth() + 1) + '-' + 
                          progress.util._pad(value.getDate());
                    
                if (ablType === "DATETIME") {
                    result =  result + "T" + 
                         progress.util._pad(value.getHours()) + ":" + 
                         progress.util._pad(value.getMinutes()) + ":" + 
                         progress.util._pad(value.getSeconds()) + "." + 
                         progress.util._pad(value.getMilliseconds(), 3);
                }              
            }
            
             return result;
        };
        
        
        this._ablTypeNeedsConversion = function (ablType) {
            
            var needsConversion = false;
            
            switch (ablType.toUpperCase()) {
                case "DATE":
                case "DATETIME":
                    needsConversion =  true;
                    break;
            }
            
            return needsConversion;     
        };

           

        this._undefWorkingRecord = function () {
            // Set record property
            for (var buf in this._buffers) {
                this._buffers[buf]._setRecord(null);
            }
        };

        /*
         * Saves changes in the JSDO. Save any outstanding changes for CREATES, UPDATE, and DELETEs
         */
        this.saveChanges = function (useSubmit) {
            var promise,
                request;

            if (useSubmit === undefined) {
                useSubmit = false;
            }
            else if (typeof(useSubmit) != 'boolean') {
                throw new Error(msg.getMsgText("jsdoMSG025", "JSDO", "saveChanges()"));
            }
            
            // _fireCUDTriggersForSubmit() needs to know how saveChanges() was called
            this._useSubmit = useSubmit; 

            // confirm the availability of the operations required for executing this saveChanges call
            // (_checkThatJSDOHasRequiredOperations() throws an error if there's a missing operation,
            // which this method deliberately allows to bubble up to the caller)
            this._checkThatJSDOHasRequiredOperations(); 
            
            // Don't allow Submit with just a temp-table if autoApplyChanges is true
            if ( !this._dataSetName && this._useSubmit && this.autoApplyChanges) {
                  /* error message: "autoApplyChanges is not supported for submit with a temp-table */
                  /* Use jsdo.autoApplyChanges = false." */
                  throw new Error(msg.getMsgText("jsdoMSG124")); 
            }
            
            // Check if any data being sent to server needs to first be converted
            this._initConvertForServer();
            
            // Clear errors before sending request
			this._clearErrors();

            request = {
                jsdo: this
            };

            this.trigger("beforeSaveChanges", this, request);

            if (useSubmit) {
                /* Pass in request object. 
                 * Need to use same request object so before and after saveChanges events 
                 * are in sync in JSDO Submit Service. */
                promise = this._syncDataSetForSubmit(request);
            }
            else if (this._dataSetName) {
                promise = this._syncDataSetForCUD();
            }
            else {
                promise = this._syncSingleTable();
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
        this._checkThatJSDOHasRequiredOperations = function( ) {
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
                }
                else {
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
                    this._confirmOperationExists( progress.data.JSDO._OP_DELETE );
                    checkedDelete = true;
                }
                
                if (!checkedCreate && tableRef._added.length > 0) {
                    this._confirmOperationExists( progress.data.JSDO._OP_CREATE );
                    checkedCreate = true;
                }

                if (!checkedUpdate && Object.keys(tableRef._changed).length > 0) {
                    this._confirmOperationExists( progress.data.JSDO._OP_UPDATE );  
                    checkedUpdate = true;
                }
                
                if ( checkedDelete && checkedCreate && checkedUpdate ) {
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
                throw new Error(msg.getMsgText("jsdoMSG046", operationStr.toUpperCase() ));
            }
        };
        
        this.invoke = function (name, object) {
            var request = this[name](object);
            if (request.deferred) {
                return request.deferred.promise();
            }
            
            return undefined;
        };

        /*
         * Synchronizes changes for a TableRef
         *
         * @param operation		HTTP operation to be performed
         * @param tableRef		Handle to the TableRef
         * @param batch         Optional. batch information associated with the sync operation. 
         *                      If not specified a new one will be created.  Used for saving datasets.
         */
        this._syncTableRef = function (operation, tableRef, batch) {
            var rowData,
                requestData,
                jsonObject;
            
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
                            if (this._useBeforeImage("create")) {
                                jsonObject[this._dataSetName] = {};
                                var dataSetObject = jsonObject[this._dataSetName];
                                dataSetObject["prods:hasChanges"] = true;

                                dataSetObject[tableRef._name] = [];
                                
                                // Dont need to send prods:id for create, 
                                // no before table or error table to match
                                // Dont need to send prods:clientId - since only sending one record
                                rowData["prods:rowState"] = "created";
                                rowData["prods:clientId"] = jsrecord.data._id;

                                delete rowData["_id"];

                                dataSetObject[tableRef._name].push(rowData);
                            }
                            else {
                                jsonObject[tableRef._name] = [];
                                jsonObject[tableRef._name].push(rowData);
                            }
                        }
                        else {
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
                                var dataSetObject = jsonObject[this._dataSetName];
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
                            if (this._resource.service
                                && this._resource.service.settings
                                && this._resource.service.settings.sendOnlyChanges) {
                                tableRef._jsdo._copyRecord(tableRef, jsrecord.data, requestData, 
                                    tableRef._beforeImage[jsrecord.data._id]);

                                if (this._resource.idProperty) {
                                    requestData[this._resource.idProperty] = 
                                        jsrecord.data[this._resource.idProperty];
                                }
                                else {
                                    throw new Error(msg.getMsgText("jsdoMSG110", this._resource.name, 
                                        " for sendOnlyChanges property"));
                                }
                            }
                            else
                                requestData = rowData;

                            if (this.isDataSet()) {
                                jsonObject[tableRef._name] = [];
                                jsonObject[tableRef._name].push(requestData);
                            }
                            else {
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
                            var dataSetObject = jsonObject[this._dataSetName];
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
                        if (this._resource.service
                            && this._resource.service.settings
                            && this._resource.service.settings.sendOnlyChanges) {
                            if (this._resource.idProperty) {
                                requestData[this._resource.idProperty] = 
                                    jsrecord.data[this._resource.idProperty];
                            }
                            else {
                                throw new Error(msg.getMsgText("jsdoMSG110", this._resource.name, 
                                    " for sendOnlyChanges property"));
                            }
                        }
                        else {
                            requestData = rowData;
                        }

                        if (this.isDataSet()) {
                            jsonObject[tableRef._name] = [];
                            jsonObject[tableRef._name].push(requestData);
                        }
                        else {
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
        this._useBeforeImage = function (opType) {

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
        this._syncDataSetForCUD = function () {
            var batch = {
                    operations: []
                },
                deferred,
                promise;
            
            if (typeof($) == 'function' && typeof($.Deferred) == 'function') {
                deferred = $.Deferred();
                promise = deferred.promise();
                batch.deferred = deferred;
            }            
            
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
            if (!this._async) {
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
                        
                    this._fireAfterSaveChanges(success, request);
                }
            }
            // end OE00229270

            return promise;
        };


        /*
         * Synchronizes changes for a single table
         */
        this._syncSingleTable = function () {
            var deferred, promise;
            if (!this._defaultTableRef) return;
            var tableRef = this._defaultTableRef;

            var batch = {
                operations: []
            };
            
            if (typeof($) == 'function' && typeof($.Deferred) == 'function') {
                deferred = $.Deferred();
                promise = deferred.promise();
                batch.deferred = deferred;
            }                

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
                if (this._resource.service
                    && this._resource.service.settings
                    && this._resource.service.settings.sendOnlyChanges) {
                    if (this._resource.idProperty) {
                        requestData[this._resource.idProperty] = jsrecord.data[this._resource.idProperty];
                    }
                    else {
                        throw new Error(msg.getMsgText("jsdoMSG110", this._resource.name, 
                            " for sendOnlyChanges property"));
                    }
                }
                else {
                    // We must copy record in case _convertRowData() needs to make conversion
                    tableRef._jsdo._copyRecord(tableRef, jsrecord.data, requestData);
                }
                
                if (tableRef._convertForServer) {
                    this._convertRowData(tableRef, requestData);
                } 

                if (this._resource) {
                    if (typeof(this._resource.generic["delete"]) == "function") {
                        xhr.objParam = requestData;
                        this._resource.generic["delete"](xhr, this._async);
                    }
                    else {
                        throw new Error("JSDO: DELETE operation is not defined.");
                    }
                }
                else {
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
                        
                        this._resource.generic.create(xhr, this._async);
                    }
                    else {
                        throw new Error("JSDO: CREATE operation is not defined.");
                    }
                    
                }
                else {
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
                if (this._resource.service
                    && this._resource.service.settings
                    && this._resource.service.settings.sendOnlyChanges) {
                        
                    tableRef._jsdo._copyRecord(tableRef, jsrecord.data, requestData, 
                        tableRef._beforeImage[jsrecord.data._id]);

                    if (this._resource.idProperty) {
                        requestData[this._resource.idProperty] = jsrecord.data[this._resource.idProperty];
                    }
                    else {
                        throw new Error(msg.getMsgText("jsdoMSG110", this._resource.name, 
                            " for sendOnlyChanges property"));
                    }
                }
                else {
                    // We must copy record in case _convertRowData() needs to make conversion
                    tableRef._jsdo._copyRecord(tableRef, jsrecord.data, requestData);
                }
                
                if (tableRef._convertForServer) {
                    this._convertRowData(tableRef, requestData);
                }

                if (this._resource) {
                    if (typeof(this._resource.generic.update) == "function") {
                        xhr.objParam = requestData;
                        this._resource.generic.update(xhr, this._async);
                    }
                    else {
                        throw new Error("JSDO: UPDATE operation is not defined.");
                    }
                }
                else {
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
                tableRef._beforeImage = {};
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
        this._syncDataSetForSubmit = function (request) {
            var deferred,
                promise,
                jsonObject,
                completeFn = this._saveChangesComplete,
                successFn = this._saveChangesSuccess,
                errorFn =  this._saveChangesError;                
            
            if (typeof($) == 'function' && typeof($.Deferred) == 'function') {
                deferred = $.Deferred();
                promise = deferred.promise();
                request.deferred = deferred;
            }                        
            
            request.jsrecords = [];            

            // First thing to do is to create jsonObject with before and after image data for all 
            // records in change-set (creates, updates and deletes)
            if ( this._dataSetName ) {
                jsonObject = this._createChangeSet(this._dataSetName, false, request);
            }
            else {
                // just a temp-table. Need to create it somewhat differently from DS 
                // (no before and after image data)
                jsonObject = this._createTTChangeSet(this._defaultTableRef, request);                
                successFn = this._saveChangesSuccessTT;  // will process success response differently from DS
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
        this._createChangeSet = function (dataSetName, alwaysCreateTable, request) {
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
        this._createTTChangeSet = function (tableRef, request) {
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
                        if ( !tableRef._processed[jsrecord.data._id] ) {
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
                            if ( !tableRef._processed[jsrecord.data._id] ) {
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

        this._addRowToTTChangeSet = function (tableRef, jsrecord, tempTableJsonObject, request, event) {
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
        this._createDataAndChangeSet = function (dataSetName) {
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
        this._addRecordsToObject = function (tableRef, dataSetJsonObject) {

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
                }
                else {
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
        this._doesRecordHaveCreateBIData = function (tableRef, id) {
            for (var i = 0; i < tableRef._added.length; i++) {
                if (tableRef._added[i] === id)
                    return true;
            }

            return false;
        };

        // Check if specified after record has bi data for updated record.
        // Returns True if after record has corresponding bi data, else false
        this._doesRecordHaveUpdateBIData = function (tableRef, id) {
            for (var changedId in tableRef._changed) {
                if (changedId === id)
                    return true;
            }

            return false;
        };


        // If a create, remove or update exists, method returns true, else returns false
        this._hasChanges = function () {
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
        this._addDeletesToChangeSet = function (tableRef, dataSetJsonObject, request) {
            // There is no after table for deletes, so just create before-table data
            for (var i = 0; i < tableRef._deleted.length; i++) {
                var jsrecord = tableRef._deleted[i];

                if (!jsrecord) continue;

                if (jsrecord.data
                    && jsrecord.data._id !== undefined
                    && tableRef._beforeImage[jsrecord.data._id] === null) {
                    // Deleted record is for a new record - do not send deleted record to server
                    continue;
                }

                this._addDeletedRowToChangeSet(tableRef, jsrecord, dataSetJsonObject, request);
            }
        };

        this._addDeletedRowToChangeSet = function (tableRef, jsrecord, dataSetJsonObject, request) {
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
        this._addCreatesToChangeSet = function (tableRef, dataSetJsonObject, request) {
            // There is no before table for creates, so just create after-table data
            for (var i = 0; i < tableRef._added.length; i++) {
                var id = tableRef._added[i];
                var jsrecord = tableRef._findById(id, false);
                if (!jsrecord) continue;
                if (tableRef._processed[jsrecord.data._id]) continue;

                this._addCreatedRowToChangeSet(tableRef, jsrecord, dataSetJsonObject, request);
            }
        };

        this._addCreatedRowToChangeSet = function (tableRef, jsrecord, dataSetJsonObject, request) {
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
        this._addChangesToChangeSet = function (tableRef, dataSetJsonObject, request) {
            // For Changes, there is both before and after table data
            for (var id in tableRef._changed) {
                var jsrecord = tableRef._findById(id, false);
                if (!jsrecord) continue;
                if (tableRef._processed[jsrecord.data._id]) continue;

                this._addChangedRowToChangeSet(tableRef, jsrecord, dataSetJsonObject, request);
            }
        };

        this._addChangedRowToChangeSet = function (tableRef, jsrecord, dataSetJsonObject, request) {
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
        this._getTableInBeforeJsonObject = function (dataSetJsonObject, tableName) {
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
        this.addRecords = function (jsonObject, addMode, keyFields, trackChanges, isInvoke) {
            if (this.isDataSet()) {
                if (jsonObject instanceof Array) {
                    if (!this._defaultTableRef) {
                        throw new Error(msg.getMsgText("jsdoMSG998"));
                    }
                }
                else {
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
            }
            else if (this._defaultTableRef) {
                this._addRecords(this._defaultTableRef._name, jsonObject, addMode, keyFields, 
                    trackChanges, isInvoke);
            }
        };

        /*
         * Copies the fields of the source record to the target record.
         * Preserves the _id of the target record.
         */
        this._copyRecord = function (tableRef, source, target, onlyChangesRecord) {
            for (var field in source) {

                if (onlyChangesRecord !== undefined) {
                    if (source[field] == onlyChangesRecord[field])
                        continue;
                }

                // Fix for PSC00277769
                if (source[field] === undefined || source[field] === null) {
                    target[field] = source[field];
                }
                else if (source[field] instanceof Date) {
                    target[field] = source[field];
                }                    
                else if (typeof source[field] === 'object') {
                    var newObject = source[field] instanceof Array ? [] : {};
                    this._copyRecord(tableRef, source[field], newObject);
                    target[field] = newObject;
                }
                else
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
        this._deleteProdsProperties = function (record, clearErrorString, deleteRowState) {

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

                if (deleteRowState) {
                    delete record["prods:rowState"];
                }

                if (clearErrorString) {
                    delete record._errorString;
                }
            }
        };

        this._addRecords = function (tableName, jsonObject, addMode, keyFields, trackChanges, isInvoke) {
            var beforeImageJsonObject = null;
            var beforeImageJsonIndex = null;

            if (jsonObject && (this._dataSetName !== undefined)) {
                if (jsonObject[this._dataSetName] &&
                    jsonObject[this._dataSetName]["prods:hasChanges"]) {
                    beforeImageJsonObject = jsonObject;
                    beforeImageJsonIndex = {};
                }
                else if (jsonObject["prods:hasChanges"]) {
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
                    }
                    else {
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
                    }
                    else {
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
                        saveJsonObject = jsonObject;
                        jsonObject = data;
                    }
                    else if ((addMode == progress.data.JSDO.MODE_EMPTY)
                        && (typeof  (jsonObject) == 'object')
                        && (Object.keys(jsonObject).length === 0)) {
                        jsonObject = []; // Allow empty object in addRecords with
                        // MODE_EMPTY
                    }
                    // Allow empty object when called by restoreChangesOnlyForTable()
                    // where there are only deletes - in bi data
                    else if ((addMode == progress.data.JSDO.MODE_REPLACE)
                        && (typeof  (jsonObject) == 'object')
                        && (beforeImageJsonObject)) {
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
                    }
                    else {
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

                        }
                        else
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
                            }
                            else {
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
                                if (isInvoke 
                                    && (this._resource.idProperty !== undefined) 
                                    && (jsonObject[i]._id === undefined)) {
                                    // Add _id to jsonObject
                                    jsonObject[i]._id = record._id;
                                }

                                // If beforeRecord is null, there is entry in _beforeImage for a create.
                                // If beforeRecord is undefined, there is no entry
                                var beforeRecord = this._buffers[tableName]._beforeImage[record._id];
                                if (checkBeforeImage 
                                    && (jsonObject[i]["prods:id"] !== undefined) 
                                    && (typeof beforeRecord !== 'undefined')) {
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
                            }
                            else {
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
                }
                finally {
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
        this._getBeforeRecordFromObject = function (afterRecord, jsonObject, tablename) {
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

        this._sameData = function (record1, record2) {
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
        this._mergeRead = function (jsonObject, xhr) {
            if (this.isDataSet()) {
                if (this._dataProperty) {
                    var datasetBuffer = this._buffers[this._dataProperty];
                    datasetBuffer._data = jsonObject[this._dataSetName][this._dataProperty];
                    if (datasetBuffer.autoSort) {
                        datasetBuffer._sort();
                    }
                    datasetBuffer._createIndex();
                }
                else {
                    // Load data from JSON object into _data
                    for (var buf in this._buffers) {
                        var data;
                        if (jsonObject[this._dataSetName])
                            data = jsonObject[this._dataSetName][buf];
                        else
                            data = null;
                        data = data ? data : [];
                        this._buffers[buf]._data = data;
                        if (this._buffers[buf].autoSort) {
                            this._buffers[buf]._sort();
                        }
                        this._buffers[buf]._createIndex();
                        if (jsonObject[this._dataSetName] 
                            && jsonObject[this._dataSetName]["prods:hasChanges"]) {
                            this._buffers[buf]._loadBeforeImageData(jsonObject);
                        }
                    }
                    // Load nested data into _data
                    if (this._numBuffers > 1) {
                        for (var buf in this._buffers) {
                            if (this._buffers[buf]._isNested
                                && this._buffers[buf]._parent
                                && this._buffers[this._buffers[buf]._parent]) {
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
            }
            else {
                if (jsonObject instanceof Array) {
                    this._defaultTableRef._data = jsonObject;
                }
                else {
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
        this._mergeUpdateRecord = function (tableRef, recordId, record) {
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
                    delete tableRef._index[recordId];
                    id += "";
                    tableRef._index[id] = new progress.data.JSIndexEntry(index);
                    record._id = id;
                }
            }

            return record;
        };


        /**
         *update existing record data with specified error string
         */
        this._setErrorString = function (tableRef, recordId, errorString, setInBeforeTable) {

            if (setInBeforeTable) {
                // Ensure that object exists, it's null for deleted rows
                if (tableRef._beforeImage[recordId]) {
                    tableRef._beforeImage[recordId]._errorString = errorString;
                }
            }
            else {
                var index = tableRef._index[recordId].index;
                tableRef._data[index]._errorString = errorString;
            }
        };

        /*
         * Returns the array with the data from the specified dataObject. 
         */
        this._arrayFromDataObject = function (dataObject, tableRef) {
            var data;

            if (dataObject === undefined) return undefined;
            if (this._dataSetName) {
                if (dataObject[this._dataSetName])
                    data = dataObject[this._dataSetName][tableRef._name];
            }
            else {
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
        this._mergeUpdateForCUD = function (jsonObject, xhr) {
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

        this._checkForDeleteError = function (dataSetJsonObject, xhr) {
            var hasError = false;
            var tableRef = xhr.request.jsrecord._tableRef;

            beforeJsonObject = dataSetJsonObject["prods:before"];

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
        this._mergeUpdateForSubmit = function (jsonObject, xhr) {
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
                        if (errorString)
                            this._setErrorString(tableRef, recordId, errorString, false);

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

                    if (beforeTableJsonObject instanceof Array) {
                        for (var i = 0; i < beforeTableJsonObject.length; i++) {

                            if (beforeTableJsonObject[i]["prods:rowState"] == "deleted") {
                                var recordId = beforeTableJsonObject[i]["prods:clientId"];
                                if (!recordId) {
                                    throw new Error(msg.getMsgText("jsdoMSG035", "_mergeUpdateForSubmit()"));
                                }

                                // If row was returned with error string, just copy that over to jsdo record
                                if (beforeTableJsonObject[i]["prods:hasErrors"]) {
                                    var prods_id = beforeTableJsonObject[i]["prods:id"];
                                    var errorString = this._getErrorStringFromJsonObject(dataSetJsonObject, 
                                        tableRef, prods_id);
                                    this._setErrorString(tableRef, recordId, errorString, true);
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
        this._fireCUDTriggersForSubmit = function (request) {
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
        this._getErrorStringFromJsonObject = function (dataSetJsonObject, tableRef, prods_id) {
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

        this._fillSuccess = function (jsdo, success, request) {
            var xhr = request.xhr,
                properties;     
            
            // Need to check if responseMapping was specified; developer can specify
            // plug-in to manipulate response 
            properties = jsdo.getMethodProperties("read");
            
            if (properties && properties.mappingType) {
                mapping = progress.data.PluginManager.getPlugin(properties.mappingType);
                if (!mapping) {
                    throw new Error(progress.data._getMsgText("jsdoMSG118", properties.mappingType));
                }
                                
                if (typeof (mapping.responseMapping) === "function") {
                    request.response = mapping.responseMapping(jsdo, request.response, { operation: "read" });
                }                
            } 

            jsdo._clearData();
            jsdo._mergeRead(request.response, xhr);   

            // Set working record
            for (var buf in jsdo._buffers) {
                if (!jsdo._buffers[buf]._parent || !jsdo.useRelationships) {
                    jsdo._buffers[buf]._setRecord(jsdo._buffers[buf]._findFirst());
                }
            }
        };

        this._fillComplete = function (jsdo, success, request) {
            jsdo.trigger("afterFill", jsdo, request.success, request);
            if (request.deferred) {
                if (success) {
                    request.deferred.resolve(jsdo, success, request);
                }
                else {
                    request.deferred.reject(jsdo, success, request);              
                }
            }
        };

        this._fillError = function (jsdo, success, request) {
            jsdo._clearData();            
            jsdo._updateLastErrors(jsdo, null, null, request);
        };

        this._undoCreate = function (tableRef, id) {
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

        this._undoUpdate = function (tableRef, id, deleteProdsProps) {
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

        this._undoDelete = function (tableRef, id, deleteProdsProps) {
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
                }
                else {
                    tableRef._data.push(record);
                    index = tableRef._data.length - 1;
                }
                tableRef._index[id] = new progress.data.JSIndexEntry(index);
            }
            delete tableRef._beforeImage[id];
            // End - Restore before image		
        };

        this._deleteComplete = function (jsdo, success, request) {
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

        this._deleteSuccess = function (jsdo, success, request) {
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
            }
            else {
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
                }
                else {
                    jsdo._deleteError(jsdo, success, request);
                }
            }
        };

        this._deleteError = function (jsdo, success, request) {
            if (jsdo.autoApplyChanges) {
                jsdo._undoDelete(request.jsrecord._tableRef, request.jsrecord.data._id);
            }
        };

        this._createComplete = function (jsdo, success, request) {
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

        this._createSuccess = function (jsdo, success, request) {
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
                }
                else {
                    jsdo._createError(jsdo, success, request);
                }
            }
        };

        this._createError = function (jsdo, success, request) {
            if (jsdo.autoApplyChanges) {
                jsdo._undoCreate(request.jsrecord._tableRef, request.jsrecord.data._id);
            }
        };


        this._updateComplete = function (jsdo, success, request) {
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

        this._updateSuccess = function (jsdo, success, request) {
            var xhr = request.xhr;
            var hasError = jsdo._mergeUpdateForCUD(request.response, xhr);

            if (hasError)
                request.success = false;

            if (jsdo.autoApplyChanges) {
                if (!hasError) {
                    request.success = true;
                    // Clear before image
                    delete request.jsrecord._tableRef._beforeImage[request.jsrecord.data._id];
                    // End - Clear before image		
                }
                else {
                    jsdo._updateError(jsdo, success, request);
                }
            }
        };

        this._updateError = function (jsdo, success, request) {

            if (jsdo.autoApplyChanges) {
                request.success = false;
                jsdo._undoUpdate(request.jsrecord._tableRef, request.jsrecord.data._id);
            }
        };


        this._saveChangesSuccess = function (jsdo, success, request) {
            var records = request.response;
            jsdo._mergeUpdateForSubmit(records, request.xhr);

            // Ensure that that the _lastErrors variable has been cleared 
			jsdo._clearErrors();
            var changes = jsdo.getChanges();
            jsdo._updateLastErrors(jsdo, null, changes);

            if (jsdo.autoApplyChanges) {
                jsdo._applyChanges();
            }
        };


        this._saveChangesError = function (jsdo, success, request) {
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
         */         
        this._saveChangesSuccessTT = function (jsdo, success, request) {
            var changes;

            // Ensure that that the _lastErrors variable has been cleared 
            jsdo._clearErrors();
            changes = jsdo.getChanges();
            jsdo._updateLastErrors(jsdo, null, changes);
        };

        this._saveChangesComplete = function (jsdo, success, request) {
            // Success with errors
            if ((request.xhr.status >= 200 && request.xhr.status < 300) && jsdo._lastErrors.length > 0) {
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

        this._fireAfterSaveChanges = function (success, request) {
            this.trigger("afterSaveChanges", this, success, request);
            
            if (request.jsrecords) {
                if (request.deferred) {
                    if (success) {
                        request.deferred.resolve(this, success, request);
                    }
                    else {
                        request.deferred.reject(this, success, request);                    
                    }             
                }
            }
            else if (request.batch && request.batch.deferred) {
                if (success) {
                    request.batch.deferred.resolve(this, success, request);
                }
                else {
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
            }
            else if (request.batch && request.batch.operations) {
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
                        responseObject = JSON.parse(request.xhr.responseText);
                        
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
                                retValString =  errorObject._retVal;
                            } else {
                                retValString = null;
                            }
                            if (errorObject._errors instanceof Array) {
                                for (j = 0; j < errorObject._errors.length; j += 1) {                                    
                                    if ((errorObject._errors[j]._errorNum === 0) 
                                        && (errorObject._errors[j]._errorMsg === retValString)) {
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
                    }
                    catch (e) {
                        // Ignore exceptions
                    }
                }
                if (request.exception) {
                    errors.push({
                        type: progress.data.JSDO.ERROR,
                        error: request.exception
                    });
                }
                if (errors.length === 0 
                    && request.xhr 
                    && (request.xhr.status >= 400 && request.xhr.status < 600)) {
                    errors.push({
                        type: progress.data.JSDO.ERROR,
                        error: "Error: HTTP Status " + request.xhr.status + " " + request.xhr.statusText,
                        responseText: request.xhr.responseText
                    });
                }                
            }
            return errors;
        };
        
        this._updateLastErrors = function (jsdo, batch, changes, request) {
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
                        if (request.xhr.status  >= 200 && request.xhr.status < 300) {
                            // Add error string to jsdo._lastErrors
                            jsdo._lastErrors.push({errorString: request.jsrecord.data._errorString});
                            // Add error object to jsdo.<table-ref>._lastErrors
                            jsdo._buffers[request.jsrecord._tableRef._name]._lastErrors.push({
                                    type: progress.data.JSDO.DATA_ERROR,
                                    id: request.jsrecord.data._id,
                                    error: request.jsrecord.data._errorString});
                        }                        
                        else {
                            errors = this._getErrorsFromRequest(request);
                            errorText = "";
                            for (j = 0; j < errors.length; j += 1) {
                                if (errors.length > 1 && errors[j].error.indexOf("(7243)") != -1) {
                                    // If there are more error messages
                                    //      supress error "The Server application has returned an error. (7243)"
                                    continue;
                                }
                                // Add error to table reference
                                if (request.jsrecord 
                                    && (errors[j].type === progress.data.JSDO.APP_ERROR
                                       || errors[j].type === progress.data.JSDO.RETVAL)) {
                                    errors[j].id = request.jsrecord.data._id;
                                    request.jsrecord._tableRef._lastErrors.push(errors[j]);
                                }
                                if (errorText.length === 0) {
                                    errorText = errors[j].error;
                                }
                                else {
                                    errorText += "\n" + errors[j].error;
                                }
                            }
                            // Add error string to jsdo._lastErrors                            
                            jsdo._lastErrors.push({errorString: errorText});                            
                        }
                    }
                }
            }
            else if (changes instanceof Array) {
                for (i = 0; i < changes.length; i++) {
                    if (changes[i].record && changes[i].record.data._errorString !== undefined) {
                        jsdo._lastErrors.push({errorString: changes[i].record.data._errorString});
                        jsdo._buffers[changes[i].record._tableRef._name]._lastErrors.push({
                                type: progress.data.JSDO.DATA_ERROR,                            
                                id: changes[i].record.data._id,
                                error: changes[i].record.data._errorString});
                    }
                }
            }
            else if (request 
                     && !request.success 
                     && request.xhr 
                     && (request.xhr.status >= 400 && request.xhr.status < 600)) {
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
                    }
                    else {
                        errorText += "\n" + errors[j].error;
                    }
                }
                jsdo._lastErrors.push({errorString: errorText});
            }
        };

        // Check if all the xhr operations associated with the batch for which
        // this xhr object is related have completed (not necessarily to success).
        // If all XHR operations have completed this fires 'afterSaveChanges' event
        this._checkSaveComplete = function (xhr) {
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
                        jsdo._fireAfterSaveChanges(success, request);
                    }
                }
            }
        };


        /*
         * determine if a batch of XHR requests has completed in which all requests are successful
         */
        this._isBatchSuccess = function (batch) {
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
        this._isBatchComplete = function (batch) {
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

        this._mergeInvoke = function (jsonObject, xhr) {
            var operation;
            if (xhr.request.fnName !== undefined
                && xhr.jsdo._resource.fn[xhr.request.fnName] !== undefined) {
                operation = xhr.jsdo._resource.fn[xhr.request.fnName].operation;
            }
            else
                operation = null;
            if (operation === undefined) {
                // Operation data is only required for invoke operations with mergeMode: true
                operation = null;
                for (var i = 0; i < xhr.jsdo._resource.operations.length; i++) {
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
                    }
                    else if (xhr.jsdo._resource.dataProperty !== undefined) {
                        dataParameterName = xhr.jsdo._resource.dataProperty;
                    }
                    else if (xhr.jsdo._resource._tempTableName !== undefined) {
                        dataParameterName = xhr.jsdo._resource._tempTableName;
                    }
                    else {
                        throw new Error(msg.getMsgText("jsdoMSG111", ""));
                    }

                    var found = false;
                    for (var i = 0; i < operation.params.length; i++) {
                        if (operation.params[i].name == dataParameterName) {
                            if (operation.params[i].type.indexOf('RESPONSE_BODY') != -1) {
                                if ((operation.params[i].xType !== undefined)
                                    && (operation.params[i].xType != 'DATASET')
                                    && (operation.params[i].xType != 'TABLE')
                                    && (operation.params[i].xType != 'ARRAY')) {
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
                }
                catch (e) {
                    xhr.request.success = false;
                    xhr.request.exception = e;
                }
            }
        };

        this.onReadyStateChangeGeneric = function () {
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
                    if ((xhr.status >= 200 && xhr.status < 300) 
                        || (xhr.status === 0 && xhr.responseText !== "")) {
                            
                        request.success = true;
                        // get the Client Context ID (AppServer ID)
                        xhr.jsdo._session._saveClientContextId(xhr); 
                        if ((typeof xhr.onSuccessFn) == 'function') {
                            var operation;
                            if (xhr.request.fnName !== undefined
                                && xhr.jsdo._resource.fn[xhr.request.fnName] !== undefined) {
                                operation = xhr.jsdo._resource.fn[xhr.request.fnName].operation;
                            }
                            else
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
        this.acceptChanges = function () {
            for (var buf in this._buffers) {
                this._buffers[this._buffers[buf]._name].acceptChanges();
            }
        };

        /*
         * Rejects changes for the table references in the JSDO.
         */
        this.rejectChanges = function () {
            for (var buf in this._buffers) {
                this._buffers[this._buffers[buf]._name].rejectChanges();
            }
        };

        /*
         * Returns an array with changes for all table references in the JSDO.
         */
        this.getChanges = function () {
            var result = [];
            for (var buf in this._buffers) {
                var changes = this._buffers[this._buffers[buf]._name].getChanges();
                result = result.concat(changes);
            }
            return result;
        };

        this.hasChanges = function () {
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
        this._applyChanges = function () {
            for (var buf in this._buffers) {
                this._buffers[this._buffers[buf]._name]._applyChanges();
            }
        };

        /*
         * Accepts row changes for the working record using the JSDO reference.
         */
        this.acceptRowChanges = function () {
            if (this._defaultTableRef)
                return this._defaultTableRef.acceptRowChanges();
            throw new Error(msg.getMsgText("jsdoMSG001", "acceptRowChanges()"));
        };

        /*
         * Reject row changes for the working record using the JSDO reference.
         */
        this.rejectRowChanges = function () {
            if (this._defaultTableRef)
                return this._defaultTableRef.rejectRowChanges();
            throw new Error(msg.getMsgText("jsdoMSG001", "rejectRowChanges()"));
        };
        
        /*
         * Sets complete set of properties for the jsdo. All existing properties are replaced with new set
         */
        this.setProperties = function( propertiesObject ) {
           var prop;

            if (arguments.length < 1) {
                // {1}: Incorrect number of arguments in {2} call. There should be {3}.
                throw new Error(progress.data._getMsgText("jsdoMSG122", 'JSDO', 'setProperties', 1)); 
            }
            if (arguments.length > 1) {
                // {1}: Incorrect number of arguments in {2} call. There should be only {3}.";
                throw new Error(progress.data._getMsgText("jsdoMSG122", 'JSDO', 'setProperties', 1)); 
            }
            if ( typeof propertiesObject == "object" ) {
                /* Copy properties of the propertiesObject argument into _properties.
                 * Note that if object passed in has a prototype, this code copies them too)
                 */
                this._properties = {};
                
                for (prop in propertiesObject) {
                    if( propertiesObject.hasOwnProperty(prop) )  {
                        if (typeof propertiesObject[prop] !== "function" ) {
                            this._properties[prop] = propertiesObject[prop];
                        }
                    }
                }
            }
            else if ( (propertiesObject === undefined) || (propertiesObject === null) ) {
                this._properties = {};
            }
            else {
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
        this.setProperty = function( propertyName, propertyValue) {
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

            if ( propertyValue === undefined ) {
                delete this._properties[propertyName]; // OK if it doesn't exist -- no error
            }
            else {
                this._properties[propertyName] = propertyValue;
            }
        };
         
        /* 
         * Gets the set of jsdo properties. Returns an object containing all the properties
         */
        this.getProperties = function( ) {
            if (arguments.length > 0) {
                // {1}: Incorrect number of arguments in {2} call. There should be {3}.";
                throw new Error(progress.data._getMsgText("jsdoMSG122", 'JSDO', 'getProperties', 0)); 
            }
            return this._properties;
        };
        
        /*  Gets the value of an individual property in the jsdo property set
         */
        this.getProperty = function( propertyName) {
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
            }
            else {
                name = null;
                dataMode = arg1;
            }

            if (name === undefined || name === null || name === "") {
                name = "jsdo_" + this._resource.service.name + "_" + this._resource.name;
            }
            if (typeof(dataMode) == 'undefined') {
                dataMode = progress.data.JSDO.ALL_DATA;
            }
            else {
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
            }
            else if (typeof(name) != 'string') {
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
            }
            else {
                name = "jsdo_" + this._resource.service.name + "_" + this._resource.name;
                addMode = arg1;
                keyFields = arg2;
            }

            if (typeof(name) == 'undefined' || name === null || name === "") {
                name = "jsdo_" + this._resource.service.name + "_" + this._resource.name;
            }
            else if (typeof(name) != 'string') {
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
                }
                catch (e) {
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
                }
                else
                    isValid = false; // dataset should be in storage area
            }
            else if (this._dataProperty) {
                // If array, we had to wrap in "fake" dataset, so unwrap it
                storageObject = storageObject["_localStorage"];
                if (storageObject === undefined || storageObject[this._dataProperty] === undefined)
                    isValid = false;
            }
            else {
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
            }
            else if (typeof(name) != 'string') {
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
        this._prepareDataObjectForLocalStorage = function (option) {

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
        this._restoreFromLocalStorage = function (storageObject, addMode, keyFields) {

            if (storageObject && (Object.keys(storageObject).length > 0)) {
                if (this._dataSetName) {
                    // Walk thru all tables to retrieve data
                    for (var buf in this._buffers)
                        this._restoreDataForTable(this._buffers[buf], storageObject, addMode, keyFields);
                }
                // Either temp-table or array
                else
                    this._restoreDataForTable(this._defaultTableRef, storageObject, addMode, keyFields);
            }
            else if (addMode === progress.data.JSDO.MODE_EMPTY)
                this._clearData();
        };


        this._restoreDataForTable = function (tableRef, jsonObject, addMode, keyFields) {

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
            }	
            else {
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
    progress.data.JSDO.prototype.toString = function (radix) {
        return "JSDO";
    };

// setup inheritance for table reference
    progress.data.JSTableRef.prototype = new progress.util.Observable();
    progress.data.JSTableRef.prototype.constructor = progress.data.JSTableRef;
    progress.data.JSTableRef.prototype.toString = function (radix) {
        return "JSTableRef";
    };

	// Built-in Plugins
	progress.data.PluginManager.addPlugin("JFP", {
		requestMapping: function(jsdo, params, info) {
			var sortFields,
			field,
            filter,
			ablFilter,
            sqlQuery,
            methodProperties,
            capabilities,
            index,
            option,
            capabilitiesObject,
            reqCapabilities = {
                filter: { options: [ "ablFilter", "sqlQuery" ], mapping: undefined },
                top:    { options: [ "top" ], mapping: undefined },
                skip:   { options: [ "skip" ], mapping: undefined },
                id:     { options: [ "id" ], mapping: undefined },
                sort:   { options: [ "orderBy" ], mapping: undefined }
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
                
				if (params.sort) {
					sortFields = "";
					for (index = 0; index < params.sort.length; index += 1) {
						field = params.sort[index].field;
						if (params.sort[index].dir == "desc") {
							field += " DESC";
						}
						sortFields += field;
						if (index < params.sort.length - 1) {
							sortFields += ",";
						}
					}                                                                             
				}
				
				if (params.filter) {
                    // If filter is specified as string, then no conversion is necessary
                    if (typeof params.filter === 'string') {
                        doConversion = false;
                    }
                    
					if (jsdo._defaultTableRef && params.tableRef === undefined) {
						params.tableRef = jsdo._defaultTableRef._name;
					}
                    
                    if (doConversion && (params.tableRef === undefined)) {
                        throw new Error(msg.getMsgText("jsdoMSG045", "fill() or read()", "params", 
                                                       "tableRef"));
					}  
                       
                    if (reqCapabilities["filter"].mapping === "ablFilter") {
                        if (doConversion) {
                            ablFilter = progress.util._convertToABLWhereString(
                                        jsdo._buffers[params.tableRef], params.filter);
                        }
                        else {
                            ablFilter = params.filter;
                        }
                    }
                    else if (reqCapabilities["filter"].mapping === "sqlQuery") {
                        if (doConversion) {
                            sqlQuery = progress.util._convertToSQLQueryString(
                                        jsdo._buffers[params.tableRef], params.filter, true);
                        }
                        else {
                            sqlQuery = params.filter;
                        }
                    }
				}
                
				filter = JSON.stringify({
					ablFilter: ablFilter,
                    sqlQuery: sqlQuery,
					orderBy: sortFields,
					skip: params.skip,
					top: params.top
					});				
				
				params = {filter: filter};
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

        this.addItem = function (format) {
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

        this.clearItems = function () {
            if (this._listview) {
                this._listviewContent = '';
                var listviewElement = document.getElementById(this._listview.name);
                if (listviewElement) {
                    listviewElement.innerHTML = '';
                }
            }
        };

        this._getFormFieldValue = function (fieldName, detailPageName) {
            var value = null;

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
            }
            else {
                field = document.getElementById(fieldName);
                if (field) {
                    value = field.value;
                }
            }

            return value;
        };

        this._setFormField = function (fieldName, value, detailPageName) {
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
            }
            else {
                field = document.getElementById(fieldName);
                if (field) {
                    field.value = value;
                }
            }
        };

        /*
         * Assigns field values from the form.
         */
        this.assign = function (detailPageName) {
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

        this.display = function (pageName) {
            if (!this._tableRef.record)
                throw new Error(msg.getMsgText("jsdoMSG002", this._tableRef._name));

            // Display record to form
            var schema = this._tableRef.getSchema();
            for (var i = 0; i < schema.length; i++) {
                this._setFormField(schema[i].name, this._tableRef.record.data[schema[i].name], pageName);
            }
            this._setFormField('_id', this._tableRef.record.data._id, pageName);
        };

        this.showListView = function () {
            if (!this._listview) return;

            var uiTableRef = this;
            var listviewElement;
            if (typeof($) == 'function') {
                listviewElement = $("#" + this._listview.name);
                if (listviewElement && listviewElement.length == 1) {
                    listviewElement.html(this._listviewContent ? this._listviewContent : '');
                    try {
                        if (listviewElement.attr("data-filter") === "true"
                            && typeof listviewElement.filterable === "function") {
                            listviewElement.filterable("refresh");
                        }
                        else {
                            listviewElement.listview("refresh");
                        }
                    }
                    catch (e) {
                        // Workaround for issue with JQuery Mobile throwning exception on refresh
                    }
                }

                if (this._listview.autoLink) {
                    // Add trigger for 'tap' event to items
                    $("#" + this._listview.name + " li").each(
                        function (/* index */) {
                            $(this).bind('click',
                                function (/* event, ui */) {
                                    var jsrecord = uiTableRef.getListViewRecord(this);
                                    uiTableRef.display();
                                    if (typeof(uiTableRef._listview.onSelect) == 'function') {
                                        uiTableRef._listview.onSelect(event, this, jsrecord);
                                    }
                                });
                        });
                }
            }
            else {
                listviewElement = document.getElementById(this._listview.name);
                if (listviewElement) {
                    listviewElement.innerHTML = this._listviewContent;
                }

                if (this._listview.autoLink) {
                    var element = document.getElementById(this._listview.name);
                    if (element && element.childElementCount > 0) {
                        for (var i = 0; i < element.children.length; i++) {
                            element.children[i].onclick = function () {
                                var jsrecord = uihelper.getListViewRecord(this);
                                uihelper.display();
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

        this.getFormFields = function (fields) {
            if (!this._tableRef._schema)
                return '';
            if (!(fields instanceof Array))
                fields = null;
            else {
                var tmpFields = {};
                for (var i = 0; i < fields.length; i++) {
                    tmpFields[fields[i]] = fields[i];
                }
                fields = tmpFields;
            }
            var htmltext;
            if (!fields || fields['_id']) {
                htmltext = '<input type="hidden" id="_id" name="_id" value="" />';
            }
            else
                htmltext = '';
            htmltext += '<fieldset data-role="controlgroup">';

            for (var i = 0; i < this._tableRef._schema.length; i++) {
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

        this.getListViewRecord = function (htmlIElement) {
            var id = htmlIElement.getAttribute('data-id');
            return this._tableRef.findById(id);
        };

        this.getFormRecord = function (detailPageName) {
            var id = this._getFormFieldValue('_id', detailPageName);
            return this._tableRef.findById(id);
        };

        this._getIdOfElement = function (name) {
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

                        field = $("#" + this._listview.name + ' [dsid="' + fieldName + '"]');
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
                }
                else {
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

        this.addItem = function (format) {
            if (this._defaultUITableRef) {
                this._defaultUITableRef.addItem(format);
            }
            else
                throw new Error(msg.getMsgText("jsdoMSG011", "addItem()"));
        };

        this.clearItems = function () {
            if (this._defaultUITableRef) {
                this._defaultUITableRef.clearItems();
            }
            else
                throw new Error(msg.getMsgText("jsdoMSG011", "clearItems()"));
        };

        this.assign = function (detailPageName) {
            if (arguments.length !== 0)
                throw new Error(msg.getMsgText("jsdoMSG024", "UIHelper", "assign()"));
            if (this._defaultUITableRef) {
                return this._defaultUITableRef.assign(detailPageName);
            }
            else
                throw new Error(msg.getMsgText("jsdoMSG011", "assign()"));
        };

        this.display = function (detailPageName) {
            if (this._defaultUITableRef) {
                this._defaultUITableRef.display(detailPageName);
            }
            else
                throw new Error(msg.getMsgText("jsdoMSG011", "display()"));
        };

        this.showListView = function () {
            if (this._defaultUITableRef) {
                this._defaultUITableRef.showListView();
            }
            else
                throw new Error(msg.getMsgText("jsdoMSG011", "showListView()"));
        };

        this.getFormFields = function (fields) {
            if (this._defaultUITableRef) {
                return this._defaultUITableRef.getFormFields(fields);
            }
            else
                throw new Error(msg.getMsgText("jsdoMSG011", "getFormFields()"));
        };

        this.getListViewRecord = function (htmlIElement) {
            if (this._defaultUITableRef) {
                return this._defaultUITableRef.getListViewRecord(htmlIElement);
            }
            else
                throw new Error(msg.getMsgText("jsdoMSG011", "getListViewRecord()"));
        };

        this.getFormRecord = function (detailPageName) {
            if (this._defaultUITableRef) {
                return this._defaultUITableRef.getFormRecord(detailPageName);
            }
            else
                throw new Error(msg.getMsgText("jsdoMSG011", "getFormRecord()"));
        };

        this.setDetailPage = function (obj) {
            if (this._defaultUITableRef)
                return this._defaultUITableRef.setDetailPage(obj);
            throw new Error(msg.getMsgText("jsdoMSG011", "setDetailPage()"));
        };

        this.setListView = function (obj) {
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

    progress.ui.UIHelper.setItemTemplate = function (template) {
        progress.ui.UIHelper._itemTemplate = template ? template : progress.ui.UIHelper._defaultItemTemplate;
    };

    progress.ui.UIHelper.setFieldTemplate = function (template) {
        progress.ui.UIHelper._fieldTemplate = 
            template ? template : progress.ui.UIHelper._defaultFieldTemplate;
    };

})();

//this is so that we can see the code in Chrome's Source tab when script is loaded via XHR
//# sourceURL=progress.jsdo.js

/* 
progress.session.js    Version: 4.3.0-23

Copyright (c) 2012-2016 Progress Software Corporation and/or its subsidiaries or affiliates.
 
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
 
    http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

 */

(function () {

    /* define these if not defined yet - they may already be defined if
     progress.js was included first */
    if (typeof progress === "undefined") {
        progress = {};
    }
    if (typeof progress.data === "undefined") {
        progress.data = {};
    }

    progress.data.ServicesManager = {};
    progress.data.ServicesManager._services = [];
    progress.data.ServicesManager._resources = [];
    progress.data.ServicesManager._data = [];
    progress.data.ServicesManager._sessions = [];
    /*
     progress.data.ServicesManager.put = function(id, jsdo) {
     progress.data.ServicesManager._data[id] = jsdo;
     };
     progress.data.ServicesManager.get = function(id) {
     return progress.data.ServicesManager._data[id];
     };
     */

    progress.data.ServicesManager.addResource = function (id, resource) {
        if (progress.data.ServicesManager._resources[id] === undefined)
            progress.data.ServicesManager._resources[id] = resource;
        else
            throw new Error("A resource named '" + id + "' was already loaded.");
    };
    progress.data.ServicesManager.getResource = function (id) {
        return progress.data.ServicesManager._resources[id];
    };
    progress.data.ServicesManager.addService = function (id, service) {
        if (progress.data.ServicesManager._services[id] === undefined)
            progress.data.ServicesManager._services[id] = service;
        else
            throw new Error("A service named '" + id + "' was already loaded.");
    };
    progress.data.ServicesManager.getService = function (id) {
        return progress.data.ServicesManager._services[id];
    };
    progress.data.ServicesManager.addSession = function (catalogURI, session) {
        if (progress.data.ServicesManager._sessions[catalogURI] === undefined)
            progress.data.ServicesManager._sessions[catalogURI] = session;
        else
            throw new Error("Cannot load catalog '" + catalogURI + "' multiple times.");
    };
    progress.data.ServicesManager.getSession = function (catalogURI) {
        try {
            return progress.data.ServicesManager._sessions[catalogURI];
        }
        catch (e) {
            return null;
        }
    };

    /*
     * Scans URL for parameters of the form {name}
     * Returns array with the names
     */
    function extractParamsFromURL(url) {
        var urlParams = [];
        if (typeof(url) == 'string') {
            var paramName = null;
            for (var i = 0; i < url.length; i++) {
                if (url.charAt(i) == '{') {
                    paramName = "";
                }
                else if (url.charAt(i) == '}') {
                    if (paramName)
                        urlParams.push(paramName);
                    paramName = null;
                }
                else if (paramName !== null) {
                    paramName += url.charAt(i);
                }
            }
        }
        return urlParams;
    }

    /*
     * Adds the catalog.json file provided by the catalog parameter, which is a JSDO
     * that has loaded the catalog
     */
    progress.data.ServicesManager.addCatalog = function (services, session) {
        if (!services) {
            throw new Error("Cannot find 'services' property in catalog file.");
        }
        if (services instanceof Array) {

            // first check if there are duplicates before we add them to our cache,
            // which only handles unique values
            for (var j = 0; j < services.length; j++) {
                // don't allow services with the same name across sessions
                if (progress.data.ServicesManager.getService(services[j].name) !== undefined)
                    throw new Error("A service named '" + services[j].name + "' was already loaded.");

                var resources = services[j].resources;

                if (resources instanceof Array) {
                    for (var i = 0; i < resources.length; i++) {
                        if (progress.data.ServicesManager.getResource(resources[i].name) !== undefined)
                            throw new Error("A resource named '" + resources[i].name + 
                                "' was already loaded.");
                    }
                }
                else {
                    throw new Error("Missing 'resources' array in catalog.");
                }
            }

            for (var j = 0; j < services.length; j++) {
                services[j]._session = session;
                this.addService(services[j].name, services[j]); // Register the service
                var resources = services[j].resources;
                var baseAddress = services[j].address;
                if (resources instanceof Array) {
                    for (var i = 0; i < resources.length; i++) {
                        var resource = resources[i];
                        resource.fn = {};
                        resource.service = services[j];
                        resources[i].url = baseAddress + resources[i].path;
                        // Register resource
                        progress.data.ServicesManager.addResource(resources[i].name, resources[i]);

                        // Process schema
                        resource.fields = null;
                        resource.primaryKeys = null;
                        if (resource.schema) {
                            resource.fields = {};
                            resource.primaryKeys = {};
                            resource._dataSetName = undefined;
                            resource._tempTableName = undefined;
                            var properties = null;

                            try {
                                if (typeof resource.schema.properties != 'undefined') {
                                    var keys = Object.keys(resource.schema.properties);
                                    properties = resource.schema.properties;
                                    if (keys.length == 1) {
                                        if (typeof resource.schema.properties[keys[0]].properties != 
                                            'undefined') {
                                            // Schema corresponds to a DataSet
                                            resource._dataSetName = keys[0];
                                        }
                                        else if (typeof resource.schema.properties[keys[0]].items != 
                                            'undefined') {
                                            // Schema corresponds to a temp-table
                                            resource.dataProperty = keys[0];
                                            properties = resource.schema.properties[keys[0]].items.properties;
                                            resource._tempTableName = resource.dataProperty;
                                            resource.primaryKeys[resource._tempTableName] = 
                                                resource.schema.properties[keys[0]].primaryKey;
                                        }
                                    }
                                }
                                else {
                                    var keys = Object.keys(resource.schema);
                                    if (keys.length == 1) {
                                        resource.dataProperty = keys[0];
                                        if (typeof resource.schema[keys[0]].items != 'undefined') {
                                            // Catalog format correspond to Table Schema
                                            properties = resource.schema[keys[0]].items.properties;
                                            resource._tempTableName = resource.dataProperty;
                                            resource.primaryKeys[resource._tempTableName] = 
                                                resource.schema[keys[0]].primaryKey;
                                        }
                                        else if (typeof resource.schema[keys[0]].properties != 'undefined') {
                                            // Catalog format correspond to DataSet Schema
                                            resource._dataSetName = keys[0];
                                            resource.dataProperty = null;
                                            properties = resource.schema;
                                        }
                                    }
                                }
                            }
                            catch (e) {
                                throw new Error("Error parsing catalog file.");
                            }
                            if (properties) {
                                if (resource._dataSetName) {
                                    properties = properties[resource._dataSetName].properties;
                                    for (var tableName in properties) {
                                        resource.fields[tableName] = [];
                                        resource.primaryKeys[tableName] = properties[tableName].primaryKey;
                                        var tableProperties;
                                        if (properties[tableName].items
                                            && properties[tableName].items.properties) {
                                            tableProperties = properties[tableName].items.properties;
                                        }
                                        else {
                                            tableProperties = properties[tableName].properties;
                                        }
                                        for (var field in tableProperties) {
                                            tableProperties[field].name = field;
                                            if (field != '_id')
                                                resource.fields[tableName].push(tableProperties[field]);
                                        }
                                    }
                                }
                                else {
                                    var tableName = resource.dataProperty ? resource.dataProperty : "";
                                    resource.fields[tableName] = [];
                                    for (var field in properties) {
                                        properties[field].name = field;
                                        if (field != '_id')
                                            resource.fields[tableName].push(properties[field]);
                                    }
                                }
                            }
                            else
                                throw new Error("Error parsing catalog file.");
                        }
                        else
                            resource.fields = null;

                        // Validate relationship property
                        if ((resource.relations instanceof Array)
                            && resource.relations[0]
                            && resource.relations[0].RelationName) {
                            throw new Error(
                                "Relationship properties in catalog must begin with lowercase.");
                        }
                        // Process operations
                        resource.generic = {};
                        if (resource.operations) {
                            for (var idx = 0; idx < resource.operations.length; idx++) {
                                if (resource.operations[idx].path) {
                                    resource.operations[idx].url = 
                                        resource.url + resource.operations[idx].path;
                                }
                                else {
                                    resource.operations[idx].url = resource.url;
                                }
                                if (!resource.operations[idx].params) {
                                    resource.operations[idx].params = [];
                                }
                                if (!resource.operations[idx].type) {
                                    resource.operations[idx].type = "INVOKE";
                                }

                                // Set opname - validation of opname is done later
                                var opname = resource.operations[idx].type.toLowerCase();

                                // Set default verb based on operation
                                if (!resource.operations[idx].verb) {
                                    switch (opname) {
                                        case 'create':
                                            resource.operations[idx].verb = "POST";
                                            break;
                                        case 'read':
                                            resource.operations[idx].verb = "GET";
                                            break;
                                        case 'update':
                                        case 'invoke':
                                        case 'submit':
                                        case 'count':
                                            resource.operations[idx].verb = "PUT";
                                            break;
                                        case 'delete':
                                            resource.operations[idx].verb = "DELETE";
                                            break;
                                        default:
                                            break;
                                    }
                                }

                                // Point fn to operations
                                var func = function fn(object, async) {
                                    var deferred;
                                    
                                    // Add static variable fnName to function
                                    if (typeof fn.fnName == 'undefined') {
                                        fn.fnName = arguments[0]; // Name of function
                                        fn.definition = arguments[1]; // Operation definition
                                        return;
                                    }
                                                                        
                                    var reqBody = null;
                                    var url = fn.definition.url;
                                    var jsdo = this;
                                    var xhr = null;

                                    var request = {};
                                    if (object) {
                                        if (typeof(object) != "object") {
                                            throw new Error("Catalog error: Function '" + 
                                                fn.fnName + "' requires an object as a parameter.");
                                        }
                                        var objParam;
                                        if (object instanceof XMLHttpRequest) {
                                            jsdo = object.jsdo;
                                            xhr = object;
                                            objParam = xhr.objParam;

                                            // use the request from the xhr request if possible
                                            request = xhr.request;
                                        }
                                        else {
                                            objParam = object;
                                        }

                                        if (typeof async == 'undefined') {
                                            async = this._async;
                                        }
                                        else {
                                            async = Boolean(async);
                                        }

                                        request.objParam = objParam;
                                        

                                        // Process objParam
                                        var isInvoke = (fn.definition.type.toUpperCase() == 'INVOKE');
                                        for (var i = 0; i < fn.definition.params.length; i++) {
                                            var name = fn.definition.params[i].name;
                                            switch (fn.definition.params[i].type) {
                                                case 'PATH':
                                                case 'QUERY':
                                                case 'MATRIX':
                                                    var value = null;
                                                    if (objParam)
                                                        value = objParam[name];
                                                    if (!value)
                                                        value = "";
                                                    if (url.indexOf('{' + name + '}') == -1) {
                                                        throw new Error("Catalog error: Reference to " + 
                                                            fn.definition.params[i].type + " parameter '" + 
                                                            name + "' is missing in path.");
                                                    }
                                                    url = url.replace(
                                                        new RegExp('{' + name + '}', 'g'),
                                                        encodeURIComponent(value));
                                                    break;
                                                case 'REQUEST_BODY':
                                                case 'REQUEST_BODY,RESPONSE_BODY':
                                                case 'RESPONSE_BODY,REQUEST_BODY':
                                                    if (xhr && !reqBody) {
                                                        reqBody = objParam;
                                                    }
                                                    else {
                                                        var reqParam = objParam[name];
                                                        if (isInvoke
                                                            && (fn.definition.params[i].xType 
                                                            && ("DATASET,TABLE".indexOf(
                                                                fn.definition.params[i].xType) != -1))) {
                                                            var unwrapped = (jsdo._resource.service.settings 
                                                                && jsdo._resource.service.settings.unwrapped);
                                                            if (unwrapped) {
                                                                // Remove extra level if found
                                                                if ((typeof(reqParam) == 'object')
                                                                    && (Object.keys(reqParam).length == 1)
                                                                    && (typeof(reqParam[name]) == 'object'))
                                                                    reqParam = reqParam[name];
                                                            }
                                                            else {
                                                                // Add extra level if not found
                                                                if ((typeof(reqParam) == 'object')
                                                                    && (typeof(reqParam[name])=='undefined')){
                                                                    reqParam = {};
                                                                    reqParam[name] = objParam[name];
                                                                }
                                                            }
                                                        }
                                                        if (!reqBody) {
                                                            reqBody = {};
                                                        }
                                                        reqBody[name] = reqParam;
                                                    }
                                                    break;
                                                case 'RESPONSE_BODY':
                                                    break;
                                                default:
                                                    throw new Error("Catalog error: " + 
                                                        "Unexpected parameter type '" + 
                                                        fn.definition.params[i].type + "'.");
                                            }
                                        }

                                        // URL has parameters
                                        if (url.indexOf('{') != -1) {
                                            var paramsFromURL = extractParamsFromURL(url);
                                            for (var i = 0; i < paramsFromURL.length; i++) {
                                                var name = paramsFromURL[i];
                                                var value = null;
                                                if (objParam)
                                                    value = objParam[name];
                                                if (!value)
                                                    value = "";
                                                if (typeof(value) === "object") {
                                                    value = JSON.stringify(value);
                                                }
                                                url = url.replace(
                                                    new RegExp('{' + name + '}', 'g'),
                                                    encodeURIComponent(value));
                                            }
                                        }
                                    }

                                    request.fnName = fn.fnName;
                                    request.async = async;
                                    
                                    if (request.deferred === undefined &&
                                        typeof($) == 'function' && typeof($.Deferred) == 'function') {
                                        deferred = $.Deferred();
                                        request.deferred = deferred;
                                    }

                                    var data = jsdo._httpRequest(xhr, fn.definition.verb, 
                                        url, reqBody, request, async);
                                    return data;
                                };
                                // End of Function Definition

                                switch (resource.operations[idx].verb.toLowerCase()) {
                                    case 'get':
                                    case 'post':
                                    case 'put':
                                    case 'delete':
                                        break;
                                    default:
                                        throw new Error("Catalog error: Unexpected HTTP verb '" + 
                                            resource.operations[idx].verb + 
                                            "' found while parsing the catalog.");
                                }

                                switch (opname) {
                                    case 'invoke':
                                        break;
                                    case 'create':
                                    case 'read':
                                    case 'update':
                                    case 'delete':
                                    case 'submit':
                                    case 'count':                                                                                
                                        if (typeof(resource.generic[opname]) == "function") {
                                            throw new Error("Catalog error: Multiple '" + 
                                                resource.operations[idx].type + 
                                                "' operations specified in the catalog for resource '" + 
                                                resource.name + "'.");
                                        }
                                        else
                                            resource.generic[opname] = func;
                                        break;
                                    default:
                                        throw new Error("Catalog error: Unexpected operation '" + 
                                            resource.operations[idx].type + 
                                            "' found while parsing the catalog.");
                                }

                                // Set fnName
                                var name = resource.operations[idx].name;
                                if (opname === "invoke" || opname === "count") {
                                    resource.fn[name] = {};
                                    resource.fn[name]["function"] = func;
                                }
                                else {
                                    name = "_" + opname;
                                }
                                func(name, resource.operations[idx]);
                            }
                        }
                    }
                }
            }
        }
        else {
            throw new Error("Missing 'services' array in catalog.");
        }

    };

    /*
     * Prints debug information about the ServicesManager.
     */
    progress.data.ServicesManager.printDebugInfo = function (resourceName) {
        if (resourceName) {
            //console.log("** ServicesManager **");
            //console.log("** BEGIN **");
            var resource = progress.data.ServicesManager.getResource(resourceName);
            if (resource) {
                var cSchema = "Schema:\n";
                var cOperations = "Operations: " + resource.operations.length + "\n";
                for (var field in resource.schema.properties) {
                    cSchema += "\nName: " + field
                    + "\n";
                }

                for (var i = 0; i < resource.operations.length; i++) {
                    cOperations += "\n" + i
                    + "\nName: " + resource.operations[i].name
                    + "\nURL: " + resource.operations[i].url
                    + "\ntype: " + resource.operations[i].type
                    + "\nverb: " + resource.operations[i].verb
                    + "\nparams: " + resource.operations[i].params.length
                    + "\n";
                }
                console.log("** DEBUG INFO **\nResource name: %s\nURL:%s\n%s\n%s\n\n",
                    resource.name, resource.url, cSchema, cOperations);
            }
            else
                console.log("Resource not found");
            //console.log("** END **");
        }
    };


    /*
     * Contains information about a server-side Mobile service.
     * Properties of args parameter for constructor:
     * @param name   the name of the service
     * @param uri    the URI of the service
     */
    progress.data.MobileServiceObject = function MobileServiceObject(args) {
        var _name = args.name;
        Object.defineProperty(this, 'name',
            {
                get: function () {
                    return _name;
                },
                enumerable: true
            });

        var _uri = args.uri;
        Object.defineProperty(this, 'uri',
            {
                get: function () {
                    return _uri;
                },
                enumerable: true
            });
    };

    /* 
        An object that maintains the X-CLIENT-PROPS header string
        The data for the string is stored in the internal variable named contextObject and is
        always up to date. The internal var contextString isn't created until the first time it's
        needed (the first get of the contextHeader property), and then it's updated an cached
        A call to setContext or setContextProperty updates contextObject but sets contextString to
        null, which signals that it needs to be updated. If contextObject is an empty object,
        contextString is set to undefined to indicate that no header is to be sent
     */
    progress.data.ContextProperties = function() {
        var contextObject = {},
            contextString; // if null, contextObject has been changed but string wasn't updated yet
            
            //  the string to be sent in the X-CLIENT-PROPS header (unless Session.xClientProps has been set)
        Object.defineProperty(this, 'contextHeader',
            {
                get: function () {
                    var header;
                    
                    if (contextString === null) {  // needs to be updated
                        header = JSON.stringify( contextObject );
                        if (header === "{}") {
                            contextString = undefined;
                        }
                        else {
                            contextString = header;
                        }
                    }                        
                    // else (contextString === undefined || has a usable value) 

                    return contextString;
                },
                enumerable: true
            });

        /* determine whether the property is already present, and -
            add it if it's not present
            remove it if propertyValue is explicitly passed as undefined
            otherwise replace its value (even if the new value is null or "")
        */
        this.setContextProperty = function( propertyName, propertyValue) {
            if (arguments.length < 2) {
                // {1}: Incorrect number of arguments in {2} call. There should be {3}.
                throw new Error(progress.data._getMsgText("jsdoMSG122", 'Session', 
                                                           'setContextProperty', 2)); 
            }
            if (arguments.length !== 2) {
                // {1}: Incorrect number of arguments in {2} call. There should be only {3}.";
                throw new Error(progress.data._getMsgText("jsdoMSG122", "Session",
                                                          "setContextProperty", 2)); 
            }
            if (typeof propertyName !== "string") {
                // {1}: Parameter {1} must be of type {3} in {4} call.
                throw new Error(progress.data._getMsgText("jsdoMSG121", 'Session', 1, 'string',
                                                          'setContextProperty')); 
            }

            if ( propertyValue === undefined ) {
                delete contextObject[propertyName]; // OK if it doesn't exist -- no error
            }
            else {
                contextObject[propertyName] = propertyValue;
            }
            contextString = null; // must be updated on next get of this.contextHeader
        };

        this.setContext = function( context ) {
            var prop;

            if (arguments.length < 1) {
                // {1}: Incorrect number of arguments in {2} call. There should be {3}.
                throw new Error(progress.data._getMsgText("jsdoMSG122", 'Session', 'setContext', 1)); 
            }
            if (arguments.length > 1) {
                // {1}: Incorrect number of arguments in {2} call. There should be only {3}.";
                throw new Error(progress.data._getMsgText("jsdoMSG122", 'Session', 'setContext', 1)); 
            }
            if ( typeof context == "object" ) {
                /* Copy the properties of the context passed in as an argument into
                 * an internal contextObject. (Note that if the context object passed in
                 * has a prototype, this code copies them, too)
                 */
                contextObject = {};
                for (prop in context) {
                    if( context.hasOwnProperty(prop) )  {
                        if (typeof context[prop] !== "function" ) {
                            contextObject[prop] = context[prop];
                        }
                    }
                }
            }
            else if ( (context === undefined) || (context === null) ) {
                contextObject = {};
            }
            else {
                // {1}: Parameter {1} must be of type {3} in {4} call.
                throw new Error(progress.data._getMsgText("jsdoMSG121", 'Session', 1, 'Object',
                                                          'setContextProperty')); 
            }
            contextString = null; // must be updated on next get of this.contextHeader
        };
        
        this.getContext = function( ) {
            if (arguments.length > 0) {
                // {1}: Incorrect number of arguments in {2} call. There should be {3}.";
                throw new Error(progress.data._getMsgText("jsdoMSG122", 'Session', 'getContext', 0)); 
            }
            return contextObject;
        };
        
        this.getContextProperty = function( propertyName) {
            if (arguments.length < 1) {
                // {1}: Incorrect number of arguments in {2} call. There should be {3}.
                throw new Error(progress.data._getMsgText("jsdoMSG122", 'Session', 'getContextProperty', 1)); 
            }
            if (arguments.length > 1) {
                // {1}: Incorrect number of arguments in {2} call. There should be only {3}.";
                throw new Error(progress.data._getMsgText("jsdoMSG122", 'Session', 'getContextProperty', 1)); 
            }
            return contextObject[propertyName];
        };
        
    };  // end of ContextProperties
    
    /*
     * Manages authentication and session ID information for a service.
     *
     * Use:  OE mobile developer instantiates a session and calls addCatalog() to load
     *       information for one or more services defined in a catalog file.
     *
     *       Developer instantiates JDSOs as needed.
     *       Usually all of the JSDOs will use the same session, but if a client-side
     *       service needs resources from more than one REST app, there would need to be more
     *       than one session
     *
     */
    progress.data.Session = function Session(options) {

        var defPropSupported = false;
        if ((typeof Object.defineProperty) == 'function') {
            defPropSupported = true;
        }
        
        var myself = this,
            isUserAgentiOS = false,  // checked just below this var statement
            isFirefox = false,  // checked just below this var statement
            isEdge = false,  // checked just below this var statement
            isIE = false,  // checked just below this var statement
            canPassCredentialsToOpenWithCORS = false,  // False will always work if creds are correct
            defaultiOSBasicAuthTimeout = 4000,
            deviceIsOnline = true,  // online until proven offline
            restApplicationIsOnline = false,  // was the Mobile Web Application that this Session object
                                              // connects to online the last time it was checked?
                                              // (value is always false if session is not logged in)
            oepingAvailable = false,
            defaultPartialPingURI = "/rest/_oeping",
            partialPingURI = defaultPartialPingURI,
            _storageKey;

        if (typeof navigator  !== "undefined") {
            if (typeof navigator.userAgent !== "undefined") {
                isUserAgentiOS = navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)/i);
                isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
                // detect that we're running in MS Edge browser
                isEdge = navigator.userAgent.indexOf('Edge/') > -1;
                // detect that we're running in IE 11 (or IE 11 in pre-11 mode) or IE 10 browser
                isIE = ( (navigator.userAgent.indexOf('Trident/')) > -1 || (navigator.userAgent.indexOf('MSIE 10') > -1));
            }
        }
        
        // Firefox, Edge, and IE will throw an error on the send() if CORS is being used for the request
        // and we have included credentials in the URI (which is what passing them to open() does),
        canPassCredentialsToOpenWithCORS = !(isFirefox || isEdge || isIE);
        
        // When using basic authentication, we can pass the user name and password to the XMLHttpRequest.open()
        // method. However, in some browsers, passing credentials to open() will result in the xhr's .send() 
        // method throwing an error. The goal of this function is to figure out whether it's safe to include
        // the credentials. It returns false if there could be a problem, true otherwise.
        // Note: currently it does this solely on the basis of what browser we are running in, regardless
        // of whether the request will actually use the CORS protocol. Ideally, we should take into account whether 
        // the request will actually require CORS. The question is whether we can reliably do that.
        // The reason for taking the specific request into account is that there are drawbacks to not passing the
        // credentials when we are NOT using CORS, namely that if the credentials are invalid, some browsers will 
        // put up their own prompt for credentials in non-CORS situations (those browsers are IE, Edge, and Chrome)
        function canPassCredentialsToOpen() {
            return canPassCredentialsToOpenWithCORS;
        }
        
        this._onlineHandler = function () {
            setDeviceIsOnline(true);
            myself.trigger("online", myself, null);
        };

        this._offlineHandler = function () {
            setDeviceIsOnline(false);
            myself.trigger("offline", myself, progress.data.Session.DEVICE_OFFLINE, null);
        };

        if ((typeof window != 'undefined' ) && (window.addEventListener)) {
            window.addEventListener("online", this._onlineHandler, false);
            window.addEventListener("offline", this._offlineHandler, false);
        }

        /* constants and properties - define them as properties via the defineProperty()
         * function, which has "writable" and "configurable" parameters that both
         * default to false, so these calls create properties that are read-only
         *
         * IF WE DECIDE THAT WE CAN ASSUME WE ALWAYS RUN WITH A VERSION OF JAVASCRIPT THAT SUPPORTS
         * Object.DefineProperty(), WE CAN DELETE THE defPropSupported VARIABLE, THE TEST OF IT BELOW,
         * AND THE 'ELSE' CLAUSE BELOW AND ALL THE setXxxx functions (AND CHANGE THE CALLS TO THE setXxxx
         * FUNCTIONS SO THEY JUST REFER TO THE PROPERTY)
         *
         */

        // define these unconditionally so we don't get a warning on the push calls that they might
        // have been uninitialized
        var _catalogURIs = [];
        var _services = [];
        var _jsdos = [];

        this.onOpenRequest = null;

        var _password = null;

        if (defPropSupported) {
            var _userName = null;
            Object.defineProperty(this, 'userName',
                {
                    get: function () {
                        return _userName;
                    },
                    enumerable: true
                });

            var _loginTarget = '/static/home.html';
            Object.defineProperty(this, 'loginTarget',
                {
                    get: function () {
                        return _loginTarget;
                    },
                    enumerable: true
                });

            var _serviceURI = null;
            Object.defineProperty(this, 'serviceURI',
                {
                    get: function () {
                        return _serviceURI;
                    },
                    enumerable: true
                });

            Object.defineProperty(this, 'catalogURIs',
                {
                    get: function () {
                        return _catalogURIs;
                    },
                    enumerable: true
                });

            Object.defineProperty(this, 'services',
                {
                    get: function () {
                        return _services;
                    },
                    enumerable: true
                });

            var _loginResult = null;
            Object.defineProperty(this, 'loginResult',
                {
                    get: function () {
                        return _loginResult;
                    },
                    enumerable: true
                });

            var _loginHttpStatus = null;
            Object.defineProperty(this, 'loginHttpStatus',
                {
                    get: function () {
                        return _loginHttpStatus;
                    },
                    enumerable: true
                });

            var _clientContextId = null;
            Object.defineProperty(this, 'clientContextId',
                {
                    get: function () {
                        return _clientContextId;
                    },
                    enumerable: true
                });

            var _authenticationModel = progress.data.Session.AUTH_TYPE_ANON;
            Object.defineProperty(this, 'authenticationModel',
                {
                    get: function () {
                        return _authenticationModel;
                    },
                    set: function (newval) {
                        if (newval) {
                            newval = newval.toLowerCase();
                        }
                        switch (newval) {
                            case progress.data.Session.AUTH_TYPE_FORM :
                            case progress.data.Session.AUTH_TYPE_BASIC :
                            case progress.data.Session.AUTH_TYPE_ANON :
                            case null :
                                _authenticationModel = newval;
                                storeSessionInfo("authenticationModel", newval);

                                break;
                            default:
                                throw new Error("Error setting Session.authenticationModel. '" + 
                                    newval + "' is an invalid value.");
                        }
                    },
                    enumerable: true
                });

            var _lastSessionXHR = null;
            Object.defineProperty(this, 'lastSessionXHR',
                {
                    get: function () {
                        return _lastSessionXHR;
                    },
                    enumerable: true
                });

            Object.defineProperty(this, 'connected',
                {
                    get: function () {
                        return     (this.loginResult === progress.data.Session.LOGIN_SUCCESS)
                                && restApplicationIsOnline 
                                && deviceIsOnline;
                    },
                    enumerable: true
                });

            Object.defineProperty(this, 'JSDOs',
                {
                    get: function () {
                        return _jsdos;
                    },
                    enumerable: true
                });

            var _pingInterval = 0;
            var _timeoutID = null;
            Object.defineProperty(this, 'pingInterval',
                {
                    get: function () {
                        return _pingInterval;
                    },
                    set: function (newval) {
                        if ( (typeof newval === "number") && (newval >= 0) ) {
                            _pingInterval = newval;
                            storeSessionInfo("pingInterval", newval);
                            if (newval > 0) {
                                // if we're logged in, start autopinging
                                if (this.loginResult === progress.data.Session.LOGIN_SUCCESS) {
                                    _timeoutID = setTimeout(this._autoping, newval);
                                }
                            }
                            else if (newval === 0) {
                                clearTimeout(_timeoutID);
                                _pingInterval = 0;
                            }
                        }
                        else {
                            throw new Error("Error setting Session.pingInterval. '" + 
                                newval + "' is an invalid value.");
                        }
                    },
                    enumerable: true
                });

            var _contextProperties = new progress.data.ContextProperties();
            Object.defineProperty( this, 
                                   "_contextProperties",
                                   {  
                                       get: function () {
                                            return _contextProperties;
                                       },
                                       enumerable: false
                                   }
                                 );
        }
        else {
            this.userName = null;
            this.loginTarget = '/static/home.html';
            this.serviceURI = null;
            this.catalogURIs = [];
            this.services = [];
            this.loginResult = null;
            this.loginHttpStatus = null;
            this.clientContextId = null;
            this.authenticationModel = progress.data.Session.AUTH_TYPE_ANON;
            this.lastSessionXHR = null;
        }

        // stores data value using the JSDOSession's storage key plus the infoName
        // argument as a key. If there is no infoName, just uses the storage key
        // by itself (the latter case is inetnded to serev as a flag that we have
        // stored this JSDOSession's data before)
        // 
        function storeSessionInfo(infoName, value) {
            var key;
            if (myself.loginResult === progress.data.Session.LOGIN_SUCCESS &&
                typeof (sessionStorage) === 'object' && _storageKey) {
                    
                key = _storageKey;
                if (infoName) {
                    key = key + "." + infoName;
                }
                if (typeof (value) !== 'undefined') {
                    sessionStorage.setItem(key, JSON.stringify(value));
                }
            }
        }
        
        function retrieveSessionInfo(infoName) {
            var key,
                jsonStr,
                value = null;
            if (typeof (sessionStorage) === 'object' && _storageKey) {
                key = _storageKey;
                if (infoName) {
                    key = key + "." + infoName;
                }
                jsonStr = sessionStorage.getItem(key);
                if (jsonStr !== null) {
                    try {
                        value = JSON.parse(jsonStr);
                    } catch (e) {
                        value = null;
                    }
                }
                return value;
            }
        }
        
        function clearSessionInfo(infoName) {
            var key;
            if (typeof (sessionStorage) === 'object' && _storageKey) {
                key = _storageKey;
                if (infoName) {
                    key = key + "." + infoName;
                    sessionStorage.removeItem(key);
                }
            }
        }

        function storeAllSessionInfo() {
            if (_storageKey) {
                storeSessionInfo("loginResult", myself.loginResult);
                storeSessionInfo("userName", myself.userName);
                storeSessionInfo("serviceURI", myself.serviceURI);
                storeSessionInfo("loginHttpStatus", myself.loginHttpStatus);
                storeSessionInfo("authenticationModel", myself.authenticationModel);
                storeSessionInfo("pingInterval", myself.pingInterval);
                storeSessionInfo("oepingAvailable", oepingAvailable);
                storeSessionInfo("partialPingURI", partialPingURI);
                storeSessionInfo("clientContextId", myself.clientContextId);
                storeSessionInfo("deviceIsOnline", deviceIsOnline);
                storeSessionInfo("restApplicationIsOnline", restApplicationIsOnline);
                storeSessionInfo(_storageKey, true);
            }
        }
        
        function clearAllSessionInfo() {
            if (_storageKey) {
                if (retrieveSessionInfo(_storageKey)) {
                    clearSessionInfo("loginResult");
                    clearSessionInfo("userName");
                    clearSessionInfo("serviceURI");
                    clearSessionInfo("loginHttpStatus");
                    clearSessionInfo("clientContextId");
                    clearSessionInfo("deviceIsOnline");
                    clearSessionInfo("restApplicationIsOnline");
                    clearSessionInfo("authenticationModel");
                    clearSessionInfo("pingInterval");
                    clearSessionInfo("oepingAvailable");
                    clearSessionInfo("partialPingURI");
                    clearSessionInfo(_storageKey);
                }
            }
        }
        
        function setSessionInfoFromStorage(key) {
            if (retrieveSessionInfo(key)) {
                setLoginResult(retrieveSessionInfo("loginResult"), this);
                setUserName(retrieveSessionInfo("userName"), this);
                setServiceURI(retrieveSessionInfo("serviceURI"), this);
                setLoginHttpStatus(retrieveSessionInfo("loginHttpStatus"), this);
                setClientContextID(retrieveSessionInfo("clientContextId"), this);
                setDeviceIsOnline(retrieveSessionInfo("deviceIsOnline"));
                setRestApplicationIsOnline(retrieveSessionInfo("restApplicationIsOnline"));
                myself.authenticationModel = retrieveSessionInfo("authenticationModel");
                myself.pingInterval = retrieveSessionInfo("pingInterval");
                setOepingAvailable(retrieveSessionInfo("oepingAvailable"));
                setPartialPingURI(retrieveSessionInfo("partialPingURI"));
            }
        }

        function setUserName(newname, sessionObject) {
            if (defPropSupported) {
                _userName = newname;
            }
            else {
                sessionObject.userName = newname;
            }

            storeSessionInfo("userName", newname);
        }

        function setLoginTarget(target, sessionObject) {
            if (defPropSupported) {
                _loginTarget = target;
            }
            else {
                sessionObject.loginTarget = target;
            }
        }

        function setServiceURI(url, sessionObject) {
            if (defPropSupported) {
                _serviceURI = url;
            }
            else {
                sessionObject.serviceURI = url;
            }
            
            storeSessionInfo("serviceURI", url);
        }

        function pushCatalogURIs(url, sessionObject) {
            if (defPropSupported) {
                _catalogURIs.push(url);
            }
            else {
                sessionObject.catalogURIs.push(url);
            }
        }

        function pushService(serviceObject, sessionObject) {
            if (defPropSupported) {
                _services.push(serviceObject);
            }
            else {
                sessionObject.services.push(serviceObject);
            }
        }

        function findService(serviceName) {
            for (var prop in _services) {
                var srv = _services[prop];
                if (srv.name === serviceName) {
                    return srv;
                }
            }
            return null;
        }

        function setLoginResult(result, sessionObject) {
            if (defPropSupported) {
                _loginResult = result;
            } else {
                sessionObject.loginResult = result;
            }

            
            if (result === progress.data.Session.LOGIN_SUCCESS) {
                storeSessionInfo("loginResult", result);
            } else {
                // Let's clear sessionStorage since we logged out or something went bad!
                clearAllSessionInfo();
            }
        }

        function setLoginHttpStatus(status, sessionObject) {
            if (defPropSupported) {
                _loginHttpStatus = status;
            }
            else {
                sessionObject.loginHttpStatus = status;
            }

            storeSessionInfo("loginHttpStatus", status);
        }

        function setClientContextIDfromXHR(xhr, sessionObject) {
            if (xhr) {
                setClientContextID(getResponseHeaderNoError(xhr, "X-CLIENT-CONTEXT-ID"), sessionObject);
            }
        }

        function setClientContextID(ccid, sessionObject) {
            if (defPropSupported) {
                _clientContextId = ccid;
            }
            else {
                sessionObject.clientContextId = ccid;
            }
                
            storeSessionInfo("clientContextId", ccid);
        }

        function setLastSessionXHR(xhr, sessionObject) {
            if (defPropSupported) {
                _lastSessionXHR = xhr;
            }
            else {
                sessionObject.lastSessionXHR = xhr;
            }
        }

        function setDeviceIsOnline(value) {
            deviceIsOnline = value;

            storeSessionInfo("deviceIsOnline", value);
        }

        function setRestApplicationIsOnline(value) {
            restApplicationIsOnline = value;

            storeSessionInfo("restApplicationIsOnline", value);
        }

        function setOepingAvailable(value) {
            oepingAvailable = value;

            storeSessionInfo("oepingAvailable", value);
        }

        function setPartialPingURI(value) {
            partialPingURI = value;

            storeSessionInfo("partialPingURI", value);
        }
        
        /*
            When using CORS, if the client asks for a response header that is not among 
            the headers exposed by the Web application, the user agent may write an error
            to the console, e.g., "REFUSED TO GET UNSAFE HEADER". This function checks for 
            a given response header in a way that will avoid the error message. It does this
            by requesting all headers and then checking to see whether the desired header
            is present (it will not be present, even if the server sent it, if the server has not
            also allowed that header). The function caches the string returned by getAllResponseHeaders
            by storing it on the xhr that was used in the request. It does the caching in
            case there is another header to be checked.
          */
        function getResponseHeaderNoError(xhr, headerName) {
            var allHeaders = xhr._pdsResponseHeaders,
                regExp;

            if (allHeaders === undefined) {
                allHeaders = xhr.getAllResponseHeaders();
                if ( allHeaders ) {
                    xhr._pdsResponseHeaders = allHeaders;
                }
                else {
                    xhr._pdsResponseHeaders = null;
                }
            }
            if ( allHeaders ) {
                regExp = new RegExp("^" + headerName + ":", "m");
                if ( allHeaders.match(regExp) ) {
                    return xhr.getResponseHeader(headerName);
                }
            }

            return null;
        }

        // "Methods"

        this._pushJSDOs = function (jsdo) {
            _jsdos.push(jsdo);
        };


        /* _openRequest  (intended for progress.data library use only)
         * calls open() for an xhr -- the assumption is that this is an xhr for a JSDO, and we need to add
         * some session management information for the request, such as user credentials and a session ID if
         * there is one
         */
        this._openRequest = function (xhr, verb, url, async) {

            if (this.loginResult !== progress.data.Session.LOGIN_SUCCESS && this.authenticationModel) {
                throw new Error("Attempted to make server request when there is no active session.");
            }

            // if resource url is not absolute, add the REST app url to the front
            var urlPlusCCID = this._prependAppURL(url);

            // add CCID as JSESSIONID query string to url
            urlPlusCCID = this._addCCIDtoURL(urlPlusCCID);

            // add time stamp to the url
            if (progress.data.Session._useTimeStamp) {
                urlPlusCCID = this._addTimeStampToURL(urlPlusCCID);
            }
            
            this._setXHRCredentials(xhr, verb, urlPlusCCID, this.userName, _password, async);
            if (this.authenticationModel === progress.data.Session.AUTH_TYPE_FORM) {
                _addWithCredentialsAndAccept(xhr, "application/json");
            }

            // add CCID header
            if (this.clientContextId && (this.clientContextId !== "0")) {
                xhr.setRequestHeader("X-CLIENT-CONTEXT-ID", this.clientContextId);
            }
            // set X-CLIENT-PROPS header
            setRequestHeaderFromContextProps(this, xhr);
            
            if (typeof this.onOpenRequest === 'function') {
                var params = {
                    "xhr": xhr,
                    "verb": verb,
                    "uri": urlPlusCCID,
                    "async": async,
                    "formPreTest": false,
                    "session": this
                };
                this.onOpenRequest(params);
                // xhr = params.xhr; //Note that, currently, this would have no effect in the caller.
            }
        };

        /* login
         *
         */

        // callback used in login to determine whether ping is available on server
        this.pingTestCallback = function (cbArgs) {
            var foundOeping = cbArgs.pingResult ? true : false;

            setOepingAvailable(foundOeping);
        };

        // generic async callback, currently used by login(), addCatalog(), and logout()
        this._onReadyStateChangeGeneric = function () {
            var xhr = this;
            var result;
            var errorObject;
            
            clearTimeout(xhr._requestTimeout); // for the iOS Basic Auth bug

            if (xhr.readyState == 4) {
                result = null;
                errorObject = null;

                // initial processing of the response from the Web application
                if ((typeof xhr.onResponseFn) == 'function') {
                    try {
                        result = xhr.onResponseFn(xhr);
                        // ( note that result will remain null if this is a logout() )
                    }
                    catch (e) {
                        errorObject = e;
                    }
                }
                // handle the results of the processing (e.g., fire any events required)
                if ((typeof xhr.onResponseProcessedFn) == 'function') {
                    if (!result) {
                        result = progress.data.Session.GENERAL_FAILURE;
                    }
                    xhr.onResponseProcessedFn(xhr.pdsession, result, errorObject, xhr);
                }
            }
        };

        // store password here until successful login; only then do we store it in the Session object
        var pwSave = null;
        // store user name here until successful login; only then do we store it in the Session object
        var unameSave = null;
        this.login = function (serviceURI, loginUserName, loginPassword, loginTarget) {
            var uname,
                pw,
                isAsync = false,
                args = [],
                deferred,
                jsdosession,
                iOSBasicAuthTimeout,
                uriForRequest;   // "decorated" version of serviceURI, used to actually send the request

            pwSave = null;   // in case these are left over from a previous login
            unameSave = null;

            if (this.loginResult === progress.data.Session.LOGIN_SUCCESS) {
                throw new Error("Attempted to call login() on a Session object that is already logged in.");
            }

            if (!defPropSupported) {
                // this is here on the presumably slim chance that we're running with a
                // version of JavaScript that doesn't support defineProperty (otherwise
                // the lower casing will have already happened). When we decide that it's
                // OK to remove our conditionalization of property definitions, we should
                // get rid of this whole conditional
                this.authenticationModel = this.authenticationModel.toLowerCase();
            }

            if (arguments.length > 0) {
                if (arguments[0] && typeof(arguments[0]) === 'object') {
                    if (arguments[0].serviceURI) {
                        args[0] = arguments[0].serviceURI;
                        args[1] = arguments[0].userName;
                        args[2] = arguments[0].password;
                        args[3] = arguments[0].loginTarget;
                        args[4] = arguments[0].async;
                        
                        /* Special for JSDOSession: if this method was called by a JSDOSession object, 
                            it passes deferred and jsdosession and we need to eventually attach them 
                            to the XHR we use so that the promise created by the JSDOSession will work
                            correctly
                        */ 
                        deferred = arguments[0].deferred;
                        jsdosession = arguments[0].jsdosession;
                        
                        iOSBasicAuthTimeout = arguments[0].iOSBasicAuthTimeout;
                        if ( typeof iOSBasicAuthTimeout === 'undefined' ) {
                            iOSBasicAuthTimeout = defaultiOSBasicAuthTimeout;
                        }
                        else if (iOSBasicAuthTimeout && (typeof iOSBasicAuthTimeout != 'number')) {
                            throw new Error(progress.data._getMsgText("jsdoMSG033", 'Session', 'login', 
                                'The iOSBasicAuthTimeout argument was invalid.'));
                        }
                    }
                }
                else {
                    args = arguments;
                }
            }

            if (args.length > 0) {
                if (args[0]) {
                    var restURLtemp = args[0];

                    // get rid of trailing '/' because appending service url that starts with '/'
                    // will cause request failures
                    if (restURLtemp[restURLtemp.length - 1] === "/") {
                        restURLtemp = restURLtemp.substring(0, restURLtemp.length - 1);
                    }
                    setServiceURI(restURLtemp, this);
                }
                else {
                    setLoginResult(progress.data.Session.LOGIN_GENERAL_FAILURE, this);
                    throw new Error("Session.login() is missing the serviceURI argument.");
                }

                if (args[1]) {
                    uname = args[1];
                }

                if (args[2]) {
                    pw = args[2];
                }

                if (args[3]) {
                    setLoginTarget(args[3], this);
                }

                if (args[4]) {
                    if (typeof(args[4]) === 'boolean') {
                        isAsync = args[4];
                    }
                    else {
                        throw new Error("Session.login() was passed an async setting that is not a boolean.");
                    }
                }
            }
            else {
                setLoginResult(progress.data.Session.LOGIN_GENERAL_FAILURE, this);
                throw new Error("Session.login() is missing the serviceURI argument.");
            }

            // use these temp cred variables later; if login succeeds, we'll use them to set the
            // real credentials
            unameSave = uname;
            pwSave = pw;

            if (this.authenticationModel === progress.data.Session.AUTH_TYPE_ANON ||
                this.authenticationModel === progress.data.Session.AUTH_TYPE_FORM) {
                /* anonymous should NOT have a username and password passed (this is
                 probably unnecessary because the XHR seems to send the request without
                 credentials first, then intercept the 401 if there is one and try again,
                 this time with credentials. Just making sure.
                 */
                /* For form authentication, we may as well not send the user name and password
                 * on this request, since we are just trying to test whether the authentication
                 *  has already happened and they are therefore irrelevant
                 */
                uname = null;
                pw = null;
            }

            var xhr = new XMLHttpRequest();
            xhr.pdsession = this;

            try {
                uriForRequest = this.serviceURI + this.loginTarget;
                if (progress.data.Session._useTimeStamp) {
                    uriForRequest = this._addTimeStampToURL(uriForRequest);
                }               
                this._setXHRCredentials(xhr, 'GET', uriForRequest, uname, pw, isAsync);

                xhr.setRequestHeader("Cache-Control", "no-cache");
                xhr.setRequestHeader("Pragma", "no-cache");
                // set X-CLIENT-PROPS header
                setRequestHeaderFromContextProps(this, xhr);
                if (this.authenticationModel === progress.data.Session.AUTH_TYPE_FORM) {
                    _addWithCredentialsAndAccept(xhr, 
                        "application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
                }

                xhr._isAsync = isAsync;
                if (isAsync) {
                    xhr.onreadystatechange = this._onReadyStateChangeGeneric;
                    if (this.authenticationModel === progress.data.Session.AUTH_TYPE_FORM) {
                        xhr.onResponseFn = this._afterFormPretestLogin;
                    }
                    else {
                        xhr.onResponseFn = this._processLoginResult;
                        xhr.onResponseProcessedFn = this._loginComplete;
                    }
                    if (    this.authenticationModel === progress.data.Session.AUTH_TYPE_BASIC 
                         && isUserAgentiOS
                         && iOSBasicAuthTimeout > 0 ) { 
                        xhr._requestTimeout = setTimeout(  function (){
                                                        clearTimeout(xhr._requestTimeout);
                                                        xhr._iosTimeOutExpired = true;
                                                        xhr.abort();
                                                    }, 
                                                    iOSBasicAuthTimeout);
                    }
                    xhr._jsdosession = jsdosession;  // in case the caller is a JSDOSession
                    xhr._deferred = deferred;  // in case the caller is a JSDOSession
                }

                if (typeof this.onOpenRequest === 'function') {
                    var isFormPreTest = false;
                    if (this.authenticationModel === progress.data.Session.AUTH_TYPE_FORM) {
                        isFormPreTest = true;
                    }

                    //  set this here in case onOpenRequest checks it
                    setLastSessionXHR(xhr, this);
                    var params = {
                        "xhr": xhr,
                        "verb": "GET",
                        "uri": this.serviceURI + this.loginTarget,
                        "async": false,
                        "formPreTest": isFormPreTest,
                        "session": this
                    };
                    this.onOpenRequest(params);
                    xhr = params.xhr; // just in case it has been changed
                }
                setLastSessionXHR(xhr, this);
                xhr.send(null);
            }
            catch (e) {
                clearTimeout(xhr._requestTimeout);                
                setLoginHttpStatus(xhr.status, this);
                setLoginResult(progress.data.Session.LOGIN_GENERAL_FAILURE, this);
                unameSave = null;
                pwSave = null;
                throw e;
            }

            if (isAsync) {
                return progress.data.Session.ASYNC_PENDING;
            }
            else {
                setLoginHttpStatus(xhr.status, this);
                if (this.authenticationModel === progress.data.Session.AUTH_TYPE_FORM) {
                    return (this._afterFormPretestLogin(xhr) );
                }
                else {
                    return (this._processLoginResult(xhr) );
                }
            }
        };


        this._afterFormPretestLogin = function (xhr) {
            var pdsession = xhr.pdsession;
            setLoginHttpStatus(xhr.status, xhr.pdsession);

            var formLoginParams = {
                "xhr": xhr,
                "pw": pwSave,
                "uname": unameSave,
                "theSession": pdsession
            };
            try {
                return doFormLogin(formLoginParams);
            }
            catch (e) {
                pwSave = null;
                unameSave = null;
                throw e;
            }
        };

        /* doFormLogin
         * This function handles logging in to a service that uses form-based authentication. It's separate
         * from the main login function because it's long. One of the things it does is examine the
         * response from an initial attempt to get the login target without credentials (done in the main
         * login() function) to determine whether the user has already been authenticated. Although a
         * current OE Mobile Web application (as of 5/30/2013) will return an error if authentication
         * failed on a form login, previous versions and non-OE servers return a
         * redirect to a login page and the user agent (browser or native wrapper)
         * usually then fetches the redirect location and returns it along with a
         * 200 Success status, when in fcat it was an authentication failure. Hence
         * the need to analyze the response to try to figure out what we get back.
         *
         */
        function doFormLogin(args) {
            var xhr = args.xhr;
            var theSession = args.theSession;
            var oldXHR;

            // check whether we got the OE REST Form based error response
            var contentType = null;
            var needAuth = false;
            var params = {
                "session": theSession,
                "xhr": xhr,
                "statusFromjson": null
            };

            contentType = xhr.getResponseHeader("Content-Type");

            if (contentType && contentType.indexOf("application/json") >= 0) {
                handleJSONLoginResponse(params);
                if (    !params.statusFromjson 
                     || (params.statusFromjson >= 400 && params.statusFromjson < 500) 
                   )  {
                    needAuth = true;
                }
                else {
                    // either the response shows that we're already authenticated, or
                    // there's some error other than an authentication error
                    setLoginHttpStatus(params.statusFromjson, theSession);
                }
            }
            else {
                // need to do only 200 for async to work with MWA down
                if (theSession.loginHttpStatus == 200) {  
                    if (_gotLoginForm(xhr)) {
                        needAuth = true;
                    }
                    // else we are assuming we truly retrieved the login target and
                    // therefore we were previously authenticated
                }
                // else had an error, just return it
            }

            if (needAuth) {
                // create new XHR, because if this is an async call we don't want to
                // confuse things by using this xhr to send another request while we're
                // still processing its old request (this function, doFormLogin(), may
                // have been called from onReadyStateChangeGeneric and it's conceivable
                // that that function has more code to execute involving this xhr)
                oldXHR = xhr;
                xhr = new XMLHttpRequest();
                args.xhr = xhr;
                params.xhr = xhr;

                // need to transfer any properties that the Session code stored in the
                // the xhr that need to persist across the 2 requests made by a our
                // login implementation for Form auth
                xhr.pdsession = oldXHR.pdsession;
                xhr._isAsync = oldXHR._isAsync;
                xhr._deferred = oldXHR._deferred;  // special for JSDOSession 
                xhr._jsdosession = oldXHR._jsdosession;  // special for JSDOSession 

                xhr.open('POST', theSession.serviceURI + "/static/auth/j_spring_security_check",xhr._isAsync);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.setRequestHeader("Cache-Control", "max-age=0");
                // set X-CLIENT-PROPS header
                setRequestHeaderFromContextProps(theSession, xhr);

                _addWithCredentialsAndAccept(xhr, "application/json");

                try {

                    // Note: this gives a developer a way to change certain aspects of how we do the 
                    // form-based login, but we will still be assuming that we are going directly to
                    // j_spring_security_check and including credentials in the body. They really should not
                    // try to change that.
                    //
                    if (typeof theSession.onOpenRequest === 'function') {
                        var cbparams = {
                            "xhr": xhr,
                            "verb": "POST",
                            "uri": theSession.serviceURI + "/static/auth/j_spring_security_check",
                            "async": xhr._isAsync,
                            "formPreTest": false,
                            "session": theSession
                        };
                        theSession.onOpenRequest(cbparams);
                        xhr = cbparams.xhr;
                    }

                    if (xhr._isAsync) {
                        xhr.onreadystatechange = theSession._onReadyStateChangeGeneric;
                        xhr.onResponseFn = theSession._afterFormLogin;
                        xhr.onResponseProcessedFn = theSession._loginComplete;
                    }

                    // j_username=username&j_password=password&submit=Submit
                    xhr.send("j_username=" + args.uname + "&j_password=" + args.pw + "&submit=Submit");
                }
                catch (e) {
                    setLoginResult(progress.data.Session.LOGIN_GENERAL_FAILURE, theSession);
                    setLoginHttpStatus(xhr.status, theSession);
                    // null the temporary credentials variables
                    unameSave = null;
                    pwSave = null;
                    throw e;
                }

            }

            if (xhr._isAsync && !needAuth) {
                xhr.onResponseProcessedFn = theSession._loginComplete;
                return theSession._afterFormLogin(xhr);
            }
            if (!xhr._isAsync) {
                return theSession._afterFormLogin(xhr);
            }

        }

        this._afterFormLogin = function (xhr) {
            // check what we got
            var theSession = xhr.pdsession;
            var params = {
                "session": theSession,
                "xhr": xhr,
                "statusFromjson": null
            };
            var contentType = xhr.getResponseHeader("Content-Type");

            if (contentType && contentType.indexOf("application/json") >= 0) {
                handleJSONLoginResponse(params);
                if (!params.statusFromjson) {
                    throw new Error(
                        "Internal OpenEdge Mobile client error handling login response. HTTP status: " + 
                        xhr.status + ".");
                }
                else {
                    setLoginHttpStatus(params.statusFromjson, theSession);
                }
            }
            else {
                if (xhr.status === 200) {
                    // Was the response actually the login failure page or the login page itself (in case
                    // the appSecurity config file sets the login failure url so the server sends the login
                    // page again)? If so, call it an error because the credentials apparently failed to be
                    // authenticated
                    if (_gotLoginFailure(xhr) || _gotLoginForm(xhr)) {
                        setLoginHttpStatus(401, theSession);
                    }
                    else {
                        setLoginHttpStatus(xhr.status, theSession);
                    }
                }
            }

            return theSession._processLoginResult(xhr);
        };


        this._processLoginResult = function (xhr) {
            /* OK, one way or another, by hook or by crook, the Session object's loginHttpStatus
             * has been set to the value that indicates the real outcome of the
             * login, after adjusting for form-based authentication and anything
             * else. At this point, it should be just a matter of examining
             * this.loginHttpStatus, using it to set this.loginResult, maybe doing
             * some other work appropriate to the outcome of the login, and returning
             * this.loginResult.
             */
            var pdsession = xhr.pdsession;
                
            setLoginHttpStatus(xhr.status, xhr.pdsession);

            if (pdsession.loginHttpStatus === 200) {
                setLoginResult(progress.data.Session.LOGIN_SUCCESS, pdsession);
                setRestApplicationIsOnline(true);
                setUserName(unameSave, pdsession);
                _password = pwSave;
                pdsession._saveClientContextId(xhr);
                storeAllSessionInfo();  // save info to persistent storage 
                
                var pingTestArgs = {
                    pingURI: null, async: true, onCompleteFn: null,
                    fireEventIfOfflineChange: true, onReadyStateFn: pdsession._pingtestOnReadyStateChange
                };
                pingTestArgs.pingURI = pdsession._makePingURI();
                pdsession._sendPing(pingTestArgs);  // see whether the ping feature is available
            }
            else {
                if (pdsession.loginHttpStatus == 401) {
                    setLoginResult(progress.data.Session.LOGIN_AUTHENTICATION_FAILURE, pdsession);
                }
                else {
                    setLoginResult(progress.data.Session.LOGIN_GENERAL_FAILURE, pdsession);
                }
            }
            setLastSessionXHR(xhr, pdsession);
            updateContextPropsFromResponse(pdsession, xhr);

            // null the temporary credentials variables
            unameSave = null;
            pwSave = null;
            if (xhr._iosTimeOutExpired) {
                throw new Error( progress.data._getMsgText("jsdoMSG047", "login") );
            }

            // return loginResult even if it's an async operation -- the async handler
            // (e.g., onReadyStateChangeGeneric) will just ignore
            return pdsession.loginResult;
        };


        this._loginComplete = function (pdsession, result, errObj, xhr) {
            pdsession.trigger("afterLogin", pdsession, result, errObj, xhr);
        };


        /* logout
         *
         */
        this.logout = function (args) {
            var isAsync = false,
                errorObject = null,
                xhr,
                deferred,
                jsdosession,
                params;

            if (this.loginResult !== progress.data.Session.LOGIN_SUCCESS && this.authenticationModel) {
                throw new Error("Attempted to call logout when there is no active session.");
            }

            if (typeof(args) === 'object') {
                isAsync = args.async;
                if (isAsync && (typeof isAsync !== 'boolean')) {
                    throw new Error( progress.data._getMsgText("jsdoMSG033", 
                                                               "Session", 
                                                               'logout', 
                                                               'The async argument was invalid.'));
                }
                /* Special for JSDOSession: if this method was called by a JSDOSession object, it passes
                    deferred and jsdosession and we need to eventually attach them to the XHR we use 
                    so that the promise created by the JSDOSession will work correctly
                */ 
                deferred = args.deferred;
                jsdosession = args.jsdosession;                    
            }

            xhr = new XMLHttpRequest();
            xhr.pdsession = this;
            try {
                /* logout when auth model is anonymous is a no-op on the server side 
                   (but we need to set _jsdosession and _deferred anyway to amke promise work
                    if logout was called by a JSDOSession) */
                xhr._jsdosession = jsdosession;  // in case the caller is a JSDOSession
                xhr._deferred = deferred;  // in case the caller is a JSDOSession
                if (this.authenticationModel === progress.data.Session.AUTH_TYPE_FORM ||
                    this.authenticationModel === progress.data.Session.AUTH_TYPE_BASIC) {
                    if (isAsync) {
                        xhr.onreadystatechange = this._onReadyStateChangeGeneric;
                        xhr.onResponseFn = this._processLogoutResult;
                        xhr.onResponseProcessedFn = this._logoutComplete;
                    }
                    
                    
                    xhr.open('GET', this.serviceURI + "/static/auth/j_spring_security_logout", isAsync);

                    /* instead of calling _addWithCredentialsAndAccept, we code the withCredentials
                     * and setRequestHeader inline so we can do it slightly differently. That
                     * function deliberately sets the request header inside the try so we don't
                     * run into a FireFox oddity that would give us a successful login and then
                     * a failure on getCatalog (see the comment on that function). On logout,
                     * however, we don't care -- just send the Accept header so we can get a 200
                     * response
                     */
                    try {
                        xhr.withCredentials = true;
                    }
                    catch (e) {
                    }

                    xhr.setRequestHeader("Accept", "application/json");
                    
                    // set X-CLIENT-PROPS header
                    setRequestHeaderFromContextProps(this, xhr);

                    if (typeof this.onOpenRequest === 'function') {
                        setLastSessionXHR(xhr, this);
                        params = {
                            "xhr": xhr,
                            "verb": "GET",
                            "uri": this.serviceURI + "/static/auth/j_spring_security_logout",
                            "async": false,
                            "formPreTest": false,
                            "session": this
                        };
                        this.onOpenRequest(params);
                        xhr = params.xhr;
                    }

                    setLastSessionXHR(xhr, this);
                    xhr.send();
                }
                else {
                    xhr._anonymousLogoutOK = true;
                }
            }
            catch (e) {
                this._reinitializeAfterLogout(this, false);
                throw e;
            }

            if (!isAsync) {
                try {
                    this._processLogoutResult(xhr);
                }
                catch (e) {
                    throw e;
                }
            }

            if (isAsync && this.authenticationModel === progress.data.Session.AUTH_TYPE_ANON) {
                // fake async for Anonymous -- fire afterLogout event
                try {
                    this._processLogoutResult(xhr);
                }
                catch (e) {
                    errorObject = e;
                }
                this._logoutComplete(this, null, errorObject, xhr);
            }

        };

        this._logoutComplete = function (pdsession, result, errorObject, xhr) {
            // ignore result, it doesn't apply to logout -- is probably null or GENERAL_FAILURE
            // we include it so onReadyStateChangeGeneric calls this correctly
            pdsession.trigger("afterLogout", pdsession, errorObject, xhr);
        };

        this._processLogoutResult = function (xhr) {
            var logoutSucceeded;
            var pdsession = xhr.pdsession;
            var basicStatusOK = false;

            if (xhr._anonymousLogoutOK) {
                logoutSucceeded = true;
            }
            else if (xhr.status !== 200) {
                /* Determine whether an error returned from the server is really an error
                 */
                if (pdsession.authenticationModel === progress.data.Session.AUTH_TYPE_BASIC) {
                    /* If the Auth model is Basic, we probably got back a 404 Not found.
                     * But that's OK, because logout from Basic is meaningless on the
                     * server side unless it happens to be stateful, which is the only
                     * reason we even try calling j_spring_security_logout
                     */
                    if (xhr.status === 404) {
                        logoutSucceeded = true;
                    }
                    else {
                        logoutSucceeded = false;
                        throw new Error("Error logging out, HTTP status = " + xhr.status);
                    }
                }
                else {
                    // for Form auth, any error on logout is an error
                    logoutSucceeded = false;

            // page refresh - we should call _reinitializeAfterLogout, or do something, so that 
            // caller can try logging in again (this is not a problem specific to page refresh,
            // but the case of a page refresh after a server has gone down emphasizes it)

                    throw new Error("Error logging out, HTTP status = " + xhr.status);                    
                }
            }
            else {
                logoutSucceeded = true;
            }

            updateContextPropsFromResponse(pdsession, xhr);
            pdsession._reinitializeAfterLogout(pdsession, logoutSucceeded);
        };

        this._reinitializeAfterLogout = function (pdsession, success) {
            setLoginResult(null, pdsession);
            setLoginHttpStatus(null, pdsession);
            setClientContextID(null, pdsession);
            setUserName(null, pdsession);
            _password = null;

            if (success) {
                setRestApplicationIsOnline(false);
                setOepingAvailable(false);
                setPartialPingURI(defaultPartialPingURI);
                setLastSessionXHR(null, pdsession);
                clearTimeout(_timeoutID);   //  stop autopinging 
            }
        };


        /* addCatalog
         *
         */
        this.addCatalog = function () {
            var catalogURI,
                catalogUserName,
                catalogPassword,
                isAsync = false,
                xhr,
                deferred,
                jsdosession,
                iOSBasicAuthTimeout,
                catalogIndex;

            // check whether the args were passed in a single object. If so, copy them
            // to the named arguments and a variable
            if (arguments.length > 0) {
                if (typeof(arguments[0]) === 'object') {
                    
                    // check whether OK to get catalog if offline
                    if ( !arguments[0].offlineAddCatalog) {
                        if (this.loginResult !== 
                              progress.data.Session.LOGIN_SUCCESS && this.authenticationModel) {
                            throw new Error("Attempted to call addCatalog when there is no active session.");
                        }
                    }
                        
                    catalogURI = arguments[0].catalogURI;
                    if (!catalogURI || (typeof catalogURI != 'string')) {
                        throw new Error(progress.data._getMsgText("jsdoMSG033", 'Session', 'addCatalog', 
                                                    'The catalogURI argument was missing or invalid.'));
                    }
                    catalogUserName = arguments[0].userName;
                    if (catalogUserName && (typeof catalogUserName != 'string')) {
                        throw new Error(progress.data._getMsgText("jsdoMSG033", 'Session', 'addCatalog', 
                            'The catalogUserName argument was invalid.'));
                    }
                    catalogPassword = arguments[0].password;
                    if (catalogPassword && (typeof catalogPassword != 'string')) {
                        throw new Error(progress.data._getMsgText("jsdoMSG033", 'Session', 'addCatalog', 
                            'The catalogPassword argument was invalid.'));
                    }
                    isAsync = arguments[0].async;
                    if (isAsync && (typeof isAsync != 'boolean')) {
                        throw new Error(progress.data._getMsgText("jsdoMSG033", 'Session', 'addCatalog', 
                            'The async argument was invalid.'));
                    }
                    iOSBasicAuthTimeout = arguments[0].iOSBasicAuthTimeout;
                    if ( typeof iOSBasicAuthTimeout == 'undefined' ) {
                        iOSBasicAuthTimeout = defaultiOSBasicAuthTimeout;
                    }
                    else if (iOSBasicAuthTimeout && (typeof iOSBasicAuthTimeout != 'number')) {
                        throw new Error(progress.data._getMsgText("jsdoMSG033", 'Session', 'addCatalog', 
                            'The iOSBasicAuthTimeout argument was invalid.'));
                    }
                    
                    /* Special for JSDOSession: if this method was called by a JSDOSession object, it passes
                        deferred, jsdosession, and catalogIndex and we need to eventually attach them to the 
                        XHR we use so that the promise created by the JSDOSession will work correctly
                    */ 
                    deferred = arguments[0].deferred;
                    jsdosession = arguments[0].jsdosession;
                    catalogIndex = arguments[0].catalogIndex;
                }
                else {
                    catalogURI = arguments[0];
                    if (typeof catalogURI != 'string') {
                      throw new Error("First argument to Session.addCatalog must be the URL of the catalog.");
                    }
                    catalogUserName = arguments[1];
                    if (catalogUserName && (typeof catalogUserName != 'string')) {
                      throw new Error("Second argument to Session.addCatalog must be a user name string.");
                    }
                    catalogPassword = arguments[2];
                    if (catalogPassword && (typeof catalogPassword != 'string')) {
                      throw new Error("Third argument to Session.addCatalog must be a password string.");
                    }
                }
            }
            else {
                throw new Error("Session.addCatalog is missing its first argument, the URL of the catalog.");
            }

            if (!catalogUserName) {
                catalogUserName = this.userName;
            }

            if (!catalogPassword) {
                catalogPassword = _password;
            }

            xhr = new XMLHttpRequest();
            xhr.pdsession = this;
            xhr._catalogURI = catalogURI;

            // for now we don't support multiple version of the catalog across sessions
            if (progress.data.ServicesManager.getSession(catalogURI) !== undefined) {
                if (isAsync) {
                    /*
                        Attempt to get the event to fire AFTER this call returns ASYNC_PENDING
                        (and if the method was called from a JSDOSession, create an xhr to communicate 
                         information related to promises back to its afterAddCatalog handler). Note that 
                         the xhr is never used to make a request, it just carries data in the way 
                         expected by the handler)
                     */
                    // in case the caller is a JSDOSession 
                    xhr._jsdosession = jsdosession;
                    xhr._deferred = deferred;
                    xhr._catalogIndex = catalogIndex;
                    
                    setTimeout(this._addCatalogComplete, 10, this, 
                        progress.data.Session.CATALOG_ALREADY_LOADED, null, xhr );
                    return progress.data.Session.ASYNC_PENDING;
                }
                return progress.data.Session.CATALOG_ALREADY_LOADED;
            }

            this._setXHRCredentials(xhr, 'GET', catalogURI, catalogUserName, catalogPassword, isAsync);
            // Note that we are not adding the CCID to the URL or as a header, because the catalog may not
            // be stored with the REST app and even if it is, the AppServer ID shouldn't be relevant

            /* This is here as much for CORS situations as the possibility that there might be an out of date
             * cached version of the catalog. The CORS problem happens if you have accessed the catalog
             * locally and then run an app on a different server that requests the catalog. 
             * Your browser already has the catalog,
             * but the request used to get it was a non-CORS request and the browser will
             * raise an error
             */
            xhr.setRequestHeader("Cache-Control", "no-cache");
            xhr.setRequestHeader("Pragma", "no-cache");
            // set X-CLIENT-PROPS header
            setRequestHeaderFromContextProps(this, xhr);
            if (this.authenticationModel === progress.data.Session.AUTH_TYPE_FORM) {
                _addWithCredentialsAndAccept(xhr, "application/json");
            }

            if (isAsync) {
                xhr.onreadystatechange = this._onReadyStateChangeGeneric;
                xhr.onResponseFn = this._processAddCatalogResult;
                xhr.onResponseProcessedFn = this._addCatalogComplete;
                
                if (    this.authenticationModel === progress.data.Session.AUTH_TYPE_BASIC
                     && isUserAgentiOS
                     && iOSBasicAuthTimeout ) { 
                    xhr._requestTimeout = setTimeout(  function (){
                                                    clearTimeout(xhr._requestTimeout);
                                                    xhr._iosTimeOutExpired = true;
                                                    xhr.abort();
                                                }, 
                                                iOSBasicAuthTimeout);
                }                
                
                // in case the caller is a JSDOSession
                xhr._jsdosession = jsdosession;
                xhr._deferred = deferred;  
                xhr._catalogIndex = catalogIndex;
            }

            try {
                if (typeof this.onOpenRequest === 'function') {
                    setLastSessionXHR(xhr, this);
                    var params = {
                        "xhr": xhr,
                        "verb": "GET",
                        "uri": catalogURI,
                        "async": false,
                        "formPreTest": false,
                        "session": this
                    };
                    this.onOpenRequest(params);
                    xhr = params.xhr;
                }

                setLastSessionXHR(xhr, this);
                xhr.send(null);
            }
            catch (e) {
                throw new Error("Error retrieving catalog '" + catalogURI + "'.\n" + e.message);
            }
            if (isAsync) {
                return progress.data.Session.ASYNC_PENDING;
            }
            else {
                return this._processAddCatalogResult(xhr);
            }
        };

        this._processAddCatalogResult = function (xhr) {
            var _catalogHttpStatus = xhr.status;
            var theSession = xhr.pdsession;
            var servicedata;
            var catalogURI = xhr._catalogURI,
                serviceURL;

            setLastSessionXHR(xhr, theSession);
            updateContextPropsFromResponse(theSession, xhr);
            
            if ((_catalogHttpStatus == 200) || (_catalogHttpStatus === 0) && xhr.responseText) {
                servicedata = theSession._parseCatalog(xhr);
                try {
                    progress.data.ServicesManager.addCatalog(servicedata, theSession);
                }
                catch (e) {
                    if (progress.data.ServicesManager.getSession(catalogURI) !== undefined) {
                        /* this failed because the catalog had already been loaded, but the code
                           in addCatalog did not catch that, probably because we are executing
                           the JSDOSession addCatalog with multiple catalogURIs passed, and 2 
                           are the same
                         */
                        return progress.data.Session.CATALOG_ALREADY_LOADED;
                    }
                    // different catalogs, with same resource name
                    throw new Error("Error processing catalog '" + catalogURI + "'. \n" + e.message);
                }
                // create a mobile service object and add it to the Session's array of same
                for (var i = 0; i < servicedata.length; i++) {
                    serviceURL = theSession._prependAppURL(servicedata[i].address);
                    pushService(new progress.data.MobileServiceObject(
                            {
                                name: servicedata[i].name,
                                uri: serviceURL
                            }),
                        theSession);

                    if (servicedata[i].settings
                        && servicedata[i].settings.useXClientProps
                        && !theSession.xClientProps) {
                        console.warn("Catalog warning: Service settings property 'useXClientProps' " +
                            "is true but 'xClientProps' property has not been set.");
                    }
                }
                pushCatalogURIs(catalogURI, theSession);
                progress.data.ServicesManager.addSession(catalogURI, theSession);
            }
            else if (_catalogHttpStatus == 401) {
                return progress.data.Session.AUTHENTICATION_FAILURE;
            }
            else if (xhr._iosTimeOutExpired) { 
                throw new Error( progress.data._getMsgText("jsdoMSG047", "addCatalog") );
            }
            else {
                throw new Error("Error retrieving catalog '" + catalogURI + 
                    "'. Http status: " + _catalogHttpStatus + ".");
            }

            return progress.data.Session.SUCCESS;
        };

        this._addCatalogComplete = function (pdsession, result, errObj, xhr) {
            pdsession.trigger("afterAddCatalog", pdsession, result, errObj, xhr);
        };


        /*
         *  ping -- determine whether the Mobile Web Application that the Session object represents
         *  is available, which includes determining whether its associated AppServer is running
         *  Also determine whether the Mobile services managed by this Session object are available
         *  (which means simply that they're known to the Mobile Web Application)
         *  (Implementation note: be sure that this Session object's "connected"
         *  property retains its current value until the end of this function, where
         *  it gets updated, if necessary, after calling _isOnlineStateChange
         *
         *  Signatures :
         *  @param arg
         *  There are 2 signatures --
         *   -  no argument -- do an async ping of the Session's Mobile Web application. The only effect
         *                     of the ping will be firing an offline or an online event, if appropriate
         *                     The ping function itself will return false to the caller
         *   -  object argument -- the object's properties provide the input args. They are all
         *          optional (if for some reason the caller passes an object that has no properties, it's
         *          the same as passing no argument at all). The properties may be:
         *            async -- tells whether to execute the ping asynchronously (which is the default)
         *            onCompleteFn -- if async, this will be called when response returns
         *            doNotFireEvent -- used internally, controls whether the ping method causes an offline
         *                 or online event to be fired if there has been a change (the default is that it
         *                 does, but our Session._checkServiceResponse() sets this to true so that it can
         *                 control the firing of the event)
         *            offlineReason -- if present, and if the ping code discovers that teh server is offline,
         *                 the ping code will set this with its best guess 
         *                 as to the reason the server is offline
         */
        this.ping = function (args) {
            var pingResult = false;
            var pingArgs = {
                pingURI: null, async: true, onCompleteFn: null,
                fireEventIfOfflineChange: true, onReadyStateFn: this._onReadyStateChangePing,
                offlineReason: null
            };

            if (this.loginResult !== progress.data.Session.LOGIN_SUCCESS) {
                throw new Error("Attempted to call ping when not logged in.");
            }
            
            if (args) {
                if (args.async !== undefined) {
                    // when we do background pinging (because pingInterval is set),
                    // we pass in an arg that is just an object that has an async property,
                    // set to true. This can be expanded to enable other kinds of ping calls
                    // to be done async (so that application developers can do so, if we decide
                    // to support that)
                    pingArgs.async = args.async;
                }

                if (args.doNotFireEvent !== undefined) {
                    pingArgs.fireEventIfOfflineChange = !args.doNotFireEvent;
                }

                if (args.onCompleteFn && (typeof args.onCompleteFn) == 'function') {
                    pingArgs.onCompleteFn = args.onCompleteFn;
                }
                /* Special for JSDOSession: if this method was called by a JSDOSession object, it passes
                    deferred and jsdosession and we need to eventually attach them to the XHR we use so that
                    the promise created by the JSDOSession will work correctly
                */ 
                pingArgs.deferred = args.deferred;
                pingArgs.jsdosession = args.jsdosession;

            }


            /* Ping the Mobile Web Application (this will also determine whether AppServer is available)
             * Call _processPingResult() if we're synchronous, otherwise the handler for the xhr.send()
             * will call it
             */
            pingArgs.pingURI = myself._makePingURI();
            myself._sendPing(pingArgs);
            if (!pingArgs.async) {
                if (pingArgs.xhr) {
                    pingResult = myself._processPingResult(pingArgs);
                    if (args.offlineReason !== undefined) {
                        args.offlineReason = pingArgs.offlineReason;
                    }
                }
                else {
                    pingResult = false; // no xhr returned from _sendPing, something must have gone wrong
                }
                if ( args.xhr !== undefined ) {
                    // if it's a sync ping, return the xhr if caller indicates they want it
                    // (there's almost guaranteed to be one, even if the ping was never sent
                    // if for some reason there isn't, we give them the null or undefined we ended up with)
                    args.xhr = pingArgs.xhr;  
                }
            }
            // else it's async, deliberately returning false 
            // so developer not misled into thinking the ping succeeded

            return pingResult;
        };


        // "protected" Functions

        /*
         * given a value of true or false for being online for the Mobile Web Application
         * managed by this Session object, determine whether that changes the current
         * state of being offline or online.
         * Returns true if the input state is a change from the current state
         *
         * Signature :
         * @param isOnline  Required. True to determine whether online is a state change, false to
         *                  determine whether offline constitutes a state change. Boolean.
         *
         */
        this._isOnlineStateChange = function (isOnline) {
            var stateChanged = false;

            if (isOnline && !(this.connected)) {
                stateChanged = true;
            }
            else if (!isOnline && ( this.connected )) {
                stateChanged = true;
            }

            return stateChanged;
        };


        /*
         * given information about the response from a request made to a service,
         * do the following:
         *
         * determine whether the online status of the Session has changed, and
         * set the Session's Connected property accordingly
         * if the Session's online status has changed, fire the appropriate event
         *
         * Signature :
         * @param xhr      Required. The xhr that was used to make the request. Object
         * @param success  Required. True if caller regards the request as having succeeded. Boolean
         * @param request  Required. The JSDO request object created for making the request. Object.
         *
         */
        this._checkServiceResponse = function (xhr, success, request) {
            var offlineReason = null,
                wasOnline = this.connected;
            updateContextPropsFromResponse(this, xhr);

            /* first of all, if there are no subscriptions to offline or online events, don't
             * bother -- we don't want to run the risk of messing things up by calling ping
             * if the app developer isn't interested (especially because that may mean that
             * ping isn't enabled on the server, anyway)
             */
            if (!this._events) {
                return;
            }
            var offlineObservers = this._events["offline"] || [];
            var onlineObservers = this._events["online"] || [];
            if ((offlineObservers.length === 0) && (onlineObservers.length === 0)) {
                return;
            }

            /* even though this function gets called as a result of trying to
             * contact the server, don't bother to change anything if we already
             * know that the device (or user agent, or client machine) is offline.
             * We can't assume anything about the state of the server if we can't
             * even get to the internet from the client
             */

            // if the call to the server was a success, we will assume we are online,
            // both server and device
            if (success) {
                setRestApplicationIsOnline(true);
                setDeviceIsOnline(true);  // presumably this is true (probably was already true)
            }
            else {
                /* Request failed, determine whether it's because server is offline
                 * Do this even if the Session was already in an offline state, because
                 * we need to determine whether the failure was due to still being
                 * offline, or whether it's now possible to communicate with the
                 * server but the problem was something else.
                 */

                if (deviceIsOnline) {
                    /* ping the server to get better information on whether this is an offline case
                     * NB: synchronous ping for simplicity, maybe should consider async so as not
                     * to potentially freeze UI
                     */
                    var localPingArgs = {
                        doNotFireEvent: true,  // do in this fn so we have the request
                        offlineReason: null,
                        async: false
                    };
                    if (!(myself.ping(localPingArgs) )) {
                        offlineReason = localPingArgs.offlineReason;
                        setRestApplicationIsOnline(false);
                    }
                    else {
                        // ping returned true, so even though the original request failed,
                        // we are online and the failure must have been due to something else
                        setRestApplicationIsOnline(true);
                    }
                }
                // else deviceIsOnline was already false, so the offline event should already have
                // been fired for that reason and there is no need to do anything else
            }

            if (wasOnline && !this.connected) {
                this.trigger("offline", this, offlineReason, request);
            }
            else if (!wasOnline && this.connected) {
                this.trigger("online", this, request);
            }
        };

        /* Decide whether, on the basis of information returned by a server request, the
         * Mobile Web Application managed by this Session object is online, where online
         * means that the ping response was a 200 and, IF the body of the response contains
         * JSON with an AppServerStatus property, that AppServerStatus Status property has
         * a pingStatus property set to true
         *     i.e., the body has an AppServerStatus.PingStatus set to true
         * (if the body doesn't contain JSON with an AppServerStatus, we use just the HTTP
         * response status code to decide)
         * 
         * Returns:  true if the response meets the above conditions, false if it doesn't
         *   
         * Parameters:
         *   args, with properties:
         *      xhr - the XMLHttpRequest used to make the request
         *      offlineReason - if the function determines that the app is offline,
         *                      it sets offlineReason to the reason for that decision,
         *                      for the use of the caller
         *      fireEventIfOfflineChange - if true, the function fires an offline or online
         *                      event if there has been a change (i.e., the online state determined 
         *                      by the function is different from what it had been when the function
         *                      began executing)
         *      usingOepingFormat - OPTIONAL. The function's default assumption is that the value
         *                      of the session's internal oepingAvailable variable indicates whether the
         *                      the response body will be in the format used by the OpenEdge oeping service.
         *                      A caller can override this assumption by using this property to true or false.
         *                     (the isAuthorized code sets this to false because it doesn't use oeping 
         *                     but does call this function)
         */
        this._processPingResult = function (args) {
            var xhr = args.xhr,
                pingResponseJSON,
                appServerStatus = null,
                wasOnline = this.connected,
                connectedBeforeCallback,
                assumeOepingFormat;
                
            if (args.hasOwnProperty('usingOepingFormat')) {
                assumeOepingFormat = args.usingOepingFormat;
            } else {
                assumeOepingFormat = oepingAvailable;
            }


            /* first determine whether the Web server and the Mobile Web Application (MWA)
             * are available
             */
            if (xhr.status >= 200 && xhr.status < 300) {
                updateContextPropsFromResponse(this, xhr);
                if (assumeOepingFormat) {
                    try {
                        pingResponseJSON = JSON.parse(xhr.responseText);
                        appServerStatus = pingResponseJSON.AppServerStatus;
                    }
                    catch (e) {
                        /* We got a successful response from calling our ping URI, but it
                         * didn't return valid JSON. If we think that the oeping REST API
                         * is available on the server (so we should have gotten valid
                         * json), log this to the console.
                         *
                         */
                        console.error("Unable to parse ping response.");
                    }
                }
                setRestApplicationIsOnline(true);
            }
            else {
                if (deviceIsOnline) {
                    if (xhr.status === 0) {
                        args.offlineReason = progress.data.Session.SERVER_OFFLINE;
                        setRestApplicationIsOnline(false);
                    }
                    else if ((xhr.status === 404) || (xhr.status === 410)) {
                        /* if we get a 404, it means the Web server is up, but it
                         * can't find the resource we requested (either _oeping or
                         * the login target), therefore the Mobile Web application
                         * must be unavailable (410 is Gone)
                         */
                        args.offlineReason = progress.data.Session.WEB_APPLICATION_OFFLINE;
                        setRestApplicationIsOnline(false);
                    }
                    else {
                        /* There's some error, but we can't say for sure that it's because
                         * the Web application is unavailable. May be an authentication problem,
                         * internal server error, or for some reason our ping request was
                         * invalid (unlikely to happen if it previously succeeded).
                         * In particular, if the server uses Form authentication, it
                         * may have come back online but now the session id
                         * is no longer valid.
                         */
                        setRestApplicationIsOnline(true);
                    }
                }
                else {
                    args.offlineReason = progress.data.Session.DEVICE_OFFLINE;
                }
            }

            // is the AppServer online? appServerStatus will be non-null only
            // if the ping request returned 200, meaning the other things are OK
            // (connection to server, Tomcat, Mobile Web application)
            if (appServerStatus) {
                if (appServerStatus.PingStatus === "false") {
                    args.offlineReason = progress.data.Session.APPSERVER_OFFLINE;
                    setRestApplicationIsOnline(false);
                }
                else {
                    setRestApplicationIsOnline(true);
                }
            }

            /* We call any async ping callback handler and then, after that returns, fire an
               offline or online event if necessary. 
               When deciding whether to fire an event, the responsibility of this _processPingResult()
               function is to decide about the event on the basis of the data returned from the ping
               that it is currently processing. Therefore, since the ping callback that is just about
               to be called could change the outcome of the event decision (for example, if the handler
               calls logout(), thus setting Session.connected to false)), we save the current value of
               Session.connected and use that saved value to decide about the event after the ping 
               handler returns.
               (If the application programmer wants to get an event fired as a result of something
               that happens in the ping handler, they should call a ping() *after* that. 
             */
            connectedBeforeCallback = this.connected;

            if ((typeof xhr.onCompleteFn) == 'function') {
                xhr.onCompleteFn({
                    pingResult: this.connected,
                    xhr: xhr,
                    offlineReason: args.offlineReason
                });
            }

            // decide whether to fire an event, and if so do it
            if (args.fireEventIfOfflineChange) {
                if (wasOnline && !connectedBeforeCallback) { 
                    myself.trigger("offline", myself, args.offlineReason, null);
                }
                else if (!wasOnline && connectedBeforeCallback) {
                    myself.trigger("online", myself, null);
                }
            }

            return this.connected;
        };


        this._onReadyStateChangePing = function () {
            var xhr = this;
            var args;

            if (xhr.readyState == 4) {
                args = {
                    xhr: xhr,
                    fireEventIfOfflineChange: true,
                    offlineReason: null
                };
                myself._processPingResult(args);
                if (_pingInterval > 0) {
                    _timeoutID = setTimeout(myself._autoping, _pingInterval);
                }
            }
        };

        this._pingtestOnReadyStateChange = function () {
            var xhr = this;

            if (xhr.readyState == 4) {
                var foundOeping = false;
                if (xhr.status >= 200 && xhr.status < 300) {
                    foundOeping = true;
                }
                else {
                    setPartialPingURI(myself.loginTarget);
                    console.warn("Default ping target not available, will use loginTarget instead.");
                }
                setOepingAvailable(foundOeping);
                
                // If we're here, we've just logged in. If pingInterval has been set, we need
                // to start autopinging
                if (_pingInterval > 0) {
                    _timeoutID = setTimeout(myself._autoping, _pingInterval);
                }
            }
        };

        /*
         * args: pingURI
         *       async
         *       onCompleteFn     used only if async is true
         *
         *  (deliberately not catching thrown error)
         */
        this._sendPing = function (args) {
            var xhr = new XMLHttpRequest();
            try {
                this._setXHRCredentials(xhr, "GET", args.pingURI, this.userName, _password, args.async);
                if (args.async) {
                    xhr.onreadystatechange = args.onReadyStateFn;
                    xhr.onCompleteFn = args.onCompleteFn;
                    xhr._jsdosession = args.jsdosession;  // in case the caller is a JSDOSession
                    xhr._deferred = args.deferred;  // in case the caller is a JSDOSession
                }
                xhr.setRequestHeader("Cache-Control", "no-cache");
                xhr.setRequestHeader("Pragma", "no-cache");
                // set X-CLIENT-PROPS header
                setRequestHeaderFromContextProps(this, xhr);
                if (this.authenticationModel === progress.data.Session.AUTH_TYPE_FORM) {
                    _addWithCredentialsAndAccept(xhr, 
                        "application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
                }
                xhr.send(null);
            }
            catch (e) {
                args.error = e;
            }
            
            args.xhr = xhr;
        };

        this._makePingURI = function () {
            var pingURI = this.serviceURI + partialPingURI;
            // had caching problem with Firefox in its offline mode
            if (progress.data.Session._useTimeStamp) {
                pingURI = this._addTimeStampToURL(pingURI);  
            }
            return pingURI;
        };


        /*
         *  autoping -- callback
         */
        this._autoping = function () {
            myself.ping({async: true});
        };


        /*   _setXHRCredentials  (intended for progress.data library use only)
         *  set credentials as needed, both via the xhr's open method and setting the
         *  Authorization header directly
         */
        this._setXHRCredentials = function (xhr, verb, uri, userName, password, async) {

            // note that we do not set credentials if userName is null. 
            // Null userName indicates that the developer is depending on the browser to
            // get and manage the credentials, and we need to make sure we don't interfere with that
            if (userName
                && this.authenticationModel === progress.data.Session.AUTH_TYPE_BASIC) {

                // See the comment at the definition of the canPassCredentialsToOpen() function
                // for why we pass credentials to open() in some cases but not others. (If we're not using
                // Basic auth, we never pass credentials)
                if (canPassCredentialsToOpen()) {
                    xhr.open(verb, uri, async, userName, password);
                }
                else {
                    xhr.open(verb, uri, async);
                }
                
                // set Authorization header
                var auth = _make_basic_auth(userName, password);
                xhr.setRequestHeader('Authorization', auth);
            }
            else {
                xhr.open(verb, uri, async);
            }
        };

        /*   _addCCIDtoURL  (intended for progress.data library use only)
         *  Add the Client Context ID being used by a session on an OE REST application, if we have
         *  previously stored one from a response from the server
         */
        this._addCCIDtoURL = function (url) {
            var urlPart1,
                urlPart2,
                jsessionidStr,
                index;
                
            if (this.clientContextId && (this.clientContextId !== "0")) {
                // Should we test protocol, 
                // host and port in addition to path to ensure that jsessionid is only sent
                // when request applies to the REST app (it might not be if the catalog is somewhere else)
                if (url.substring(0, this.serviceURI.length) == this.serviceURI) {
                    jsessionidStr = ";" + "JSESSIONID=" + this.clientContextId;
                    index = url.indexOf('?');
                    if (index == -1) {
                        url += jsessionidStr;  // just append the jsessionid path parameter to the path
                    }
                    else {
                        // insert jsessionid path parameter before the first query parameter
                        urlPart1 = url.substring(0, index);
                        urlPart2 = url.substring(index);
                        url = urlPart1 + jsessionidStr + urlPart2;
                    }
                }
            }
            return url;
        };

        var SEQ_MAX_VALUE = 999999999999999;
        /* 15 - 9 */
        var _tsseq = SEQ_MAX_VALUE;
        /* Initialized to SEQ_MAX_VALUE to initialize values. */
        var _tsprefix1 = 0;
        var _tsprefix2 = 0;

        this._getNextTimeStamp = function () {
            var seq = ++_tsseq;
            if (seq >= SEQ_MAX_VALUE) {
                _tsseq = seq = 1;
                var t = Math.floor(( Date.now ? Date.now() : (new Date().getTime())) / 10000);
                if (_tsprefix1 == t) {
                    _tsprefix2++;
                    if (_tsprefix2 >= SEQ_MAX_VALUE) {
                        _tsprefix2 = 1;
                    }
                }
                else {
                    _tsprefix1 = t;
                    Math.random(); // Ignore call to random
                    _tsprefix2 = Math.round(Math.random() * 10000000000);
                }
            }

            return _tsprefix1 + "-" + _tsprefix2 + "-" + seq;
        };

        /*
         * _addTimeStampToURL (intended for progress.data library use only)
         * Add a time stamp to the a URL to prevent caching of the request.
         * Set progress.data.Session._useTimeStamp = false to turn off.
         */
        this._addTimeStampToURL = function (url) {
            var timeStamp = "_ts=" + this._getNextTimeStamp();
            url += ((url.indexOf('?') == -1) ? "?" : "&") + timeStamp;
            return url;
        };

        /*   _saveClientContextId  (intended for progress.data library use only)
         *  If the CCID hasn't been set for the session yet, check the xhr for it and store it.
         *  (If it has been set, assume that the existing one is correct and do nothing. We could
         *   enhance this function by checking to see whether the new one matches the existing one.
         *  Not sure what to do if that's the case -- overwrite the old one? ignore the new one?
         *   Should at least log a warning or error
         */
        this._saveClientContextId = function (xhr) {
            // do this unconditionally (even if there is already a client-context-id), because
            // if basic authentication is set up such that it uses sessions, and cookies are disabled,
            // the server will generate a different session on each request and the X-CLIENT-CONTEXT-ID
            // will therefore be different
            setClientContextIDfromXHR(xhr, this);
        };

        this._parseCatalog = function (xhr) {
            var jsonObject;
            var catalogdata;

            try {
                jsonObject = JSON.parse(xhr.responseText);
                catalogdata = jsonObject.services;
            }
            catch (e) {
                console.error("Unable to parse response. Make sure catalog has correct format.");
                catalogdata = null;
            }

            return catalogdata;
        };

        /* _prependAppURL
         * Prepends the URL of the Web application 
         * (the 1st parameter passed to login, stored in this.serviceURI)
         * to whatever string is passed in. If the string passed in is an absolute URL, this function does
         * nothing except return a copy. This function ensures that the resulting URL has the correct number
         * of slashes between the web app url and the string passed in (currently that means that if what's
         * passed in has no initial slash, the function adds one)
         */
        this._prependAppURL = function (oldURL) {
            if (!oldURL) {
                /* If oldURL is null, just return the app URL. (It's not the responsibility of this
                 * function to decide whether having a null URL is an error. Its only responsibility
                 * is to prepend the App URL to whatever it gets passed 
                 * (and make sure the result is a valid URL)
                 */
                return this.serviceURI;
            }
            var newURL = oldURL;
            var pat = /^https?:\/\//i;
            if (!pat.test(newURL)) {
                if (newURL.indexOf("/") !== 0) {
                    newURL = "/" + newURL;
                }

                newURL = this.serviceURI + newURL;
            }
            return newURL;
        };


        // Functions

        // Set an XMLHttpRequest object's withCredentials attribute and Accept header,
        // using a try-catch so that if setting withCredentials throws an error it doesn't
        // interrupt execution (this is a workaround for the fact that Firefox doesn't
        // allow you to set withCredentials when you're doing a synchronous operation)
        // The setting of the Accept header is included here, and happens after the
        // attempt to set withCredentials, to make the behavior in 11.3.0 match
        // the behavior in 11.2.1 -- for Firefox, in a CORS situation, login() will
        // fail. (If we allowed the Accept header to be set, login() would succeed
        // because of that but addCatalog() would fail because no JSESSIONID would
        // be sent due to withCredentials not being true)
        function _addWithCredentialsAndAccept(xhr, acceptString) {
            try {
                xhr.withCredentials = true;
                xhr.setRequestHeader("Accept", acceptString);
            }
            catch (e) {
            }
        }


        // from http://coderseye.com/2007/how-to-do-http-basic-auth-in-ajax.html
        function _make_basic_auth(user, pw) {
            var tok = user + ':' + pw;
//        var hash = base64_encode(tok);
            var hash = btoa(tok);
            return "Basic " + hash;
        }

        /* The next 2 functions, _gotLoginForm() and _gotLoginFailure(), attempt to determine whether
         * a server response consists of
         * the application's login page or login failure page. Currently (release 11.2), this
         * is the only way we have of determining that a request made to the server that's
         * configured for form-based authentication failed due to authentication (i.e.,
         * authentication hadn't happened before the request and either invalid credentials or
         * no credentials were sent to the server). That's because, due to the fact that the browser
         * or native wrapper typically intercepts the redirect involved in an unauthenticated request
         * to a server that's using using form auth, all we see in the XHR is a success status code
         * plus whatever page we were redirected to.
         * In the future, we expect to enhance the OE REST adapter so that it will return a status code
         * indicating failure for form-based authentication, and we can reimplement these functions so
         * they check for that code rather than do the simplistic string search.
         */

        // Determines whether the content of the xhr is the login page. Assumes
        // use of a convention for testing for login page
        var loginFormIDString = "j_spring_security_check";

        function _gotLoginForm(xhr) {
            // is the response contained in an xhr actually the login page?
            return _findStringInResponseHTML(xhr, loginFormIDString);
        }

        // Determines whether the content of the xhr is the login failure page. Assumes
        // use of a convention for testing for login fail page
        var loginFailureIdentificationString = "login failed";

        function _gotLoginFailure(xhr) {
            return _findStringInResponseHTML(xhr, loginFailureIdentificationString);
        }

        // Does a given xhr contain html and does that html contain a given string?
        function _findStringInResponseHTML(xhr, searchString) {
            if (!xhr.responseText) {
                return false;
            }
            var contentType = xhr.getResponseHeader("Content-Type");

            if ((contentType.indexOf("text/html") >= 0) &&
                (xhr.responseText.indexOf(searchString) >= 0)) {
                return true;
            }

            return false;
        }

        /* sets the statusFromjson property in the params object to indicate
         * the status of a response from an OE Mobile Web application that has
         * to do with authentication (the response to a login request, or a
         * response to a request for a resource where there was an error having
         * to do with authentication */
        function handleJSONLoginResponse(params) {
            // Parse the json in the response to see whether it's the special OE REST service
            // response. If it is, check the result (which should be consistent with the status from
            // the xhr)
            var jsonObject;
            params.statusFromjson = null;
            try {
                jsonObject = JSON.parse(params.xhr.responseText);

                if (jsonObject.status_code !== undefined
                    && jsonObject.status_txt !== undefined) {
                    params.statusFromjson = jsonObject.status_code;
                }
            }
            catch (e) {
                // invalid json
                setLoginResult(progress.data.Session.LOGIN_GENERAL_FAILURE, params.session);
                setLoginHttpStatus(xhr.status, params.session);
                throw new Error("Unable to parse login response from server.");
            }

        }

        function setRequestHeaderFromContextProps(session, xhr) {
            if (session.xClientProps) {
                xhr.setRequestHeader("X-CLIENT-PROPS", session.xClientProps);
            }
            else if (session._contextProperties.contextHeader !== undefined) {
                xhr.setRequestHeader("X-CLIENT-PROPS", session._contextProperties.contextHeader);
            }
        }
        
        function updateContextPropsFromResponse(session, xhr) {
            /* determine whether the response contains an X-CLIENT_PROPS header and, if so, 
               set the Session's context
             */
            var contextString,
                context;
                
            if (xhr) {
                contextString = getResponseHeaderNoError(xhr, "X-CLIENT-PROPS");
                if (contextString) {
                    try {
                        context = JSON.parse( contextString );
                    }
                    catch(e) {
                    }
                    if (typeof context === "object") {
                        session._contextProperties.setContext( context );
                    }
                    else {
                        //{1}: A server response included an invalid {2} header.
                        throw new Error(progress.data._getMsgText("jsdoMSG123", 'Session', 'X-CLIENT-PROPS'));
                    }
                }
                else if (contextString === "") {
                    // If header is "", clear the X-CLIENT-PROPS context, 
                    session._contextProperties.setContext( {} );
                }
                // if header is absent (getResponseHeader will return null), don't change _contextProperties
            }
        }        

        
        // process constructor options and do other initialization
        
        // If a storage key (name property of a JSDOSession) was passed to the constructor, 
        // use it to try to retrieve state data from a previous JSDOSession instance that 
        // had the same name. This code was introduced to handle page refreshes, but could
        // be used for other purposes.
        if (typeof (options) === 'object') {
            var authModel,
                storedURI,
                newURI;
            
            _storageKey = options._storageKey;
            if (_storageKey) {
                if (retrieveSessionInfo(_storageKey)) {
                    authModel = retrieveSessionInfo("authenticationModel");
                    uri = retrieveSessionInfo("serviceURI");
                    newURI = options.serviceURI;
                    
                    if (newURI[newURI.length - 1] === "/") {
                        newURI = newURI.substring(0, newURI.length - 1);
                    }
                
                    if ((authModel !== options.authenticationModel) ||
                        (uri !== newURI)) {
                            clearAllSessionInfo();
                    } else {
                            setSessionInfoFromStorage(_storageKey);
                    }
                }
                // _storageKey is in essence the flag for page refresh; we are not supporting page refresh for Basic
                // auth, so clear it even if it was passed in. 
                // (But had to set and keep _storageKey until this point so that the above validation of
                // serviceURI and auth model will be done even in the case where there's a mismatch and
                // the new auth model is Basic. This statement will go away when we support page refresh with
                // Basic)
                if (options.authenticationModel === progress.data.Session.AUTH_TYPE_BASIC) {
                    _storageKey = undefined;
                }
            }
        }
        
    }; // End of Session
    progress.data.Session._useTimeStamp = true;

// Constants for progress.data.Session
    if ((typeof Object.defineProperty) == 'function') {
        Object.defineProperty(progress.data.Session, 'LOGIN_AUTHENTICATION_REQUIRED', {
            value: 0, enumerable: true
        });
        Object.defineProperty(progress.data.Session, 'LOGIN_SUCCESS', {
            value: 1, enumerable: true
        });
        Object.defineProperty(progress.data.Session, 'LOGIN_AUTHENTICATION_FAILURE', {
            value: 2, enumerable: true
        });
        Object.defineProperty(progress.data.Session, 'LOGIN_GENERAL_FAILURE', {
            value: 3, enumerable: true
        });
        Object.defineProperty(progress.data.Session, 'CATALOG_ALREADY_LOADED', {
            value: 4, enumerable: true
        });
        Object.defineProperty(progress.data.Session, 'ASYNC_PENDING', {
            value: 5, enumerable: true
        });

        Object.defineProperty(progress.data.Session, 'SUCCESS', {
            value: 1, enumerable: true
        });
        Object.defineProperty(progress.data.Session, 'AUTHENTICATION_FAILURE', {
            value: 2, enumerable: true
        });
        Object.defineProperty(progress.data.Session, 'GENERAL_FAILURE', {
            value: 3, enumerable: true
        });

        Object.defineProperty(progress.data.Session, 'AUTH_TYPE_ANON', {
            value: "anonymous", enumerable: true
        });
        Object.defineProperty(progress.data.Session, 'AUTH_TYPE_BASIC', {
            value: "basic", enumerable: true
        });
        Object.defineProperty(progress.data.Session, 'AUTH_TYPE_FORM', {
            value: "form", enumerable: true
        });

        Object.defineProperty(progress.data.Session, 'DEVICE_OFFLINE', {
            value: "Device is offline", enumerable: true
        });
        Object.defineProperty(progress.data.Session, 'SERVER_OFFLINE', {
            value: "Cannot contact server", enumerable: true
        });
        Object.defineProperty(progress.data.Session, 'WEB_APPLICATION_OFFLINE', {
            value: "Mobile Web Application is not available", enumerable: true
        });
        Object.defineProperty(progress.data.Session, 'SERVICE_OFFLINE', {
            value: "REST web Service is not available", enumerable: true
        });
        Object.defineProperty(progress.data.Session, 'APPSERVER_OFFLINE', {
            value: "AppServer is not available", enumerable: true
        });
    }
    else {
        progress.data.Session.LOGIN_SUCCESS = 1;
        progress.data.Session.LOGIN_AUTHENTICATION_FAILURE = 2;
        progress.data.Session.LOGIN_GENERAL_FAILURE = 3;
        progress.data.Session.CATALOG_ALREADY_LOADED = 4;

        progress.data.Session.SUCCESS = 1;
        progress.data.Session.AUTHENTICATION_FAILURE = 2;
        progress.data.Session.GENERAL_FAILURE = 3;

        progress.data.Session.AUTH_TYPE_ANON = "anonymous";
        progress.data.Session.AUTH_TYPE_BASIC = "basic";
        progress.data.Session.AUTH_TYPE_FORM = "form";

        /* deliberately not including the "offline reasons" that are defined in the
         * 1st part of the conditional. We believe that we can be used only in environments where
         * ECMAScript 5 is supported, so let's put that assumption to the test
         */
    }

//setup inheritance for Session -- specifically for incorporating an Observable object 
    progress.data.Session.prototype = new progress.util.Observable();
    progress.data.Session.prototype.constructor = progress.data.Session;
    function validateSessionSubscribe(args, evt, listenerData) {
        listenerData.operation = undefined;
        var found = false;

        // make sure this event is one that we support
        for (var i = 0; i < this._eventNames.length; i++) {
            if (evt === this._eventNames[i].toLowerCase()) {
                found = true;
                break;
            }
        }
        if (!found) {
            throw new Error(progress.data._getMsgText("jsdoMSG042", evt));
        }

        if (args.length < 2) {
            throw new Error(progress.data._getMsgText("jsdoMSG038", 2));
        }

        if (typeof args[0] !== 'string') {
            throw new Error(progress.data._getMsgText("jsdoMSG039"));
        }

        if (typeof args[1] !== 'function') {
            throw new Error(progress.data._getMsgText("jsdoMSG040"));
        }
        else {
            listenerData.fn = args[1];
        }

        if (args.length > 2) {
            if (typeof args[2] !== 'object') {
                throw new Error(progress.data._getMsgText("jsdoMSG041", evt));
            }
            else {
                listenerData.scope = args[2];
            }
        }
    }
    // events supported by Session
    progress.data.Session.prototype._eventNames = 
        ["offline", "online", "afterLogin", "afterAddCatalog", "afterLogout"];  
    // callback to validate subscribe and unsubscribe
    progress.data.Session.prototype.validateSubscribe = validateSessionSubscribe;
    progress.data.Session.prototype.toString = function (radix) {
        return "progress.data.Session";
    };
    
    
    /*
        progress.data.JSDOSession
            Like progress.data.Session, but the methods are async-only and return promises.
            (first implementation uses progress.data.Session to do the work, but conceivably
            that implementation could be changed to something different)
            The JSDOSession object keeps the same underlying pdsession object for the lifetime
            of the JSDOSession object -- i.e., even after logout and subsequent login, the pdsession
            is re-used rather than re-created.
    */
    progress.data.JSDOSession = function JSDOSession( options ){
        var _pdsession,
            _serviceURI,
            _myself = this,
            _name;

        // PROPERTIES
        // Approach: Use the properties of the underlying progress.data.Session object whenever
        // possible. One exception is serviceURI, since it is set in the JSDOSession constructor
        // but can only be set in the Session at login, so JSDOSession must use its own unless
        // the pdsession is logged in
        Object.defineProperty(this, 'authenticationModel',
            {
                get: function () {
                    return _pdsession ? _pdsession.authenticationModel : undefined;
                },
                enumerable: true
            });        

        Object.defineProperty(this, 'catalogURIs',
            {
                get: function () {
                    return _pdsession ? _pdsession.catalogURIs: undefined;
                },
                enumerable: true
            });        
        
        Object.defineProperty(this, 'clientContextId',
            {
                get: function () {
                    return _pdsession ? _pdsession.clientContextId: undefined;
                },
                enumerable: true
            });        
        
        Object.defineProperty(this, 'connected',
            {
                get: function () {
                    return _pdsession ? _pdsession.connected: undefined;
                },
                enumerable: true
            });        
                
        Object.defineProperty(this, 'JSDOs',
            {
                get: function () {
                    return _pdsession ? _pdsession.JSDOs: undefined;
                },
                enumerable: true
            });        
        
        Object.defineProperty(this, 'loginResult',
            {
                get: function () {
                    return _pdsession ? _pdsession.loginResult: undefined;
                },
                enumerable: true
            });        
        
        Object.defineProperty(this, 'loginHttpStatus',
            {
                get: function () {
                    return _pdsession ? _pdsession.loginHttpStatus: undefined;
                },
                enumerable: true
            });        
        
        Object.defineProperty(this, 'onOpenRequest',
            {
                get: function () {
                    return _pdsession ? _pdsession.onOpenRequest: undefined;
                },
                set: function (newval) {
                    if (_pdsession) {
                        _pdsession.onOpenRequest = newval;
                    }
                },
                enumerable: true
            });        
        
        Object.defineProperty(this, 'pingInterval',
            {
                get: function () {
                    return _pdsession ? _pdsession.pingInterval: undefined;
                },
                set: function (newval) {
                    if (_pdsession) {
                        _pdsession.pingInterval = newval;
                    }
                },
                enumerable: true
            });        
        
        Object.defineProperty(this, 'services',
            {
                get: function () {
                    return _pdsession ? _pdsession.services: undefined;
                },
                enumerable: true
            });        
        
        Object.defineProperty(this, 'serviceURI',
            {
                get: function () {
                    if (_pdsession && _pdsession.serviceURI) {
                        return _pdsession.serviceURI;
                    }
                    else {
                        return _serviceURI;
                    }
                },
                enumerable: true
            });        
        
        Object.defineProperty(this, 'userName',
            {
                get: function () {
                    return _pdsession ? _pdsession.userName: undefined;
                },
                enumerable: true
            });        
        
        Object.defineProperty(this, 'name',
            {
                get: function () {
                    return _name;
                },
                enumerable: true
            });        
        
        // PRIVATE FUNCTIONS
        function onAfterLogin ( pdsession, result, errorObject, xhr ) {
            if (xhr && xhr._deferred) {
                if (result === progress.data.Session.SUCCESS) {
                    xhr._deferred.resolve(   xhr._jsdosession, 
                                             result, 
                                             { errorObject: errorObject,
                                               xhr: xhr } );
                }
                else {
                    xhr._deferred.reject(   xhr._jsdosession, 
                                            result, 
                                            { errorObject: errorObject,
                                              xhr: xhr });
                }
            }     
        }

        function onAfterAddCatalog( pdsession, result, errorObject, xhr ) {
            var deferred;
            
            if (xhr && xhr._deferred) {           
                deferred  = xhr._deferred;
                
                /* add the result for this addCatalog to the result array. */
                if ( result !== progress.data.Session.SUCCESS &&
                     result !== progress.data.Session.CATALOG_ALREADY_LOADED ) {
                
                     result = result || progress.data.Session.GENERAL_FAILURE;
                     
                     /* Set a property on the deferred to indicates that the "overall" result was 
                        a failure. When we decide whether to reject or resolve the promise, we reject 
                        if it's set to GENERAL_FAILURE, otherwise we resolve the promise
                        (really only need to set this once, but simpler code if we just set (or possibly 
                        re-set) it whenever we find an error, plus if, at some point while we're still
                        processing, it's important to know whether we've already had an error, we can 
                        check the property)
                      */
                     deferred._overallCatalogResult = progress.data.Session.GENERAL_FAILURE;
                }
                
                deferred._results[xhr._catalogIndex] = { catalogURI : xhr._catalogURI,
                                                       result : result,
                                                       errorObject : errorObject,
                                                       xhr : xhr};
                deferred._numCatalogsProcessed += 1;
                if ( deferred._numCatalogsProcessed  === deferred._numCatalogs ) {
                    deferred._processedPromise = true;
                    if ( !deferred._overallCatalogResult ) {
                        xhr._deferred.resolve( xhr._jsdosession, 
                                               progress.data.Session.SUCCESS,
                                               xhr._deferred._results );
                    }
                    else {
                        xhr._deferred.reject(  xhr._jsdosession, 
                                               progress.data.Session.GENERAL_FAILURE, 
                                               xhr._deferred._results ); 
                    }
                }
            }
        }
        
        function onAfterLogout ( pdsession, errorObject, xhr ) {
            if (xhr && xhr._deferred) {
                /* Note: loginResult gets cleared on successful logout, so testing it for false
                         to confirm that logout succeeded
                 */
                 if ( !errorObject && !pdsession.loginResult ) {
                    xhr._deferred.resolve( xhr._jsdosession, 
                                           progress.data.Session.SUCCESS,
                                           { errorObject: errorObject, 
                                             xhr: xhr } );
                }
                else {
                    xhr._deferred.reject( xhr._jsdosession, 
                                          progress.data.Session.SUCCESS,
                                          { errorObject: errorObject, 
                                            xhr: xhr } );
                }
            }     
        }

        function onPingComplete( args ) {
            var xhr;
            if (args.xhr && args.xhr._deferred) {
                xhr = args.xhr;
                if ( args.pingResult ) {
                    xhr._deferred.resolve( xhr._jsdosession, 
                                           args.pingResult,
                                           { offlineReason: args.offlineReason, 
                                             xhr: xhr } );
                }
                else {
                    xhr._deferred.reject(  xhr._jsdosession, 
                                           args.pingResult,
                                           { offlineReason: args.offlineReason, 
                                             xhr: xhr } );
                }
            }     
        }
        
        // METHODS
        /*  login()
            Calls the progress.data.Session method, passing arguments that cause it to
            execute asynchronously. Throws an error if the underlying login call does not 
            make the async request, otherwise returns a promise.
         */
        this.login = function(username, password, options){
            var deferred = $.Deferred(),
                loginResult,
                errorObject,
                iOSBasicAuthTimeout;
            
            if ( typeof(options) === 'object' ) {
                iOSBasicAuthTimeout = options.iOSBasicAuthTimeout;
            }

            try {
                _pdsession.subscribe('afterLogin', onAfterLogin, this);
                
                loginResult = _pdsession.login(
                    { serviceURI : this.serviceURI,
                      userName : username, 
                      password : password, 
                      async : true,
                      deferred : deferred,
                      jsdosession : this,
                      iOSBasicAuthTimeout: iOSBasicAuthTimeout} );
               
                if (loginResult !== progress.data.Session.ASYNC_PENDING) {
                    errorObject = new Error("JSDOSession: Unable to send login request.");
                }
            } 
            catch (e) {
                errorObject = new Error("JSDOSession: Unable to send login request. " + e.message);
            }
       
            if ( errorObject ) {
                throw errorObject;
            }
            else {
                return deferred.promise();
            }
        };
                            
        this.addCatalog = function( catalogURI, username, password, options ){
            var deferred = $.Deferred(),
                catalogURIs,
                numCatalogs,
                catalogIndex,
                addResult,
                errorObject,
                iOSBasicAuthTimeout;

            // check whether 1st param is a string or an array
            if ( typeof catalogURI == "string" ) {
                catalogURIs = [ catalogURI ];
            }
            else if ( catalogURI instanceof Array ) {
                catalogURIs = catalogURI;
            }
            else {
                throw new Error(progress.data._getMsgText("jsdoMSG033", "JSDOSession", "addCatalog", 
                       "The catalogURI parameter must be a string or an array of strings.") );
            }

            /* see whether the caller wants to override the workaround for the Cordova iOS async 
             * Basic auth bug
             */
            if ( typeof(options) === 'object' ) {
                iOSBasicAuthTimeout = options.iOSBasicAuthTimeout;
            }
            
            /* When we're done processing all catalogs, we pass an array of results to resolve() or
               reject(). We're attaching this array to the deferred object, in case the app makes 
               multiple addCatalog calls (if the array was attached to the JSDOSession,
               the 2nd call might overwrite the first)
             */
            
            /*  Add properties to the deferred object for this call to store the total 
                number of catalogs that are to be done, the number that ahve been processed,
                and a reference to an array of results.
                Loop through the array of catalogURIs, calling addCatalog for each one. If a call
                throws an error or returns something other than ASYNC_PENDING, create a result object
                for that catalog and add the result object to the resultArray. Otherwise, the result 
                object will be added by the afterAddCatalog handler.
                If all of the Session.addCatalog calls throw an error or return something other
                than ASYNC_PENDING, this function will reject the promise and return. Otherwise 
                the afterAddCatalog handler will resolve or reject the promise after all calls have 
                been processed.
                Note that we try to make sure that each entry in the results array is in the same position
                as its catalogURI in the input array.
               */
                // if a catalogURI has no protocol, pdsession will assume it's relative to the serviceURI,
                // if there has been a login
                // NOTE: this means if the app is trying to load a local catalog, it MUST
                // specify the file: protocol (and we need to make sure that works on all platforms)

            _pdsession.subscribe('afterAddCatalog', onAfterAddCatalog, this); 
               
            numCatalogs = catalogURIs.length;
            deferred._numCatalogs = numCatalogs; 
            deferred._numCatalogsProcessed = 0; 
            deferred._results = []; 
            deferred._results.length = numCatalogs; 
        
            for ( catalogIndex = 0; catalogIndex < numCatalogs; catalogIndex += 1) {
                errorObject = undefined;
                addResult = undefined;
                try {                   
                    addResult = _pdsession.addCatalog(
                                       { catalogURI : catalogURIs[catalogIndex],
                                         async : true,
                                         userName : username,
                                         password : password,
                                         deferred : deferred,
                                         jsdosession : this,
                                         catalogIndex: catalogIndex,
                                         iOSBasicAuthTimeout: iOSBasicAuthTimeout,
                                         offlineAddCatalog: true } );  // OK to get catalog if offline
                }
                catch (e) {
                    errorObject = new Error("JSDOSession: Unable to send addCatalog request. " + e.message);
                }
                
                if ( addResult !== progress.data.Session.ASYNC_PENDING ) {
                    /* Set a property on the deferred to indicate that the "overall" result was 
                       a failure. When we decide whether to reject or resolve the promise, we reject 
                       if it's set to GENERAL_FAILURE, otherwise we resolve the promise
                       (really only need to set this once, but simpler code if we just set (or possibly 
                       re-set) it whenever we find an error, plus if, at some point while we're still
                       processing, it's important to know whether we've already had an error, we can 
                       check the property)
                     */
                    deferred._overallCatalogResult = progress.data.Session.GENERAL_FAILURE;
                    if ( errorObject ) {
                        addResult = progress.data.Session.GENERAL_FAILURE;
                    }
                    deferred._results[catalogIndex] = { catalogURI : catalogURIs[catalogIndex],
                                              result : addResult,
                                              errorObject : errorObject,
                                              xhr : undefined };
                    deferred._numCatalogsProcessed += 1;
                }
            }
     
            if ( (deferred._numCatalogsProcessed === numCatalogs) && !deferred._processedPromise ) {
                /* The goal here is to handle the case where all the catalogs
                   have been processed but the afterAddCatalog handler may not be invoked at the 
                   end (the obvious example is if there are no async requests actually made by 
                   Session.addCatalog). In that case, we have to resolve/reject from here. Chances are
                   very good that if we're doing this here, there's been at least one error, but just
                   to be sure, we check teh deferred._overallCatalogResult anyway
                 */
                if ( deferred._overallCatalogResult === progress.data.Session.GENERAL_FAILURE ) {
                    deferred.reject( this, progress.data.Session.GENERAL_FAILURE, deferred._results );
                }
                else {
                    deferred.resolve( this, progress.data.Session.SUCCESS, deferred._results ); 
                }
            }
            
            return deferred.promise();
        };
        
        this.logout = function(){
            var deferred = $.Deferred();

            try {
                _pdsession.subscribe('afterLogout', onAfterLogout, this);
                _pdsession.logout( {async: true,
                                    deferred : deferred,
                                    jsdosession : this} );
            } 
            catch (e) {
                throw new Error("JSDOSession: Unable to send logout request. " + e.message);
            }

            return deferred.promise();
        };       

        this.ping = function() {
            var deferred = $.Deferred();
            
            try {
                _pdsession.ping( {async: true,
                                  deferred : deferred,
                                  jsdosession : this,
                                  onCompleteFn : onPingComplete } );
            }
            catch(e) {
                throw new Error("JSDOSession: Unable to send ping request. " + e.message);                
            }

            return deferred.promise(); 
        };
    
        // Determine whether the JSDOSession can currently access its web application.
         // The use expected for this method is to determine a JSDOSession that has
         // previously authenticated to its web application still has authorization.
         // For example, if the JSDOSession is using Form authentication, is the server
         // session still valid or did it expire? 
        this.isAuthorized = function () {
            var deferred = $.Deferred(),
                that = this,
                xhr = new XMLHttpRequest(),
                result;

            if (this.loginResult === progress.data.Session.LOGIN_SUCCESS) {
                _pdsession._openRequest(xhr, "GET", _pdsession.loginTarget, true);
                xhr.onreadystatechange = function () {
                    var xhr = this,  // do we need this var? The one declared in isAuthorized seems to be in scope
                        cbresult,
                        fakePingArgs,
                        info;

                    if (xhr.readyState === 4) {
                        info = {xhr: xhr,
                                offlineReason: undefined,
                                fireEventIfOfflineChange: true,
                                usingOepingFormat: false
                               };

                        // call _processPingResult because it has logic for 
                        // detecting change in online/offline state
                        _pdsession._processPingResult(info);

                        if (xhr.status >= 200 && xhr.status < 300) {
                            deferred.resolve(that,
                                             progress.data.Session.SUCCESS,
                                             info);
                        } else {
                            if (xhr.status === 401) {
                                cbresult = progress.data.Session.AUTHENTICATION_FAILURE;
                            } else {
                                cbresult = progress.data.Session.GENERAL_FAILURE;
                            }
                            deferred.reject(that, cbresult, info);
                        }
                    }
                };

                try {
                    xhr.send();
                } catch (e) {
                    throw new Error("JSDOSession: Unable to validate authorization. " + e.message);
                }
            } else {
                // Never logged in (or logged in and logged out). Regardless of what the reason
                // was that there wasn't a login, the bottom line is that authentication is required
                result = progress.data.Session.LOGIN_AUTHENTICATION_REQUIRED;
                deferred.reject(that, result, {xhr: xhr});
            }

            return deferred.promise();
        };
        
        /* 
           set the properties that are passed between client and Web application in the 
           X-CLIENT-PROPS header. This sets the complete set of properties all at once;
           it replaces any existing context
         */
        this.setContext = function( context ) {
            _pdsession._contextProperties.setContext( context );
        };

        /* 
         *  Set or remove an individual property in the set of the properties that are passed 
         *  between client and Web application in the X-CLIENT-PROPS header. This operates only 
         *  on the property identiofied by propertyName; all other existing properties remain
         *  as they are.
         *  If the propertyName is not part of the context, thsi call adds it
         *  If it is part of the context, this call updates it, unless -
         *  If propertyValue is undefined, this call removes the property
         */
        this.setContextProperty = function( propertyName, propertyValue) {
            _pdsession._contextProperties.setContextProperty( propertyName, propertyValue );
        };

        /* 
         * get the set of properties that are passed between client and Web application in the 
         * X-CLIENT-PROPS header. Returns an object that has the properties
         */
        this.getContext = function( ) {
            return _pdsession._contextProperties.getContext();
        };
        
        /*  get the value of an individual property that is in the set of properties passed between 
         *  client and Web application in the X-CLIENT-PROPS header
         */
        this.getContextProperty = function( propertyName) {
            return _pdsession._contextProperties.getContextProperty( propertyName );
        };

        
        this._onlineHandler = function( session, request ) {
            _myself.trigger( "online", _myself, request );            
        };    
        
        this._offlineHandler = function( session, offlineReason, request ) {
            _myself.trigger( "offline", _myself, offlineReason, request );            
        };    
        
        // PROCESS CONSTRUCTOR ARGUMENTS 
        // validate constructor input arguments
        if ( (arguments.length > 0) && (typeof(arguments[0]) === 'object') ) {
            
            // (options is the name of the arguments[0] parameter)
            if (options.serviceURI && (typeof(options.serviceURI) === "string" ) ) {
                _serviceURI = options.serviceURI;
            }
            else {
                throw new Error(progress.data._getMsgText("jsdoMSG033", "JSDOSession", "the constructor", 
                       "The options parameter must include a 'serviceURI' property that is a string.") );
            }
            
            if (options.authenticationModel) {
                if (typeof(options.authenticationModel) !== "string" ) {
                    throw new Error(progress.data._getMsgText("jsdoMSG033", "JSDOSession", "the constructor", 
                        "The authenticationModel property of the options parameter must be a string.") ); 
                }
                
                options.authenticationModel = options.authenticationModel.toLowerCase();
            }
        }
        else {
            throw new Error(progress.data._getMsgText("jsdoMSG033", "JSDOSession", "the constructor", 
                "The options argument was missing or invalid.") );            
        }    
        

        if (!options.authenticationModel) {
            options.authenticationModel = progress.data.Session.AUTH_TYPE_ANON;
        }
        _name = options.name;
        
        // Note: passing auth model and serviceURI just for validation in the case of page refresh
        _pdsession = new progress.data.Session({_storageKey: _name,
                                                authenticationModel: options.authenticationModel,
                                                serviceURI: options.serviceURI});

        try {
            if (options.authenticationModel) {
                _pdsession.authenticationModel = options.authenticationModel;
            }
            
            if (options.context) {
                this.setContext(options.context);                
            }
            _pdsession.subscribe( "online", this._onlineHandler, this);
            _pdsession.subscribe( "offline", this._offlineHandler, this);
        } catch (err) {
            _pdsession = undefined;  // so it will be garbage collected
            throw err;
        }
        
    };   // end of JSDOSession
    
//set up inheritance for JSDOSession -- specifically for incorporating an Observable object 
    progress.data.JSDOSession.prototype = new progress.util.Observable();
    progress.data.JSDOSession.prototype.constructor = progress.data.JSDOSession;
    function validateJSDOSessionSubscribe(args, evt, listenerData) {
        listenerData.operation = undefined;
        var found = false;

        // make sure this event is one that we support
        for (var i = 0; i < this._eventNames.length; i++) {
            if (evt === this._eventNames[i].toLowerCase()) {
                found = true;
                break;
            }
        }
        if (!found) {
            throw new Error(progress.data._getMsgText("jsdoMSG042", evt));
        }

        if (args.length < 2) {
            throw new Error(progress.data._getMsgText("jsdoMSG038", 2));
        }

        if (typeof args[0] !== 'string') {
            throw new Error(progress.data._getMsgText("jsdoMSG039"));
        }

        if (typeof args[1] !== 'function') {
            throw new Error(progress.data._getMsgText("jsdoMSG040"));
        }
        else {
            listenerData.fn = args[1];
        }

        if (args.length > 2) {
            if (typeof args[2] !== 'object') {
                throw new Error(progress.data._getMsgText("jsdoMSG041", evt));
            }
            else {
                listenerData.scope = args[2];
            }
        }
    }
    // events supported by JSDOSession
    progress.data.JSDOSession.prototype._eventNames = 
        ["offline", "online"];  
    // callback to validate subscribe and unsubscribe
    progress.data.JSDOSession.prototype.validateSubscribe = validateJSDOSessionSubscribe;
    progress.data.JSDOSession.prototype.toString = function (radix) {
        return "progress.data.JSDOSession";
    };
    
    progress.data.getSession = function(options) {

        var deferred = $.Deferred();
        
        // This is the reject handler for session-related operations
        // login, addCatalog, and logout
        function sessionRejectHandler(jsdosession, result, info) {
            deferred.reject(result, info);
        };
        
        // This is the reject handler for the login callback
        function callbackRejectHandler(reason) {
            deferred.reject(progress.data.Session.GENERAL_FAILURE, {"reason": reason});
        }
        
        function loginHandler(jsdosession, result, info) {
            jsdosession.addCatalog(options.catalogURI)
            .then(function(jsdosession, result, info) {
                deferred.resolve(jsdosession, progress.data.Session.SUCCESS);
            }, sessionRejectHandler);
        };
        
        // This function calls login using credentials from the appropriate source
        // Note that as currently implemented, this should NOT be called when
        // ANONYMOUS auth is being used, because it unconditionally returns 
        // AUTHENTICATION_FAILURE if there are no credentials and no loginCallback
        function callLogin(jsdosession, result, info) {
            var errorObject;
            
            // Use the login callback if we are passed one 
            if (typeof options.loginCallback !== 'undefined') {
                options.loginCallback()
                .then(function (result) {
                    jsdosession.login(result.username, result.password)
                    .then(loginHandler, sessionRejectHandler);
                }, callbackRejectHandler);
            } else if (options.username && options.password) {
                jsdosession.login(options.username, options.password)
                .then(loginHandler, sessionRejectHandler);
            } else {
                errorObject = new Error(progress.data._getMsgText(
                    "jsdoMSG052",
                    "getSession()"
                ));
                sessionRejectHandler(
                    jsdosession,
                    progress.data.Session.AUTHENTICATION_FAILURE,
                    {
                        // including an Error object to make clear why there is no xhr (normally there would
                        // be one for an authentication failure)
                        errorObject: errorObject
                    }
                );
            }
        }
        
        if (typeof options !== 'object') {
            // getSession(): 'options' must be of type 'object'
            throw new Error(progress.data._getMsgText(
                "jsdoMSG503", 
                "getSession()",
                "options",
                "object"
            ));
        }
        
        if (typeof options.loginCallback !== 'undefined' && 
            typeof options.loginCallback !== 'function') {
            // getSession(): 'options.loginCallback' must be of type 'function'
            throw new Error(progress.data._getMsgText(
                "jsdoMSG503", 
                "getSession()",
                "options.loginCallback",
                "function"
            ));
        }
        
        // Create the JSDOSession and let it handle the argument parsing
        try {
            jsdosession = new progress.data.JSDOSession(options);
            
            jsdosession.isAuthorized()
            .then(function(jsdosession, result, info) {
                // If we are logged in, then we just re-add the catalog.
                loginHandler(jsdosession, result, info);
            }, function(jsdosession, result, info) {
                // If model is anon, just log in.
                if (jsdosession.authenticationModel === progress.data.Session.AUTH_TYPE_ANON &&
                    result !== progress.data.Session.GENERAL_FAILURE) {
                    
                    jsdosession.login(options.username, options.password)
                    .then(loginHandler, sessionRejectHandler);
                } 
                // We need to log-in with credentials.
                else if (result === progress.data.Session.LOGIN_AUTHENTICATION_REQUIRED || 
                    result === progress.data.Session.AUTHENTICATION_FAILURE) {
                    
                    // If we were logged in, we need to logout
                    if (result === progress.data.Session.AUTHENTICATION_FAILURE) {
                        jsdosession.logout()
                        .then(callLogin, sessionRejectHandler);
                    } else {
                        callLogin(jsdosession);
                    }
                }
                // If we get here, it's probably because the server is down.
                else {
                    sessionRejectHandler(jsdosession, result, info);
                }
            });
        } catch (error) {
            throw error;
        }
        
        return deferred.promise();
    };
})();

if (typeof exports !== "undefined") {
    exports.progress = progress;
}

/* 
progress.data.kendo.js    Version: 4.3.0-10

Copyright (c) 2015-2016 Progress Software Corporation and/or its subsidiaries or affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
 
    http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

 */

/*global jQuery, kendo, progress*/
/*jslint nomen: true*/
/*jslint vars: false*/
(function () {

    // "use strict";

    var JSDODataReader, JSDOTransport, JSDOObservable = new kendo.Observable();

    function initializeJSDO(transport, options) {
        var jsdo, resourceName;

        if (options.jsdo instanceof progress.data.JSDO) {
            jsdo = options.jsdo;
        } else if (typeof (options.jsdo) === "string") {
            // Create a new JSDO instance using the specified configuration
            resourceName = options.jsdo;

            // Create JSDO
            jsdo = new progress.data.JSDO({ name: resourceName });
        } else {
            throw new Error("JSDO: jsdo property must be either a JSDO instance or a string.");
        }
        
        if (transport.tableRef === undefined && jsdo._defaultTableRef) {
            transport.tableRef = jsdo._defaultTableRef._name;
        }
        if (transport.tableRef === undefined) {
            throw new Error("JSDO: A tableRef must be specified when using a multi-table DataSet.");
        } else if (jsdo[transport.tableRef] === undefined) {
            throw new Error("JSDO: tableRef '" + transport.tableRef + "' is not present in JSDO definition.");
        }
        
        return jsdo;
    }

    

    // This define functions to read the data object from the JSDO DataSource
    JSDODataReader = kendo.data.readers.json.extend({
        init: function (arg1) {
            // init function
            var event = {},
                transport;

            // Query the transport object to obtain a transport reference
            JSDOObservable.trigger("info", event);
            transport = this.transport = event.sender._events.info.transport;

            kendo.data.readers.json.fn.init.call(this, arg1);

            // Overrides model property after init.call
            // because if model is defined at the object level init.call removes it
            this.model = kendo.data.Model.define({
                init: function (data) {
                    var record;
                    if (!data || jQuery.isEmptyObject(data)) {
                        data = transport._getInitialValues();
                    }
                    record = transport._convertDataTypes(data);
                    transport.jsdo._deleteProdsProperties(record, true);
                    kendo.data.Model.fn.init.call(this, record);
                },
                id: "_id",
                fields: transport._getModel()
            });
        },
        total: function (data) {
            return data.total || (data.data ? data.data.length : data.length);
        },
        data: function (data) {
            return data.data || data;
        }
    });

    // This define transport for JSDO DataSource providing implementation for:
    //     create, read, update, destroy, submit
    JSDOTransport = kendo.data.RemoteTransport.extend({
        init: function (options) {
            var transport = this,
                fnName;
            
            if (options.tableRef !== undefined) {
                transport.tableRef = options.tableRef;
            }
            transport.jsdo = initializeJSDO(transport, options);
            transport._initFromServer = false;
            transport.autoSave = options.autoSave !== undefined ? options.autoSave : true;
            transport.readLocal = options.readLocal !== undefined ? options.readLocal : false;
            transport.countFnName = options.countFnName;
            transport.useArrays = options.useArrays !== undefined ? options.useArrays : false;

            if (transport.countFnName !== undefined) {
                if (typeof (transport.jsdo[transport.countFnName]) !== "function") {
                    throw new Error("Invoke operation '" +
                        transport.countFnName + "' for countFnName is not defined.");
                }
            } else if (transport.jsdo._resource.generic.count !== undefined) {
                for (fnName in transport.jsdo._resource.fn) {
                    if (transport.jsdo._resource.fn.hasOwnProperty(fnName)) {
                        if (transport.jsdo._resource.generic.count === transport.jsdo._resource.fn[fnName]["function"]) {
                            transport.countFnName = fnName;
                            break;
                        }
                    }
                }
            }

            // Define "info" event to return transport object to reader
            JSDOObservable.one("info", function (e) {
                e.sender._events.info.transport = transport;
            });
            
            transport._initConvertTypes();

            kendo.data.RemoteTransport.fn.init.call(this, options);
        },
        _initConvertTypes: function () {
            // _initConvertTypes:
            // Initializes transport._convertTypes to indicate whether a conversion of the data is needed
            // when it is passed to Kendo UI.
            // This operation is currently only needed for date fields that are stored as strings.
            // Sets array _dateFields to the fields of date fields to convert.
            var transport = this,
                i,
                schema,
                fieldName,
                dateFields = [],
                arrayFields = [],
                convertDateFields = false;
            
            transport._convertTypes = false;
            
            schema = transport.jsdo[transport.tableRef].getSchema();
            for (i = 0; i < schema.length; i += 1) {
                fieldName = schema[i].name;
                if (fieldName.length > 0 && fieldName.charAt(0) !== "_") {
                    if (schema[i].type === "string" &&
                            schema[i].format &&
                            (schema[i].format.indexOf("date") !== -1)) {
                        dateFields.push(fieldName);
                        if (!convertDateFields) {
                            convertDateFields = true;
                        }
                    } else if (!transport.useArrays && schema[i].type === "array") {
                        arrayFields.push(fieldName);
                        if (!convertDateFields && schema[i].ablType &&
                                schema[i].ablType.indexOf("DATE") === 0) {
                            convertDateFields = true;
                        }
                    }
                }
            }
            
            if (dateFields.length > 0 || arrayFields.length > 0) {
                transport._convertTypes = true;
                // _convertFields: Object containing arrays for each data type to convert
                transport._convertFields = {};
                transport._convertFields._arrayFields = [];
                transport._convertFields._dateFields = [];
            }
            if (dateFields.length > 0) {
                transport._convertFields._dateFields = dateFields;
            }
            if (convertDateFields) {
                transport._convertFields._datePattern = new RegExp("^([0-9]+)?-([0-9]{2})?-([0-9]{2})?$");
                transport._convertFields._dateTimePattern = new RegExp(
                    "^([0-9]+)?-([0-9]{2})?-([0-9]{2})?" +
                        "T([0-9]{2})?:([0-9]{2})?:([0-9]{2})?.([0-9]{3})?$"
                );
            }
            if (arrayFields.length > 0) {
                transport._convertFields._arrayFields = arrayFields;
            }
        },
        _convertStringToDate: function (data, fieldName, targetFieldName) {
            var transport = this,
                array,
                ablType,
                orig;
                
            if (!targetFieldName) {
                targetFieldName = fieldName;
            }
            // Check if string is <year>-<month>-<day>
            array = transport._convertFields._datePattern.exec(data[targetFieldName]) || [];
            if (array.length > 0) {
                data[targetFieldName] = new Date(parseInt(array[1], 10),
                                            parseInt(array[2], 10) - 1,
                                            parseInt(array[3], 10));
            } else {
                ablType = transport.jsdo[transport.tableRef]._fields[fieldName.toLowerCase()].ablType;
                if (ablType === "DATETIME") {
                    array = transport._convertFields._dateTimePattern.exec(data[targetFieldName]) || [];
                    if (array.length > 0) {
                        // Convert date to local time zone
                        data[targetFieldName] = new Date(parseInt(array[1], 10),
                                                    parseInt(array[2], 10) - 1,
                                                    parseInt(array[3], 10),
                                                    parseInt(array[4], 10),
                                                    parseInt(array[5], 10),
                                                    parseInt(array[6], 10),
                                                    parseInt(array[7], 10));
                    }
                } 
                
                // Check to see if it was converted
                if (typeof (data[targetFieldName]) === "string") { 
                    orig = data[targetFieldName];
                    try {
                        data[targetFieldName] = new Date(data[targetFieldName]);
                    }
                    catch (e) {
                        // Conversion to a date object was not successful
                        data[targetFieldName] = orig;
                        console.log(msg.getMsgText("jsdoMSG000", 
                                "_convertStringToDate() could not convert to date object: " + orig));
                    }
                }
            }
        },
        _convertDataTypes: function (data) {
            // _convertDataTypes:
            // Converts data types in the specified data record.
            // Data record could come from the JSDO or from the Kendo UI DataSource.
            // Returns a reference to the record.            
            // Returns a copy when useArrays is undefined or false.
            var transport = this,
                i,
                k,
                fieldName,
                schemaInfo,
                prefixElement,
                elementName,
                copy;
            
            if (!transport.useArrays && transport._convertTypes && (transport._convertFields._arrayFields.length > 0)) {
                copy = {};
                transport.jsdo._copyRecord(transport.jsdo._buffers[transport.tableRef], data, copy);
                data = copy;
            }

            if (!transport._convertTypes) {
                return data;
            }
            
            for (k = 0; k < transport._convertFields._arrayFields.length; k += 1) {
                fieldName = transport._convertFields._arrayFields[k];
                if (data[fieldName]) {
                    schemaInfo = transport.jsdo[transport.tableRef]._fields[fieldName.toLowerCase()];
                    prefixElement = transport.jsdo._getArrayField(fieldName);
                    for (i = 0; i < schemaInfo.maxItems; i += 1) {
                        // ABL arrays are 1-based
                        elementName = prefixElement.name + (i + 1);

                        if (!transport.jsdo[transport.tableRef]._fields[elementName.toLowerCase()]) {
                            // Skip element if a field with the same name exists
                            // Extract value from array field into individual field
                            // Array is removed later
                            data[elementName] = data[fieldName][i];

                            // Convert string DATE fields to JS DATE
                            if ((schemaInfo.ablType) && (schemaInfo.ablType.indexOf("DATE") === 0) && (typeof (data[elementName]) === "string")) {
                                transport._convertStringToDate(data, fieldName, elementName);
                            }
                        }
                    }
                    if (!transport.useArrays) {
                        delete data[fieldName];
                    }
                }
            }
            
            for (k = 0; k < transport._convertFields._dateFields.length; k += 1) {
                fieldName = transport._convertFields._dateFields[k];
                if (typeof (data[fieldName]) === "string") {
                    transport._convertStringToDate(data, fieldName);
                }
            }
            
            return data;
        },
        _getModel: function () {
            var transport = this,
                i,
                j,
                fields = {},
                schema,
                value,
                type,
                element;
                
            schema = transport.jsdo[transport.tableRef].getSchema();
            for (i = 0; i < schema.length; i += 1) {
                // Skip internal fields
                if (schema[i].name.length > 0 && schema[i].name.charAt(0) !== "_") {
                    type = schema[i].type;
                    if (type === "integer") {
                        type = "number";
                    } else if (type === "string" &&
                            schema[i].format &&
                            schema[i].format.indexOf("date") !== -1) {
                        // Set type to "date" is type is DATE or DATETIME[-TZ]                            
                        type = "date";
                    }
                    if (type === "array") {
                        for (j = 0; j < schema[i].maxItems; j += 1) {
                            value = transport.jsdo._getDefaultValue(schema[i]);
                            element = transport.jsdo._getArrayField(schema[i].name, j);
                            if (!transport.jsdo[transport.tableRef]._fields[element.name.toLowerCase()]) {
                                // Skip element if a field with the same name exists
                                
                                // Calculate type of array element
                                type = schema[i].items.type;
                                if (type === "integer") {
                                    type = "number";
                                } else if (type === "string" && schema[i].ablType && (schema[i].ablType.indexOf("DATE") !== -1)) {
                                    type = "date";
                                }
                                
                                fields[element.name] = {};
                                fields[element.name].type = type;
                                if (value !== undefined) {
                                    fields[element.name].defaultValue = value;
                                }
                            }
                        }
                    } else {
                        value = transport.jsdo._getDefaultValue(schema[i]);
                        fields[schema[i].name] = {};
                        fields[schema[i].name].type = type;
                        if (value !== undefined) {
                            fields[schema[i].name].defaultValue = value;
                        }
                    }
                }
            }
            return fields;
        },
        _getInitialValues: function () {
            var transport = this,
                i,
                j,
                data = {},
                schema,
                defaultValue;
            schema = transport.jsdo[transport.tableRef].getSchema();
            for (i = 0; i < schema.length; i += 1) {
                // Skip internal fields
                if (schema[i].name.length > 0 && schema[i].name.charAt(0) !== "_") {
                    defaultValue = transport.jsdo._getDefaultValue(schema[i]);
                    if (schema[i].type === "array") {
                        data[schema[i].name] = [];

                        for (j = 0; j < schema[i].maxItems; j += 1) {
                            data[schema[i].name][j] = defaultValue;
                        }

                    } else {
                        data[schema[i].name] = defaultValue;
                    }
                }
            }
            return data;
        },
        _getData: function (options) {
            var jsdo = this.jsdo,
                data = {},
                params,
                array,
                filter;
                
            if (options && options.data) {
                params = {
                    tableRef: this.tableRef,
                    filter: options.data.filter,
                    sort: options.data.sort,
                    skip: options.data.skip,
                    top: options.data.take
                };
                
                array = jsdo[this.tableRef].getData({filter: filter});
                data.total = array.length;
                array = jsdo[this.tableRef].getData(params);
                data.data = array;
            } else {
                array = jsdo[this.tableRef].getData();
                data.data = array;
                data.total = array.length;
            }
            
            return data;
        },
        read: function (options) {
            try {
                var jsdo = this.jsdo,
                    filter,
                    data = {},
                    transport = this,
                    callback,
                    property,
                    optionsMapping = {
                        filter: "filter",
                        take: "top",
                        skip: "skip",
                        sort: "sort"
                    },
                    saveUseRelationships;

                if (!this._initFromServer) {
                    if (jsdo[this.tableRef]._parent) {
                        this._initFromServer = (jsdo[jsdo[this.tableRef]._parent]._data && (jsdo[jsdo[this.tableRef]._parent]._data.length > 0))
                            || (jsdo[this.tableRef]._data instanceof Array && (jsdo[this.tableRef]._data.length > 0));
                    } else {
                        this._initFromServer = (jsdo[this.tableRef]._data instanceof Array) && (jsdo[this.tableRef]._data.length > 0);
                    }
                }
                
                data.data = [];
                if (this.readLocal && this._initFromServer) {
                    saveUseRelationships = jsdo.useRelationships;
                    jsdo.useRelationships = false;
                    data = this._getData(options);
                    jsdo.useRelationships = saveUseRelationships;
                    options.success(data);
                    return;
                }
                
                if (!this.readLocal) {
                    // readLocal is false or _initFromServer is false
                   
                    if (options.data) {
                        // Only create filter object if options.data contains viable properties
                        for (property in options.data) {
                            if (options.data.hasOwnProperty(property)) {
                                if (options.data[property] !== undefined
                                        && optionsMapping[property]) {
                                    if (filter === undefined) {
                                        filter = {};
                                    }
                                    filter[optionsMapping[property]] = options.data[property];
                                }
                            }
                        }
                        if (filter) {
                            filter.tableRef = this.tableRef;
                        }
                    }
                }
                
                callback = function onAfterFillJSDO(jsdo, success, request) {
                    var data = {}, saveUseRelationships, promise, total, exception;
                    
                    if (success) {
                        saveUseRelationships = jsdo.useRelationships;
                        jsdo.useRelationships = false;

                        if (transport.readLocal) {
                            // Use options.data to filter data
                            data = transport._getData(options);
                        } else {
                            data.data = jsdo[transport.tableRef].getData();
                            
                            total = jsdo.getProperty("server.count");
                            if (total) {
                                data.total = total;
                            }
                                
                        }
                        jsdo.useRelationships = saveUseRelationships;
                        transport._initFromServer = true;
                        if (options.data && options.data.take) {
                            if (!transport.readLocal &&
                                    transport.countFnName !== undefined &&
                                    typeof (jsdo[transport.countFnName]) === "function") {

                                if (options.data.skip === 0 && options.data.take > data.data.length) {
                                    options.success(data);
                                    return;
                                }
                                
                                // Reuse filter string from the request.objParam object from fill() call.   
                                promise = jsdo.invoke(
                                    transport.countFnName,
                                    { filter: request.objParam.filter }
                                );
                                /*jslint unparam: true*/
                                promise.done(function (jsdo, success, request) {
                                    var exception, total;
                                    
                                    try {
                                        if (typeof (request.response) === "object" &&
                                                Object.keys(request.response).length === 1) {
                                            total = request.response[Object.keys(request.response)];
                                            if (typeof (total) !== "number") {
                                                // Use generic exception if data type is not a number.
                                                total = undefined;
                                            }
                                        }
                                    } catch (e) {
                                        // This exception is ignored a generic exception is used later.
                                    }
                                    if (total !== undefined) {
                                        if (total) {
                                            data.total = total;
                                        }
                                        options.success(data);
                                    } else {
                                        exception = new Error("Unexpected response from '"
                                                                + transport.countFnName + "' operation.");
                                        options.error(request.xhr, request.xhr.status, exception);
                                    }
                                });
                                promise.fail(function (jsdo, success, request) {
                                    var exception;
                                    exception = new Error("Error invoking '"
                                                            + transport.countFnName + "' operation.");
                                    options.error(request.xhr, request.xhr.status, exception);
                                });
                                /*jslint unparam: false*/
                            } else {
                                options.success(data);
                            }
                        } else {
                            options.success(data);
                        }
                    } else {
                        exception = request.exception;
                        if (!exception) {
                            exception = new Error("Error while reading records.");
                        }
                        options.error(request.xhr, request.xhr.status, exception);
                    }
                };
                
                jsdo.fill(filter).done(callback).fail(callback);

            } catch (e) {
                options.error(null, null, e);
            }
        },
        _processChanges: function (options, request) {
            var jsdo = this.jsdo,
                transport = this,
                array,
                i,
                jsrecord,
                id,
                record;
            
            if (options.batch) {
                array = [];
                if (options.data.created instanceof Array) {
                    for (i = 0; i < options.data.created.length; i += 1) {
                        jsrecord = jsdo[transport.tableRef].findById(
                            options.data.created[i]._id
                        );
                        if (jsrecord) {
                            record = transport._convertDataTypes(jsrecord.data);
                            array.push(record);
                        } else if (jsdo.autoApplyChanges) {
                            options.error(
                                null,
                                null,
                                new Error("Created record was not found in memory.")
                            );
                            return;
                        }
                    }
                }
                options.success(array, "create");
                
                array = [];
                if (options.data.updated instanceof Array) {
                    for (i = 0; i < options.data.updated.length; i += 1) {
                        jsrecord = jsdo[transport.tableRef].findById(
                            options.data.updated[i]._id
                        );
                        if (jsrecord) {
                            record = transport._convertDataTypes(jsrecord.data);
                            array.push(record);
                        } else if (jsdo.autoApplyChanges) {
                            options.error(
                                null,
                                null,
                                new Error("Updated record not found in memory.")
                            );
                            return;
                        }
                    }
                }
                options.success(array, "update");
                
                array = [];
                if (options.data.destroyed instanceof Array) {
                    for (i = 0; i < options.data.destroyed.length; i += 1) {
                        jsrecord = jsdo[transport.tableRef].findById(
                            options.data.destroyed[i]._id
                        );
                        if (jsrecord && jsdo.autoApplyChanges) {
                            options.error(
                                null,
                                null,
                                new Error("Deleted record was found in memory.")
                            );
                            return;
                        }
                    }
                }
                options.success(array, "destroy");
            } else {
                if (jsdo._resource.idProperty) {
                    if (request
                            && request.batch
                            && request.batch.operations instanceof Array
                            && request.batch.operations.length === 1) {
                        id = request.batch.operations[0].jsrecord.data._id;
                    }
                } else {
                    id = options.data._id;
                }
                jsrecord = jsdo[transport.tableRef].findById(id);
                if (jsrecord) {
                    record = transport._convertDataTypes(jsrecord.data);
                    options.success(record);
                } else {
                    options.success({});
                }
            }
        },
        _saveChanges: function (options) {
            var transport = this,
                callback = function onAfterSaveChanges(jsdo, success, request) {
                    var jsrecord,
                        xhr,
                        status,
                        exception;

                    if (success) {
                        // _id is expected to be set for CUD operations
                        // Deleted records will not be found and data is expected to be undefined
                        transport._processChanges(options, request);
                    } else {
                        if (request.batch
                                && request.batch.operations instanceof Array
                                && request.batch.operations.length === 1) {
                            xhr = request.batch.operations[0].xhr;
                            status = request.batch.operations[0].xhr.status;
                            if (status === 500) {
                                exception = request.batch.operations[0].exception;
                            } else {
                                jsrecord = jsdo[transport.tableRef].findById(options.data._id);
                                if (jsrecord) {
                                    exception = new Error(jsrecord.getErrorString());
                                }
                            }
                        } else if (request.jsrecords) {
                            xhr = request.xhr;
                            status = request.xhr.status;
                            // Use "default" exception text
                        }
                        if (!exception) {
                            exception = new Error("Error while saving changes.");
                        }
                        options.error(xhr, status, exception);
                    }
                };

            if (this.autoSave) {
                this.jsdo.saveChanges(this.jsdo._hasSubmitOperation).done(callback).fail(callback);
            } else {
                this._processChanges(options);
            }
        },
        create: function (options) {
            var jsdo = this.jsdo,
                jsrecord,
                saveUseRelationships = jsdo.useRelationships;

            options.batch = options.data.models instanceof Array;
            try {
                jsdo.useRelationships = false;
                if (options.batch) {
                    options.error(
                        null,
                        null,
                        new Error("A newer version of Kendo UI is expected for batching support.")
                    );
                } else {
                    jsrecord = jsdo[this.tableRef].add(options.data);
                    options.data._id = jsrecord.data._id;
                    this._saveChanges(options);
                }
            } catch (e) {
                // Undo changes on thrown exception
                if (jsdo.autoApplyChanges) {
                    jsdo[this.tableRef].rejectChanges();
                }
                options.error(null, null, e);
            } finally {
                jsdo.useRelationships = saveUseRelationships;
            }
        },
        update: function (options) {
            var jsdo = this.jsdo,
                jsrecord,
                saveUseRelationships = jsdo.useRelationships;
            
            options.batch = options.data.models instanceof Array;
            try {
                jsdo.useRelationships = false;
                if (options.batch) {
                    options.error(
                        null,
                        null,
                        new Error("A newer version of Kendo UI is expected for batching support.")
                    );
                } else {
                    jsrecord = jsdo[this.tableRef].findById(options.data._id);
                    jsrecord.assign(options.data);
                    this._saveChanges(options);
                }
            } catch (e) {
                // Undo changes on thrown exception
                if (jsdo.autoApplyChanges) {
                    jsdo[this.tableRef].rejectChanges();
                }
                options.error(null, null, e);
            } finally {
                jsdo.useRelationships = saveUseRelationships;
            }
        },
        destroy: function (options) {
            var jsdo = this.jsdo,
                jsrecord,
                saveUseRelationships = jsdo.useRelationships;

            options.batch = options.data.models instanceof Array;
            try {
                jsdo.useRelationships = false;
                if (options.data.models instanceof Array) {
                    options.error(
                        null,
                        null,
                        new Error("A newer version of Kendo UI is expected for batching support.")
                    );
                } else {
                    jsrecord = jsdo[this.tableRef].findById(options.data._id);
                    jsrecord.remove();
                    this._saveChanges(options);
                }
            } catch (e) {
                // Undo changes on thrown exception
                if (jsdo.autoApplyChanges) {
                    jsdo[this.tableRef].rejectChanges();
                }
                options.error(null, null, e);
            } finally {
                jsdo.useRelationships = saveUseRelationships;
            }
        },
        submit: function (options) {
            var jsdo = this.jsdo,
                i,
                jsrecord,
                saveUseRelationships = jsdo.useRelationships;
            
            if (!this.jsdo._hasSubmitOperation) {
                options.error(null, null, new Error("Submit operation is required for batching support."));
                return;
            }
            options.batch = true;
            try {
                jsdo.useRelationships = false;
                
                if (options.data.created instanceof Array) {
                    for (i = 0; i < options.data.created.length; i += 1) {
                        jsrecord = jsdo[this.tableRef].add(options.data.created[i]);
                        options.data.created[i]._id = jsrecord.data._id;
                    }
                }
                
                if (options.data.updated instanceof Array) {
                    for (i = 0; i < options.data.updated.length; i += 1) {
                        jsrecord = jsdo[this.tableRef].findById(options.data.updated[i]._id);
                        if (jsrecord) {
                            jsrecord.assign(options.data.updated[i]);
                        } else {
                            options.error(null, null, new Error("Record not found in memory."));
                        }
                    }
                }
                
                if (options.data.destroyed instanceof Array) {
                    for (i = 0; i < options.data.destroyed.length; i += 1) {
                        jsrecord = jsdo[this.tableRef].findById(options.data.destroyed[i]._id);
                        if (jsrecord) {
                            jsrecord.remove();
                        } else {
                            options.error(null, null, new Error("Record not found in memory."));
                        }
                    }
                }

                this._saveChanges(options);
            } catch (e) {
                // Undo changes on thrown exception
                if (jsdo.autoApplyChanges) {
                    jsdo[this.tableRef].rejectChanges();
                }
                options.error(null, null, e);
            } finally {
                jsdo.useRelationships = saveUseRelationships;
            }
        }
    });

    // This defines the JSDO DataSource by specifying the schema, transport and reader for it.
    // The "id" property is set to "_id" to enable CUD operations.
    jQuery.extend(true, kendo.data, {
        schemas: {
            jsdo: {
                type: "jsdo",
                model: {
                    id: "_id"
                }
            }
        },
        transports: {
            jsdo: JSDOTransport
        },
        readers: {
            jsdo: JSDODataReader
        }
    });
}());
/*jslint nomen: false*/
