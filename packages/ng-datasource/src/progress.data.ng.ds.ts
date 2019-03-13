/*
Progress Data Source class for NativeScript, Angular. This will provide a seamless integration
between OpenEdge (Progress Data Object) with NativeScript.
Author(s): maura, anikumar, egarcia
*/
import { Injectable } from "@angular/core";
import { progress } from "@progress/jsdo-core";
import { Observable, from } from "rxjs";
import { catchError } from "rxjs/operators";

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
  _isLastResultSetEmpty: boolean;
  private _options: DataSourceOptions;
  private _tableRef: string;
  private _initFromServer: boolean;

  private _convertFields: any;
  private _convertTypes: boolean;

  // useArray === false means that arrays would be flattened
  private useArrays = false;

  constructor(options: DataSourceOptions) {
    this.jsdo = options.jsdo;
    this._initFromServer = false;
    this._isLastResultSetEmpty = false;
    this._options = options;
    this.readLocal =
      options.readLocal !== undefined ? options.readLocal : false;

    // Make sure autoApplyChanges = true
    this.jsdo.autoApplyChanges = true;

    if (!options.jsdo || !(options.jsdo instanceof progress.data.JSDO)) {
      throw new Error(
        "DataSource: jsdo property must be set to a JSDO instance."
      );
    }

    if (this._options.tableRef === undefined && this.jsdo.defaultTableRef) {
      this._options.tableRef = this.jsdo.defaultTableRef._name;
    }
    if (this._options.tableRef === undefined) {
      throw new Error(
        "DataSource: A tableRef must be specified when using a multi-table DataSet."
      );
    } else if (this.jsdo[this._options.tableRef] === undefined) {
      throw new Error(
        "DataSource: tableRef '" +
          this._options.tableRef +
          "' is not present in underlying JSDO definition."
      );
    }
    this._tableRef = this._options.tableRef;

    // Find out the name of 'Count' function from Catalog if defined as 'Count' operation
    // instead of an INVOKE
    if (this._options.countFnName !== undefined) {
      if (typeof this.jsdo[this._options.countFnName] !== "function") {
        throw new Error(
          "Invoke operation '" +
            this._options.countFnName +
            "' for countFnName is not defined."
        );
      }
    } else if (this.jsdo["_resource"].generic.count !== undefined) {
      for (const fnName in this.jsdo["_resource"].fn) {
        if (
          this.jsdo["_resource"].generic.count ===
          this.jsdo["_resource"].fn[fnName]["function"]
        ) {
          this._options.countFnName = fnName;
          break;
        }
      }
    }

    this._initConvertTypes();
  }

  // _convertStringToDate:
  _convertStringToDate(data, fieldName, targetFieldName?) {
    const transport = this;
    let array, ablType, orig;

    if (!targetFieldName) {
      targetFieldName = fieldName;
    }
    // Check if string is <year>-<month>-<day>
    array =
      transport._convertFields._datePattern.exec(data[targetFieldName]) || [];
    if (array.length > 0) {
      data[targetFieldName] = new Date(
        parseInt(array[1], 10),
        parseInt(array[2], 10) - 1,
        parseInt(array[3], 10)
      );
    } else {
      ablType =
        transport.jsdo[transport._tableRef]._fields[fieldName.toLowerCase()]
          .ablType;
      if (ablType === "DATETIME") {
        array =
          transport._convertFields._dateTimePattern.exec(
            data[targetFieldName]
          ) || [];
        if (array.length > 0) {
          // Convert date to local time zone
          data[targetFieldName] = new Date(
            parseInt(array[1], 10),
            parseInt(array[2], 10) - 1,
            parseInt(array[3], 10),
            parseInt(array[4], 10),
            parseInt(array[5], 10),
            parseInt(array[6], 10),
            parseInt(array[7], 10)
          );
        }
      }

      // Check to see if it was converted
      if (typeof data[targetFieldName] === "string") {
        orig = data[targetFieldName];
        try {
          data[targetFieldName] = new Date(data[targetFieldName]);
        } catch (e) {
          // Conversion to a date object was not successful
          data[targetFieldName] = orig;
          console.log(
            "DataSource: Internal Error: _convertStringToDate() could not convert to date object: " +
              orig
          );
        }
      }
    }
  }

  // _convertDataTypes:
  // Converts data types in the specified data record.
  // Data record could come from the JSDO or from the Kendo UI DataSource.
  // Returns a reference to the record.
  // Returns a copy when useArrays is undefined or false.
  _convertDataTypes(data) {
    const transport = this;
    let i, k, fieldName, schemaInfo, prefixElement, elementName, copy;

    // Use transport_jsdo as any to avoid exposing internal JSDO methods
    const transport_jsdo: any = transport.jsdo;

    if (
      !transport.useArrays &&
      transport._convertTypes &&
      transport._convertFields._arrayFields.length > 0
    ) {
      copy = {};
      transport_jsdo._copyRecord(
        transport_jsdo._buffers[transport._tableRef],
        data,
        copy
      );
      data = copy;
    }

    if (!transport._convertTypes) {
      return data;
    }

    for (k = 0; k < transport._convertFields._arrayFields.length; k += 1) {
      fieldName = transport._convertFields._arrayFields[k];
      if (data[fieldName]) {
        schemaInfo =
          transport.jsdo[transport._tableRef]._fields[fieldName.toLowerCase()];
        prefixElement = transport_jsdo._getArrayField(fieldName);
        for (i = 0; i < schemaInfo.maxItems; i += 1) {
          // ABL arrays are 1-based
          elementName = prefixElement.name + (i + 1);

          if (
            !transport.jsdo[transport._tableRef]._fields[
              elementName.toLowerCase()
            ]
          ) {
            // Skip element if a field with the same name exists
            // Extract value from array field into individual field
            // Array is removed later
            data[elementName] = data[fieldName][i];

            // Convert string DATE fields to JS DATE
            if (
              schemaInfo.ablType &&
              schemaInfo.ablType.indexOf("DATE") === 0 &&
              typeof data[elementName] === "string"
            ) {
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
      if (typeof data[fieldName] === "string") {
        transport._convertStringToDate(data, fieldName);
      }
    }

    return data;
  }

  // _initConvertTypes:
  // Initializes transport._convertTypes to indicate whether a conversion of the data is needed
  // when it is passed to Kendo UI.
  // This operation is currently only needed for date fields that are stored as strings.
  // Sets array _dateFields to the fields of date fields to convert.
  _initConvertTypes() {
    const transport = this;
    let i,
      schema,
      fieldName,
      convertDateFields = false;
    const dateFields = [],
      arrayFields = [];

    transport._convertTypes = false;

    schema = transport.jsdo[transport._tableRef].getSchema();
    for (i = 0; i < schema.length; i += 1) {
      fieldName = schema[i].name;
      if (fieldName.length > 0 && fieldName.charAt(0) !== "_") {
        if (
          schema[i].type === "string" &&
          schema[i].format &&
          schema[i].format.indexOf("date") !== -1
        ) {
          dateFields.push(fieldName);
          if (!convertDateFields) {
            convertDateFields = true;
          }
        } else if (!transport.useArrays && schema[i].type === "array") {
          arrayFields.push(fieldName);
          if (
            !convertDateFields &&
            schema[i].ablType &&
            schema[i].ablType.indexOf("DATE") === 0
          ) {
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
      transport._convertFields._datePattern = new RegExp(
        "^([0-9]+)?-([0-9]{2})?-([0-9]{2})?$"
      );
      transport._convertFields._dateTimePattern = new RegExp(
        "^([0-9]+)?-([0-9]{2})?-([0-9]{2})?" +
          "T([0-9]{2})?:([0-9]{2})?:([0-9]{2})?.([0-9]{3})?$"
      );
    }
    if (arrayFields.length > 0) {
      transport._convertFields._arrayFields = arrayFields;
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
        this._initFromServer =
          (jsdo[jsdo[tableRef]._parent]._data &&
            jsdo[jsdo[tableRef]._parent]._data.length > 0) ||
          (jsdo[tableRef]._data instanceof Array &&
            jsdo[tableRef]._data.length > 0);
      } else {
        this._initFromServer =
          jsdo[tableRef]._data instanceof Array &&
          jsdo[tableRef]._data.length > 0;
      }
    }

    if (this.readLocal && this._initFromServer) {
      return Observable.create(observer => {
        const data = this.getJsdoData();
        observer.next({ data: data, total: data.length });
      });
    }

    if (params && Object.keys(params).length > 0) {
      filter = params;
    } else {
      // If params has no properties, use default values for filter criteria
      if (
        this._options.filter ||
        this._options.sort ||
        this._options.top ||
        this._options.skip
      ) {
        filter.filter = this._options.filter;
        filter.sort = this._options.sort;
        filter.top = this._options.top;
        filter.skip = this._options.skip;
      } else {
        filter = undefined;
      }
    }

    // tableRef required for multi-table DataSets
    if (filter) {
      filter.tableRef = this._tableRef;
    }

    wrapperPromise = new Promise((resolve, reject) => {
      jsdo
        .fill(filter)
        .then(result => {
          // Verifying the latest resultset value and setting _isLastResultSetEmpty flag if empty

          if (
            result.request.response[this.jsdo["_dataSetName"]][
              this._tableRef
            ] &&
            result.request.response[this.jsdo["_dataSetName"]][this._tableRef]
              .length === 0
          ) {
            this._isLastResultSetEmpty = true;
          } else if (
            result.request.response[this.jsdo["_dataSetName"]] &&
            result.request.response[this.jsdo["_dataSetName"]][
              this._tableRef
            ] === undefined
          ) {
            this._isLastResultSetEmpty = true;
          } else if (
            result.request.response[this.jsdo["_dataSetName"]][
              this._tableRef
            ] &&
            result.request.response[this.jsdo["_dataSetName"]][this._tableRef]
              .length !== 0
          ) {
            this._isLastResultSetEmpty = false;
          }

          this._initFromServer = true;

          const data = this.getJsdoData();

          // Only call count() function if paging is being used
          // Paging is only used if the skip and top is being used during the fill.
          if (
            typeof params !== "undefined" &&
            (typeof this._options.countFnName !== "undefined" &&
              typeof params.skip !== "undefined" &&
              typeof params.top !== "undefined") &&
            !(params.skip === 0 && params.top > data.length)
          ) {
            // Server-side operations
            this.getRecCount(this._options.countFnName, {
              filter: result.request.objParam
                ? result.request.objParam.filter
                : undefined
            })
              .then(
                res => {
                  if (res === undefined && res == null) {
                    reject(
                      this.normalizedErrorObj(
                        res,
                        "Unexpected response from 'Count Function' Operation",
                        ""
                      )
                    );
                  } else {
                    resolve({ data, total: res });
                  }
                },
                error => {
                  reject(
                    this.normalizedErrorObj(
                      error,
                      "Problems invoking getRecCount function",
                      ""
                    )
                  );
                }
              )
              .catch(e => {
                reject(
                  this.normalizedErrorObj(
                    e,
                    "Unknown error occurred calling count.",
                    ""
                  )
                );
              });
          } else {
            // Client side operations
            resolve({ data, total: data.length });
          }
        })
        .catch(result => {
          reject(this.normalizedErrorObj(result, "read", ""));
        });
    });

    obs = from(wrapperPromise);
    obs.pipe(
      catchError(e => {
        return [];
      })
    );

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

    const id: string = data && data._id ? data._id : null;
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
        throw new Error(
          "DataSource.update(): Unable to find record with this id " + id
        );
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
    const id: string = data && data._id ? data._id : null;
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
        throw new Error(
          "DataSource.remove(): Unable to find record with this id " + id
        );
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

    promise = new Promise((resolve, reject) => {
      const responseData: object = {};

      this.jsdo
        .saveChanges(this.jsdo.hasSubmitOperation)
        .then(result => {
          tableRefVal = this._tableRef;
          if (this.jsdo.hasSubmitOperation) {
            // Submit case
            this._copyRecord(result.request.response, responseData);
            resolve(responseData);
          } else {
            // Non-Submit case
            if (
              result.request &&
              result.request.batch.operations &&
              result.request.batch.operations.length > 0
            ) {
              result.request.batch.operations.forEach(operation => {
                this._copyRecord(operation.response, responseData);
                // In case of multiple operations we want to merge those records pertaining
                // to different operations in a single dataset and is sent as part of the
                // response object for the consumer of this API.
                this._buildResponse(responseData, promResponse);
              });
              resolve(promResponse);
              // Scenario where the saveChanges is invoked directly without any Submit/Non-Submit
              // service as the serviceURI. We will resolve with an empty object
            } else if (
              result.request &&
              result.request.batch.operations.length === 0
            ) {
              resolve({});
            } else {
              // Reject promise if either of above cases are not met
              reject(
                this.normalizedErrorObj(
                  result,
                  "saveChanges",
                  "Errors occurred while saving Changes."
                )
              );
            }
          }
        })
        .catch(result => {
          if (this.jsdo.autoApplyChanges) {
            this.jsdo[this._tableRef].rejectChanges();
          }
          reject(
            this.normalizedErrorObj(
              result,
              "saveChanges",
              "Errors occurred while saving Changes."
            )
          );
        });
    });

    obs = from(promise);
    obs.pipe(
      catchError(e => {
        return [];
      })
    );

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
    let copy;
    let array;

    jsdo.useRelationships = false;
    data = jsdo[this._tableRef].getData();
    jsdo.useRelationships = saveUseRelationships;

    // Make copy of jsdo data for datasource
    if (this._convertTypes) {
      array = [];
      data.forEach(item => {
        if (!this.useArrays && this._convertFields._arrayFields.length > 0) {
          // Use a reference
          // _convertDataTypes() will create the copy for this case
          copy = item;
        } else {
          copy = Object.assign({}, item);
        }

        copy = this._convertDataTypes(copy);
        array.push(copy);
      });
      data = array;
    } else {
      data = data.length > 0 ? data.map(item => Object.assign({}, item)) : [];
    }

    return data;
  }

  /**
   * This method is used for fetching the 'count' of records from backend
   * This method is used as part of read() operation when serverOperations is set by client
   * @param {string} name Name of the method pertaining to 'Count' functionality
   * @param {any} object Filter object
   */
  private getRecCount(name: string, object: any): Promise<any> {
    let countVal: any;
    let getRecCountPromise;

    getRecCountPromise = new Promise((resolve, reject) => {
      this.jsdo
        .invoke(name, object)
        .then(result => {
          try {
            if (
              typeof result.request.response === "object" &&
              Object.keys(result.request.response).length === 1
            ) {
              countVal = Object.values(result.request.response)[0];
              if (typeof countVal !== "number") {
                countVal = undefined;
              }
            }
            resolve(countVal);
          } catch (e) {
            reject(this.normalizedErrorObj(e, "getRecCount", ""));
          }
        })
        .catch(result => {
          reject(
            this.normalizedErrorObj(
              result,
              "Error invoking the 'Count' operation",
              ""
            )
          );
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

  /**
   * This method is called after an error has occurred on a jsdo operation, and is
   * used to get an error object.
   * @param {any} result Object containing error info returned after execution of jsdo operation
   * @param {string} operation String containing operation performed when error occurred
   * @param {string} genericMsg If multiple errors are found in result object, if specified,
   * this string will be returned as part of the new error object. If not specified, first error
   * string will be returned.
   * @returns A single error object with all information
   */
  private normalizedErrorObj(
    result: any,
    operation: string,
    genericMsg: string
  ) {
    let errorObj: { [key: string]: any } = {};
    let eMsg = "";
    let object: { [key: string]: any } = {};

    if (result && result.jsdo && result.success == false) {
      object = result.request;
    }

    eMsg = this.normalizeError(result, operation, genericMsg);

    errorObj = new Error(eMsg);
    errorObj.info = object;

    return errorObj;
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
        if (
          source[field] === undefined ||
          source[field] === null ||
          (field.charAt(0) === "_" && field !== "_id") ||
          field.startsWith("prods:")
        ) {
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
    let firstKey = Object.keys(source)[0];
    const secondKey = firstKey ? Object.keys(source[firstKey])[0] : undefined;

    // Delete's on no submit services return empty datasets so
    // don't add anything.
    if (
      typeof source[firstKey] !== "undefined" &&
      typeof source[firstKey][secondKey] !== "undefined"
    ) {
      if (Object.keys(target).length === 0) {
        this._copyRecord(source, target);
      } else {
        firstKey = Object.keys(target)[0];

        // Delete's on no submit services return empty datasets so
        // don't add anything.
        if (
          firstKey &&
          typeof target[firstKey][this._tableRef] !== "undefined"
        ) {
          // Dataset usecase
          if (firstKey !== this._tableRef) {
            target[firstKey][this._tableRef].push(
              newEntry[firstKey][this._tableRef][0]
            );
          } else {
            // Temp-table usecase
            target[this._tableRef].push(newEntry[this._tableRef][0]);
          }

          return target;
        }
      }
    }
  }
}
