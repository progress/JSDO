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
        
        // PROCESS CONSTRUCTOR ARGUMENTS, CREATE API PROPERTIES, ETC.
        this._initialize(uri, progress.data.Session.AUTH_TYPE_FORM,
                                 {"_loginURI": "/static/auth/j_spring_security_check",
                                  "_logoutURI": "/static/auth/j_spring_security_logout"
                                 });

    };

    var fn;
    for (fn in progress.data.AuthenticationProvider.prototype) {
        if (progress.data.AuthenticationProvider.prototype.hasOwnProperty(fn)) {
            progress.data.AuthenticationProviderForm.prototype[fn] =
                progress.data.AuthenticationProvider.prototype[fn];
        }
    }
    
    // NOTE: no definition of _reset method; using the reference copied from
    //       the "base" object

    // We are probably never going to call the prototype's method from inside this class,
     // so we simply override and don't bother to keep a reference to the AuthenticationProvider
     // _openLoginRequest method
    progress.data.AuthenticationProviderForm.prototype._openLoginRequest = function (xhr) {
        var uriForRequest;

        if (progress.data.Session._useTimeStamp) {
            uriForRequest = progress.data.Session._addTimeStampToURL(this._loginURI);
        }

        xhr.open('POST', uriForRequest, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.setRequestHeader("Cache-Control", "max-age=0");
        xhr.setRequestHeader("Pragma", "no-cache");
        xhr.withCredentials = true;
        xhr.setRequestHeader("Accept", "application/json");
    };

    // NOTE: no definition of _processLoginResult method; using the reference copied from
    //       the "base" object

    progress.data.AuthenticationProviderForm.prototype._openLogoutRequest = function (xhr) {
        xhr.open('GET',  this._logoutURI, true);
        xhr.setRequestHeader("Cache-Control", "max-age=0");
        xhr.withCredentials = true;
        xhr.setRequestHeader("Accept", "application/json");
    };

    
    progress.data.AuthenticationProviderForm.prototype._processLogoutResult = function (xhr, deferred) {
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

        this._settlePromise(deferred, result, {"xhr": xhr});

    };

    // get a temp reference to the "base object" version of this method, define the version for this object,
    // then copy the saved reference to a _super property of the new method so teh new methiod can call the
    // base 
    fn = progress.data.AuthenticationProviderForm.prototype._openRequestAndAuthorize;
    progress.data.AuthenticationProviderForm.prototype._openRequestAndAuthorize = 
        function fubar(xhr, verb, uri) {

        // this._openRequestAndAuthorize._super.apply(this, [xhr, verb, uri]);
        progress.data.AuthenticationProviderForm.prototype._openRequestAndAuthorize._super.apply(
                                                                                        this,
                                                                                        [xhr, verb, uri]);
        xhr.withCredentials = true;
    
    };
    progress.data.AuthenticationProviderForm.prototype._openRequestAndAuthorize._super = fn;
    
    // API METHODS
    progress.data.AuthenticationProviderForm.prototype.login = function (userNameParam, passwordParam) {
        var deferred = $.Deferred(),
            xhr,
            that = this;

        // these throw if the check fails (may want to do something more elegant)
        this._checkStringArg("login", userNameParam, 1, "userName");
        this._checkStringArg("login", passwordParam, 2, "password");

        if (this._loggedIn) {
            // "The login method was not executed because the AuthenticationProvider is 
            // already logged in." 
            throw new Error(progress.data._getMsgText("jsdoMSG051", "AuthenticationProvider"));
        }

        xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                // process the response from the Web application
                that._processLoginResult(xhr, deferred);
            }
        };

        this._openLoginRequest(xhr);
        xhr.send("j_username=" + userNameParam + "&j_password=" + passwordParam + "&submit=Submit");
        return deferred.promise();
    };
    
    progress.data.AuthenticationProviderForm.prototype.logout = function () {
        var deferred = $.Deferred(),
            xhr,
            that = this;

        if (!this._loggedIn) {
            deferred.resolve(this, progress.data.Session.SUCCESS, {});
        } else {
            xhr = new XMLHttpRequest();
            this._openLogoutRequest(xhr);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    // process the response from the Web application
                    that._processLogoutResult(xhr, deferred);
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
    
}());

