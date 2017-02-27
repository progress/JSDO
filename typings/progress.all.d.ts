/**
 * type definitions for Progress JSDO 4.3.1 - progress.all.js
 *
 * Author(s): egarcia, Traveleye
 */

export module progress {

    export module data {

        /**
         * Utility class that saves/reads data to localStorage
         *
         * @returns {progress.data.LocalStorage}
         */
        export class LocalStorage {

            /**
             * puts an object/any with a key into the local storage
             */
            saveToLocalStorage(name: string, dataObj: any): void;

            /**
             * returns an object/any from the local storage
             */
            readFromLocalStorage(name: string): any;

            /**
             * removes an object/any from the local storage
             */
            clearLocalStorage(name: string);
        }

        export class ContextProperties {

            /**
             * the string to be sent in the X-CLIENT-PROPS header (unless Session.xClientProps has been set)
             */
            readonly contextHeader: string;

            /**
             * get a context property
             */
            getContextProperty(propertyName: string): any;

            /**
             * sets a context property
             */
            setContextProperty(propertyName: string, propertyValue: any): void;

            /**
             * gets the context
             */
            getContext(): Map<String, any>;

            /**
             * sets the context
             */
            setContext(context: Map<String, any>): void;
        }

        export class Session {

            static readonly AUTH_TYPE_FORM: string;
            static readonly AUTH_TYPE_BASIC: string;
            static readonly AUTH_TYPE_ANON: string;

            constructor(options?: SessionOptions);

            login(serviceURI: string, username: string, password: string): void;
            addCatalog(catalogURI: string): void;
            subscribe(eventName: string, callback: Function, scope?: any): void;
            unsubscribe(eventName: string, callback: Function, scope?: any): void;
            unsubscribeAll(eventName: string): void;
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
            readonly catalogURIs: string[];

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
            addCatalog(catalogURI: string): JQueryCatalogPromise;

            /**
             * Loads one or more local or remote Data Service Catalogs into the current JSDOSession object.
             */
            addCatalog(catalogURI: string[]): JQueryCatalogPromise;

            /**
             * Loads one local or remote Data Service Catalogs into the current JSDOSession object.
             */
            addCatalog(catalogURI: string, username: string, password: string): JQueryCatalogPromise;

            /**
             * Loads one or more local or remote Data Service Catalogs into the current JSDOSession object.
             */
            addCatalog(catalogURI: string[], username: string, password: string): JQueryCatalogPromise;

            /**
             * Determines if the current JSDOSession object has authorized access to the web application specified by its serviceURI property setting.
             */
            isAuthorized(): JQueryAuthorizedPromise;

            /**
             * Starts a JSDO login session in a web application for the current JSDOSession object by sending an HTTP request
             * with specified user credentials to the web application URI specified in the object's constructor.
             */
            login(loginParameter?: JSDOLoginParameter): JQueryLoginPromise;

            /**
             * Starts a JSDO login session in a web application for the current JSDOSession object by sending an HTTP request
             * with specified user credentials to the web application URI specified in the object's constructor.
             */
            login(username: string, password: string, loginParameter?: JSDOLoginParameter): JQueryLoginPromise;

            /**
             * Terminates the login session on the web application managed by the current JSDOSession object,
             * and reinitializes most of the state information maintained by the object.
             */
            logout(): JQueryLoginPromise;

            /**
             * Determines the online state of the current JSDOSession object from its ability to access
             * the web application that it manages, and for an OpenEdge web application, from detecting
             * if its associated application server is running.
             */
            ping(): JQueryPingPromise;

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
            setContext(context: Map<String, any>): void;

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
            getContext(): Map<String, any>;

            /**
             *
             */
            getContextProperty(propertyName: string): any;

        }

        interface SessionOptions {
        }

        interface JSDOSessionOptions {

            /**
             * A string expression containing the URI of the web application for which to start a JSDO login session.
             * This web application must support one or more Data Object Services in order to create JSDOs for the resources provided by the application.
             * This URI is appended with a string that identifies a resource to access as part of the login process.
             */
            serviceURI: string;

