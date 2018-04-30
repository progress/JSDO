/**
 * Type definitions for progress.js 5.0 library. This is part of progress.all.js
 * Project: Progress JSDO
 * Definitions by: egarcia, Traveleye, anikumar
 */

export module progress {

    export class data {

        /**
         * A stand-alone function that creates and returns a progress.data.JSDOSession instance
         * with a specified JSDO login session already established and a specified Data Service 
         * Catalog already loaded.
         * 
         * @param serviceURI - A string expression containing the URI of the web application 
         * for which to start a JSDO login session
         * @param catalogURI - A string expression that specifies the URI of a Data Service 
         * Catalog file. This URI can specify a location in a web application running on a web server
         * @param authenticationModel - Required only for Basic or Form authentication) A string 
         * constant that specifies one of the three authentication models that the returned JSDOSession object 
         * supports, depending on the web application configuration
         * @param username - (Required only for Basic or Form authentication) A string expression
         * containing a user ID for the function to send to the web server for authentication
         * @param password - (Required only for Basic or Form authentication) A string expression
         * containing a password for the function to send to the web server to authenticate the specified user
         * @param name - A string with an operative value that you define to enable page refresh
         * support for the returned JSDOSession object
         */
        public static getSession(options: GetSessionOptions): Promise<data.JSDOSessionInfo>;

        /**
         * A stand-alone function that invalidates all current progress.data.JSDOSession instances
         * that were created and initialized using the progress.data.getSession( ) stand-alone function
         */
        public static invalidateAllSessions(): Promise<{
            result: number,
            info: data.LoginInfo
        }>;
    }

    interface GetSessionOptions {
        serviceURI: String, 
        catalogURI: String, 
        authenticationModel: String, 
        username?: String, 
        password?: String, 
        name?: String
    }

    export module data {

        // Constants for progress.data.Session
        export class Session {
            public static LOGIN_SUCCESS: number;
            public static LOGIN_AUTHENTICATION_FAILURE: number;
            public static LOGIN_GENERAL_FAILURE: number;
            public static CATALOG_ALREADY_LOADED: number;
    
            public static LOGIN_AUTHENTICATION_REQUIRED: number;
            public static ASYNC_PENDING: number;
            public static EXPIRED_TOKEN: number;

            public static SERVER_OFFLINE: string;
            public static WEB_APPLICATION_OFFLINE: string;
            public static SERVICE_OFFLINE: string;
            public static APPSERVER_OFFLINE: string;

            public static SUCCESS: number;
            public static AUTHENTICATION_FAILURE: number;
            public static GENERAL_FAILURE: number;
    
            public static AUTH_TYPE_ANON: string;
            public static AUTH_TYPE_BASIC: string;
            public static AUTH_TYPE_FORM: string;
            public static AUTH_TYPE_SSO: string;
            public static AUTH_TYPE_FORM_SSO: string;
        }

        /** 
         * The progress.data.JSDO is a JavaScript class that provides access to resources 
         * (Data Objects) of a Progress Data Object Service. A single progress.data.JSDO object (JSDO instance) provides access to a single resource supported by a given Data Object Service.
         * */
        export class JSDO implements IJSTableRef, IJSRecord, ISubscribe {

            public static MODE_APPEND: number;
            public static MODE_MERGE: number;
            public static MODE_REPLACE: number;
            public static MODE_EMPTY: number;
            public static ALL_DATA: number;
            public static CHANGES_ONLY: number;

            // _defaultTableRef: any;

            /**
             * A boolean on a JSDO that indicates if the JSDO automatically accepts or rejects changes to JSDO memory when you call the saveChanges( ) method.
             */
            autoApplyChanges: boolean;

            /**
             * A boolean on a JSDO and its table references that indicates if record objects are sorted automatically on the affected table references
             * in JSDO memory at the completion of a supported JSDO operation.
             */
            autoSort: boolean;

            /**
             * A boolean on a JSDO and its table references that indicates if string field comparisons performed by supported JSDO operations are case sensitive
             * or case-insensitive for the affected table references in JSDO memory.
             */
            caseSensitive: boolean;

            /**
             * Returns the name of the Data Object resource for which the current JSDO was created.
             */
            readonly name: string;

            /**
             * A property on a JSDO table reference that references a JSRecord object with the data for the working record of a table referenced in JSDO memory.
             * If no working record is set for the referenced table, this property is undefined.
             */
            readonly record: JSRecord;

            /**
             * An object reference property on a JSDO that has the name of a corresponding table in the Data Object resource for which the current JSDO was created.
             */
            readonly table: IJSTableRef;

            /**
             * A boolean that specifies whether JSDO methods that operate on table references in JSDO memory work with the table relationships defined in the schema
             * (that is, work only on the records of a child table that are related to the parent).
             */
            useRelationships: boolean;

            /**
             * A boolean that specifies whether the JSDO has a submit operation defined.
             */
            readonly hasSubmitOperation: boolean;

            /**
             * A boolean that specifies whether the JSDO has the create, udpate and delete operations defined.
             */
            readonly hasCUDOperations: boolean;

            /**
             * Specifies the name of the default table reference for a single table dataset
             */
            readonly defaultTableRef: any;

            /**
             * @param resourceName A string expression set to the name of a resource that the JSDO will access.
             *                     This resource must be provided by a Data Object Service for which a login session has already been established.
             */
            constructor(resourceName: string);

            /**
             * @param options An object that can contain any writable JSDO properties. It must contain the required JSDO name property, which specifies
             *                the Data Object resource that the JSDO will access. This resource must be provided by a Data Object Service for which a
             *                login session has already been established.
             */
            constructor(options: JSDOOptions);

