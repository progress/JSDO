const chai = require('chai');
const expect = chai.expect; 
const chaiAsPromised = require('chai-as-promised');

const progress = require("../build/progress.jsdo").progress;

chai.use(chaiAsPromised);

describe('JSDOSession Smoke Tests', () => {
    // INFORMATION YEAH
    const options = {    
        catalogURI: 'https://oemobiledemo.progress.com/OEMobileDemoServices/static/CustomerService.json',
        serviceURI: 'https://oemobiledemo.progress.com/OEMobileDemoServices/',
        authenticationModel: 'anonymous'
    };

    let session;

    // Logout of the session after we are done
    after((done) => {
        session.invalidate().then(() => done());
    });

    describe('getSession Tests', function () {
        it('should fail to connect to a non-existent backend', function () {
            let getSession = progress.data.getSession({
                serviceURI: options.serviceURI + 'fake',
                catalogURI: options.catalogURI,
                authenticationModel: options.authenticationModel
            }).then((object) => {
                return expect.fail(null, null, 'getSession succeeded on a non-existent backend?');
            }, (object) => {
                return object.result;
            }); 

            return expect(getSession).to.eventually.equal(progress.data.Session.GENERAL_FAILURE);
        });

        it('should connect to an existing basic backend', function () {
            let getSession = progress.data.getSession({
                serviceURI: 'https://oemobiledemo.progress.com/OEMobileDemoServicesBasic',
                catalogURI: 'https://oemobiledemo.progress.com/OEMobileDemoServicesBasic/static/CustomerService.json',
                authenticationModel: 'basic',
                username: 'basicuser',
                password: 'basicpassword'
            }).then((object) => {
                object.jsdosession.invalidate();
                return object.result; 
            });

            return expect(getSession).to.eventually.equal(progress.data.Session.SUCCESS);
        });

        it('should connect to an existing anonymous backend', function () {
            let getSession = progress.data.getSession(options).then((object) => {
                session = object.jsdosession;
                return object.result; 
            });

            return expect(getSession).to.eventually.equal(progress.data.Session.SUCCESS);
        });
    });

    describe('JSDOSession API Tests', function () {
        it('should successfully ping() the backend', function() {
            let ping = session.ping().then((object) => {
                return true;
            });

            return expect(ping).to.eventually.equal(true);
        });

        it('should have a successful call to isAuthorized()', function() {
            let isAuthorized = session.isAuthorized().then((object) => {
                // If we have successfully logged into the backend, the result
                // of our ping() should be true
                return object.result;
            });

            return expect(isAuthorized).to.eventually.equal(progress.data.Session.SUCCESS);
        });

        it('should not have a connection to the backend after an invalidate', function() {
            let isAuthorized = session.invalidate().then(() => {
                return session.isAuthorized();  
            }).then((object) => {
                return object.result;
            }, function(object) {
                return object.result
            });

            return expect(isAuthorized).to.eventually.equal(progress.data.Session.GENERAL_FAILURE);
        })
    });
});