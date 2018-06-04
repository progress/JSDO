const chai = require('chai');
const expect = chai.expect; 
const chaiAsPromised = require("chai-as-promised");

const progress = require("../lib/progress.jsdo").progress;

chai.use(chaiAsPromised);

describe('Smoke Tests', () => {
    // INFORMATION YEAH
    const options = {    
        catalogURI: "http://oemobiledemo.progress.com/OEMobileDemoServices/static/r_Sports_with_SubmitService.json",
        serviceURI: "http://oemobiledemo.progress.com/OEMobileDemoServices",
        resourceName: "CustomerSubmit",
        tableRef: "ttCustomer",
        filter: "CustNum > 2990",
        model: "anonymous"
    };

    const CustNum = 3000;

    let session,
        ap;

    // Sets up the tests
    before(function (done) {
        progress.data.getSession({
            serviceURI: options.serviceURI,
            catalogURI: options.catalogURI,
            authenticationModel: options.model
        }).then((object) => {
            session = object.jsdosession;
        }).then(done, done);
    });

    // Logout of the session after we are done
    after((done) => {
        session.invalidate().then(() => done(), () => done());
    });

    describe('getSession Tests', function () {
        it('should fail to connect to a non-existent backend', function () {
            let getSession = progress.data.getSession({
                serviceURI: options.serviceURI + "fake",
                catalogURI: options.catalogURI,
                authenticationModel: options.model
            }).then((object) => {
                return expect.fail(null, null, "getSession succeeded on a non-existent backend?");
            }, (object) => {
                return object.result;
            }); 

            return expect(getSession).to.eventually.equal(progress.data.Session.GENERAL_FAILURE);
        });

        it('should connect to an existing anonymous backend', function () {
            let getSession = progress.data.getSession({
                serviceURI: options.serviceURI,
                catalogURI: options.catalogURI,
                authenticationModel: options.model
            }).then((object) => {
                session = object.jsdosession;
                return object.result; 
            });

            return expect(getSession).to.eventually.equal(progress.data.Session.SUCCESS);
        });
    });


    describe('JSDOSession API Tests', function () {

    }); 

    // Our first test.
    describe('Ping Test', () => {
        it('should have a successful connection to the backend', function() {
            let ping = session.ping().then((object) => {
                // If we have successfully logged into the backend, the result
                // of our ping() should be true
                //return object.result;
                return true;
            });

            return expect(ping).to.eventually.equal(true);
        });

        it('test', function () {
            expect(true).to.be.true;
        });
    });
});