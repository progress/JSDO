/*global XMLHttpRequest:true, localStorage: true, sessionStorage: true, btoa:true*/
/*jslint nomen: true*/

(function() {
    // Pre-release code to detect enviroment and load required modules for Node.js
    // Requirements:
    // - XMLHttpRequest
    // - localStorage
    // - sessionStorage
    // - btoa

    // Notes:
    // Required packages should be installed before loading jsdo-node.
    // These packages are specified via package.json    
    // Node.js:
    // - xmlhttprequest
    // - node-localstorage
    // - base-64

    try {
        XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
        // xhrc = require("xmlhttprequest-cookie");
        // XMLHttpRequest = xhrc.XMLHttpRequest;
    } catch (e) {
        console.error("Error: JSDO library requires XMLHttpRequest object in Node.js.\n" +
            "Please install xmlhttprequest package.");
    }

    // If environment is NodeJS, load module node-localstorage
    var LocalStorage;
    if (typeof localStorage === "undefined") {
        try {
            var module = require('node-localstorage');
            LocalStorage = module.LocalStorage;
            localStorage = new LocalStorage('./scratch1');
        } catch (e) {
            console.error("Error: JSDO library requires localStorage and sessionStorage objects in Node.js.\n" +
                "Please install node-localstorage package.");
        }
    }

    if (typeof sessionStorage === "undefined" &&
        typeof LocalStorage !== "undefined") {
        sessionStorage = new LocalStorage('./scratch2');
    }

    // load module base-64
    try {
        if (typeof btoa === "undefined") {
            btoa = require("base-64").encode;
        }
    } catch (exception3) {
        console.error("Error: JSDO library requires btoa() function in Node.js.\n" +
            "Please install base-64 package.");
    }
}());