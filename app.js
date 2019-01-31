var tmi = require('tmi.js');
var fs = require('fs');
var jsonfile = require('jsonfile');
//var adventure = require('./games/adventure.js');
var SpicyTacos = require('./spicy-tacos.js');

var Twitter = require('twitter');

var twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

var adventureActive = false;

var options = {
    options: {
	    debug: true
    },
    connections: {
        cluster: "aws",
        reconnect: true
    },
    identity: {
        username: "phirebot",
        password: "oauth:11envavqxjuyzhrq5pm213qet1nlbb"
    },
    channels: ["phirehero"]
};

//Load up Spicy Taco Data
const SpicyTacoFile = './data/spicytacos.json';
const twitterLookup = './data/twitter-twitch.json';

var SpicyTacoData = jsonfile.readFileSync(SpicyTacoFile);
var blacklist = jsonfile.readFileSync('./data/blacklist.json');

let subs = {};

console.log(SpicyTacoData);

let babies = 0;
let spicyTacosEnabled = true;

var t2notify = {};

var client = new tmi.client(options);
client.connect();

//Execute early message after 10 minutes
var earlyMsg = setTimeout(function() {
	//client.action('phirehero', 'is handing out your daily Spicy Taco coin! You will be able to use these for the monthly giveaway! Keep it safe!');
    distributeSpicyTacos();
    saveTokensToFile();
	spicyTacosEnabled = false;
}, 900000);

var earlyMsg = setTimeout(function() {
	client.action('phirehero', 'is handing out a second serving of tacos to all you early arrivals! Enjoy! phirehHype phirehHype phirehHype');
	spicyTacosEnabled = false;
}, 600000);

// var charity = setTimeout(function() {
// 	client.say('phirehero', 'Merry Christmas and Happy Holidays! We are celebrating the last day of our "12 Days of Christmas" charity event by reading "A Christmas Carol" by Charles Dickens! Feel free to pull up a chair and enjoy the story! Thank you so much for stopping by! phirehHype')
// }, 600000);

var phirestarters = [];
var bounty;
var bountyFound = false;
var bounties = [];
var guessed = [];

/*var bountyTimer = setTimeout(function() {
	if(bounty) {
		
		bounties.push(bounty);
	    
	    if(!bountyFound) {
			client.action('phirehero', 'The previous bounty @' + bounty + ' got away with all the tacos!');
			client.say('phirehero', '!Tacos Add ' + viewer + ' 100');
		}
	}

	var bountyChosen = false;

	while (!bountyChosen) {
		bounty = phirestarters[Math.floor(Math.random() * Math.floor(phirestarters.length))];
		
		if(!bounties.includes(bounty)) {
			bountyChosen = true;
		}
	}

	guessed = [];

	client.action('phirehero', 'A new bounty has been issued! Use "!bounty [user]" to find the culprit, and collect your tacos!');
	
}, 900000);*/

var earlyBirds = [];

client.on("join", function (channel, username, self) {
	if(spicyTacosEnabled) {
    	if(!earlyBirds[username] && !blacklist[username]) {
    		earlyBirds[username] = true;
    		console.log(username + " is getting a coin when the time comes!");
    	}
    }
});

client.on("part", function (channel, username, self) {
	if(spicyTacosEnabled) {
		if(earlyBirds[username] && !blacklist[username]) {
			earlyBirds[username] = false;
			console.log(username + " is NOT getting a coin when the time comes!");
		}
	}
});

client.on('whisper', function (from, userstate, message, self) {
	if(self) return;

	if(from === "#phirehero" && message === "!savetokens") {
		saveTokensToFile();
	}

});

var saveTokensToFile = function() {
	console.log(SpicyTacoData);
		
	jsonfile.writeFile(SpicyTacoFile, SpicyTacoData, { spaces: 2 }, function (err) {
		if (err) {
			console.error(err);
		} else {
			console.log("Data saved successfully!");
		}
	});
}

client.on("subscription", function (channel, username, method, message, userstate) {
	console.log(username + " just subscribed to the channel! Thier method was: " + method);
	subs[username] = {
		method: method,
		message: message,
		userstate: userstate
	};
    if(!SpicyTacoData[username]) {
		SpicyTacoData[username] = 1
	} else {
		SpicyTacoData[username]++;
	}
});

client.on("resub", function(channel, username, months, message, userstate, method) {
	console.log(username + " just resubbed to the channel! Thier method was: " + method);
	
	subs[username] = {
		method: method,
		months: months,
		message: message,
		userstate: userstate
	};

	if(!SpicyTacoData[username]) {
		SpicyTacoData[username] = 1
	} else {
		SpicyTacoData[username]++;
	}
});