            /**
             * Asynchronously calls a custom invocation method on the JSDO to execute an Invoke operation defined by a Data Object resource.
             *
             * @param methodName A string that specifies the name of the invocation method as defined by the resource.
             * @param object An object whose properties and values match the case-sensitive names and data types of the input parameters
             *               specified for the server routine that implements the invocation method. If the implementing routine does not
             *               take input parameters, specify null or leave out the argument entirely.
             */
            invoke(methodName: string, object?: any): Promise<JSDOOperationInfo>;

            /**
             * Initializes JSDO memory with record objects from the data records in a single-table resource,
             * or in one or more tables of a multi-table resource, as returned by the Read operation
             * of the Data Object resource for which the JSDO is created.
             */
            fill(filter?: string): any;

            /**
             * Initializes JSDO memory with record objects from the data records in a single-table resource,
             * or in one or more tables of a multi-table resource, as returned by the Read operation
             * of the Data Object resource for which the JSDO is created.
             */
            fill(options: FilterOptions): Promise<JSDOOperationInfo>;

            /**
             * It is the alias for fill() operation. Initializes JSDO memory with record objects from the data 
             * records in a single-table resource, or in one or more tables of a multi-table resource, as returned 
             * by the Read operation of the Data Object resource for which the JSDO is created.
             */
            read(options: FilterOptions): Promise<JSDOOperationInfo>;

            /**
             * Reads the record objects stored in the specified local storage area and updates JSDO memory based on these record objects,
             * including any pending changes and before-image data, if they exist.
             * 
             * @param {integer} addMode - An integer constant that represents a merge mode to use
             * @param {object} keyFields - An object with a list of primary key fields to check for records with duplicate keys
             */
            addLocalRecords(addMode: number, keyFields?: any): boolean;

            /**
             * Replaces all user-defined properties in the current JSDO instance with the user-defined properties defined in the specified object.
             * 
             * @param {object} propsObject - An Object containing a comma-separated list of name, value pairs that define the complete set of user-defined 
             * properties in the current JSDO, where name and value define a single property as defined for the setProperty( ) method.
             * @returns {null}
             */
            setProperties(propsObject): void

            /**
             * Sets the value of the specified JSDO user-defined property.
             * @param {string} name - The name of a user-defined property to define in the current JSDO.
             * @param {string} value - The value, if any, to set for the user-defined name property in the JSDO.
             */
            setProperty(name: string, value: string):void

            /**
             * Returns an object containing the names and values of the user-defined properties defined in the current JSDO instance.
             * @returns {object}
             */
            getProperties(): Object

            /**
             * Returns the value of the specified JSDO user-defined property.
             * @param name - The name of a user-defined property to query from the JSDO.
             */
            getProperty(name): any

            /**
             * Returns an array of errors from the most recent invocation of Create, Read, Update, Delete, or Submit operations (CRUD or Submit) 
             * that you have invoked by calling the JSDO fill( ) or saveChanges( ) method on a Data Object resource.
             */
            getErrors(): any[]

            /**
             * Reads the record objects stored in the specified local storage area and updates JSDO memory based on these record objects,
             * including any pending changes and before-image data, if they exist.
             * 
             * @param {string} storageName  The name of the local storage area from which to update JSDO memory.
             * @param {integer} addMode An integer constant that represents a merge mode to use
             * @param {object} keyFields An object with a list of primary key fields to check for records with duplicate keys
             */
            addLocalRecords(storageName: string, addMode: number, keyFields?: any): boolean;

            /**
             * Clears out all data and changes stored in a specified local storage area, and removes the cleared storage area.
             * @param {string} storageName The name of the local storage area to be removed
             */
            deleteLocal(storageName?: string): void;

            /**
             * Checks for any pending changes in JSDO memory (with or without before-image data)
             * @returns {boolean} (true/false)
             */
            hasChanges(): boolean;

            /**
             * Clears out the data in JSDO memory and replaces it with all the data stored in a specified local storage area, 
             * including any pending changes and before-image data, if they exist.
             * @param {string} storageName Name of the local storage area whose data is to replace the data in JSDO memory
             * @returns {boolean}
             */
            readLocal(storageName?: string): boolean;

            /**
             * Synchronizes to the server all record changes (creates, updates, and deletes) pending in JSDO memory for 
             * the current Data Object resource
             * @param {boolean} useSubmit Optional parameter. By default points to 'false' where all record modifications are sent to server individually.
             * When 'true' is used all record modifications are batched together and are sent in single transaction
             * @returns {object} JQuery Promise or Undefined is returned
             */
            saveChanges(useSubmit?: boolean): any;

            /**
             * Saves JSDO memory to a specified local storage area, including pending changes and any before-image data, 
             * according to a specified data mode.
             * @param dataMode JSDO class constant that specifies the data in JSDO memory to be saved to local storage
             */
            saveLocal(dataMode?: number): void;

            /**
             * Saves JSDO memory to a specified local storage area, including pending changes and any before-image data, 
             * according to a specified data mode.
             * @param storageName  Name of the local storage area in which to save the specified data from JSDO memory
             * @param dataMode JSDO class constant that specifies the data in JSDO memory to be saved to local storage
             */
            saveLocal(storageName: string, dataMode: number): void;

            // IJSTableRef

            /**
             * Accepts changes to the data in JSDO memory for the specified table reference or for all table references 
             * of the specified JSDO. Applicable to progress.data.JSDO class, table reference property (JSDO class)
             * @returns {boolean}
             */
            acceptChanges(): boolean;

            /**
             * Rejects changes to the data in JSDO memory for the specified table reference or for all table references 
             * of the specified JSDO. Applicable to progress.data.JSDO class, table reference property (JSDO class)
             * @returns {boolean}
             */
            rejectChanges(): boolean;

