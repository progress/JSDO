/* 
progress.auth.js    Version: 4.3.0-12

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
    /*global $ : false, sessionStorage, XMLHttpRequest*/

    /* define these if not defined yet - they may already be defined if
       progress.js was included first */
    if (typeof progress === "undefined") {
        progress = {};
    }
    if (typeof progress.data === "undefined") {
        progress.data = {};
    }
    
    progress.data.AuthenticationProvider = function (authURI, options) {
        var authenticationURI,
            tokenResponseDescriptor,
            that = this,
            storageKey;
        
        // PROPERTIES
        Object.defineProperty(this, 'authenticationURI',
            {
                get: function () {
                    return authenticationURI;
                },
                enumerable: true
            });
                
        if (typeof authURI !== "string") {
            // {1}: Argument {2} must be of type {3} in {4} call.
            throw new Error(progress.data._getMsgText("jsdoMSG121", "AuthenticationProvider", "1",
                                           "string", "constructor"));
        } else if (authURI.length === 0) {
            // {1}: '{2}' cannot be an empty string.
            throw new Error(progress.data._getMsgText(
                "jsdoMSG501",
                "AuthenticationProvider",
                "authenticationURI"
            ));
        } else {
            authenticationURI = authURI;
        }
        
        options = options || {};
        
        if (typeof options !== "object") {
            // {1}: Argument {2} must be of type {3} in {4} call.
            throw new Error(progress.data._getMsgText("jsdoMSG121", "AuthenticationProvider", "2",
                                           "object", "constructor"));
        }
        
        if (typeof options.tokenResponseDescriptor !== "undefined" &&
                typeof options.tokenResponseDescriptor !== "object") {
            // "{1}: '{2}' must be of type '{3}'"
            throw new Error(progress.data._getMsgText(
                "jsdoMSG503",
                "AuthenticationProvider",
                "tokenResponseDescriptor",
                "object"
            ));
        } else if (options.tokenResponseDescriptor) {
            if (typeof options.tokenResponseDescriptor.type === "undefined") {
                // {1}: '{2}' objects must contain a '{3}' field.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG500",
                    "AuthenticationProvider",
                    "tokenResponseDescriptor",
                    "type"
                ));
            }
            
            if (options.tokenResponseDescriptor.type === progress.data.Session.HTTP_HEADER) {
                if (typeof options.tokenResponseDescriptor.headerName === "undefined") {
                    options.tokenResponseDescriptor.headerName = progress.data.Session.DEFAULT_HEADER_NAME;
                } else if (typeof options.tokenResponseDescriptor.headerName !== "string") {
                    // {1}: The object '{2}' has an invalid value in the '{3}' property.
                    throw new Error(progress.data._getMsgText(
                        "jsdoMSG502",
                        "AuthenticationProvider",
                        "tokenResponseDescriptor",
                        "headerName"
                    ));
                }
                // If the headerName string is empty, throw an error
                if (options.tokenResponseDescriptor.headerName.length === 0) {
                    // {1}: '{2}' cannot be an empty string.
                    throw new Error(progress.data._getMsgText(
                        "jsdoMSG501",
                        "tokenResponseDescriptor",
                        "headerName"
                    ));
                }
            } else {
                // {1}: The object '{2}' has an invalid value in the '{3}' property.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG502",
                    "AuthenticationProvider",
                    "tokenResponseDescriptor",
                    "type"
                ));
            }
            
            tokenResponseDescriptor = options.tokenResponseDescriptor;
        } else {
            // Give it a default location
            tokenResponseDescriptor = {
                type : progress.data.Session.HTTP_HEADER,
                headerName : progress.data.Session.DEFAULT_HEADER_NAME
            };
        }

        // We're currently storing the token in sessionStorage with the 
        // authenticationURI as the key. This is subject to change later.
        storageKey = authenticationURI;

        // PRIVATE FUNCTIONS

        function openTokenRequest(xhr) {
            xhr.open('POST', that.authenticationURI, true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.setRequestHeader("Cache-Control", "max-age=0");
            xhr.withCredentials = true;
            xhr.setRequestHeader("Accept", "application/json");
        }

        // Store the given token with the authenticationURI as the key. setItem() throws
        // a "QuotaExceededError" error if there is insufficient storage space or 
        // "the user has disabled storage for the site" (Web storage spec at WHATWG)
        function storeToken(token) {
            sessionStorage.setItem(storageKey, token);
        }
        
        // get the token from storage. Returns null if this object hasn't stored one yet
        function retrieveToken() {
            return sessionStorage.getItem(storageKey);
        }

        function processAuthResult(xhr, deferred) {
            var errorObject,
                result,
                token;

            if (deferred) {
                if (xhr.status === 200) {
                    // get token and store it; if that goes well, resolve the promise, otherwise reject it
                    try {
                        // Try to get the token from the appropriate location
                        if (tokenResponseDescriptor.type === progress.data.Session.HTTP_HEADER) {
                            token = xhr.getResponseHeader(tokenResponseDescriptor.headerName);
                        }
                        
                        if (token) {
                            storeToken(token);
                            // got the header, it has a value, and storeToken() didn't thrown an error;
                            // call it a success
                            result = progress.data.Session.SUCCESS;
                        } else {
                            result = progress.data.Session.GENERAL_FAILURE;
                            // {1}: Unexpected error authenticating: {error-string}
                            // ( No token returned from server)
                            errorObject = new Error(progress.data._getMsgText(
                                "jsdoMSG049",
                                "AuthenticationProvider",
                                progress.data._getMsgText("jsdoMSG050")
                            ));
                        }
                    } catch (ex) {
                        result = progress.data.Session.GENERAL_FAILURE;
                        // {1}: Unexpected error authenticating: {error-string}
                        // (error could be thrown from storeToken when it calls setItem())
                        errorObject = new Error(progress.data._getMsgText(
                            "jsdoMSG049",
                            "AuthenticationProvider",
                            ex.message
                        ));
                    }
                } else if (xhr.status === 401 || xhr.status === 403) {
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
                            errorObject : errorObject, // might be undefined, that's OK
                            xhr: xhr
                        }
                    );
                }
            } else {
                throw new Error("deferred missing when processing authenticate result");
            }
        }

        // METHODS
        this.isAuthenticated = function () {
            return (retrieveToken() === null ? false : true);
        };
        
        this.authenticate = function (userName, password) {
            var deferred = $.Deferred(),
                xhr;

            if (typeof userName !== "string") {
                // JSDO: {1} parameter must be a string in {2} call.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG116",
                    "userName",
                    "authenticate()"
                ));
            } else if (userName.length === 0) {
                // {1}: '{2}' cannot be an empty string.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG501",
                    "AuthenticationProvider",
                    "userName"
                ));
            }
            
            if (typeof password !== "string") {
                // JSDO: {1} parameter must be a string in {2} call.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG116",
                    "password",
                    "authenticate()"
                ));
            } else if (password.length === 0) {
                // {1}: '{2}' cannot be an empty string.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG501",
                    "AuthenticationProvider",
                    "password"
                ));
            }
            
            if (this.isAuthenticated()) {
                // "authenticate() failed because the AuthenticationProvider is already managing a 
                // successful authentication."
                throw new Error(progress.data._getMsgText("jsdoMSG051", "AuthenticationProvider"));
            }

            xhr = new XMLHttpRequest();
            openTokenRequest(xhr);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    // process the response from the Web application
                    processAuthResult(xhr, deferred);
                }
            };

            xhr.send("j_username=" + userName + "&j_password=" + password +
                     "&submit=Submit" + "&OECP=1");
            return deferred.promise();
        };
        
        this.invalidate = function () {
            var deferred = $.Deferred();
            
            if (this.isAuthenticated()) {
                sessionStorage.removeItem(storageKey);
            }
            
            // This will return nothing for now since I'm not sure what we need 
            // to return for invalidate() in the first place.
            deferred.resolve();
            
            return deferred.promise();
        };
        
        // This is going to be harcoded for now. This can very 
        // possibly change in the future if we decide to expose 
        // the token to the user.
        this._getToken = function () {
            return retrieveToken();
        };
    };
    
    progress.data.AuthenticationConsumer = function (options) {
        var tokenRequestDescriptor;
        
        options = options || {};

        if (typeof options !== "object") {
            // {1}: Argument {2} must be of type {3} in {4} call.
            throw new Error(progress.data._getMsgText("jsdoMSG121", "AuthenticationConsumer", "2",
                                           "object", "constructor"));
        }
        
                
        if (typeof options.tokenRequestDescriptor !== "undefined" &&
                typeof options.tokenRequestDescriptor !== "object") {
            // "{1}: '{2}' must be of type '{3}'"
            throw new Error(progress.data._getMsgText(
                "jsdoMSG503",
                "AuthenticationProvider",
                "tokenRequestDescriptor",
                "object"
            ));
        } else if (options.tokenRequestDescriptor) {
            if (typeof options.tokenRequestDescriptor !== "object") {
                // "{1}: '{2}' must be of type '{3}'"
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG503",
                    "AuthenticationConsumer",
                    "tokenRequestDescriptor",
                    "object"
                ));
            }
            
            if (typeof options.tokenRequestDescriptor.type === "undefined") {
                // {1}: '{2}' objects must contain a '{3}' field.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG500",
                    "AuthenticationConsumer",
                    "tokenRequestDescriptor",
                    "type"
                ));
            }

            if (options.tokenRequestDescriptor.type === progress.data.Session.HTTP_HEADER) {
                if (typeof options.tokenRequestDescriptor.headerName === "undefined") {
                    options.tokenRequestDescriptor.headerName = progress.data.Session.DEFAULT_HEADER_NAME;
                } else if (typeof options.tokenRequestDescriptor.headerName !== "string") {
                    // {1}: The object '{2}' has an invalid value in the '{3}' property.
                    throw new Error(progress.data._getMsgText(
                        "jsdoMSG502",
                        "AuthenticationConsumer",
                        "tokenRequestDescriptor",
                        "headerName"
                    ));
                }
                
                // If the headerName string is empty, throw an error
                if (options.tokenRequestDescriptor.headerName.length === 0) {
                    // {1}: '{2}' cannot be an empty string.
                    throw new Error(progress.data._getMsgText(
                        "jsdoMSG501",
                        "tokenRequestDescriptor",
                        "headerName"
                    ));
                }
            } else {
                // {1}: The object '{2}' has an invalid value in the '{3}' property.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG502",
                    "AuthenticationConsumer",
                    "tokenRequestDescriptor",
                    "type"
                ));
            }
            
            tokenRequestDescriptor = options.tokenRequestDescriptor;
        } else {
            // Give it a default location
            tokenRequestDescriptor = {
                type : progress.data.Session.HTTP_HEADER,
                headerName : progress.data.Session.DEFAULT_HEADER_NAME
            };
        }
        
        if (typeof options.addTokenToRequest === "undefined") {
            // Create a default function where we add the token to the header
            if (tokenRequestDescriptor.type === progress.data.Session.HTTP_HEADER) {
                this.addTokenToRequest = function (xhr, token) {
                    xhr.setRequestHeader(
                        tokenRequestDescriptor.headerName,
                        token
                    );
                };
            }
        } else {
            if (typeof options.addTokenToRequest !== "function") {
                // {1}: The object '{2}' has an invalid value in the '{3}' property.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG502",
                    "AuthenticationConsumer",
                    "tokenRequestDescriptor",
                    "addTokenToRequest"
                ));
            }
            this.addTokenToRequest = options.addTokenToRequest;
        }
    };
}());

