/* 
progress.auth.anon.js    Version: 4.4.0-1

Copyright (c) 2016 Progress Software Corporation and/or its subsidiaries or affiliates.
 
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
    /*global $ : false, storage, XMLHttpRequest, msg*/

    /* define these if not defined yet - they may already be defined if
       progress.js was included first */
    if (typeof progress === "undefined") {
        progress = {};
    }
    if (typeof progress.data === "undefined") {
        progress.data = {};
    }
        
// ADD AN OPTIONS PARAM THAT CAN INCLUDE A NAME FOR PAGE REFRESH?    
    progress.data.AuthenticationProviderAnon = function (uriParam) {
        var that = this,
            tempURI;
        
        this._uri = null;
        this._authenticationModel = progress.data.Session.AUTH_TYPE_ANON;
        this._storage = null; // ref to what we use to store session state and token data
        this._storageKey = null;
        this._loginURIsegment = "/static/home.html";
        this._loginURI = null;
        this._logoutURIsegment = "";
        this._logoutURI = null;
        this._loggedIn = false;
        this._dataKeys = {
            uri: ".uri",
            loggedIn: ".loggedIn"
        };
         
        
        // PRIVATE FUNCTIONS

        // Store the given token with the uri as the key. setItem() throws
        // a "QuotaExceededError" error if there is insufficient storage space or 
        // "the user has disabled storage for the site" (Web storage spec at WHATWG)
        this._storeInfo = function (info) {
            this._storage.setItem(this._dataKeys.uri, JSON.stringify(this._uri));
            this._storage.setItem(this._dataKeys.loggedIn, JSON.stringify(this._loggedIn));
        };

        // get one of the pieces of data related to tokens from storage (could be the token itself, or
        // the refresh token, expiration info, etc.). Returns null if the item isn't in storage
        this._retrieveInfoItem = function (propName) {
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

        this._retrieveURI = function () {
            return this._retrieveInfoItem(this._dataKeys.uri);
        };

        this._retrieveLoggedIn = function () {
            return this._retrieveInfoItem(this._dataKeys.loggedIn);
        };

        this._clearInfo = function (info) {
            this._storage.removeItem(this._dataKeys.uri);
            this._storage.removeItem(this._dataKeys.loggedIn);
        };

        // put the internal state back to where it is when the constructor finishes running
        this._reset = function () {
            this._clearInfo();
            this._loggedIn = false;
        };
        
        function openLoginRequest(xhr) {
            var uriForRequest;
            
            if (progress.data.Session._useTimeStamp) {
                uriForRequest = progress.data.Session._addTimeStampToURL(that._loginURI);
            }

            xhr.open('GET', uriForRequest, true);
            xhr.setRequestHeader("Cache-Control", "no-cache");
            xhr.setRequestHeader("Pragma", "no-cache");
        //  ?? setRequestHeaderFromContextProps(this, xhr);

        }

        function processLoginResult(xhr, deferred) {
            var result;

            if (xhr.status === 200) {
                // Need to set loggedIn now so we can call logout from here if there's an
                // error processing the response (e.g., authentication succeeded but we didn't get a
                // token for some reason)
                that._loggedIn = true;
                that._storeInfo();
                result = progress.data.Session.SUCCESS;
            } else if (xhr.status === 401) {
                // somebody gave us the wrong authenticationModel!
                result = progress.data.Session.AUTHENTICATION_FAILURE;
            } else {
                result = progress.data.Session.GENERAL_FAILURE;
            }

            if (result === progress.data.Session.SUCCESS) {
                deferred.resolve(
                    that,
                    result,
                    {
                        "xhr": xhr
                    }
                );
            } else {
                deferred.reject(
                    that,
                    result,
                    {
                        // errorObject : errorObject, // we don't currently generate an Error
                        xhr: xhr
                    }
                );
            }
        }

        
        // PROPERTIES
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

            

        this._initialize = function (uriParam, authModel) {
            if (typeof uriParam !== "string") {
                // AuthenticationProvider: Argument 1 must be of type string in constructor call.
                throw new Error(progress.data._getMsgText("jsdoMSG121", "AuthenticationProvider", "1",
                                               "string", "constructor"));
            } else if (uriParam.length === 0) {
                // AuthenticationProvider: '' is an invalid value for the uri parameter in constructor call.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG507",
                    "AuthenticationProvider",
                    uriParam,
                    "uri",
                    "constructor"
                ));
            } else {
                // get rid of trailing '/' because appending service url that starts with '/'
                // will cause request failures
                if (uriParam[uriParam.length - 1] === "/") {
                    tempURI = uriParam.substring(0, uriParam.length - 1);
                } else {
                    tempURI = uriParam;
                }

                this._uri = uriParam; // keep the uri property the same as what was passed in
                this._loginURI = tempURI + this._loginURIsegment;
                this._logoutURI = tempURI + this._logoutURIsegment;
            }

            this._authenticationModel = authModel;
            // future: for page refresh -- storeSessionInfo("authenticationModel", authenticationModel);

            if (typeof sessionStorage === "undefined") {
                // "AuthenticationProvider: No support for sessionStorage."
                throw new Error(progress.data._getMsgText("jsdoMSG126",
                                                          "AuthenticationProvider",
                                                          "sessionStorage"));
            }
            // if you switch to a different type of storage, change the error message argument above
            this._storage = sessionStorage;

            // should come up with something more intelligent than this (maybe)
            this._storageKey = this._uri;  // or name
            this._dataKeys.uri = this._storageKey + this._dataKeys.uri;
            this._dataKeys.loggedIn = this._storageKey + this._dataKeys.loggedIn;

            if (this._retrieveLoggedIn()) {
                this._loggedIn = true;
            }
        };
        
        // process constructor arguments
        this._initialize(uriParam, progress.data.Session.AUTH_TYPE_ANON);
        
        // METHODS
        
        this.login = function () {
            var deferred = $.Deferred(),
                xhr;

            if (this._loggedIn) {
                // "The login method was not executed because the AuthenticationProvider is 
                // already logged in." 
                throw new Error(progress.data._getMsgText("jsdoMSG051", "AuthenticationProvider"));
            }

            xhr = new XMLHttpRequest();
            openLoginRequest(xhr);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    // process the response from the Web application
                    processLoginResult(xhr, deferred);
                }
            };

            xhr.send();
            return deferred.promise();
        };
        

        this.logout = function () {
            var deferred = $.Deferred();

            this._reset();
            deferred.resolve(that, progress.data.Session.SUCCESS, {});
            return deferred.promise();
        };
        
        this.hasCredential = function () {
            return this._loggedIn;
        };

        this.openRequestAndAuthorize = function (xhr, verb, uri) {
        
            if (this.hasCredential()) {
                xhr.open(verb, uri, true);

                // We specify application/json for the response so that, if a bad token is sent, an 
                // OE Web application that's based on Form auth will directly send back a 401 with
                // error info in the body as JSON. So we're stting the accept header to application/json
                // even though we're supposedly doing Anonymous --- if the back end is actually using Form,
                // getting back the 401 and the JSON in the body might help us figure out what really
                // wnet wrong
                xhr.setRequestHeader("Accept", "application/json");
            } else {
                // This message is SSO specific, unless we can come up with a more general message 
                // JSDOSession: The AuthenticationProvider needs to be managing a valid token.
                throw new Error(progress.data._getMsgText("jsdoMSG125", "AuthenticationProvider"));
            }
            
        };

    };

}());

