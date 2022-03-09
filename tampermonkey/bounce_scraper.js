// ==UserScript==
// @name         Gmail Bounce Scraper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Extracts bounced emails from the current page of emails and prints them to the console.
// @author       @serious_bret
// @match        https://mail.google.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        none
// ==/UserScript==

/*
This script is for Gmail.

The following script will attempt to grab all of the bounced email addresses on the current page of emails.
You need to start the script in the email summary list (not inside an email detail screen.)

The script will mark successfully scraped emails with green and check the checkbox.

It will only do one page at a time and print all of the emails it found to the console.

Run the script from the console:

> bouncer.scrape();

It takes a while to complete. And will extract the bounced email address from most bounce email formats but not all.

*/

(function() {
    'use strict';

    console.log('bouncer!');

    window.bouncer = (subjectTableId) => {

        if(!subjectTableId) {
            let tables = document.querySelectorAll('table');
            subjectTableId = tables[tables.length-1].id;
        }

        let subjectCntr = document.getElementById(subjectTableId);
        if(!subjectCntr) {
            console.log("couldn't find subject container with id, "+subjectTableId);
            return;
        }
        return {
            scrape : function() {
                let emails = [];
                let subjects = this.subjects();
                let currentSubject = 0;
                console.log('found '+subjects.length+' subjects');
                if(subjects.length <= 0) {
                    return;
                }
                extract(0);
                function extract(attempt) {
                    for(let i=currentSubject; i < subjects.length; i++) {
                        if(isBounce(subjects[i])) {
                            subjects[i].click();
                            window.setTimeout(()=>{
                                let emailText = window.bouncer.messageContainer();
                                if(!emailText) {
                                    if(attempt < 3) {
                                        extract(attempt+1);
                                    }
                                    return;
                                }
                                emailText = emailText.innerText;
                                let email = extractToEmail(emailText);
                                if(!email) {
                                    console.log("couldn't find email ("+i+")");
                                    next(false);
                                } else {
                                    //console.log('adding '+email);
                                    emails.push(email);
                                    next(true);
                                }
                                function next(mark) {
                                    currentSubject = i+1;
                                    window.history.go(-1);
                                    window.setTimeout(()=> {
                                        if(mark) {
                                            markComplete(subjects[i]);
                                        }
                                        extract(0);
                                    },1);
                                }
                            },250);
                            return;
                        }
                        console.log("not a bounce ("+i+")");
                    }
                    let lineDelimited = '';
                    for(let i=0; i < emails.length; i++) {
                        lineDelimited += emails[i]+"\n";
                    }
                    console.log(lineDelimited);
                }
            },
            subjects : function() {
                let rows = subjectCntr.querySelectorAll('tbody tr');
                for(let i=0; i < rows.length; i++) {
                    let cells = rows[i].querySelectorAll('td');
                    rows[i].fromCell = cells[4];
                    rows[i].checkCell = cells[1];
                    rows[i].fromText = cells[4].innerText;
                    rows[i].subjectText = cells[5].innerText;
                }
                return rows;
            }
        }
    };
    window.bouncer.messageContainer = function() {
        return document.querySelectorAll('div[role=main] table[role=presentation] div[data-message-id] div.a3s.aiL')[0];
    };

    function markComplete(subject) {
        subject.style.backgroundColor = 'green';
        subject.__complete = true;
        subject.querySelectorAll('td')[1].click();
    }

    function extractToEmail(emailText) {
        let mtch = emailText.match(/- Forwarded message [-]+\nFrom:[^\n]+\nTo:[^<]*<([^>]+)/);
        if(!matches()) {
            mtch = emailText.match(/- Forwarded message [-]+\nFrom:[^\n]+\nTo:([^\n]+)/);
            if(!matches()) {
                mtch = emailText.match(/The following message to <([^>]+)> was undeliverable/);
                if(!matches()) { return; }
            }
        }
        return mtch[1].trim();

        function matches() {
            return mtch && mtch.length > 1 && mtch[1].trim();
        }
    }

    function isBounce(subjectRow) {
        let fromText = subjectRow.fromText;
        if(fromText == "Mail Delivery System" || fromText == "Mail Delivery Subsy.") {
            return true;
        }
        if(subjectRow.subjectText.substring(0,"Undeliverable: ".length) == "Undeliverable: ") {
            return true;
        }
        return false;
    }

})();










