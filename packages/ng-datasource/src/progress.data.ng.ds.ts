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

import { Injectable } from "@angular/core";
import { progress } from "@progress/jsdo-core";
import "rxjs/add/observable/fromPromise";
import "rxjs/add/operator/catch";
import { Observable } from "rxjs/Observable";

export class DataSourceOptions {
    jsdo: progress.data.JSDO;
    tableRef?: string;
    filter?: any;
    sort?: any;
    top?: number;
    skip?: number;
    mergeMode?: number;
    readLocal?: boolean;
    countFnName?: string;
}

export interface DataResult {
    data: Array<object>;
    total: number;
}

// tslint:disable max-classes-per-file
@Injectable()
export class DataSource {
    jsdo: progress.data.JSDO = undefined;
    readLocal: boolean;
    _skipRec: number;
    private _options: DataSourceOptions;
    private _tableRef: string;
    private _initFromServer: boolean;

    constructor(options: DataSourceOptions) {
        this.jsdo = options.jsdo;
        this._initFromServer = false;
        this._options = options;
        this.readLocal = options.readLocal !== undefined ? options.readLocal : false;

        // Make sure autoApplyChanges = true
        this.jsdo.autoApplyChanges = true;

        if (!options.jsdo || !(options.jsdo instanceof progress.data.JSDO)) {
            throw new Error("DataSource: jsdo property must be set to a JSDO instance.");
        }

        if (this._options.tableRef === undefined && this.jsdo.defaultTableRef) {
            this._options.tableRef = this.jsdo.defaultTableRef._name;
        }
        if (this._options.tableRef === undefined) {
            throw new Error("DataSource: A tableRef must be specified when using a multi-table DataSet.");
        } else if (this.jsdo[this._options.tableRef] === undefined) {
            throw new Error("DataSource: tableRef '"
                + this._options.tableRef + "' is not present in underlying JSDO definition.");
        }
        this._tableRef = this._options.tableRef;

        // Find out the name of 'Count' function from Catalog if defined as 'Count' operation
        // instead of an INVOKE 
        if (this._options.countFnName !== undefined) {
            if (typeof (this.jsdo[this._options.countFnName]) !== "function") {
                throw new Error("Invoke operation '" +
                    this._options.countFnName + "' for countFnName is not defined.");
            }
        } else if (this.jsdo['_resource'].generic.count !== undefined) {
            for (const fnName in this.jsdo['_resource'].fn) {
                if (this.jsdo['_resource'].generic.count === this.jsdo['_resource'].fn[fnName]['function']) {
                    this._options.countFnName = fnName;
                    break;
                }
            }
        }
    }

    /**
     * Calls the jsdo.fill() retrieving data from the backend service
     * @returns An Observable which includes an Array<Object> followed
     * by an attribute for specifying 'total' records
     */
    read(params?: progress.data.FilterOptions): Observable<DataResult> {
        let wrapperPromise;
        let obs: Observable<DataResult>;
        let filter: any = {};
        const jsdo = this.jsdo;
        const tableRef = this._tableRef;

        // If this is a DataSource for a child table, check if read() was performed on parent
        if (!this._initFromServer) {
            if (jsdo[tableRef]._parent) {
                this._initFromServer = (jsdo[jsdo[tableRef]._parent]._data &&
                    (jsdo[jsdo[tableRef]._parent]._data.length > 0))
                    || (jsdo[tableRef]._data instanceof Array && (jsdo[tableRef]._data.length > 0));
            } else {
                this._initFromServer = (jsdo[tableRef]._data instanceof Array) && (jsdo[tableRef]._data.length > 0);
            }
        }

        if (this.readLocal && this._initFromServer) {
            return Observable.create((observer) => {
                const data = this.getJsdoData();
                observer.next({ data: data, total: data.length });
            });
        }

        if (params) {
            filter = params;
        } else {
            // Initial read() where the params are empty and we are assigning the filter criteria
            filter.filter = this._options.filter;
            filter.sort = this._options.sort;
            filter.top = this._options.top;
            filter.skip = this._options.skip;
        }

        // tableRef required for multi-table DataSets
        filter.tableRef = this._tableRef;

        wrapperPromise = new Promise(
            (resolve, reject) => {
                jsdo.fill(filter)
                    .then((result) => {
                        this._initFromServer = true;

                        let data = this.getJsdoData();

                        if ((this._options.countFnName && this._options.countFnName !== undefined) && !(params.skip == 0 && params.top > data.length)) { // Server-side operations
                            this.getRecCount(this._options.countFnName, {filter: result.request.objParam.filter})
                                .then((result) => {
                                    if (result == undefined && result == null) {
                                        reject(new Error(this.normalizeError(result, "Unexpected response from 'Count Function' Operation", "")));
                                    } else {
                                        resolve({ data: data, total: result });
                                    }
                                }, (error) => {
                                    reject(new Error(this.normalizeError(error, "Problems invoking getRecCount function", "")));
                                }).catch((e) => {
                                    reject(new Error(this.normalizeError(e, 'Unknown error occurred calling count.', "")));
                                });
                        } else {
                            // Client side operations
                            resolve({ data: data, total: data.length })
                        }

                    }).catch((result) => {
                        reject(new Error(this.normalizeError(result, "read", "")));
                    });
            }
        );

        obs = Observable.fromPromise(wrapperPromise);
        obs.catch((e) => {
            return [];
        });

        return obs;
    }

