const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");

const progress = require("../../build/progress.jsdo").progress;

chai.use(chaiAsPromised);

describe('JSDO Setup', () => {
    // INFORMATION YEAH
    const options = {
        catalogURI: "http://172.30.112.74:8810/datetimebug/static/dtService.json",
        serviceURI: "http://172.30.112.74:8810/datetimebug/",
        resourceName: "MySalesRep",
        authenticationModel: "anonymous"
    };

    const SalesRep = "SmokeTest3000";
    const SecondSalesRep = "SmokeTest3001";
    const CustDate = "1992-11-12";
    const SecondCustDate = "1992-09-22";

    let session,
        jsdo;

    before(function (done) {
        errFunc = (err) => done(err);

        progress.data.getSession(options).then((object) => {
            session = object.jsdosession;
        }).then(() => {
            jsdo = new progress.data.JSDO({ name: options.resourceName });
            return jsdo.fill();
        }, errFunc)
        .then(() => {
            done();
        }, errFunc);
    });

    // Logout of the session after we are done
    after((done) => {
        session.invalidate().then(() => done());
    });

    describe('JFP Tests', function () {
        // Clean up the backend to make sure that there isn't an salesrep record with a CustNum of 3000
        // already in store
        function clean(callback) {
            jsdo.ttSalesrep.foreach((salesrep) => {
                if (salesrep.data.SalesRep === SalesRep || salesrep.data.SalesRep === SecondSalesRep) {
                    salesrep.remove();
                }
            });

            jsdo.saveChanges().then(() => {
                return jsdo.fill();
            }).then(() => callback());
        }

        before(function (done) {
            clean(done);
        });

        after(function (done) {
            clean(done);
        });

        it('should successfully create records on the backend', function () {
            jsdo.ttSalesrep.add({
                SalesRep: SalesRep,
                BirthDate: CustDate
            });

            jsdo.ttSalesrep.add({
                SalesRep: SecondSalesRep,
                BirthDate: SecondCustDate
            });
            let save = jsdo.saveChanges().then((object) => {

                return jsdo.fill();

            }).then((object) => {
                let found = false;
                let secondfound = false;
                jsdo.ttSalesrep.foreach((salesrep) => {
                    if (salesrep.data.BirthDate === CustDate) {
                        found = true;
                    }
                    if (salesrep.data.BirthDate == SecondCustDate) {
                        secondfound = true;
                    }
                });
                return found && secondfound;

            });

            return expect(save).to.eventually.be.true;
        });

        it('should successfully filter using a js date object on a hyphenated field', function () {
            var d = new Date("11/12/1992");
            let filter = jsdo.fill({ filter: { field: "BirthDate", operator: "eq", value: d } })
                .then((object) => {
                    let found = false;
                    jsdo.ttSalesrep.foreach((salesrep) => {
                        if (salesrep.data.BirthDate === CustDate) {
                            found = true;
                        }
                    });
                    return found;

                });
            return expect(filter).to.eventually.be.true;
        });

        it('should successfully filter using multiple js date objects on a hyphenated field', function () {
            var d = new Date("11/12/1992");
            var d2 = new Date("09/22/1992");
            let filter = jsdo.fill({
                logic: "or",
                filters: [
                    { field: "BirthDate", operator: "eq", value: d },
                    { field: "BirthDate", operator: "eq", value: d2 }
                ]
            })
                .then((object) => {
                    let found = false;
                    let secondfound = false;
                    jsdo.ttSalesrep.foreach((salesrep) => {
                        if (salesrep.data.BirthDate === CustDate) {
                            found = true;
                        }
                        if (salesrep.data.BirthDate == SecondCustDate) {
                            secondfound = true;
                        }
                    });
                    return found && secondfound;

                });
            return expect(filter).to.eventually.be.true;
        });
    });
});