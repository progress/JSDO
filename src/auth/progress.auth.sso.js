/* 
progress.auth.sso.js    Version: 4.4.0-1

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
    /*global $ : false */

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
        
        // PRIVATE FUNCTIONS
        // (The constructor uses local variables and functions mainly to try to protect the token
        // information as much as possible. A few could probably be defined as properties/methods, but
        // there's currently no need for that because the AuthenticationProvider API has no objects 
        // that inherit from AuthenticationProviderSSO.)
        
        // Store the given token with the uri as the key. setItem() throws
        // a "QuotaExceededError" error if there is insufficient storage space or 
        // "the user has disabled storage for the site" (Web storage spec at WHATWG)
        function storeTokenInfo(info) {
            if (info.access_token.length) {
                that._storage.setItem(tokenDataKeys.token, JSON.stringify(info.access_token));
            }
            if (info.refresh_token.length) {
                that._storage.setItem(tokenDataKeys.refreshToken, JSON.stringify(info.refresh_token));
            } else {
                // if there is no refresh token, remove any existing one. This handles the case where
                // we got a new token via refresh, but now we're not being given any more refresh tokens
                that._storage.removeItem(tokenDataKeys.refreshToken);
            }
            that._storage.setItem(tokenDataKeys.tokenType, JSON.stringify(info.token_type));
            that._storage.setItem(tokenDataKeys.expiration, JSON.stringify(info.expires_in));
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

        
        // Override the protoype's method but call it from within the override. (Define the override 
        // here in the constructor so it has access to the internal function and variable)
        this._reset = function () {
            progress.data.AuthenticationProviderSSO.prototype._reset.apply(this);
            clearTokenInfo();
            ssoTokenInfo = null;
        };


        // Override the protoype's method but call it from within the override. (Define the override 
        // here in the constructor so it has access to the internal function)
        this._openRequestAndAuthorize =
            function (xhr, verb, uri) {
            
                progress.data.AuthenticationProviderSSO.prototype._openRequestAndAuthorize.apply(
                    this,
                    [xhr, verb, uri]
                );
            
                xhr.setRequestHeader('Authorization', "oecp " + getToken());
            };

        
        // API METHODS
        
        // override the prototype's hasClientCredentials method
        this.hasClientCredentials = function () {
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
        this._initialize(uri,
                         progress.data.Session.AUTH_TYPE_FORM_SSO,
                         {"_loginURI": progress.data.AuthenticationProvider._springFormTokenLoginURIBase,
                          "_logoutURI": progress.data.AuthenticationProvider._springLogoutURIBase,
                          "_refreshURI": progress.data.AuthenticationProvider._springFormTokenRefreshURIBase
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
   // END OF AuthenticationProviderSSO CONSTRUCTOR

    
    // Define the prototype as an instance of an AuthenticationProviderForm object
    function SSOProxy() {}
    SSOProxy.prototype = progress.data.AuthenticationProviderForm.prototype;
    progress.data.AuthenticationProviderSSO.prototype =
        new SSOProxy();
        
    // But reset the constructor back to the SSO constructor (this is pretty much irrelevant,
    // though. The correct constructor would be called anyway. It's mainly for the sake of anyone 
    // wanting to see what the constructor of an object is (maybe a framework)
    progress.data.AuthenticationProviderSSO.prototype.constructor =
        progress.data.AuthenticationProviderSSO;

    // NOTE: There are no overrides of the following methods (either here or in the constructor).
    //       This object uses these methods from the original prototype(i.e., the implementations from the
    //       Auth...Form object) because for an OE SSO token server, the login/logout model is Form (the 
    //       only difference is the use of a special URI query string in the login (see the call to 
    //       initialize() in the SSO constructor (above)):
    //          login  (API method)
    //          _openLoginRequest  (API helper method)
    //          logout  (API method)
    //          _openLogoutRequest  (API helper method)
    //          _processLogoutResult  (API helper method)

    // NOTE: All overrides are implemented in the constructor (rather than adding them to the prototype)
    //       because they need access to variables and/or functions that are defined in the constructor 
    //       (in an attempt to protect the token info somewhat)
    
}());

