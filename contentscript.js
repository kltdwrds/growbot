/*

TODO

- FILTERS
is_business_account
is_joined_recently
connected_fb_page
external_url
has_channel
business_category_name
edge_mutual_followed_by.count
gender?

-make updates not disrupt progress

-a filter that will not follow anyone without a profile pic. Thanks
Any idea when you will add filter to search on youtube? (check if they have a link to youtube in bio or website)


OPTIONS (move options to separate area):
- set maximum number of likes/follows/unfollows per day
- remove accounts/likes (visually) after some #threshold

master queues
automatically get more queue accts

3) Could you make a pause button? Stop just refreshes the page. I guess I can still just save the que and load it up after, but for convenience. Would make my life easier!
4) Could you make a performance mode checkbox addon for disabling picture loads?
5) Could you make an extra input field for number of actions next to the process que button.
For an example: I'd like to load 10k users, and process the que for 300 times. Then after that autopause until told to process again.
6) Could you integrate a location based filtering system? For an example google coordinate paste + radius
6.5 ) Location based search following. For an example If I'd search London, I'd find recent posts in London and add the users to the que.

button to clear already attempted or load as queue

Make quick "Unlike" or make sure to show user info for each pic.

Anyway you can randomize the post likes> 
My guess IG would spot you liking 1 post on every follow.
It would be nice if you could randomize likes and randomize frequency on this option. 
For example every 3 to 10 (Random) follows like (1-5 posts) Random.

photo likes just a thought. It would be good to randomize how many 1 through say 10. If it were me I would limit
that so the wrong user doesn't start spamming likes and screw up GrowBot for the rest of us.
It would also be cool if it could randomize what photo it liked. Not always the first one etc...

timer for auto Liking


schedule unfollowing
    - background page messaging

https://stackoverflow.com/questions/16758316/where-do-i-find-the-instagram-media-id-of-a-image

BUGS:
Okay thanks and i want to report bug to you, when i have lets say 100 people in queue and im getting additional data
 after completion i will get them sorted by followers ratio. Bug is - that pictures will dissappear and if i will select
 people from there i cant add them to whitelist or do anything with them. Adding screenshot.

I’ve download and save the queue so I’ve just reloaded again and when I decide how to order the list, pops up the windows
 saying that it needs to download more data and THEN download the same datas making under every name appears the same
 numbers again.

When it says he encounters the soft rate limit, if I manually stop the job and restart it again, it works regularly straight away
(this happen just in the unfollow mode, I noticed with the follow mode just keep flawless when set 20sec / 50% random,
 that’s my same set for the unfollow.. if you have suggestions please do :)


_____________________________________________

- new accounts: 20/hour, 100-200/day.
- old accounts:  50/hr, 300-400/day.


Heres a few feature ideas,

Follow by Keyword
    Follow those who have posted by keyword
    Follow those who have liked by keyword

Like photos by Location
Load users by location

- option to block client events

- make hide button hide/show on all open tabs

make stop actually stop job and let user use current process

last post date** - handle private accounts
first post date**

average posts per day?

figure out business page?
has connected fb page?
mutual friends?



progress bars!
https://loading.io/progress/
https://kimmobrunfeldt.github.io/progressbar.js/

1) auto like when people comment your images
2) auto reply to comments (not sure if this is a must have feature tho).

auto unfollow

make tour
video tour?  ttsreader.com

sort:
username
fullname




*/


var instabot_install_date = 0; // set from background page
var instabot_free_trial_time = 0; // set from background page
var instabot_has_license = true;

var defaultFilterOptions = {
    followers: [0, 10000000],
    following: [0, 7500],
    followRatio: [-7500, 10000],
    posts: [0, 10000],
    lastPosted: [0, 3000],
    private: true,
    non_private: true,
    verified: true,
    non_verified: true,
    follows_me: false,
    non_follows_me: true,
    followed_by_me: false,
    non_followed_by_me: true,
    applyFiltersAutomatically: true
}

var defaultOptions = {
    timeDelay: 32000,
    timeDelayAfterSoftRateLimit: 600000,
    timeDelayAfterHardRateLimit: 3600000,
    timeDelayAfterSkip: .5,
    useRandomTimeDelay: true,
    percentRandomTimeDelay: .125,
    followPrivateAccounts: true,
    limitQueue: true,
    maxAcctQueueLength: 1000,
    truncateStart: 0,
    dontUnFollowFollowers: true,
    dontUnFollowFilters: false,
    dontUnFollowNonGrowbot: true,
    unFollowFresh: false,
    unFollowIfOld: true,
    unFollowDelay: 259200000, // 259200000 = 3 days
    unFollowIfOlderThan: 2592000000, // 2592000000 = 30 days
    followLikeLatestPics: false,
    numberFollowLikeLatestPics: 1,
    filterOptions: defaultFilterOptions,
    ui: [],
    showUnfollowingInQueue: true,
    showFollowingInQueue: true,
    showLikesInQueue: true,
    removeAccountsFromQueue: false,
    autoSaveQueue: false,
    showStamps: true,
    showConvenienceButtons: true,
    followPeopleAlreadyAttempted: false
};

var gblOptions = defaultOptions;

var gbl404attempt = 0;

var acctsQueue = [];
var theirFollowings = [];
var myFollowers = [];

var acctsProcessed = [];
var acctsPreviouslyAttempted = [];
var acctsWhiteList = [];
var freeTrialInterval;

var counter = 0;
var scrollIntervalId;
var totalAvailableForQueue;

var loadedTheirFollowers = false;
var loadedTheirFollowings = false;
var loadedMyFollowers = false;
var loadedMyFollowings = false;

var user;
var currentProfilePage = false;

var todaysdate = new Date();
var today = todaysdate.getTime();

var mediaToLike = [];
var previousLikes = [];

var igloggedinacct = retrieveWindowVariables(["window._sharedData"]);

var currentList = false;

var queueSplit = false;

let mediaForComments = [];
let accountIdsThatCommented = [];


let mediaForLikes = [];
let accountIdsThatLiked = [];

if (igloggedinacct && igloggedinacct.config && igloggedinacct.config.viewer != null) {
    user = igloggedinacct.config;
}

function displayFreeTrialTimeLeft() {
    var datenow = new Date();
    var timenow = datenow.getTime();

    if (timenow - instabot_install_date < instabot_free_trial_time && instabot_has_license == false) {
        var timeLeft = millisecondsToHumanReadable(instabot_free_trial_time - (timenow - instabot_install_date), true);
        $('#h2FreeTrialTimeLeft').show().html(timeLeft + ' left in trial. <a href="" id="linkBuyNow">Subscribe Now</a>');
        $('#linkBuyNow').click(function(e) {
            e.preventDefault();
            chrome.extension.sendMessage({
                "fnc": "openBuyScreen"
            });
            return false;
        });
    } else if (instabot_has_license == true) {
        $('#h2FreeTrialTimeLeft').text('Thank you for being a subscriber!');
        clearInterval(freeTrialInterval);
    } else {
        $('#h2FreeTrialTimeLeft').hide();
        clearInterval(freeTrialInterval);
    }
}

function timeToDate(t) {
    var date = new Date(parseInt(t));
    return date.toString();
}

function outputMessage(txt) {

    var statusDiv = document.getElementById('igBotStatusDiv');
    var fakeConsole = document.getElementById('txtConsole');

    if (txt.trim() != '') {
        txt = getTimeStamp() + ' - ' + txt;
        statusDiv.textContent = txt;
        displayWaitTimeHacky();
    }

    fakeConsole.textContent = fakeConsole.textContent + '\n' + txt;

    if (document.activeElement.id !== 'txtConsole') {
        fakeConsole.scrollTop = fakeConsole.scrollHeight;
    }
}


function displayWaitTimeHacky() {
    var statusDiv = document.getElementById('igBotStatusDiv');

    var statusText = statusDiv.textContent;

    if (statusText.indexOf('waiting ') > -1 && statusText.indexOf(' seconds') > -1) {
        var secondsStart = statusText.indexOf('waiting ') + 8;
        var secondsEnd = statusText.indexOf(' second');
        var seconds = statusText.substring(secondsStart, secondsEnd);

        if (!isNaN(seconds) && (seconds - 1 > 0)) {
            statusDiv.textContent = statusDiv.textContent.replace('waiting ' + seconds + ' seconds', 'waiting ' + (Math.round((seconds - 1) * 100) / 100) + ' seconds');
            if (seconds - 1 > 1) setTimeout(displayWaitTimeHacky, 1000);
        }
    }

    if (statusText.indexOf('waiting ') > -1 && statusText.indexOf(' minute') > -1) {
        var secondsStart = statusText.indexOf('waiting ') + 8;
        var secondsEnd = statusText.indexOf(' minute');
        var minutes = statusText.substring(secondsStart, secondsEnd);

        if (!isNaN(minutes)) {
            seconds = minutes * 60;
            statusDiv.textContent = statusDiv.textContent.replace('waiting ' + minutes + ' minutes', 'waiting ' + (Math.round((seconds - 1) * 100) / 100) + ' seconds');
            if (seconds - 1 > 1) setTimeout(displayWaitTimeHacky, 1000);
        }
    }

}


function retrieveWindowVariables(variables) {
    var ret = "";

    var scriptContent = "if (typeof " + variables + " !== 'undefined') localStorage.setItem('" + variables + "', JSON.stringify(" + variables + ")) \n"
    var script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    ret = JSON.parse(localStorage.getItem(variables));
    localStorage.removeItem(variables);

    return ret;
}

function millisecondsToHumanReadable(ms, formatAsString) {

    var obj = {}
    var x = ms / 1000;
    obj.seconds = parseInt(x % 60);
    x /= 60;
    obj.minutes = parseInt(x % 60);
    x /= 60;
    obj.hours = parseInt(x % 24);
    x /= 24;
    obj.days = parseInt(x);

    if (formatAsString == false) return obj;

    return obj.days + ' days, ' + obj.hours + ' hours, ' + obj.minutes + ' minutes, ' + obj.seconds + ' seconds';

}

function zeroPad(digitcount, num) {
    for (var i = 0; i < digitcount; i++) {
        num = "0" + num;
    }

    return num.substr(-digitcount, digitcount);
}

function getTimeStamp() {
    var d = new Date();
    var meridium = ' am';
    var hours = d.getHours();

    if (hours > 11) {
        meridium = ' pm';
        hours = hours - 12;
    }

    if (hours == 0) {
        hours = 12;
    }

    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + hours + ':' + zeroPad(2, d.getMinutes()) + ':' + zeroPad(2, d.getSeconds()) + meridium;
}

function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i].id === obj.id) {
            return true;
        }
    }

    return false;
}

function findAcctById(id, list, returnIndexOnly) {
    if (returnIndexOnly !== true) returnIndexOnly = false;
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i].id === id) {
            if (returnIndexOnly === true) return i;
            return list[i];
        }
    }
    return false;
}


function addNewConvenienceLinks(element) {

    if (gblOptions.showConvenienceButtons == false) return false;

    var $$this = $(element);

    var username = $$this.attr('title');

    $$this.after('<a class="igBotInjectedLinkWhitelist" href="javascript:void(0);" data-username="' + username + '">Whitelist</a> <a class="igBotInjectedLinkUnfollow" href="javascript:void(0);" data-username="' + username + '">Unfollow</a>');

}


async function convenienceLinkUnfollowAcct(userName) {
    var acct = await getAdditionalDataForAcct({ username: userName });
    quickUnfollowAcct(acct);
}

async function convenienceLinkWhitelistAcct(userName) {
    var acct = await getAdditionalDataForAcct({ username: userName });
    if (addAcctToWhiteList(acct) === true) saveWhiteListToStorage();
    $('.igBotInjectedLinkWhitelist[data-username="' + acct.username + '"]').fadeOut();
    $('.igBotInjectedLinkUnfollow[data-username="' + acct.username + '"]').fadeOut();
}

function waitForTrue(variableNames, callback, args) {
    var allTrue = true;
    var waitingFor = 'waiting for ';
    for (var i = 0; i < variableNames.length; i++) {
        if (window[variableNames[i]] === false) {
            allTrue = false;
            waitingFor = waitingFor + variableNames[i] + ' ';
        } else {
            waitingFor = waitingFor.replace(variableNames[i], '');
        }
    }

    if (allTrue === true) {
        outputMessage('Done.');
        callback.apply(this, args);
    } else {
        //outputMessage(waitingFor);
        setTimeout(function() {
            waitForTrue(variableNames, callback, args);
        }, 1000);
    }

}

function loadOptions() {
    chrome.storage.local.get("gblOptions", function(data) {
        if (typeof data.gblOptions != 'undefined') {
            gblOptions = data.gblOptions;

            if (typeof gblOptions.filterOptions == 'undefined') {
                gblOptions.filterOptions = defaultFilterOptions;
            }

            // for newly added options: set gblOptions.xxxx to default option if .xxxx wasn't in previously saved options
            for (var key in defaultOptions) {
                if (gblOptions.hasOwnProperty(key) === false) {
                    gblOptions[key] = defaultOptions[key];
                }
            }

            document.getElementById('textSecondsBetweenActions').value = gblOptions.timeDelay / 1000;
            document.getElementById('textSecondsAfterSkip').value = gblOptions.timeDelayAfterSkip / 1000;
            document.getElementById('textMinutesAfterSoftRateLimit').value = gblOptions.timeDelayAfterSoftRateLimit / 60000;
            document.getElementById('textHoursAfterHardRateLimit').value = gblOptions.timeDelayAfterHardRateLimit / 3600000;
            document.getElementById('cbRandomizeTimeDelay').checked = gblOptions.useRandomTimeDelay;
            document.getElementById('cbFollowPrivateAccounts').checked = gblOptions.followPrivateAccounts;
            document.getElementById('cbFilterNonPrivate').checked = gblOptions.filterOptions.non_private;
            document.getElementById('cbFilterVerified').checked = gblOptions.filterOptions.verified;
            document.getElementById('cbFilterNonVerified').checked = gblOptions.filterOptions.non_verified;
            document.getElementById('cbFollowsMe').checked = gblOptions.filterOptions.follows_me;
            document.getElementById('cbNonFollowsMe').checked = gblOptions.filterOptions.non_follows_me;
            document.getElementById('cbFollowedByMe').checked = gblOptions.filterOptions.followed_by_me;
            document.getElementById('cbNonFollowedByMe').checked = gblOptions.filterOptions.non_followed_by_me;
            document.getElementById('cbApplyFilterAutomatically').checked = gblOptions.filterOptions.applyFiltersAutomatically;
            document.getElementById('iconFilter').style.opacity = gblOptions.filterOptions.applyFiltersAutomatically ? 1 : .5;
            document.getElementById('igBotPercentRandomTimeDelay').value = gblOptions.percentRandomTimeDelay * 200;
            document.getElementById('cbDontUnfollowFollowers').checked = gblOptions.dontUnFollowFollowers;
            document.getElementById('cbDontUnfollowNonGrowbot').checked = gblOptions.dontUnFollowNonGrowbot;
            document.getElementById('cbDontUnfollowFilters').checked = gblOptions.dontUnFollowFilters;
            document.getElementById('cbDontUnfollowFresh').checked = !gblOptions.unFollowFresh;
            document.getElementById('cbUnfollowOld').checked = gblOptions.unFollowIfOld;
            document.getElementById('textUnfollowNew').value = gblOptions.unFollowDelay / 86400000;
            document.getElementById('textUnfollowOld').value = gblOptions.unFollowIfOlderThan / 86400000;
            document.getElementById('cbLimitQueueSize').checked = gblOptions.limitQueue;
            document.getElementById('txtLimitQueueSize').value = gblOptions.maxAcctQueueLength;
            document.getElementById('cbFollowLikeLatestPics').checked = gblOptions.followLikeLatestPics;
            document.getElementById('numberFollowLikeLatestPics').value = gblOptions.numberFollowLikeLatestPics || 1;
            document.getElementById('cbRemoveFromQueue').checked = gblOptions.removeAccountsFromQueue;
            document.getElementById('cbAutoSaveQueue').checked = gblOptions.autoSaveQueue;
            document.getElementById('cbShowStamps').checked = gblOptions.showStamps;
            document.getElementById('cbConvenienceLinks').checked = gblOptions.showConvenienceButtons;
            document.getElementById('cbFollowAlreadyAttempted').checked = gblOptions.followPeopleAlreadyAttempted;
            document.getElementById('cbShowLikesInQueue').checked = gblOptions.showLikesInQueue;
            //document.getElementById('cbShowFollowingInQueue').checked = gblOptions.showFollowingInQueue;
            document.getElementById('cbShowUnfollowingInQueue').checked = gblOptions.showUnfollowingInQueue;

            if (typeof gblOptions.ui == 'undefined' || gblOptions.ui.length == 0) {
                [...document.getElementsByTagName('details')].forEach((detailsEl) => {
                    detailsEl.setAttribute('open', true)
                });
            } else {
                gblOptions.ui.forEach((detailsOpt) => {
                    if (detailsOpt.open == true) document.getElementById(detailsOpt.id).setAttribute('open', true);
                });
            }

        }

        if (typeof gblOptions.filterOptions == 'undefined') {
            gblOptions.filterOptions = defaultFilterOptions;
        }

        bindNoUiSliders();

    });
}

