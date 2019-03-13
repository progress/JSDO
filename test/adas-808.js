const chai = require('chai');
const expect = chai.expect; 
const chaiAsPromised = require("chai-as-promised");

const progress = require("../build/progress.jsdo").progress;

chai.use(chaiAsPromised);

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

describe('JSDO Smoke Tests', () => {
    // INFORMATION YEAH
    const options = {    
        catalogURI: "https://oemobiledemo.progress.com/OEMobileDemoServices/static/SportsService.json",
        serviceURI: "https://oemobiledemo.progress.com/OEMobileDemoServices/",
        resourceName: "Customer",
        authenticationModel: "anonymous"
    };

    let session,
        jsdo;

    before(function (done) {
        progress.data.invalidateAllSessions();
        progress.data.getSession(options).then((object) => {
            console.log("we created a JSDOSESSION");
            session = object.jsdosession; 
        }, (obj) => {
            console.log("we did not create a JSDOSESSION");
            console.log(obj);
        }).then(() => done(), () => done());    
    });

    // Logout of the session after we are done
    after((done) => {
        session.invalidate().then(() => done());
    });

    describe('JSDO Instantiation Tests', function() {
        it('should successfully call ping()', function() {
            let ping = session.ping().then((obj) => {
                console.log(obj.result);
                console.log(obj.info);
                return obj.result;
            });

            return expect(ping).to.eventually.be.true;
        });
    });
});