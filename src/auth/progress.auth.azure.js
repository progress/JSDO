(function(){

    "use strict";

    progress.data.AuthenticationProviderAzure = function(uri) {
        var bearerToken;

        this._initialize(uri, progress.data.Session.AUTH_TYPE_AZURE,
            {"_loginURI": progress.data.AuthenticationProvider._homeLoginURIBase});
            
        function make_bearer_token_header() {
            return "Bearer " + token;
        }

        this._reset = function() {
            bearerToken = null;
        }

        this._openLoginRequest = function (xhr, uri) {
            var auth;
            
            xhr.open("GET", uri, true);  // but see comments below inside the "if userName"
                                         // may have to go with that approach
            
            if (bearerToken) {
                
                // set Authorization header
                auth = make_bearer_token_header_header(bearerToken);
                xhr.setRequestHeader('Authorization', auth);
            }

            progress.data.Session._setNoCacheHeaders(xhr);
        };

        this._processLoginResult = function _azure_processLoginResult(xhr, deferred) {
            progress.data.AuthenticationProviderAzure.prototype._processLoginResult.apply(
                this,
                [xhr, deferred]
            );
            if (!this._loggedIn) {
                bearerToken = null;
            }
        };

        this.login = function (token) {
            bearerToken = token;
            return this._loginProto();
        }

        this._openRequestAndAuthorize = function (xhr, verb, uri, async, callback) {
            var auth,
                errorObject;

            xhr.open(verb, uri, async);  // but see comments below inside the "if userName"
                                        // may have to go with that approach

            if (bearerToken) {

                // set Authorization header
                auth = make_bearer_token_header(bearerToken);
                xhr.setRequestHeader('Authorization', auth);
            }

            progress.data.Session._setNoCacheHeaders(xhr);

            callback(errorObject);
        };
    };

    function AzureProxy() {}
    AzureProxy.prototype = progress.data.AuthenticationProvider.prototype;
    progress.data.AuthenticationProviderAzure.prototype = new AzureProxy();

    progress.data.AuthenticationProviderAzure.prototype.constructor =
        progress.data.AuthenticationProviderAzure;
})