/* 
progress.auth.js    Version: 4.3.0-4

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

        Object.defineProperty(this, 'tokenResponseDescriptor',
            {
                get: function () {
                    return tokenResponseDescriptor;
                },
                enumerable: true
            });
       
        if (typeof authURI === "undefined") {
            // Too few arguments. There must be at least {1}.
            throw new Error(progress.data._getMsgText("jsdoMSG038", "1"));
        }
        
        if (typeof authURI === "string") {
            authenticationURI = authURI;
        } else {
            // {1}: Argument {2} must be of type {3} in {4} call.
            throw new Error(progress.data._getMsgText("jsdoMSG121", "AuthenticationProvider", "1",
                                           "string", "constructor"));
        }
        
        options = options || {};
        
        if (typeof options !== "object") {
            // {1}: Argument {2} must be of type {3} in {4} call.
            throw new Error(progress.data._getMsgText("jsdoMSG121", "AuthenticationProvider", "2",
                                           "object", "constructor"));
        }
        
        if (options.tokenResponseDescriptor) {
            // {1}: tokenResponseDescriptors and tokenRequestDescriptors must contain a type field.
            if (typeof options.tokenResponseDescriptor.type === "undefined") {
                throw new Error(progress.data._getMsgText("jsdoMSG125", "AuthenticationProvider"));
            }
            
            if (options.tokenResponseDescriptor.type === progress.data.Session.HTTP_HEADER) {
                if (typeof options.tokenResponseDescriptor.headerName === "undefined") {
                    options.tokenResponseDescriptor.headerName = progress.data.Session.DEFAULT_HEADER_NAME;
                }
                
                // If the headerName string is empty, throw an error
                if (options.tokenResponseDescriptor.headerName.length === 0) {
                    // {1}: Invalid {2} given for a tokenResponseDescriptor or tokenRequestDescriptor.
                    throw new Error(progress.data._getMsgText(
                        "jsdoMSG127",
                        "AuthenticationProvider",
                        "headerName"
                    ));
                }
            } else {
                // {1}: Invalid {2} given for a tokenResponseDescriptor or tokenRequestDescriptor.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG127",
                    "AuthenticationProvider",
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

        function openTokenRequest(xhr, options) {
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
        function retrieveToken(token) {
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
                        if (that.tokenResponseDescriptor.type === progress.data.Session.HTTP_HEADER) {
                            token = xhr.getResponseHeader(that.tokenResponseDescriptor.headerName);
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
            return (retrieveToken() ? true : false);
        };
        
        this.authenticate = function (options) {
            var deferred = $.Deferred(),
                xhr;

            if (retrieveToken()) {
                // "authenticate() failed because the AuthenticationProvider is already managing a 
                // successful authentication."
                throw new Error(progress.data._getMsgText("jsdoMSG051", "AuthenticationProvider"));
            }

            xhr = new XMLHttpRequest();
            openTokenRequest(xhr, this, options);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    // process the response from the Web application
                    processAuthResult(xhr, deferred);
                }
            };

            xhr.send("j_username=" + options.userName + "&j_password=" + options.password +
                     "&submit=Submit" + "&OECP=1");
            return deferred;

        };

    };
    
    progress.data.AuthenticationConsumer = function (options) {
        var tokenRequestDescriptor;
        
        options = options || {};

        if (options.tokenRequestDescriptor) {
            // {1}: tokenResponseDescriptors and tokenRequestDescriptors must contain a type field.
            if (typeof options.tokenRequestDescriptor.type === "undefined") {
                throw new Error(progress.data._getMsgText("jsdoMSG125", "AuthenticationConsumer"));
            }

            if (options.tokenRequestDescriptor.type === progress.data.Session.HTTP_HEADER) {
                if (typeof options.tokenRequestDescriptor.headerName === "undefined") {
                    options.tokenRequestDescriptor.headerName = progress.data.Session.DEFAULT_HEADER_NAME;
                }
                
                // If the headerName string is empty, throw an error
                if (options.tokenResponseDescriptor.headerName.length === 0) {
                    // {1}: Invalid {2} given for a tokenResponseDescriptor or tokenRequestDescriptor.
                    throw new Error(progress.data._getMsgText(
                        "jsdoMSG127",
                        "AuthenticationConsumer",
                        "headerName"
                    ));
                }
            } else {
                // {1}: Invalid {2} given for a tokenResponseDescriptor or tokenRequestDescriptor.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG127",
                    "AuthenticationConsumer",
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
            this.addTokenToRequest = options.addTokenToRequest;
        }
    };

}());

