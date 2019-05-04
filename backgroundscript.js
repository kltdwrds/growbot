var gblIgBotUser = {
    user_guid: undefined,
    install_date: new Date(),
    ig_users: [],
    licenses: {},
    actions: [
        { date: '', action: '' }
    ],
    account_growth_stats: [],
    options: {},
    //      whitelist: [],
    //      savedQueue: [{ name: 'q1',date:datetime,queue:[]},{ name: 'q1',date:datetime,queue:[]}]
    init: function() {
        this.user_guid = this.getPref('growbot_user_guid');

        if (!this.user_guid) {
            this.user_guid = this.uuidGenerator();
            this.setPref('growbot_user_guid', this.user_guid);
        }


        // else {
        //     console.log(this.getPref('igBotUser'));
        //     thisFromStorage = JSON.parse(this.getPref('igBotUser'));
        // }

        checkInstallDate();

    },
    uuidGenerator: function() {
        var S4 = function() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    },
    getPref: function(name) {
        var value = localStorage[name];
        if (value == 'false')
            return false;
        else
            return value;
    },
    setPref: function(name, value) {
        localStorage[name] = value;
    },
    saveToLocal: function() {
        localStorage['igBotUser'] = JSON.stringify(gblIgBotUser);
    },
    saveToServer: function() {
        var r2 = new XMLHttpRequest();
        r2.open("PUT", "https://www.growbotforinstagram.com/igBotUser/" + this.user_guid + "/", true);
        r2.setRequestHeader("Content-type", "application/json");
        r2.send(JSON.stringify(this));
    },
    sendToTabs: function() {
        sendMessageToInstagramTabs({ igBotUser: this });
    }
};


var instabot_free_trial_time = 1296000000; // 129600000 = 36 hours, 259200000 = 72 hours, 1296000000 = 14 days, 2592000000 = 30 days
var first_run = false;
var todaysdate = new Date();
var today = todaysdate.getTime();
var timeSinceInstall;

chrome.runtime.onInstalled.addListener(installedOrUpdated);

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.query({ url: "https://www.instagram.com/*", currentWindow: true }, tabs => {
        if (tabs.length === 0) {
            alert('Thanks for being a Growbot user! \n\n To use it, click the Growbot icon next to the Instagram logo on instagram.com');
            window.open('https://www.instagram.com/');
        } else {
            for (var i = 0; i < tabs.length; i++) {
                if (tabs[i].active === true) {
                    chrome.tabs.sendMessage(tabs[i].id, { "toggleGrowbot": true, igBotUser: gblIgBotUser }, function(response) {});
                    return true;
                }
            }
            // only runs if instagram wasn't the active tab:
            chrome.tabs.update(tabs[0].id, { active: true });
            chrome.tabs.sendMessage(tabs[0].id, { "openGrowbot": true, igBotUser: gblIgBotUser }, function(response) {});
        }
    });
});

chrome.runtime.onMessage.addListener(function(request, sender) {

    if (request.updatewanted && request.updatewanted == true) {
        gblIgBotUser.init();
    }

    if (request.ig_user) {
        gblIgBotUser.ig_users.push(request.ig_user);
        gblIgBotUser.ig_users = uniq(gblIgBotUser.ig_users);

        if (request.ig_user_account_stats) {
            gblIgBotUser.account_growth_stats.push(request.ig_user_account_stats);
            gblIgBotUser.account_growth_stats = uniq(gblIgBotUser.account_growth_stats);
        }

        gblIgBotUser.saveToLocal();
    }


    if (request.notification) {
        chrome.notifications.create('notification', {
            type: "basic",
            iconUrl: chrome.extension.getURL("icon_128.png"),
            title: "GrowBot",
            message: request.notification
        }, function() {});

    }

    if (request.fnc) {
        window[request.fnc](arguments);
    }

});

//kickoff
//gblIgBotUser.init();

function installedOrUpdated() {
    // uncommenting below line makes it so free trial restarts with each version
    //localStorage.removeItem('instabot_install_date');
    gblIgBotUser.init();
}


function extendTrial() {
    localStorage.removeItem('instabot_install_date');
}

function checkInstallDate() {
    if (!localStorage['instabot_install_date']) {
        first_run = true;
        localStorage['instabot_install_date'] = '' + today;
    }

    // string -> int -> date -> UTCString for python
    gblIgBotUser.install_date = new Date(+localStorage['instabot_install_date']).toUTCString();

    timeSinceInstall = today - localStorage['instabot_install_date'];
    getLicense();
}

function sendMessageToInstagramTabs(message) {
    chrome.tabs.query({ url: "https://www.instagram.com/*" }, function(tabs) {
        //if (tabs.length == 0) return false;
        for (var i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(tabs[i].id, message, function(response) {});
        }
    });
}

