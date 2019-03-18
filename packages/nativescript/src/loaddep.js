// loaddep.js 

/*global localStorage: true, sessionStorage: true, btoa:true*/
/*jslint nomen: true*/

(function () {
    // Code to detect enviroment and load required modules for NativeScript
    // Requirements:
    // - XMLHttpRequest (built-in in NativeScript)
    // - localStorage
    // - sessionStorage
    // - btoa

    // Notes:
    // Required packages should be installed before loading jsdo-nativescript.
    // These packages are specified via package.json
    // NativeScript:
    // - nativescript-localstorage
    // - base-64

    try {
        // load module nativescript-localstorage
        if (typeof sessionStorage === "undefined") {
            sessionStorage = require("nativescript-localstorage");
        }
        if (typeof localStorage === "undefined") {
            localStorage = require("nativescript-localstorage");
        }
    } catch(exception2) {
        console.error("Error: JSDO library requires localStorage and sessionStorage objects in NativeScript.\n"
            + "Please install nativescript-localstorage package.");
    }

    // load module base-64
    try {
        if (typeof btoa === "undefined") {
            btoa = require("base-64").encode;
        }
    } catch(exception3) {
        console.error("Error: JSDO library requires btoa() function in NativeScript.\n"
            + "Please install base-64 package.");
    }
}());