function saveOptions() {

    gblOptions.filterOptions.applyFiltersAutomatically = document.getElementById('cbApplyFilterAutomatically').checked;
    gblOptions.filterOptions.private = document.getElementById('cbFollowPrivateAccounts').checked;
    gblOptions.filterOptions.non_private = document.getElementById('cbFilterNonPrivate').checked;
    gblOptions.filterOptions.verified = document.getElementById('cbFilterVerified').checked;
    gblOptions.filterOptions.non_verified = document.getElementById('cbFilterNonVerified').checked;
    gblOptions.filterOptions.follows_me = document.getElementById('cbFollowsMe').checked;
    gblOptions.filterOptions.non_follows_me = document.getElementById('cbNonFollowsMe').checked;
    gblOptions.filterOptions.followed_by_me = document.getElementById('cbFollowedByMe').checked;
    gblOptions.filterOptions.non_followed_by_me = document.getElementById('cbNonFollowedByMe').checked;

    var uiOptions = [];

    [...document.getElementsByTagName('details')].forEach((detailsEl) => {
        uiOptions.push({
            'id': detailsEl.id,
            'open': detailsEl.open ? true : false
        });
    });

    var filterOptions = gblOptions.filterOptions;

    gblOptions = {
        dontUnFollowFollowers: document.getElementById('cbDontUnfollowFollowers').checked,
        dontUnFollowNonGrowbot: document.getElementById('cbDontUnfollowNonGrowbot').checked,
        dontUnFollowFilters: document.getElementById('cbDontUnfollowFilters').checked,
        filterOptions: filterOptions,
        followLikeLatestPics: document.getElementById('cbFollowLikeLatestPics').checked,
        followPeopleAlreadyAttempted: document.getElementById('cbFollowAlreadyAttempted').checked,
        followPrivateAccounts: document.getElementById('cbFollowPrivateAccounts').checked,
        limitQueue: document.getElementById('cbLimitQueueSize').checked,
        maxAcctQueueLength: parseInt(document.getElementById('txtLimitQueueSize').value),
        numberFollowLikeLatestPics: document.getElementById('numberFollowLikeLatestPics').value,
        percentRandomTimeDelay: document.getElementById('igBotPercentRandomTimeDelay').value / 200,
        showLikesInQueue: document.getElementById('cbShowLikesInQueue').checked,
        //showFollowingInQueue: document.getElementById('cbShowFollowingInQueue').checked,
        showUnfollowingInQueue: document.getElementById('cbShowUnfollowingInQueue').checked,
        removeAccountsFromQueue: document.getElementById('cbRemoveFromQueue').checked,
        autoSaveQueue: document.getElementById('cbAutoSaveQueue').checked,
        showConvenienceButtons: document.getElementById('cbConvenienceLinks').checked,
        showStamps: document.getElementById('cbShowStamps').checked,
        timeDelay: document.getElementById('textSecondsBetweenActions').value * 1000,
        timeDelayAfterHardRateLimit: document.getElementById('textHoursAfterHardRateLimit').value * 3600000,
        timeDelayAfterSkip: document.getElementById('textSecondsAfterSkip').value * 1000,
        timeDelayAfterSoftRateLimit: document.getElementById('textMinutesAfterSoftRateLimit').value * 60000,
        ui: uiOptions,
        unFollowFresh: !document.getElementById('cbDontUnfollowFresh').checked,
        unFollowIfOld: document.getElementById('cbUnfollowOld').checked,
        unFollowDelay: parseInt(document.getElementById('textUnfollowNew').value) * 86400000,
        unFollowIfOlderThan: parseInt(document.getElementById('textUnfollowOld').value) * 86400000,
        useRandomTimeDelay: document.getElementById('cbRandomizeTimeDelay').checked
    };


    chrome.storage.local.set({
        gblOptions: gblOptions
    });

    document.getElementById('iconFilter').style.opacity = gblOptions.filterOptions.applyFiltersAutomatically ? 1 : .5;
}


function loadPreviousAttempts() {
    chrome.storage.local.get("acctsAttempted", function(data) {
        if (Array.isArray(data.acctsAttempted)) {
            acctsPreviouslyAttempted = data.acctsAttempted;
            outputMessage('Previously attempted to follow: ' + acctsPreviouslyAttempted.length + ' accounts');
            cleanAcctsForStorage();
        }
    })
}



function cleanAcctsForStorage() {

    var previousBytes = bytesFromString(JSON.stringify(acctsPreviouslyAttempted));

    for (var i = 0; i < acctsPreviouslyAttempted.length; i++) {
        var a = acctsPreviouslyAttempted[i];
        if (a.edge_felix_video_timeline) delete acctsPreviouslyAttempted[i].edge_felix_video_timeline;
        if (a.edge_felix_combined_post_uploads) delete acctsPreviouslyAttempted[i].edge_felix_combined_post_uploads;
        if (a.edge_felix_combined_draft_uploads) delete acctsPreviouslyAttempted[i].edge_felix_combined_draft_uploads;
        if (a.edge_felix_drafts) delete acctsPreviouslyAttempted[i].edge_felix_drafts;
        if (a.edge_felix_pending_draft_uploads) delete acctsPreviouslyAttempted[i].edge_felix_pending_draft_uploads;
        if (a.edge_felix_pending_post_uploads) delete acctsPreviouslyAttempted[i].edge_felix_pending_post_uploads;
        if (a.edge_saved_media) delete acctsPreviouslyAttempted[i].edge_saved_media;
        if (a.edge_media_collections) delete acctsPreviouslyAttempted[i].edge_media_collections;
        if (a.edge_owner_to_timeline_media && a.edge_owner_to_timeline_media.edges) acctsPreviouslyAttempted[i].edge_owner_to_timeline_media.edges = [];
    }

    var nowBytes = bytesFromString(JSON.stringify(acctsPreviouslyAttempted));
    var savedBytes = previousBytes - nowBytes;

    if (savedBytes > 0) {
        chrome.storage.local.set({ acctsAttempted: acctsPreviouslyAttempted }, function() {
            outputMessage('Cleaned up previously attempted accounts for storage (saved ' + formatBytes(savedBytes) + ')');
        });
    }
}

function bytesFromString(str) {
    var bytes = 0,
        len = str.length,
        codePoint, next, i;

    for (i = 0; i < len; i++) {
        codePoint = str.charCodeAt(i);

        // Lone surrogates cannot be passed to encodeURI
        if (codePoint >= 0xD800 && codePoint < 0xE000) {
            if (codePoint < 0xDC00 && i + 1 < len) {
                next = str.charCodeAt(i + 1);

                if (next >= 0xDC00 && next < 0xE000) {
                    bytes += 4;
                    i++;
                    continue;
                }
            }
        }

        bytes += (codePoint < 0x80 ? 1 : (codePoint < 0x800 ? 2 : 3));
    }

    return bytes;
}

function formatBytes(bytes, decimals) {
    if (bytes == 0) return '0 Bytes';
    var k = 1024,
        dm = decimals <= 0 ? 0 : decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function loadPreviousLikes() {
    chrome.storage.local.get("previousLikes", function(data) {
        if (Array.isArray(data.previousLikes)) {
            previousLikes = data.previousLikes;
            outputMessage('Previously Liked: ' + previousLikes.length);
        }
    })
}

function savePreviousLikesToStorage() {
    chrome.storage.local.set({
        previousLikes: previousLikes
    });
}

function addAcctToWhiteList(acct) {
    var acctInWhiteList = findAcctById(acct.id, acctsWhiteList);
    if (acct !== false && acctInWhiteList == false) {
        acctsWhiteList.push(acct);
        outputMessage(acct.username + ' added to whitelist');
        return true;
    } else {
        outputMessage(acct.username + ' already on whitelist');
        return false;
    }
}

function loadWhiteList() {
    chrome.storage.local.get("acctsWhiteList", function(data) {
        if (Array.isArray(data.acctsWhiteList)) {
            acctsWhiteList = data.acctsWhiteList;
            outputMessage('Whitelist loaded: ' + acctsWhiteList.length + ' accounts');
        }
    })
}

function saveWhiteListToStorage() {
    chrome.storage.local.set({
        acctsWhiteList: acctsWhiteList
    });
    outputMessage('Whitelist saved to local storage');
}

function saveWhiteListToDisk() {
    saveText("growbot-whitelist.txt", JSON.stringify(acctsWhiteList));
    outputMessage('Whitelist saved to disk');
}

function saveWhiteListToStorageAndDisk() {
    saveWhiteListToStorage();
    saveWhiteListToDisk();
}

function saveText(filename, text) {
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, filename);
}

function viewWhiteList() {
    if (acctsWhiteList.length > 0) {

        dialog({ yes: 'Load whitelist from file', no: 'Load last known whitelist', question: 'Where would you like to load the whitelist from?' },
            function() {
                openWhiteListFile()
            },
            function() {
                currentList = 'acctsWhiteList';
                arrayOfUsersToDiv(acctsWhiteList, true);
                handleCheckBoxes(acctsWhiteList);
                handleImagePreload();
            });

    } else {
        openWhiteListFile();
    }
}

function openWhiteListFile() {
    var input = document.createElement("input");
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'text/plain');

    input.addEventListener("change", function() {
        if (this.files && this.files[0]) {
            var myFile = this.files[0];
            var reader = new FileReader();

            reader.addEventListener('load', function(e) {
                acctsWhiteList = JSON.parse(e.target.result);
                currentList = 'acctsWhiteList';
                arrayOfUsersToDiv(acctsWhiteList, true);
                handleCheckBoxes(acctsWhiteList);
                handleImagePreload();
            });

            reader.readAsText(myFile);
        }
    });

    input.click();
}



function openQueueFile() {
    var input = document.createElement("input");
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'text/plain');

    input.addEventListener("change", function() {
        if (this.files && this.files[0]) {
            var myFile = this.files[0];
            var reader = new FileReader();

            reader.addEventListener('load', function(e) {
                acctsQueue = JSON.parse(e.target.result);
                currentList = 'acctsQueue';

                if (acctsQueue.length > gblOptions.maxAcctQueueLength &&
                    gblOptions.limitQueue == true &&
                    window.confirm('Saved queue has ' + acctsQueue.length + ' accounts, limit to first ' + gblOptions.maxAcctQueueLength + ' accounts?')) {

                    truncateQueue();
                }

                arrayOfUsersToDiv(acctsQueue, true);
                handleCheckBoxes(acctsQueue);
                handleImagePreload();

            });

            reader.readAsText(myFile);
        }
    });

    input.click();
}




function loadSavedQueue() {
    chrome.storage.local.get("acctsQueue", function(data) {
        if (Array.isArray(data.acctsQueue)) {

            dialog({ yes: 'Load the last known queue', no: 'Load queue from file', question: 'Where would you like to load the queue from?' },
                function() {
                    acctsQueue = data.acctsQueue;

                    if (acctsQueue.length > gblOptions.maxAcctQueueLength &&
                        gblOptions.limitQueue == true &&
                        window.confirm('Saved queue has ' + acctsQueue.length + ' accounts, limit to first ' + gblOptions.maxAcctQueueLength + ' accounts?')) {

                        truncateQueue();
                    }

                    arrayOfUsersToDiv(acctsQueue, true);
                    handleCheckBoxes(acctsQueue);
                    handleImagePreload();

                    outputMessage('Accounts Queue loaded: ' + acctsQueue.length + ' accounts');
                },
                function() {
                    openQueueFile();
                })
        } else {
            openQueueFile();
        }
    });
}

function saveQueueToDisk() {
    saveText("growbot-queue.txt", JSON.stringify(acctsQueue));
    outputMessage('Queue saved to disk');
}

function saveQueueToStorage() {
    chrome.storage.local.set({
        acctsQueue: acctsQueue
    }, function() {
        outputMessage('Saved queue of ' + acctsQueue.length + ' accounts to browser local storage')
    });
}

function saveQueueToStorageAndDisk() {
    saveQueueToStorage();
    saveQueueToDisk();
}


function initStealFollowers() {
    ajaxFollowAll();
}


function initUnfollowMyFollowers() {
    if (acctsQueue.length === 0 && window.confirm('Queue empty, load your following and begin unfollowing?') === true) {
        ajaxGetAllMyFollowing('');
        waitForTrue(['loadedMyFollowings'], ajaxUnfollowAll, []);
    } else {
        ajaxUnfollowAll();
    }
}