            /**
             * (Optional) A string constant that specifies one of the three authentication models that the JSDOSession object supports,
             * depending on the web application configuration
             *
             * progress.data.Session.AUTH_TYPE_ANON  — (Default) The web application supports Anonymous access. No authentication is required.
             * progress.data.Session.AUTH_TYPE_BASIC — The web application supports HTTP Basic authentication and requires a valid username and password.
             *                                         To have the JSDOSession object manage access to the web application's resources for you, you need
             *                                         to pass these credentials in a call to the JSDOSession object's login( ) method. Typically, you
             *                                         would require the user to enter their credentials into a login dialog provided by your mobile app,
             *                                         either using a form of your own design or using a template provided by Progress Software Corp.
             * progress.data.Session.AUTH_TYPE_FORM  — The web application uses Form-based authentication. Like HTTP Basic, Form-based authentication
             *                                         requires user credentials for access to protected resources; the difference is that the web application
             *                                         itself sends a form to the client to get the credentials. However, when you have the JSDOSession object
             *                                         manage access to the web application's resources, you handle Form-based authentication the same way that
             *                                         you handle Basic—get the user's credentials yourself and pass them to the login( ) method.
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

        interface FilterOptions {
            filter?: any;
            id?: any;
            skip?: any;
            sort?: any;
            top?: any;
        }

        interface CRUDCallback {
            (jsdo: JSDO, success: boolean, request: any): void;
        }

        interface JQueryLoginPromise extends JQueryPromise {

            /**
             * Add handlers to be called when the Deferred object is resolved.
             *
             * @param doneCallback  A function, or array of functions, that are called when the Deferred is resolved.
             */
            done(callback: (session: JSDOSession, result: string, info: JSDOSessionLoginInfo) => any): JQueryLoginPromise;

            /**
             * Add handlers to be called when the Deferred object is rejected.
             *
             * @param failCallback  A function, or array of functions, that are called when the Deferred is rejected.
             */
            fail(callback: (session: JSDOSession, result: string, info: JSDOSessionLoginInfo) => any): JQueryLoginPromise;

            /**
             * Add handlers to be called when the Deferred object is either resolved or rejected.
             *
             * @param alwaysCallback  A function, or array of functions, that is called when the Deferred is resolved or rejected.
             */
            always(callback: (session: JSDOSession, result: string, info: JSDOSessionLoginInfo) => any): JQueryLoginPromise;

        }

        interface JSDOSessionLoginInfo {

            /**
             * Any error object thrown as a result of sending a login request to the web server.
             */
            errorObject: any;

            /**
             * A reference to the XMLHttpRequest object sent to the web server to start a JSDO login session.
             */
            xhr: XMLHttpRequest;
        }

        interface JQueryCatalogPromise extends JQueryPromise {

            /**
             * Add handlers to be called when the Deferred object is resolved.
             *
             * @param doneCallback  A function, or array of functions, that are called when the Deferred is resolved.
             */
            done(callback: (session: JSDOSession, result: string, details: JSDOSessionCatalogDetails) => any): JQueryCatalogPromise;

            /**
             * Add handlers to be called when the Deferred object is rejected.
             *
             * @param failCallback  A function, or array of functions, that are called when the Deferred is rejected.
             */
            fail(callback: (session: JSDOSession, result: string, details: JSDOSessionCatalogDetails) => any): JQueryCatalogPromise;

            /**
             * Add handlers to be called when the Deferred object is either resolved or rejected.
             *
             * @param alwaysCallback  A function, or array of functions, that is called when the Deferred is resolved or rejected.
             */
            always(callback: (session: JSDOSession, result: string, details: JSDOSessionCatalogDetails) => any): JQueryCatalogPromise;
        }

        interface JSDOSessionCatalogDetails {

            /**
             *  The URI of a specified Catalog.
             */
            readonly catalogURI: string;

