//forever start systemchecksms.js &
const JSE = {};
global.JSE = JSE;

JSE.jseTestNet = false; //'remote';

const fs = require('fs');
const request = require('request');

JSE.logDirectory = './../logs/';

JSE.dbServer = 'http://10.128.0.12:80';
JSE.credentials = require('./../credentials.json');

JSE.authenticatedNode = true;

JSE.jseFunctions = require('./../modules/functions.js');

JSE.jseDataIO = require('./../modules/dataio.js');

JSE.blockID = 0;
JSE.marketCap = 0;
JSE.users = 0;
let errorMsg = null;
function runChecks() {
	errorMsg = null;
	// Check blocks are changing over and database is OK
	JSE.jseDataIO.getVariable('blockID',function(newBlockID) {
		if (newBlockID === null) {
			errorMsg = 'Getting null blockID';
			sendOnceSMS('+447833239300',errorMsg);
		}
		if (JSE.blockID === newBlockID) {
			errorMsg = 'Blocks not changing over';
			sendOnceSMS('+447833239300',errorMsg);
		}
		if (!newBlockID > JSE.blockID) {
			errorMsg = 'newBlockID not greater than blockID';
			sendOnceSMS('+447833239300',errorMsg);
		}
		JSE.blockID = newBlockID;
	});
	JSE.jseDataIO.getVariable('publicStats',function(newPublicStats) {
		if (newPublicStats === null || typeof newPublicStats === 'undefined') {
			errorMsg = 'Public Stats Data Missing';
			sendOnceSMS('+447833239300',errorMsg);
		}
		if (newPublicStats.selfMiners < 500) {
			errorMsg = 'Less than 500 self miners online';
			sendOnceSMS('+447833239300',errorMsg);
		}
		if (JSE.publicStats && JSE.publicStats.users && JSE.publicStats.coins) {
			if (newPublicStats.users < JSE.publicStats.users) {
				errorMsg = 'Registered user accounts has reduced';
				sendOnceSMS('+447833239300',errorMsg);
			}
			if (newPublicStats.users > (JSE.publicStats.users + 100)) {
				errorMsg = 'More than 100 user accounts created';
				sendOnceSMS('+447833239300',errorMsg);
			}
			if (newPublicStats.coins > (JSE.publicStats.coins + 100000)) {
				errorMsg = 'More than 100k coins created';
				sendOnceSMS('+447833239300',errorMsg);
			}
		}
		JSE.publicStats = newPublicStats;
	});
	// Check servers
	const servers = ['https://server.jsecoin.com','https://load.jsecoin.com','https://platform.jsecoin.com','https://jsecoin.com','https://jsecoin.com/blog','https://blockchain.jsecoin.com'];
	for (let i = 0; i < servers.length; i+=1) {
		const server = servers[i];
		request(server, function (error, response, body) { // eslint-disable-line
			if (error) {
				errorMsg = 'Server down: '+server;
				sendOnceSMS('+447833239300',errorMsg);
			}
		});
	}
}

let okToSend = false;
setTimeout(function() { okToSend = true; }, 6 * 60 * 1000); // give it 6 mins to set the vars on the first run

function sendOnceSMS(phoneNo,txtMsg) {
	const date = new Date();
	date.utc = date.toUTCString();
	if (okToSend === true) {
		JSE.jseFunctions.sendSMS(phoneNo,txtMsg);
		okToSend = false;
		setTimeout(function() { okToSend = true; }, 60 * 60 * 1000); // one sms per hour
		console.log(date.utc+' - SMS Sent! - '+errorMsg);
	} else {
		console.log(date.utc+' - '+errorMsg);
	}
}

setInterval(function() {
	runChecks();
}, 5 * 60 * 1000); // test every 5 minutes