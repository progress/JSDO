/* 
progress.auth.basic.js    Version: 4.4.0-1

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
        var //that = this,
            // Basic auth specific
            defaultiOSBasicAuthTimeout,
            userName = null,
            password = null,
            fn;

        // PRIVATE FUNCTIONS


        // from http://coderseye.com/2007/how-to-do-http-basic-auth-in-ajax.html
        function make_basic_auth(user, pw) {
            var tok = user + ':' + pw,
                hash = btoa(tok);
            return "Basic " + hash;
        }

            
        // "INTERNAL" METHODS
        // overriding the protoype's method but calling it as well
        fn = progress.data.AuthenticationProviderBasic.prototype._reset;
        this._reset = function () {
            userName = null;
            password = null;
            progress.data.AuthenticationProviderBasic.prototype._reset._super.apply(this);
        };
        progress.data.AuthenticationProviderBasic.prototype._reset._super = fn;


        this._openLoginRequest = function (xhr) {
            var auth,
                uriForRequest;
            
            if (progress.data.Session._useTimeStamp) {
                uriForRequest = progress.data.Session._addTimeStampToURL(this._loginURI);
            }

            xhr.open("GET", uriForRequest, true);  // but see comments below inside the "if userName"
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
                auth = make_basic_auth(userName, password);
                xhr.setRequestHeader('Authorization', auth);
            }
            // else {
                // xhr.open(verb, uri, async);
            // }
            
            xhr.setRequestHeader("Cache-Control", "no-cache");
            xhr.setRequestHeader("Pragma", "no-cache");
            
            
        //  ?? setRequestHeaderFromContextProps(this, xhr);

        };

        // overriding the protoype's method but calling it as well
        fn = progress.data.AuthenticationProviderBasic.prototype._processLoginResult;
        this._processLoginResult = function (xhr, deferred) {
            progress.data.AuthenticationProviderBasic.prototype._processLoginResult._super.apply(
                this,
                [xhr, deferred]
            );
            if (!this._loggedIn) {
                // login failed, clear the credentials
                userName = null;
                password = null;
            }
        };
        progress.data.AuthenticationProviderBasic.prototype._processLoginResult._super = fn;
        
        
        this._openRequestAndAuthorize = function (xhr, verb, uri) {
                var auth;

                if (this.hasCredential()) {

                    xhr.open(verb, uri, true);  // but see comments below inside the "if userName"
                                                      // may have to go with that approach

                    if (userName) {

                        // See the comment at the definition of the canPassCredentialsToOpen() function
                        // for why we pass credentials to open() in some cases but not others. (If we're 
                        // not using Basic auth, we never pass credentials)
                        // if (canPassCredentialsToOpen()) {
                            // xhr.open(verb, uri, async, userName, password);
                        // }
                        // else {
                            // xhr.open("GET", loginURI, true);
                        // }

                        // set Authorization header
                        auth = make_basic_auth(userName, password);
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

        
        // API METHODS

        // get a temp reference to the "base object" version of this method, define the version for
        // this object, then copy the saved reference to a _super property of the new method so
        // the new method can call the base 
        fn = progress.data.AuthenticationProviderBasic.prototype.login;
        this.login = function (userNameParam, passwordParam) {
            var deferred = $.Deferred(),
                xhr;

            // these throw if the check fails (may want to do something more elegant)
            this._checkStringArg("login", userNameParam, 1, "userName");
            this._checkStringArg("login", passwordParam, 2, "password");

            userName = userNameParam;
            password = passwordParam;

            return progress.data.AuthenticationProviderBasic.prototype.login._super.apply(this);
        };
        progress.data.AuthenticationProviderBasic.prototype.login._super = fn;
        

        // NOTE: no definition of logout method; using the reference copied from
        //       the "base" object

        // NOTE: no definition of hasCredential method; using the reference copied from
        //       the "base" object
        
    
        // process constructor arguments, etc.
        this._initialize(uri, progress.data.Session.AUTH_TYPE_BASIC,
                                 {"_loginURI": "/static/home.html"});
        
        
    };

    var fn;
    for (fn in progress.data.AuthenticationProvider.prototype) {
        if (progress.data.AuthenticationProvider.prototype.hasOwnProperty(fn)) {
            progress.data.AuthenticationProviderBasic.prototype[fn] =
                progress.data.AuthenticationProvider.prototype[fn];
        }
    }



}());
