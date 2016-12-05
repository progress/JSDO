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
            // SSO specific
            tempURI,
            ssoTokenInfo = null,
            tokenDataKeys = {    // SSO specific 
                token: ".access_token",
                refreshToken: ".refresh_token",
                tokenType: ".token_type",
                expiration: ".expires_in"
            };
        
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
        
        // put the internal state back to where it is when the constructor finishes running
        this._reset = function () {
            this._clearInfo();
            clearTokenInfo();
            ssoTokenInfo = null;
            this._loggedIn = false;
        };

        // implementation may be SSO specific, depends on the headers they need
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
                // error processing the response (e.g., authentication succeeded but we didn't get a
                // token for some reason)
                that._loggedIn = true;

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
                    that.logout()
                        .always(function () {
                            deferred.reject(
                                that,
                                result,
                                {
                                    errorObject : errorObject,
                                    xhr: xhr   // should be the xhr used for the login(), not the logout()
                                }
                            );
                        });
                    return;   // so we don't execute the reject below, which could invoke the fail handler 
                              // before we're done with the logout
                }
                        
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
                        errorObject : errorObject, // might be undefined, that's OK
                        xhr: xhr
                    }
                );
            }
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
                        errorObject : errorObject, // might be undefined, that's OK
                        xhr: xhr
                    }
                );
            }
        }

        // implementation may be SSO specific, but would at least apply to Form as well
        function openLogoutRequest(xhr) {
            xhr.open('GET', that._logoutURI, true);
            xhr.setRequestHeader("Cache-Control", "max-age=0");
            xhr.withCredentials = true;
            xhr.setRequestHeader("Accept", "application/json");
        }

        
        // implementation probably SSO specific (tho maybe not), but would at least apply to Form as well
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
        this._loginURIsegment = "/static/auth/j_spring_security_check?OECP=yes";
        this._logoutURIsegment = "/static/auth/j_spring_security_logout";
        this._refreshURIsegment = "/static/auth/token?op=refresh";
        this._refreshURI = null;

            
        // process constructor arguments, etc.
        this._initialize(uri, progress.data.Session.AUTH_TYPE_SSO);
        
        if (uri[uri.length - 1] === "/") {
            tempURI = uri.substring(0, uri.length - 1);
        } else {
            tempURI = uri;
        }

        this._refreshURI = tempURI + this._refreshURIsegment;

        // We're currently storing the token in storage with the 
        // uri as the key. This is subject to change later.
        tokenDataKeys.token = this._storageKey + tokenDataKeys.token;
        tokenDataKeys.refreshToken = this._storageKey + tokenDataKeys.refreshToken;
        tokenDataKeys.tokenType = this._storageKey + tokenDataKeys.tokenType;
        tokenDataKeys.expiration = this._storageKey + tokenDataKeys.expiration;

        if (retrieveToken()) {
            this._loggedIn = true;
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
        
        this.hasCredential = function () {
            return (retrieveToken() === null ? false : true);
        };

        this.hasRefreshToken = function () {
            return (retrieveRefreshToken() === null ? false : true);
        };

        this.openRequestAndAuthorize = function (xhr, verb, uri) {
            var tokenRequestDescriptor;

            tokenRequestDescriptor = {
                type : "header",
                headerName : "Authorization"
            };
        
            if (this.hasCredential()) {
                xhr.open(verb, uri, true);  // always use async for SSO

                xhr.setRequestHeader(
                    tokenRequestDescriptor.headerName,
                    "oecp " + getToken()
                );

                // We specify application/json for the response so that, if a bad token is sent, an 
                // OE Web application that's based on Form auth will directly send back a 401.
                // If we don't specify application/json, we'll get a redirect to login.jsp, which the
                // user agent handles by getting login.jsp and returning it to our code with a status
                // of 200. We could infer that authentication failed from that, but it's much cleaner this 
                // way.
                xhr.setRequestHeader("Accept", "application/json");
            } else {
                // This message is SSO specific, unless we can come up with a more general message 
                // JSDOSession: The AuthenticationProvider needs to be managing a valid token.
                throw new Error(progress.data._getMsgText("jsdoMSG125", "AuthenticationProvider"));
            }
            
        };
        
    };

    // using dummy arguments for a temporary object just to set the prototype
    progress.data.AuthenticationProviderSSO.prototype =
        new progress.data.AuthenticationProviderAnon(" ", progress.data.Session.AUTH_TYPE_FORM);
    progress.data.AuthenticationProviderSSO.prototype.constructor =
        progress.data.AuthenticationProviderSSO;
    
}());