function ajaxLoadUsersMedia(after, loadAllMedia, callback, userid) {

    if (typeof after != 'string') {
        after = '';
    }

    if (typeof userid != 'string') {
        userid = currentProfilePage.id;
    }

    var jsonvars = {
        id: userid,
        first: 12
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var url = 'https://www.instagram.com/graphql/query/?query_hash=6305d415e36c0a5f0abb6daba312f2dd&variables=' + encodeURIComponent(urljsonvars);

    $.ajax(url).done(function(r) {
        callback(r);
    }).fail(function(f) {
        if (f.status == 429) {
            outputMessage('429 rate limit from instagram. waiting 1 minute to attempt load more media, please be patient!');
            setTimeout(function() {
                ajaxLoadUsersMedia(after, loadAllMedia, callback, userid);
            }, 60000);
        }
    });
}


function ajaxLoadAllUsersCommenters(after) {
    if (typeof after != 'string') {
        after = '';
    }

    var jsonvars = {
        id: currentProfilePage.id,
        first: 12
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var url = 'https://www.instagram.com/graphql/query/?query_hash=6305d415e36c0a5f0abb6daba312f2dd&variables=' + encodeURIComponent(urljsonvars);

    $.ajax(url).done(function(r) {
        loadCommentsForMedia(r);
    }).fail(function(f) {
        if (f.status == 429) {
            outputMessage('429 rate limit from instagram. waiting 1 minute to attempt load more media, please be patient!');
            setTimeout(function() {
                ajaxLoadAllUsersCommenters(after);
            }, 60000);
        }
    });
}

async function loadCommentsForMedia(r) {
    for (var i = 0; i < r.data.user.edge_owner_to_timeline_media.edges.length; i++) {
        var media = r.data.user.edge_owner_to_timeline_media.edges[i];

        if (media.node.edge_media_to_comment.page_info.has_next_page == true) {
            if (gblOptions.limitQueue == false || (gblOptions.limitQueue == true && mediaForComments.length < gblOptions.maxAcctQueueLength)) {
                var retMedia = await loadMoreCommentsForMedia(media);
                mediaForComments.push(retMedia);
            }
        } else {
            mediaForComments.push(media);
        }
    }

    if (getCommentersFromMediaArray() == false) {
        outputMessage('Done (queue limit reached).');
        return false;
    }

    if (r.data.user.edge_owner_to_timeline_media.page_info.has_next_page == true) {
        outputMessage('waiting 2 seconds to load more media for comments');
        setTimeout(function() {
            ajaxLoadAllUsersCommenters(r.data.user.edge_owner_to_timeline_media.page_info.end_cursor);
        }, 2000);
    } else {
        outputMessage('Done.')
    }
}

function loadMoreCommentsForMedia(media) {
    return new Promise(function(resolve, reject) {

        if (getCommentersFromMediaArray() == false) {
            outputMessage('Done (queue limit reached).');
            return false;
        }

        var jsonvars = {
            shortcode: media.node.shortcode,
            first: 48
        }

        if (media.node.edge_media_to_comment.page_info.has_next_page === true) {
            jsonvars.after = media.node.edge_media_to_comment.page_info.end_cursor;
        }

        var urljsonvars = JSON.stringify(jsonvars);

        var url = 'https://www.instagram.com/graphql/query/?query_hash=33ba35852cb50da46f5b5e889df7d159&variables=' + encodeURIComponent(urljsonvars);

        let retMedia = media;

        $.ajax(url).done(function(r) {

            for (var i = 0; i < r.data.shortcode_media.edge_media_to_comment.edges.length; i++) {
                retMedia.node.edge_media_to_comment.edges.push(r.data.shortcode_media.edge_media_to_comment.edges[i]);
            }

            if (r.data.shortcode_media.edge_media_to_comment.page_info.has_next_page === true) {
                retMedia.node.edge_media_to_comment.page_info.end_cursor = r.data.shortcode_media.edge_media_to_comment.page_info.end_cursor;

                outputMessage('waiting 2 seconds to load more comments');

                if ((gblOptions.limitQueue == true && retMedia.node.edge_media_to_comment.edges.length > gblOptions.maxAcctQueueLength)) {
                    resolve(retMedia);
                    return false;
                }

                setTimeout(function() {
                    resolve(loadMoreCommentsForMedia(retMedia));
                }, 2000);
            } else {
                resolve(retMedia);
            }


        }).fail(function(f) {
            if (f.status == 429) {
                outputMessage('429 rate limit from instagram. waiting 60 seconds to attempt load more commenters');
                setTimeout(function() {
                    resolve(loadMoreCommentsForMedia(retMedia));
                }, 60000);
            }
        });

    });
}


function getCommentersFromMediaArray() {
    let accountsThatCommented = [];

    for (var i = 0; i < mediaForComments.length; i++) {
        var media = mediaForComments[i];

        for (var j = 0; j < media.node.edge_media_to_comment.edges.length; j++) {
            var comment = media.node.edge_media_to_comment.edges[j];

            if (accountIdsThatCommented.indexOf(comment.node.owner.id) == -1) {
                accountIdsThatCommented.push(comment.node.owner.id);
                //var acct = await getAdditionalDataForAcct(comment.node.owner);
                //accountsThatCommented.push(acct);
                accountsThatCommented.push(comment.node.owner);
            }
        }
    }

    if (acctsQueue.length == 0) {
        acctsQueue = accountsThatCommented;
    } else {
        for (var i = 0; i < accountsThatCommented.length; i++) {
            if ((gblOptions.limitQueue == true && acctsQueue.length < gblOptions.maxAcctQueueLength) || gblOptions.limitQueue == false) {
                if (findAcctById(accountsThatCommented[i].id, acctsQueue) === false) {
                    acctsQueue.push(accountsThatCommented[i]);
                }
            } else {
                arrayOfUsersToDiv(accountsThatCommented, false);
                handleCheckBoxes(accountsThatCommented);
                handleImagePreload();
                return false;
            }
        }
    }

    arrayOfUsersToDiv(accountsThatCommented, false);
    handleCheckBoxes(accountsThatCommented);
    handleImagePreload();
}



function ajaxLoadAllUsersLikers(after) {
    if (typeof after != 'string') {
        after = '';
    }

    var jsonvars = {
        id: currentProfilePage.id,
        first: 12
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var url = 'https://www.instagram.com/graphql/query/?query_hash=6305d415e36c0a5f0abb6daba312f2dd&variables=' + encodeURIComponent(urljsonvars);

    $.ajax(url).done(function(r) {
        beginLoadLikesForMedia(r);
    }).fail(function(f) {
        if (f.status == 429) {
            outputMessage('429 rate limit from instagram. waiting 1 minute to attempt load more media, please be patient!');
            setTimeout(function() {
                ajaxLoadAllUsersLikers(after);
            }, 60000);
        }
    });
}

async function beginLoadLikesForMedia(r) {

    for (var i = 0; i < r.data.user.edge_owner_to_timeline_media.edges.length; i++) {
        var media = r.data.user.edge_owner_to_timeline_media.edges[i];
        var retMedia = await loadLikesForMedia(media);
        mediaForLikes.push(retMedia);


        var queueLimit = getLikersFromMediaArray();

        if (queueLimit == false) {
            outputMessage('Done (queue limit reached).');
            return false;
        } else {
            mediaForLikes = [];
        }

    }

    if (r.data.user.edge_owner_to_timeline_media.page_info.has_next_page == true) {
        outputMessage('waiting 2 seconds to load more media for likes');
        setTimeout(function() {
            ajaxLoadAllUsersLikers(r.data.user.edge_owner_to_timeline_media.page_info.end_cursor);
        }, 2000);
    } else {
        outputMessage('Done.')
    }
}

function loadLikesForMedia(media) {

    return new Promise(function(resolve, reject) {

        if (getLikersFromMediaArray() == false) {
            outputMessage('Done (queue limit reached).');
            return false;
        }

        let retMedia = false;

        var shortcode;
        if (media.node) {
            shortcode = media.node.shortcode
        } else {
            retMedia = media;
            shortcode = media.data.shortcode_media.shortcode;
        }


        var jsonvars = {
            shortcode: shortcode,
            first: 48
        }

        if (media.data && media.data.shortcode_media && media.data.shortcode_media.edge_liked_by && media.data.shortcode_media.edge_liked_by.page_info.has_next_page === true) {
            jsonvars.after = media.data.shortcode_media.edge_liked_by.page_info.end_cursor;
        }

        var urljsonvars = JSON.stringify(jsonvars);

        var url = 'https://www.instagram.com/graphql/query/?query_hash=1cb6ec562846122743b61e492c85999f&variables=' + encodeURIComponent(urljsonvars);

        $.ajax(url).done(function(r) {

            if (retMedia == false) {
                retMedia = r;
            } else {
                for (var i = 0; i < r.data.shortcode_media.edge_liked_by.edges.length; i++) {
                    retMedia.data.shortcode_media.edge_liked_by.edges.push(r.data.shortcode_media.edge_liked_by.edges[i].node);
                }
            }

            if (r.data.shortcode_media.edge_liked_by.page_info.has_next_page === true) {
                retMedia.data.shortcode_media.edge_liked_by.page_info.end_cursor = r.data.shortcode_media.edge_liked_by.page_info.end_cursor;
                outputMessage('waiting 2 seconds to load more likes');

                if ((gblOptions.limitQueue == true && retMedia.data.shortcode_media.edge_liked_by.edges.length > gblOptions.maxAcctQueueLength)) {
                    resolve(retMedia);
                    return false;
                }

                setTimeout(function() {
                    resolve(loadLikesForMedia(retMedia));
                }, 2000);
            } else {
                resolve(retMedia);
            }


        }).fail(function(f) {
            if (f.status == 429) {
                outputMessage('429 rate limit from instagram. waiting 60 seconds to attempt load more likers');
                setTimeout(function() {
                    resolve(loadLikesForMedia(media));
                }, 60000);
            }
        });

    });
}


function getLikersFromMediaArray() {
    let accountsThatLiked = [];

    for (var i = 0; i < mediaForLikes.length; i++) {
        var media = mediaForLikes[i];

        for (var j = 0; j < media.data.shortcode_media.edge_liked_by.edges.length; j++) {
            var like = media.data.shortcode_media.edge_liked_by.edges[j].node;
            if (typeof like == 'undefined') {
                like = media.data.shortcode_media.edge_liked_by.edges[j];
            }
            if (accountIdsThatLiked.indexOf(like.id) == -1) {
                accountIdsThatLiked.push(like.id);
                accountsThatLiked.push(like);
            }
        }
    }

    if (acctsQueue.length == 0) {
        acctsQueue = accountsThatLiked;
    } else {
        for (var i = 0; i < accountsThatLiked.length; i++) {
            if ((gblOptions.limitQueue == true && acctsQueue.length < gblOptions.maxAcctQueueLength) || gblOptions.limitQueue == false) {
                if (findAcctById(accountsThatLiked[i].id, acctsQueue) === false) {
                    acctsQueue.push(accountsThatLiked[i]);
                }
            } else {
                arrayOfUsersToDiv(accountsThatLiked, false);
                handleCheckBoxes(accountsThatLiked);
                handleImagePreload();
                return false;
            }
        }
    }

    arrayOfUsersToDiv(accountsThatLiked, false);
    handleCheckBoxes(accountsThatLiked);
    handleImagePreload();
}


function ajaxGetPendingFollowRequests(after) {
    $('#btnLoadPendingRequests').addClass('pulsing');

    if (typeof after != 'string') {
        acctsQueue = [];
        after = '';
    }

    var url = 'https://www.instagram.com/accounts/access_tool/current_follow_requests?__a=1';

    if (after != '') {
        url = url + '&cursor=' + after;
    }

    $.ajax(url)
        .done(function(r) {
            var tmpQueue = [];

            var promises = [];

            $(r.data.data).each(function(edge) {

                var u = {
                    username: $(this)[0].text
                }

                var promise = new Promise(async function(resolve, reject) {
                    u = await getAdditionalDataForAcct(u);
                    acctsQueue.push(u);
                    tmpQueue.push(u);
                    resolve(u);
                });
                promises.push(promise);

            });

            var result = Promise.all(promises);

            result.then(function(data) {
                arrayOfUsersToDiv(tmpQueue, false);
                handleCheckBoxes(tmpQueue);
                handleImagePreload();
            })

            outputMessage('Loaded ' + tmpQueue.length + ' additional pending requests, ' + acctsQueue.length + ' pending requests loaded so far');


            if (r.data.cursor && (acctsQueue.length < parseInt(gblOptions.maxAcctQueueLength) || gblOptions.limitQueue != true)) {
                ajaxGetPendingFollowRequests(r.data.cursor);
            } else {
                $('#btnLoadPendingRequests').removeClass('pulsing');
                outputMessage('Pending requests loaded.  Count: ' + acctsQueue.length);
            }


        }).fail(function(f) {
            if (f.status == 429) {
                outputMessage('429 rate limit from instagram. waiting 1 minute to attempt load more of your followers, please be patient!');
                setTimeout(function() {
                    ajaxGetPendingFollowRequests(after);
                }, 60000);
            }
        });


}


function ajaxGetAllUsersFollowers(after) {
    if (typeof after != 'string') {
        // acctsQueue = [];
        after = '';

        if (currentProfilePage.edge_followed_by.count > gblOptions.maxAcctQueueLength && gblOptions.limitQueue == true) {
            var promptAfter = window.prompt("Account has " + currentProfilePage.edge_followed_by.count + " followers, but your queue limit is set to " + gblOptions.maxAcctQueueLength + ". \n\n Enter follower number to begin at (0 is the most recent follower).", "0")
            if (!isNaN(parseInt(promptAfter))) {
                gblOptions.truncateStart = parseInt(promptAfter);
            }
        }
    }

    var jsonvars = {
        id: currentProfilePage.id,
        first: 48
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var url = 'https://www.instagram.com/graphql/query/?query_hash=37479f2b8209594dde7facb0d904896a&variables=' + encodeURIComponent(urljsonvars);

    $.ajax(url)
        .done(function(r) {

            var tmpQueue = [];

            $(r.data.user.edge_followed_by.edges).each(function(edge) {
                var u = $(this)[0].node;
                acctsQueue.push(u);
                tmpQueue.push(u);
            });

            arrayOfUsersToDiv(tmpQueue, false);
            handleCheckBoxes(tmpQueue);
            handleImagePreload();

            outputMessage('Loaded ' + tmpQueue.length + ' additional followers, ' + acctsQueue.length + ' followers loaded so far');


            if (r.data.user.edge_followed_by.page_info.has_next_page == true && (acctsQueue.length < (parseInt(gblOptions.truncateStart) + parseInt(gblOptions.maxAcctQueueLength)) || gblOptions.limitQueue != true || currentProfilePage.edge_followed_by.count < parseInt(gblOptions.maxAcctQueueLength))) {
                ajaxGetAllUsersFollowers(r.data.user.edge_followed_by.page_info.end_cursor);
            } else {

                truncateQueue(gblOptions.truncateStart);

                $('#btnProcessQueue').removeClass('pulsing');

                arrayOfUsersToDiv(acctsQueue, true);
                handleCheckBoxes(acctsQueue);
                handleImagePreload();


                outputMessage(currentProfilePage.username + ' followers loaded.  Count: ' + acctsQueue.length);
                outputMessage(' ');

            }


        }).fail(function(f) {
            if (f.status == 429) {
                outputMessage('429 rate limit from instagram. waiting 1 minute to attempt load more of your followers, please be patient!');
                setTimeout(function() {
                    ajaxGetAllUsersFollowers(after);
                }, 60000);
            }
        });

}


function ajaxLoadFollowing(after) {

    if (typeof after != 'string') {
        // acctsQueue = [];
        after = '';

        if (currentProfilePage.edge_follow.count > gblOptions.maxAcctQueueLength && gblOptions.limitQueue == true) {
            var promptAfter = window.prompt("Account is following " + currentProfilePage.edge_follow.count + " accounts, but your queue limit is set to " + gblOptions.maxAcctQueueLength + ". \n\n Enter following number to begin at (0 is the most recent following).", "0")
            if (!isNaN(parseInt(promptAfter))) {
                gblOptions.truncateStart = parseInt(promptAfter);
            }
        }
    }

    var jsonvars = {
        id: currentProfilePage.id,
        first: 48
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var url = 'https://www.instagram.com/graphql/query/?query_hash=58712303d941c6855d4e888c5f0cd22f&variables=' + encodeURIComponent(urljsonvars);


    $.ajax(url)
        .done(function(r) {

            var tmpQueue = [];

            $(r.data.user.edge_follow.edges).each(function(edge) {
                var u = $(this)[0].node;
                acctsQueue.push(u);
                tmpQueue.push(u);
            });

            arrayOfUsersToDiv(tmpQueue, false);
            handleCheckBoxes(tmpQueue);
            handleImagePreload();

            outputMessage('Loaded ' + tmpQueue.length + ' additional following, ' + acctsQueue.length + ' following loaded so far');


            if (r.data.user.edge_follow.page_info.has_next_page == true && (acctsQueue.length < (parseInt(gblOptions.truncateStart) + parseInt(gblOptions.maxAcctQueueLength)) || gblOptions.limitQueue != true || currentProfilePage.edge_follow.count < parseInt(gblOptions.maxAcctQueueLength))) {
                ajaxLoadFollowing(r.data.user.edge_follow.page_info.end_cursor);
            } else {
                truncateQueue(gblOptions.truncateStart);

                arrayOfUsersToDiv(acctsQueue, true);
                handleCheckBoxes(acctsQueue);
                handleImagePreload();


                outputMessage(currentProfilePage.username + ' following loaded.  Count: ' + acctsQueue.length);
                outputMessage(' ');

                loadedTheirFollowings = true;
            }

        });
}


function ajaxGetAllMyFollowers(after) {
    var jsonvars = {
        id: user.viewer.id,
        first: 48
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var url = 'https://www.instagram.com/graphql/query/?query_hash=37479f2b8209594dde7facb0d904896a&variables=' + encodeURIComponent(urljsonvars);

    if (after != '') {
        url = url + '&after=' + after;
    }

    $.ajax(url)
        .done(function(r) {

            var tmpQueue = [];

            $(r.data.user.edge_followed_by.edges).each(function(edge) {
                var u = $(this)[0].node;
                myFollowers.push(u);
                tmpQueue.push(u);
            });

            outputMessage('Loaded ' + tmpQueue.length + ' additional followers, ' + myFollowers.length + ' of your followers loaded so far');

            if (r.data.user.edge_followed_by.page_info.has_next_page == true) {
                ajaxGetAllMyFollowers(r.data.user.edge_followed_by.page_info.end_cursor);
            } else {
                outputMessage('Your Followers loaded.  Count: ' + myFollowers.length);
                outputMessage(' ');

                loadedMyFollowers = true;
            }

        }).fail(function(f) {
            if (f.status == 429) {
                outputMessage('429 rate limit from instagram. waiting 1 minute to attempt load more of your followers, please be patient!');
                setTimeout(function() {
                    ajaxGetAllMyFollowers(after);
                }, 60000);
            }
        });

}


function ajaxGetAllMyFollowing(after) {

    var jsonvars = {
        id: user.viewer.id,
        first: 48
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var url = 'https://www.instagram.com/graphql/query/?query_hash=58712303d941c6855d4e888c5f0cd22f&variables=' + encodeURIComponent(urljsonvars);

    $.ajax(url)
        .done(function(r) {

            var tmpQueue = [];

            $(r.data.user.edge_follow.edges).each(function(edge) {
                var u = $(this)[0].node;
                acctsQueue.push(u);
                tmpQueue.push(u);
            });

            if (document.getElementById('cbShowUnfollowingInQueue').checked == true) {
                arrayOfUsersToDiv(tmpQueue, false);
                handleCheckBoxes(tmpQueue);
                handleImagePreload();
                var igBotQueueContainer = document.getElementById('igBotQueueContainer');
                igBotQueueContainer.scrollTop = igBotQueueContainer.scrollHeight;
            }

            outputMessage('Loaded ' + tmpQueue.length + ' additional followings, ' + acctsQueue.length + ' of your following loaded so far');


            if (r.data.user.edge_follow.page_info.has_next_page == true) {
                ajaxGetAllMyFollowing(r.data.user.edge_follow.page_info.end_cursor);
            } else {
                outputMessage('Your following loaded.  Count: ' + acctsQueue.length);
                outputMessage(' ');

                loadedMyFollowings = true;
            }

        }).fail(function(f) {
            if (f.status == 429) {
                outputMessage('429 rate limit from instagram. waiting 1 minute to attempt load more of your following, please be patient!');
                setTimeout(function() {
                    ajaxGetAllMyFollowing(after);
                }, 60000);
            }
        });
}




function isAdditionalDataFullyLoaded(q) {
    for (var i = 0; i < q.length; i++) {
        if (!q[i].edge_followed_by) {
            return false;
        }
    }
    return true;
}



function sortQueue(q, property, asc) {
    var propertySplit = property.split('.');

    if (propertySplit.length === 1) {
        q.sort(function(a, b) {
            if (asc == true) {
                return a[property] - b[property];
            } else {
                return b[property] - a[property];
            }
        });
    } else if (propertySplit.length === 2) {
        q.sort(function(a, b) {
            if (asc == true) {
                return a[propertySplit[0]][propertySplit[1]] - b[propertySplit[0]][propertySplit[1]];
            } else {
                return b[propertySplit[0]][propertySplit[1]] - a[propertySplit[0]][propertySplit[1]];
            }
        });
    }

    return q;
}



function appendLastPostDateToAcct(a) {
    if (a.edge_owner_to_timeline_media.count > 0) {
        var sortedMedia = sortQueue(a.edge_owner_to_timeline_media.edges, 'node.taken_at_timestamp', false);
        var lastMediaDate = 0;
        if (sortedMedia.length > 0 && sortedMedia[0].node.taken_at_timestamp != 'undefined') {
            lastMediaDate = sortedMedia[0].node.taken_at_timestamp * 1000;
        }
        a.lastPostDate = lastMediaDate;
    }
}

function appendFollowersRatioToAcct(a) {
    if (a.edge_follow.count > 0 && a.edge_followed_by.count > 0) {
        a.followRatio = a.edge_followed_by.count / a.edge_follow.count;
    } else if (a.edge_followed_by.count > 0) {
        a.followRatio = a.edge_followed_by.count;
    } else {
        a.followRatio = 0;
    }
}

function appendLastPostDateToAccts(q) {
    for (var i = 0; i < q.length; i++) {
        appendLastPostDateToAcct(q[i]);
    }
}

function appendFollowersRatioToAccts(q) {
    for (var i = 0; i < q.length; i++) {
        appendFollowersRatioToAcct(q[i]);
    }
}

function truncateQueue(start) {
    if (isNaN(parseInt(start))) start = 0;

    if (acctsQueue.length > gblOptions.maxAcctQueueLength && gblOptions.limitQueue != false) {
        var end = (start + gblOptions.maxAcctQueueLength);

        acctsQueue = acctsQueue.slice(start, end);

    }
}

function arrayOfUsersToDiv(q, clearDiv) {

    if (typeof clearDiv == 'undefined') clearDiv = true;

    if (clearDiv === true) {
        $('#igBotQueueContainer').children().remove();
    } else {
        $('#igBotQueueContainer').children().not('.igBotQueueAcct').remove();
    }

    var c = document.createDocumentFragment();
    for (var i = 0; i < q.length; i++) {
        var u = q[i];

        // already exists in displayed list
        if (document.getElementById('' + u.id + '_container')) continue;

        var newQueueItem = document.createElement("div");
        newQueueItem.id = '' + u.id + '_container';
        newQueueItem.className = 'igBotQueueAcct';

        var newCheckBox = document.createElement("input");
        newCheckBox.setAttribute('type', 'checkbox');
        newCheckBox.id = u.id;
        newCheckBox.value = u.id;
        newCheckBox.className = 'igBotQueueAcctCheckbox';
        newQueueItem.appendChild(newCheckBox);

        var newLabel = document.createElement("label");
        newLabel.setAttribute('for', u.id);

        var newImg = document.createElement("img");
        newImg.className = 'igBotQueueAcctProfilePicture';
        newImg.setAttribute('data-src', u.profile_pic_url);
        newLabel.appendChild(newImg);

        newQueueItem.appendChild(newLabel);

        var newLayoutDiv = document.createElement("div");
        newLayoutDiv.className = "igBotQueueAcctNameHolder";

        var newA = document.createElement("a");
        newA.href = '/' + u.username + '/';
        newA.textContent = u.username;
        newA.className = 'igBotQueueAcctUserName';
        if (u.is_private && u.is_private == true) {
            var iconPrivate = document.createElement('span');
            iconPrivate.className = 'iconPrivate';
            newA.appendChild(iconPrivate);
        }
        if (u.is_verified && u.is_verified == true) {
            var iconVerified = document.createElement('span');
            iconVerified.className = 'iconVerified';
            newA.appendChild(iconVerified);
        }
        newLayoutDiv.appendChild(newA);

        var nameSpan = document.createElement("span");
        nameSpan.className = 'igBotQueueAcctUserName';
        nameSpan.textContent = u.full_name;
        newLayoutDiv.appendChild(nameSpan);

        // var bio = document.createElement('span');
        // bio.textContent = r.user.biography;
        // igBotQueueAcctNameHolder.appendChild(bio);

        if (u.edge_followed_by) {
            var counts = document.createElement('span');
            counts.className = 'followerCounts'
            counts.textContent = u.edge_followed_by.count + ' | ' + u.edge_follow.count + ' | ' + u.edge_owner_to_timeline_media.count;
            counts.title = u.edge_followed_by.count + ' followers | ' + u.edge_follow.count + ' following' + ' | ' + u.edge_owner_to_timeline_media.count + ' posts | ' + new Date(u.lastPostDate).toString() + ' last post';
            newLayoutDiv.appendChild(counts);
        }

        newQueueItem.appendChild(newLayoutDiv);

        c.appendChild(newQueueItem);

    }

    document.getElementById('igBotQueueContainer').appendChild(c);

}






function arrayOfMediaToDiv(q, clearDiv) {

    if (typeof clearDiv == 'undefined') clearDiv = true;

    if (clearDiv === true) {
        $('#igBotMediaQueueContainer').children().remove();
    } else {
        $('#igBotMediaQueueContainer').children().not('.igBotQueueAcct').remove();
    }

    var c = document.createDocumentFragment();
    for (var i = 0; i < q.length; i++) {
        var u = q[i];

        // already exists in displayed list
        if (document.getElementById('' + u.id + '_container')) continue;

        var newQueueItem = document.createElement("div");
        newQueueItem.id = '' + u.id + '_container';
        newQueueItem.className = 'igBotQueueAcct';

        var newCheckBox = document.createElement("input");
        newCheckBox.setAttribute('type', 'checkbox');
        newCheckBox.id = u.id;
        newCheckBox.value = u.id;
        newCheckBox.className = 'igBotQueueAcctCheckbox';
        newQueueItem.appendChild(newCheckBox);

        var newLabel = document.createElement("label");
        newLabel.setAttribute('for', u.id);



        var newImg = document.createElement("img");
        newImg.className = 'igBotQueueAcctProfilePicture';
        newImg.setAttribute('data-src', u.display_url);
        newLabel.appendChild(newImg);

        newQueueItem.appendChild(newLabel);

        var newLayoutDiv = document.createElement("div");
        newLayoutDiv.className = "igBotQueueAcctNameHolder";

        var newA = document.createElement("a");
        newA.href = '/' + u.owner.username + '/';
        newA.textContent = u.owner.username;
        newA.className = 'igBotQueueAcctUserName';
        newLayoutDiv.appendChild(newA);


        if (u.location) {
            newAlocation = document.createElement("a");
            newAlocation.href = '/explore/locations/' + u.location.id + '/' + u.location.slug + '/';
            newAlocation.textContent = u.location.name;
            newAlocation.className = 'igBotQueueAcctUserName';
            newLayoutDiv.appendChild(newAlocation);
        }


        if (u.edge_media_to_caption.edges.length > 0) {
            var caption = document.createElement('span');
            caption.className = 'igBotQueueCaption';
            caption.textContent = u.edge_media_to_caption.edges[0].node.text;
            newLayoutDiv.appendChild(caption);
        }


        if (u.edge_media_preview_comment) {
            var counts = document.createElement('span');
            counts.className = 'followerCounts'
            counts.textContent = u.edge_media_preview_comment.count + '  comments | ' + u.edge_media_preview_like.count + ' likes';
            newLayoutDiv.appendChild(counts);
        }


        newQueueItem.appendChild(newLayoutDiv);

        c.appendChild(newQueueItem);

    }

    document.getElementById('igBotMediaQueueContainer').appendChild(c);

}




function handleImagePreload() {
    const images = document.querySelectorAll('#igBotQueueContainerContainer img');
    const config = {
        rootMargin: '0px 0px 50px 0px',
        threshold: 0
    };
    let loaded = 0;

    let observer = new IntersectionObserver(function(entries, self) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                preloadImage(entry.target);
                // Stop watching and load the image
                self.unobserve(entry.target);
            }
        });
    }, config);

    images.forEach(image => {
        if (image.hasAttribute('data-src')) {
            observer.observe(image);
        }
    });

    function preloadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src) {
            return;
        }
        img.src = src;
        img.removeAttribute('data-src');
    }

}

function handleCheckBoxes(q) {

    document.getElementById('igBotQueueCount').textContent = '' + q.length + ' accounts';
    document.getElementById('igBotQueueFilter').style.display = 'none';
    document.getElementById('igBotQueueOrderBy').style.display = 'none';

    if (q.length > 1) {
        document.getElementById('igBotQueueFilter').style.display = 'flex';
        document.getElementById('igBotQueueOrderBy').style.display = 'flex';
    }

    function filterQueue() {
        var filterString = document.getElementById('igBotQueueFilter').value;
        for (var i = 0; i < q.length; i++) {
            var u = q[i];
            if (u.username.indexOf(filterString) > -1) {
                document.getElementById(u.id + '_container').style.visibility = 'visible';
                document.getElementById(u.id + '_container').style.display = 'flex';
            } else {
                document.getElementById(u.id + '_container').style.visibility = 'hidden';
                document.getElementById(u.id + '_container').style.display = 'none';
            }
        }
    }


    function displaySelectedCount() {
        let boxCheckedCount = 0;
        boxes.forEach(box => {
            if (box.checked == true) boxCheckedCount++;
        });
        document.getElementById('igBotQueueSelectedCount').textContent = '' + boxCheckedCount + ' selected';
    }

    function selectAllCheckBoxes() {
        boxes.forEach(box => {
            if (document.getElementById(box.value + '_container').style.visibility != 'hidden') box.checked = true;
        });
        displaySelectedCount();
    }

    function selectNoneCheckBoxes() {
        boxes.forEach(box => {
            if (document.getElementById(box.value + '_container').style.visibility != 'hidden') box.checked = false;
        });
        displaySelectedCount();
    }

    function invertCheckBoxes() {
        boxes.forEach(box => box.checked = !box.checked);
        displaySelectedCount();
    }

    function removeSelected() {

        var useDefaultList = true;

        if (currentList == 'acctsWhiteList' || currentList == 'mediaToLike') {
            useDefaultList = false;
        }

        boxes.forEach(box => {
            if (box.checked) {
                if (useDefaultList == true) {
                    acctsQueue = acctsQueue.filter(u => u.id !== box.value);
                } else if (currentList == 'acctsWhiteList') {
                    acctsWhiteList = acctsWhiteList.filter(u => u.id !== box.value);
                } else if (currentList == 'mediaToLike') {
                    mediaToLike = mediaToLike.filter(m => m.id !== box.value);
                }

                $('#' + box.value + '_container').remove();
            }
        });
        refreshBoxes();
        updateCount();
        displaySelectedCount();

        //arrayOfUsersToDiv(acctsQueue, true);
    }

    function addAcctsToWhiteList() {
        boxes.forEach(box => {
            if (box.checked) {
                var acct = findAcctById(box.value, acctsQueue);
                addAcctToWhiteList(acct);
            }
        });

        return true;
    }

    function checkIntermediateBoxes(first, second) {
        if (boxes.indexOf(first) > boxes.indexOf(second)) {
            [second, first] = [first, second];
        }
        // intermediateBoxes(first, second).forEach(box => box.checked = true);
        intermediateBoxes(first, second).forEach(box => {
            if (document.getElementById(box.value + '_container').style.visibility != 'hidden') {
                box.click();
            }
        });
        displaySelectedCount();
    }

    function intermediateBoxes(start, end) {
        return boxes.filter((item, key) => {
            return boxes.indexOf(start) < key && key < boxes.indexOf(end);
        });
    }

    function changeBox(event) {
        if (event.shiftKey && this != lastChecked) {
            checkIntermediateBoxes(lastChecked, this);
        }
        lastChecked = this;
        displaySelectedCount();
    }

    function refreshBoxes() {
        boxes = Array.from(document.querySelectorAll('#igBotQueueContainerContainer [type="checkbox"]'));
    }

    let lastChecked;
    var boxes;

    refreshBoxes();

    boxes.forEach(item => item.addEventListener('click', changeBox));

    $('#btnSelectAll').off('click.selectAllCheckBoxes').on('click.selectAllCheckBoxes', selectAllCheckBoxes);
    $('#btnSelectNone').off('click.selectNoneCheckBoxes').on('click.selectNoneCheckBoxes', selectNoneCheckBoxes);
    $('#btnInvertSelection').off('click.invertCheckBoxes').on('click.invertCheckBoxes', invertCheckBoxes);
    $('#btnRemoveSelected').off('click.removeSelected').on('click.removeSelected', removeSelected);
    $('#btnAddToWhiteList').off('click.addAcctsToWhiteList').on('click.addAcctsToWhiteList', addAcctsToWhiteList);
    $('#btnSaveWhiteList').off('click.saveWhiteListToStorageAndDisk').on('click.saveWhiteListToStorageAndDisk', saveWhiteListToStorageAndDisk);
    $('#igBotQueueFilter').off('input.filterQueue').on('input.filterQueue', filterQueue);
    $('.close-icon').off('click.filterQueue').on('click.filterQueue', function() {
        setTimeout(filterQueue, 1);
    });
    //$('.igBotInjectedButton').off('click.displaySelectedCount').on('click.displaySelectedCount', displaySelectedCount);

    updateCount();
    displaySelectedCount();
}


function alreadyAttempted(acct) {

    if (typeof acct == 'undefined') return false;

    for (var i = 0; i < acctsPreviouslyAttempted.length; i++) {
        if (acctsPreviouslyAttempted[i].id && acctsPreviouslyAttempted[i].id == acct.id) return acctsPreviouslyAttempted[i];
    }

    return false;
}

function addToAttempted(acct) {

    var acctCopy = acct;

    var d = new Date();
    acctCopy["followAttemptDate"] = '' + d.getTime();

    acctsPreviouslyAttempted.push(acctCopy);
    chrome.storage.local.set({
        acctsAttempted: acctsPreviouslyAttempted
    });
}

function ajaxFollowAllFollowings() {
    acctsQueue = theirFollowings;
    ajaxFollowAll();
}

function ajaxFollowAll() {
    if (acctsQueue.length == 0) {
        outputMessage('No accounts left!');
        $('#btnProcessQueue').removeClass('pulsing');
        return false;
    }

    ajaxFollowUser(acctsQueue.shift());
}

function removeAcctFromQueueDisplay(id, gray) {
    if (gray === true) {
        $('#igBotQueueContainer #' + id + '_container').css({
            'opacity': '.5'
        });
    } else {
        $('#igBotQueueContainer #' + id + '_container').fadeOut(300, function() {
            $(this).remove();
        });
    }
    updateCount();
}

function updateCount() {
    if (currentList === 'acctsWhiteList') {
        document.getElementById('igBotQueueCount').textContent = '' + acctsWhiteList.length + ' accounts';
    } else {
        document.getElementById('igBotQueueCount').textContent = '' + acctsQueue.length + ' accounts';
    }
}

function addStamp(id, classname, text) {

    if (gblOptions.removeAccountsFromQueue === true) {
        removeAcctFromQueueDisplay(id);
        return false;
    }

    if (gblOptions.showStamps === true) {
        $('#' + id + '_container label').append('<div class="stamp-div ' + classname + '">' + text + '</div>');
        return true;
    }

    return false;

}

function getRandomizedTime(baseTime) {
    if (gblOptions.useRandomTimeDelay == true) {
        var minRandomTimeDelay = Math.max(0, baseTime - (baseTime * gblOptions.percentRandomTimeDelay));
        var maxRandomTimeDelay = baseTime + (baseTime * gblOptions.percentRandomTimeDelay);
        return getRandomInt(minRandomTimeDelay, maxRandomTimeDelay);
    }
    return baseTime;
}

function usersMediaLoaded(r) {
    var alreadyLiking = false;
    if (mediaToLike.length > 0) alreadyLiking = true;

    var numPicsToLike = parseInt(document.getElementById('numberFollowLikeLatestPics').value);
    if (numPicsToLike > r.data.user.edge_owner_to_timeline_media.edges.length) {
        numPicsToLike = r.data.user.edge_owner_to_timeline_media.edges.length;
    }

    for (var i = 0; i < numPicsToLike; i++) {
        mediaToLike.push(r.data.user.edge_owner_to_timeline_media.edges[i].node);
    }

    if (alreadyLiking === false) likeAllMedia();

}

function ajaxFollowUser(acct) {

    if (gblOptions.autoSaveQueue == true) {
        saveQueueToStorage();
    }


    var promises = [];
    let followable = true;

    if (!acct) {
        outputMessage('no account');
        return false;
    }

    var acctFromStorage = alreadyAttempted(acct);
    var waitTime = getRandomizedTime(gblOptions.timeDelayAfterSkip);
    var acctsQueueNextUsername = '';
    if (acctsQueue.length > 0) {
        acctsQueueNextUsername = acctsQueue[0].username;
    }

    if (gblOptions.followPeopleAlreadyAttempted === false && acctFromStorage !== false) {
        acctsProcessed.push(acct);
        outputMessage(acct.username + ' already attempted ' + timeToDate(acctFromStorage.followAttemptDate) + ': skipped; waiting  ' + (waitTime / 1000) + ' seconds to follow ' + acctsQueueNextUsername);
        addStamp(acct.id, 'stamp-div-grey', 'attempted');
        setTimeout(ajaxFollowAll, waitTime);
        return false;
    } else if (acct.followed_by_viewer == true) {
        acctsProcessed.push(acct);
        outputMessage(acct.username + ' already being followed: skipped; waiting  ' + (waitTime / 1000) + ' seconds to follow ' + acctsQueueNextUsername);
        addStamp(acct.id, 'stamp-div-grey', 'followed');
        setTimeout(ajaxFollowAll, waitTime);
        return false;
    } else if (acct.requested_by_viewer == true) {
        acctsProcessed.push(acct);
        outputMessage(acct.username + ' already requested: skipped; waiting  ' + (waitTime / 1000) + ' seconds to follow ' + acctsQueueNextUsername);
        addStamp(acct.id, 'stamp-div-grey', 'requested');
        setTimeout(ajaxFollowAll, waitTime);
        return false;
    } else if (acct.is_private == true && gblOptions.followPrivateAccounts != true) {
        acctsProcessed.push(acct);
        outputMessage(acct.username + ' is private: skipped; waiting  ' + (waitTime / 1000) + ' seconds to follow ' + acctsQueueNextUsername);
        addStamp(acct.id, 'stamp-div-grey', 'private');
        setTimeout(ajaxFollowAll, waitTime);
        return false;
    } else if (gblOptions.filterOptions.applyFiltersAutomatically == true) {
        promises.push(filterCriteriaMet(acct).then((met) => {
            if (met == false) {
                followable = false;
            }
        }));
    }

    Promise.all(promises).then(function() {

        if (followable === false) {
            acctsProcessed.push(acct);
            outputMessage(acct.username + ' did not match your filters: skipped; waiting  ' + (waitTime / 1000) + ' seconds to follow ' + acctsQueueNextUsername);
            addStamp(acct.id, 'stamp-div-grey', 'filtered');
            if (noAcctsLeft()) return false;
            outputMessage(' ');
            setTimeout(ajaxFollowAll, waitTime);
            return false;
        }

        $.ajax({
                url: 'https://www.instagram.com/web/friendships/' + acct.id + '/follow/',
                method: 'POST',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                    xhr.setRequestHeader('x-instagram-ajax', '1');
                }
            })
            .done(function() {

                acctsProcessed.push(acct);
                addStamp(acct.id, 'stamp-div-green', 'followed');
                addToAttempted(acct);

                waitTime = getRandomizedTime(gblOptions.timeDelay);

                outputMessage('Followed ' + acct.username + ' (' + acct.id + ') | ' + acctsProcessed.length + ' processed;  waiting  ' + (waitTime / 1000) + ' seconds to follow ' + acctsQueueNextUsername);
                setTimeout(ajaxFollowAll, waitTime);

                if (document.getElementById('cbFollowLikeLatestPics').checked == true) {
                    ajaxLoadUsersMedia('', false, usersMediaLoaded, acct.id);
                }

            })
            .fail(function(data) {
                acctsQueue.unshift(acct);
                if (data.status == 404) {

                } else if (data.status == 403) {
                    outputMessage('soft rate limit encountered, waiting ' + (gblOptions.timeDelayAfterSoftRateLimit / 60000) + ' minutes');
                    setTimeout(ajaxFollowAll, gblOptions.timeDelayAfterSoftRateLimit);
                } else if (data.status == 400) {


                    if (data.responseJSON && data.responseJSON.message) {
                        outputMessage(data.responseJSON.message);
                        // check if they are at the max
                        if (data.responseJSON.message.indexOf('max') > -1) {
                            $('#btnProcessQueue').removeClass('pulsing');
                            alert(data.responseJSON.message);
                            alert('If you have reached the maximum number of following, please note that pending follow requests on private accounts are counted by instagram as following.  You can see your pending requests by clicking the Load Pending Follow Requests button.');
                            return false;
                        }
                    }

                    outputMessage('hard rate limit encountered, waiting ' + (gblOptions.timeDelayAfterHardRateLimit / 3600000) + ' hours');
                    setTimeout(ajaxFollowAll, gblOptions.timeDelayAfterHardRateLimit);

                } else {
                    outputMessage(data.status + ' error, trying again in 5 seconds');
                    setTimeout(ajaxFollowAll, 5000);
                }
            });
    });
}



