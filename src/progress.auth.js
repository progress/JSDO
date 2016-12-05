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
    progress.data.AuthenticationProvider = function (uri, authModel) {
        var authProv;
        
        // PRIVATE FUNCTIONS

            
        // process constructor arguments

        if (typeof authModel === "string") {

            authModel = authModel.toLowerCase();
            switch (authModel) {
            case progress.data.Session.AUTH_TYPE_ANON:
                authProv = new progress.data.AuthenticationProviderAnon(
                    uri
                );
                break;
            case progress.data.Session.AUTH_TYPE_BASIC:
                authProv = new progress.data.AuthenticationProviderBasic(
                    uri
                );
                break;
            case progress.data.Session.AUTH_TYPE_FORM:
                authProv = new progress.data.AuthenticationProviderForm(
                    uri
                );
                break;
            case progress.data.Session.AUTH_TYPE_SSO:
                authProv = new progress.data.AuthenticationProviderSSO(
                    uri
                );
                break;
            default:
                // "AuthenticationProvider: '{2} is an invalid value for the AuthenticationModel 
                //     parameter in constructor call."
                throw new Error(progress.data._getMsgText(
                    "jsdoMSG507",
                    "AuthenticationProvider",
                    authModel,
                    "authenticationModel",
                    "constructor"
                ));
                break;
            }
        } else {
            // AuthenticationProvider: '{2}' is an invalid value for the authenticationModel parameter in constructor call.
            throw new Error(progress.data._getMsgText("jsdoMSG507", "AuthenticationProvider", authModel,
                                           "authenticationModel", "constructor"));
        }

        return authProv;
//        this.prototype = authProv;
//        return Object.create(authProv);
        

        // METHODS
        
        
    };

    
}());

