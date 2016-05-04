var progress = progress,
    outputMsgs = outputMsgs;

(function () {
    "use strict";
    
    var tokenSession,
        _foo,
        msgs = [],
        tokenServerURI = "http://nbbedwhenshaw2.bedford.progress.com:8810/TokenServer/web/getcp",


        authenticationSettings = {
            authenticationURI : "http://nbbedwhenshaw2.bedford.progress.com:8810/TokenServer/web/getcp"
        },
        authenticationSettings2 = {
            authenticationURI : "TEST2",
            tokenLocation : {
                headerName : "foobar"
            }
        },
        jsdoSettings = {
            serviceURI : "http://nbbedwhenshaw2.bedford.progress.com:8810/StarNovaWH",
            authenticationModel : "form"
        },
        correctOutputString,
        correctOutputMsgs = [
            "true",
            "X-OE-CLIENT-CONTEXT-ID",
            "http://nbbedwhenshaw2.bedford.progress.com:8810/TokenServer/web/getcp",
            "true",
            "foobar",
            "TEST2",
            "Error: Too few arguments. There must be at least 1.",
            "Error: AuthenticationProvider: Constructor method has argument 'options' that is missing property 'authenticationURI'.",
            "true",
            "http://nbbedwhenshaw2.bedford.progress.com:8810/StarNovaWH"
        ],
        actualOutputMsgs = [],
        authProvider,
        jsdoSession,
        jsdo,
        e;


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
    /* 
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
    */
        }
        outputMsgs(msgs, document.getElementById("outdiv"));
    }


    // Put the correct output on the page for convenient reference. Also returns the output as a string
    // to save for comparison with the actual output later
    correctOutputString = outputMsgs(correctOutputMsgs, document.getElementById("correct"));



    try {
        authProvider = new progress.data.AuthenticationProvider(authenticationSettings);

        actualOutputMsgs.push(authProvider instanceof progress.data.AuthenticationProvider);

        actualOutputMsgs.push(authProvider.tokenLocation.headerName);
        actualOutputMsgs.push(authProvider.authenticationURI);

        authProvider = new progress.data.AuthenticationProvider(authenticationSettings2);

        actualOutputMsgs.push(authProvider instanceof progress.data.AuthenticationProvider);

        actualOutputMsgs.push(authProvider.tokenLocation.headerName);
        actualOutputMsgs.push(authProvider.authenticationURI);
        try {
            authProvider = new progress.data.AuthenticationProvider();
        } catch (e1) {
            actualOutputMsgs.push(e1);
        }

        try {
            authProvider = new progress.data.AuthenticationProvider({});
        } catch (e2) {
            actualOutputMsgs.push(e2);
        }

        try {
            jsdoSession = new progress.data.JSDOSession(jsdoSettings);
            actualOutputMsgs.push(jsdoSession instanceof progress.data.JSDOSession);
            actualOutputMsgs.push(jsdoSession.serviceURI);
        } catch (e3) {
            actualOutputMsgs.push(e3);
        }


        finishTest();

    } catch (f) {
        actualOutputMsgs.push("Error calling login: " + f);
        finishTest();
    }


}());