function ajaxLikeAllPostsFromHashtag(after) {

    if (typeof after != 'string') after = '';

    var hashtag = getHashtagFromUrl();

    if (hashtag == '') {
        outputMessage('Error - not on hashtag page');
        return false;
    }

    var jsonvars = {
        "tag_name": hashtag,
        "first": 128
    }

    if (after != '') {
        jsonvars.after = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var count = 50;

    if (!isNaN(document.getElementById('numberToLikeHashtag').value)) {
        count = document.getElementById('numberToLikeHashtag').value;
    }


    var url = 'https://www.instagram.com/graphql/query/?query_hash=3c59962ff3f8bf58da9399b782d735f4&variables=' + encodeURIComponent(urljsonvars);

    document.getElementById('btnLikeHashtag').classList.add('pulsing');

    $.ajax(url)
        .done(function(r) {
            if (r.data.hashtag) {
                for (var i = 0; i < r.data.hashtag.edge_hashtag_to_media.edges.length; i++) {
                    mediaToLike.push(r.data.hashtag.edge_hashtag_to_media.edges[i].node);
                }
                if (r.data.hashtag.edge_hashtag_to_media.page_info.has_next_page == true) {
                    after = r.data.hashtag.edge_hashtag_to_media.page_info.end_cursor;
                }
            } else {
                outputMessage(' ');
                outputMessage(' ');

                outputMessage('Error liking hashtag - please report to instabotautomator@gmail.com');
                outputMessage(' ');
                outputMessage(' ');
            }

            if (after != '' && mediaToLike.length < count) {
                outputMessage(mediaToLike.length + ' media out of ' + count + ' loaded to queue for liking')
                setTimeout(function() {
                    ajaxLikeAllPostsFromHashtag(after);
                }, 500);
            } else {
                if (mediaToLike.length > count) mediaToLike = mediaToLike.slice(0, count);
                likeAllMedia();
            }

        });
}



function ajaxLikeAllPostsFromFeed(after) {

    if (typeof after != 'string') after = '';

    var jsonvars = {
        "fetch_media_item_count": 24,
        "fetch_comment_count": 4,
        "fetch_like": 10,
        "has_stories": false
    }

    if (after != '') {
        jsonvars.fetch_media_item_cursor = after;
    }

    var urljsonvars = JSON.stringify(jsonvars);

    var count = 50;
    if (!isNaN(document.getElementById('numberToLike').value)) {
        count = document.getElementById('numberToLike').value;
    }


    var url = 'https://www.instagram.com/graphql/query/?query_hash=615767824d774172a86e99cbaca97512&variables=' + encodeURIComponent(urljsonvars);

    document.getElementById('btnLikeFeed').classList.add('pulsing');

    $.ajax(url)
        .done(function(r) {
            if (r.data.user) {
                for (var i = 0; i < r.data.user.edge_web_feed_timeline.edges.length; i++) {
                    mediaToLike.push(r.data.user.edge_web_feed_timeline.edges[i].node);
                }
                if (r.data.user.edge_web_feed_timeline.page_info.has_next_page == true) {
                    after = r.data.user.edge_web_feed_timeline.page_info.end_cursor;
                }
            } else {
                outputMessage(' ');
                outputMessage(' ');

                outputMessage('Error liking feed - please report to instabotautomator@gmail.com');
                outputMessage(' ');
                outputMessage(' ');
            }

            if (after != '' && mediaToLike.length < count) {
                outputMessage(mediaToLike.length + ' media out of ' + count + ' loaded to queue for liking')
                setTimeout(function() {
                    ajaxLikeAllPostsFromFeed(after);
                }, 500);
            } else {
                if (mediaToLike.length > count) mediaToLike = mediaToLike.slice(0, count);
                likeAllMedia();
            }

        });
}

function likeAllMedia() {
    if (gblOptions.showLikesInQueue === true) {
        if (queueSplit === false) {
            queueSplit = Split(['#igBotQueueContainer', '#igBotMediaQueueContainer'], { sizes: [55, 45], gutterSize: 20, minSize: 0 }); // split.js
        }
        arrayOfMediaToDiv(mediaToLike, false);
        handleImagePreload();
        handleCheckBoxes(mediaToLike);
    }

    if (mediaToLike.length == 0) {
        outputMessage('Finished liking media');
        $('#btnLikeFeed,#btnLikeHashtag').removeClass('pulsing');
        return false;
    }

    var media = mediaToLike.pop();
    var id = media.id;

    for (var i = 0; i < previousLikes.length; i++) {
        if (id == previousLikes[i]) {
            outputMessage('Already liked, moving on...');
            addStamp(media.id, 'stamp-div-grey', 'skipped');

            setTimeout(likeAllMedia, 1);
            return false;
        }
    }

    likeMedia(media);
}

function likeMedia(media) {
    $.ajax({
            url: 'https://www.instagram.com/web/likes/' + media.id + '/like/',
            method: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                xhr.setRequestHeader('x-instagram-ajax', '1');
            }
        })
        .done(function() {
            previousLikes.push(media.id);

            savePreviousLikesToStorage();

            if (mediaToLike.length > 0) {
                outputMessage('Like successful, ' + mediaToLike.length + ' pending');
            } else {
                outputMessage('Like successful');
            }

            addStamp(media.id, 'stamp-div-green', 'liked');


            var waitTime = getRandomizedTime(gblOptions.timeDelay);

            if (mediaToLike.length > 0) {
                outputMessage('waiting  ' + (waitTime / 1000) + ' seconds to Like next');
                setTimeout(likeAllMedia, waitTime);
            }

        })
        .fail(function(data) {
            mediaToLike.push(media);
            if (data.status == 403) {
                outputMessage('soft rate limit encountered, waiting 60 seconds to like next');
                setTimeout(likeAllMedia, 60000);
            } else if (data.status == 400) {
                outputMessage('hard rate limit encountered, waiting 5 minutes to like next');
                setTimeout(likeAllMedia, 300000);
            } else {
                outputMessage(data.status + ' error, trying again in 5 seconds');
                setTimeout(likeAllMedia, 5000);
            }
        });
}

