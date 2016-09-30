/*global progress, $*/

var session;

session = {
    create: function (settings) {
        "use strict";
                
        return new progress.data.JSDOSession(settings);
    },
    connect: function (jsdosession, provider) {
        "use strict";
        
        var deferred = $.Deferred();
        
        jsdosession.connect(provider)
            .then(function (jsdosession) {
                deferred.resolve(jsdosession);
            }, function () {
                deferred.reject();
            });
            
        return deferred.promise();
    },
    disconnect: function (jsdosession) {
        "use strict";
        
        var deferred = $.Deferred();
        
        jsdosession.disconnect()
            .then(function (jsdosession) {
                deferred.resolve(jsdosession);
            }, function () {
                deferred.reject();
            });
            
        return deferred.promise();
    }

};