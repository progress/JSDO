const chai = require('chai');
const expect = chai.expect; 

const progress = require("../lib/progress.jsdo").progress;

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

    var session;

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


    // Our first test.
    describe('Ping Test', () => {
        it('should have a successful connection to the backend', function(done) {
            session.ping().then((object) => {
                // If we have successfully logged into the backend, the result
                // of our ping() should be true
                expect(object.result).to.be.true;
            }).then(done, done);

        });
    });
});