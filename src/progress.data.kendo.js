/* 
Copyright (c) 2015 Progress Software Corporation and/or its subsidiaries or affiliates.

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

// Version: 4.0.0-20

/*
 * kendo.data.kendo.js
 */

/*global jQuery, kendo, progress*/
/*jslint nomen: true*/
/*jslint vars: false*/
(function () {

    //"use strict";

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
        }
        else if (jsdo[transport.tableRef] === undefined) {
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
                init: function(data) {
                    if (!data || jQuery.isEmptyObject(data)) {
                        data = transport._getInitialValues();
                    }
                    transport._convertDataTypes(data);
                    kendo.data.Model.fn.init.call(this, data);
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
    //     create, read, update, destroy    
    JSDOTransport = kendo.data.RemoteTransport.extend({
        init: function (options) {
            var transport = this;
            
            if (options.tableRef !== undefined) {
                transport.tableRef = options.tableRef;
            }
            transport.jsdo = initializeJSDO(transport, options);
            transport._initFromServer = false;            
            transport.autoSave = options.autoSave !== undefined ? options.autoSave : true;
            transport.readLocal = options.readLocal !== undefined ? options.readLocal : false;
            transport.countFnName = options.countFnName;

            if (transport.countFnName !== undefined && 
                typeof(transport.jsdo[transport.countFnName]) !== "function") {
                throw new Error("Invoke operation '" + 
                                    transport.countFnName + "' for countFnName is not defined."); 
            }

            // Define "info" event to return transport object to reader
            JSDOObservable.one("info", function (e) {
                e.sender._events.info.transport = transport;
            });
            
            transport._initConvertTypes();

            kendo.data.RemoteTransport.fn.init.call(this, options);
        },
        _initConvertTypes: function() {
            // _initConvertTypes:
            // Initializes transport._convertTypes to indicate whether a conversion of the data is needed
            // when it is passed to Kendo UI.
            // This operation is currently only needed for date fields that are stored as strings.
            // Sets array _dateFields to the fields of date fields to convert.
            var transport = this,
                i,
                schema,
                fieldName,
                array = [];
            
            transport._convertTypes = false;
            
            schema = transport.jsdo[transport.tableRef].getSchema();                
            for (i = 0; i < schema.length; i += 1) {
                fieldName = schema[i].name;
                if (fieldName.length > 0 && fieldName.charAt(0) !== "_") {
                    if (schema[i].type === "string" &&
                        schema[i].format &&
                        (schema[i].format.indexOf("date") !== -1)) {
                        array.push(fieldName);
                    }
                }
            }
            
            if (array.length > 0) {
                transport._convertTypes = true;
                // _convertFields: Object containing arrays for each data type to convert
                transport._convertFields = {};
                transport._convertFields._dateFields = array;                
                transport._convertFields._datePattern = new RegExp("^([0-9]+)?-([0-9]{2})?-([0-9]{2})?$");
                transport._convertFields._dateTimePattern = new RegExp(
                    "^([0-9]+)?-([0-9]{2})?-([0-9]{2})?" +
                    "T([0-9]{2})?:([0-9]{2})?:([0-9]{2})?.([0-9]{3})?$");
            }
        },
        _convertDataTypes: function(data) {
            var transport = this,
                k,
                fieldName,
                array,
                ablType;

            if (!transport._convertTypes) {
                return;      
            }
            
            for (k = 0; k < transport._convertFields._dateFields.length; k += 1) {
                fieldName = transport._convertFields._dateFields[k];
                if (typeof(data[fieldName]) === "string") {
                    // Check if string is <year>-<month>-<day>
                    array = transport._convertFields._datePattern.exec(data[fieldName]) || [];
                    if (array.length > 0) {
                        data[fieldName] = new Date(parseInt(array[1], 10), 
                                                    parseInt(array[2], 10) - 1, 
                                                    parseInt(array[3], 10));
                    }
                    else {
                        ablType = transport.jsdo[transport.tableRef]._fields[fieldName.toLowerCase()].ablType;
                        if (ablType === "DATETIME") {
                            array = transport._convertFields._dateTimePattern.exec(data[fieldName]) || [];
                            if (array.length > 0) {
                                // Convert date to local time zone
                                data[fieldName] = new Date(parseInt(array[1], 10),
                                                            parseInt(array[2], 10) - 1,
                                                            parseInt(array[3], 10),
                                                            parseInt(array[4], 10),
                                                            parseInt(array[5], 10),
                                                            parseInt(array[6], 10),
                                                            parseInt(array[7], 10));
                            }
                        }
                        else {
                            data[fieldName] = new Date(data[fieldName]);
                        }
                    }
                }
            }
        },
        _getModel: function() {
            var transport = this,
                i,
                fields = {},
                schema,
                value,
                type;
                
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
                    value = transport.jsdo._getDefaultValue(schema[i]);
                    fields[schema[i].name] = {};
                    fields[schema[i].name].type = type;
                    if (value !== undefined) {
                        fields[schema[i].name].defaultValue = value;
                    }
                }                
            }            
            return fields;
        },
        _getInitialValues: function() {
            var transport = this,
                i,
                data = {},
                schema;
            schema = transport.jsdo[transport.tableRef].getSchema();
            for (i = 0; i < schema.length; i += 1) {
                // Skip internal fields
                if (schema[i].name.length > 0 && schema[i].name.charAt(0) !== "_") {
                    data[schema[i].name] = transport.jsdo._getDefaultValue(schema[i]);
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
                    orderBy: options.data.sort,
                    skip: options.data.skip,
                    top: options.data.take                            
                };
                
                array = jsdo[this.tableRef].getData({filter: filter});
                data.total = array.length;                        
                array = jsdo[this.tableRef].getData(params);
                data.data = array;
            }
            else {
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
                    callback;
								

                if (!this._initFromServer) {
                    this._initFromServer = jsdo[this.tableRef].hasData();
                }
                
                data.data = [];
                if (this.readLocal && this._initFromServer) {
                    data = this._getData(options);
                    options.success(data);
                    return;
                }
                
                if (!this.readLocal) {
                    // readLocal is false or _initFromServer is false
                    if (options.data && (Object.keys(options.data).length > 0)) {
                        filter = {
                            tableRef: this.tableRef,
                            filter: options.data.filter,
                            orderBy: options.data.sort,
                            skip: options.data.skip,
                            top: options.data.take
                            };
                    }
                }
                
                callback = function onAfterFillJSDO(jsdo, success, request) {
                    if (success) {
                        var data = {}, saveUseRelationships, promise;

                        saveUseRelationships = jsdo.useRelationships;
                        jsdo.useRelationships = false;

                        if (transport.readLocal) {
                            // Use options.data to filter data
                            data = transport._getData(options);
                        }
                        else {
                            data.data = jsdo[transport.tableRef].getData();
                        }
                        jsdo.useRelationships = saveUseRelationships;
                        transport._initFromServer = true;
                        if (options.data && options.data.take) {
                            if (!this.readLocal && 
                                transport.countFnName !== undefined && 
                                typeof(jsdo[transport.countFnName]) === "function") {
                                // Reuse filter string from the request.objParam object from fill() call.
                                promise = jsdo.invoke(
                                                transport.countFnName, 
                                                { filter: request.objParam.filter });
                                /*jslint unparam: true*/
                                promise.done(function(fnName, jsdo, success, request){
                                    var exception, total;
                                    
                                    try {
                                        if (typeof(request.response) === "object" && 
                                            Object.keys(request.response).length === 1) {
                                            total = request.response[Object.keys(request.response)];
                                            if (typeof(total) !== "number") {
                                                // Use generic exception if data type is not a number.
                                                total = undefined;
                                            }
                                        }
                                    }
                                    catch(e) {
                                        // This exception is ignored a generic exception is used later.
                                    }                                       
                                    if (total !== undefined) {
                                        if (total) {
                                            data.total = total;
                                        }
                                        options.success(data);                                        
                                    }
                                    else {
                                        exception = new Error("Unexpected response from '" 
                                                                + transport.countFnName + "' operation.");
                                        options.error(request.xhr, request.xhr.status, exception); 
                                    }
                                });
                                promise.fail(function(fnName, jsdo, success, request){
                                    var exception;
                                    exception = new Error("Error invoking '" 
                                                            + transport.countFnName + "' operation.");
                                    options.error(request.xhr, request.xhr.status, exception);
                                });
                                /*jslint unparam: false*/                                
                            }
                            else {
                                options.success(data);
                            }
                        }
                        else {
                            options.success(data);
                        }
                    } else {
                        options.error(request.xhr, request.xhr.status, request.exception);
                    }
                };                    
                
                jsdo.fill(filter).done(callback).fail(callback);

            } catch (e) {
                options.error(null, null, e);
            }
        },
        _processChanges: function(options) {
            var jsdo = this.jsdo,
                transport = this,
                array, i, jsrecord;
            if (options.batch) {
                array = [];
                if (options.data.created instanceof Array) {
                    for (i = 0; i < options.data.created.length; i += 1) {
                        jsrecord = jsdo[transport.tableRef].findById(
                                        options.data.created[i]._id);
                        if (jsrecord) {
                            transport._convertDataTypes(jsrecord.data);
                            array.push(jsrecord.data);
                        }
                        else if (jsdo.autoApplyChanges) {
                            options.error(
                                null, 
                                null, 
                                new Error("Created record was not found in memory."));
                            return;
                        }
                    }                                
                }
                options.success(array, "create");
                
                array = [];
                if (options.data.updated instanceof Array) {
                    for (i = 0; i < options.data.updated.length; i += 1) {
                        jsrecord = jsdo[transport.tableRef].findById(
                                        options.data.updated[i]._id);
                        if (jsrecord) {
                            transport._convertDataTypes(jsrecord.data);                            
                            array.push(jsrecord.data);
                        }
                        else if (jsdo.autoApplyChanges) {
                            options.error(
                                null, 
                                null, 
                                new Error("Updated record not found in memory."));
                            return;
                        }
                    }
                }
                options.success(array, "update");
                
                array = [];
                if (options.data.destroyed instanceof Array) {
                    for (i = 0; i < options.data.destroyed.length; i += 1) {
                        jsrecord = jsdo[transport.tableRef].findById(
                                        options.data.destroyed[i]._id);
                        if (jsrecord && jsdo.autoApplyChanges) {
                            options.error(
                                null, 
                                null, 
                                new Error("Deleted record was found in memory."));
                            return;                            
                        }                        
                    }
                }
                options.success(array, "destroy");
            }
            else {
                jsrecord = jsdo[transport.tableRef].findById(options.data._id);
                if (jsrecord) {
                    transport._convertDataTypes(jsrecord.data);
                    options.success(jsrecord.data);
                }
                else {
                    options.success({});
                }
            }
        },
        _saveChanges: function(options) {
            var transport = this,
                callback = function onAfterSaveChanges(jsdo, success, request) {
                    var jsrecord,
                        xhr, status, exception;

                    if (success) {
                        // _id is expected to be set for CUD operations
                        // Deleted records will not be found and data is expected to be undefined
                        transport._processChanges(options);
                    } else {                        
                        if (request.batch
                            && request.batch.operations instanceof Array
                            && request.batch.operations.length === 1) {                                
                                xhr = request.batch.operations[0].xhr;
                                status = request.batch.operations[0].xhr.status;                            
                                if (status === 500) {
                                    exception = request.batch.operations[0].exception; 
                                }
                                else {
                                    jsrecord = jsdo[transport.tableRef].findById(options.data._id);
                                    if (jsrecord) {
                                        exception = new  Error(jsrecord.getErrorString());
                                    }
                                }
                        }
                        else if (request.jsrecords) {
                            xhr = request.xhr;
                            status = request.xhr.status;
                            // Use "default" exception text
                        }
                        if (!exception) {
                            exception = new Error("JSDO: Error while saving changes.");
                        }                            
                        options.error(xhr, status, exception);
                    }
                };

            if (this.autoSave) {
                this.jsdo.saveChanges(this.jsdo._hasSubmitOperation).done(callback).fail(callback);
            }
            else {
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
                        new Error("A newer version of Kendo UI is expected for batching support."));
                }
                else {
                    jsrecord = jsdo[this.tableRef].add(options.data);
                    options.data._id = jsrecord.data._id;
                    this._saveChanges(options);
                }                
            } catch (e) {
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
                        new Error("A newer version of Kendo UI is expected for batching support."));
                }
                else {
                    jsrecord = jsdo[this.tableRef].findById(options.data._id);
                    jsrecord.assign(options.data);
                    this._saveChanges(options);
                }                
            } catch (e) {
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
                        new Error("A newer version of Kendo UI is expected for batching support."));
                }
                else {
                    jsrecord = jsdo[this.tableRef].findById(options.data._id);
                    jsrecord.remove();
                    this._saveChanges(options);                    
                }
            } catch (e) {
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
                        }
                        else {
                            options.error(null, null, new Error("Record not found in memory."));
                        }                        
                    }
                }
                
                if (options.data.destroyed instanceof Array) {
                    for (i = 0; i < options.data.destroyed.length; i += 1) {
                        jsrecord = jsdo[this.tableRef].findById(options.data.destroyed[i]._id);
                        if (jsrecord) {
                            jsrecord.remove();
                        }
                        else {
                            options.error(null, null, new Error("Record not found in memory."));
                        }
                    }
                }

                this._saveChanges(options);
            } catch (e) {
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
