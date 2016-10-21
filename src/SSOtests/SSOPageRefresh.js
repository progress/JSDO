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

    
    // This tests page refresh
    function pageRefreshTest(assert) {
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

        assert.expect(4);
        try {
            prov = sso.create(tokenURIShort, authenticationModel);
            if (!prov.hasCredential()) {
                assert.ok(true, prov.hasCredential(),
                          "hasCredential is false before login on 1st execution");
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
                    .then(function (jsdosession, result, info) {   // wacko jslint indentation preference
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
                        assert.ok(true, "First fill succeeded. Refreshing page if this is first execution.");
                        document.location.reload();
                    }, function (jsdosession, result, info) {
                        var errMsg;
                        if (errorObject) {
                            errMsg = "Error thrown calling " + lastOperationTried + ": "
                                + errorObject;
                        } else {
                            errMsg = "Error calling " + lastOperationTried + ". result: " + result;
                        }
                        assert.ok(false, "Test failed. " + errMsg);
                    });
            } else {
                lastOperationTried = "JSDOSession constructor";
                jsdoSession = session.create(jsdoSettings);
                lastOperationTried = "JSDOSession.connect";
                session.connect(jsdoSession, prov)
                    .then(function (jsdosession, result, info) {
                        try {
                            lastOperationTried = "JSDOSession.addCatalog";
                            return jsdosession.addCatalog(jsdoSettings.catalogURIs);
                        } catch (e) {
                            return handleThrownError(e);
                        }
                    })
                    .then(function (jsdosession, result, info) {   // wacko jslint indentation preference
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
                        assert.ok(true, "First fill succeeded.");
                        lastOperationTried = "JSDO fill #2";
                        return jsdo.fill();
                    })
                    .then(function (jsdo, success, request) {
                        assert.ok(true, "second fill succeeded.");
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
                        sessionStorage.setItem("Test1", "passed");
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
            }
            
        } catch (f) {
            assert.ok(false, "Test failed, error thrown creating or logging in with AuthenticationProvider. "
                      + f);
        }
    }
    
    
    
    
    // This does a page refresh, then pauses long enough that the token has expired by the time
    // the code calls connect after the refresh. Hialrity ensues.
    function pageAndTokenRefreshTest(assert) {
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
        
        assert.equal(sessionStorage.getItem("Test1"), "passed", "Test1 should have passed");

        try {
            prov = sso.create(tokenURIShort, authenticationModel);
            
            if (!prov.hasCredential()) {
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
                            return session.addCatalog(jsdosession, jsdoSettings.catalogURIs);
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
                        assert.ok(true, "First fill succeeded. Delaying before forcing page refresh.");
                        setTimeout(function () {
                            document.location.reload();
                        },
                            13000);
                    }, function (jsdosession, result, info) {
                        var errMsg;

                        if (errorObject) {
                            errMsg = "Error thrown calling " + lastOperationTried + ": "
                                + errorObject;
                        } else {
                            errMsg = "Error calling " + lastOperationTried + ". result: " + result;
                        }
                        assert.ok(false, "Test failed. " + errMsg);

//                    })
//                    .always(function () {
//                        done();
                    });
            } else {
                lastOperationTried = "JSDOSession constructor";
                jsdoSession = session.create(jsdoSettings);
                lastOperationTried = "JSDOSession.connect";
                session.connect(jsdoSession, prov)
                    .then(function (jsdosession, result, info) {
                        assert.ok(false, "connect after refresh succeeded but should have failed due to " +
                                  "token expiration.");
                        try {
                            lastOperationTried = "JSDO fill #3";
                            sso.logout(prov)
                                .always(function () {
                                    return handleThrownError(new Error("Connect succeeded, " +
                                                                       "should have failed"));
                                });
                        } catch (e) {
                            return handleThrownError(e);
                        }
                    },
                        function (jsdosession, result, info) {
                            assert.deepEqual(info.xhr.status, 401,
                                             "connect failed with authentication error, as expected. ");
                            assert.deepEqual(info.xhr.responseText.indexOf("sso.token.expired_token") > -1,
                                             true,
                                             "Failure was due to expired token. ");
                            try {
                                lastOperationTried = "refresh token";
                                return prov.refresh();
                            } catch (e) {
                                return handleThrownError(e);
                            }
                        })
                    .then(function () {
                        assert.ok(true, "token refresh succeeded.");
                        lastOperationTried = "JSDOSession.connect";
                        return session.connect(jsdoSession, prov);
                    })
                    .then(function (jsdosession, result, info) {
                        try {
                            lastOperationTried = "JSDOSession.addCatalog";
                            return session.addCatalog(jsdosession, jsdoSettings.catalogURIs);
                        } catch (e) {
                            return handleThrownError(e);
                        }
                    })
                    .then(function (jsdosession, result, info) {
                        assert.ok(true, "connect and addCatalog succeeded, ready to call fill().");
                        try {
                            lastOperationTried = "JSDO constructor";
                            jsdo = new progress.data.JSDO(resource);
                            lastOperationTried = "JSDO fill";
                            return jsdo.fill();
                        } catch (e) {
                            return handleThrownError(e);
                        }
                    })
                    .then(function (jsdo, success, request) {
                        assert.ok(true, "fill succeeded after page and token refresh.");
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
                        sessionStorage.removeItem("Test1");
                        session.clearCatalogData();
                        done();
                    });
            }
        } catch (f) {
            assert.ok(false, "Test failed, error thrown creating or logging in with AuthenticationProvider. "
                      + f);
        }
    }
    
    
    
    
    
    
    
    testFramework.module("Module 5 -- Page Refresh");
    if (sessionStorage.getItem("runNum") === null) {
        sessionStorage.setItem("runNum", 1);
        testFramework.test(
            "Get a token, start a JSDOSession connection, create a JSDO, refresh the browser",
            pageRefreshTest
        );
    } else if (sessionStorage.getItem("runNum") === "1") {
        sessionStorage.setItem("runNum", 2);
        testFramework.test(
            "Get a token, start a JSDOSession connection, create a JSDO, refresh the browser",
            pageRefreshTest
        );

        testFramework.test(
            "Do a page refresh after the token has expired",
            pageAndTokenRefreshTest
        );
    } else if (sessionStorage.getItem("runNum") === "2") {
        sessionStorage.removeItem("runNum");
        testFramework.test(
            "Do a page refresh after the token has expired",
            pageAndTokenRefreshTest
        );
    }
    
}());
