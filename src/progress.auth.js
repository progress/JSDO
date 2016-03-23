
/* 
progress.auth.js    Version: 4.3.0-2

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

    progress.data.AuthenticationProvider = function (options) {
        var authenticationURI,
            tokenResponseDescriptor,
            defaultHeaderName = "X-OE-CLIENT-CONTEXT-ID",
            that = this,
            storageKey;
        
        // TODO: Change storageKey to ID? Doesn't matter right now since we're
        // not letting anyone see where the token is stored anyway.

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


        if (typeof options === "undefined") {
            // Too few arguments. There must be at least {1}.
            throw new Error(progress.data._getMsgText("jsdoMSG038", "1"));
        }

        if (options.authenticationURI) {
            authenticationURI = options.authenticationURI;
        } else {
            // {2} method has argument '{3}' that is missing property '{4}'
            throw new Error(progress.data._getMsgText("jsdoMSG048", "AuthenticationProvider", "Constructor",
                                                      "options", "authenticationURI"));
        }

        if (options.tokenResponseDescriptor) {
            tokenResponseDescriptor = options.tokenResponseDescriptor;
        } else {
            // Give it a default location
            tokenResponseDescriptor = {
                headerName : defaultHeaderName
            };
        }

        // We're currently storing the token in sessionStorage with the 
        // authenticationURI as the key. This is subject to change later.
        storageKey = authenticationURI;

        // PRIVATE FUNCTIONS

        function openTokenRequest(xhr, authProvider, credentials) {
            xhr.open('POST', authProvider.authenticationURI, true);
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
                        token = xhr.getResponseHeader(that.tokenResponseDescriptor.headerName);
                        if (token) {
                            storeToken(token);
                            // got the header, it has a value, and storeToken() didn't thrown an error;
                            // call it a success
                            result = progress.data.Session.SUCCESS;
                        } else {
                            result = progress.data.Session.GENERAL_FAILURE;
                            // " Unexpected error authenticating: No token returned from server"
                            errorObject = new Error(progress.data._getMsgText(
                                "jsdoMSG049",
                                "AuthenticationProvider",
                                progress.data._getMsgText("jsdoMSG050")
                            ));
                        }
                    } catch (eStore) {
                        result = progress.data.Session.GENERAL_FAILURE;
                        // Unexpected error authenticating: <error-string>
                        // (error could be thrown from storeToken when it calls setItem())
                        errorObject = new Error(progress.data._getMsgText(
                            "jsdoMSG049",
                            "AuthenticationProvider",
                            eStore.message
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
        this.authenticate = function (options) {
            var deferred = $.Deferred(),
                xhr;

            if (retrieveToken()) {
                // "authenticate() failed because the AuthenticationProvider is already managing a 
                // successful authentication."
                throw new Error(progress.data._getMsgText("jsdoMSG051", "AuthenticationProvider"));
            }

            xhr = new XMLHttpRequest();
            XMLHttpRequest.foo = "bar";
            openTokenRequest(xhr, this, options);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    // process the response from the Web application
                    processAuthResult(xhr, deferred);
                }
            };

            // TODO: Add OECP as an option here.
            xhr.send("j_username=" + options.userName + "&j_password=" + options.password + "&submit=Submit");
            return deferred;

        };

    };

}());

