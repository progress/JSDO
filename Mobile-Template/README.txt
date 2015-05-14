

This template allows you to quickly connect a mobile app to an existing remote data service. 
 
It makes use of the JavaScript Data Object dialect of the Kendo UI DataSource to provide data to the app's default listview control, which, 
in turn, utilizes the JavaScript data object (JSDO) to access the data and operations of a Mobile resource provided by a remote data service.

In order to create and use the JSDO Dialect of the DataSource, and ultimately access the remote data service, the user must log in, 
and optionally provide credentials. The template code instantiates an underlying progress.data.JSDOSession object providing this support. 
This template's session-enabled support provides a default login page (only displayed for authenticationModels of type "basic" or "form").

The jsdoSettings object (found in scripts/jsdoSettings.js) allows you to easily specify properties for the remote data service. 
In order to run your app, you must set the properties in the jsdoSettings object.


jsdoSettings properties:
------------------------

serviceURI:  Set this to your remote data service. It's the URI of the Web application that hosts the remote data service for which to start 
             the user login session.
			 Ex. http://Your-IP-Address:8980/MyMobileWebAppl

catalogURIs: Specify one (or more) JSDO Catalog pathnames that describe the Mobile services provided by the remote data service. 
If more than one specified, use comma-separated list.
             
resourceName: The name of the resource (found in a JSDO Catalog file) for which the underlying JSDO instance is created.

authenticationModel: Should be set to either: "anonymous", "basic", or "form". If not specified, it's defaulted to "anonymous". 
                     It specifies the type of authentication that the backend server requires.
                     
displayFields: Specify one (or more) field names found in the specified resource. This field will be displayed on the list page 
               for each row retrieved from the remote data service. Note: The current template version only uses the first field 
               name specified.


Example jsdoSettings object follows:
/*
var jsdoSettings = {
      "serviceURI": "http://oemobiledemo.progress.com/CustomerService",
      "catalogURIs": "http://oemobiledemo.progress.com/CustomerService/static/mobile/CustomerService.json",     
      "authenticationModel": "Anonymous",
      "displayFields": "Name",
      "resourceName": "Customer"
}; 
 */
 
 