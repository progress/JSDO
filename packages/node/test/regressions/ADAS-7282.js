const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
const progress = require("@progress/jsdo-core").progress;
const DataSource = require("../../build/progress.data.node").DataSource;

chai.use(chaiAsPromised);

// This bug relates to ADAS-7282
// This removes the functionality from the DataSource of count always being used
// if there was a count functionality present in the catalog, which is bad.

//First describe 
describe('ADAS-7282: DataSource invokes count operation bug', function () {
    //options all the info required for creating a jsdo session
    const options = {
        serviceURI: "http://172.29.18.125:8894/OEMobileDemoServices",
        catalogURI: "http://172.29.18.125:8894/OEMobileDemoServices/static/SportsService.json",
        resourceName: "SalesRep",
        authenticationModel: "anonymous",
        tableRef: "ttSalesRep"
    };

    //define your variables required for the tests below
    let session,
        jsdo,
        dataSource;

    //before: getSession
    before(function (done) {
        progress.data.getSession(options).then((object) => {
            session = object.jsdosession;
        }).then(() => done(), () => done());
    });

    //after: Logout of the session after we are done
    after((done) => {
        session.invalidate().then(() => done());
    });


    //Second describe for CRUD tests
    describe('JSDO Instantiation Tests', function () {
        it('should successfully create a JSDO', function () {
            jsdo = new progress.data.JSDO({ name: options.resourceName });
            expect(jsdo).to.be.an.instanceof(progress.data.JSDO);
            dataSource = new DataSource({
                jsdo: jsdo,
                tableRef: "ttSalesrep"
            });
        });
    });

    //1st Read without parameters
    describe('read() without params', function () {
        let data;

        //1st it ()   
        it('should successfully call read()', function (done) {
            let read = dataSource.read().toPromise()
                .then((mydata) => {
                    return true;
                }, (error) => {
                    return expect.fail(null, null, 'read({}) did not succeed: ' + error);

                });

            expect(read).to.eventually.be.true.notify(done);
        });


        //2nd it ()
        it('should successfully call read({})', function (done) {
            let read = dataSource.read({}).toPromise()
                .then((mydata) => {
                    data = mydata.data;
                    return true;
                }, (error) => {
                    return expect.fail(null, null, 'read({}) did not succeed: ' + error);
                });

            expect(read).to.eventually.be.true.notify(done);
        });

        it('should have a read() that successfully grabs data', function () {
            expect(data).to.be.an.instanceOf(Array);
        });
    });

});
