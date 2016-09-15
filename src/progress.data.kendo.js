
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
