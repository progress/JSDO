/*global sso, QUnit, session, $, progress*/
(function () {
    "use strict";
    
    // Note: These contain all the variables we will need to run this stuff.
    var testFramework = QUnit,
        serviceURI = "http://nbbedwhenshaw3.bedford.progress.com:8810/TokenConsumer",
        catalogURI = serviceURI + "/static/TokenConsumerService.json",
        tokenURI = "http://nbbedwhenshaw3.bedford.progress.com:8810/TokenServer/",
        tokenURINoRefresh = "http://nbbedwhenshaw3.bedford.progress.com:8810/TSNoRefresh/",
        authenticationModel = "SSO",
        username = "restuser",
        password = "password";
    
    function testAuthenticationProviderConstructorAndProperties(assert) {
        var prov = sso.create(tokenURI, authenticationModel);

        assert.expect(4);

        assert.equal(typeof prov, "object", "AuthenticationProvider Constructor");
        assert.equal(tokenURI, prov.uri, "uri Property");
        // Change this to be authenticationModel when the bug gets fixed
        assert.equal("sso", prov.authenticationModel, "authenticationModel Property");
        assert.notOk(prov.hasRefreshToken(), "hasRefreshToken method (returns false before login)");
    }
    
    function negTestAuthenticationProviderConstructor(assert) {
        assert.expect(3);

        // Success case with correct credentials.
        assert.throws(
            function () {
                sso.create(tokenURI, 1);
            },
            new Error("AuthenticationProvider: Argument 2 must be of type " +
                      "string in constructor call."),
            "Error is raised for authenticationModel mismatched type."
        );
        
        assert.throws(
            function () {
                sso.create(tokenURI, "x");
            },
            new Error("AuthenticationProvider: 'x' is an invalid value for " +
                      "the authenticationModel parameter in constructor call."),
            "Error is raised for authenticationModel invalid value."
        );
        
        assert.throws(
            function () {
                sso.create("", authenticationModel);
            },
            new Error("AuthenticationProvider: '' is an invalid value for the " +
                      "uri parameter in constructor call."),
            "Error is raised for uri being an empty string."
        );
    }

    function testAuthenticationProviderLogin(assert) {
        var prov = sso.create(tokenURI, authenticationModel),
            done = assert.async(1);

        assert.expect(1);

        // Success case with correct credentials.
        sso.login(prov, username, password)
            .then(function (provider) {
                assert.ok(true, "login() succeeded");
                provider.logout();
            }, function () {
                assert.ok(false, "login() failed");
            })
            .always(function () {
                done();
            });
    }
    
    function negTestAuthenticationProviderLogin(assert) {
        var prov = sso.create(tokenURI, authenticationModel),
            done = assert.async(1);

        assert.expect(3);

        // Success case with correct credentials.
        assert.throws(
            function () {
                sso.login(prov, 5, password);
            },
            new Error("AuthenticationProvider: Argument 1 must be of type string in login call."),
            "Error is raised for username mismatched type."
        );
        
        assert.throws(
            function () {
                sso.login(prov, username, "");
            },
            new Error("AuthenticationProvider: 'password' cannot be an empty string."),
            "Error is raised for password being an empty string."
        );
        
        // This should fail with a bad username and bad password.
        sso.login(prov, "fakeuser", "fakepassword")
            .then(function (provider) {
                assert.ok(false, "login() succeeded, which is bad");
                provider.logout();
            }, function () {
                assert.ok(true, "login() failed - which was expected");
            })
            .always(function () {
                done();
            });
    }

    function testAuthenticationProviderLogoutAndHasCredential(assert) {
        var prov = sso.create(tokenURI, authenticationModel),
            done = assert.async(1);

        assert.expect(4);

        assert.notOk(prov.hasCredential(), "hasCredential() should be false");

        sso.login(prov, username, password)
            .then(function (provider) {
                assert.ok(provider.hasCredential(), "hasCredential() should be true");
                assert.ok(provider.hasRefreshToken(), "hasRefreshToken() should be true");
                provider.logout();
                assert.notOk(provider.hasCredential(), "hasCredential() should be false");
            }, function () {
                assert.ok(false, "login() failed, should not have gotten here");
            })
            .always(function () {
                done();
            });
    }

    function testAuthenticationProviderRefresh(assert) {
        var prov = sso.create(tokenURI, authenticationModel),
            done = assert.async(1);

        assert.expect(6);
        
        sso.login(prov, username, password)
            .then(function (provider) {
                assert.ok(true, "login() succeeded");
            
                // delay a second so the server doesn't think that the new token value is the same as the old.
                setTimeout(function () {
                    provider.refresh()
                        .then(function (provider) {
                            assert.ok(true, "refresh() succeeded");
                            setTimeout(function () {
                                provider.refresh()
                                    .then(function (provider) {
                                        assert.ok(true, "refresh() succeeded");
                                        return provider.logout();
                                    })
                                    .then(function (provider) {
                                        assert.notOk(provider.hasCredential(), false,
                                                     "hasCredential returns false after logout()");
                                        assert.notOk(provider.hasRefreshToken(), false,
                                                     "hasRefreshToken returns false after logout()");
                                        assert.throws(
                                            function () {
                                                prov.refresh();
                                            },
                                            new Error("AuthenticationProvider: refresh was not executed " +
                                                      "because the AuthenticationProvider is not " +
                                                      "logged in."),
                                            "Error is raised when calling refresh after logging out."
                                        );

                                    },
                                        function () {
                                            assert.ok(false, "refresh test failed");
                                        })
                                    .always(function () {
                                        done();
                                    });
                            },  // questionable indentation insisted upon by Brackets
                                1000);
                        });
                },  // questionable indentation insisted upon by Brackets
                    1000);
                
            });
    }


    function negTestAuthenticationProviderRefresh(assert) {
        var prov = sso.create(tokenURINoRefresh, authenticationModel),
            done = assert.async(1);

        assert.expect(5);
        
        assert.throws(
            function () {
                prov.refresh();
            },
            new Error("AuthenticationProvider: refresh was not executed because the " +
                      "AuthenticationProvider is not logged in."),
            "Error is raised when calling refresh and not logged in."
        );
        
        sso.login(prov, username, password)
            .then(function (provider) {
                assert.notOk(provider.hasRefreshToken(), false,
                             "hasRefreshToken returns false when server does not return a refresh token");
                assert.throws(
                    function () {
                        prov.refresh();
                    },
                    new Error("AuthenticationProvider: Token refresh was not executed " +
                              "because the AuthenticationProvider does not " +
                              "have a refresh token."),
                    "Error is raised when calling refresh when the server did not return a refresh token."
                );
                // delay a second so the server doesn't think that the new token value is the same as the old.
                setTimeout(function () {
                    provider.logout()
                        .then(function (provider) {
                            assert.notOk(provider.hasRefreshToken(), false,
                                         "hasRefreshToken returns false after logout()");
                            assert.throws(
                                function () {
                                    prov.refresh();
                                },
                                new Error("AuthenticationProvider: refresh was not executed " +
                                          "because the AuthenticationProvider is not " +
                                          "logged in."),
                                "Error is raised when calling refresh after logging out."
                            );

                        },
                            function () {
                                assert.ok(false, "negative refresh test failed");
                            })
                        .always(function () {
                            done();
                        });
                },  // questionable indentation insisted upon by Brackets
                    1000);
            });
    }

    
    
    function testJSDOSessionConstructor(assert) {
        var prov = sso.create(tokenURI, authenticationModel),
            jsdoSettings = {
                "serviceURI": serviceURI,
                "authenticationModel": authenticationModel,
                "authImpl": {"provider": prov}
            },
            sess = session.create(jsdoSettings);

        assert.expect(4);

        assert.equal(typeof sess, "object", "JSDOSession Constructor");
        assert.deepEqual(sess.authImpl, null, "JSDOSession authImpl property");
        assert.equal(serviceURI, sess.serviceURI, "serviceURI Property");
        // Change this to be authenticationModel when the bug gets fixed
        assert.equal("sso", sess.authenticationModel, "authenticationModel Property");
    }
        
    function testJSDOSessionConnect(assert) {
        var prov = sso.create(tokenURI, authenticationModel),
            jsdoSettings = {
                "serviceURI": serviceURI,
                "authenticationModel": authenticationModel,
                "authImpl": {"provider": prov}
            },
            sess = session.create(jsdoSettings),
            done = assert.async(1);
                
        assert.expect(6);
        sso.login(prov, username, password)
            .then(function (provider) {
                assert.ok(provider.hasCredential(), "hasCredential() should be true in login handler");
                return session.connect(sess, prov);
            })
            .then(function (jsdosession) {
                assert.deepEqual(jsdosession.loginResult, 1, "loginResult should be 1 in connect handler");
                return session.disconnect(jsdosession);
            })
            .then(function (jsdosession) {
                assert.deepEqual(jsdosession.loginResult,
                             null,
                             "loginResult should be null in disconnect handler");
                // and do it again just to be sure we can
                return session.connect(jsdosession, prov);
            })
            .then(function (jsdosession) {
                assert.deepEqual(jsdosession.loginResult, 1, "loginResult should be 1 in connect handler");
                return session.disconnect(jsdosession);
            })
            .then(function (jsdosession) {
                assert.deepEqual(jsdosession.loginResult, null,
                             "loginResult should be null in disconnect handler");
                return sso.logout(prov);
            })
            .then(function (provider) {
                assert.notOk(provider.hasCredential(), "hasCredential should be false in logout handler");
            },
                function () {
                    assert.ok(false, "connect test failed, should not have gotten here");
                })
            .always(function () {
                done();
            });
    }
    
    function negTestJSDOSessionLoginLogout(assert) {
        var prov = sso.create(tokenURI, authenticationModel),
            jsdoSettings = {
                "serviceURI": serviceURI,
                "authenticationModel": authenticationModel,
                "authImpl": {"provider": prov}
            },
            sess = session.create(jsdoSettings),
            done = assert.async(1);
                
        assert.expect(2);
        sso.login(prov, username, password)
            .then(function (provider) {
                assert.throws(
                    function () {
                        sess.login(sess, username, password);
                    },
                    new Error(
                        "JSDOSession: Unexpected error calling login: Session: Called login() when " +
                            "authenticationModel is SSO. Use connect() instead."
                    ),
                    "Error is raised for calling JSDOSession.login() when authenticationModel is SSO."
                );
                
                return sess.connect(provider);
            })
            .then(function (jsdosession) {
                assert.throws(
                    function () {
                        sess.logout(jsdosession);
                    },
                    new Error(
                        "JSDOSession: Unexpected error calling logout: Session: Called logout() when " +
                            "authenticationModel is SSO. Use disconnect() instead."
                    ),
                    "Error is raised for calling JSDOSession.logout() when authenticationModel is SSO."
                );
            
                return sso.logout(prov);
            })
            .always(function () {
                done();
            });
    }

    function testJSDOSessionAddCatalog(assert) {
        var prov = sso.create(tokenURI, authenticationModel),
            jsdoSettings = {
                "serviceURI": serviceURI,
                "authenticationModel": authenticationModel,
                "authImpl": {"provider": prov}
            },
            sess = session.create(jsdoSettings),
            done = assert.async(1);
                
        assert.expect(4);
        
        sso.login(prov, username, password)
            .then(function (provider) {
                return session.connect(sess, prov);
            })
            .then(function (jsdosession) {
                assert.deepEqual(jsdosession.loginResult, 1, "loginResult should be 1 in connect handler");
                return session.addCatalog(jsdosession, catalogURI, {authProvider: prov});
            })
            .then(function (jsdosession) {
                assert.equal(jsdosession.catalogURIs[0], catalogURI,
                             "catalogURI property in handler");
                return session.disconnect(jsdosession);
            })
            .then(function (jsdosession) {
                assert.deepEqual(jsdosession.loginResult,
                             null,
                             "loginResult should be null in disconnect handler");
                return sso.logout(prov);
            })
            .then(function (provider) {
                assert.notOk(provider.hasCredential(), "hasCredential should be false in logout handler");
            },
                function () {
                    assert.ok(false, "connect test failed, should not have gotten here");
                })
            .always(function () {
                session.clearCatalogData();
                done();
            });
                
    }

    function testJSDOSessionAddCatalogNoConnect(assert) {
        var prov = sso.create(tokenURI, authenticationModel),
            jsdoSettings = {
                "serviceURI": serviceURI,
                "authenticationModel": authenticationModel,
                "authImpl": {"provider": prov}
            },
            sess = session.create(jsdoSettings),
            done = assert.async(1);
                
        assert.expect(2);
        
        sso.login(prov, username, password)
            .then(function (prov) {
                return session.addCatalog(sess, catalogURI, {authProvider: prov});
            })
            .then(function (jsdosession) {
                assert.equal(jsdosession.catalogURIs[0], catalogURI,
                             "catalogURI property in handler");
                return sso.logout(prov);
            })
            .then(function (jsdosession) {
                assert.notOk(prov.hasCredential(), "hasCredential should be false in logout handler");
            },
                function () {
                    assert.ok(false, "addCatalog (no connect) test failed, should not have gotten here");
                })
            .always(function () {
                session.clearCatalogData();
                done();
            });
                
    }


    function negTestJSDOSessionAddCatalog(assert) {
        var prov = sso.create(tokenURI, authenticationModel),
            jsdoSettings = {
                "serviceURI": serviceURI,
                "authenticationModel": authenticationModel,
                "authImpl": {"provider": prov}
            },
            sess = session.create(jsdoSettings),
            done = assert.async(1),
            deferred;
                
        assert.expect(5);
        
        assert.throws(
            function () {
                session.addCatalog(sess, 17, {authProvider: prov});
            },
            new Error(
                "JSDOSession: Invalid signature for addCatalog. The catalogURI parameter " +
                    "must be a string or an array of strings."
            ),
            "Error should be raised for passing auth provider without a token to addCatalog()."
        );
        assert.equal(sess.catalogURIs[0], undefined,
                     "catalogURI property should be undefined in handler after error loading 1st catalog");
   
        sso.login(prov, username, password)
            .then(function () {
                assert.throws(
                    function () {
                        session.addCatalogOld(sess, catalogURI, username, password, {authProvider: prov});
                    },
                    new Error(
                        "Session: Cannot pass username and password to addCatalog when " +
                            "authenticationModel is SSO. Pass an AuthenticationProvider instead."
                    ),
                    "Error should be raised for passing username and password to addCatalog() when " +
                        "authenticationModel is SSO."
                );
                assert.equal(sess.catalogURIs[0], undefined,
                    "catalogURI property should be undefined in handler after error loading 1st catalog");
                return sso.logout(prov);
            })
            .then(function (provider) {
                assert.notOk(provider.hasCredential(), "hasCredential should be false in logout handler");
            },
                function () {
                    assert.ok(false, "negative addCatalog test failed, should not have gotten here");
                })
            .always(function () {
                session.clearCatalogData();
                done();
            });
                
    }

    function testSpecSample(assert) {
        var authProvider,
            jsdoSession,
            credPromise,
            done = assert.async(1);

        assert.expect(2);
        
        // Gets username and password, returns a promise
        // This is not part of the JSDO API, it's here just to be used in the sample.
        // A real app would prompt the user, or read from storage, etc. 
        function getCredentials() {
            var deferred = $.Deferred();
            deferred.resolve("restuser", "password");
            return deferred.promise();
        }

        // Create an AuthenticationProvider. The example will use this to get an SSO
        // token, then pass this AuthenticationProvider object to a JSDOSession so
        // the token can be added to Data Object Service requests made by that JSDOSession.
        authProvider = new progress.data.AuthenticationProvider(
            "http://localhost:8810/TokenServer/",
            progress.data.Session.AUTH_TYPE_SSO
        );
        assert.deepEqual(typeof authProvider, "object", "AuthenticationProvider Constructor");

        // Create the JSDOsession so it will be available to use when authProvider gets the token
        jsdoSession = new progress.data.JSDOSession({
            serviceURI: "http://localhost:8810/TokenConsumer",
            authenticationModel: progress.data.Session.AUTH_TYPE_SSO
        });

        // get the user's credentials
        credPromise = getCredentials();

        credPromise.done(function (username, password) {
            // Log in to the token server, using the credentials passed by getCredentials.
            // If the credentials are valid, the token server returns an SSO token that 
            // authProvider stores internally
            authProvider.login(username, password)
                .then(function (authProv, result, info) {
                    // Pass authprovider to the JSDOSession's connect method. jsdoSession uses
                    // authProvider to add the token to the connect request
                    return jsdoSession.connect(authProv);
                })
                .then(function (session, result, info) {
                    // connect succeeded, so now call addCatalog. A JSDOSession keeps a reference
                    // to the AuthenticationProvider passed to connect(), so the token is available
                    // to include in this and subsequent requests
                    return jsdoSession.addCatalog(
                        "http://localhost:8810/TokenConsumer/static/TokenConsumerService.json"
                    );
                })
                .then(function (session, result, info) {
                    // Create and use one or more JSDOs
                    // ...

                    assert.deepEqual(result, 1, "result should be 1 in addCatalog handler");

                    // End the jsdoSession's connection with its Data Object Service
                    return jsdoSession.disconnect();
                })
                .then(
                    function (session, result, info) {
                        // Log out from the token server. This also causes authProvider to delete
                        // the client's local copy of the token
                        return authProvider.logout();
                    },
                    function () {
                        assert.ok(false, "spec sample failed, should not have gotten here");
                    }
                )
                .always(function () {
                    done();
                });
        });
    }
        
    testFramework.module("Module 1, AuthenticationProvider");
    testFramework.test(
        "testAuthenticationProviderConstructorAndProperties: " +
            "AuthenticationProvider Constructor And Properties Tests",
        testAuthenticationProviderConstructorAndProperties
    );
    
    testFramework.test(
        "negTestAuthenticationProviderConstructor: AuthenticationProvider Constructor Negative Tests",
        negTestAuthenticationProviderConstructor
    );

    testFramework.test(
        "testAuthenticationProviderLogin: AuthenticationProvider Login Tests",
        testAuthenticationProviderLogin
    );
    
    testFramework.test(
        "negTestAuthenticationProviderLogin: AuthenticationProvider Login Negative Tests",
        negTestAuthenticationProviderLogin
    );

    testFramework.test(
        "testAuthenticationProviderLogoutAndHasCredential: AuthenticationProvider " +
            "hasCredential and Logout Tests",
        testAuthenticationProviderLogoutAndHasCredential
    );

    testFramework.test(
        "AuthenticationProvider token refresh Tests",
        testAuthenticationProviderRefresh
    );

    testFramework.test(
        "AuthenticationProvider negative token refresh Tests",
        negTestAuthenticationProviderRefresh
    );

    
    testFramework.module("Module 2, JSDOSession");
    testFramework.test(
        "testJSDOSessionConstructor: JSDOSession Constructor Tests",
        testJSDOSessionConstructor
    );

    testFramework.test(
        "testJSDOSessionConnect: connect and disconnect twice",
        testJSDOSessionConnect
    );

    testFramework.test(
        "negTestJSDOSessionLoginLogout: JSDOSession login and logout negative tests " +
            "calling them with SSO auth model)",
        negTestJSDOSessionLoginLogout
    );

    testFramework.test(
        "testJSDOSessionAddCatalog: addCatalog using Auth provider",
        testJSDOSessionAddCatalog
    );

    testFramework.test(
        "testJSDOSessionAddCatalogNoConnect: addCatalog using Auth provider without connecting first",
        testJSDOSessionAddCatalogNoConnect
    );

    testFramework.test(
        "negTestJSDOSessionAddCatalog: error conditions for addCatalog",
        negTestJSDOSessionAddCatalog
    );


    testFramework.module("Module 3 - sample code");
    testFramework.test(
        "testSpecSample: sample code from the SSO spec",
        testSpecSample
    );

}());