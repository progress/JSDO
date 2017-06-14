/* 
progress.auth.form.js    Version: 4.4.0-3

Copyright (c) 2016-2017 Progress Software Corporation and/or its subsidiaries or affiliates.
 
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
    /*global $ : false, XMLHttpRequest*/

    var fn;
    
    progress.data.AuthenticationProviderForm = function (uri) {
        
        // PROCESS CONSTRUCTOR ARGUMENTS, CREATE API PROPERTIES, ETC.
        this._initialize(uri, progress.data.Session.AUTH_TYPE_FORM,
                         {"_loginURI": progress.data.AuthenticationProvider._springLoginURIBase,
                          "_logoutURI": progress.data.AuthenticationProvider._springLogoutURIBase
                         });
    };
    
    // Start by giving this constructor the prototype from the "base" AuthenticationProvider
    // Do this indirectly by way of an intermediate object so changes to the prototype ("method overrides")
    // don't affect other types of AuthenticationProviders that use the prototype)
    function FormProxy() {}
    FormProxy.prototype = progress.data.AuthenticationProvider.prototype;
    progress.data.AuthenticationProviderForm.prototype =
        new FormProxy();
        
    // Reset the prototype's constructor property so it points to AuthenticationProviderForm rather than
    // the one that it just inherited (this is pretty much irrelevant though - the correct constructor
    // will get called regardless)
    progress.data.AuthenticationProviderForm.prototype.constructor =
        progress.data.AuthenticationProviderForm;

        
    // OVERRIDE THE "BASE" AuthenticationProvider PROTOYPE METHODS WHERE NECESSARY
    
    // All of the methods defined here as part of the AuthenticationProviderForm prototype (instead 
    // of in the AuthenticationProviderForm constructor) can be inherited by the AuthenticationProviderSSO
    // prototype without incurring the overhead of creating a full-blown instance of 
    // AuthenticationProviderForm to serve as the prototype for the SSO constructor.
    // Note: if it turns out that any of the methods defined this way need access to internal variables
    // of an AuthenticationProviderForm object, they'll need to be moved out of here.
    
    // NOTE: There are no overrides of the following methods (either here or in the constructor).
    //       This object uses these methods from the original prototype(i.e., the implementations from the
    //       AuthenticationProvider object):
    //          _reset  (general-purpose helper)
    //          hasClientCredentials  (API method)
    //          _processLoginResult (API helper method)

    
    // login API METHOD AND "HELPERS"
    progress.data.AuthenticationProviderForm.prototype.login = function (userNameParam, passwordParam) {
        var deferred = $.Deferred(),
            xhr,
            that = this;

        // these throw if the check fails (may want to do something more elegant)
        this._checkStringArg("login", userNameParam, 1, "userName");
        this._checkStringArg("login", passwordParam, 2, "password");

        return this._loginProto("j_username=" + encodeURIComponent(userNameParam) +
                                "&j_password=" + encodeURIComponent(passwordParam) + "&submit=Submit");
    };
    
    // login helper
    // Override the protoype's method (this method does not invoke the prototype's copy)
    // By defining this here, we can have the SSO AuthenticationProvider use it without
    // incurring the overhead of creating a Form instance as the prototype for the SSO constructor
    progress.data.AuthenticationProviderForm.prototype._openLoginRequest = function (xhr, uri) {

        xhr.open('POST', uri, true);

        xhr.setRequestHeader("Cache-Control", "max-age=0");
        xhr.setRequestHeader("Pragma", "no-cache");
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        xhr.withCredentials = true;

    };

    // logout API METHOD AND "HELPERS"
    // Override the prototype method and do not call it because the Anonymous AuthenticationProvider
    // doesn't make a server call for logout
    // (But this method does do what the SSO AuthenticationProvider needs, so keep it on
    // the Form prototype if possible)
    progress.data.AuthenticationProviderForm.prototype.logout = function () {
        var deferred = $.Deferred(),
            xhr,
            that = this;

        if (!this._loggedIn) {
            // logout is regarded as a success if the AuthenticationProvider isn't logged in
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
    
    // logout helper (there is no version defined in the original protoype)
    progress.data.AuthenticationProviderForm.prototype._openLogoutRequest = function (xhr) {
        xhr.open('GET',  this._logoutURI, true);
        xhr.setRequestHeader("Cache-Control", "max-age=0");
        xhr.withCredentials = true;
        xhr.setRequestHeader("Accept", "application/json");
    };
    
    // logout helper (there is no version defined in the original protoype)
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

    // GENERAL PURPOSE METHOD FOR OPENING REQUESTS (MAINLY FOR JSDO CALLS)
    // Override the protoype's method but call it from within the override
    // Since the override is being put into the constructor's prototype, and
    // since it calls the overridden method which had originally been in the prototype,
    // we add a "_super" property to the overriding method so it can still access the original method
    // (We could just call that method directly in here like this:
    //         progress.data.AuthenticationProviderProto.prototype._openRequestAndAuthorize
    // but if we ever change the place where we get the initial protoype for 
    // AuthenticationProviderForm from, we would need to remember to change that here.
    // The use of the _super property will handle that automatically, plus it was more fun
    // to do it this way)
    // TODO: This method uses a callback, primarily to avoid breaking tdriver tests. We should change 
    // it to use promises
    fn = progress.data.AuthenticationProviderForm.prototype._openRequestAndAuthorize;
    progress.data.AuthenticationProviderForm.prototype._openRequestAndAuthorize =
        function (xhr, verb, uri, async, callback) {

            function afterSuper(errorObject) {
                xhr.withCredentials = true;
                callback(errorObject);
            }
            
            try {
                progress.data.AuthenticationProviderForm.prototype._openRequestAndAuthorize._super.apply(
                    this,
                    [xhr, verb, uri, async, afterSuper]
                );
            } catch (e) {
                callback(e);
            }
        };
    progress.data.AuthenticationProviderForm.prototype._openRequestAndAuthorize._super = fn;


}());
