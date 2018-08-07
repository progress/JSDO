import { progress } from "@progress/jsdo-core";
import "rxjs/add/observable/fromPromise";
import "rxjs/add/operator/catch";
import { Observable } from "rxjs/Observable";
export declare class DataSourceOptions {
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
export declare class DataSource {
    jsdo: progress.data.JSDO;
    readLocal: boolean;
    _skipRec: number;
    _isLastResultSetEmpty: boolean;
    private _options;
    private _tableRef;
    private _initFromServer;
    constructor(options: DataSourceOptions);
    /**
     * Calls the jsdo.fill() retrieving data from the backend service
     * @returns An Observable which includes an Array<Object> followed
     * by an attribute for specifying 'total' records
     */
    read(params?: progress.data.FilterOptions): Observable<DataResult>;
    /**
     * Returns array of record objects from local memory
     * @returns Array<object>
     */
    getData(): Array<object>;
    /**
     * Calls the jsdo.add() method, creating a new record in JSDO memory
     * jsdo.add() will either return the new record, or throws an exception
     * @param data - Record to create is passed as an object
     * @returns - If successful, an object of the new record is returned
     */
    create(data: object): object;
    /**
     * Returns a copy of the record with the specified id.
     * Note: current implementation uses jsdo's internal _id as id.
     * @param id - id of record
     * @returns - copy of record with specified id, else null if no record found
     */
    findById(id: string): object;
    /**
     * Calls the jsdo.update() method, for updating a record in JSDO memory
     * jsdo.update() will either return the updated record, or throws an exception
     * @param data - Record to create is passed as an object
     * @returns - boolean. True if successful, false if there is any failure
     */
    update(data: any): boolean;
    /**
     * Deletes a record from JSDO memory by calling jsdo.remove() API. This accepts a record
     * with a valid _id without which an error is reported
     * @param data Provide valid record for deletion
     * @returns boolean - True if the operation succeeds, false otherwise
     */
    remove(data: any): boolean;
    /**
     * Returns true if the underlying jsdo has CUD support (create, update, delete operations).
     * If not, it returns false.
     */
    hasCUDSupport(): boolean;
    /**
     * Returns true if the underlying jsdo has Submit support (submit operation).
     * If not, it returns false.
     */
    hasSubmitSupport(): boolean;
    /**
     * Synchronizes to the server all record changes (creates, updates, and deletes) pending in
     * JSDO memory for the current Data Object resource
     * If jsdo.hasSubmitOperation is false, all record modifications are sent to server individually.
     * When 'true', modifications are batched together and sent in single request
     * @returns {object} Observable
     */
    saveChanges(): Observable<Array<object>>;
    /**
     * First, retrieves data from JSDO local memory
     * Then makes a copy of it, to ensure jsdo memory is only manipulated thru Data Source API
     * Returns array of record objects
     * @returns Array<object>
     */
    private getJsdoData();
    /**
     * This method is used for fetching the 'count' of records from backend
     * This method is used as part of read() operation when serverOperations is set by client
     * @param {string} name Name of the method pertaining to 'Count' functionality
     * @param {any} object Filter object
     */
    private getRecCount(name, object);
    /**
     * This method is called after an error has occurred on a jsdo operation, and is
     * used to get an error message.
     * @param {any} result Object containing error info returned after execution of jsdo operation
     * @param {string} operation String containing operation performed when error occurred
     * @param {string} genericMsg If multiple errors are found in result object, if specified,
     * this string will be returned. If not specified, first error string will be returned.
     * @returns A single error message
     */
    private normalizeError(result, operation, genericMsg);
    private _copyRecord(source, target);
    /**
     * This method is responsible for building a valid responseObject when multiple records
     * are involved in transaction
     * @param source  Actual dataset/record to be merged
     * @param target  Resultant dataset with all records information
     */
    private _buildResponse(source, target);
}
