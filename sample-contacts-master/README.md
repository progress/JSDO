sample-contacts
===============
<a href="https://platform.telerik.com/#appbuilder/clone/https%3A%2F%2Fgithub.com%2FCloudDataObject%2FJSDO%2Fsample-contacts" target="_blank"><img src="http://docs.telerik.com/platform/appbuilder/sample-apps/images/try-in-appbuilder.png" alt="Try in AppBuilder" title="Try in AppBuilder" /></a>

This sample application demonstrates the usage of the Apache Cordova Contacts core plugin.

## The Contacts Apache Cordova Plugin

With the Contacts plugin, you can access the contacts database of the mobile device. You can add new entries to the database, search in the existing contacts and select entries from the database.

## Sample Overview

This sample shows how to use the methods of the Contacts plugin. It lets you create new contacts and find, clone and delete existing entries in the database. A text box prints information about your last operation.

This sample shows how to use the following plugin objects and methods.

* `navigator.contacts`: A global object that provides access to the contacts database of the device. The object becomes available after the `deviceready` event.
* `navigator.contacts.create`: Creates a new `contact` object but does not save it in the contacts database. The object is saved later using the `save` method. The method is synchronous.
* `navigator.contacts.find`: Queries the contacts database and returns an array of `contact` objects. The method is asynchronous.

> Always attach a `deviceready` event first to ensure that Apache Cordova is fully loaded. The `deviceready` event fires when Apache Cordova is fully loaded. After the `deviceready` has fired, you can safely attach other events.

For more implementation details, review [main.js](contacts sample/scripts/main.js) and the code comments inside.

## Cloning the Sample

You can clone this sample in Telerik AppBuilder, explore and modify the code, and build and run it on Android, iOS and Windows Phone 8 devices.

### Clone the sample app in the AppBuilder in-browser client

1. In your browser, verify that you are logged in the Telerik Platform and you have switched to the account in which you want to develop your application.
1. In the account dashboard, click the workspace in which you want to develop your application.
1. Click **Create project**.
1. Select **AppBuilder Hybrid project**.
1. Select **Start from sample project**.
1. Select **Core APIs**.
1. Select **Contacts**.
1. (Optional) Rename the project.
1. (Optional) Update the description.
1. Click **Create Project**.

### Clone a sample app in the AppBuilder Windows client

1. Verify that the AppBuilder Windows client is running and you are logged in the Telerik Platform in the account in which you want to develop your application.
1. In the dashboard, click **Samples** and select **Hybrid**.
1. From the **App** drop-down menu, select the workspace in which you want to develop your application.
1. Select **Core APIs**.
1. Select **Contacts**.
1. (Optional) Rename the project.
1. Click **Clone**.

### Clone a sample app in the AppBuilder extension for Visual Studio

1. Select **AppBuilder** &#8594; **Get Sample**.
1. Select **Hybrid**.
1. Select **Core APIs**.
1. Select **Contacts**.
1. (Optional) Rename the project.
1. Click **Get**.

The extension for Visual Studio copies the sample files locally. The extension creates a new solution and project and loads them.

### Clone a sample app in the AppBuilder command-line interface

1. To list the available samples, run the following command.

	```bash
	appbuilder sample
	```
1. Run the clone command for the sample as listed by `appbuilder sample`.
	
	```bash
	appbuilder sample clone contacts
	```

The AppBuilder command-line interface shows the following message: `Successfully initialized project in the folder!`

## Running the Sample

With Telerik AppBuilder, you can deploy apps in the device simulator and on device wirelessly or via cable connection. For more information about running apps, see [Running Your App][Running Your App].

To test the LiveSync JavaScript API sample, choose one of the following deployment methods.

* Build your project for the companion app and deploy it via QR code.
* Build your project as an application package with the Debug build configuration.

## License

This sample is licensed under the Apache License, Version 2.0. For more information, see [License][License].

[License]: License.md
[Running Your App]: http://docs.telerik.com/platform/appbuilder/testing-your-app/run-your-app