    /**
     * Returns array of record objects from local memory
     * @returns Array<object>
     */
    getData(): Array<object> {
        return this.getJsdoData();
    }

    /**
     * Calls the jsdo.add() method, creating a new record in JSDO memory
     * jsdo.add() will either return the new record, or throws an exception
     * @param data - Record to create is passed as an object
     * @returns - If successful, an object of the new record is returned
     */
    create(data: object): object {
        let jsRecord;
        const newRow = {};
        const saveUseRelationships = this.jsdo.useRelationships;

        try {
            this.jsdo.useRelationships = false;
            jsRecord = this.jsdo[this._tableRef].add(data);
            this._copyRecord(jsRecord.data, newRow);
        } catch (error) {
            if (this.jsdo.autoApplyChanges) {
                this.jsdo[this._tableRef].rejectChanges();
            }
            throw error;
        } finally {
            this.jsdo.useRelationships = saveUseRelationships;
        }

        return newRow;
    }

    /**
     * Returns a copy of the record with the specified id.
     * Note: current implementation uses jsdo's internal _id as id.
     * @param id - id of record
     * @returns - copy of record with specified id, else null if no record found
     */
    findById(id: string): object {
        let jsRecord;
        const row = {};

        // For now, we are using _id as our id to find records..
        jsRecord = this.jsdo[this._options.tableRef].findById(id, false);
        if (jsRecord) {
            this._copyRecord(jsRecord.data, row);

            return row;
        } else {

            return null;
        }
    }

    /**
     * Calls the jsdo.update() method, for updating a record in JSDO memory
     * jsdo.update() will either return the updated record, or throws an exception
     * @param data - Record to create is passed as an object
     * @returns - boolean. True if successful, false if there is any failure
     */
    update(data: any): boolean {
        const saveUseRelationships = this.jsdo.useRelationships;

        if (!data && (data === undefined || null)) {
            throw new Error("Unexpected signature for update() operation.");
        }

        const id: string = (data && data._id) ? data._id : null;
        let jsRecord;
        let retVal = false;

        if (!id) {
            throw new Error("DataSource.update(): data missing _id property");
        }

        try {
            this.jsdo.useRelationships = false;
            jsRecord = this.jsdo[this._tableRef].findById(id);
            if (jsRecord) {
                // Found a valid record. Lets update now
                retVal = jsRecord.assign(data);
                this.jsdo.useRelationships = saveUseRelationships;
            } else {
                throw new Error("DataSource.update(): Unable to find record with this id " + id);
            }
        } catch (error) {
            if (this.jsdo.autoApplyChanges) {
                this.jsdo[this._tableRef].rejectChanges();
            }
            throw error;
        } finally {
            this.jsdo.useRelationships = saveUseRelationships;
        }

        return retVal;
    }

