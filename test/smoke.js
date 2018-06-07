const chai = require('chai');
const expect = chai.expect; 
const chaiAsPromised = require("chai-as-promised");

const progress = require("../lib/progress.jsdo").progress;

chai.use(chaiAsPromised);

// Might be a good idea to separate this into their own files down the line! It should be
// relatively easy.

describe('Smoke Tests', () => {
    // INFORMATION YEAH
    const options = {    
        catalogURI: "https://oemobiledemo.progress.com/OEMobileDemoServices/static/CustomerService.json",
        serviceURI: "https://oemobiledemo.progress.com/OEMobileDemoServices",
        resourceName: "Customer",
        tableRef: "ttCustomer",
        filter: "CustNum > 2990",
        model: "anonymous"
    };

    const CustName = "SmokeTest3000";

    let session,
        jsdo;

    // Logout of the session after we are done
    after((done) => {
        session.invalidate().then(() => done());
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

        it('should connect to an existing basic backend', function () {
            let getSession = progress.data.getSession({
                serviceURI: "http://oemobiledemo.progress.com/OEMobileDemoServicesBasic/",
                catalogURI: "http://oemobiledemo.progress.com/OEMobileDemoServicesBasic/static/CustomerService.json",
                authenticationModel: "basic",
                username: "basicuser",
                password: "basicpassword"
            }).then((object) => {
                object.jsdosession.invalidate();
                return object.result; 
            });

            return expect(getSession).to.eventually.equal(progress.data.Session.SUCCESS);
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


    describe('JSDO Tests', function () {
        describe('JSDO Instantiation Tests', function() {
            it('should successfully create a JSDO', function() {
                jsdo = new progress.data.JSDO({name: options.resourceName});
                expect(jsdo).to.be.an.instanceof(progress.data.JSDO);
            });
    
            it('should successfully call fill()', function() {
                let fill = jsdo.fill().then((object) => {
                    return object.success;
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


            it('should successfully create a record on the backend', function() {
                jsdo.ttCustomer.add({
                    Name: CustName,
                    SalesRep: 'NS',
                    Balance: '2.10',
                    State: 'MA',
                });

                let save = jsdo.saveChanges().then((object) => {
                    return jsdo.fill();
                }).then((object) => {
                    let found = false;
                    jsdo.ttCustomer.foreach((customer) => {
                        if (customer.data.Name === CustName) {
                            found = true;
                        }
                    });
                    return found;
                });

                return expect(save).to.eventually.be.true;
            });

            it('should successfully update a record on the backend', function() {
                const newState = "NH";
                jsdo.ttCustomer.foreach((customer) => {
                    if (customer.data.Name === CustName) {
                        customer.assign({State: newState});
                    }
                });

                let save = jsdo.saveChanges().then((object) => {
                    return jsdo.fill();
                }).then((object) => {
                    let found = false;
                    jsdo.ttCustomer.foreach((customer) => {
                        if (customer.data.Name === CustName && customer.data.State === newState) {
                            found = true;
                        }
                    });
                    return found;
                });

                return expect(save).to.eventually.be.true;
            });

            it('should fail to update a record to have the same primary index as another record', function() {
                jsdo.ttCustomer.foreach((customer) => {
                    if (customer.data.Name === CustName) {
                        customer.assign({CustNum: 1});
                    }
                });

                let save = jsdo.saveChanges().then((object) => {
                    return object.success;
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

                let save = jsdo.saveChanges().then((object) => {
                    return jsdo.fill();
                }).then((object) => {
                    let found = false;
                    jsdo.ttCustomer.foreach((customer) => {
                        if (customer.data.Name === CustName) {
                            found = true;
                        }
                    });
                    return found;
                });

                return expect(save).to.eventually.be.false;
            });
        });
    }); 

    describe('JSDOSession API Tests', function () {
        it('should successfully ping() the backend', function() {
            let ping = session.ping().then((object) => {
                // If we have successfully logged into the backend, the result
                // of our ping() should be true
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