            /**
             * A constant indicating the result of loading the Catalog that can have one of the following values:
             *
             * progress.data.Session.SUCCESS — The specified Catalog loaded successfully, or has previously been loaded
             * progress.data.Session.CATALOG_ALREADY_LOADED — The specified Catalog was previously loaded.
             * progress.data.Session.AUTHENTICATION_FAILURE — The specified Catalog failed to load because of an authentication error.
             * progress.data.Session.GENERAL_FAILURE — The specified Catalog failed to load because of an error other than an authentication failure.
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

        interface JQueryPingPromise extends JQueryPromise {

            /**
             * Add handlers to be called when the Deferred object is resolved.
             *
             * @param doneCallback  A function, or array of functions, that are called when the Deferred is resolved.
             */
            done(callback: (session: JSDOSession, result: boolean, info: JSODSessionAuthorizedInfo) => any): JQueryPingPromise;

            /**
             * Add handlers to be called when the Deferred object is rejected.
             *
             * @param failCallback  A function, or array of functions, that are called when the Deferred is rejected.
             */
            fail(callback: (session: JSDOSession, result: boolean, info: JSODSessionAuthorizedInfo) => any): JQueryPingPromise;

            /**
             * Add handlers to be called when the Deferred object is either resolved or rejected.
             *
             * @param alwaysCallback  A function, or array of functions, that is called when the Deferred is resolved or rejected.
             */
            always(callback: (session: JSDOSession, result: boolean, info: JSODSessionAuthorizedInfo) => any): JQueryPingPromise;

        }

        interface JQueryAuthorizedPromise extends JQueryPromise {

            /**
             * Add handlers to be called when the Deferred object is resolved.
             *
             * @param doneCallback  A function, or array of functions, that are called when the Deferred is resolved.
             */
            done(callback: (session: JSDOSession, result: string, info: JSODSessionAuthorizedInfo) => any): JQueryAuthorizedPromise;

            /**
             * Add handlers to be called when the Deferred object is rejected.
             *
             * @param failCallback  A function, or array of functions, that are called when the Deferred is rejected.
             */
            fail(callback: (session: JSDOSession, result: string, info: JSODSessionAuthorizedInfo) => any): JQueryAuthorizedPromise;

            /**
             * Add handlers to be called when the Deferred object is either resolved or rejected.
             *
             * @param alwaysCallback  A function, or array of functions, that is called when the Deferred is resolved or rejected.
             */
            always(callback: (session: JSDOSession, result: string, info: JSODSessionAuthorizedInfo) => any): JQueryAuthorizedPromise;
        }

        interface JSODSessionAuthorizedInfo {

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
             * progress.data.Session.DEVICE_OFFLINE — The device itself is offline. For example, it might be in airplane mode,
             *                                        or it might be unable to pick up a Wi-Fi or cell signal.
             * progress.data.Session.SERVER_OFFLINE — The web server is not available. For a Rollbase Data Object Service,
             *                                        this is the web server for the public or private cloud. For an OpenEdge Data Object Service,
             *                                        this is the Tomcat Java servlet container.
             * progress.data.Session.WEB_APPLICATION_OFFLINE — The server is running, but the Java web application that implements
             *                                                 the Data Object Service is not deployed.
             */
            offlineReason: string;
        }

        interface JQueryPromise {

            /**
             * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
             *
             * @param doneFilter     A function that is called when the Deferred is resolved.
             * @param failFilter     An optional function that is called when the Deferred is rejected.
             * @param progressFilter An optional function that is called when progress notifications are sent to the Deferred.
             */
            then(doneFilter: any, failFilter?: any, progressFilter?: any): JQueryPromise;

            /**
             * Add handlers to be called when the Deferred object is resolved.
             *
             * @param doneCallback  A function, or array of functions, that are called when the Deferred is resolved.
             * @param doneCallbacks An Optional additional functions, or arrays of functions, that are called when the Deferred is resolved.
             */
            done(doneCallBack: any, ...doneCallbacks: any[]): JQueryPromise;

            /**
             * Add handlers to be called when the Deferred object is rejected.
             *
             * @param failCallback  A function, or array of functions, that are called when the Deferred is rejected.
             * @param failCallbacks Optional additional functions, or arrays of functions, that are called when the Deferred is rejected.
             */
            fail(failCallback: any, ...failCallbacks: any[]): JQueryPromise;