    /**
     * Deletes a record from JSDO memory by calling jsdo.remove() API. This accepts a record
     * with a valid _id without which an error is reported
     * @param data Provide valid record for deletion
     * @returns boolean - True if the operation succeeds, false otherwise
     */
    remove(data: any): boolean {
        let retVal = false;
        const id: string = (data && data._id) ? data._id : null;
        const saveUseRelationships = this.jsdo.useRelationships;
        let jsRecord;

        if (!data && (data === undefined || null)) {
            throw new Error("Unexpected signature for remove() operation.");
        }

        if (!id) {
            throw new Error("DataSource.remove(): data missing _id property");
        }

        try {
            this.jsdo.useRelationships = false;
            jsRecord = this.jsdo[this._tableRef].findById(id);
            if (jsRecord) {
                // Found a valid record. Lets delete the record
                retVal = jsRecord.remove(data);
            } else {
                throw new Error("DataSource.remove(): Unable to find record with this id " + id);
            }
        } catch (error) {
            if (this.jsdo.autoApplyChanges) {
                this.jsdo[this._tableRef].rejectChanges();
            }
            throw error;
        } finally {
            this.jsdo.useRelationships = saveUseRelationships;
        }

        return retVal;
    }

    /**
     * Returns true if the underlying jsdo has CUD support (create, update, delete operations).
     * If not, it returns false.
     */
    hasCUDSupport(): boolean {
        return this.jsdo.hasCUDOperations;
    }

    /**
     * Returns true if the underlying jsdo has Submit support (submit operation).
     * If not, it returns false.
     */
    hasSubmitSupport(): boolean {
        return this.jsdo.hasSubmitOperation;
    }

    /**
     * Synchronizes to the server all record changes (creates, updates, and deletes) pending in
     * JSDO memory for the current Data Object resource
     * If jsdo.hasSubmitOperation is false, all record modifications are sent to server individually.
     * When 'true', modifications are batched together and sent in single request
     * @returns {object} Observable
     */
    saveChanges(): Observable<Array<object>> {
        let promise;
        let obs: Observable<Array<object>>;
        const promResponse: object = {};
        let tableRefVal: any;

        promise = new Promise(
            (resolve, reject) => {
                const responseData: object = {};

                this.jsdo.saveChanges(this.jsdo.hasSubmitOperation)
                    .then((result) => {
                        tableRefVal = this._tableRef;
                        if (this.jsdo.hasSubmitOperation) {
                            // Submit case
                            this._copyRecord(result.request.xhr.response, responseData);
                            resolve(responseData);
                        } else {
                            // Non-Submit case
                            if (result.info.batch.operations && result.info.batch.operations.length > 0) {
                                result.info.batch.operations.forEach((operation) => {
                                    this._copyRecord(operation.response, responseData);
                                    // In case of multiple operations we want to merge those records pertaining
                                    // to different operations in a single dataset and is sent as part of the
                                    // response object for the consumer of this API.
                                    this._buildResponse(responseData, promResponse);
                                });
                                resolve(promResponse);
                                // Scenario where the saveChanges is invoked directly without any Submit/Non-Submit
                                // service as the serviceURI. We will resolve with an empty object
                            } else if (result.info.batch.operations.length === 0) {
                                resolve({});
                            } else { // Reject promise if either of above cases are met
                                reject(new Error(this.normalizeError(result, "saveChanges", "Errors occurred while saving Changes.")));
                            }
                        }
                    }).catch((result) => {
                        if (this.jsdo.autoApplyChanges) {
                            this.jsdo[this._tableRef].rejectChanges();
                        }
                        reject(new Error(this.normalizeError(result, "saveChanges", "Errors occurred while saving Changes.")));
                    });
            }
        );

        obs = Observable.fromPromise(promise);
        obs.catch((e) => {
            return [];
        });

        return obs;
    }

    /**
     * First, retrieves data from JSDO local memory
     * Then makes a copy of it, to ensure jsdo memory is only manipulated thru DataSource API
     * Returns array of record objects
     * @returns Array<object>
     */
    private getJsdoData(): Array<object> {
        const jsdo = this.jsdo;
        const saveUseRelationships = jsdo.useRelationships;
        let data;

        jsdo.useRelationships = false;
        data = jsdo[this._tableRef].getData();
        jsdo.useRelationships = saveUseRelationships;

        // Make copy of jsdo data for datasource
        data = (data.length > 0 ? data.map((item) => Object.assign({}, item)) : []);

        return data;
    }

