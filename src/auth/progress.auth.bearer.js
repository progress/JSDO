/* 
progress.auth.Bearer.js    Version: 4.4.0-3

Copyright (c) 2017-2018 Progress Software Corporation and/or its subsidiaries or affiliates.
 
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
    /*global storage, XMLHttpRequest, msg, btoa*/

    progress.data.AuthenticationProviderBearer = function (uri) {
        var bearerToken = null,
            fn;

        // process constructor arguments, etc.
        this._initialize(uri, progress.data.Session.AUTH_TYPE_BEARER,
            {"_loginURI": progress.data.AuthenticationProvider._homeLoginURIBase});

        // PRIVATE FUNCTIONS

        function make_Bearer_auth_header(token) {
            return "Bearer " + token;
        }

        // "INTERNAL" METHODS
        // Override the protoype's method but call it from within the override
        // (Define the override here in the constructor so it has access to instance variables)
        this._reset = function () {
            bearerToken = null;
            progress.data.AuthenticationProviderBearer.prototype._reset.apply(this);
        };

        // Override the protoype's method (this method does not invoke the prototype's copy)
        // (Define the override here in the constructor so it has access to instance variables)
        this._openLoginRequest = function (xhr, uri) {
            var auth;
            
            xhr.open("GET", uri, true);  // but see comments below inside the "if bearerToken"
            // may have to go with that approach
            
            if (bearerToken) {
                
                // set Authorization header
                auth = make_Bearer_auth_header(bearerToken);
                xhr.setRequestHeader('Authorization', auth);
            }

            progress.data.Session._setNoCacheHeaders(xhr);
        };

        // Override the protoype's method but call it from within the override
        // (Define the override here in the constructor so it has access to instance variables)
        this._processLoginResult = function _Bearer_processLoginResult(xhr, deferred) {
            progress.data.AuthenticationProviderBearer.prototype._processLoginResult.apply(
                this,
                [xhr, deferred]
            );
            if (!this._loggedIn) {
                // login failed, clear the credentials
                bearerToken = null;
            }
        };
        
        // Override the protoype's method (this method does not invoke the prototype's copy, but
        // calls a prototype general-purpose login method)
        // (Define the override here in the constructor so it has access to instance variables)
        this.login = function (token) {
            // these throw if the check fails (may want to do something more elegant)
            this._checkStringArg("login", token, 1, "token");

            bearerToken = token;
            return this._loginProto();
        };
        
        // Override the protoype's method (this method does not invoke the prototype's copy)
        // (Define the override here in the constructor so it has access to instance variables)
        // TODO: This method uses a callback, primarily to avoid breaking tdriver tests. We should change 
        // it to use promises
        this._openRequestAndAuthorize = function (xhr, verb, uri, async, callback) {
            var auth,
                errorObject;

            if (this.hasClientCredentials()) {

                xhr.open(verb, uri, async);  // but see comments below inside the "if bearerToken"
                // may have to go with that approach

                if (bearerToken) {

                    // set Authorization header
                    auth = make_Bearer_auth_header(bearerToken);
                    xhr.setRequestHeader('Authorization', auth);
                }

                progress.data.Session._setNoCacheHeaders(xhr);
            } else {
                // AuthenticationProvider: The AuthenticationProvider is not managing valid credentials.
                errorObject = new Error(progress.data._getMsgText("jsdoMSG125", "AuthenticationProvider"));
            }

            callback(errorObject);
        };
    };

    
    // Give this constructor the prototype from the "base" AuthenticationProvider
    // Do this indirectly by way of an intermediate object so changes to the prototype ("method overrides")
    // don't affect other types of AuthenticationProviders that use the prototype)
    function BearerProxy() {}
    BearerProxy.prototype = progress.data.AuthenticationProvider.prototype;
    progress.data.AuthenticationProviderBearer.prototype = new BearerProxy();
        
    // Reset the prototype's constructor property so it points to AuthenticationProviderForm rather than
    // the one that it just inherited (this is pretty much irrelevant though - the correct constructor
    // will get called regardless)
    progress.data.AuthenticationProviderBearer.prototype.constructor =
        progress.data.AuthenticationProviderBearer;

        
    // OVERRIDE METHODS ON PROTOTYPE IF NECESSARY AND POSSIBLE
    // (SOME METHODS ARE OVERRIDDEN IN THE CONSTRUCTOR BECAUSE THEY NEED ACCESS TO INSTANCE VARIABLES)

    // NOTE: There are no overrides of the following methods (either here or in the constructor).
    //       This object uses these methods from the original prototype(i.e., the implementations from the
    //       AuthenticationProvider object):
    //          logout (API method)
    //          hasClientCredentials (API method)
        
}());
