
/* 
progress.auth.js    Version: 4.3.0-1

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

    /*global progress : true*/
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
            defaultHeaderName = "X-OE-CLIENT-CONTEXT-ID";
        
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
 
        
        if (typeof options === "undefined") {
            throw new Error(progress.data._getMsgText("jsdoMSG038", "1"));
        }
        
        if (options.authenticationURI) {
            authenticationURI = options.authenticationURI;
        } else {
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
//        function onReadyStateChangeGeneric() {
//            var xhr = thatXHR,
//                result,
//                errorObject;
//    
//            if (xhr.readyState === 4) {
//                result = null;
//                errorObject = null;
//
//                // initial processing of the response from the Web application
//                if ((typeof xhr.onResponseFn) === 'function') {
//                    try {
//                        result = xhr.onResponseFn(xhr);
//                        // ( note that result will remain null if this is a logout() )
//                    } catch (e) {
//                        errorObject = e;
//                    }
//                }
//            }
//        }

        function processAuthResult(xhr) {

            if (xhr._deferred) {
                if (xhr.status === 200) {
                    xhr._deferred.resolve(
                        xhr._jsdosession,
                        progress.data.Session.AUTHENTICATION_SUCCESS,
                        {
                            "xhr": xhr
                        }
                    );
                } else {
                    xhr._deferred.reject(
                        xhr._jsdosession,
                        progress.data.Session.AUTHENTICATION_FAILURE,
                        {
                            xhr: xhr
                        }
                    );
                }
            } else {
                throw new Error("_deferred missing from xhr when processing authenticate");
            }
        }
        
        // METHODS
        this.authenticate = function (options) {
            var deferred = $.Deferred(),
                errorObject,
                xhr,
                auth,
                tok,
                hash;
            
            xhr = new XMLHttpRequest();
            xhr.ap = this;  // do we need this?
            
            xhr.open("GET", this.authenticationURI, true, options.userName, options.password);
            
//            auth = _make_basic_auth(userName, password);
            tok = options.userName + ':' + options.password;
            hash = btoa(tok);
            auth = "Basic " + hash;
            xhr.setRequestHeader('Authorization', auth);
            
            xhr.onreadystatechange = function () {
                var result,
                    errorObject;

                if (xhr.readyState === 4) {
                    result = null;
                    errorObject = null;

                    // initial processing of the response from the Web application
                    if ((typeof xhr.onResponseFn) === 'function') {
                        try {
                            result = xhr.onResponseFn(xhr);
                            // ( note that result will remain null if this is a logout() )
                        } catch (e) {
                            errorObject = e;
                        }
                    }
                }
            };
            
            xhr.onResponseFn = processAuthResult;
            xhr._deferred = deferred;
            xhr.send();
            return deferred;
            
        };

    
    };
    
    
}());