            /**
             * Add handlers to be called when the Deferred object is either resolved or rejected.
             *
             * @param alwaysCallback  A function, or array of functions, that is called when the Deferred is resolved or rejected.
             * @param alwaysCallbacks Optional additional functions, or arrays of functions, that are called when the Deferred is resolved or rejected.
             */
            always(alwaysCallback: any, ...alwaysCallbacks: any[]): JQueryPromise;

            /**
             * Add handlers to be called when the Deferred object generates progress notifications
             *
             * @param progressCallback  A function, or array of functions, to be called when the Deferred generates progress notifications.
             * @param progressCallbacks Optional additional functions, or arrays of functions, to be called when the Deferred generates progress notifications.
             */
            progress(progressCallback: any, ...progressCallbacks: any[]): JQueryPromise;

            /**
             * Determine the current state of a Deferred object.
             *
             * "pending":  The Deferred object is not yet in a completed state (neither "rejected" nor "resolved").
             * "resolved": The Deferred object is in the resolved state, meaning that either deferred.resolve()
             *             or deferred.resolveWith() has been called for the object and the doneCallbacks have
             *             been called (or are in the process of being called).
             * "rejected": The Deferred object is in the rejected state, meaning that either deferred.reject()
             *             or deferred.rejectWith() has been called for the object and the failCallbacks have
             *             been called (or are in the process of being called).
             */
            state(): string;

            /**
             * Return a Deferred's Promise object.
             *
             * @param target: Object onto which the promise methods have to be attached
             */
            promise(target?: any): JQueryPromise;
        }

        interface JSDOPromise extends JQueryPromise {

            /**
             * Add handlers to be called when the Deferred object is resolved.
             *
             * @param doneCallback  A function, or array of functions, that are called when the Deferred is resolved.
             */
            done(callback: (jsdo: JSDO, success: boolean, request: JSDORequest) => any): JSDOPromise;

            /**
             * Add handlers to be called when the Deferred object is rejected.
             *
             * @param failCallback  A function, or array of functions, that are called when the Deferred is rejected.
             */
            fail(callback: (jsdo: JSDO, success: boolean, request: JSDORequest) => any): JSDOPromise;

            /**
             * Add handlers to be called when the Deferred object is either resolved or rejected.
             *
             * @param alwaysCallback  A function, or array of functions, that is called when the Deferred is resolved or rejected.
             */
            always(callback: (jsdo: JSDO, success: boolean, request: JSDORequest) => any): JSDOPromise;

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
             * - A resource that supports before-imaging — Record objects that are created, updated, or deleted on the server
             * - A resource that does not support before-imaging — Record objects to be created or updated on the server
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

        export class JSDO implements IJSTableRef, IJSRecord, ISubscribe {

            public static MODE_APPEND: number;
            public static MODE_MERGE: number;
            public static MODE_REPLACE: number;
            public static MODE_EMPTY: number;
            public static ALL_DATA: number;
            public static CHANGES_ONLY: number;

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
            invoke(methodName: string, object?: any): JSDOPromise;

            /**
             * Initializes JSDO memory with record objects from the data records in a single-table resource,
             * or in one or more tables of a multi-table resource, as returned by the Read operation
             * of the Data Object resource for which the JSDO is created.
             */
            fill(filter?: string): JSDOPromise;

            /**
             * Initializes JSDO memory with record objects from the data records in a single-table resource,
             * or in one or more tables of a multi-table resource, as returned by the Read operation
             * of the Data Object resource for which the JSDO is created.
             */
            fill(options: FilterOptions): JSDOPromise;

            addLocalRecords(addMode: number, keyFields?: any): boolean;
            addLocalRecords(storageName: string, addMode: number, keyFields?: any): boolean;
            deleteLocal(storageName?: string): void;
            hasChanges(): boolean;
            readLocal(storageName?: string): boolean;
            saveChanges(useSubmit?: boolean): void;
            saveLocal(dataMode?: number): void;
            saveLocal(storageName: string, dataMode: number): void;

            // IJSTableRef
            acceptChanges(): boolean;
            rejectChanges(): boolean;
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