client.on('chat', function(channel, user, message, self) {
	
	var username = user.username;

	if(spicyTacosEnabled) {
		if(!earlyBirds[username] && !blacklist[username]) {
			earlyBirds[username] = true;
			console.log(username + " is getting a coin when the time comes!");
		}
	}	

	if(!phirestarters.includes(username)) {
		phirestarters.push(username);
	}

	if(message.indexOf('!bounty') >=0) {
		if(guessed.includes(username)) {
			client.action('phirehero', '@' + username + ', you have already guessed for this bounty!');
		} else {
			guessed.push(username);	
		}
		
	}

	if(username === 'phirebot') {
	   //Bot Specific messages
	}

	let allow = user.username === 'phirehero' || user.mod;

	if(message.indexOf('!addbaby') >= 0 && allow) {
		//TODO: default add 1
		let number = 1;

		if(message.length >= 9) {
			number = Number.parseInt(message.substr(9));
		}

		babies = babies + number;

		fs.writeFileSync('/Users/crohd/Desktop/streaming/babies.txt', '' + babies + ' / 100');
	}

	if(message.indexOf('!testtacos') >= 0) {
		client.say('phirehero', '!Tacos Add phirehero 100');
	}

	if(message.indexOf('!removebaby') >= 0 && allow) {
		let number = 1;

		if(message.length >= 12) {
			number = Number.parseInt(message.substr(12));
		}

		babies = babies - number;

		fs.writeFileSync('/Users/crohd/Desktop/streaming/babies.txt', '' + babies + ' / 100');
	}

	if(message.indexOf('!happy') >= 0 || message.indexOf('!normal') >= 0) {
		fs.copyFileSync('../plumbobs/happy_plumbob.gif', '../plumbobs/plumbob.gif');
	}

	if(message.indexOf('!inspired') >= 0) {
		fs.copyFileSync('../plumbobs/inspired_plumbob.gif', '../plumbobs/plumbob.gif');
	}

	if(message.indexOf('!rage') >= 0 || message.indexOf('!angry') >= 0 || message.indexOf('!frustrated') >= 0) {
		fs.copyFileSync('../plumbobs/rage_plumbob.gif', '../plumbobs/plumbob.gif');
	}

	if(message.indexOf('!embarrassed') >= 0 || message.indexOf('!uncomfortable') >= 0 || message.indexOf('!derp') >= 0) {
		fs.copyFileSync('../plumbobs/embarrased_plumbob.gif', '../plumbobs/plumbob.gif');
	}

	if(message.indexOf('!focused') >= 0) {
		fs.copyFileSync('../plumbobs/focused_plumbob.gif', '../plumbobs/plumbob.gif');	
	}

	if(message.indexOf('!stressed') >= 0 || message.indexOf('!tense') >= 0) {
		fs.copyFileSync('../plumbobs/tense_plumbob.gif', '../plumbobs/plumbob.gif');	
	}	

});

let stream = twitterClient.stream('statuses/filter', { track: '#phirestarters, #phiretacos'});

var tweetsToProcess = [];

stream.on('data', function (tweet) {
	//Look up person in mapping file
	//If exist, give tacos
	//If not, do nothing
	let user = (tweet.user & tweet.user.screen_name) ? tweet.user.screen_name : "";

	
	if(twitterLookup[user]) {
		client.say('phirehero', '@' + twitterLookup[user] + ', thanks for the retweet!');
		client.say('phirehero', '!Tacos Add ' + twitterLookup[user] + ' 100');
	} else {
		client.action('phirehero', 'Make sure to link your twitter & twitch to receive tacos for those retweets! !link');
	}
	console.log(tweet.user.screen_name + " just tweeted the stream!");
});

var distributeSpicyTacos = function() {
	Object.keys(earlyBirds).map(function(member, index) {
		if(SpicyTacoData[member]) {
			SpicyTacoData[member]++
		} else {
			SpicyTacoData[member] = 1;
		}
	});
};



// var originalTweet = '1085995122674692096';

// var query = {
// 	q: '#phirestarters, #phiretacos',
// 	result_type: 'recent',
// 	since_id: originalTweet
// };

// let retweetChecker = function() {
// 	twitterClient.get('search/tweets', query, function(err, data) {
// 		console.log(data);
// 		if (!err) {

// 			console.log(data.statuses.length);

// 			if(data.statuses.length > 0) {
// 				//We have tweets!
// 				console.log("We have tweets!\n\n")
// 				let first = true;
// 				data.statuses.forEach(function(tweet) {
// 					if(first) {
// 						console.log("Getting a new tweet id set")
// 						//Set the latest tweet we had gotten, to search for newer on the next round
// 						query.since_id = tweet.id_str;
// 						first = false;
// 					}

// 					console.log(tweet.user.screen_name + " just tweeted the stream!");
// 				});
// 			}
			
// 			console.log("latest tweet id: " + query.since_id);

// 		} else {
// 			console.log('Something went wrong while searching...');
// 			console.log(err);
// 		}
// 	});
// }

// retweetChecker();

// setTimeout(retweetChecker, /*300000*/60000);


