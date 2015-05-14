(function () {
    function initialize() {
        try {
            if (typeof(myApp) === "undefined") {
                myApp = {};                
            }

            myApp.isAnonymous = function() {
                // authenticationModel defaults to "ANONYMOUS"
                if (!jsdoSettings.authenticationModel || 
                     jsdoSettings.authenticationModel.toUpperCase() === "ANONYMOUS") {
                    return true;
                } 

                return false;
            };

            myApp.showError = function (message){
                navigator.notification.alert(message);
            };
            
            loginDataSource();
            listDataSource();
            
            progress.util.jsdoSettingsProcessor(jsdoSettings);

            if (!jsdoSettings.authenticationModel) {
                console.log("Warning: jsdoSettings.authenticationModel not specified. Default is ANONYMOUS");
            }

            if (jsdoSettings.serviceURI) {
                myApp.jsdosession = new progress.data.JSDOSession(jsdoSettings);
            }
            else {
                console.log("Error: jsdoSettings.serviceURI must be specified.");
            }
        } 
        catch(ex) { 
            console.log("Error creating JSDOSession: " + ex);        
        }    

        if (myApp.jsdosession && myApp.isAnonymous()) {    
            // Login as anonymous automatically, data will be available on list page
            $('#loginIcon').hide();
            myApp.loginModel.login();
        }
        
        app = new kendo.mobile.Application(document.body, {skin: "flat", transition:'slide', initial: "views/home.html", layout: "tabstrip-layout" });
    }
    
    document.addEventListener("deviceready", initialize);
}());