            /**
             * Creates a new record object for a table referenced in JSDO memory and returns a reference to the new record.
             * @param {object} - New Record Object
             * @returns {object} progress.data.JSRecord class
             */
            add(object: any): boolean;

            /**
             * Updates JSDO memory with one or more record objects read from an array, single-table, or multi-table resource that are passed in an object parameter, 
             * including any pending changes and before-image data, if they exist.
             * @param mergeObject  An object with the data to merge
             * @param addMode An integer that represents a merge mode to use
             * @param keyFields An object with a list of key fields to check for records with duplicate keys
             * @returns {void}
             */
            addRecords(mergeObject: any, addMode: number, keyFields?: any): void;

            /**
             * Searches for a record in a table referenced in JSDO memory and returns a reference to that record if found
             * @param code A reference to a JavaScript callback function that returns a boolean value and has specific signature
             * @returns {progress.data.JSRecord}
             */
            find(code: Function): JSRecord;

            /**
             * Locates and returns the record in JSDO memory with the internal ID you specify.
             * @param id Internal record ID used to match a record of the table reference.
             * @returns {progress.data.JSRecord}
             */
            findById(id: string): JSRecord;

            /**
             * Loops through the records of a table referenced in JSDO memory and invokes a user-defined callback function as a parameter on each iteration.
             * @param code A reference to a JavaScript callback function that returns a boolean value and has specific signature
             * @returns {void}
             */
            foreach(code: Function): void;

            /**
             * Returns an array of record objects for a table referenced in JSDO memory.
             * @returns {object}
             */
            getData(): any[];

            /**
             * Returns an array of objects, one for each field that defines the schema of a table referenced in JSDO memory.
             * @returns {object}
             */
            getSchema(): any[];

            /**
             * Returns true if record objects can be found in any of the tables referenced in JSDO memory (with or without pending changes), 
             * or in only the single table referenced on the JSDO, depending on how the method is called; and returns false if no record objects are found in either case.
             * @returns {boolean}
             */
            hasData(): boolean;

            /**
             * Specifies or clears the record fields on which to automatically sort the record objects for a table reference after you have set its 
             * autoSort property to true (the default).
             * @param sortFields An array of string values set to the names of record fields on which to sort the record objects, 
             * with an optional indication of the sort order for each field
             * @returns {void}
             */
            setSortFields(sortFields: string[]): void;

            /**
             * Specifies or clears a user-defined sort function with which to automatically sort the record objects for a table reference 
             * after you have set its autoSort property to true (the default).
             * @param funcRef A reference to a JavaScript sort function that compares two record objects for the sort and returns a number value.
             * @returns {void}
             */
            setSortFn(funcRef: Function): void;

            /**
             * Sorts the existing record objects for a table reference in JSDO memory using either specified sort fields or a specified user-defined sort function.
             * @param sortFields An array of string values set to the names of record fields on which to sort the record objects, with an optional indication 
             * of the sort order for each field.
             */
            sort(sortFields: string[]): void;

            /**
             * Sorts the existing record objects for a table reference in JSDO memory using either specified sort fields or a specified user-defined sort function.
             * @param funcRef A reference to a JavaScript sort function that compares two record objects for the sort and returns a number value.
             */
            sort(funcRef: Function): void;

            // IJSRecord

            /**
             * Accepts changes to the data in JSDO memory for a specified record object.
             * @returns {boolean}
             */
            acceptRowChanges(): boolean;

            /**
             * Updates field values for the specified JSRecord object in JSDO memory.
             * @param object Passes in the data to update the specified record object in JSDO memory. 
             * @returns {boolean}
             */
            assign(object: any): boolean;

            /**
             * Returns any before-image error string in the data of a record object referenced in JSDO memory that was set as the result of a resource 
             * Create, Update, Delete, or Submit operation.
             * @returns {string}
             */
            getErrorString(): string;

            /**
             * Returns the unique internal ID for the record object referenced in JSDO memory.
             * @returns {string}
             */
            getId(): string;

            /**
             * Rejects changes to the data in JSDO memory for the specified table reference or for all table references of the specified JSDO.
             * @returns {boolean}
             */
            rejectRowChanges(): boolean;

            /**
             * Deletes the specified table record referenced in JSDO memory.
             * @returns {boolean}
             */
            remove(): boolean;

            // ISubscribe
            subscribe(eventName: string, callback: CRUDCallback, scope?: any): void;
            subscribe(eventName: string, operationName: string, callback: CRUDCallback, scope?: any): void;
            unsubscribe(eventName: string, callback: CRUDCallback, scope?: any): void;
            unsubscribe(eventName: string, operationName: string, callback: CRUDCallback, scope?: any): void;

            unsubscribeAll(eventName: string): void;
        }

        export class JSTableRef implements IJSTableRef, IJSRecord, ISubscribe {

            record: JSRecord;

            /**
             * Returns the table name for the specified table reference in the JSDO
             */
            readonly name: string;

            // IJSTableRef

            /**
             * Accepts changes to the data in JSDO memory for the specified table reference or for all table references 
             * of the specified JSDO. Applicable to progress.data.JSDO class, table reference property (JSDO class)
             * @returns {boolean}
             */
            acceptChanges(): boolean;

            /**
             * Creates a new record object for a table referenced in JSDO memory and returns a reference to the new record.
             * @param {object} - New Record Object
             * @returns {object} progress.data.JSRecord class
             */
            add(object: any): boolean;

            /**
             * Updates JSDO memory with one or more record objects read from an array, single-table, or multi-table resource that are passed in an object parameter, 
             * including any pending changes and before-image data, if they exist.
             * @param mergeObject  An object with the data to merge
             * @param addMode An integer that represents a merge mode to use
             * @param keyFields An object with a list of key fields to check for records with duplicate keys
             * @returns {void}
             */
            addRecords(mergeObject: any, addMode: number, keyFields?: any): void;