function getLicense(interactive) {
    interactive = interactive || false;
    var CWS_LICENSE_API_URL = 'https://www.googleapis.com/chromewebstore/v1.1/userlicenses/';
    var runtimeId = 'abhcgokmndbiegmmbjffdlpihgdmeejf';
    //var runtimeId = chrome.runtime.id;
    xhrWithAuth('GET', CWS_LICENSE_API_URL + runtimeId, interactive, getPurchases);

    // xhrWithAuth('GET', CWS_LICENSE_API_URL + runtimeId, interactive, function() {

    //     var r2 = new XMLHttpRequest();
    //     r2.onreadystatechange = function() {
    //         console.log(r2.response)
    //         ''
    //     }
    //     r2.open("GET", 'https://www.googleapis.com/chromewebstore/v1.1/items/abhcgokmndbiegmmbjffdlpihgdmeejf/skus', true);
    //     r2.send('');

    // });
}

function getLicenseInteractive() {
    getLicense(true);
}

function getPurchases() {
    google.payments.inapp.getPurchases({
        'parameters': { env: "prod" },
        'success': onLicenseUpdate,
        'failure': function(response) {

            // if (timeSinceInstall < instabot_free_trial_time) {
            //     sendMessageToInstagramTabs({ "instabot_install_date": localStorage['instabot_install_date'], "instabot_free_trial_time": instabot_free_trial_time, "instabot_has_license": false });
            // } else {
            //     openBuyScreen();
            // }

            // gblIgBotUser.saveToLocal();
            // gblIgBotUser.saveToServer();

            checkLicenseOnServer()
        }
    });
}


function checkLicenseOnServer() {

    var r2 = new XMLHttpRequest();
    r2.onreadystatechange = function() {
        if (r2.readyState === 4) {
            if (parseInt(r2.response) > 0) {
                allLicensesFetched(1, { "growbot_license": 1 });
            } else {
                allLicensesFetched(0, {});
            }
        }
    }
    r2.open("GET", 'https://www.growbotforinstagram.com/check_subscription.php?guid=' + gblIgBotUser.user_guid, true);
    r2.send('');

}

function onLicenseUpdate(response) {
    var licenses = response.response.details;
    var count = licenses.length;

    if (count == 0) {
        checkLicenseOnServer();
    } else {
        allLicensesFetched(count, licenses);
    }
}

function allLicensesFetched(count, licenses) {
	console.log('has license');
	sendMessageToInstagramTabs({ "instabot_install_date": localStorage['instabot_install_date'], "instabot_free_trial_time": instabot_free_trial_time, "instabot_has_license": true });

    gblIgBotUser.licenses = { "growbot_licence": 1 };

    gblIgBotUser.saveToLocal();
    gblIgBotUser.saveToServer();
}


function openBuyScreen() {
    sendMessageToInstagramTabs({ "openBuyScreen": true, igBotUser: gblIgBotUser });
}

// function onLicenseFetched(error, status, response) {
//     var licenseStatus = "";
//     if (status === 200 && response) {
//         response = JSON.parse(response);
//         licenseStatus = parseLicense(response);
//     } else {
//         //console.log("FAILED to get license. Free trial granted.");
//         licenseStatus = "unknown";
//     }
//     if (licenseStatus) {
//         if (licenseStatus === "Full") {
//             window.localStorage.setItem('instaBotisLicensed', 'true');

//         } else if (licenseStatus === "None") {

//             //google.payments.inapp.getPurchases();
//             openBuyScreen();
//             //redirect to a page about paying as well?
//         } else if (licenseStatus === "Free") {

//             window.localStorage.setItem('instaBotisLicensed', 'true');
//             // console.log(window.localStorage.getItem('daysLeftInInstaBotTrial') + " days left in free trial.");
//         } else if (licenseStatus === "unknown") {
//             //this does mean that if they don't approve the permissions,
//             //it works free forever. This might not be ideal
//             //however, if the licensing server isn't working, I would prefer it to work.
//             window.localStorage.setItem('instaBotisLicensed', 'true');
//             // console.log("instaBot enabled, but was unable to check license status.");
//         }
//     }
//     window.localStorage.setItem('instaBotLicenseCheckComplete', 'true');
// }

/*****************************************************************************
 * Parse the license and determine if the user should get a free trial
 *  - if license.accessLevel == "FULL", they've paid for the app
 *  - if license.accessLevel == "FREE_TRIAL" they haven't paid
 *    - If they've used the app for less than TRIAL_PERIOD_DAYS days, free trial
 *    - Otherwise, the free trial has expired 
 *****************************************************************************/

