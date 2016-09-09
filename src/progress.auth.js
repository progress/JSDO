/* 
progress.auth.js    Version: 4.4.0-1

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
    
// ADD AN OPTIONS PARAM THAT CAN INCLUDE A NAME FOR PAGE REFRESH?    
    progress.data.AuthenticationProvider = function (uriParam, authModelParam) {
        var uri,
            authenticationModel,
            that = this,
            storageKey,
            tempURI,
            loginURIsegment = "/static/auth/j_spring_security_check?OECP=yes",
            loginURI,
            logoutURIsegment = "/static/auth/j_spring_security_logout",
            logoutURI,
            ssoTokenInfo;
        
        // PRIVATE FUNCTIONS

        function openTokenRequest(xhr) {
            xhr.open('POST',  loginURI, true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.setRequestHeader("Cache-Control", "max-age=0");
            xhr.withCredentials = true;
            xhr.setRequestHeader("Accept", "application/json");
        }

        // Store the given token with the uri as the key. setItem() throws
        // a "QuotaExceededError" error if there is insufficient storage space or 
        // "the user has disabled storage for the site" (Web storage spec at WHATWG)
        function storeToken(token) {
            sessionStorage.setItem(storageKey, token);
            sessionStorage.setItem(storageKey + "info", ssoTokenInfo);  // test
        }
        
        // get the token from storage. Returns null if this object hasn't stored one yet
        function retrieveToken() {
            return sessionStorage.getItem(storageKey);
        }

        function processAuthResult(xhr, deferred) {
            var errorObject,
                result,
                ssoTokenJSON,
                token;

            if (deferred) {
                if (xhr.status === 200) {
                    // get token and store it; if that goes well, resolve the promise, otherwise reject it
                    try {
                        ssoTokenInfo = JSON.parse(xhr.responseText);
                        token = ssoTokenInfo.access_token;
                        
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

        // PROPERTIES
        Object.defineProperty(this, 'uri',
            {
                get: function () {
                    return uri;
                },
                enumerable: true
            });
                
        Object.defineProperty(this, 'authenticationModel',
            {
                get: function () {
                    return authenticationModel;
                },
                enumerable: true
            });

        Object.defineProperty(this, 'hasValidAuthorizationCredential',
            {
                get: function () {
                  // REVIEW NOTE: should also check whether we have soemhow determined that this is an invalid token
                  // (not sure how often we would have a token that's invalid -- hopefully not often)
                    return (retrieveToken() === null ? false : true);
                },
                enumerable: true
            });

            // not spec'ed yet. Note that even though the name is generic, thsi applies only to SSO
        Object.defineProperty(this, 'hasValidRefreshCredential',
            {
                get: function () {
                    alert("hasRefreshToken is not implemented");
                    return false;
                },
                enumerable: true
            });
            
        // process constructor arguments
        if (typeof uriParam !== "string") {
            // {1}: Argument {2} must be of type {3} in {4} call.
            throw new Error(progress.data._getMsgText("jsdoMSG121", "AuthenticationProvider", "1",
                                           "string", "constructor"));
        } else if (uriParam.length === 0) {
            // {1}: '{2}' cannot be an empty string.
            throw new Error(progress.data._getMsgText(
                "jsdoMSG501",
                "AuthenticationProvider",
                "uri"
            ));
        } else {
            // get rid of trailing '/' because appending service url that starts with '/'
            // will cause request failures
            if (uriParam[uriParam.length - 1] === "/") {
                tempURI = uriParam.substring(0, uriParam.length - 1);
            } else {
                tempURI = uriParam;
            }

            uri = uriParam;
            loginURI = tempURI + loginURIsegment;
            logoutURI = tempURI + logoutURIsegment;
        }
        
        if (typeof authModelParam !== "string") {
            // {1}: Argument {2} must be of type {3} in {4} call.
            throw new Error(progress.data._getMsgText("jsdoMSG121", "AuthenticationProvider", "2",
                                           "string", "constructor"));
        } else if (authModelParam.length === 0) {
            // {1}: '{2}' cannot be an empty string.
            throw new Error(progress.data._getMsgText(
                "jsdoMSG501",
                "AuthenticationProvider",
                "authenticationModel"
            ));
        } else {
            switch (authModelParam) {
                // case progress.data.Session.AUTH_TYPE_FORM :
                // case progress.data.Session.AUTH_TYPE_BASIC :
                // case progress.data.Session.AUTH_TYPE_ANON :
                case "SSO":   // need to decide on this and make it into a constant
                    authenticationModel = authModelParam.toLowerCase();
                    // ??? storeSessionInfo("authenticationModel", authenticaionModel);

                    break;
                default:
// MAKE THIS INTO A JSDOMSG 
                    throw new Error("'" + authModelParam + "' is an invalid value for the authenticationModel parameter in the AuthenticationProvider constructor. '");
            }
        }
        
        // We're currently storing the token in sessionStorage with the 
        // uri as the key. This is subject to change later.
        storageKey = uri;  // or name

      // end of constructor processing except for definition of functions and methods
        
        

        // METHODS
        
        this.login = function (userName, password) {
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
            
            if (this.hasValidAuthorizationCredential) {
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
                     // "&submit=Submit" + "&OECP=1");
                     "&submit=Submit");
            return deferred.promise();
        };
        
        this.logout = function () {
            var deferred = $.Deferred();
            
            
            if (this.hasValidAuthorizationCredential) {
                sessionStorage.removeItem(storageKey);
                sessionStorage.removeItem(storageKey + "info");
            }
            
            // This will return the authenticationProvider that invoked this method
            // and the result, which will only be successful at the moment. We also
            // reserve the right to throw in a third object hash for extra information
            // in the nebulous future.
            deferred.resolve(this, progress.data.Session.SUCCESS);
            
            return deferred.promise();
        };
        
        // This is going to be harcoded for now. This can very 
        // possibly change in the future if we decide to expose 
        // the token to the user.
        this._getToken = function () {
            return retrieveToken();
        };
    };


// ELIMINATE OR UPDATE    
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
                    options.tokenRequestDescriptor.headerName = progress.data.Session.DEFAULT_TOKEN_HEADER_NAME;
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
                type : "header",
                headerName : "Authorization"
            };
        }
        
        if (typeof options.addTokenToRequest === "undefined") {
            // Create a default function where we add the token to the header
            if (tokenRequestDescriptor.type === progress.data.Session.HTTP_HEADER) {
                this.addTokenToRequest = function (xhr, token) {
                    xhr.setRequestHeader(
                        tokenRequestDescriptor.headerName,
                        "oecp " + token
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

