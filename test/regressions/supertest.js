const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");

const progress = require("../../build/progress.jsdo").progress;

chai.use(chaiAsPromised);

describe('ADAS-9501 - Refresh After Timeout Bjorks The Session', function () {
    // INFORMATION YEAH
    const options = {
        catalogURI: "http://172.29.16.228:8810/Customer/static/CustomerService.json",
        serviceURI: "http://172.29.16.228:8810/Customer/",
        resourceName: "Customer",
        username: "restuser",
        password: "password",
        authenticationModel: "form"
    };

    describe('Timeout Tests', function () {
        it('should succesfully get a session and stuff ', function () {
            let getSession = progress.data.getSession(options).then(
                () => true, 
                () => false);

            return expect(getSession).to.eventually.be.true;
        });

        it('should timeout after 3 minutes', function () {
            // Disables timeout
            this.timeout(0);
            
            // Resolve a promise after 3 minutes
            let timeout = new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(true);
                }, 180000);
            });

            return expect(timeout).to.eventually.be.true;
        });

        it('should successfully  be able to re-login after 3 minutes', function () {
            let getSession = progress.data.getSession(options).then(
                () => true, 
                () => false);

            return expect(getSession).to.eventually.be.true;             
        });
    });
});