
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

    "use strict";

    /*global progress : true, btoa*/
    /*global $ : false*/

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
            tokenLocation,
            defaultHeaderName = "X-OE-CLIENT-CONTEXT-ID",
            that = this;
        
        // PROPERTIES
        Object.defineProperty(this, 'authenticationURI',
            {
                get: function () {
                    return authenticationURI;
                },
                enumerable: true
            });

        Object.defineProperty(this, 'tokenLocation',
            {
                get: function () {
                    return tokenLocation;
                },
                enumerable: true
            });
 
        Object.defineProperty(this, 'token',
            {
                set: function (val) {
                    sessionStorage.setItem(authenticationURI, val);
                },
                get: function () {
                    return sessionStorage.getItem(authenticationURI);
                },
                enumerable: false
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

        if (options.tokenLocation) {
            tokenLocation = options.tokenLocation;
        } else {
            // Give it a default location
            tokenLocation = {
                headerName : defaultHeaderName
            };
        }
        
        // PRIVATE FUNCTIONS
        
        function openTokenRequest(xhr, authProvider, credentials) {
            xhr.open('POST', authProvider.authenticationURI, true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.setRequestHeader("Cache-Control", "max-age=0");
            xhr.withCredentials = true;
            xhr.setRequestHeader("Accept", "application/json");
        }
        
        function processAuthResult(xhr, deferred) {
            var token,
                errorObject,
                result;
            
            if (deferred) {
                if (xhr.status === 200) {
                    // get token and store it; if that goes well, resolve the promise, otherwise reject it
                    try {
                        that.token = xhr.getResponseHeader(that.tokenLocation.headerName);
                        if (that.token) {
                            result = progress.data.Session.SUCCESS;
                        } else {
                            result = progress.data.Session.AUTHENTICATION_FAILURE;
                            // " Unexpected error authenticating: No token returned from server"
                            errorObject = new Error(progress.data._getMsgText(
                                "jsdoMSG049",
                                "AuthenticationProvider",
                                progress.data._getMsgText("jsdoMSG050")
                            ));
                        }
                    } catch (e) {
                        result = progress.data.Session.AUTHENTICATION_FAILURE;
                           //  Unexpected error authenticating: {2} 
                        errorObject = new Error(progress.data._getMsgText(
                            "jsdoMSG049",
                            "AuthenticationProvider",
                            e.message
                        )
                            ); // incomprehensible indentation choice, but what jslint wants, jslint gets!
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
            
            if (this.token) {
                // "authenticate() failed because the AuthenticationProvider is already managing a 
                // successful authentication."
                throw new Error(progress.data._getMsgText("jsdoMSG051", "AuthenticationProvider"));
            }
            
            xhr = new XMLHttpRequest();
            
            openTokenRequest(xhr, this, options);
            
// DELETE THIS FOR REAL IMPLEMENTATION (ASSUMING THAT THE REAL IMPL DOESN'T REQUIRE 2 CALLS)
            xhr.onreadystatechange = function () {
            
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        xhr.open('GET', "http://localhost:8810/TS4/web/getcp", true);
                        xhr.setRequestHeader("Cache-Control", "no-cache");
                        xhr.setRequestHeader("Pragma", "no-cache");
                        xhr.withCredentials = true;
                        xhr.setRequestHeader("Accept", "application/json");
// END OF DELETION FOR REAL IMPLEMENTATION 
                        xhr.onreadystatechange = function () {
                            if (xhr.readyState === 4) {
                                // process the response from the Web application
                                processAuthResult(xhr, deferred);
                            }
                        };

// DELETE THIS SEND() FOR REAL IMPLEMENTATION
                        xhr.send();
                    }
                }

            };
            
            xhr.send("j_username=" + options.userName + "&j_password=" + options.password + "&submit=Submit");
            return deferred;
            
        };

    };
    
}());

