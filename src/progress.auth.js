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

    /* define these if not defined yet - they may already be defined if
       progress.js was included first */
    if (typeof progress === "undefined") {
        progress = {};
    }
    if (typeof progress.data === "undefined") {
        progress.data = {};
    }
    
// ADD AN OPTIONS PARAM THAT CAN INCLUDE A NAME FOR PAGE REFRESH?    
    progress.data.AuthenticationProvider = function (uriParam, authModelParam) {
        var uri,
            authenticationModel,
            that = this,
            storage,  // ref to what we use to store session state and token data (currently sessionStorage)
            storageKey,
            tempURI,
            loginURIsegment = "/static/auth/j_spring_security_check?OECP=yes",
            loginURI,
            logoutURIsegment = "/static/auth/j_spring_security_logout",
            logoutURI,
            loggedIn = false,  // (use this flag because we can't assume that hasCredential() tells us
                               // whether we're logged in ---  for SSO, it's possible that the token server
                               // authentication succeeded but we didn't get back a token)
            // SSO specific
            ssoTokenInfo = null,
            tokenDataKeys = {    // SSO specific 
                token: ".access_token",
                refreshToken: ".refresh_token",
                tokenType: ".token_type",
                expiration: ".expires_in"
            },
            refreshURIsegment = "/static/auth/token?op=refresh",   // SSO specific
            refreshURI;              // SSO specific
        
        // PRIVATE FUNCTIONS

        // SSO specific, though possibly other models would need something for storing credentials
        // Store the given token with the uri as the key. setItem() throws
        // a "QuotaExceededError" error if there is insufficient storage space or 
        // "the user has disabled storage for the site" (Web storage spec at WHATWG)
        function storeTokenInfo(info) {
            if (info.access_token.length) {
                storage.setItem(tokenDataKeys.token,  JSON.stringify(info.access_token));
            }
            if (info.refresh_token.length) {
                storage.setItem(tokenDataKeys.refreshToken,  JSON.stringify(info.refresh_token));
            } else {
                // if there is no refresh token, remove any existing one. This handles the case where
                // we got a new token via refresh, but now we're not being given any more refresh tokens
                storage.removeItem(tokenDataKeys.refreshToken);
            }
            storage.setItem(tokenDataKeys.tokenType,  JSON.stringify(info.token_type));
            storage.setItem(tokenDataKeys.expiration,  JSON.stringify(info.expires_in));
        }

        // probably SSO specific
        // get one of the pieces of data related to tokens from storage (could be the token itself, or
        // the refresh token, expiration info, etc.). Returns null if the item isn't in storage
        function retrieveTokenProperty(propName) {
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

        // probably SSO specific
        function retrieveToken() {
            return retrieveTokenProperty(tokenDataKeys.token);
        }

        // SSO specific
        function retrieveRefreshToken() {
            return retrieveTokenProperty(tokenDataKeys.refreshToken);
        }
        

        // probably SSO specific
        function retrieveTokenType() {
            return retrieveTokenProperty(tokenDataKeys.tokenType);
        }

        // probably SSO specific
        function retrieveExpiration() {
            return retrieveTokenProperty(tokenDataKeys.expiration);
        }

        // probably SSO specific, but maybe could be named something like "clearCredentialStore"
        // and used for all models (no op for some)
        function clearTokenInfo(info) {
            storage.removeItem(tokenDataKeys.token);
            storage.removeItem(tokenDataKeys.refreshToken);
            storage.removeItem(tokenDataKeys.tokenType);
            storage.removeItem(tokenDataKeys.expiration);
        }

        // implementation is SSO specific
        // put the internal state back to where it is when the constructor finishes running
        function reset() {
            if (authenticationModel === progress.data.Session.AUTH_TYPE_SSO) {
                clearTokenInfo();
                ssoTokenInfo = null;
                loggedIn = false;
            }
        }
        
        // implementation may be SSO specific, depends on the headers they need
        function openLoginRequest(xhr) {
            xhr.open('POST', loginURI, true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.setRequestHeader("Cache-Control", "max-age=0");
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
                loggedIn = true;
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
            xhr.open('POST',  refreshURI, true);
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
                reset();  // treat authentication failure as the equivalent of a logout
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
            xhr.open('GET',  logoutURI, true);
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

            
        // process the constructor arguments
        if (typeof uriParam !== "string") {
            // AuthenticationProvider: Argument 1 must be of type string in constructor call.
            throw new Error(progress.data._getMsgText("jsdoMSG121", "AuthenticationProvider", "1",
                                           "string", "constructor"));
        } else if (uriParam.length === 0) {
            // AuthenticationProvider: '' is an invalid value for the uri parameter in constructor call.
            throw new Error(progress.data._getMsgText(
                "jsdoMSG504",
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

            uri = uriParam;
            loginURI = tempURI + loginURIsegment;
            refreshURI = tempURI + refreshURIsegment;
            logoutURI = tempURI + logoutURIsegment;
        }
        
        if (typeof authModelParam === "string") {
            authModelParam = authModelParam.toLowerCase();
            switch (authModelParam) {
            // case progress.data.Session.AUTH_TYPE_FORM :
            // case progress.data.Session.AUTH_TYPE_BASIC :
            // case progress.data.Session.AUTH_TYPE_ANON :
            case progress.data.Session.AUTH_TYPE_SSO:
                authenticationModel = authModelParam;
                // future: for page refresh -- storeSessionInfo("authenticationModel", authenticationModel);

                break;
            default:
                // "AuthenticationProvider: '{2} is an invalid value for the AuthenticationModel 
                //     parameter in constructor call."
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG504",
                    "AuthenticationProvider",
                    authModelParam,
                    "authenticationModel",
                    "constructor"
                ));
            }
        } else {
            // AuthenticationProvider: Argument 2 must be of type string in constructor call.
            throw new Error(progress.data._getMsgText("jsdoMSG121", "AuthenticationProvider", "2",
                                           "string", "constructor"));
        }

        
        // This section is SSO specific, through the comment "end of constructor processing...",
        // However, page refresh support will require something like this for the other authentication 
        // models (if we think it's possible for sessionStorage to be missing in an environemnt in which 
        // anyone would use page refresh)
        if (typeof sessionStorage === "undefined") {
            // "AuthenticationProvider: No support for sessionStorage."
            throw new Error(progress.data._getMsgText("jsdoMSG126",
                                                      "AuthenticationProvider",
                                                      "sessionStorage"));
        }
        // if you switch to a different type of storage, change the error message argument above
        storage = sessionStorage;

        // We're currently storing the token in storage with the 
        // uri as the key. This is subject to change later.
        storageKey = uri;  // or name
        tokenDataKeys.token = storageKey + tokenDataKeys.token;
        tokenDataKeys.refreshToken = storageKey + tokenDataKeys.refreshToken;
        tokenDataKeys.tokenType = storageKey + tokenDataKeys.tokenType;
        tokenDataKeys.expiration = storageKey + tokenDataKeys.expiration;

        if (retrieveToken()) {
            loggedIn = true;
        }
      // end of constructor processing except for definition of functions and methods
        
        

        // METHODS
        
        // Probably the only SSO specific thing is the parameter passed to the send() call 
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
        
        // SSO specific
        this.refresh = function () {
            var deferred = $.Deferred(),
                xhr;

            if (this.authenticationModel !== progress.data.Session.AUTH_TYPE_SSO) {
                // AuthenticationProvider: Token refresh() was not executed because the authentication 
                // model is not SSO.
                throw new Error(progress.data._getMsgText("jsdoMSG055", "AuthenticationProvider"));
            }

            if (!loggedIn) {
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

        // may be SSO specific only because of the xhr.send (tho we would need that for Form and maybe Basic)
        this.logout = function () {
            var deferred = $.Deferred(),
                xhr;

            if (!loggedIn) {
                // "logout() was not attempted because the AuthenticationProvider is not logged in."
                throw new Error(progress.data._getMsgText("jsdoMSG053", "AuthenticationProvider", "logout"));
            }
            
            // Unconditionally reset --- even if the actual server request fails, we still want
            // to reset this AuthenticationProvider so it can try a login if desired
            // (In the future we can add a parameter that controls whether the reinit is unconditional)
            reset();
            
            xhr = new XMLHttpRequest();
            openLogoutRequest(xhr);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    // process the response from the Web application
                    processLogoutResult(xhr, deferred);
                }
            };

            xhr.send();
            return deferred.promise();
        };
        
        // implementation is SSO specific
        this.hasCredential = function () {
            return (retrieveToken() === null ? false : true);
        };

        // sso specific
        this.hasRefreshToken = function () {
            return (retrieveRefreshToken() === null ? false : true);
        };

        // SSO specific
        // This is going to be hardcoded for now. This can very 
        // possibly change in the future if we decide to expose 
        // the token to the user.
        this._getToken = function () {
            return retrieveToken();
        };

    };

    progress.data.auth = {};
    progress.data.auth.openRequestAndAuthorizeSSO = function(authProvider, xhr, verb, uri) {
        var tokenRequestDescriptor;

        tokenRequestDescriptor = {
            type : "header",
            headerName : "Authorization"
        };
    
        if (authProvider.hasCredential()) {
            xhr.open(verb, uri, true);  // always use async for SSO

            xhr.setRequestHeader(
                tokenRequestDescriptor.headerName,
                "oecp " + authProvider._getToken() );

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
        
    }
    
}());

