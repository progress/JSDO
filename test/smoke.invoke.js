process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const chai = require('chai');
const expect = chai.expect; 
const chaiAsPromised = require("chai-as-promised");

const progress = require("../build/progress.jsdo").progress;

chai.use(chaiAsPromised);

describe('JSDO Smoke Tests', () => {
    // INFORMATION YEAH
    const options = {    
        catalogURI: "https://10.128.57.41:65500/Sports/static/SportsService.json",
        serviceURI: "https://10.128.57.41:65500/Sports",
        resourceName: "Customer",
        authenticationModel: "anonymous"
    };

    const CustName = "SmokeTest3000";
    const newState = "NH";    

    let session,
        jsdo;

    let recordID;

    before(function (done) {
        progress.data.getSession(options).then((object) => {
            session = object.jsdosession; 
        }).then(() => done(), () => done());    
    });

    // Logout of the session after we are done
    after((done) => {
        session.invalidate().then(() => done());
    });

    describe('JSDO Instantiation Tests', function() {
        it('should successfully create a JSDO', function() {
            jsdo = new progress.data.JSDO({name: options.resourceName});
            expect(jsdo).to.be.an.instanceof(progress.data.JSDO);
        });

        it('should successfully call TestRead "11"', function() {
            let CustNum = 11;
            let fill = jsdo.invoke("TestRead", {
                filter: "" + CustNum
            }).then((object) => {
                return object.request.response.count === CustNum - 1;
            }, () => {
                return false;
            });

            return expect(fill).to.eventually.be.true;
        });

        it('should successfully call TestRead "21"', function() {
            let CustNum = 21;
            let fill = jsdo.invoke("TestRead", {
                filter: "" + CustNum
            }).then((object) => {
                return object.request.response.count === CustNum - 1;
            }, () => {
                return false;
            });

            return expect(fill).to.eventually.be.true;
        });

        it('should have a jsdo filled with actual data from the backend', function() {
            expect(jsdo.hasData()).to.be.true;
        });
    });

    describe('JSDO CUD Tests', function () {
        // Clean up the backend to make sure that there isn't an customer record with a CustNum of 3000
        // already in store
        function clean(callback) {
            jsdo.ttCustomer.foreach((customer) => {
                if (customer.data.Name === CustName) {
                    customer.remove();
                }
            });

            jsdo.saveChanges().then(() => {
                return jsdo.fill();
            }).then(() => callback());
        }
        
        before(function(done) {
            clean(done);
        });

        after(function(done) {
            clean(done);
        });

        it('should successfully create a record on the backend and update JSDO memory', function() {
            jsdo.ttCustomer.add({
                CustNum: 0,
                Name: CustName,
                SalesRep: 'NS',
                Balance: '2.10',
                State: 'MA',
            });

            let changes = jsdo._createChangeSet(jsdo._dataSetName, true);            
            let save = jsdo.invoke("TestInvoke", changes).then((object) => {
                // Use server-side ID to find record in JSDO memory
                recordID = object.request.response.dsCustomer.dsCustomer.ttCustomer[0]._id;
                let jsrecord = jsdo.findById(recordID);
                return jsrecord && (jsrecord.data.CustNum > 0) && (jsrecord.data.Name === CustName);
            });

            return expect(save).to.eventually.be.true;
        });

        it('should return the new record by reading using fill()', function() {
            let found = jsdo.fill().then((object) => {
                // Use server-side ID to find record in JSDO memory
                let jsrecord = jsdo.findById(recordID);
                return jsrecord && (jsrecord.data.CustNum > 0) && (jsrecord.data.Name === CustName);
            });

            return expect(found).to.eventually.be.true;
        });        

        it('should successfully update a record on the backend', function() {
            // Use server-side ID to find record in JSDO memory
            let jsrecord = jsdo.findById(recordID);
            jsrecord.assign({State: newState});

            let changes = jsdo._createChangeSet(jsdo._dataSetName, true);
            let save = jsdo.invoke("TestInvoke", changes).then((object) => {
                // Use server-side ID to find record in JSDO memory
                let jsrecord = jsdo.findById(recordID);
                return jsrecord 
                    && (jsrecord.data.CustNum > 0) 
                    && (jsrecord.data.Name === CustName)
                    && (jsrecord.data.State === newState);
            });

            return expect(save).to.eventually.be.true;
        });

        it('should return the updated record by reading using fill()', function() {
            let found = jsdo.fill().then((object) => {
                let found = false;
                jsdo.ttCustomer.foreach((customer) => {
                    if (customer.data.Name === CustName && customer.data.State === newState) {
                        found = true;
                    }
                });
                return found;
            });

            return expect(found).to.eventually.be.true;
        }); 

        it('should fail to update a record to have the same primary index as another record', function() {
            jsdo.ttCustomer.foreach((customer) => {
                if (customer.data.Name === CustName) {
                    customer.assign({CustNum: 1});
                }
            });

            let changes = jsdo._createChangeSet(jsdo._dataSetName, true);
            let save = jsdo.invoke("TestInvoke", changes).then((object) => {            
            // let save = jsdo.saveChanges().then((object) => {
                var success = object.success;
                try {
                    if (object.request.response.dsCustomer.dsCustomer["prods:errors"]) {
                        success = false;
                    }
                } catch (e) {
                    // Ignore
                }
                return success;
            }, function (object) {
                return object.success;
            });

            return expect(save).to.eventually.be.false;
        });

        it('should successfully delete a record on the backend', function() {
            jsdo.ttCustomer.foreach((customer) => {
                if (customer.data.Name === CustName) {
                    customer.remove();
                }
            });

            let changes = jsdo._createChangeSet(jsdo._dataSetName, true);            
            let save = jsdo.invoke("TestInvoke", changes).then((object) => {
                // Use server-side ID to find record in JSDO memory
                let found = false;
                let jsrecord = jsdo.findById(recordID);
                if (jsrecord) {
                    found = true;
                }
                return found;
            });

            return expect(save).to.eventually.be.false;
        });

        it('should not find the deleted records by reading using fill()', function() {
            let found = jsdo.fill().then((object) => {
                let found = false;
                jsdo.ttCustomer.foreach((customer) => {
                    if (customer.data.Name === CustName && customer.data.State === newState) {
                        found = true;
                    }
                });
                return found;
            });

            return expect(found).to.eventually.be.false;
        });         
    });
});