async function populateAllQueueUsersInfo(q) {
    for (var i = 0; i < q.length; i++) {
        q[i] = await getAdditionalDataForAcct(q[i]);
        if (q[i].assumedDeleted) q.slice(i, 1);
    }

    outputMessage('Done loading additional info for all accounts');

    if (window.confirm('Finished getting additional info, save the queue now?')) {
        saveQueueToStorageAndDisk();
    }
}

function ajaxUnfollowAll() {
    ajaxUnfollowAcct(acctsQueue.pop());
}

function quickUnfollowAcct(acct) {
    $.ajax({
            url: 'https://www.instagram.com/web/friendships/' + acct.id + '/unfollow/',
            method: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                xhr.setRequestHeader('x-instagram-ajax', '1');
            }
        })
        .done(function() {
            outputMessage('Unfollowed ' + acct.username + ' (' + acct.id + ') using button');
            $('.igBotInjectedLinkWhitelist[data-username="' + acct.username + '"]').parents('article').fadeOut();
            //$('.igBotInjectedLinkUnfollow[data-username="' + acct.username + '"]').fadeOut();

        })
        .fail(function(data) {
            if (data.status == 403) {
                alert('soft rate limit encountered, failed to unfollow ' + acct.username);
            } else if (data.status == 400) {
                alert('hard rate limit encountered, failed to unfollow ' + acct.username);
            } else {
                alert('Error ' + data.status + ', failed to unfollow ' + acct.username);
            }
        })
}

