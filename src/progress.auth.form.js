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
    
    progress.data.AuthenticationProviderForm = function (uri) {
        var that = this;
        
        // PRIVATE FUNCTIONS

        function openLoginRequest(xhr) {
            xhr.open('POST', that._loginURI, true);
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
                that._loggedIn = true;
                that._storeInfo();
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
            xhr.open('GET',  that._logoutURI, true);
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
        this._loginURIsegment = "/static/auth/j_spring_security_check";
        this._logoutURIsegment = "/static/auth/j_spring_security_logout";

        // process constructor arguments, etc.
        this._initialize(uri, progress.data.Session.AUTH_TYPE_FORM);
        
        

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

            xhr.send("j_username=" + userName + "&j_password=" + password +
                     "&submit=Submit");
            return deferred.promise();
        };
        
        this.logout = function () {
            var deferred = $.Deferred(),
                xhr;

            if (!this._loggedIn) {
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
            this._reset();
            return deferred.promise();
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

    // using dummy arguments for a temporary object just to set the prototype
    progress.data.AuthenticationProviderForm.prototype =
        new progress.data.AuthenticationProviderAnon(" ", progress.data.Session.AUTH_TYPE_FORM);
    progress.data.AuthenticationProviderForm.prototype.constructor =
        progress.data.AuthenticationProviderForm;
    
}());

