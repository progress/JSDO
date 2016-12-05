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
    
    progress.data.AuthenticationProviderBasic = function (uri) {
        var that = this,
            // Basic auth specific
            defaultiOSBasicAuthTimeout,
            userName = null,
            password = null;
            
        // PRIVATE FUNCTIONS
        
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
                uriForRequest = progress.data.Session._addTimeStampToURL(that._loginURI);
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

        }

        function processLoginResult(xhr, deferred) {
            var result;

            if (xhr.status === 200) {
                // Need to set loggedIn now so we can call logout from here if there's an
                // error processing the response (e.g., authentication succeeded but we didn't get a
                // token for some reason)
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
            
        
        // process constructor arguments, etc.
        this._initialize(uri, progress.data.Session.AUTH_TYPE_BASIC);
        

        // "INTERNAL" METHODS
        // put the internal state back to where it is when the constructor finishes running
        this._reset = function () {
            userName = null;
            password = null;
            this._clearInfo();
            this._loggedIn = false;
        };

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
        

        // NOTE: no logout, using the base class (Anonymous). If we decide we need to do
        this.logout = function () {
            var deferred = $.Deferred();
            
            this._reset();
            deferred.resolve(this, progress.data.Session.SUCCESS, {});
            return deferred.promise();
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

    // using dummy arguments for a temporary object just to set the prototype
    progress.data.AuthenticationProviderBasic.prototype =
        new progress.data.AuthenticationProviderAnon(" ", progress.data.Session.AUTH_TYPE_BASIC);
    progress.data.AuthenticationProviderBasic.prototype.constructor =
        progress.data.AuthenticationProviderBasic;

    
}());

