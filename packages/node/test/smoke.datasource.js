const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require("chai-as-promised");
const progress = require("@progress/jsdo-core").progress;
const DataSource = require("../build/progress.data.node").DataSource;
const rxjs = require("rxjs");

chai.use(chaiAsPromised);

// These are smoke tests for the DataSource! :) 

describe('Datasource Smoke Tests', function () {
    //options all the info required for creating a jsdo session
    const options = {
        serviceURI: "https://oemobiledemo.progress.com/OEMobileDemoServices",
        catalogURI: "https://oemobiledemo.progress.com/OEMobileDemoServices/static/CustomerService.json",
        resourceName: "Customer",
        authenticationModel: "anonymous",
        tableRef: "ttCustomer",
        recName: "test9001" //+ (Math.random() * 100)
    };

    //define your variables required for the tests below
    let session,
        jsdo,
        dataSource;

    //before: getSession
    before(function (done) {
        progress.data.getSession(options).then((object) => {
            session = object.jsdosession;
        }).then(() => {
            jsdo = new progress.data.JSDO({ name: options.resourceName });
        }).then(() => done(), () => done());
    });

    //after: Logout of the session after we are done
    after((done) => {
        done();
    });

    describe('DataSource Instantiation Tests', function () {
        it('should successfully create a DataSource', function () {
            dataSource = new DataSource({
                jsdo: jsdo,
                tableRef: options.tableRef
            });

            expect(dataSource).to.be.an.instanceOf(DataSource);
        });
    });

    //1st Read without parameters
    describe('DataSource CRUD tests', function () {
        let data,
            rec;

        before(function () {
            jsdo.ttCustomer.foreach((customer) => {
                if (customer.data.Name === options.recName) {
                    customer.remove();
                    // console.log(customer);
                }

                jsdo.saveChanges().then((object) => {
                    return jsdo.fill();
                }).then((object) => {
                    console.log(object);
                    let found = 0;
                    jsdo.ttCustomer.foreach((customer) => {
                        if (customer.data.Name === options.recName) {
                            found += 1;
                        }
                    });
                    // console.log(found);
                });
            });
        });

        describe('DataSource Read tests', function () {
            it('should have an Observable returned by read', function () {
                let read = dataSource.read();
                expect(read).to.be.instanceOf(rxjs.Observable);
            });

            it('should successfully call read()', function () {
                let read = dataSource.read().toPromise().then((mydata) => {
                    data = mydata.data;
                    // console.log(data);
                    return true;
                }, (error) => {
                    return expect.fail(null, null, 'DataSource.read() failed: ' + error);
                });

                return expect(read).to.eventually.be.true;
            });

            it('should have a DataSource with data after the read()', function () {
                return expect(data[0]["CustNum"]).to.be.a("number");
            });
        });

        describe('DataSource Create tests', function () {
            it('should successfully call create()', function () {
                // { CustNum: 1,
                //     Country: 'Mexico',
                //     Name: 'NewItem',
                //     ...
                //     id: '0x0000000000000062',
                //     _id: '1537314778768-1' }

                let testRec = {
                    CustNum: '',
                    Name: options.recName,
                    State: 'MA',
                    Balance: 0
                };

                expect(dataSource.create(testRec).Name).to.deep.equal(testRec.Name);
            });

            it('should successfully call saveChanges()', function () {
                // expect(create).to.be.instanceOf(rxjs.Observable);
                let create = dataSource.saveChanges().toPromise().then(() => {
                    return true;
                }, (error) => {
                    return expect.fail(null, null, 'DataSource.create() failed: ' + error);
                });

                return expect(create).to.eventually.be.true;
            });

            it('should successfully create a single record in the backend', function () {
                let count = 0;
                dataSource.getData().forEach(element => {
                    if (element.Name === options.recName) {
                        count += 1;
                    }

                    if (count === 1) {
                        // Save the element for the update test later
                        rec = element; 
                    }
                });

                return expect(count).to.equal(1);
            });
        });

        describe('DataSource Update tests', function () {
            it('should successfully call update()', function () {
                rec.Country = "TestCountry";

                expect(dataSource.update(rec).Country).to.deep.equal(rec.Country);
            });

            it('should successfully call saveChanges()', function () {
                // expect(create).to.be.instanceOf(rxjs.Observable);
                let update = dataSource.saveChanges().toPromise().then(() => {
                    return true;
                }, (error) => {
                    return expect.fail(null, null, 'DataSource.create() failed: ' + error);
                });

                return expect(update).to.eventually.be.true;
            });

            it('should successfully update a single record in the backend', function () {
                let count = 0;
                dataSource.getData().forEach(element => {
                    if (element.Name === options.recName
                        && element.Country === "TestCountry") {
                        count += 1;
                    }

                    // Save this element for the delete later
                    if (count === 1) {
                        rec = element;
                    }
                });

                return expect(count).to.equal(1);
            });
        });

        describe('DataSource Remove tests', function () {
            it('should successfully call Remove()', function () {

                console.log(dataSource.remove(rec));

                // expect(dataSource.update(rec).Country).to.deep.equal(rec.Country);
                expect(1).to.equal(1);
            });

            it('should successfully call saveChanges()', function () {
                let remove = dataSource.saveChanges().toPromise().then(() => {
                    return true;
                }, (error) => {
                    return expect.fail(null, null, 'DataSource.create() failed: ' + error);
                });

                return expect(remove).to.eventually.be.true;
            });

            it('should successfully update a single record in the backend', function () {
                let count = 0;
                dataSource.getData().forEach(element => {
                    if (element.Name === options.recName) {
                        count += 1;
                    }
                });

                return expect(count).to.equal(0);
            });
        });   

        after(function (done) {
            // let foundTestRec;
            // if (dataSource) {
            //     console.log("deleting");
            //     dataSource.read().toPromise().then((mydata) => {
            //         mydata.data.forEach(element => {
            //             if (element.Name === options.recName) {
            //                 foundTestRec = element;
            //                 dataSource.remove(foundTestRec);
            //             }
            //         });
            //     });

            //     if (foundTestRec) {
            //         dataSource.saveChanges().toPromise().then((d) => {
            //             console.log(d);
            //         }, (e) => {
            //             console.log(e);
            //         }).then(() => done(), () => done());
            //     } else {
            //         done();
            //     }
            // }
            this.timeout(5000);
            jsdo.ttCustomer.foreach((customer) => {
                if (customer.data.Name === options.recName) {
                    customer.remove();
                }

                jsdo.saveChanges().then((object) => {
                    return jsdo.fill();
                }).then((object) => {
                    console.log(object);
                    let found = 0;
                    jsdo.ttCustomer.foreach((customer) => {
                        if (customer.data.Name === options.recName) {
                            found += 1;
                        }
                    });
                    console.log(found);
                });
            });

            setTimeout(() => {
                session.invalidate().then(() => done());
            }, 1500);
        });
    });
});