            /**
             * Searches for a record in a table referenced in JSDO memory and returns a reference to that record if found
             * @param code A reference to a JavaScript callback function that returns a boolean value and has specific signature
             * @returns {progress.data.JSRecord}
             */
            find(code: Function): JSRecord;

            /**
             * Locates and returns the record in JSDO memory with the internal ID you specify.
             * @param id Internal record ID used to match a record of the table reference.
             * @returns {progress.data.JSRecord}
             */
            findById(id: string): JSRecord;

            /**
             * Loops through the records of a table referenced in JSDO memory and invokes a user-defined callback function as a parameter on each iteration.
             * @param code A reference to a JavaScript callback function that returns a boolean value and has specific signature
             * @returns {void}
             */
            foreach(code: Function): void;

            /**
             * Returns an array of record objects for a table referenced in JSDO memory.
             * @returns {object}
             */
            getData(): any[];

                        /**
             * Returns an array of errors from the most recent invocation of Create, Read, Update, Delete, or Submit operations (CRUD or Submit) 
             * that you have invoked by calling the JSDO fill( ) or saveChanges( ) method on a Data Object resource.
             */
            getErrors(): any[];

            /**
             * Returns an array of objects, one for each field that defines the schema of a table referenced in JSDO memory.
             * @returns {object}
             */
            getSchema(): any[];

            /**
             * Returns true if record objects can be found in any of the tables referenced in JSDO memory (with or without pending changes), 
             * or in only the single table referenced on the JSDO, depending on how the method is called; and returns false if no record objects are found in either case.
             * @returns {boolean}
             */
            hasData(): boolean;

            /**
             * Specifies or clears the record fields on which to automatically sort the record objects for a table reference after you have set its 
             * autoSort property to true (the default).
             * @param sortFields An array of string values set to the names of record fields on which to sort the record objects, 
             * with an optional indication of the sort order for each field
             * @returns {void}
             */
            setSortFields(sortFields: string[]): void;

            /**
             * Specifies or clears a user-defined sort function with which to automatically sort the record objects for a table reference 
             * after you have set its autoSort property to true (the default).
             * @param funcRef A reference to a JavaScript sort function that compares two record objects for the sort and returns a number value.
             * @returns {void}
             */
            setSortFn(funcRef: Function): void;

            /**
             * Sorts the existing record objects for a table reference in JSDO memory using either specified sort fields or a specified user-defined sort function.
             * @param sortFields An array of string values set to the names of record fields on which to sort the record objects, with an optional indication 
             * of the sort order for each field.
             */
            sort(sortFields: string[]): void;

            /**
             * Sorts the existing record objects for a table reference in JSDO memory using either specified sort fields or a specified user-defined sort function.
             * @param funcRef A reference to a JavaScript sort function that compares two record objects for the sort and returns a number value.
             */
            sort(funcRef: Function): void;

            // IJSRecord

            /**
             * Accepts changes to the data in JSDO memory for a specified record object.
             * @returns {boolean}
             */
            acceptRowChanges(): boolean;

            /**
             * Updates field values for the specified JSRecord object in JSDO memory.
             * @param object Passes in the data to update the specified record object in JSDO memory. 
             * @returns {boolean}
             */
            assign(object: any): boolean;

            /**
             * Returns any before-image error string in the data of a record object referenced in JSDO memory that was set as the result of a resource 
             * Create, Update, Delete, or Submit operation.
             * @returns {string}
             */
            getErrorString(): string;

            /**
             * Returns the unique internal ID for the record object referenced in JSDO memory.
             * @returns {string}
             */
            getId(): string;

            /**
             * Rejects changes to the data in JSDO memory for the specified table reference or for all table references of the specified JSDO.
             * @returns {boolean}
             */
            rejectRowChanges(): boolean;

            /**
             * Deletes the specified table record referenced in JSDO memory.
             * @returns {boolean}
             */
            remove(): boolean;

            // ISubscribe
            subscribe(eventName: string, callback: CRUDCallback, scope?: any): void;
            subscribe(eventName: string, operationName: string, callback: CRUDCallback, scope?: any): void;
            unsubscribe(eventName: string, callback: CRUDCallback, scope?: any): void;
            unsubscribe(eventName: string, operationName: string, callback: CRUDCallback, scope?: any): void;
        }

        /**
         * The progress.data.JSRecord is a JavaScript class that represents a record instance 
         * for any table stored in the JSDO memory of an associated progress.data.JSDO class instance (JSDO).
         */
        export class JSRecord implements IJSRecord {

            data: any;

            // IJSRecord

            /**
             * Accepts changes to the data in JSDO memory for a specified record object.
             * @returns {boolean}
             */
            acceptRowChanges(): boolean;

            /**
             * Updates field values for the specified JSRecord object in JSDO memory.
             * @param object Passes in the data to update the specified record object in JSDO memory. 
             * @returns {boolean}
             */
            assign(object: any): boolean;

            /**
             * Returns any before-image error string in the data of a record object referenced in JSDO memory that was set as the result of a resource 
             * Create, Update, Delete, or Submit operation.
             * @returns {string}
             */
            getErrorString(): string;

            /**
             * Returns the unique internal ID for the record object referenced in JSDO memory.
             * @returns {string}
             */
            getId(): string;

            /**
             * Rejects changes to the data in JSDO memory for the specified table reference or for all table references of the specified JSDO.
             * @returns {boolean}
             */
            rejectRowChanges(): boolean;

            /**
             * Deletes the specified table record referenced in JSDO memory.
             * @returns {boolean}
             */
            remove(): boolean;
        }

