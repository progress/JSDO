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
    /*global $ : false, storage, XMLHttpRequest*/

    /* define these if not defined yet - they may already be defined if
       progress.js was included first */
    if (typeof progress === "undefined") {
        progress = {};
    }
    if (typeof progress.data === "undefined") {
        progress.data = {};
    }
    
// REVIEW: PAGE REFRESH SUPPORT NEEDED
// ADD AN OPTIONS PARAM THAT CAN INCLUDE A NAME FOR PAGE REFRESH?    
    progress.data.AuthenticationProvider = function (uriParam, authModelParam) {
        var uri,
            authenticationModel,
            that = this,
            storage,  // ref to what what we use to store session state and token data (currently sessionStorage)
            storageKey,
            tokenDataKeys = {
                token: ".access_token",
                refreshToken: ".refresh_token",
                tokenType: ".token_type",
                expiration: ".expires_in"
            },
            tempURI,
            loginURIsegment = "/static/auth/j_spring_security_check?OECP=yes",
            loginURI,
            refreshURIsegment = "/static/auth/token?op=refresh",
            refreshURI,
            logoutURIsegment = "/static/auth/j_spring_security_logout",
            logoutURI,
            ssoTokenInfo = null;
        
        // PRIVATE FUNCTIONS

        // Store the given token with the uri as the key. setItem() throws
        // a "QuotaExceededError" error if there is insufficient storage space or 
        // "the user has disabled storage for the site" (Web storage spec at WHATWG)
        function storeTokenInfo(info) {
            if (info.access_token.length) {
                storage.setItem(tokenDataKeys.token,  JSON.stringify(info.access_token));
            }
            if (info.refresh_token.length) {
                storage.setItem(tokenDataKeys.refreshToken,  JSON.stringify(info.refresh_token));
            } else {
                // if there is no refresh token, remove any existing one. This handles the case where
                // we got a new token via refresh, but now we're not being given another refersh token
                storage.removeItem(tokenDataKeys.refreshToken);
            }
            storage.setItem(tokenDataKeys.tokenType,  JSON.stringify(info.token_type));
            storage.setItem(tokenDataKeys.expiration,  JSON.stringify(info.expires_in));
        }

        // get one of the pieces of data related to tokens from storage (could be the token itself, or
        // the refresh token, expiration info, etc.). Returns null if the item isn't in storage
        function retrieveTokenProperty(propName) {
            var jsonStr = storage.getItem(propName),
                value = null;
                
            if (jsonStr !== null) {
                try {
                    value = JSON.parse(jsonStr);
                } catch (e) {
                    value = null;
                }
            }
            return value;
        }

        function retrieveToken() {
            return retrieveTokenProperty(tokenDataKeys.token);
        }

        function retrieveRefreshToken() {
            return retrieveTokenProperty(tokenDataKeys.refreshToken);
        }
        

        function retrieveTokenType() {
            return retrieveTokenProperty(tokenDataKeys.tokenType);
        }

        function retrieveExpiration() {
            return retrieveTokenProperty(tokenDataKeys.expiration);
        }

        function clearTokenInfo(info) {
            storage.removeItem(tokenDataKeys.token);
            storage.removeItem(tokenDataKeys.refreshToken);
            storage.removeItem(tokenDataKeys.tokenType);
            storage.removeItem(tokenDataKeys.expiration);
        }

        // put the internal state back to where it is when the coinstructor finishes running
        function reinitialize() {
            if (authenticationModel === progress.data.Session.AUTH_TYPE_SSO) {
                clearTokenInfo();
                ssoTokenInfo = null;
            }
        }
        
        function openLoginRequest(xhr) {
            xhr.open('POST',  loginURI, true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.setRequestHeader("Cache-Control", "max-age=0");
            xhr.withCredentials = true;
            xhr.setRequestHeader("Accept", "application/json");
        }

        function processLoginResult(xhr, deferred) {
            var errorObject,
                result,
                ssoTokenJSON;

            if (deferred) {
                if (xhr.status === 200) {
                    // get token and store it; if that goes well, resolve the promise, otherwise reject it
                    try {
                        ssoTokenInfo = JSON.parse(xhr.responseText);
                        
                        if (ssoTokenInfo.access_token) {
                            storeTokenInfo(ssoTokenInfo);
                            // got the token info, its access_token has a value, and storeTokenInfo()
                            //  didn't thrown an error, so call this a success
                            result = progress.data.Session.SUCCESS;
                        } else {
                            result = progress.data.Session.GENERAL_FAILURE;
                            // {1}: Unexpected error calling login: {error-string}
                            // ( No token returned from server)
                            errorObject = new Error(progress.data._getMsgText(
                                "jsdoMSG049",
                                "AuthenticationProvider",
                                "login",
                                progress.data._getMsgText("jsdoMSG050")
                            ));
                        }
                    } catch (ex) {
                        result = progress.data.Session.GENERAL_FAILURE;
                        // {1}: Unexpected error calling login: {error-string}
                        // (error could be thrown from storeTokenInfo when it calls setItem())
                        errorObject = new Error(progress.data._getMsgText(
                            "jsdoMSG049",
                            "AuthenticationProvider",
                            "login",
                            ex.message
                        ));
                    }
                            
                // REVIEW: NEED TO LOG OUT HERE IF THERE WAS AN ERROR PROCESSING THE RESPONSE
                            
                            
                } else if (xhr.status === 401) {
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
                // "Internal error: AuthenticationProvider: deferred object missing when processing login result"
                throw new Error(msg.getMsgText("jsdoMSG000", 
                    "AuthenticationProvider: deferred object missing when processing login result"));
            }
        }

        function openRefreshRequest(xhr) {
            xhr.open('POST',  refreshURI, true);
            xhr.setRequestHeader("Cache-Control", "max-age=0");
            xhr.withCredentials = true;
            xhr.setRequestHeader("Accept", "application/json");
        }

        function processRefreshResult(xhr, deferred) {
            var errorObject,
                result,
                ssoTokenJSON;

            if (deferred) {
                if (xhr.status === 200) {
                    // get token and store it; if that goes well, resolve the promise, otherwise reject it
                    try {
                        ssoTokenInfo = JSON.parse(xhr.responseText);
                        
                        if (ssoTokenInfo.access_token) {
                            storeTokenInfo(ssoTokenInfo);
                            // got the token info, its access_token has a value, and storeTokenInfo()
                            //  didn't thrown an error, so call this a success
                            result = progress.data.Session.SUCCESS;
                        } else {
                            result = progress.data.Session.GENERAL_FAILURE;
                            // {1}: Unexpected error calling refresh: {error-string}
                            // ( No token returned from server)
                            errorObject = new Error(progress.data._getMsgText(
                                "jsdoMSG049",
                                "AuthenticationProvider",
                                "refresh",
                                progress.data._getMsgText("jsdoMSG050")
                            ));
                        }
                    } catch (ex) {
                        result = progress.data.Session.GENERAL_FAILURE;
                        // {1}: Unexpected error calling refresh: {error-string}
                        // (error could be thrown from storeTokenInfo when it calls setItem())
                        errorObject = new Error(progress.data._getMsgText(
                            "jsdoMSG049",
                            "AuthenticationProvider",
                            "refresh",
                            ex.message
                        ));
                    }
                } else if (xhr.status === 401) {
                    reinitialize();  // treat authentictaion failure as the equivalent of a logout
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
                // "Internal error: AuthenticationProvider: deferred object missing when processing login result"
                throw new Error(msg.getMsgText("jsdoMSG000", 
                    "AuthenticationProvider: deferred object missing when processing refresh result"));
            }
        }

        function openLogoutRequest(xhr) {
            xhr.open('GET',  logoutURI, true);
            xhr.setRequestHeader("Cache-Control", "max-age=0");
            xhr.withCredentials = true;
            xhr.setRequestHeader("Accept", "application/json");
        }

        function processLogoutResult(xhr, deferred) {
            var result;

            if (deferred) {
                if (xhr.status === 200) {
                    result = progress.data.Session.SUCCESS;
                } else if (xhr.status === 401) {
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
                            xhr: xhr
                        }
                    );
                }
            } else {
                // "Internal error: AuthenticationProvider: deferred object missing when processing login result"
                throw new Error(msg.getMsgText("jsdoMSG000", 
                    "AuthenticationProvider: deferred object missing when processing logout result"));
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

            
        // process the constructor arguments
        if (typeof uriParam !== "string") {
            // {1}: Argument {2} must be of type {3} in {4} call.
            throw new Error(progress.data._getMsgText("jsdoMSG121", "AuthenticationProvider", "1",
                                           "string", "constructor"));
        } else if (uriParam.length === 0) {
            // "AuthenticationProvider: '' is an invalid value for the uri 
            //     parameter in constructor call."
            throw new Error(progress.data._getMsgText(
                "jsdoMSG504",
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

            uri = uriParam;
            loginURI = tempURI + loginURIsegment;
            refreshURI = tempURI + refreshURIsegment;
            logoutURI = tempURI + logoutURIsegment;
        }
        
        if (typeof authModelParam !== "string") {
            // {1}: Argument {2} must be of type {3} in {4} call.
            throw new Error(progress.data._getMsgText("jsdoMSG121", "AuthenticationProvider", "2",
                                           "string", "constructor"));
        } else {
            authModelParam = authModelParam.toLowerCase();
            switch (authModelParam) {
                // case progress.data.Session.AUTH_TYPE_FORM :
                // case progress.data.Session.AUTH_TYPE_BASIC :
                // case progress.data.Session.AUTH_TYPE_ANON :
                case progress.data.Session.AUTH_TYPE_SSO :
                    authenticationModel = authModelParam;
                    // for page refresh -- storeSessionInfo("authenticationModel", authenticationModel);

                    break;
                default:
                    // "AuthenticationProvider: '{2} is an invalid value for the AuthenticationModel 
                    //     parameter in constructor call."
                    throw new Error(progress.data._getMsgText(
                        "jsdoMSG504",
                        "AuthenticationProvider",
                        authModelParam,
                        "authenticationModel",
                        "constructor"
                ));
            }
        }
        
    // SSO specific    
        if (typeof sessionStorage === "undefined") {
            // "AuthenticationProvider: No support for sessionStorage."
            throw new Error(progress.data._getMsgText("jsdoMSG126", "AuthenticationProvider", "sessionStorage"));
        }
        // if you switch to a different type of storage, change the error message argument above
        storage = sessionStorage;  

        // We're currently storing the token in storage with the 
        // uri as the key. This is subject to change later.
        storageKey = uri;  // or name
        tokenDataKeys.token = storageKey + tokenDataKeys.token;
        tokenDataKeys.refreshToken = storageKey + tokenDataKeys.refreshToken;
        tokenDataKeys.tokenType = storageKey + tokenDataKeys.tokenType;
        tokenDataKeys.expiration = storageKey + tokenDataKeys.expiration;

      // end of constructor processing except for definition of functions and methods
        
        

        // METHODS
        
        this.login = function (userName, password) {
            var deferred = $.Deferred(),
                xhr;

            if (userName && typeof userName !== "string") {
                // {1}: Argument {2} must be of type {3} in {4} call.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG121", 
                    "AuthenticationProvider", 
                    "1",
                    "string", 
                    "login"));
            } else if (userName.length === 0) {
                //    {1}: '{2}' cannot be an empty string.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG501",
                    "AuthenticationProvider",
                    "userName"
                ));
            }
            
            if (password && typeof password !== "string") {
                // {1}: Argument {2} must be of type {3} in {4} call.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG121", 
                    "AuthenticationProvider", 
                    "2",
                    "string", 
                    "login"));
            } else if (password.length === 0) {
               // {1}: '{2}' cannot be an empty string.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG501",
                    "AuthenticationProvider",
                    "password"
                ));
            }
            
            if (this.hasCredential()) {
                // "login() was not attempted because the AuthenticationProvider is already logged in." 
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

            xhr.send("j_username=" + userName + "&j_password=" + password +
                     "&submit=Submit");
            return deferred.promise();
        };
        
        this.refresh = function () {
            var deferred = $.Deferred(),
                xhr;

            if (this.authenticationModel !== progress.data.Session.AUTH_TYPE_SSO) {
                // "{1}: Token refresh() was not attempted because the authentication model is not SSO." 
                throw new Error(progress.data._getMsgText("jsdoMSG055", "AuthenticationProvider"));
            }
            
            if (!this.hasCredential()) {
                // "refresh() was not attempted because the AuthenticationProvider is not logged in." 
                throw new Error(progress.data._getMsgText("jsdoMSG053", "AuthenticationProvider", "refresh"));
            }
            
            if (!this.hasRefreshToken()) {
                // "Token refresh was not attempted because the AuthenticationProvider does not have a 
                // refresh token." 
                throw new Error(progress.data._getMsgText("jsdoMSG054", "AuthenticationProvider"));
            }
            
            xhr = new XMLHttpRequest();
            openRefreshRequest(xhr);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    // process the response from the Web application
                    processRefreshResult(xhr, deferred);
                }
            };

            xhr.send('{"token_type" : "' + retrieveTokenType() + '", "refresh_token" : "' +
                      retrieveRefreshToken() + '" }');
            return deferred.promise();
        };
        
        this.logout = function () {
            var deferred = $.Deferred(),
                xhr;

            if (!this.hasCredential()) {
                // "logout() was not attempted because the AuthenticationProvider is not logged in."
                throw new Error(progress.data._getMsgText("jsdoMSG053", "AuthenticationProvider", "logout"));
            }
            
            // Unconditionally reinitialize. If the server request fails, that doesn't matter
            // (In the future we can add a parameter that controls whether the reinit is unconditional)
            reinitialize();
            
            xhr = new XMLHttpRequest();
            openLogoutRequest(xhr);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    // process the response from the Web application
                    processLogoutResult(xhr, deferred);
                }
            };

            xhr.send();
            return deferred.promise();
        };
        
        this.hasCredential = function () {
            return (retrieveToken() === null ? false : true);
        };

        this.hasRefreshToken = function () {
            return (retrieveRefreshToken() === null ? false : true);
        };

        // This is going to be hardcoded for now. This can very 
        // possibly change in the future if we decide to expose 
        // the token to the user.
        this._getToken = function () {
            return retrieveToken();
        };
    };


    progress.data.AuthenticationConsumer = function (options) {
        var tokenRequestDescriptor;

        tokenRequestDescriptor = {
            type : "header",
            headerName : "Authorization"
        };
    
        // Create a function where we add the token to the header
        this.addTokenToRequest = function (xhr, token) {
            xhr.setRequestHeader(
                tokenRequestDescriptor.headerName,
                "oecp " + token
            );
        };

    };
    
}());

