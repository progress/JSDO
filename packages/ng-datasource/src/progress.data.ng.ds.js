"use strict";
/*
Progress JSDO DataSource for Angular: 5.0.0
Copyright 2017-2018 Progress Software Corporation and/or its subsidiaries or affiliates.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
progress.data.ng.ds.ts    Version: v5.0.0
Progress DataSource class for NativeScript, Angular. This will provide a seamless integration
between OpenEdge (Progress Data Object) with NativeScript.
Author(s): maura, anikumar, egarcia
*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var jsdo_core_1 = require("@progress/jsdo-core");
require("rxjs/add/observable/fromPromise");
require("rxjs/add/operator/catch");
var Observable_1 = require("rxjs/Observable");
var DataSourceOptions = /** @class */ (function () {
    function DataSourceOptions() {
    }
    return DataSourceOptions;
}());
exports.DataSourceOptions = DataSourceOptions;
// tslint:disable max-classes-per-file
var DataSource = /** @class */ (function () {
    function DataSource(options) {
        this.jsdo = undefined;
        this._data = null;
        this.jsdo = options.jsdo;
        this._options = options;
        // Turning off autoApplyChanges. Want to explicitly call jsdo.acceptChanges() and rejectChanges()
        this.jsdo.autoApplyChanges = false;
        if (!options.jsdo || !(options.jsdo instanceof jsdo_core_1.progress.data.JSDO)) {
            throw new Error("DataSource: jsdo property must be set to a JSDO instance.");
        }
        if (this._options.tableRef === undefined && this.jsdo.defaultTableRef) {
            this._options.tableRef = this.jsdo.defaultTableRef._name;
        }
        if (this._options.tableRef === undefined) {
            throw new Error("DataSource: A tableRef must be specified when using a multi-table DataSet.");
        }
        else if (this.jsdo[this._options.tableRef] === undefined) {
            throw new Error("DataSource: tableRef '"
                + this._options.tableRef + "' is not present in underlying JSDO definition.");
        }
        this._tableRef = this._options.tableRef;
    }
    /**
     * Calls the jsdo.fill() retrieving data from the backend service
     * @returns Observable<Array<object>>
     */
    DataSource.prototype.read = function (params) {
        var _this = this;
        var wrapperPromise;
        var obs;
        var filter = {};
        if (params) {
            filter = params;
        }
        else {
            // Initial read() where the params are empty and we are assigning the filter criteria
            filter.filter = this._options.filter;
            filter.sort = this._options.sort;
            filter.top = this._options.top;
            filter.skip = this._options.skip;
        }
        // tableRef required for multi-table DataSets
        filter.tableRef = this._tableRef;
        wrapperPromise = new Promise(function (resolve, reject) {
            _this.jsdo.fill(filter)
                .then(function (result) {
                var data = result.jsdo[_this._tableRef].getData();
                // Make copy of jsdo data for datasource
                _this._data = (data.length > 0 ? data.map(function (item) { return Object.assign({}, item); }) : []);
                resolve(_this._data);
            }).catch(function (result) {
                reject(new Error(_this.normalizeError(result, "read", "")));
            });
        });
        obs = Observable_1.Observable.fromPromise(wrapperPromise);
        obs.catch(function (e) {
            return [];
        });
        // return Observable.fromPromise(wrapperPromise);
        return obs;
    };
    /**
     * Returns array of record objects from JSDO local memory
     * @returns {object}
     */
    DataSource.prototype.getData = function () {
        return this.jsdo[this._tableRef].getData();
    };
    /**
     * Calls the jsdo.add() method, creating a new record in JSDO memory
     * jsdo.add() will either return the new record, or throws an exception
     * @param data - Record to create is passed as an object
     * @returns - If successful, an object of the new record is returned
     */
    DataSource.prototype.create = function (data) {
        var jsRecord;
        var newRow = {};
        jsRecord = this.jsdo[this._tableRef].add(data);
        this._copyRecord(jsRecord.data, newRow);
        return newRow;
    };
    /**
     * Returns a copy of the record with the specified id.
     * Note: current implementation uses jsdo's internal _id as id.
     * @param id - id of record
     * @returns - copy of record with specified id, else null if no record found
     */
    DataSource.prototype.findById = function (id) {
        var jsRecord;
        var row = {};
        // For now, we are using _id as our id to find records..
        jsRecord = this.jsdo[this._options.tableRef].findById(id, false);
        if (jsRecord) {
            this._copyRecord(jsRecord.data, row);
            return row;
        }
        else {
            return null;
        }
    };
    /**
     * Calls the jsdo.update() method, for updating a record in JSDO memory
     * jsdo.update() will either return the updated record, or throws an exception
     * @param data - Record to create is passed as an object
     * @returns - boolean. True if successful, false if there is any failure
     */
    DataSource.prototype.update = function (data) {
        if (!data && (data === undefined || null)) {
            throw new Error("Unexpected signature for update() operation.");
        }
        var id = (data && data._id) ? data._id : null;
        var jsRecord;
        var retVal = false;
        if (!id) {
            throw new Error("DataSource.update(): data missing _id property");
        }
        jsRecord = this.jsdo[this._tableRef].findById(id);
        if (jsRecord) {
            // Found a valid record. Lets update now
            retVal = jsRecord.assign(data);
        }
        else {
            throw new Error("DataSource.update(): Unable to find record with this id " + id);
        }
        return retVal;
    };
    /**
     * Deletes a record from JSDO memory by calling jsdo.remove() API. This accepts a record
     * with a valid _id without which an error is reported
     * @param data Provide valid record for deletion
     * @returns boolean - True if the operation succeeds, false otherwise
     */
    DataSource.prototype.remove = function (data) {
        var retVal = false;
        var id = (data && data._id) ? data._id : null;
        var jsRecord;
        if (!data && (data === undefined || null)) {
            throw new Error("Unexpected signature for remove() operation.");
        }
        if (!id) {
            throw new Error("DataSource.remove(): data missing _id property");
        }
        jsRecord = this.jsdo[this._tableRef].findById(id);
        if (jsRecord) {
            // Found a valid record. Lets delete the record
            retVal = jsRecord.remove(data);
        }
        else {
            throw new Error("DataSource.remove(): Unable to find record with this id " + id);
        }
        return retVal;
    };
    /**
     * Accepts any pending changes in the data source. This results in the removal of the
     * before-image data. It also clears out any error messages.
     */
    DataSource.prototype.acceptChanges = function () {
        this.jsdo[this._tableRef].acceptChanges();
    };
    /**
     * Cancels any pending changes in the data source. Deleted rows are restored,
     * new rows are removed and updated rows are restored to their initial state.
     */
    DataSource.prototype.cancelChanges = function () {
        this.jsdo[this._tableRef].rejectChanges();
    };
    /**
     * Returns true if the underlying jsdo has CUD support (create, update, delete operations).
     * If not, it returns false.
     */
    DataSource.prototype.hasCUDSupport = function () {
        return this.jsdo.hasCUDOperations;
    };
    /**
     * Returns true if the underlying jsdo has Submit support (submit operation).
     * If not, it returns false.
     */
    DataSource.prototype.hasSubmitSupport = function () {
        return this.jsdo.hasSubmitOperation;
    };
    /**
     * Synchronizes to the server all record changes (creates, updates, and deletes) pending in
     * JSDO memory for the current Data Object resource
     * If jsdo.hasSubmitOperation is false, all record modifications are sent to server individually.
     * When 'true', modifications are batched together and sent in single request
     * @returns {object} Observable
     */
    DataSource.prototype.saveChanges = function () {
        var _this = this;
        var promise;
        var obs;
        var promResponse = {};
        var tableRefVal;
        promise = new Promise(function (resolve, reject) {
            var responseData = {};
            _this.jsdo.saveChanges(_this.jsdo.hasSubmitOperation)
                .then(function (result) {
                tableRefVal = _this._tableRef;
                if (_this.jsdo.hasSubmitOperation) {
                    // Submit case
                    _this._copyRecord(result.request.xhr.response, responseData);
                    resolve(responseData);
                }
                else {
                    // Non-Submit case
                    if (result.info.batch.operations && result.info.batch.operations.length > 0) {
                        result.info.batch.operations.forEach(function (operation) {
                            _this._copyRecord(operation.response, responseData);
                            // In case of multiple operations we want to merge those records pertaining
                            // to different operations in a single dataset and is sent as part of the
                            // response object for the consumer of this API.
                            _this._buildResponse(responseData, promResponse);
                        });
                        resolve(promResponse);
                        // Scenario where the saveChanges is invoked directly without any Submit/Non-Submit
                        // service as the serviceURI. We will resolve with an empty object
                    }
                    else if (result.info.batch.operations.length === 0) {
                        resolve({});
                    }
                    else {
                        reject(new Error(_this.normalizeError(result, "saveChanges", "Errors occurred while saving Changes.")));
                    }
                }
            }).catch(function (result) {
                reject(new Error(_this.normalizeError(result, "saveChanges", "Errors occurred while saving Changes.")));
            });
        });
        obs = Observable_1.Observable.fromPromise(promise);
        obs.catch(function (e) {
            return [];
        });
        return obs;
    };
    /**
     * This method is called after an error has occurred on a jsdo operation, and is
     * used to get an error message.
     * @param {any} result Object containing error info returned after execution of jsdo operation
     * @param {string} operation String containing operation performed when error occurred
     * @param {string} genericMsg If multiple errors are found in result object, if specified,
     * this string will be returned. If not specified, first error string will be returned.
     * @returns A single error message
     */
    DataSource.prototype.normalizeError = function (result, operation, genericMsg) {
        var errorMsg = "";
        var lastErrors = null;
        try {
            if (result.info && result.info.errorObject) {
                errorMsg = result.info.errorObject.message;
            }
            else if (result.jsdo) {
                lastErrors = result.jsdo[this._tableRef].getErrors();
                if (lastErrors.length >= 1) {
                    // If generic message is provided, use that, else we'll just grab first message
                    if (lastErrors.length > 1 && genericMsg) {
                        errorMsg = genericMsg;
                    }
                    else {
                        errorMsg = lastErrors[0].error;
                    }
                }
            }
            else if (result.message) {
                errorMsg = result.message;
            }
            if (errorMsg === "") {
                errorMsg = "Unknown error occurred when calling " + operation + ".";
            }
        }
        catch (error) {
            errorMsg = error.message;
        }
        return errorMsg;
    };
    DataSource.prototype._copyRecord = function (source, target) {
        var field;
        var newObject;
        if (!target) {
            console.log("_copyRecord: target parameter is not defined");
            return;
        }
        for (field in source) {
            if (source.hasOwnProperty(field)) {
                // Ignore all internal fields, except _id
                if (source[field] === undefined || source[field] === null ||
                    (field.charAt(0) === "_" && field !== "_id") ||
                    field.startsWith("prods:")) {
                    continue;
                }
                if (source[field] instanceof Date) {
                    target[field] = source[field];
                }
                else if (typeof source[field] === "object") {
                    newObject = source[field] instanceof Array ? [] : {};
                    this._copyRecord(source[field], newObject);
                    target[field] = newObject;
                }
                else {
                    target[field] = source[field];
                }
            }
        }
    };
    /**
     * This method is responsible for building a valid responseObject when multiple records
     * are involved in transaction
     * @param source  Actual dataset/record to be merged
     * @param target  Resultant dataset with all records information
     */
    
    DataSource.prototype._buildResponse = function (source, target) {
        var newEntry = source;
        var firstKey = Object.keys(source)[0], secondKey = (firstKey) ? Object.keys(source[firstKey])[0] : undefined;
        // Delete's on no submit services return empty datasets so
        // don't add anything.
        if (typeof source[firstKey] !== "undefined"
            && typeof source[firstKey][secondKey] !== "undefined") {
            if (Object.keys(target).length === 0) {
                this._copyRecord(source, target);
            }
            else {
                firstKey = Object.keys(target)[0];
                // Delete's on no submit services return empty datasets so
                // don't add anything.
                if (firstKey && typeof target[firstKey][this._tableRef] !== "undefined") {
                    // Dataset usecase
                    if (firstKey !== this._tableRef) {
                        target[firstKey][this._tableRef].push(newEntry[firstKey][this._tableRef][0]);
                    }
                    else { // Temp-table usecase
                        target[this._tableRef].push(newEntry[this._tableRef][0]);
                    }
                    return target;
                }
            }
        }
    };
    DataSource = __decorate([
        core_1.Injectable()
    ], DataSource);
    return DataSource;
}());
exports.DataSource = DataSource;