        /**
         * Class related to JSDO's Session management.
         * The progress.data.JSDOSession is a JavaScript class that provides methods, properties, 
         * and events to create and manage a JSDO login session. A JSDO login session includes a 
         * single end point (web application) and a single authentication model (Anonymous, 
         * HTTP Basic, or HTTP Form), and manages user access to Progress Data Object resources 
         * using instances of the progress.data.JSDO class (JSDO)
         */
        export class JSDOSession {

            /**
             * Returns a string constant that was passed as an option to the object's class constructor, and specifies
             * the authentication model that the current JSDOSession object requires to start a JSDO login session in
             * the web application for which the JSDOSession object was also created.
             */
            readonly authenticationModel: string;

            /**
             * Returns the list of URIs successfully used to load Data Service Catalogs into the current JSDOSession or Session object.
             */
            readonly catalogURIs?: string[];

            /**
             * The value of the most recent client context identifier (CCID) that the current JSDOSession or Session object
             * has found in the X-CLIENT-CONTEXT-ID HTTP header of a server response message.
             */
            readonly clientContextId: string;

            /**
             * Returns a boolean that indicates the most recent online status of the current JSDOSession or Session object
             * when it last determined if the web application it manages was available.
             */
            readonly connected: boolean;

            /**
             * Returns an array of JSDOs that use the current JSDOSession or Session object to communicate with their Data Object Services.
             */
            readonly JSDOs: JSDO[];

            /**
             * Returns the specific HTTP status code returned in the response from the most recent login attempt on the current JSDOSession or Session object.
             */
            readonly loginHttpStatus: string;

            /**
             * Returns the return value of the login( ) method, which is the basic result code for the most recent login attempt on the current JSDOSession or Session object.
             */
            readonly loginResult: any;

            /**
             * Returns the value of any name property to enable page refresh support that was passed to the constructor of the current JSDOSession object.
             */
            readonly name: string;

            /**
             * Returns the reference to a user-defined callback function that the JSDOSession or Session object executes to modify
             * a request object before sending the request object to the server.
             */
            readonly onOpenRequest: any;

            /**
             * A number that specifies the duration, in milliseconds, between one automatic execution of the current JSDOSession or Session object's ping( ) method and the next.
             */
            readonly pingInterval: number;

            /**
             * Returns an array of objects that identifies the Data Object Services that have been loaded for the current JSDOSession or Session object and its web application.
             */
            readonly services: any[];

            /**
             * Returns the URI to the web application that has been passed as an option to the class constructor for the current JSDOSession object
             * or that has been passed as a parameter to the most recent call to the login( ) method on the current Session object,
             * whether or not the most recent call to login( ) succeeded.
             */
            readonly serviceURI: string;

            /**
             * Returns the username passed as a parameter to the most recent call to the login( ) method on the current JSDOSession or Session object.
             */
            readonly userName: string;

            /**
             * Instantiates a JSDOSession object that you can use to start and manage a JSDO login session in a web application and
             * load the Data Service Catalog for each supported Data Object Service whose resources are accessed using JSDOs.
             */
            constructor(options: JSDOSessionOptions);

            /**
             * Loads one local or remote Data Service Catalogs into the current JSDOSession object.
             */
            addCatalog(catalogURI: string): Promise<JSDOSessionAddCatalogInfo>;

            /**
             * Loads one or more local or remote Data Service Catalogs into the current JSDOSession object.
             */
            addCatalog(catalogURI: string[]): Promise<JSDOSessionAddCatalogInfo>;

            /**
             * Loads one local or remote Data Service Catalogs into the current JSDOSession object.
             */
            addCatalog(catalogURI: string, username: string, password: string): Promise<JSDOSessionAddCatalogInfo>;

            /**
             * Loads one or more local or remote Data Service Catalogs into the current JSDOSession object.
             */
            addCatalog(catalogURI: string[], username: string, password: string): Promise<JSDOSessionAddCatalogInfo>;

            /**
             * Determines if the current JSDOSession object has authorized access to the web application specified by its serviceURI property setting.
             */
            isAuthorized(): Promise<JSDOSessionIsAuthorizedInfo>;

            /**
             * Starts a JSDO login session in a web application for the current JSDOSession object by sending an HTTP request
             * with specified user credentials to the web application URI specified in the object's constructor.
             */
            login(loginParameter?: JSDOLoginParameter): Promise<JSDOSessionAuthorizationInfo>;

            /**
             * Starts a JSDO login session in a web application for the current JSDOSession object by sending an HTTP request
             * with specified user credentials to the web application URI specified in the object's constructor.
             */
            login(username: string, password: string, loginParameter?: JSDOLoginParameter): Promise<JSDOSessionAuthorizationInfo>;

            /**
             * Terminates the login session on the web application managed by the current JSDOSession object,
             * and reinitializes most of the state information maintained by the object.
             */
            logout(): Promise<JSDOSessionAuthorizationInfo>;

            /**
             * Determines the online state of the current JSDOSession object from its ability to access
             * the web application that it manages, and for an OpenEdge web application, from detecting
             * if its associated application server is running.
             */
            ping(): Promise<JSDOSessionInfo>;

            /**
             * Subscribes a given event callback function to an event of the current JSDOSession object.
             * @param eventName  A string that specifies the name of an event on a JSDOSession object to which you subscribe an event handler.
             *                   See the reference entry for the progress.data.JSDOSession class for a list of available events.
             * @param eventHandler A reference to an event handler function that is called when the specified event fires.
             * @param scope An optional object reference that defines the execution scope of the event handler function called when the event fires.
             *              If the scope property is omitted, the execution scope is the global object (usually the browser or device window).
             */
            subscribe(eventName: string, eventHandler: Function, scope?: any): void;

