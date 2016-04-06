/*
 Run this 3 times:
  With server up and working as expected
  With oepas1 stopped
  With oepas running but the token server not deployed
      NEED TO TEST WHEN WE GET THE REAL IMPLEMENTATION TO SEE WHAT WE GET FOR ERRORS
    
  ? Other -- no network connection?
*/

var progress = progress,
    outputMsgs = outputMsgs;

(function () {
    "use strict";
    
    var authenticationSettings = {
            authenticationURI : "http://localhost:8810/TS4/static/auth/j_spring_security_check"
        },
        correctOutputString,
        correctOutputMsgs = [
            "*",
            "* * * * * * * * * * * * * * * * * * simpleTest * * * * * * * * * * * * * * * * * ",
            "The authentication call succeeded.",
            "token: TOKEN HAS A VALUE",
            "Error thrown as expected calling authenticate() after previous success",
            "errorObject: Error: AuthenticationProvider authenticate() failed because the AuthenticationProvider is already managing a successful authentication.",
            "token: TOKEN HAS A VALUE",
            "*",
            "* * * * * * * * * * * * * * * * * * idTest * * * * * * * * * * * * * * * * * ",
            "The authentication call succeeded.",
            "token: TOKEN HAS A VALUE",
            "Error thrown as expected calling authenticate() after previous success",
            "errorObject: Error: AuthenticationProvider authenticate() failed because the AuthenticationProvider is already managing a successful authentication.",
            "token: TOKEN HAS A VALUE",
            "* * * * * * * * * * * * * * * * * * badCredentialsTest * * * * * * * * * * * * * * * * * ",
            "Call to authenticate() with bad credentials failed, result: 2",
            "token: null",
            "The authentication call succeeded.",
            "token: TOKEN HAS A VALUE"
        ],
        outputWithServerDownMsgs = [
            "*",
            "* * * * * * * * * * * * * * * * * * simpleTest * * * * * * * * * * * * * * * * * ",
            "BUG: Call to authenticate() failed unexpectedly, result: 3",
            "token: null",
            "*",
            "* * * * * * * * * * * * * * * * * * idTest * * * * * * * * * * * * * * * * * ",
            "BUG: Call to authenticate() failed unexpectedly, result: 3",
            "token: null",
            "* * * * * * * * * * * * * * * * * * badCredentialsTest * * * * * * * * * * * * * * * * * ",
            "Call to authenticate() with bad credentials failed, result: 3",
            "token: null",
            "BUG: Call to authenticate() failed, result: 3",
            "token: null"
        ],
        actualOutputMsgs = [],
        authProvider,
        msgAuthSucceeded = "The authentication call succeeded.",
        msgBUGUnexpectedFailure = "BUG: Call to authenticate() failed unexpectedly",
        msgBUGUnexpectedSuccess = "BUG: Call to authenticate() succeeded unexpectedly";

    // Put the correct output on the page for convenient reference. Also returns the output as a string
    // to save for comparison with the actual output later
    correctOutputString = outputMsgs(correctOutputMsgs, document.getElementById("correct"));

    startSimpleTest();
    
    function startSimpleTest() {
        if (!authenticationSettings.id) {  // expected on first call
            actualOutputMsgs.push("*");
            actualOutputMsgs.push("* * * * * * * * * * * * * * * * * * simpleTest * * * * * * * * * * * * * * * * * ");
        } else {
            actualOutputMsgs.push("*");
            actualOutputMsgs.push("* * * * * * * * * * * * * * * * * * idTest * * * * * * * * * * * * * * * * * ");                
        }
        simpleTest();
    }
    
    function finishSimpleTest() {
        if (authenticationSettings.id) {
            badCredentialsTest();
        } else {
            authenticationSettings.id = "42";
            startSimpleTest();
        }
    }
    
    function simpleTest() {
        var promise,
            authProvider;
            
        try {
            cleanStorage();
            
            authProvider = new progress.data.AuthenticationProvider(authenticationSettings);

            promise = authProvider.authenticate({ userName: "restuser", password: "password"});
            promise.done(function (ap, result, info) {
                logResult(msgAuthSucceeded, null, authenticationSettings);
                // test error correctly generated if call authenticate when already have token
                try {
                    authProvider.authenticate({ userName: "restuser", password: "password"})
                        .done(function (ap, result, info) {
                            logResult(msgBUGUnexpectedSuccess, null, authenticationSettings);
                            finishSimpleTest();
                        })
                        .fail(function (ap, result, info) {
                            logResult("BUG: Call to authenticate() after previous success did NOT throw error, result: " + result,
                                      info.errorObject,
                                      authenticationSettings);
                            finishSimpleTest();
                        });
                } catch(e) {
                    logResult("Error thrown as expected calling authenticate() after previous success",
                              e,
                              authenticationSettings);
                }
                finishSimpleTest();
            });
            promise.fail(function (ap, result, info) {
                logResult(msgBUGUnexpectedFailure + ", result: " + result, info.errorObject, authenticationSettings);
                finishSimpleTest();
            });

        } catch (f) {
            logResult("BUG: Error thrown calling authenticate(): ", f, authenticationSettings);
            finishSimpleTest();
        }
    }

    
    function finishBadCredentialsTest() {
        finishTest();
    }
    
    function badCredentialsTest() {
        var promise,
            authProvider;
            
        try {
            cleanStorage();

            actualOutputMsgs.push("* * * * * * * * * * * * * * * * * * badCredentialsTest * * * * * * * * * * * * * * * * * ");
            
            authenticationSettings.id = "42";
            authProvider = new progress.data.AuthenticationProvider(authenticationSettings);

            promise = authProvider.authenticate({ userName: "foo", password: "bar"});
            promise.done(function (ap, result, info) {
                logResult("BUG: Call to authenticate() with bad credentials succeeded", null, authenticationSettings);
                // now test authenticate with correct credentials
                try {
                    authProvider.authenticate({ userName: "restuser", password: "password"})
                        .done(function (ap, result, info) {
                            logResult(msgAuthSucceeded, null, authenticationSettings);
                            finishBadCredentialsTest();
                        })
                        .fail(function (ap, result, info) {
                            logResult("BUG: Call to authenticate() failed unexpectedly, result: " + result, info.errorObject, authenticationSettings);
                            finishBadCredentialsTest();
                        });
                } catch(e) {
                    logResult("BUG: Error thrown from authenticate()", e, authenticationSettings);
                    finishBadCredentialsTest();
                }
            });
            promise.fail(function (ap, result, info) {
                logResult("Call to authenticate() with bad credentials failed, result: " + result, info.errorObject, authenticationSettings);
                // now test authenticate with correct credentials
                try {
                    authProvider.authenticate({ userName: "restuser", password: "password"})
                        .done(function (ap, result, info) {
                            logResult(msgAuthSucceeded, null, authenticationSettings);
                            finishBadCredentialsTest();
                        })
                        .fail(function (ap, result, info) {
                            logResult("BUG: Call to authenticate() failed, result: " + result, info.errorObject, authenticationSettings);
                            finishBadCredentialsTest();
                        });
                } catch(e) {
                    logResult("BUG: Error thrown from authenticate() after a previous call failed",
                              e,
                              authenticationSettings);
                    finishBadCredentialsTest();
                }
            });

        } catch (f) {
            logResult("BUG: Error thrown trying to call authenticate() with bad credentials", f, authenticationSettings);
            finishBadCredentialsTest();
        }
    }

    // clean up storage (can delete this when we add the invalidate() method to AuthenticationProvider)
    function cleanStorage() {
        sessionStorage.removeItem(authenticationSettings.authenticationURI);
        sessionStorage.removeItem(authenticationSettings.id);  // in case we use the id property        
    }
    
    // clean up storage (can delete this when we add the invalidate() method to AuthenticationProvider)
    function logResult(resultMsg, errorObject, authenticationSettings) {
        var id = authenticationSettings.id || authenticationSettings.authenticationURI,
            token;
        actualOutputMsgs.push(resultMsg);
        if (errorObject) {
            actualOutputMsgs.push("errorObject: " + errorObject);           
        }
        token = sessionStorage.getItem(id);
        if (token) {
            token = "TOKEN HAS A VALUE";
        }
        actualOutputMsgs.push("token: " + token);
    }
    
    // clean up storage (can delete this when we add the invalidate() method to AuthenticationProvider)
    function logToken(authenticationSettings) {
        var id = authenticationSettings.id || authenticationSettings.authenticationURI;
        actualOutputMsgs.push("token: " + sessionStorage.getItem(id));
    }

    function finishTest() {
        var lineIdx,
            charIdx,
            msgs = [],
            outputString;
        
       // spit out the actual output. Also returns the output as a string for easy comparison
       // with the correct output, which was set into correctOutputString at the beginning of the test
        outputString = outputMsgs(actualOutputMsgs, document.getElementById("outdiv"));

        msgs.push(" ");
        if (outputString === correctOutputString) {
            msgs.push("       TEST PASSED");
        } else {
            msgs.push("       TEST FAILED !!!!!!!!!!!!!  see console for details");
            // uncomment this to identify the correct and actual output lines that don't match 
     
            for (lineIdx = 0; lineIdx < correctOutputMsgs.length; lineIdx += 1) {
                if (actualOutputMsgs[lineIdx] !== correctOutputMsgs[lineIdx]) {
                    console.log("MISMATCH ON LINE " + (lineIdx + 1) + "\n   correct: " + correctOutputMsgs[lineIdx] + "\n   actual: " + actualOutputMsgs[lineIdx]);
                    // uncomment this to identify the correct and actual output characters that don't match 

                    for (charIdx = 0; charIdx < correctOutputMsgs[lineIdx].length; charIdx += 1) {
                        if (actualOutputMsgs[lineIdx][charIdx] !== correctOutputMsgs[lineIdx][charIdx]) {
                            console.log(charIdx + "   " + actualOutputMsgs[lineIdx][charIdx] + "   " + correctOutputMsgs[lineIdx][charIdx]);
                        }
                    }

                }
            }
    
        }
        outputMsgs(msgs, document.getElementById("outdiv"));
    }


}());