function ajaxUnfollowAcct(acct) {

    if (gblOptions.autoSaveQueue == true) {
        saveQueueToStorage();
    }

    var promises = [];
    let unfollowable = true;

    var waitTime = getRandomizedTime(gblOptions.timeDelayAfterSkip);

    if (typeof acct == 'undefined') {
        noAcctsLeft();
        return false;
    }

    if (containsObject(acct, acctsWhiteList) == true) {
        outputMessage(acct.username + ' is whitelisted, skipping');
        addStamp(acct.id, 'stamp-div-grey', 'whitelisted');
        acctsProcessed.push(acct);
        setTimeout(ajaxUnfollowAll, 1);
        return false;
    }


    if (gblOptions.dontUnFollowFilters == true || gblOptions.dontUnFollowFollowers == true || gblOptions.unFollowIfOld == true) {
        promises.push(filterCriteriaMetForUnfollowing(acct).then((met) => {
            if (met == false) {
                unfollowable = false;
            }
        }));
    }

    Promise.all(promises).then(function() {
        if (unfollowable === false) {
            acctsProcessed.push(acct);
            if (noAcctsLeft()) {
                return false;
            } else {
                outputMessage('waiting  ' + (waitTime / 1000) + ' seconds to unfollow ' + acctsQueue[acctsQueue.length - 1].username);
                setTimeout(ajaxUnfollowAll, waitTime);
                return false;
            }
        }


        $.ajax({
                url: 'https://www.instagram.com/web/friendships/' + acct.id + '/unfollow/',
                method: 'POST',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                    xhr.setRequestHeader('x-instagram-ajax', '1');
                }
            })
            .done(function() {

                acctsProcessed.push(acct);
                addStamp(acct.id, 'stamp-div-green', 'unfollowed');

                outputMessage('Unfollowed ' + acct.username + ' (' + acct.id + ') | ' + acctsProcessed.length + ' processed, ' + acctsQueue.length + ' left to go');


                if (noAcctsLeft()) {
                    return false;
                } else {
                    waitTime = getRandomizedTime(gblOptions.timeDelay);
                    outputMessage('waiting  ' + (waitTime / 1000) + ' seconds to unfollow ' + acctsQueue[acctsQueue.length - 1].username);
                    setTimeout(ajaxUnfollowAll, waitTime);
                }

            })
            .fail(function(data) {
                acctsQueue.push(acct);
                if (data.status == 403) {
                    outputMessage('soft rate limit encountered, waiting ' + (gblOptions.timeDelayAfterSoftRateLimit / 60000) + ' minutes');
                    setTimeout(ajaxUnfollowAll, gblOptions.timeDelayAfterSoftRateLimit);
                } else if (data.status == 400) {
                    outputMessage('hard rate limit encountered, waiting ' + (gblOptions.timeDelayAfterHardRateLimit / 3600000) + ' hours');
                    setTimeout(ajaxUnfollowAll, gblOptions.timeDelayAfterHardRateLimit);
                } else {
                    outputMessage(data.status + ' error, trying again in 5 seconds');
                    setTimeout(ajaxUnfollowAll, 5000);
                }
            })
    });

}

function noAcctsLeft() {
    if (acctsQueue.length === 0) {
        outputMessage('No accounts left!');
        $('#btnProcessQueue').removeClass('pulsing');
        return true;
    }
    return false;
}

function injectIcon() {
    var imgURL = chrome.extension.getURL("icon_48.png");

    $('#instabotIcon').remove();
    $('.oJZym').prepend('<div id="instabotIcon"></div>');
    $('#instabotIcon').css({
        'background-image': 'url("' + imgURL + '")'
    }).click(toggleControlsDiv);
}

function injectVersionNumber() {
    document.getElementById('igBotExtensionVersion').textContent = chrome.runtime.getManifest().version;

}

function hideControlsDiv() {
    toggleControlsDiv();
    shakeInstabotIcon();
}

function shakeInstabotIcon() {
    $('#instabotIcon').shake(50, 2, 8);
}

function toggleControlsDiv() {
    $('#igBotInjectedContainer').slideToggle(function() {
        var isVisible = $('#igBotInjectedContainer').is(":visible");
        saveHiddenStatus(!isVisible);
    });
}

function openControlsDiv() {
    var isVisible = $('#igBotInjectedContainer').is(":visible");
    if (isVisible == false) {
        toggleControlsDiv();
    }
}

function injectControlsDiv() {
    $('#igBotInjectedContainer').remove();


    $.get(chrome.extension.getURL('growbot.html'), function(data) {
        $('body').prepend($.parseHTML(data));
        bindEvents();
        loadOptions();
        loadWhiteList();
        loadPreviousAttempts();
        injectVersionNumber();
        ready('.nJAzx', function(element) { addNewConvenienceLinks(element); });
    });


}


(function(win) {
    'use strict';

    var listeners = [],
        doc = win.document,
        MutationObserver = win.MutationObserver || win.WebKitMutationObserver,
        observer;

    function ready(selector, fn) {
        // Store the selector and callback to be monitored
        listeners.push({
            selector: selector,
            fn: fn
        });
        if (!observer) {
            // Watch for changes in the document
            observer = new MutationObserver(check);
            observer.observe(doc.documentElement, {
                childList: true,
                subtree: true
            });
        }
        // Check if the element is currently in the DOM
        check();
    }

    function check() {
        // Check the DOM for elements matching a stored selector
        for (var i = 0, len = listeners.length, listener, elements; i < len; i++) {
            listener = listeners[i];
            // Query for elements matching the specified selector
            elements = doc.querySelectorAll(listener.selector);
            for (var j = 0, jLen = elements.length, element; j < jLen; j++) {
                element = elements[j];
                // Make sure the callback isn't invoked with the 
                // same element more than once
                if (!element.ready) {
                    element.ready = true;
                    // Invoke the callback with the element
                    listener.fn.call(element, element);
                }
            }
        }
    }

    // Expose `ready`
    win.ready = ready;

})(this);



function ajaxLikeAll() {
    if (noAcctsLeft() == false) {
        getUsersMedia(acctsQueue.shift());
    }
}

function getUsersMedia(acct) {

    var acctsQueueNextUsername = '';
    removeAcctFromQueueDisplay(acct.id, true);
    if (noAcctsLeft() === false) {
        acctsQueueNextUsername = acctsQueue[0].username;
    }

    ajaxLoadUsersMedia('', false, usersMediaLoaded, acct.id);

    var waitTime = getRandomizedTime(gblOptions.timeDelay);

    outputMessage('Adding media for ' + acct.username + ' (' + acct.id + ') to like queue;  waiting  ' + (waitTime / 1000) + ' seconds to process ' + acctsQueueNextUsername);
    setTimeout(ajaxLikeAll, waitTime);
}

function initProcessQueue() {

    $('#btnProcessQueue').addClass('pulsing');

    if (document.getElementById('radioFollow').checked === true) {
        initStealFollowers();
    } else if (document.getElementById('radioUnFollow').checked === true) {
        initUnfollowMyFollowers();
    } else if (document.getElementById('radioNone').checked === true) {
        ajaxLikeAll();
    }
}

function bindEvents() {

    $('#igBotInjectedContainer #btnProcessQueue').click(initProcessQueue);

    $('#igBotInjectedContainer input[type="checkbox"]').off('change.checkboxSaveOptions').on('change.checkboxSaveOptions', saveOptions);
    $('#igBotInjectedContainer input[type="text"],#igBotInjectedContainer input[type="number"]').bind('keyup input', saveOptions);
    $('details').off('toggle.detailsToggle').on('toggle.detailsToggle', saveOptions);

    $('#igBotInjectedContainer #btnStop').click(function() {
        window.location.href = window.location.href;
    });

    $('#igBotInjectedContainer #btnLikeFeed').click(ajaxLikeAllPostsFromFeed).children().click(function(e) {
        return false;
    });

    $('#igBotInjectedContainer #btnHide').click(hideControlsDiv);

    $('#btnLoadPendingRequests').click(ajaxGetPendingFollowRequests);


    $('#btnLoadSavedQueue').click(loadSavedQueue);
    $('#btnViewWhiteList').click(viewWhiteList);
    $('#btnSaveQueueToStorage').click(saveQueueToStorageAndDisk);
    $('#btnGetAdditionalUserData').click(function() {
        populateAllQueueUsersInfo(acctsQueue);
    });

    if (getCurrentPageUsername() != '') {
        setCurrentPageUsername();
    } else {
        $('#igBotInjectedContainer #btnGetAllUsersFollowers').off('click.setCurrentPageUsername').on('click.setCurrentPageUsername', setCurrentPageUsername);
        $('#igBotInjectedContainer #btnGetAllUsersFollowing').off('click.setCurrentPageUsername').on('click.setCurrentPageUsername', setCurrentPageUsername);
    }

    if (getHashtagFromUrl() != '') {
        setCurrentPageHashtag();
    } else {
        $('#igBotInjectedContainer #btnLikeHashtag').off('click.setCurrentPageHashtag').on('click.setCurrentPageHashtag', setCurrentPageHashtag);
    }

    $('#btnApplyFilter').off('click.ApplyFilter').on('click.ApplyFilter', applyFiltersManually);

    $('#igBotQueueOrderBy').off('change.sortQueue').on('change.sortQueue', sortQueueSelectionMade);

    $('#iconFilter').off('click.toggleFilters').on('click.toggleFilters', function() {
        $('#multiFilter').slideToggle()
    });

    $('#iconOptions').off('click.toggleOptions').on('click.toggleOptions', function() {
        $('#igBotOptions').slideToggle();


        Contra.addHandler(function() {
            chrome.extension.sendMessage({
                "fnc": "extendTrial"
            });

        });


    });

    $('#igBotMediaQueueContainer').off('click.setCurrentList').on('click.setCurrentList', function() { currentList = 'mediaToLike'; });
    $('#igBotQueueContainer').off('click.setCurrentList').on('click.setCurrentList', function() {
        if (currentList != 'acctsWhiteList') { currentList = 'acctsQueue'; }
    });


    $(document).on('click.convenienceUnFollow', 'a.igBotInjectedLinkUnfollow', function() {
        $(this).off('click.convenienceUnFollow').css({ "color": "white" }).append('<div class="igBotLoader"></div>');
        convenienceLinkUnfollowAcct($(this).attr('data-username'));
    })

    $(document).on('click.convenienceWhitelist', 'a.igBotInjectedLinkWhitelist', function() {
        $(this).off('click.convenienceWhitelist').css({ "color": "white" }).append('<div class="igBotLoader"></div>');
        convenienceLinkWhitelistAcct($(this).attr('data-username'));
    })

}

function applyFiltersManually() {

    if (isAdditionalDataFullyLoaded(acctsQueue) === false) {
        if (window.confirm('Must load additional data about each user account in order to apply filters. Load data now?')) {
            populateAllQueueUsersInfo(acctsQueue).then(applyFiltersManually);
        }
    } else {

        var filtered = [];
        for (let i = acctsQueue.length - 1; i > -1; i--) {
            filtered.push(filterCriteriaMet(acctsQueue[i]).then((met) => {
                if (met === false) {
                    outputMessage(acctsQueue[i].username + ' removed from queue (did not match your filters)');
                    addStamp(acctsQueue[i].id, 'stamp-div-grey', 'removed');
                    acctsQueue.splice(i, 1);
                }
            }));
        }

        Promise.all(filtered).then(function() {
            outputMessage('Filters applied.');
            if (window.confirm('Filters applied.  Save queue now?')) saveQueueToStorageAndDisk();
        });

    }

}

