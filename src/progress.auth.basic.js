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
    /*global $ : false, storage, XMLHttpRequest, msg, btoa*/

    /* define these if not defined yet - they may already be defined if
       progress.js was included first */
    if (typeof progress === "undefined") {
        progress = {};
    }
    if (typeof progress.data === "undefined") {
        progress.data = {};
    }
        
    progress.data.AuthenticationProviderBasic = function (uriParam) {
        var uri,
            authenticationModel,
            that = this,
            storage,  // ref to what we use to store session state and token data (currently sessionStorage)
            storageKey,
            tempURI,
            loginURIsegment = "/static/home.html",
            loginURI,
            logoutURIsegment = "",
            logoutURI,
            loggedIn = false,
            dataKeys = {
                uri: ".uri",
                loggedIn: ".loggedIn"
            },
            
            // Basic auth specific
            defaultiOSBasicAuthTimeout,
            userName = null,
            password = null;
            
        // PRIVATE FUNCTIONS

        // SSO specific, though possibly other models would need something for storing credentials
        // Store the given token with the uri as the key. setItem() throws
        // a "QuotaExceededError" error if there is insufficient storage space or 
        // "the user has disabled storage for the site" (Web storage spec at WHATWG)
        function storeInfo(info) {
            storage.setItem(dataKeys.uri, JSON.stringify(uri));
            storage.setItem(dataKeys.loggedIn, JSON.stringify(loggedIn));
        }

        // probably SSO specific
        // get one of the pieces of data related to tokens from storage (could be the token itself, or
        // the refresh token, expiration info, etc.). Returns null if the item isn't in storage
        function retrieveInfoItem(propName) {
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

        function retrieveURI() {
            return retrieveInfoItem(dataKeys.uri);
        }

        function retrieveLoggedIn() {
            return retrieveInfoItem(dataKeys.loggedIn);
        }

        function clearInfo(info) {
            storage.removeItem(dataKeys.uri);
            storage.removeItem(dataKeys.loggedIn);
        }

        // put the internal state back to where it is when the constructor finishes running
        function reset() {
            clearInfo();
            loggedIn = false;
        }
        
        // from http://coderseye.com/2007/how-to-do-http-basic-auth-in-ajax.html
        function _make_basic_auth(user, pw) {
            var tok = user + ':' + pw,
                hash = btoa(tok);
            return "Basic " + hash;
        }

        function openLoginRequest(xhr, userNameParam, passwordParam) {
            var auth,
                uriForRequest;
            
            if (progress.data.Session._useTimeStamp) {
                uriForRequest = progress.data.Session._addTimeStampToURL(loginURI);
            }

            xhr.open("GET", uriForRequest, true);  // but see comments below inside the "if userName"
                                              // may have to go with that approach
            userName = userNameParam;
            password = passwordParam;
            
            if (userName) {

                // See the comment at the definition of the canPassCredentialsToOpen() function
                // for why we pass credentials to open() in some cases but not others. (If we're not using
                // Basic auth, we never pass credentials)
                // if (canPassCredentialsToOpen()) {
                    // xhr.open(verb, uri, async, userName, password);
                // }
                // else {
                    // xhr.open("GET", loginURI, true);
                // }
                
                // set Authorization header
                auth = _make_basic_auth(userName, password);
                xhr.setRequestHeader('Authorization', auth);
            }
            // else {
                // xhr.open(verb, uri, async);
            // }
            
            xhr.setRequestHeader("Cache-Control", "no-cache");
            xhr.setRequestHeader("Pragma", "no-cache");
            
            
            
        //  ?? setRequestHeaderFromContextProps(this, xhr);

            
            // from the SSO version
            // xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            // xhr.setRequestHeader("Cache-Control", "max-age=0");
            // xhr.setRequestHeader("Accept", "application/json");
            
            // for FORM
            // xhr.withCredentials = true;
            // xhr.setRequestHeader("Accept",
                    // "application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");

            
            
        }

        function processLoginResult(xhr, deferred) {
            var result;

            if (xhr.status === 200) {
                // Need to set loggedIn now so we can call logout from here if there's an
                // error processing the response (e.g., authentication succeeded but we didn't get a
                // token for some reason)
                loggedIn = true;
                storeInfo();
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
                userName = null;
                password = null;
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
                    return uri;
                },
                enumerable: true
            });
                
        Object.defineProperty(this, 'authenticationModel',
            {
                get: function () {
                    return progress.data.Session.AUTH_TYPE_BASIC;
                },
                enumerable: true
            });

            
        // process constructor arguments
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

            uri = uriParam; // keep the uri property the same as what was passed in
            loginURI = tempURI + loginURIsegment;
            logoutURI = tempURI + logoutURIsegment;
        }

        if (typeof sessionStorage === "undefined") {
            // "AuthenticationProvider: No support for sessionStorage."
            throw new Error(progress.data._getMsgText("jsdoMSG126",
                                                      "AuthenticationProvider",
                                                      "sessionStorage"));
        }
        // if you switch to a different type of storage, change the error message argument above
        storage = sessionStorage;

        // should come up with something more intelligent than this (maybe)
        storageKey = uri;  // or name
        dataKeys.uri = storageKey + dataKeys.uri;
        dataKeys.loggedIn = storageKey + dataKeys.loggedIn;

        if (retrieveLoggedIn()) {
            loggedIn = true;
        }
      // end of constructor processing except for definition of functions and methods
        
        

        // METHODS
        
        this.login = function (userName, password) {
            var deferred = $.Deferred(),
                xhr;

            if (userName && typeof userName !== "string") {
                // AuthenticationProvider: Argument 1 must be of type string in login call.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG121",
                    "AuthenticationProvider",
                    "1",
                    "string",
                    "login"
                ));
            } else if (userName.length === 0) {
                //  AuthenticationProvider: userName cannot be an empty string.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG501",
                    "AuthenticationProvider",
                    "userName"
                ));
            }
            
            if (password && typeof password !== "string") {
                // AuthenticationProvider: Argument 2 must be of type string in login call.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG121",
                    "AuthenticationProvider",
                    "2",
                    "string",
                    "login"
                ));
            } else if (password.length === 0) {
               // AuthenticationProvider: 'password' cannot be an empty string.
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG501",
                    "AuthenticationProvider",
                    "password"
                ));
            }

            if (loggedIn) {
                // "The login method was not executed because the AuthenticationProvider is 
                // already logged in." 
                throw new Error(progress.data._getMsgText("jsdoMSG051", "AuthenticationProvider"));
            }

            xhr = new XMLHttpRequest();
            openLoginRequest(xhr, userName, password);

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

            reset();
            deferred.resolve(that, progress.data.Session.SUCCESS, {});
            return deferred.promise();
        };
        
        this.hasCredential = function () {
            return loggedIn;
        };

        this.openRequestAndAuthorize = function (xhr, verb, uri) {
            var auth;
        
            if (this.hasCredential()) {
                
                xhr.open(verb, uri, true);  // but see comments below inside the "if userName"
                                                  // may have to go with that approach
                
                if (userName) {

                    // See the comment at the definition of the canPassCredentialsToOpen() function
                    // for why we pass credentials to open() in some cases but not others. (If we're not using
                    // Basic auth, we never pass credentials)
                    // if (canPassCredentialsToOpen()) {
                        // xhr.open(verb, uri, async, userName, password);
                    // }
                    // else {
                        // xhr.open("GET", loginURI, true);
                    // }
                    
                    // set Authorization header
                    auth = _make_basic_auth(userName, password);
                    xhr.setRequestHeader('Authorization', auth);
                }
                // else {
                    // xhr.open(verb, uri, async);
                // }
                
                xhr.setRequestHeader("Cache-Control", "no-cache");
                xhr.setRequestHeader("Pragma", "no-cache");
            //  ?? setRequestHeaderFromContextProps(this, xhr);
                
            } else {
                // This message is SSO specific, unless we can come up with a more general message 
                // JSDOSession: The AuthenticationProvider needs to be managing a valid token.
                throw new Error(progress.data._getMsgText("jsdoMSG125", "AuthenticationProvider"));
            }
            
        };

    };

}());

