/* 
progress.auth.form.js    Version: 4.4.0-1

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
        
    progress.data.AuthenticationProviderForm = function (uriParam, authModelParam) {
        var uri,
            authenticationModel,
            that = this,
            storage,  // ref to what we use to store session state and token data (currently sessionStorage)
            storageKey,
            tempURI,
            loginURIsegment = "/static/auth/j_spring_security_check",
            loginURI,
            logoutURIsegment = "/static/auth/j_spring_security_logout",
            logoutURI,
            loggedIn = false,
            dataKeys = {
                uri: ".uri",
                loggedIn: ".loggedIn"
            };
        
        // PRIVATE FUNCTIONS

        // SSO specific, though possibly other models would need something for storing credentials
        // Store the given token with the uri as the key. setItem() throws
        // a "QuotaExceededError" error if there is insufficient storage space or 
        // "the user has disabled storage for the site" (Web storage spec at WHATWG)
        function storeInfo(info) {
            storage.setItem(dataKeys.uri, JSON.stringify(uri));
            storage.setItem(dataKeys.loggedIn, JSON.stringify(loggedIn));
        }

        // Get from storage one of the pieces of data related to this authentication provider.
        // Returns null if the item isn't in storage
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
        
        // implementation may be SSO specific, depends on the headers they need
        function openLoginRequest(xhr) {
            xhr.open('POST', loginURI, true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.setRequestHeader("Cache-Control", "max-age=0");
            xhr.setRequestHeader("Pragma", "no-cache");
            xhr.withCredentials = true;
            xhr.setRequestHeader("Accept", "application/json");
        }

        // implementation is SSO specific
        function processLoginResult(xhr, deferred) {
            var errorObject,
                result,
                ssoTokenJSON;

            if (xhr.status === 200) {
                // Need to set loggedIn now so we can call logout from here if there's an
                // error processing the response
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
                deferred.reject(
                    that,
                    result,
                    {
                        // currently, there will never be an Error object if login fails for Form
                        // errorObject : errorObject,
                        xhr: xhr
                    }
                );
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

            if (xhr.status === 200) {
                result = progress.data.Session.SUCCESS;
            } else if (xhr.status === 401) {
                // treat this as a success because the most likely cause is that the session expired
                // (Note that an 11.7 OE PAS Web application will return a 200 if we log out with
                // an expired JSESSIONID, so this code may not be executed anyway)
                result = progress.data.Session.SUCCESS;
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

        authenticationModel = progress.data.Session.AUTH_TYPE_FORM;
        
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
        
        this.logout = function () {
            var deferred = $.Deferred(),
                xhr;

            if (!loggedIn) {
                deferred.resolve(this, progress.data.Session.SUCCESS, {});
            } else {
                xhr = new XMLHttpRequest();
                openLogoutRequest(xhr);

                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        // process the response from the Web application
                        processLogoutResult(xhr, deferred);
                    }
                };

                xhr.send();
            }
            
            // Unconditionally reset --- even if the actual server request fails, we still want
            // to reset this AuthenticationProvider so it can try a login if desired.
            // We also reset even in the case where we're not logged in, just in case.
            // (In the future we can add a parameter that controls whether the reinit is unconditional,
            // if the developer wants to log out of the token server session but contnue to use the token)
            reset();
            return deferred.promise();
        };
        
        this.hasCredential = function () {
            return loggedIn;
        };

        this.openRequestAndAuthorize = function (xhr, verb, uri) {
            var tokenRequestDescriptor;

            if (this.hasCredential()) {
                xhr.open(verb, uri, true);  // always use async for SSO

                // We specify application/json for the response so that if there's an authentication error,
                // an OE Web application that's based on Form auth will directly send back a 401.
                // If we don't specify application/json, we'll get a redirect to login.jsp, which the
                // user agent handles by getting login.jsp and returning it to our code with a status
                // of 200. We could infer that authentication failed from that, but it's much cleaner this 
                // way.
                xhr.withCredentials = true;
                xhr.setRequestHeader("Accept", "application/json");
            } else {
                // This message is SSO specific, unless we can come up with a more general message 
                // JSDOSession: The AuthenticationProvider needs to be managing a valid token.
                throw new Error(progress.data._getMsgText("jsdoMSG125", "AuthenticationProvider"));
            }
            
        };
        
    };

    
}());

