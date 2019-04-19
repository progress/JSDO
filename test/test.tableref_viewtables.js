process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const chai = require("chai");
const expect = chai.expect; 
const chaiAsPromised = require("chai-as-promised");

const progress = require("../build/progress.jsdo").progress;

chai.use(chaiAsPromised);

const TABLEREF_VALUE = "ttCustomer";
const VIEW_TABLES_VALUE = "ttCustomer";

describe("JSDO Smoke Tests", () => {
    const options = {    
        catalogURI: "https://oemobiledemo.progress.com/OEMobileDemoServices/static/CustomerService.json",
        serviceURI: "https://oemobiledemo.progress.com/OEMobileDemoServices/",
        resourceName: "Customer",
        authenticationModel: "anonymous"
    };

    let session,
        jsdo,
        filterObject;

    before(function (done) {
        progress.data.getSession(options).then((object) => {
            session = object.jsdosession; 
        }).then(() => done(), () => done());    
    });

    // Logout of the session after we are done
    after((done) => {
        session.invalidate().then(() => done());
    });

    describe("JSDO Instantiation Tests", function() {
        it("should successfully create a JSDO", function() {
            jsdo = new progress.data.JSDO({name: options.resourceName});
            jsdo.viewTables = "ttCustomer";
            jsdo.subscribe("afterFill", function (jsdo, success, request) {
                filterObject = JSON.parse(request.objParam.filter);
            });
            expect(jsdo).to.be.an.instanceof(progress.data.JSDO);
        });

        it("should successfully call fill()", function() {
            let fill = jsdo.fill({
                tableRef: "ttCustomer",
                filter: {
                    field: "CustNum",
                    operator: "lte",
                    value: 11
                }                
            }).then((object) => {
                console.log("DEBUG: afterFill: ", filterObject);
                return object.success;
            });

            return expect(fill).to.eventually.be.true;
        });

        it("should have a jsdo filled with actual data from the backend", function() {
            expect(jsdo.hasData()).to.be.true;
        });

        it("should have a tableRef property with the expected string value in the filter object of the request", function() {
            expect(filterObject.tableRef).to.be.an("string").equals(TABLEREF_VALUE);
        });

        it("should have a viewTables property with the expected string value in the filter object of the request", function() {
            expect(filterObject.viewTables).to.be.an("string").equals(VIEW_TABLES_VALUE);
        });        

    });    
});