            /**
             * Unsubscribes a given event callback function from an event of the current JSDOSession object.
             *
             * @param eventName The name of a JSDOSession object event to which you unsubscribe an event handler.
             *                  See the reference entry for the progress.data.JSDOSession class for a list of available events.
             * @param eventHandler A reference to an event handler function that is to be removed from the list of callbacks that are called when the specified event fires.
             * @param scope An optional object reference that defines the execution scope of the event handler function.
             *              Specifying the scope is optional in the event subscription. If the event subscription does specify an execution scope,
             *              you must specify a matching scope parameter when you call the unsubscribe( ) method to cancel the event subscription.
             */
            unsubscribe(eventName: string, eventHandler: Function, scope?: any): void;

            /**
             * Unsubscribes all event callback functions from a single named event of the current JSDO,
             * JSDOSession or Session object, or unsubscribes all event callback functions from all events
             * of the current JSDO, JSDOSession, or Session object.
             */
            unsubscribeAll(eventName: string): void;

            /**
             * set the properties that are passed between client and Web application in the
             * X-CLIENT-PROPS header. This sets the complete set of properties all at once;
             * it replaces any existing context
             */
            setContext(context: String): void;

            /*
             *  Set or remove an individual property in the set of the properties that are passed
             *  between client and Web application in the X-CLIENT-PROPS header. This operates only
             *  on the property identiofied by propertyName; all other existing properties remain
             *  as they are.
             *  If the propertyName is not part of the context, thsi call adds it
             *  If it is part of the context, this call updates it, unless -
             *  If propertyValue is undefined, this call removes the property
             */
            setContextProperty(propertyName: string, propertyValue: any): void;

            /*
             * get the set of properties that are passed between client and Web application in the
             * X-CLIENT-PROPS header. Returns an object that has the properties
             */
            getContext(): String;

            /**
             *
             */
            getContextProperty(propertyName: string): any;

            /**
             * Terminates the login session managed by the current JSDOSession object and permanently 
             * disables the object, rendering it unable to start a new login session.
             */
            invalidate(): Promise<JSDOSessionAuthorizationInfo>;           

        }

        /**
         * Defines an authentication process and can be used to execute that process
         */
        export class AuthenticationProvider {
            
            /**
             * Authenticates the credentials provided to the call. Throws an error if the 
             * AuthenticationProvider object has already logged in and has not logged out.
             * @param username - Required unless the authenticationModel is Anonymous
             * @param password - Required unless the authenticationModel is Anonymous
             */
            login(username: string, password: string): Promise<APAuthInfo>;

            /**
             * Resets the AuthenticationProvider's internal state and logs out from the Web application 
             * where authentication was done. Succeeds even if the AuthenticationProvider is not logged in.
             */
            logout(): Promise<APAuthInfo>;

             /**
             * Returns true if the authenticationProvider is currently managing the credentials 
             * applicable to its authentication model. For SSO, true means that the AuthenticationProvider
             * has a token and has not detected that the token is invalid (expired, corrupted).
             */
            hasClientCredentials(): boolean;

            /**
             * Its a way to check if the AuthenticationProvider has a refresh token. If the model of the
             * provider is SSO and a refresh token is in possession, this method will return true. 
             * Otherwise, it will return false
             */
            hasRefreshToken(): boolean;
        }

        export class AuthenticationProviderBasic {

            /**
             * Authenticates the credentials provided to the call. Throws an error if the 
             * AuthenticationProvider object has already logged in and has not logged out.
             * @param username - Required unless the authenticationModel is Anonymous
             * @param password - Required unless the authenticationModel is Anonymous
             */
            login(username: string, password: string): Promise<APAuthInfo>;
        }

        export class AuthenticationProviderForm {

            /**
             * Authenticates the credentials provided to the call. Throws an error if the 
             * AuthenticationProvider object has already logged in and has not logged out.
             * @param username - Required unless the authenticationModel is Anonymous
             * @param password - Required unless the authenticationModel is Anonymous
             */
            login(username: string, password: string): Promise<APAuthInfo>;

            /**
             * Resets the AuthenticationProvider's internal state and logs out from the Web application 
             * where authentication was done. Succeeds even if the AuthenticationProvider is not logged in.
             */
            logout(): Promise<APAuthInfo>;;
        }

        export class AuthenticationProviderSSO {

            /**
             * An SSO token server will return a token that has an expiration time, accompanied by a 
             * "refresh token" that enables a client to get a "refreshed" version of the token that 
             * allows the client to continue accessing resources without logging in again.
             * The client simply sends the refresh token in a refresh request to the token server, which returns a new token
             */
            refresh(): Promise<APAuthInfo>;

            /**
             * Returns true if the authenticationProvider is currently managing the credentials 
             * applicable to its authentication model. For SSO, true means that the AuthenticationProvider
             * has a token and has not detected that the token is invalid (expired, corrupted).
             */
            hasClientCredentials(): boolean;

            /**
             * Its a way to check if the AuthenticationProvider has a refresh token. If the model of the
             * provider is SSO and a refresh token is in possession, this method will return true. 
             * Otherwise, it will return false
             */
            hasRefreshToken(): boolean;

        }

        interface CRUDCallback {
            (jsdo: JSDO, success: boolean, request: any): void;
        }

        interface FilterOptions {
            filter?: any;
            id?: any;
            skip?: any;
            sort?: any;
            top?: any;
        }

        interface JSDORequest {

            /**
             * A boolean that indicates, if set to true, that the Data Object resource operation was executed asynchronously in the mobile app.
             */
            readonly async: boolean;

            /**
             * A reference to an object with a property named operations, which is an array containing the request objects for each of the one
             * or more record-change operations on a resource performed in response to calling the JSDO saveChanges( ) method
             * without using Submit (either with an empty parameter list or with the single parameter value of false).
             */
            readonly batch: any;

            /**
             * For an Invoke operation, the name of the custom JSDO invocation method that executed the operation.
             */
            readonly fnName: string;

