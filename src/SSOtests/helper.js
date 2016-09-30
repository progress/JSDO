/*global sso, QUnit, session*/
(function () {
    "use strict";
    
    // Note: These contain all the variables we will need to run this stuff.
    var testFramework = QUnit,
        serviceURI = "http://nbbedwhenshaw3.bedford.progress.com:8810/TokenConsumer",
        catalogURI = serviceURI + "/static/TokenConsumerService.json",
        tokenURI = "http://nbbedwhenshaw3.bedford.progress.com:8810/TS2/",
        authenticationModel = "SSO",
        username = "restuser",
        password = "password";
    
    function testAuthenticationProviderConstructorAndProperties(assert) {
        var prov = sso.create(tokenURI, authenticationModel);

        assert.expect(3);

        assert.equal(typeof prov, "object", "AuthenticationProvider Constructor");
        assert.equal(tokenURI, prov.uri, "uri Property");
        // Change this to be authenticationModel when the bug gets fixed
        assert.equal("sso", prov.authenticationModel, "authenticationModel Property");
        //assert.notOk(prov.hasValidRefreshCredential, "hasValidRefreshCredential Property");        
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

        assert.expect(3);

        assert.notOk(prov.hasCredential(), "hasCredential() should be false");

        sso.login(prov, username, password)
            .then(function (provider) {
                assert.ok(provider.hasCredential(), "hasCredential() should be true");
                provider.logout();
                assert.notOk(provider.hasCredential(), "hasCredential() should be false");
            }, function () {
                assert.ok(false, "login() failed, should not have gotten here");
            })
            .always(function () {
                done();
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
        assert.equal(sess.authImpl, null, "JSDOSession authImpl property");
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
                
        assert.expect(4);
        sso.login(prov, username, password)
            .then(function (provider) {
                assert.ok(provider.hasCredential(), "hasCredential() should be true in login handler");
                return session.connect(sess, provider);
            })
            .then(function (jsdosession) {
                assert.equal(jsdosession.loginResult, 1, "loginResult should be 1 in connect handler");
                return session.disconnect(sess);
            })
            .then(function (jsdosession) {
                assert.equal(jsdosession.loginResult, null, "loginResult should be null in disconnect handler");          
                return sso.logout(prov);
            })
            .then(function (provider) {
                assert.notOk(provider.hasCredential(), "hasCredential should be false in logout handler");          
               },
               function () {
                    assert.ok(false, "connect test failed, should not have gotten here");
               }
            )
            .always(function () {
                done();
            });
                
    }

    testFramework.test(
        "AuthenticationProvider Constructor And Properties Tests",
        testAuthenticationProviderConstructorAndProperties
    );
    
    testFramework.test(
        "AuthenticationProvider Constructor Negative Tests",
        negTestAuthenticationProviderConstructor
    );

    
    testFramework.test(
        "AuthenticationProvider Login Negative Tests",
        negTestAuthenticationProviderLogin
    );

    testFramework.test(
        "AuthenticationProvider Login Tests",
        testAuthenticationProviderLogin
    );
    
    testFramework.test(
        "AuthenticationProvider hasCredential and Logout Tests",
        testAuthenticationProviderLogoutAndHasCredential
    );

    testFramework.test(
        "JSDOSession Constructor Tests",
        testJSDOSessionConstructor
    );

    testFramework.test(
        "JSDOSession connect and disconnect Tests",
        testJSDOSessionConnect
    );

}());