/* 
progress.auth.js    Version: 4.4.0-3

Copyright (c) 2016-2017 Progress Software Corporation and/or its subsidiaries or affiliates.
 
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

    "use strict";  // note that this makes JSLint complain if you use arguments[x]

    /*global progress : true*/
    /*global $ : false, storage, XMLHttpRequest*/

    /* define these if not defined yet - they may already be defined if
       progress.js was included first */
    if (typeof progress === "undefined") {
        progress = {};
    }
    if (typeof progress.data === "undefined") {
        progress.data = {};
    }
        
    // This is really more along the lines of a Factory method in that it explicitly creates an object 
    // and returns it based on the the authModel parameter (rather than following the default JS
    // pattern of adding properties to the "this" object created for it and passed in by the runtime).
    // NOTE: If we support multiple AuthenticationProviders that get different tokens from the same
    //       server, we may need to add a "name" property to the initObject to use as a storage key

    progress.data.AuthenticationProvider = function (initObject) {
        var authProv,
            authModel,
            uri;

        // process constructor arguments
        if (typeof initObject === 'object') {
            
            // these 2 calls throw an appropriate error if the check doesn't pass
            this._checkStringArg(
                "constructor",
                initObject.authenticationModel,
                "initObject.authenticationModel",
                "initObject.authenticationModel"
            );

            this._checkStringArg(
                "constructor",
                initObject.uri,
                "init-object.uri",
                "init-object.uri"
            );
        } else {
            // AuthenticationProvider: Invalid signature for constructor. The init-object argument 
            //                         was missing or invalid.
            throw new Error(progress.data._getMsgText(
                "jsdoMSG033",
                "AuthenticationProvider",
                "the constructor",
                "The init-object argument was missing or invalid."
            ));
        }

        authModel = initObject.authenticationModel.toLowerCase();
        switch (authModel) {
        case progress.data.Session.AUTH_TYPE_ANON:
            this._initialize(initObject.uri, progress.data.Session.AUTH_TYPE_ANON,
                     {"_loginURI": progress.data.AuthenticationProvider._homeLoginURIBase});
            authProv = this;
            break;
        case progress.data.Session.AUTH_TYPE_BASIC:
            authProv = new progress.data.AuthenticationProviderBasic(initObject.uri);
            break;
        case progress.data.Session.AUTH_TYPE_FORM:
            authProv = new progress.data.AuthenticationProviderForm(initObject.uri);
            break;
        case progress.data.Session.AUTH_TYPE_FORM_SSO:
            authProv = new progress.data.AuthenticationProviderSSO(initObject.uri);
            break;
        default:
            // AuthenticationProvider: The 'init-object' parameter passed to the 'constructor' function
            //                          has an invalid value for the 'authenticationModel' property.
            throw new Error(progress.data._getMsgText(
                "jsdoMSG502",
                "AuthenticationProvider",
                "init-object",
                "constructor",
                "authenticationModel"
            ));
            //break;
        }

        return authProv;
    };
        

    // ADD METHODS TO THE AuthenticationProvider PROTOYPE
    
    // GENERIC IMPLEMENTATION FOR login METHOD THAT THE API IMPLEMENTATIONS OF login CAN CALL
    // (technically, they don't override it, they each have small login methods that call this)
    progress.data.AuthenticationProvider.prototype._loginProto =
        function (sendParam) {
            var deferred = $.Deferred(),
                xhr,
                uriForRequest,
                header,
                that = this;

            if (this._loggedIn) {
                // "The login method was not executed because the AuthenticationProvider is 
                // already logged in." 
                throw new Error(progress.data._getMsgText("jsdoMSG051", "AuthenticationProvider"));
            }

            xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    // process the response from the Web application
                    that._processLoginResult(xhr, deferred);
                }
            };

            if (progress.data.Session._useTimeStamp) {
                uriForRequest = progress.data.Session._addTimeStampToURL(this._loginURI);
            } else {
                uriForRequest = this._loginURI;
            }

            this._openLoginRequest(xhr, uriForRequest);

            // We specify application/json for the response so that, if a bad request is sent, an 
            // OE Web application will directly send back a 401 with error info in the body as JSON. 
            // So we force the accept header to application/json because if we make an anonymous
            // request to a FORM/BASIC backend, it might redirect us to a login page since we have
            // no credentials. And since we can technically access JUST the login page, the XHR
            // will identify it as SUCCESS. If we specify "application/json", no redirects will
            // happen, just a plain old "401 GET OUTTA HERE" code.
            xhr.setRequestHeader("Accept", "application/json");
        
            xhr.send(sendParam);
            return deferred.promise();
        };
        
        
    
    // PUBLIC METHODS (and their "helpers") (documented as part of the JSDO library API)

    // login API method -- just a shell that calls loginProto
    progress.data.AuthenticationProvider.prototype.login = function () {
        return this._loginProto();
    };
    
    // HELPER FOR login METHOD, PROBABLY OVERRIDDEN IN MOST CONSTRUCTORS
    progress.data.AuthenticationProvider.prototype._openLoginRequest = function (xhr, uri) {
        xhr.open('GET', uri, true);
        progress.data.Session._setNoCacheHeaders(xhr);
    };

    // HELPER FOR login METHOD, PROBABLY OVERRIDDEN IN MOST CONSTRUCTORS
    progress.data.AuthenticationProvider.prototype._processLoginResult = function (xhr, deferred) {
        var result;

        if (xhr.status === 200) {
            // Need to set loggedIn now so we can call logout from here if there's an
            // error processing the response (e.g., authentication succeeded but we didn't get a
            // token for some reason)
            this._loggedIn = true;
            this._storeInfo();
            result = progress.data.Session.SUCCESS;
        } else if (xhr.status === 401) {
            // If this is Anonymous, somebody gave us the wrong authenticationModel!
            result = progress.data.Session.AUTHENTICATION_FAILURE;
        } else {
            result = progress.data.Session.GENERAL_FAILURE;
        }

        this._settlePromise(deferred, result, {"xhr": xhr});
    };
    
    
    // logout API METHOD -- SOME CONSTRUCTORS OR PROTOTYPES WILL OVERRIDE THIS
    progress.data.AuthenticationProvider.prototype.logout = function () {
        var deferred = $.Deferred();

        this._reset();
        deferred.resolve(this, progress.data.Session.SUCCESS, {});
        return deferred.promise();
    };
    
    // hasClientCredentials API METHOD -- PROBABLY ONLY OVERRIDDEN BY SSO
    progress.data.AuthenticationProvider.prototype.hasClientCredentials = function () {
        return this._loggedIn;
    };

    // hasRefreshToken API METHOD -- returns false for all AutghenticationProvider types except SSO,
    // which overrides it
    progress.data.AuthenticationProvider.prototype.hasRefreshToken = function () {
        return false;
    };

    // QUASI-PUBLIC METHOD 
    
    // general-purpose method for opening requests (mainly for jsdo calls)
    // This method is not part of the documented API that a developer would
    // program against, but it gets used in a validation check by the JSDOSESSION, because the
    // JSDOSESSION code expects it to be present. The point here is that if a developer were to
    // create their own AuthenticationProvider object, it would need to include this method
    // TODO: This method uses a callback, primarily to avoid breaking tdriver tests. We should change 
    // it to use promises
    progress.data.AuthenticationProvider.prototype._openRequestAndAuthorize = function (xhr,
                                                                                        verb,
                                                                                        uri,
                                                                                        async,
                                                                                        callback) {
        var errorObject;
        
        if (this.hasClientCredentials()) {
            xhr.open(verb, uri, async);

            // Check out why we do this in _loginProto
            xhr.setRequestHeader("Accept", "application/json");
        } else {
            // AuthenticationProvider: The AuthenticationProvider is not managing valid credentials.
            errorObject = new Error(progress.data._getMsgText("jsdoMSG125", "AuthenticationProvider"));
        }
        
        callback(errorObject);
    };

    // GENERAL PURPOSE "INTERNAL" METHODS, NOT RELATED TO SPECIFIC API ELEMENTS
    // (not documented, intended for use only within the JSDO library)

    // General purpose method for initializing an object
    progress.data.AuthenticationProvider.prototype._initialize = function (uriParam,
                                                                        authModel,
                                                                        targetURIs) {
        var tempURI,
            target;
        
        Object.defineProperty(this, 'uri',
            {
                get: function () {
                    return this._uri;
                },
                enumerable: true
            });
                
        Object.defineProperty(this, 'authenticationModel',
            {
                get: function () {
                    return this._authenticationModel;
                },
                enumerable: true
            });
        
                
        // get rid of trailing '/' because appending service url that starts with '/'
        // will cause request failures
        if (uriParam[uriParam.length - 1] === "/") {
            tempURI = uriParam.substring(0, uriParam.length - 1);
        } else {
            tempURI = uriParam;
        }

        // take the modified authentication uri and prepend it to all of the targets passed
        // in. E.g., the targetURIs object will include a "loginURI" property that has the 
        // uri segment which is to be added to the auth uri for logging in         
        for (target in targetURIs) {
            if (targetURIs.hasOwnProperty(target)) {
                this[target] = tempURI + targetURIs[target];
            }
        }
        
        this._authenticationModel = authModel;
        this._uri = uriParam; // keep the uri property the same as what was passed in
        
        this._loggedIn = false;
        this._dataKeys = {
            uri: ".uri",
            loggedIn: ".loggedIn"
        };
        
        // future: for page refresh -- storeSessionInfo("authenticationModel", authenticationModel);

        if (typeof sessionStorage === "undefined") {
            // "AuthenticationProvider: No support for sessionStorage."
            throw new Error(progress.data._getMsgText("jsdoMSG126",
                                                      "AuthenticationProvider",
                                                      "sessionStorage"));
        }
        // if you switch to a different type of storage, change the error message argument above
        this._storage = sessionStorage;

        // maybe should come up with something more intelligent than this
        this._storageKey = this._uri;  // or name
        this._dataKeys.uri = this._storageKey + this._dataKeys.uri;
        this._dataKeys.loggedIn = this._storageKey + this._dataKeys.loggedIn;

        if (this._retrieveLoggedIn()) {
            this._loggedIn = true;
        }
    };

    
    // Store data in storage with the uri as the key. setItem() throws. (Should add an
    // option for the developer to specify the key)
    // a "QuotaExceededError" error if there is insufficient storage space or 
    // "the user has disabled storage for the site" (Web storage spec at WHATWG)
    progress.data.AuthenticationProvider.prototype._storeInfo = function () {
        this._storage.setItem(this._dataKeys.uri, JSON.stringify(this._uri));
        this._storage.setItem(this._dataKeys.loggedIn, JSON.stringify(this._loggedIn));
    };

    // Get a piece of state data from storage. Returns null if the item isn't in storage
    progress.data.AuthenticationProvider.prototype._retrieveInfoItem = function (propName) {
        var jsonStr = this._storage.getItem(propName),
            value = null;
            
        if (jsonStr !== null) {
            try {
                value = JSON.parse(jsonStr);
            } catch (e) {
                value = null;
            }
        }
        return value;
    };

    // Get an AuthenticationProvider's uri from storage
    progress.data.AuthenticationProvider.prototype._retrieveURI = function () {
        return this._retrieveInfoItem(this._dataKeys.uri);
    };

    // Get an AuthenticationProvider's logon status from storage
    progress.data.AuthenticationProvider.prototype._retrieveLoggedIn = function () {
        return this._retrieveInfoItem(this._dataKeys.loggedIn);
    };

    // Clear the persistent storage used by an AuthenticationProvider
    progress.data.AuthenticationProvider.prototype._clearInfo = function (info) {
        this._storage.removeItem(this._dataKeys.uri);
        this._storage.removeItem(this._dataKeys.loggedIn);
    };

    // Put the internal state back to where it is when the constructor finishes
    // running (so the authentication model and uri are not changed, but other data is reset.
    // and storage is cleared out)
    progress.data.AuthenticationProvider.prototype._reset = function () {
        this._clearInfo();
        this._loggedIn = false;
    };

    
    // General purpose utility method, no overrides expected
    progress.data.AuthenticationProvider.prototype._settlePromise = function (deferred, result, info) {
        if (result === progress.data.Session.SUCCESS) {
            deferred.resolve(this, result, info);
        } else {
            deferred.reject(this, result, info);
        }
    };
    
    // General purpose utility method, no overrides expected
    progress.data.AuthenticationProvider.prototype._checkStringArg = function (fnName,
                                                                              argToCheck,
                                                                              argPosition,
                                                                              argName) {
        // TODO: ? distinguish between undefined (so we can give developer a clue that they
        // may be missing a property) and defined but wrong type
        if (typeof argToCheck !== "string") {
            // AuthenticationProvider: Argument {param-position} must be of type string in {fnName} call.
            throw new Error(progress.data._getMsgText(
                "jsdoMSG121",
                "AuthenticationProvider",
                argPosition,
                "string",
                fnName
            ));
        } else if (argToCheck.length === 0) {
        //  AuthenticationProvider: {param-name} cannot be an empty string.
            throw new Error(progress.data._getMsgText(
                "jsdoMSG501",
                "AuthenticationProvider",
                argName,
                fnName
            ));
        }
    };
    
    
    // "STATIC" PROPERTIES AND METHODS -- not on the prototype -- you cannot access these through an
    // object created by "new" --- they are  properties of the AuthenticationProvider constructor function
    
    // Takes an XHR as an input. If the xhr status is 401 (Unauthorized), determines whether
    // the auth failure was due to an expired token. Returns progress.data.Session.EXPIRED_TOKEN 
    // if it was, progress.data.Session.AUTHENTICATION_FAILURE if it wasn't, null if the xhr status wasn't 401
    progress.data.AuthenticationProvider._getAuthFailureReason = function (xhr) {
        var contentType,
            jsonObject,
            result = progress.data.Session.AUTHENTICATION_FAILURE;
        
        if (xhr.status === 401) {
            contentType = xhr.getResponseHeader("Content-Type");
            if (contentType && (contentType.indexOf("application/json") > -1) && xhr.responseText) {
                jsonObject = JSON.parse(xhr.responseText);
                if (jsonObject.error === "sso.token.expired_token") {
                    result = progress.data.Session.EXPIRED_TOKEN;
                }
            }
        } else {
            result = null;
        }
        return result;
    };

    Object.defineProperty(progress.data.AuthenticationProvider, '_homeLoginURIBase', {
        value: "/static/home.html",
        enumerable: true
    });
    Object.defineProperty(progress.data.AuthenticationProvider, '_springLoginURIBase', {
        value: "/static/auth/j_spring_security_check",
        enumerable: true
    });
    Object.defineProperty(progress.data.AuthenticationProvider, '_springLogoutURIBase', {
        value: "/static/auth/j_spring_security_logout",
        enumerable: true
    });
    Object.defineProperty(progress.data.AuthenticationProvider, '_springFormTokenLoginURIBase', {
        value: progress.data.AuthenticationProvider._springLoginURIBase + "?OECP=yes",
        enumerable: true
    });
    Object.defineProperty(progress.data.AuthenticationProvider, '_springFormTokenRefreshURIBase', {
        value: "/static/auth/token?op=refresh",
        enumerable: true
    });

}());

