/*global sso, QUnit, session, $, progress*/
(function () {
    "use strict";
    
    var testFramework = QUnit,
        resource = "Customer",
        tokenURIShort = "http://nbbedwhenshaw3.bedford.progress.com:8810/TSShortExpire/",
        authenticationModel =  progress.data.Session.AUTH_TYPE_SSO,
        username = "restuser",
        password = "password",
        jsdoSettings = {serviceURI: "http://nbbedwhenshaw3:8810/TokenConsumer",
                    authenticationModel:  progress.data.Session.AUTH_TYPE_SSO,
                    catalogURIs: "http://nbbedwhenshaw3:8810/TokenConsumer/static/TokenConsumerService.json"
            };

    
    // This tests token refresh by calling refresh() in response to an error happening on a JSDO request.
    // There is a simpler refresh test in the general set of SSO unit tests, but this is a little bit 
    // closer to the expected use case for token refresh.
    function refreshTokenTest(assert) {
        var lastOperationTried,
            errorObject,
            prov,
            jsdoSession,
            jsdo,
            done = assert.async(1);

        function handleThrownError(e, msg) {
            var deferred = $.Deferred();

            errorObject = e;
            deferred.reject(jsdoSession);
            return deferred.promise();
        }

        assert.expect(7);

        try {
            prov = sso.create(tokenURIShort, authenticationModel);
            lastOperationTried = "AuthenticationProvider.login";
            sso.login(prov, username, password)
                .then(function (ap, result, info) {
                    lastOperationTried = "JSDOSession constructor";
                    jsdoSession = session.create(jsdoSettings);
                    try {
                        lastOperationTried = "JSDOSession.connect";
                        return session.connect(jsdoSession, prov);
                    } catch (e) {
                        return handleThrownError(e);
                    }
                })
                .then(function (jsdosession, result, info) {
                    try {
                        lastOperationTried = "JSDOSession.addCatalog";
                        return jsdosession.addCatalog(jsdoSettings.catalogURIs);
                    } catch (e) {
                        return handleThrownError(e);
                    }
                })
                .then(function (jsdosession, result, info) {
                    assert.ok(true, "login, connect, and addCatalog succeeded, ready to call fill().");
                    lastOperationTried = "JSDO constructor";
                    try {
                        jsdo = new progress.data.JSDO(resource);
                        lastOperationTried = "JSDO fill";
                        return jsdo.fill();
                    } catch (e) {
                        return handleThrownError(e);
                    }
                })
                .then(function (jsdo, success, request) {
                    assert.ok(true, "First fill succeeded. Delaying before calling 2nd fill.");
                    setTimeout(function () {
                        lastOperationTried = "JSDO fill #2";
                        jsdo.fill()
                            .then(function (jsdo, success, request) {
                                assert.ok(false, "second fill succeeded but should have failed due to " +
                                          "token expiration.");
                                try {
                                    lastOperationTried = "JSDO fill #3";
                                    return jsdo.fill();
                                } catch (e) {
                                    return handleThrownError(e);
                                }
                            },
                                function (jsdo, success, request) {
                                    assert.deepEqual(request.xhr.status, 401, "second fill failed, " +
                                                     "as expected. ");
                                    assert.deepEqual(request.response.error, "sso.token.expired_token",
                                                     "token expired. ");
                                    try {
                                        lastOperationTried = "refresh token";
                                        return jsdoSession.authImpl.provider.refresh();
                                    } catch (e) {
                                        return handleThrownError(e);
                                    }
                                })
                            .then(function () {
                                assert.ok(true, "token refresh succeeded.");
                                lastOperationTried = "JSDO fill #3";
                                return jsdo.fill();
                            })
                            .then(function (jsdo, success, request) {
                                assert.ok(true, "third fill succeeded.");
                                try {
                                    lastOperationTried = "JSDOSession disconnect)";
                                    return jsdoSession.disconnect();
                                } catch (e) {
                                    return handleThrownError(e);
                                }
                            })
                            .then(function (session, result, info) {
                                try {
                                    lastOperationTried = "AuthenticationProvider logout)";
                                    return sso.logout(prov);
                                } catch (e) {
                                    return handleThrownError(e);
                                }
                            })
                            .then(function (provider, result, info) {
                                assert.ok(true, "Test made all requests to server successfully.");
                            }, function (jsdosession, result, info) {
                                var errMsg;

                                if (errorObject) {
                                    errMsg = "Error thrown calling " + lastOperationTried + ": "
                                        + errorObject;
                                } else {
                                    errMsg = "Error calling " + lastOperationTried + ". result: " + result;
                                }
                                assert.ok(false, "Test failed. " + errMsg);

                            })
                            .always(function () {
                                session.clearCatalogData();
                                done();
                            });
                    },
                        13000);
                });

        } catch (f) {
            assert.ok(false, "Test failed, error thrown creating or logging in with AuthenticationProvider. "
                      + f);
        }
    }
    

    // Note: this test takes 80 seconds to run
    // test what happens when the http session that binds the Auth Provider to the token server
    // expires (NOT the token itself -- this is about the JSESSIONID returned from Auth prov's login)
    function testAuthenticationProviderExpiredServerSession(assert) {
        var prov = sso.create(tokenURIShort, authenticationModel),
            done = assert.async(1);

        assert.expect(5);
        
        sso.login(prov, username, password)
            .then(function (provider) {
                assert.ok(provider.hasCredential(), "login() succeeded, provider has token. Pausing 80 seconds");
            
                // delay longer than the timeout period for the Token server session
                setTimeout(function () {
                    sso.refresh(provider)
                        .then(function (provider) {
                            assert.ok(false, "refresh() should have failed due to session timeout");
                        },
                            function () {
                                assert.ok(true, "refresh failed after session timeout");
                                assert.notOk(provider.hasCredential(),
                                             "provider has no credential after refresh failed due to " +
                                             "session having timed out.");
                                return sso.login(provider, username, password);
                            })
                        .then(function (provider) {
                            assert.ok(provider.hasCredential(),
                                      "login() succeeded after refresh failed due to timeout");
                            return sso.logout(provider);
                        })
                        .then(function (provider) {
                            assert.notOk(provider.hasCredential(),
                                      "logout() succeeded, no credential now");
                        })
                        .always(function () {
                            done();
                        });
                },
                    80000);
                
            });
    }

    // Note: this test takes 80 seconds to run
    // test what happens when AuthenticationProvider.logout is called after the http session that binds
    // the Auth Provider to the token server expires
    function testExpiredServerSessionOnLogout(assert) {
        var prov = sso.create(tokenURIShort, authenticationModel),
            done = assert.async(1);

        assert.expect(5);
        
        sso.login(prov, username, password)
            .then(function (provider) {
                assert.ok(provider.hasCredential(), "login() succeeded, provider has token. Pausing 80 seconds");
            
                // delay longer than the timeout period for the Token server session
                setTimeout(function () {
                    sso.logout(provider)
                        .then(function (provider) {
                            assert.ok(true, "logout() succeeded despite session timeout");
                            assert.notOk(provider.hasCredential(),
                                         "provider has no credential after logout failed due to " +
                                         "session having timed out.");
                            return sso.login(provider, username, password);
                        },
                            function () {
                                assert.ok(false, "logout failed after session timeout");
                                assert.notOk(provider.hasCredential(),
                                             "provider has no credential after logout failed due to " +
                                             "session having timed out.");
                                return sso.login(provider, username, password);
                            })
                        .then(function (provider) {
                            assert.ok(provider.hasCredential(),
                                      "login() succeeded after logout failed due to timeout");
                            return sso.logout(provider);
                        })
                        .then(function (provider) {
                            assert.notOk(provider.hasCredential(),
                                      "logout() succeeded, no credential now");
                        })
                        .always(function () {
                            done();
                        });
                },
                    80000);
                
            });
    }

    
    testFramework.module("Module 3 -- Token Refresh Extras");
    testFramework.test(
        "Get a token, call JSDO method that fails due to token expiration, refresh token and try again",
        refreshTokenTest
    );
    
    // Note: this test takes 80 seconds to run
    testFramework.test(
        'AuthenticationProvider test of expired token server session (takes 80" to run)',
        testAuthenticationProviderExpiredServerSession
    );
    
    // Note: this test takes 80 seconds to run
    testFramework.test(
        'AuthenticationProvider test of expired token server session (takes 80" to run)',
        testExpiredServerSessionOnLogout
    );

}());
