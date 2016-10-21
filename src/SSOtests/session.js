/*global progress, $*/

var session;

session = {
    
    create: function (settings) {
        "use strict";
                
        return new progress.data.JSDOSession(settings);
    },
    clearCatalogData: function () {
        "use strict";
                
        progress.data.ServicesManager._services = [];
        progress.data.ServicesManager._resources = [];
        progress.data.ServicesManager._data = [];
        progress.data.ServicesManager._sessions = [];
    },
    connect: function (jsdosession, provider) {
        "use strict";
        
        var deferred = $.Deferred();

        jsdosession.connect(provider)
            .then(function (jsdosession) {
                deferred.resolve(jsdosession);
            }, function (jsdosession, result, info) {
                deferred.reject(jsdosession, result, info);
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
    },
    login: function (jsdosession, username, password) {
        "use strict";
        
        var deferred = $.Deferred();
        
        jsdosession.login(username, password)
            .then(function (jsdosession) {
                deferred.resolve(jsdosession);
            }, function () {
                deferred.reject();
            });
            
        return deferred.promise();
    },
    addCatalog: function (jsdosession, catalogURI, options) {
        "use strict";
        
        var deferred = $.Deferred();

        jsdosession.addCatalog(catalogURI, options)
            .then(function (session, result, details) {
                deferred.resolve(session, result, details);
            }, function (session, result, details) {
                deferred.reject(session, result, details);
            });
            
        return deferred.promise();
    },
    addCatalogOld: function (jsdosession, catalogURI, username, password, options) {
        "use strict";
        
        var deferred = $.Deferred();
        
        jsdosession.addCatalog(catalogURI, username, password, options)
            .then(function (session, result, details) {
                deferred.resolve(session, result, details);
            }, function (session, result, details) {
                deferred.reject(session, result, details);
            });
            
        return deferred.promise();
    },
    logout: function (jsdosession) {
        "use strict";
        
        var deferred = $.Deferred();
        
        jsdosession.logout()
            .then(function (jsdosession) {
                deferred.resolve(jsdosession);
            }, function () {
                deferred.reject();
            });
            
        return deferred.promise();
    }

};