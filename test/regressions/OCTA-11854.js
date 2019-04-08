const chai = require('chai');
const expect = chai.expect; 
const chaiAsPromised = require('chai-as-promised');

const progress = require("../../build/progress.jsdo").progress;

chai.use(chaiAsPromised);

// This bug correlates to https://github.com/progress/JSDO/issues/231
// Basically, international characters weren't being properly encoded in the
// Authorization header for BASIC authentication. We switched to properly
// encoding it using the node Buffer().toString('base64') method.
describe('Unit Tests for BASIC Authentication with International Characters', () => {
    // INFORMATION YEAH
    const options = {
        catalogURI: 'https://oemobiledemo.progress.com/OEMobileDemoServicesBasic/static/CustomerService.json',
        serviceURI: 'https://oemobiledemo.progress.com/OEMobileDemoServicesBasic/',
        authenticationModel: 'basic',
        username: 'basicusÃ©',
        password: 'pÃ¤word'
    };

    let session;

    // Logout of the session after we are done
    after((done) => {
        session.invalidate().then(() => done());
    });

    describe('getSession Tests', function () {
        it('should connect to an existing basic backend', function () {
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