            /**
             * An object reference to the JSDO that performed the operation returning the request object.
             */
            readonly jsdo: JSDO;

            /**
             * A reference to the record object that was created, updated, or deleted by the current record-change operation.
             */
            readonly jsrecord: JSRecord;

            /**
             * An array of references to record objects for a Submit operation (invoking saveChanges(true)) on one of the following types of Data Object resources:
             * - A resource that supports before-imaging Record objects that are created, updated, or deleted on the server
             * - A resource that does not support before-imaging Record objects to be created or updated on the server
             */
            readonly jsrecords: JSRecord[];

            /**
             * A reference to the object, if any, that was passed as an input parameter to the JSDO method that has returned the current request object.
             */
            readonly objParam: any;

            /**
             * Returns an object or string containing data and status information from an operation invoked on a Data Object resource.
             */
            readonly response: any;

            /**
             * A boolean that when set to true indicates that the Data Object resource operation was successfully executed.
             */
            readonly success: boolean;

            /**
             * A reference to the XMLHttpRequest object used to make an operation request on a resource of a Data Object Service.
             */
            readonly xhr: XMLHttpRequest;
        }

        // This is the generic object returned by resolved/rejected Promises
        // of JSDO methods
        interface JSDOOperationInfo {
            jsdo: JSDO;
            success: boolean;
            request: JSDORequest;
        }

        // This is the generic object returned by resolved/rejected Promises
        // of JSDOSession methods
        interface JSDOSessionOperationInfo {
            jsdosession: JSDOSession;

            // A constant indicating the overall result of the call that can have one of the following values:
            // - progress.data.Session.AUTHENTICATION_SUCCESS
            // - progress.data.Session.AUTHENTICATION_FAILURE
            // - progress.data.Session.GENERAL_FAILURE
            result: number;
        }

        // This is the object returned by the resolved/rejected Promise returned by
        // JSDOSession.login(), logout(), and invalidate()
        interface JSDOSessionAuthorizationInfo extends JSDOSessionOperationInfo {
            info: LoginInfo;
        }

        // This is the object returned by the resolved/rejected Promise returned by
        // JSDOSession.addCatalog()
        interface JSDOSessionAddCatalogInfo extends JSDOSessionOperationInfo {
            info: JSDOSessionCatalogDetails;
        }

        // This is the object returned by the resolved/rejected Promise returned by
        // JSDOSession.isAuthorized()
        interface JSDOSessionIsAuthorizedInfo extends JSDOSessionOperationInfo {
            info: JSDOSessionAuthorizedInfo;
        }

        // This is the object returned by the resolved/rejected Promise returned by
        // JSDOSession.ping()
        interface JSDOSessionInfo {
            jsdosession: JSDOSession;
            
            // This boolean is true if the session is still authenticated and false if not
            result: boolean;

            info: JSDOSessionAuthorizedInfo;
        }

        // This is the object returned by the resolved/rejected Promise returned by
        // AuthProvider.login() and logout()
        interface APAuthInfo {
            authProvider: AuthenticationProvider;

            // A constant indicating the overall result of the call that can have one of the following values:
            // - progress.data.Session.AUTHENTICATION_SUCCESS
            // - progress.data.Session.AUTHENTICATION_FAILURE
            // - progress.data.Session.GENERAL_FAILURE
            result: number;

            info: LoginInfo;
        }

        interface JSDOOptions {

            /**
             * It must contain the required JSDO name property, which specifies the Data Object resource that the JSDO will access.
             * This resource must be provided by a Data Object Service for which a login session has already been established.
             */
            name: string;

            /**
             * A boolean that specifies whether the the JSDO invokes its fill( ) method upon instantiation to initialize JSDO memory
             * with data from its resource. The default value is false.
             */
            autoFill?: boolean;

            /**
             * An object that specifies one or more JSDO event subscriptions, each with its properties represented as an array.
             */
            events?: any;

            /**
             * A boolean on a JSDO that indicates if the JSDO automatically accepts or rejects changes to JSDO memory when you call the saveChanges( ) method.
             */
            autoApplyChanges?: boolean;

            /**
             * A boolean on a JSDO and its table references that indicates if record objects are sorted automatically on the affected table references
             * in JSDO memory at the completion of a supported JSDO operation.
             */
            autoSort?: boolean;

            /**
             * A boolean on a JSDO and its table references that indicates if string field comparisons performed by supported JSDO operations are case sensitive
             * or case-insensitive for the affected table references in JSDO memory.
             */
            caseSensitive?: boolean;

            /**
             * A boolean that specifies whether JSDO methods that operate on table references in JSDO memory work with the table relationships defined in the schema
             * (that is, work only on the records of a child table that are related to the parent).
             */
            useRelationships?: boolean;
        }
        
        interface IJSTableRef {
            acceptChanges(): boolean;
            add(object: any): boolean;
            addRecords(mergeObject: any, addMode: number, keyFields?: any): void;
            find(code: Function): JSRecord;
            findById(id: string): JSRecord;
            foreach(code: Function): void;
            getData(): any[];
            getSchema(): any[];
            hasData(): boolean;
            setSortFields(sortFields: string[]): void;
            setSortFn(funcRef: Function): void;
            sort(sortFields: string[]): void;
            sort(funcRef: Function): void;
            getErrors(): any;
        }

        interface IJSRecord {
            acceptRowChanges(): boolean;
            assign(object: any): boolean;
            getErrorString(): string;
            getId(): string;
            rejectRowChanges(): boolean;
            remove(): boolean;
        }