            // IJSRecord
            acceptRowChanges(): boolean;
            assign(object: any): boolean;
            getErrorString(): string;
            getId(): string;
            rejectRowChanges(): boolean;
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

            // IJSTableRef
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

            // IJSRecord
            acceptRowChanges(): boolean;
            assign(object: any): boolean;
            getErrorString(): string;
            getId(): string;
            rejectRowChanges(): boolean;
            remove(): boolean;

            // ISubscribe
            subscribe(eventName: string, callback: CRUDCallback, scope?: any): void;
            subscribe(eventName: string, operationName: string, callback: CRUDCallback, scope?: any): void;
            unsubscribe(eventName: string, callback: CRUDCallback, scope?: any): void;
            unsubscribe(eventName: string, operationName: string, callback: CRUDCallback, scope?: any): void;
        }

        export class JSRecord implements IJSRecord {

            data: any;

            // IJSRecord
            acceptRowChanges(): boolean;
            assign(object: any): boolean;
            getErrorString(): string;
            getId(): string;
            rejectRowChanges(): boolean;
            remove(): boolean;
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
    }

    export module util {

        /**
         * Utility class that allows subscribing and unsubscribing from named events.
         *
         * @returns {progress.util.Observable}
         */
        export class Observable {

            /**
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
             * @param evt    The name of the event to bind a handler to. String. Not case sensitive.
             * @param fn     The function callback for the event . Function.
             * @param scope  The scope the function is to be run in. Object. Optional.
             */
            subscribe(evt: string, fn: any, scope?: any): void;

            /**
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
             * @param evt        The name of the event to bind a handler to. String. Not case sensitive
             * @param operation  The name of the operation to bind to. String. Case sensitive.
             * @param fn         The function callback for the event . Function.
             * @param scope      The scope the function is to be run in. Object. Optional.
             */
            subscribe(evt: string, operation: string, fn: any, scope?: any): void;

            /**
             * remove the specified function so it no longer receives events from
             * the given name. event name is not case sensitive.
             *
             * @param evt    Required. The name of the event for which to unbind the given function. String.
             * @param fn     Required. The function to remove from the named event. Function.
             * @param scope  Optional. The function scope in which to remove the listener. Object.
             */
            unsubscribe(evt: string, fn: any, scope?: any): void;

            /**
             * remove the specified function so it no longer receives events from
             * the given name. event name is not case sensitive.
             *
             * @param evt       Required. The name of the event for which to unbind the given function.
             *                  String. Not case sensitive
             * @param operation Required.  The name of the operation to receive events. String. Case Sensitive
             * @param fn        Required. The function to remove from the named event. Function.
             * @param scope     Optional. The function scope in which to remove the listener. Object.
             */
            unsubscribe(evt: string, operation: string, fn: any, scope?: any): void;

            /**
             * trigger an event of the given name, and pass the specified data to
             * the subscribers of the event. Event name is not case sensitive.
             * A variable numbers of arguments can be passed as arguments to the event handler.
             *
             * @param evt  The name of the event to fire. String.  Not case sensitive
             * @param args Optional.  A variable number of arguments to pass to the event handlers.
             */
            trigger(evt: string, ...args: any[]): void;

            /**
             * trigger an event of the given name, and pass the specified data to
             * the subscribers of the event. Event name is not case sensitive.
             * A variable numbers of arguments can be passed as arguments to the event handler.
             *
             * @param evt  The name of the event to fire.  String.  Not case sensitive.
             * @param operation The name of the operation. String.  Case sensitive
             * @param args Optional.  A variable number of arguments to pass to the event handlers.
             */
            trigger(evt: string, operation: string, ...args: any[]): void;

            /**
             * unbind all listeners from the given event. If the
             * evt is undefined, then all listeners for all events are unbound
             * evnt name is not case sensitive
             *
             * @param evt       Optional. The name of the event to unbind.  If not passed, then all events are unbound
             * @param operation Optional. The name of the operation. String.  Case sensitive
             */
            unsubscribeAll(evt?: string, operation?: string): void;
        }
    }
}