    /**
     * This method is used for fetching the 'count' of records from backend
     * This method is used as part of read() operation when serverOperations is set by client
     * @param {string} name Name of the method pertaining to 'Count' functionality
     * @param {any} object Valid 'filter' oject
     */
    private getRecCount(name: string, object: any): Promise<any> {
        let countVal: any;
        let getRecCountPromise;

        getRecCountPromise = new Promise(
            (resolve, reject) => {
                this.jsdo.invoke(name, object)
                    .then((result) => {

                        try {
                            if (typeof (result.request.response) === 'object' && Object.keys(result.request.response).length === 1) {
                                countVal = Object.values(result.request.response)[0];
                                if (typeof (countVal) !== 'number') {
                                    countVal = undefined;
                                }
                            }
                            resolve(countVal);
                        } catch (e) {
                            reject(new Error(this.normalizeError(e, "getRecCount", "")));
                        }
                    }).catch((result) => {
                        reject(new Error(this.normalizeError(result, "Error invoking the 'Count' operation", "")));
                    });
            });

        return getRecCountPromise;
    }

    /**
     * This method is called after an error has occurred on a jsdo operation, and is
     * used to get an error message.
     * @param {any} result Object containing error info returned after execution of jsdo operation
     * @param {string} operation String containing operation performed when error occurred
     * @param {string} genericMsg If multiple errors are found in result object, if specified,
     * this string will be returned. If not specified, first error string will be returned.
     * @returns A single error message
     */
    private normalizeError(result: any, operation: string, genericMsg: string) {
        let errorMsg = "";
        let lastErrors = null;

        try {
            if (result.info && result.info.errorObject) {
                errorMsg = result.info.errorObject.message;
            } else if (result.jsdo) {
                lastErrors = result.jsdo[this._tableRef].getErrors();
                if (lastErrors.length >= 1) {
                    // If generic message is provided, use that, else we'll just grab first message
                    if (lastErrors.length > 1 && genericMsg) {
                        errorMsg = genericMsg;
                    } else {
                        errorMsg = lastErrors[0].error;
                    }
                }
            } else if (result.message) {
                errorMsg = result.message;
            }

            if (errorMsg === "") {
                errorMsg = "Unknown error occurred when calling " + operation + ".";
            }
        } catch (error) {
            errorMsg = error.message;
        }

        return errorMsg;
    }

    private _copyRecord(source, target) {
        let field;
        let newObject;

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
                } else if (typeof source[field] === "object") {
                    newObject = source[field] instanceof Array ? [] : {};
                    this._copyRecord(source[field], newObject);
                    target[field] = newObject;
                } else {
                    target[field] = source[field];
                }
            }
        }
    }

    /**
     * This method is responsible for building a valid responseObject when multiple records
     * are involved in transaction
     * @param source  Actual dataset/record to be merged
     * @param target  Resultant dataset with all records information
     */
    private _buildResponse(source, target) {
        const newEntry = source;
        let firstKey = Object.keys(source)[0],
            secondKey = (firstKey) ? Object.keys(source[firstKey])[0] : undefined;

        // Delete's on no submit services return empty datasets so
        // don't add anything.
        if (typeof source[firstKey] !== "undefined"
            && typeof source[firstKey][secondKey] !== "undefined") {

            if (Object.keys(target).length === 0) {
                this._copyRecord(source, target);
            } else {
                firstKey = Object.keys(target)[0];

                // Delete's on no submit services return empty datasets so
                // don't add anything.
                if (firstKey && typeof target[firstKey][this._tableRef] !== "undefined") {
                    // Dataset usecase
                    if (firstKey !== this._tableRef) {
                        target[firstKey][this._tableRef].push(newEntry[firstKey][this._tableRef][0]);
                    } else { // Temp-table usecase
                        target[this._tableRef].push(newEntry[this._tableRef][0]);
                    }

                    return target;
                }
            }
        }
    }
}