        interface ISubscribe {
            subscribe(eventName: string, callback: CRUDCallback, scope?: any): void;
            subscribe(eventName: string, operationName: string, callback: CRUDCallback, scope?: any): void;
            unsubscribe(eventName: string, callback: CRUDCallback, scope?: any): void;
            unsubscribe(eventName: string, operationName: string, callback: CRUDCallback, scope?: any): void;
        }

        interface JSDOSessionOptions {

            /**
             * A string expression containing the URI of the web application for which to start a JSDO login session.
             * This web application must support one or more Data Object Services in order to create JSDOs for the resources provided by the application.
             * This URI is appended with a string that identifies a resource to access as part of the login process.
             */
            serviceURI: string;

            /**
             * Returns the list of URIs successfully used to load Data Service Catalogs into the 
             * current JSDOSession object
             */
            // catalogURIs?: string;

            /**
             * (Optional) A string constant that specifies one of the three authentication models that the JSDOSession object supports,
             * depending on the web application configuration
             *
             * progress.data.Session.AUTH_TYPE_ANON  - (Default) The web application supports Anonymous access. No authentication is required.
             * progress.data.Session.AUTH_TYPE_BASIC - The web application supports HTTP Basic authentication and requires a valid username and password.
             *                                         To have the JSDOSession object manage access to the web application's resources for you, you need
             *                                         to pass these credentials in a call to the JSDOSession object's login( ) method. Typically, you
             *                                         would require the user to enter their credentials into a login dialog provided by your mobile app,
             *                                         either using a form of your own design or using a template provided by Progress Software Corp.
             * progress.data.Session.AUTH_TYPE_FORM   The web application uses Form-based authentication. Like HTTP Basic, Form-based authentication
             *                                         requires user credentials for access to protected resources; the difference is that the web application
             *                                         itself sends a form to the client to get the credentials. However, when you have the JSDOSession object
             *                                         manage access to the web application's resources, you handle Form-based authentication the same way that
             *                                         you handle Basic get the user's credentials yourself and pass them to the login( ) method.
             *                                         The JSDOSession intercepts the form sent by the web application and handles the authentication without
             *                                         that form being displayed.
             */
            authenticationModel?: string;

            /**
             * A string with an operative value that you define to enable page refresh support for a JSDOSession object when it is instantiated for access
             * by a client web app. The operative value can be any value other than the empty string (""), null, or undefined.
             *
             * If this page refresh support is enabled, when the web app successfully logs the newly instantiated JSDOSession into its server web application,
             * the object stores the state of its JSDO login session using this name property value as a key. Then, at any time after log in, if the user
             * initiates a browser refresh on the web app page, the JSDOSession object automatically identifies and restores its login session using this value.
             *
             * This helps to ensure, after a page refresh, that the web app does not need to prompt the user again for credentials in order to re-establish
             * its connection to the web application for this JSDOSession.
             * If you do not specify an operative value for name (the default), or you specify a non-operative value, such as the empty string (""), null,
             * or undefined, the JSDOSession is instantiated without this page refresh support.
             */
            name?: string;
        }

        interface JSDOLoginParameter {

            /**
             * A number that specifies the time, in milliseconds, that the login( ) method waits for a response before returning an error.
             * This error might mean that the user entered invalid credentials. If you set this value to zero (0), no timeout is set,
             * and login( ) can wait indefinitely before returning an error.
             *
             * If you do not set the iOSBasicAuthTimeout property, login( ) uses 4000 (4 seconds) as the default value.
             */
            iOSBasicAuthTimeout?: number;
        }

        interface LoginInfo {

            /**
             * Any error object thrown as a result of sending a login request to the web server.
             */
            errorObject: any;

            /**
             * A reference to the XMLHttpRequest object sent to the web server to start a JSDO login session.
             */
            xhr: XMLHttpRequest;
        }

        interface JSDOSessionCatalogDetails {

            /**
             *  The URI of a specified Catalog.
             */
            readonly catalogURI: string;

            /**
             * A constant indicating the result of loading the Catalog that can have one of the following values:
             *
             * progress.data.Session.SUCCESS  The specified Catalog loaded successfully, or has previously been loaded
             * progress.data.Session.CATALOG_ALREADY_LOADED  The specified Catalog was previously loaded.
             * progress.data.Session.AUTHENTICATION_FAILURE  The specified Catalog failed to load because of an authentication error.
             * progress.data.Session.GENERAL_FAILURE  The specified Catalog failed to load because of an error other than an authentication failure.
             */
            readonly result: string;

            /**
             * Any error object thrown while attempting to load the Catalog.
             */
            readonly errorObject: any;

            /**
             * A reference to the XMLHttpRequest object used to load the Catalog from a web server.
             */
            readonly xhr: XMLHttpRequest;
        }

        interface JSDOSessionAuthorizedInfo {

            /**
             * A reference to the XMLHttpRequest object, if any, sent to the web server to make the authorization request to the web application.
             * If no request was made, this property is undefined.
             */
            xhr: XMLHttpRequest;

            /**
             * A string constant that is set only if isAuthorized( ) determines that the JSDOsession object is disconnected from its web application
             * or its associated application server. The returned value indicates the reason for the JSDOsession offline state.
             *
             * Possible values include some of those * returned by a call to the ping( ) method, as follows:
             *
             * progress.data.Session.DEVICE_OFFLINE  The device itself is offline. For example, it might be in airplane mode,
             *                                        or it might be unable to pick up a Wi-Fi or cell signal.
             * progress.data.Session.SERVER_OFFLINE  The web server is not available. For a Rollbase Data Object Service,
             *                                        this is the web server for the public or private cloud. For an OpenEdge Data Object Service,
             *                                        this is the Tomcat Java servlet container.
             * progress.data.Session.WEB_APPLICATION_OFFLINE  The server is running, but the Java web application that implements
             *                                                 the Data Object Service is not deployed.
             */
            offlineReason: string;
        }
        
    }

}