function getAdditionalDataForAcct(a) {
    return new Promise(function(resolve, reject) {

        $.ajax({
                url: 'https://www.instagram.com/' + a.username + '/',
                method: 'GET',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                    xhr.setRequestHeader('x-instagram-ajax', '1');
                }
            })
            .done(function(r) {
                var u = extractJSONfromUserPageHTML(r);

                if (u == false) {
                    gbl404attempt++;
                    if (gbl404attempt < 11) {
                        outputMessage('404 possible rate limit, trying again in 30 seconds (attempt ' + gbl404attempt + ' of 10)');
                        setTimeout(function() {
                            resolve(getAdditionalDataForAcct(a));
                        }, 30000);
                        return false;
                    } else {
                        outputMessage('404 account assumed missing after 10 attempts');
                        a.assumedDeleted = true;
                        gbl404attempt = 0;
                        resolve(a);
                    }
                }


                a = u;

                if (document.getElementById(u.id + '_container')) {
                    var igBotQueueAcctNameHolder = document.getElementById(u.id + '_container').getElementsByClassName('igBotQueueAcctNameHolder')[0];

                    var newA = igBotQueueAcctNameHolder.getElementsByClassName('igBotQueueAcctUserName')[0];
                    if (u.is_private && u.is_private == true) {
                        var iconPrivate = document.createElement('span');
                        iconPrivate.className = 'iconPrivate';
                        newA.appendChild(iconPrivate);
                    }
                    newA.title = u.biography || '';

                    var counts = document.createElement('span');
                    counts.className = 'followerCounts'
                    counts.textContent = u.edge_followed_by.count + ' | ' + u.edge_follow.count + ' | ' + u.edge_owner_to_timeline_media.count;
                    counts.title = u.edge_followed_by.count + ' followers | ' + u.edge_follow.count + ' following' + ' | ' + u.edge_owner_to_timeline_media.count + ' posts';

                    igBotQueueAcctNameHolder.appendChild(counts);
                }

                appendFollowersRatioToAcct(a);
                appendLastPostDateToAcct(a);

                resolve(a);

                gbl404attempt = 0;

            }).fail(function(data) {
                if (data.status == 403) {
                    outputMessage('soft rate limit encountered, waiting ' + (gblOptions.timeDelayAfterSoftRateLimit / 60000) + ' minutes');
                    setTimeout(function() {
                        resolve(getAdditionalDataForAcct(a));
                    }, gblOptions.timeDelayAfterSoftRateLimit);
                } else if (data.status == 400) {
                    outputMessage('hard rate limit encountered, waiting ' + (gblOptions.timeDelayAfterHardRateLimit / 3600000) + ' hours');
                    setTimeout(function() {
                        resolve(getAdditionalDataForAcct(a));
                    }, gblOptions.timeDelayAfterHardRateLimit);
                } else if (data.status == 429) {
                    outputMessage('429 rate limit, trying again in 1 minute');
                    setTimeout(function() {
                        resolve(getAdditionalDataForAcct(a));
                    }, 60000);
                } else if (data.status == 404) {
                    gbl404attempt++;
                    if (gbl404attempt < 11) {
                        outputMessage('404 possible rate limit, trying again in 1 minute (attempt ' + gbl404attempt + ' of 10)');
                        setTimeout(function() {
                            resolve(getAdditionalDataForAcct(a));
                        }, 60000);
                        return false;
                    } else {
                        outputMessage('404 account assumed missing after 10 attempts');
                        a.assumedDeleted = true;
                        resolve(a);
                    }
                } else {
                    outputMessage('' + data.status + ' error, trying again in 5 seconds');
                    setTimeout(function() {
                        resolve(getAdditionalDataForAcct(a));
                    }, 5000);
                }
                gbl404attempt = 0;
            });
    });
}


async function filterCriteriaMet(acct) {
    if (!acct.edge_followed_by) acct = await getAdditionalDataForAcct(acct);

    if (acct.assumedDeleted) return false;

    // console.log(JSON.stringify(acct));

    if (acct.edge_followed_by.count < gblOptions.filterOptions.followers[0] ||
        acct.edge_followed_by.count > gblOptions.filterOptions.followers[1] ||
        acct.edge_follow.count < gblOptions.filterOptions.following[0] ||
        acct.edge_follow.count > gblOptions.filterOptions.following[1] ||
        acct.followRatio < gblOptions.filterOptions.followRatio[0] ||
        acct.followRatio > gblOptions.filterOptions.followRatio[1] ||
        acct.edge_owner_to_timeline_media.count < gblOptions.filterOptions.posts[0] ||
        acct.edge_owner_to_timeline_media.count > gblOptions.filterOptions.posts[1] ||
        acct.lastPosted < gblOptions.filterOptions[0] ||
        acct.lastPosted > gblOptions.filterOptions[1] ||
        (acct.is_private == true && gblOptions.filterOptions.private == false) ||
        (acct.is_private == false && gblOptions.filterOptions.non_private == false) ||
        (acct.is_verified == true && gblOptions.filterOptions.verified == false) ||
        (acct.is_verified == false && gblOptions.filterOptions.non_verified == false) ||
        (acct.followed_by_viewer == true && gblOptions.filterOptions.followed_by_me == false) ||
        (acct.followed_by_viewer == false && gblOptions.filterOptions.non_followed_by_me == false) ||
        (acct.follows_viewer == true && gblOptions.filterOptions.follows_me == false) ||
        (acct.followed_by_viewer == false && gblOptions.filterOptions.non_follows_me == false)
    ) {
        return false;
    } else {
        return true;
    }

}

async function filterCriteriaMetForUnfollowing(acct) {

    if (gblOptions.unFollowFresh === false || gblOptions.dontUnFollowNonGrowbot === true || gblOptions.unFollowIfOld === true) {
        var acctFromStorage = alreadyAttempted(acct);
        var timeSinceFollowed = today - acctFromStorage.followAttemptDate;

        if (gblOptions.dontUnFollowNonGrowbot == true && acctFromStorage === false) {
            outputMessage(acct.username + ' was followed outside of Growbot, skipping');
            addStamp(acct.id, 'stamp-div-grey', 'non-growbot');
            return false;
        }

        if (acctFromStorage != false && acctFromStorage.followAttemptDate && gblOptions.unFollowFresh == false && timeSinceFollowed < gblOptions.unFollowDelay) {
            outputMessage(acct.username + ' was followed too recently to unfollow ' + millisecondsToHumanReadable(timeSinceFollowed, true));
            addStamp(acct.id, 'stamp-div-grey', 'too recent');
            return false;
        }
    }


    if (!acct.edge_followed_by) acct = await getAdditionalDataForAcct(acct);

    if (acct.assumedDeleted) return false;

    if (gblOptions.dontUnFollowFollowers === true) {
        if (acct.follows_viewer == true) {
            if (gblOptions.unFollowIfOld == true && timeSinceFollowed > gblOptions.unFollowIfOlderThan) {
                outputMessage(acct.username + ' was followed more than ' + millisecondsToHumanReadable(gblOptions.unFollowIfOlderThan, false).days + ' days ago, OK to unfollow')
                return true;
            } else {
                outputMessage(acct.username + ' is one of your followers, skipping');
                addStamp(acct.id, 'stamp-div-grey', 'follows you');
                return false;
            }
        }
    }


    if (gblOptions.dontUnFollowFilters === true) {
        if (acct.edge_followed_by.count < gblOptions.filterOptions.followers[0] ||
            acct.edge_followed_by.count > gblOptions.filterOptions.followers[1] ||
            acct.edge_follow.count < gblOptions.filterOptions.following[0] ||
            acct.edge_follow.count > gblOptions.filterOptions.following[1] ||
            acct.followRatio < gblOptions.filterOptions.followRatio[0] ||
            acct.followRatio > gblOptions.filterOptions.followRatio[1] ||
            acct.edge_owner_to_timeline_media.count < gblOptions.filterOptions.posts[0] ||
            acct.edge_owner_to_timeline_media.count > gblOptions.filterOptions.posts[1] ||
            acct.lastPosted < gblOptions.filterOptions[0] ||
            acct.lastPosted > gblOptions.filterOptions[1] ||
            (acct.is_private == true && gblOptions.filterOptions.private == false) ||
            (acct.is_private == false && gblOptions.filterOptions.non_private == false) ||
            (acct.is_verified == true && gblOptions.filterOptions.verified == false) ||
            (acct.is_verified == false && gblOptions.filterOptions.non_verified == false)
        ) {
            return true;
        } else {
            outputMessage(acct.username + ' skipped (matches your filters)');
            addStamp(acct.id, 'stamp-div-grey', 'matches filters');
            return false;
        }
    }

    return true;

}

function bindNoUiSliders() {

    var sliderElements = ['followersSlider', 'followingSlider', 'followRatioSlider', 'postsSlider', 'lastPostedSlider'];

    for (var i = 0; i < sliderElements.length; i++) {

        var currentSlider = document.getElementById(sliderElements[i]);

        //hacky?
        var fromOptions = gblOptions.filterOptions[sliderElements[i].replace('Slider', '')];

        var dFO = defaultFilterOptions[sliderElements[i].replace('Slider', '')];

        if (sliderElements[i] == 'followRatioSlider') {
            noUiSlider.create(currentSlider, {
                start: fromOptions,
                range: {
                    'min': [dFO[0]],
                    '5%': [0],
                    '10%': [0.25],
                    '15%': [0.5],
                    '20%': [.75],
                    '25%': [1],
                    '30%': [1.25],
                    '35%': [1.5],
                    '40%': [1.75],
                    '45%': [2],
                    '50%': [3],
                    '55%': [4],
                    'max': [dFO[1]]
                },
                //pips: { mode: 'values', values: [-7500, 0, 0.5,.75, 1,1.25,1.5,1.75,2,3,4, 10000], density: 10, stepped: true, format: wNumb({decimals:2}) },
                pips: {
                    mode: 'range',
                    density: 10,
                    stepped: true,
                    format: wNumb({
                        decimals: 2
                    })
                },
                connect: [false, true, false]
            });
        } else if (sliderElements[i] == 'followersSlider') {
            noUiSlider.create(currentSlider, {
                start: fromOptions,
                range: {
                    'min': [dFO[0]],
                    '5%': [10],
                    '20%': [100],
                    '50%': [5000],
                    '70%': [10000],
                    '80%': [100000],
                    '90%': [1000000],
                    'max': [dFO[1]]
                },
                //pips: { mode: 'values', values: [-7500, 0, 0.5,.75, 1,1.25,1.5,1.75,2,3,4, 10000], density: 10, stepped: true, format: wNumb({decimals:2}) },
                pips: {
                    mode: 'range',
                    density: 10,
                    stepped: true
                },
                connect: [false, true, false],
                format: wNumb({
                    decimals: 0
                })
            });

        } else {
            noUiSlider.create(currentSlider, {
                start: fromOptions,
                range: {
                    'min': [dFO[0]],
                    '5%': [10],
                    '20%': [100],
                    'max': [dFO[1]]
                },
                pips: {
                    mode: 'range',
                    density: 5
                },
                connect: [false, true, false],
                format: wNumb({
                    decimals: 0
                })
            });
        }

        currentSlider.noUiSlider.on('set', updateFilterOptions);


        function sp(event) {
            event.stopPropagation();
        }

        function setTooltipInputWidth(input) {
            input.style.width = ((input.value.length + 1) * 6) + 'px';
        }

        function makeTT(i, slider) {
            var tooltip = document.createElement('div'),
                input = document.createElement('input');

            // Add the input to the tooltip
            tooltip.className = 'noUi-tooltip';
            tooltip.appendChild(input);

            // On change, set the slider
            input.addEventListener('change', function() {
                var values = [null, null];
                values[i] = this.value;
                slider.noUiSlider.set(values)
                setTooltipInputWidth(this);
            });

            input.addEventListener('focus', function() {
                $(slider.tooltipInputs[0]).closest('.noUi-origin')[0].style.zIndex = 4;
                $(slider.tooltipInputs[1]).closest('.noUi-origin')[0].style.zIndex = 4;

                $(this).closest('.noUi-origin')[0].style.zIndex = 5;

            })

            // Catch all selections and make sure they don't reach the handle
            input.addEventListener('mousedown', sp);
            input.addEventListener('touchstart', sp);
            input.addEventListener('pointerdown', sp);
            input.addEventListener('MSPointerDown', sp);

            // Find the lower/upper slider handle and insert the tooltip
            slider.querySelector(i ? '.noUi-handle-upper' : '.noUi-handle-lower').appendChild(tooltip);

            return input;
        }

        // An 0/1 indexed array of input elements
        currentSlider.tooltipInputs = [makeTT(0, currentSlider), makeTT(1, currentSlider)];

        // When the slider changes, update the tooltip
        currentSlider.noUiSlider.on('update', function(values, handle) {
            this.target.tooltipInputs[handle].value = values[handle];
            setTooltipInputWidth(this.target.tooltipInputs[handle]);
        });

    }


    function updateFilterOptions() {
        for (var i = 0; i < sliderElements.length; i++) {
            var currentSlider = document.getElementById(sliderElements[i]);
            gblOptions.filterOptions[sliderElements[i].replace('Slider', '')] = currentSlider.noUiSlider.get().map(Number);
        }
        saveOptions();
    }

    function resetFilterSliders() {
        for (var i = 0; i < sliderElements.length; i++) {
            document.getElementById(sliderElements[i]).noUiSlider.reset();
        }
    }


    $('#btnResetFilter').click(resetFilterSliders);

}




function sortQueueSelectionMade() {

    var igBotQueueOrderBy = document.getElementById('igBotQueueOrderBy');
    var selectedSort = igBotQueueOrderBy.options[igBotQueueOrderBy.selectedIndex].value;


    if (selectedSort != 'verifiedAsc' && selectedSort != 'verifiedDesc' && isAdditionalDataFullyLoaded(acctsQueue) === false) {
        if (window.confirm("Additional data must be loaded in order to sort.  Load additional data now?")) {
            populateAllQueueUsersInfo(acctsQueue);
        }
        return false;
    }

    switch (selectedSort) {

        case 'followersAsc':
            acctsQueue = sortQueue(acctsQueue, 'edge_followed_by.count', true);
            break;
        case 'followersDesc':
            acctsQueue = sortQueue(acctsQueue, 'edge_followed_by.count', false);
            break;
        case 'followingAsc':
            acctsQueue = sortQueue(acctsQueue, 'edge_follow.count', true);
            break;
        case 'followingDesc':
            acctsQueue = sortQueue(acctsQueue, 'edge_follow.count', false);
            break;
        case 'postsAsc':
            acctsQueue = sortQueue(acctsQueue, 'edge_owner_to_timeline_media.count', true);
            break;
        case 'postsDesc':
            acctsQueue = sortQueue(acctsQueue, 'edge_owner_to_timeline_media.count', false);
            break;
        case 'privateAsc':
            acctsQueue = sortQueue(acctsQueue, 'is_private', true);
            break;
        case 'privateDesc':
            acctsQueue = sortQueue(acctsQueue, 'is_private', false);
            break;
        case 'verifiedAsc':
            acctsQueue = sortQueue(acctsQueue, 'is_verified', true);
            break;
        case 'verifiedDesc':
            acctsQueue = sortQueue(acctsQueue, 'is_verified', false);
            break;
        case 'lastPostAsc':
            acctsQueue = sortQueue(acctsQueue, 'lastPostDate', true);
            break;
        case 'lastPostDesc':
            acctsQueue = sortQueue(acctsQueue, 'lastPostDate', false);
            break;
        case 'followRatioAsc':
            acctsQueue = sortQueue(acctsQueue, 'followRatio', true);
            break;
        case 'followRatioDesc':
            acctsQueue = sortQueue(acctsQueue, 'followRatio', false);
            break;
        default:
            return false;
            break;
    }

    arrayOfUsersToDiv(acctsQueue, true);
    handleCheckBoxes(acctsQueue);
    handleImagePreload();
}