function parseLicense(license) {
    var TRIAL_PERIOD_DAYS = 10;
    var licenseStatusText;
    var licenceStatus;
    if (license.result && license.accessLevel == "FULL") {
        //console.log("Fully paid & properly licensed.");
        LicenseStatus = "Full";
    } else if (license.result && license.accessLevel == "FREE_TRIAL") {
        var daysAgoLicenseIssued = Date.now() - parseInt(license.createdTime, 10);
        daysAgoLicenseIssued = daysAgoLicenseIssued / 1000 / 60 / 60 / 24;
        if (daysAgoLicenseIssued <= TRIAL_PERIOD_DAYS) {
            window.localStorage.setItem('daysLeftInInstaBotTrial', TRIAL_PERIOD_DAYS - daysAgoLicenseIssued);
            //console.log("Free trial, still within trial period");
            LicenseStatus = "Free";
        } else {
            //console.log("Free trial, trial period expired.  License issued " + daysAgoLicenseIssued + " ago");
            LicenseStatus = "None";
            //open a page telling them it is not working since they didn't pay?
        }
    } else {
        //console.log("No license ever issued.");
        LicenseStatus = "None";
        //open a page telling them it is not working since they didn't pay?
    }
    return LicenseStatus;
}

/*****************************************************************************
 * Helper method for making authenticated requests
 *****************************************************************************/

// Helper Util for making authenticated XHRs
function xhrWithAuth(method, url, interactive, callback) {
    var retry = true;
    var access_token;
    getToken();

    function getToken() {
        chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
            if (chrome.runtime.lastError) {
                callback(chrome.runtime.lastError);
                return;
            }
            access_token = token;
            requestStart();
        });
    }

    function requestStart() {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
        xhr.onreadystatechange = function(oEvent) {
            if (xhr.readyState === 4) {
                if (xhr.status === 401 && retry) {
                    retry = false;
                    chrome.identity.removeCachedAuthToken({ 'token': access_token },
                        getToken);
                } else if (xhr.status === 200) {
                    callback(null, xhr.status, xhr.response);
                }
            } else {
                // console.log("(non?)Error - " + xhr.readyState);
            }
        }
        try {
            xhr.send();
        } catch (e) {}
    }
}

function uniq(ar) {
    return Array.from(new Set(ar.map(JSON.stringify))).map(JSON.parse);
}


// function setIcon(partialFilename) {
//     chrome.browserAction.setIcon({ path: "icon48-" + partialFilename + ".png" });
// }

// function saveEnabledStatus(enabledStatus) {
//     chrome.storage.sync.set({ 'igBotEnabled': enabledStatus }, setIcon(enabledStatus));
// }

// function enable() {
//     //console.log('enable was called');
//     sendMessageToActiveTab({ action: 'initFollow' })
// }

// function disable() {
//     //  console.log('disable was called');
//     sendMessageToActiveTab({ action: 'clearAllTimeouts' })
// }

// function allowRedirect(tabId) {
//     var tabObj = getOBjectInArrayByPropertyValue(arrTabs, 'tabId', tabId);

//     if (tabObj.redirected == false) {
//         return true;
//     } else {
//         return false;
//     }
// }

// function getOBjectInArrayByPropertyValue(arr, lookupProp, lookupVal) {
//     for (var i = 0; i < arr.length; i++) {
//         if (arr[i][lookupProp] == lookupVal) {
//             return arr[i];
//         }
//     }
// }

// function modifyObjectInArrayByPropertyValue(arr, lookupProp, lookupVal, propToModify, newVal) {
//     for (var i = 0; i < arr.length; i++) {
//         if (arr[i][lookupProp] == lookupVal) {
//             var newObj = arr[i];
//             newObj[propToModify] = newVal;
//             arr[i] = newObj;
//         }
//     }
// }


// function getStatus(callback) {

//     chrome.storage.sync.get('igBotEnabled', function(object) {

//         var enabled = false;

//         if (typeof object['igBotEnabled'] !== 'undefined') {
//             enabled = object['igBotEnabled'];
//         } else {
//             enabled = false;
//         }

//         callback(enabled);

//     });

// }


// function toggleEnabled(enabled) {

//     if (enabled == true) {
//         disable();
//         saveEnabledStatus(false);
//     } else {
//         enable();
//         saveEnabledStatus(true);
//     }

// }


// function iconClicked() {
//     getStatus(toggleEnabled);
// }

// function sendMessageToActiveTab(message) {
//     chrome.tabs.query({
//         active: true,
//         currentWindow: true
//     }, function(tabs) {
//         chrome.tabs.sendMessage(tabs[0].id, message, function(response) {});

//     });
// }


// saveEnabledStatus(false);
// chrome.browserAction.onClicked.addListener(iconClicked);

// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//         if (request.action == 'disable') {
//             disable();
//             saveEnabledStatus(false);
//         }
//     }
// );
