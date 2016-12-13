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
    /*global $ : false, storage, XMLHttpRequest, msg*/

// ADD AN OPTIONS PARAM THAT CAN INCLUDE A NAME FOR PAGE REFRESH?    
    progress.data.AuthenticationProviderSSO = function (uri) {
        var that = this,
            fn,
            // SSO specific
            ssoTokenInfo = null,
            tokenDataKeys = {    // SSO specific 
                token: ".access_token",
                refreshToken: ".refresh_token",
                tokenType: ".token_type",
                expiration: ".expires_in"
            };
        
        // PRIVATE PROPERTIES

        
        // PRIVATE FUNCTIONS

        // Store the given token with the uri as the key. setItem() throws
        // a "QuotaExceededError" error if there is insufficient storage space or 
        // "the user has disabled storage for the site" (Web storage spec at WHATWG)
        function storeTokenInfo(info) {
            if (info.access_token.length) {
                that._storage.setItem(tokenDataKeys.token,  JSON.stringify(info.access_token));
            }
            if (info.refresh_token.length) {
                that._storage.setItem(tokenDataKeys.refreshToken,  JSON.stringify(info.refresh_token));
            } else {
                // if there is no refresh token, remove any existing one. This handles the case where
                // we got a new token via refresh, but now we're not being given any more refresh tokens
                that._storage.removeItem(tokenDataKeys.refreshToken);
            }
            that._storage.setItem(tokenDataKeys.tokenType,  JSON.stringify(info.token_type));
            that._storage.setItem(tokenDataKeys.expiration,  JSON.stringify(info.expires_in));
        }

        // get one of the pieces of data related to tokens from storage (could be the token itself, or
        // the refresh token, expiration info, etc.). Returns null if the item isn't in storage
        function retrieveTokenProperty(propName) {
            var jsonStr = that._storage.getItem(propName),
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

        // This is going to be hardcoded for now. This can very 
        // possibly change in the future if we decide to expose 
        // the token to the user.
        function getToken() {
            return retrieveToken();
        }

        function retrieveExpiration() {
            return retrieveTokenProperty(tokenDataKeys.expiration);
        }

        function clearTokenInfo(info) {
            that._storage.removeItem(tokenDataKeys.token);
            that._storage.removeItem(tokenDataKeys.refreshToken);
            that._storage.removeItem(tokenDataKeys.tokenType);
            that._storage.removeItem(tokenDataKeys.expiration);
        }
        
        // function is SSO specific
        function openRefreshRequest(xhr) {
            xhr.open('POST',  that._refreshURI, true);
            xhr.setRequestHeader("Cache-Control", "max-age=0");
            xhr.withCredentials = true;
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Accept", "application/json");
        }

        // function is SSO specific
        function processRefreshResult(xhr, deferred) {
            var errorObject,
                result,
                ssoTokenJSON;

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
                that._reset();  // treat authentication failure as the equivalent of a logout
                result = progress.data.Session.AUTHENTICATION_FAILURE;
            } else {
                result = progress.data.Session.GENERAL_FAILURE;
            }

            that._settlePromise(deferred, result, {"xhr": xhr,
                                                   "errorObject": errorObject});  // OK if undefined
        }


        
        this._processLoginResult = function (xhr, deferred) {
            var errorObject,
                result,
                ssoTokenJSON;

            if (xhr.status === 200) {
                // Need to set loggedIn now so we can call logout from here if there's an
                // error processing the response (e.g., authentication succeeded but we didn't get a
                // token for some reason)
                this._loggedIn = true;

                // get token and store it; if that goes well, resolve the promise, otherwise reject it
                try {
                    ssoTokenInfo = JSON.parse(xhr.responseText);
                    
                    if (ssoTokenInfo.access_token) {
                        storeTokenInfo(ssoTokenInfo);
                        // got the token info, its access_token has a value, and storeTokenInfo()
                        //  didn't throw an error, so call this a success
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
                        
                // log out if there was an error processing the response so the app can try to log in again
                if (result !== progress.data.Session.SUCCESS) {
                    // call logout, but ignore its outcome -- just tell caller that login failed
                    this.logout()
                        .always(function (authProv) {
                            authProv._settlePromise(deferred, result, {"xhr": xhr,
                                                                       "errorObject": errorObject});
                        });
                    return;   // so we don't execute the reject below, which could invoke the fail handler 
                              // before we're done with the logout
                }
                        
            } else if (xhr.status === 401) {
                result = progress.data.Session.AUTHENTICATION_FAILURE;
            } else {
                result = progress.data.Session.GENERAL_FAILURE;
            }

            this._settlePromise(deferred, result, {"xhr": xhr});
        };

        // NOTE: no definition of _openLoginRequest method; using the reference copied from
        //       the "base" object

        // NOTE: no definition of _openLogoutRequest method; using the reference copied from
        //       the "base" object

        // NOTE: no definition of _processLogoutResult method; using the reference copied from
        //       the "base" object

        
        fn = progress.data.AuthenticationProviderForm.prototype._reset; // temporary
        // put the internal state back to where it is when the constructor finishes running
        this._reset = function () {
            // this._reset._super.apply(this);
            this._reset._super.apply(this);
            clearTokenInfo();
            ssoTokenInfo = null;
        };
        // add a "_super" property to the new method that is a reference to the overridden
        // method, because we want to call the old one as part of teh implementation of the new
        this._reset._super = fn;


        // override the protoype's method but save it so we can call it from the body of the override
        fn = progress.data.AuthenticationProviderForm.prototype._openRequestAndAuthorize; // temporary
        this._openRequestAndAuthorize =
            function (xhr, verb, uri) {
            
                this._openRequestAndAuthorize._super.apply(
                    this,
                    [xhr, verb, uri]
                );
            
                xhr.setRequestHeader('Authorization', "oecp " + getToken());
            };
        this._openRequestAndAuthorize._super = fn;

        
        // API METHODS
        
        // NOTE: no definition of login method; using the reference copied from
        //       the "base" object because for an OE SSO server, the login model is Form (using a special URI)

        // NOTE: no definition of logout method; using the reference copied from
        //       the "base" object because for an OE SSO server, the login/logout model is Form
        
        
        // overriding the prototype's hasCredential method
        this.hasCredential = function () {
            return (retrieveToken() === null ? false : true);
        };
        
        this.refresh = function () {
            var deferred = $.Deferred(),
                xhr;

            if (!this._loggedIn) {
                // "The refresh method was not executed because the AuthenticationProvider is not logged in." 
                throw new Error(progress.data._getMsgText("jsdoMSG053", "AuthenticationProvider", "refresh"));
            }

            if (!this.hasRefreshToken()) {
                // "Token refresh was not executed because the AuthenticationProvider does not have a 
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

            xhr.send('{"token_type":"' + retrieveTokenType() + '","refresh_token":"' +
                      retrieveRefreshToken() + '"}');
            return deferred.promise();
        };
        

        this.hasRefreshToken = function () {
            return (retrieveRefreshToken() === null ? false : true);
        };


        // PROCESS CONSTRUCTOR ARGUMENTS, CREATE API PROPERTIES, ETC.
        this._initialize(uri, progress.data.Session.AUTH_TYPE_SSO,
                                 {"_loginURI": "/static/auth/j_spring_security_check?OECP=yes",
                                  "_logoutURI": "/static/auth/j_spring_security_logout",
                                  "_refreshURI": "/static/auth/token?op=refresh"
                                 });
        

        // We're currently storing the token in storage with the 
        // uri as the key. This is subject to change later.
        tokenDataKeys.token = this._storageKey + tokenDataKeys.token;
        tokenDataKeys.refreshToken = this._storageKey + tokenDataKeys.refreshToken;
        tokenDataKeys.tokenType = this._storageKey + tokenDataKeys.tokenType;
        tokenDataKeys.expiration = this._storageKey + tokenDataKeys.expiration;

        // NOTE: we rely on the prototype's logic to set this._loggedIn. An alternative could be to 
        // use the presence of a token to determine that, but it's conceivable that we could be
        // logged in but for some reason not have a token (e.g., a token expired, or we logged in
        // but the authentication server did not return a token)
        if (retrieveToken()) {
            this._loggedIn = true;
        }
      // END OF CONSTRUCTOR PROCESSING
        
    };

    
    var fn;
    // COPY METHODS TO OUR PROTOTYPE FROM THE PROTOTYPE OF A "BASE OBJECT" 
    for (fn in progress.data.AuthenticationProviderForm.prototype) {
        if (progress.data.AuthenticationProviderForm.prototype.hasOwnProperty(fn)) {
            progress.data.AuthenticationProviderSSO.prototype[fn] =
                progress.data.AuthenticationProviderForm.prototype[fn];
        }
    }

  
}());

