import { progress } from "@progress/jsdo-core";
import "rxjs/add/observable/fromPromise";
import "rxjs/add/operator/catch";
import { Observable } from "rxjs/Observable";
export declare class DataSourceOptions {
    jsdo: progress.data.JSDO;
    tableRef?: string;
    filter?: any;
    sort?: any;
    top?: any;
    skip?: any;
    mergeMode?: any;
    pageSize?: any;
    readLocal?: boolean;
}
export declare class DataSource {
    jsdo: progress.data.JSDO;
    private _options;
    private _tableRef;
    _skipRec: number;
    constructor(options: DataSourceOptions);
    /**
     * Calls the jsdo.fill() retrieving data from the backend service
     * @returns Observable<Array<object>>
     */
    read(params?: progress.data.FilterOptions): Observable<Array<object>>;
    /**
     * Returns array of record objects from JSDO local memory
     * @returns {object}
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
     * @param {boolean} useSubmit Optional parameter. By default points to 'false' where all
     * record modifications are sent to server individually. When 'true' is used all record
     * modifications are batched together and are sent in single transaction
     * @returns {object} Promise
     */
    saveChanges(): Observable<Array<object>>;
    private normalizeError(result, defaultMsg);
    private _copyRecord(source, target);
    /**
     * This method is responsible for building a valid responseObject when multiple records
     * are involved in transaction
     * @param source  Actual dataset/record to be merged
     * @param target  Resultant dataset with all records information
     */
    private _buildResponse(source, target);
}
