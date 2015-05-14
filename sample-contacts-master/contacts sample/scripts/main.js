document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    var app = new Application();
    app.run();
    
    navigator.splashscreen.hide();
}

function Application() {
}

Application.prototype = {
 
    run : function() {
        var that = this,
            buttonCreateContact = document.getElementById("createContactButton"),
            buttonFindContact = document.getElementById("findContactButton"),
            buttonCloneContact = document.getElementById("cloneContactButton"),
            buttonRemoveContact = document.getElementById("removeContactButton");
        
        buttonCreateContact.addEventListener("click", function() {
            that.createContact.call(that);
        });
        buttonFindContact.addEventListener("click", function() {
            that.findContact.call(that);
        });
        buttonCloneContact.addEventListener("click", function() {
            that.cloneContact.call(that);
        });
        buttonRemoveContact.addEventListener("click", function() {
            that.removeContact.call(that);
        });
    },
    
    setResults : function(value) {
        if (!value) {
            document.getElementById("result").innerHTML = "";
        } else {
            document.getElementById("result").innerHTML = value;
        }
    },
    
    createContact : function() {
        var that = this;
        that.setResults();
                 
        // This code will create a new contact, even if
        // you have already run this code. It will lose its reference
        // to the original contact, and retrieve a reference to a new one.
                 
        that.contact = navigator.contacts.create();
        var name = new ContactName();
        name.givenName = "Telerik AppBuilder Test";
        name.familyName = "Sample Contact";
        that.contact.name = name;
 
        // Create a single address for the contact.
        var address = new ContactAddress();
        address.type = "Home";
        address.streetAddress = "12345 Some St.";
        address.locality = "Locality";
        address.region = "Region";
        address.postalCode = "99999";
        address.country = "United States of America";
        that.contact.addresses = [address];
   
        // Create three phone numbers for the contact.
        var phoneNumbers = [3];
        phoneNumbers[0] = new ContactField('work', '212-555-1212', false);
        phoneNumbers[1] = new ContactField('mobile', '530-555-1212', false);
        phoneNumbers[2] = new ContactField('home', '718-555-1212', true); // the preferred number
        that.contact.phoneNumbers = phoneNumbers;
                 
        // Create two emails for the contact.
        var emails = [2];
        emails[0] = new ContactField('home', 'home@email.com', false);
        emails[1] = new ContactField('work', 'work@email.com', true);
        that.contact.emails = emails;
        that.contact.save(function() {
            that.onSaveSuccess.apply(that, arguments);
        }, function() {
            that.onSaveError.apply(that, arguments);
        });
    },
    
    onSaveSuccess : function(contact) {
        var that = this;
        that.contact = contact;

        that.setResults(
            "Contact saved successfully. Look in Address Book to view the contact:<br/>" +
            contact.name.givenName + "<br/>" + contact.name.familyName);
    },
     
    onSaveError : function(contactError) {
        var that = this;
        that.setResults("Save error = " + contactError.code);
    },
             
    findContact : function() {
        // Find all contacts containing the filter name.
        // You should first click Create Contact button, before calling this method.
        var that = this,
            options = new ContactFindOptions(),
        // Search for the filter name, allowing multiple matches.
            fields = ["displayName","name"];
        
        options.filter = "Telerik AppBuilder Test";
        options.multiple = true;
        navigator.contacts.find(fields, function() {
            that.onFindSuccess.apply(that, arguments);
        }, function() {
            that.onFindFailure.apply(that, arguments);
        }, options);
    },
 
    onFindSuccess : function(contacts) {
        var that = this;
        
        that.setResults();
        // Display the results.
        that.setResults("Found " + contacts.length + " contact" + (contacts.length === 1 ? "." : "s."));
        for (var i = 0; i < contacts.length; i++) {
            var contact = contacts[i];
            var result = "<br/>Found: ";
            if (contact) {
                if (contact.name && contact.name.givenName) {
                    result += contact.name.givenName + " ";
                }
                if (contact.name && contact.name.familyName) {
                    result += contact.name.familyName + " ";    
                }
                if (contact.id) {
                    result +="(id = " + contact.id + ")";
                }
            }
            that.setResults(result);
        }
    },

    onFindFailure : function(contactError) {
        var that = this;
        
        that.setResults("Find error = " + contactError.code);
    },
 
    cloneContact : function() {
        var that = this;
        that.setResults();
                 
        if (!that.contact) {
            that.setResults(
                "Contact hasn't yet been set." +
                "</br>Click 'Create New Contact' first.");
        } else {
            var clone = that.contact.clone();
            clone.name.givenName = "ClonedSampleContact";
            clone.emails[0].value = "cloned@email.com";
                 
            that.setResults("Cloned contact:<br/>" +
                            "Name: " + clone.name.givenName + " " + clone.name.familyName + "<br/>" +
                            "Email: " + clone.emails[0].value + "<br/>" +
                            "Address: " + clone.addresses[0].streetAddress + "<br/>" +
                            "<br/>" +
                            "Note that the clone hasn't been saved, and won't appear in your address book."
                );                   
        }
    },
    
    removeContact : function() {
        var that = this;
        that.setResults();
        if (!that.contact) {
            that.setResults(
                "Contact hasn't yet been set." +
                "</br>Click 'Create New Contact' first.");
        } else {
            that.contact.remove(function() {
                that.onRemoveSuccess.apply(that, arguments);
            }, function() {
                that.onRemoveFailure.apply(that, arguments);
            });
        }
    },

    onRemoveSuccess : function() {
        var that = this;

        that.contact = null;
        that.setResults("Contact removed successfully.");
    },

    onRemoveFailure : function(contactError) {
        var that = this;
        
        that.setResults("Remove error = " + contactError.code);
    },
    
    contact:null
}