function setCurrentPageUsername() {
    if (getCurrentPageUsername() != '') {
        $('#btnGetAllUsersFollowers').text('Load ' + getCurrentPageUsername() + ' Followers');
        $('#igBotInjectedContainer #btnGetAllUsersFollowers').off('click.ajaxGetAllUsersFollowers').on('click.ajaxGetAllUsersFollowers', ajaxGetAllUsersFollowers);
        $('#btnGetAllUsersFollowing').text('Load ' + getCurrentPageUsername() + ' Following');
        $('#igBotInjectedContainer #btnGetAllUsersFollowing').off('click.ajaxLoadFollowing').on('click.ajaxLoadFollowing', ajaxLoadFollowing);

        $('#btnGetCommenters').text('Load ' + getCurrentPageUsername() + ' Commenters');
        $('#btnGetCommenters').on('click.getCommenters', ajaxLoadAllUsersCommenters);

        $('#btnGetLikers').text('Load ' + getCurrentPageUsername() + ' Likers');
        $('#btnGetLikers').on('click.getLikers', ajaxLoadAllUsersLikers);

    } else {
        $('#igBotInjectedContainer #btnGetAllUsersFollowers,#igBotInjectedContainer #btnGetAllUsersFollowing').click(function() {
            outputMessage('Error: must be on an instagram user page (or try reloading).');
        });
    }
}

function checkUsernameFreshness() {
    if ($('h1._rf3jb.notranslate').text() != getCurrentPageUsername()) {
        ajaxGetCurrentPageUserInfo();
        return false;
    }
    return true;
}

function getCurrentPageUsername() {
    if (currentProfilePage != false && currentProfilePage) {
        return currentProfilePage.username;
    } else {
        ajaxGetCurrentPageUserInfo();
        return '';
    }
}

function getQueryParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function ajaxGetCurrentPageUserInfo() {
    var username = $('h1._rf3jb.notranslate').text();
    if (username == '') username = window.location.pathname.split('/')[1];
    if (username == 'explore' || username == 'stories' || username === 'accounts') username = '';

    if (username == 'p') username = getQueryParameterByName('taken-by') || getUsernameFromPostHtml();

    if ((currentProfilePage == false && username != '') || (username != '' && currentProfilePage.username != username)) {
        $.ajax('https://www.instagram.com/' + username + '/').done(function(data) {
            currentProfilePage = extractJSONfromUserPageHTML(data);
            setCurrentPageUsername();
        });
    }
}

function getUsernameFromPostHtml() {
    return document.getElementsByClassName('FPmhX')[0].textContent;
}

function extractJSONfromUserPageHTML(data) {
    var scriptSection = data.substring(data.indexOf('<script type="text/javascript">window._sharedData = ') + 52, data.indexOf(';</script>', data.indexOf('<script type="text/javascript">window._sharedData = ')));
    if (data.indexOf('<script type="text/javascript">window._sharedData = ') < 0) {
        return false;
    }

    var jsondata = JSON.parse(scriptSection);
    var user = jsondata.entry_data.ProfilePage[0].graphql.user;
    return user;
}

function setCurrentPageHashtag() {
    var hashtagFromUrl = getHashtagFromUrl();

    if (hashtagFromUrl != '') {
        $('#btnLikeHashtag').html($('#btnLikeHashtag').html().replace("Current Page Hashtag", '#' + hashtagFromUrl));
        $('#igBotInjectedContainer #btnLikeHashtag').off('click.ajaxLikeAllPostsFromHashtag').on('click.ajaxLikeAllPostsFromHashtag', ajaxLikeAllPostsFromHashtag);
        $('#igBotInjectedContainer #btnLikeHashtag').children().click(function(e) {
            return false;
        });

    } else {
        outputMessage('Error: must be on an instagram hashtag page');
    }
}


function getHashtagFromUrl() {

    if (window.location.href.indexOf('/explore/tags/') == -1) {
        return '';
    }

    var tagFromUrl = window.location.href;
    tagFromUrl = tagFromUrl.replace('https://www.instagram.com/explore/tags/', '');
    tagFromUrl = tagFromUrl.slice(0, tagFromUrl.indexOf('/'));

    tagFromUrl = decodeURIComponent(tagFromUrl);

    return tagFromUrl;
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function saveHiddenStatus(hiddenStatus) {
    chrome.storage.sync.set({
        'igBotHidden': hiddenStatus
    });
}

function getHiddenStatus(callback) {

    chrome.storage.sync.get('igBotHidden', function(object) {

        var hiddenStatus = false;

        if (typeof object['igBotHidden'] != 'undefined') {
            hiddenStatus = object['igBotHidden'];
        } else {
            hiddenStatus = false;
        }

        callback(hiddenStatus);

    });

}

function hiddenStatusCallback(hiddenStatus) {
    if (hiddenStatus == true) {
        hideControlsDiv();
    }
}


$.fn.shake = function shake(interval, distance, times) {
    interval = interval || 100;
    distance = distance || 10;
    times = times || 4;

    for (var iter = 0; iter < (times + 1); iter++) {
        //this.animate({ left: ((iter%2==0 ? distance : distance*-1))}, interval);
        this.animate({
            top: ((iter % 2 == 0 ? distance : distance * -1))
        }, interval);
        this.animate({
            top: ''
        }, interval);
    }
}

function userUpdateListener() {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.instabot_has_license) {
                instabot_has_license = request.instabot_has_license;
            }

            if (request.instabot_install_date) {
                instabot_install_date = request.instabot_install_date;
                instabot_free_trial_time = request.instabot_free_trial_time;
                clearInterval(freeTrialInterval);
                freeTrialInterval = setInterval(displayFreeTrialTimeLeft, 500);
            }

            if (request.openBuyScreen == true) {
                $('#iframePurchase').remove();
                $('#igBotMediaQueueContainer').hide();
                $('#igBotQueueContainer').hide().before('<iframe id="iframePurchase" src="' + chrome.extension.getURL('products.html') + '"></iframe>');


                if (request.igBotUser) {
                    var guid = request.igBotUser.user_guid;
                    document.getElementById('websiteSubscribeLink').setAttribute('href', 'https://www.growbotforinstagram.com/?guid=' + guid);
                    document.getElementById('divSubscriptionLink').style.display = 'block';
                }

                $('.igBotInjectedButton').not(document.getElementById('btnHide')).off('click').addClass('disabled');
            }

            if (request.toggleGrowbot == true) {
                toggleControlsDiv();
            }

            if (request.openGrowbot == true) {
                openControlsDiv();
            }
        }
    );
}

function getBackgroundInfo() {
    $.ajax({
            url: 'https://www.instagram.com/' + user.viewer.username + '/',
            method: 'GET',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('x-csrftoken', user.csrf_token);
                xhr.setRequestHeader('x-instagram-ajax', '1');
            }
        })
        .done(function(r) {
            var u = extractJSONfromUserPageHTML(r);
            chrome.extension.sendMessage({
                "updatewanted": true,
                "ig_user": user.viewer,
                "ig_user_account_stats": {
                    "date": new Date().toUTCString(),
                    "followers": u.edge_followed_by.count,
                    "following": u.edge_follow.count,
                    "posts": u.edge_owner_to_timeline_media.count
                }
            });
        })
        .fail(function(data) {
            chrome.extension.sendMessage({
                "updatewanted": true,
                "ig_user": user.viewer,
                "ig_user_account_stats": {}
            });
        });


}

function dialog(messages, yesCallback, noCallback) {

    $('#igBotDialogQuestion').html(messages.question);

    $('#btnDialogOK').text(messages.yes).off('click.dialogyes').on('click.dialogyes', function() {
        yesCallback();
        document.getElementById('igBotDialog').style.display = 'none'
    });
    $('#btnDialogCancel').text(messages.no).off('click.dialogcancel').on('click.dialogcancel', function() {
        noCallback();
        document.getElementById('igBotDialog').style.display = 'none'
    });

    document.getElementById('igBotDialog').style.display = 'block'
}

(function(global, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof exports !== "undefined") {
        factory();
    } else {
        var mod = {
            exports: {}
        };
        factory();
        global.FileSaver = mod.exports;
    }
})(this, function() {
    "use strict";

    /*
     * FileSaver.js
     * A saveAs() FileSaver implementation.
     *
     * By Eli Grey, http://eligrey.com
     *
     * License : https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md (MIT)
     * source  : http://purl.eligrey.com/github/FileSaver.js
     */
    // The one and only way of getting global scope in all environments
    // https://stackoverflow.com/q/3277182/1008999
    var _global = typeof window === 'object' && window.window === window ? window : typeof self === 'object' && self.self === self ? self : typeof global === 'object' && global.global === global ? global : void 0;

    function bom(blob, opts) {
        if (typeof opts === 'undefined') opts = {
            autoBom: false
        };
        else if (typeof opts !== 'object') {
            console.warn('Depricated: Expected third argument to be a object');
            opts = {
                autoBom: !opts
            };
        } // prepend BOM for UTF-8 XML and text/* types (including HTML)
        // note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF

        if (opts.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
            return new Blob([String.fromCharCode(0xFEFF), blob], {
                type: blob.type
            });
        }

        return blob;
    }

    function download(url, name, opts) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'blob';

        xhr.onload = function() {
            saveAs(xhr.response, name, opts);
        };

        xhr.onerror = function() {
            console.error('could not download file');
        };

        xhr.send();
    }

    function corsEnabled(url) {
        var xhr = new XMLHttpRequest(); // use sync to avoid popup blocker

        xhr.open('HEAD', url, false);
        xhr.send();
        return xhr.status >= 200 && xhr.status <= 299;
    } // `a.click()` doesn't work for all browsers (#465)


    function click(node) {
        try {
            node.dispatchEvent(new MouseEvent('click'));
        } catch (e) {
            var evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
            node.dispatchEvent(evt);
        }
    }

    var saveAs = _global.saveAs || ( // probably in some web worker
        typeof window !== 'object' || window !== _global ? function saveAs() {}
        /* noop */
        // Use download attribute first if possible (#193 Lumia mobile)
        :
        'download' in HTMLAnchorElement.prototype ? function saveAs(blob, name, opts) {
            var URL = _global.URL || _global.webkitURL;
            var a = document.createElement('a');
            name = name || blob.name || 'download';
            a.download = name;
            a.rel = 'noopener'; // tabnabbing
            // TODO: detect chrome extensions & packaged apps
            // a.target = '_blank'

            if (typeof blob === 'string') {
                // Support regular links
                a.href = blob;

                if (a.origin !== location.origin) {
                    corsEnabled(a.href) ? download(blob, name, opts) : click(a, a.target = '_blank');
                } else {
                    click(a);
                }
            } else {
                // Support blobs
                a.href = URL.createObjectURL(blob);
                setTimeout(function() {
                    URL.revokeObjectURL(a.href);
                }, 4E4); // 40s

                setTimeout(function() {
                    click(a);
                }, 0);
            }
        } // Use msSaveOrOpenBlob as a second approach
        :
        'msSaveOrOpenBlob' in navigator ? function saveAs(blob, name, opts) {
            name = name || blob.name || 'download';

            if (typeof blob === 'string') {
                if (corsEnabled(blob)) {
                    download(blob, name, opts);
                } else {
                    var a = document.createElement('a');
                    a.href = blob;
                    a.target = '_blank';
                    setTimeout(function() {
                        click(a);
                    });
                }
            } else {
                navigator.msSaveOrOpenBlob(bom(blob, opts), name);
            }
        } // Fallback to using FileReader and a popup
        :
        function saveAs(blob, name, opts, popup) {
            // Open a popup immediately do go around popup blocker
            // Mostly only avalible on user interaction and the fileReader is async so...
            popup = popup || open('', '_blank');

            if (popup) {
                popup.document.title = popup.document.body.innerText = 'downloading...';
            }

            if (typeof blob === 'string') return download(blob, name, opts);
            var force = blob.type === 'application/octet-stream';

            var isSafari = /constructor/i.test(_global.HTMLElement) || _global.safari;

            var isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent);

            if ((isChromeIOS || force && isSafari) && typeof FileReader === 'object') {
                // Safari doesn't allow downloading of blob urls
                var reader = new FileReader();

                reader.onloadend = function() {
                    var url = reader.result;
                    url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, 'data:attachment/file;');
                    if (popup) popup.location.href = url;
                    else location = url;
                    popup = null; // reverse-tabnabbing #460
                };

                reader.readAsDataURL(blob);
            } else {
                var URL = _global.URL || _global.webkitURL;
                var url = URL.createObjectURL(blob);
                if (popup) popup.location = url;
                else location.href = url;
                popup = null; // reverse-tabnabbing #460

                setTimeout(function() {
                    URL.revokeObjectURL(url);
                }, 4E4); // 40s
            }
        });
    _global.saveAs = saveAs.saveAs = saveAs;

    if (typeof module !== 'undefined') {
        module.exports = saveAs;
    }
});



(function(exports) {

    var Contra = exports.Contra = {};

    var a = 65,
        b = 66;
    var left = 37,
        up = 38,
        right = 39,
        down = 40;
    var enter = 13;

    var handlers = [];
    var pattern = [up, up, down, down, left, right, left, right, b, a, b, a, enter];
    var position = 0;

    var check = function check(evt) {
        if (pattern[position] === evt.keyCode) {
            position++;
        } else {
            position = 0;
        }

        if (position === pattern.length) {
            win();
            position = 0;
        }
    };

    var win = function win() {
        for (var i = 0, l = handlers.length; i < l; i++) {
            handlers[i].call();
        }
    };

    var initialize = function initialize() {
        if (document.addEventListener) {
            document.addEventListener("keyup", check);
        } else if (document.attachEvent) {
            document.attachEvent("onkeypress", check);
        }
    };

    Contra.addHandler = function(handler) {
        if (handlers.length === 0) handlers.push(handler);
    };

    initialize();
})(window);


function domReady() {
    if (window.location.href.indexOf('.instagram.com') === -1) return false;
    if (window.location.href.indexOf('/developer/') > -1) return false;

    injectControlsDiv();
    injectIcon();
    shakeInstabotIcon();

    setInterval(function() {

        if ($('#instabotIcon').length == 0) {
            injectIcon();
            shakeInstabotIcon();
        }

        if ($('#igBotInjectedContainer .pulsing').length > 0) {
            $('#instabotIcon').addClass('pulsing');
        } else {
            $('#instabotIcon').removeClass('pulsing');
        }

        checkUsernameFreshness();
    }, 2000);

    getHiddenStatus(hiddenStatusCallback);

    userUpdateListener();

    getBackgroundInfo();

}


// Check if the DOMContentLoaded has already been completed
if (document.readyState === 'complete' || document.readyState !== 'loading') {
    domReady();
} else {
    document.addEventListener('DOMContentLoaded', domReady);
}
