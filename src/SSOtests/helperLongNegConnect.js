/*global sso, QUnit, session, $, progress*/
(function () {
    "use strict";
    
    // Note: These contain all the variables we will need to run this stuff.
    var testFramework = QUnit,
        serviceURI = "http://nbbedwhenshaw3.bedford.progress.com:8810/TokenConsumer",
        catalogURI = serviceURI + "/static/TokenConsumerService.json",
        tokenURIShort = "http://nbbedwhenshaw3.bedford.progress.com:8810/TSShortExpire/",
        authenticationModel = "SSO",
        username = "restuser",
        password = "password";
    
    function negTestJSDOSessionConnect(assert) {
        var prov = sso.create(tokenURIShort, authenticationModel),
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
                // delay longer than the timeout period for the Token server session
                setTimeout(function () {
                    session.connect(sess, prov)
                        .then(function (provider) {
                            assert.ok(false, "Error - connect() should have failed due to session timeout");
                        },
                            function () {
                                assert.ok(true, "connect failed after session timeout");
                                assert.equal(sess.authImpl, null,
                                             "JSDOSession authImpl is null after failed connect ");
                                return sso.logout(provider);
                            })
                        .always(function () {
                            done();
                        });
                },
                    80000);
            },
                function (provider) {
                    assert.ok(false, "test failed because login failed, should not be here");
                });
    }
    
        
    testFramework.module("Module 4, lengthy negative JSDOSession connect");
    testFramework.test(
        "negTestJSDOSessionConnect: error conditions for connect",
        negTestJSDOSessionConnect
    );

}());