/*global sso, QUnit, session, $, progress*/
(function () {
    "use strict";
    
    var testFramework = QUnit,
        tokenURI = "http://nbbedwhenshaw3.bedford.progress.com:8810/TokenServer/",
        tokenURIShort = "http://nbbedwhenshaw3.bedford.progress.com:8810/TSShortExpire/",
        tokenURIBoth = "http://nbbedwhenshaw3.bedford.progress.com:8810/TSandTCCust/",
        authenticationModel =  progress.data.Session.AUTH_TYPE_SSO,
        username = "restuser",
        password = "password",
        jsdoSettingsONE = {serviceURI: "http://nbbedwhenshaw3:8810/TokenConsumer",
                    authenticationModel:  progress.data.Session.AUTH_TYPE_SSO,
                    catalogURIs: "http://nbbedwhenshaw3:8810/TokenConsumer/static/TokenConsumerService.json",
                    resource: "Customer"
            },
        jsdoSettingsONE_Both = {serviceURI: "http://nbbedwhenshaw3:8810/TSandTCCust",
                    authenticationModel:  progress.data.Session.AUTH_TYPE_SSO,
                    catalogURIs: "http://nbbedwhenshaw3:8810/TSandTCCust/static/TSandTCCustService.json",
                    resource: "Customer"
            },
        jsdoSettings2 = {serviceURI: "http://nbbedwhenshaw3:8810/TCBin",
                    authenticationModel:  progress.data.Session.AUTH_TYPE_SSO,
                    catalogURIs: "http://nbbedwhenshaw3:8810/TCBin/static/TCBinService.json",
                    resource: "Bin"
            };

    
    // Use an SSO token with more than one JSDOSession going to different Web applications
    function multiConsumerTest(assert) {
        var lastOperationTried,
            errorObject,
            prov,
            jsdoSessionONE,
            jsdoSession2,
            jsdoONE,
            jsdo2,
            done = assert.async(1),
            promise;

        function handleThrownError(sessionOrJSDO, e, msg) {
            var deferred = $.Deferred();

            errorObject = e;
            deferred.reject(sessionOrJSDO);
            return deferred.promise();
        }

        assert.expect(7);

        try {
            prov = sso.create(tokenURIBoth, authenticationModel);
            lastOperationTried = "AuthenticationProvider.login";
            promise = sso.login(prov, username, password);
            // promise = sso.login(prov, 17);
        } catch (f) {
            assert.ok(false, "Test failed, error thrown creating or logging in with AuthenticationProvider. "
                      + f);
        }
        
        promise.then(function (ap, result, info) {
            lastOperationTried = "JSDOSessionONE constructor";
            jsdoSessionONE = session.create(jsdoSettingsONE);
            try {
                lastOperationTried = "JSDOSessionONE.connect";
                return session.connect(jsdoSessionONE, prov);
            } catch (e) {
                return handleThrownError(jsdoSessionONE, e);
            }
        })
            .then(function (jsdosession, result, info) {
                try {
                    lastOperationTried = "JSDOSessionONE.addCatalog";
                    return session.addCatalog(jsdosession, jsdoSettingsONE.catalogURIs);
                } catch (e) {
                    return handleThrownError(jsdosession, e);
                }
            })
            .then(function (jsdosession, result, info) {
                assert.ok(true, "login, connect, and addCatalog succeeded for JSDOSessionONE.");
                lastOperationTried = "jsdoONE constructor";
                try {
                    jsdoONE = new progress.data.JSDO(jsdoSettingsONE.resource);
                    lastOperationTried = "jsdoONE fill";
                    return jsdoONE.fill();
                } catch (e) {
                    return handleThrownError(jsdoONE, e);
                }
            })
            .then(function (jsdo, result, info) {
                assert.ok(true, "Fill of jsdoONE succeeded.");
                lastOperationTried = "JSDOSession2 constructor";
                jsdoSession2 = session.create(jsdoSettings2);
                try {
                    lastOperationTried = "JSDOSession2.connect";
                    return session.connect(jsdoSession2, prov);
                } catch (e) {
                    return handleThrownError(jsdoSession2, e);
                }
            })
            .then(function (jsdosession, result, info) {
                try {
                    lastOperationTried = "JSDOSession2.addCatalog";
                    return session.addCatalog(jsdosession, jsdoSettings2.catalogURIs);
                } catch (e) {
                    return handleThrownError(jsdosession, e);
                }
            })
            .then(function (jsdosession, result, info) {
                assert.ok(true, "login, connect, and addCatalog succeeded for JSDOSession2.");
                lastOperationTried = "jsdo2 constructor";
                try {
                    jsdo2 = new progress.data.JSDO(jsdoSettings2.resource);
                    lastOperationTried = "jsdo2 fill";
                    return jsdo2.fill();
                } catch (e) {
                    return handleThrownError(jsdo2, e);
                }
            })
        
//            .then(function (jsdo, success, request) {
//                assert.ok(false, "second fill succeeded but should have failed due to " +
//                          "token expiration.");
//                try {
//                    lastOperationTried = "JSDO fill #3";
//                    return jsdo.fill();
//                } catch (e) {
//                    return handleThrownError(jsdo, e);
//                }
//            },
//                function (jsdo, success, request) {
//                    assert.deepEqual(request.xhr.status, 401, "second fill failed, " +
//                                     "as expected. ");
//                    assert.deepEqual(request.response.error, "sso.token.expired_token",
//                                     "token expired. ");
//                    try {
//                        lastOperationTried = "refresh token";
//                        return jsdoSessionONE.authImpl.provider.refresh();
//                    } catch (e) {
//                        return handleThrownError(jsdoSessionONE, e);
//                    }
//                })
//            .then(function () {
//                assert.ok(true, "token refresh succeeded.");
//                lastOperationTried = "JSDO fill #3";
//                return jsdo.fill();
//            })
            .then(function (jsdo, success, request) {
                assert.ok(true, "fill of jsdo2 succeeded.");
                try {
                    lastOperationTried = "JSDOSession disconnect)";
                    return session.disconnect(jsdoSessionONE);
                } catch (e) {
                    return handleThrownError(jsdoSessionONE, e);
                }
            })
    
            .then(function (jsdosession, success, request) {
                assert.ok(true, "disconnect of JSDOSessionONE succeeded.");
                lastOperationTried = "jsdo2 fill #2";
                return jsdo2.fill();
            })
            .then(function (jsdo, success, request) {
                assert.ok(true, "2nd fill of jsdo2 succeeded.");
                try {
                    lastOperationTried = "JSDOSession2 disconnect)";
                    return session.disconnect(jsdoSession2);
                } catch (e) {
                    return handleThrownError(jsdoSession2, e);
                }
            })
            .then(function (jsdosession, result, info) {
                try {
                    lastOperationTried = "AuthenticationProvider logout)";
                    return sso.logout(prov);
                } catch (e) {
                    return handleThrownError(prov, e);
                }
            })
            .then(function (provider, result, info) {
                assert.ok(true, "Test made all requests to server successfully.");
            }, function (args, result, info) {
                var errMsg;

                if (args.constructor.name === "Error") {
                    errMsg = "Error thrown calling " + lastOperationTried + ": "
                        + args;
                } else {
                    errMsg = "Error calling " + lastOperationTried + ". result: " + result;
                }
                assert.ok(false, "Test failed. " + errMsg);

            })
            .always(function () {
                done();
            });
    }

    // This tests what happens when the authImpl.provider from a JSDOSession is used to call logout
    // and then a different JSDOSession that uses the same authprovider tries to make a server request
    function multiConsumerLogoutTest(assert) {
        var lastOperationTried,
            prov,
            jsdoSessionONE,
            jsdoSession2,
            jsdoONE,
            jsdo2,
            done = assert.async(1),
            promise;

        function handleThrownError(originator, e) {
            var deferred = $.Deferred();

            deferred.reject({ originator: originator,
                              errorObject: e});
            return deferred.promise();
        }

        assert.expect(3);

        try {
            prov = sso.create(tokenURIShort, authenticationModel);
            lastOperationTried = "AuthenticationProvider.login";
            promise = sso.login(prov, username, password);
            // promise = sso.login(prov, 17);
        } catch (f) {
            assert.ok(false, "Test failed, error thrown creating or logging in with AuthenticationProvider. "
                      + f);
        }
        
        promise.then(function (ap, result, info) {
            lastOperationTried = "JSDOSessionONE constructor";
            jsdoSessionONE = session.create(jsdoSettingsONE);
            try {
                lastOperationTried = "JSDOSessionONE.connect";
                return session.connect(jsdoSessionONE, prov);
            } catch (e) {
                return handleThrownError(jsdoSessionONE, e);
            }
        })
            .then(function (jsdosession, result, info) {
                try {
                    lastOperationTried = "JSDOSessionONE.addCatalog";
                    return session.addCatalog(jsdosession, jsdoSettingsONE.catalogURIs);
                } catch (e) {
                    return handleThrownError(jsdosession, e);
                }
            })
            .then(function (jsdo, result, info) {
                assert.ok(true, "login, connect, and addCatalog succeeded for JSDOSessionONE.");
                lastOperationTried = "JSDOSession2 constructor";
                jsdoSession2 = session.create(jsdoSettings2);
                try {
                    lastOperationTried = "JSDOSession2.connect";
                    return session.connect(jsdoSession2, prov);
                } catch (e) {
                    return handleThrownError(jsdoSession2, e);
                }
            })
            .then(function (jsdosession, result, info) {
                try {
                    lastOperationTried = "jsdosession.authImpl.provider.logout";
                    return sso.logout(jsdosession.authImpl.provider);
                } catch (e) {
                    return handleThrownError(jsdosession, e);
                }
            })
            .then(function (jsdosession, result, info) {
                assert.ok(true, "jsdosession.authImpl.provider.logout succeeded.");
                try {
                    lastOperationTried = "jsdoONE constructor";
                    jsdoONE = new progress.data.JSDO(jsdoSettingsONE.resource);
                    lastOperationTried = "jsdoONE fill after provider logout";
                    return jsdoONE.fill();
                } catch (e) {
                    return handleThrownError(jsdoONE, e);
                }
            })
            .then(function (jsdo, success, request) {
                assert.ok(false, "fill of jsdoONE after provider logout should have failed.");
                try {
                    lastOperationTried = "JSDOSession disconnect)";
                    return session.disconnect(jsdoSessionONE);
                } catch (e) {
                    return handleThrownError(e);
                }
            }, function (args, result, info) {
                var errMsg,
                    errorObject;

                if (typeof args === "object") {
                    if (args.constructor.name === "Error") {
                        errorObject = args;
                    } else {
                        errorObject = args.errorObject;  // could be undefined; that's OK
                    }
                }
                if (errorObject) {
                    errMsg = "Error thrown calling " + lastOperationTried + ": " + errorObject;
                } else {
                    errMsg = "Error calling " + lastOperationTried + ". result: " + result;
                }
                assert.deepEqual(errorObject,
                    new Error("AuthenticationProvider: The AuthenticationProvider " +
                              "is not managing valid credentials."),
                    "Should get error calling connect after logout.");

            })
            .always(function () {
                session.clearCatalogData();
                done();
            });

    }
    
    
    // This tests 2 thinsg:
    // What happens when 2 JSDOSessions use the same AuthenticationProvider
    //    and one calls disconnect(). The other should continue to work fine
    // What happens if the Token Server is also a TokenConsumer
    // NOTE: The Web application for the JSDOSession that calls disconnect is also the Token Server
    //    The JSDOSession shoudl nto eb able to amke any mroe requests, but the AuthentciationProvider's
    //    token shoudl remain valid (in fact, the JSESSIONID should still be good, so in theory
    //    any server request should still work, but teh JSDOSession will articially shut it off
    function multiConsumerDisconnectTest(assert) {
        var lastOperationTried,
            prov,
            jsdoSessionONE,
            jsdoSession2,
            jsdoONE,
            jsdo2,
            done = assert.async(1),
            promise;

        function handleThrownError(originator, e) {
            var deferred = $.Deferred();

            deferred.reject({ originator: originator,
                              errorObject: e});
            return deferred.promise();
        }

        assert.expect(4);

        try {
            prov = sso.create(tokenURIBoth, authenticationModel);
            lastOperationTried = "AuthenticationProvider.login";
            promise = sso.login(prov, username, password);
            // promise = sso.login(prov, 17);
        } catch (f) {
            assert.ok(false, "Test failed, error thrown creating or logging in with AuthenticationProvider. "
                      + f);
        }
        
        promise.then(function (ap, result, info) {
            lastOperationTried = "JSDOSessionONE constructor";
            jsdoSessionONE = session.create(jsdoSettingsONE_Both);
            try {
                lastOperationTried = "JSDOSessionONE.connect";
                return session.connect(jsdoSessionONE, prov);
            } catch (e) {
                return handleThrownError(jsdoSessionONE, e);
            }
        })
            .then(function (jsdosession, result, info) {
                try {
                    lastOperationTried = "JSDOSessionONE.addCatalog";
                    return session.addCatalog(jsdosession, jsdoSettingsONE_Both.catalogURIs);
                } catch (e) {
                    return handleThrownError(jsdosession, e);
                }
            })
            .then(function (jsdo, result, info) {
                assert.ok(true, "login, connect, and addCatalog succeeded for JSDOSessionONE.");
                lastOperationTried = "JSDOSession2 constructor";
                jsdoSession2 = session.create(jsdoSettings2);
                try {
                    lastOperationTried = "JSDOSession2.connect";
                    return session.connect(jsdoSession2, prov);
                } catch (e) {
                    return handleThrownError(jsdoSession2, e);
                }
            })
            .then(function (jsdosession, result, info) {
                try {
                    lastOperationTried = "JSDOSession2.addCatalog";
                    return session.addCatalog(jsdosession, jsdoSettings2.catalogURIs);
                } catch (e) {
                    return handleThrownError(jsdosession, e);
                }
            })
            .then(function (jsdosession, result, info) {
                try {
                    lastOperationTried = "jsdoSessionONE disconnect";
                    return session.disconnect(jsdoSessionONE);
                } catch (e) {
                    return handleThrownError(jsdoSessionONE, e);
                }
            })
            .then(function (jsdosession, result, info) {
                assert.ok(true, "jsdoSessionONE disconnect succeeded.");
                try {
                    lastOperationTried = "jsdoONE constructor";
                    jsdoONE = new progress.data.JSDO(jsdoSettingsONE_Both.resource);
                    lastOperationTried = "jsdoONE fill after jsdoSessionONE disconnect";
                    return jsdoONE.fill();
                } catch (e) {
                    return handleThrownError(jsdo2, e);
                }
            })
            .then(null,
                function (jsdosession, result, info) {
                    var deferred = $.Deferred();
                    assert.ok(true, "jsdoONE fill should fail after JSDOSessionOEN disconnect");
                    deferred.resolve();
                    return deferred.promise();
                })
            .then(function () {
                try {
                    lastOperationTried = "jsdo2 constructor";
                    jsdo2 = new progress.data.JSDO(jsdoSettings2.resource);
                    lastOperationTried = "jsdo2 fill after jsdoSessionONE disconnect";
                    return jsdo2.fill();
                } catch (e) {
                    return handleThrownError(jsdo2, e);
                }
            })
            .then(function (jsdo, success, request) {
                assert.ok(true, "fill of jsdo2 should succeed after jsdoSessionONE disconnect.");
                try {
                    lastOperationTried = "AuthenticationProvider logout)";
                    return sso.logout(prov);
                } catch (e) {
                    return handleThrownError(prov, e);
                }
            }, function (args, result, info) {
                var errMsg,
                    errorObject;

                if (typeof args === "object") {
                    if (args.constructor.name === "Error") {
                        errorObject = args;
                    } else {
                        errorObject = args.errorObject;  // could be undefined; that's OK
                    }
                }
                if (errorObject) {
                    errMsg = "Error thrown calling " + lastOperationTried + ": " + errorObject;
                } else {
                    errMsg = "Error calling " + lastOperationTried + ". result: " + result;
                }
                assert.ok(false, errMsg);
                return sso.logout(prov);
            })
            .always(function () {
                session.clearCatalogData();
                done();
            });

    }
    
    testFramework.module("Module 6 -- Multiple Token Consumers");
    testFramework.test(
        'Use multiple token consumers',
        multiConsumerTest
    );

    testFramework.test(
        'AuthenticationProvider test of multiple token consumers with logout',
        multiConsumerLogoutTest
    );

    testFramework.test(
        'AuthenticationProvider test of multiple token consumers with disconnect',
        multiConsumerDisconnectTest
    );
}());
