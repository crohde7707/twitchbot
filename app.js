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

const SpicyTacoFile = './data/spicytacos2.json';
const TwitterLookupFile = './data/twitter-twitch.json';
const resub = ['Thank you for gifting a taco to ', 'You are too kind!'];

var SpicyTacoData = jsonfile.readFileSync(SpicyTacoFile);
var blacklist = jsonfile.readFileSync('./data/blacklist.json');
var twitterLookup = jsonfile.readFileSync(TwitterLookupFile);

console.log(SpicyTacoData);

let babies = 0;
let spicyTacosEnabled = true;

var t2notify = {};

var client = new tmi.client(options);
client.connect();

//Execute early message after 10 minutes
var earlyMsg = setTimeout(function() {
	client.action('phirehero', 'is handing out your daily Spicy Taco coin! You will be able to use these for the monthly giveaway! Keep it safe!');
    distributeSpicyTacos();
    saveTokensToFile();
	spicyTacosEnabled = false;
}, 900000);

// var charity = setTimeout(function() {
// 	client.say('phirehero', 'Merry Christmas and Happy Holidays! We are celebrating the last day of our "12 Days of Christmas" charity event by reading "A Christmas Carol" by Charles Dickens! Feel free to pull up a chair and enjoy the story! Thank you so much for stopping by! phirehHype')
// }, 600000);

var phirestarters = [];

var bounty;
var bountyFound = false;

var giveawayActive = false;
var giveawayEntries = [];

var bounties = [];
var guessed = [];

var bountyTimer = setInterval(function() {
	if(bounty) {
		
		bounties.push(bounty);
	    
	    if(!bountyFound) {
	    	console.log(">>>>> " + 'The previous bounty @' + bounty + ' got away with all the tacos!')
			// client.action('phirehero', 'The previous bounty @' + bounty + ' got away with all the tacos!');
			// client.say('phirehero', '!Tacos Add ' + bounty + ' 100');
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

	console.log(">>>>> New Bounty: " + bounty );
	console.log(">>>>> " + 'A new bounty has been issued! Use "!bounty [user]" to find the culprit, and collect your tacos!');
	//client.action('phirehero', 'A new bounty has been issued! Use "!bounty [user]" to find the culprit, and collect your tacos!');
	
}, 900000);

var earlyBirds = [];

client.on("join", function (channel, username, self) {
	if(spicyTacosEnabled) {
    	if(!earlyBirds[username] && !blacklist[username]) {
    		earlyBirds[username] = true;
    		console.log(username + " is getting a coin when the time comes!");
    	}
    }
});

// client.on("part", function (channel, username, self) {
// 	if(spicyTacosEnabled) {
// 		if(earlyBirds[username] && !blacklist[username]) {
// 			earlyBirds[username] = false;
// 			console.log(username + " is NOT getting a coin when the time comes!");
// 		}
// 	}
// });

client.on('whisper', function (from, userstate, message, self) {
	if(self) return;

	if(from === "#phirehero" && message === "!saveData") {
		saveTokensToFile();
		saveHandles();
	}

});

var saveTokensToFile = function() {
	console.log(SpicyTacoData);
		
	jsonfile.writeFile(SpicyTacoFile, SpicyTacoData, { spaces: 2 }, function (err) {
		if (err) {
			console.error(err);
		} else {
			console.log("Tokens saved successfully!");
		}
	});
}

var saveHandles = function() {
	console.log(twitterLookup);
		
	jsonfile.writeFile(TwitterLookupFile, twitterLookup, { spaces: 2 }, function (err) {
		if (err) {
			console.error(err);
		} else {
			console.log("Handles saved successfully!");
		}
	});
}

client.on("subscription", function (channel, username, method, message, userstate) {
	console.log("****************");
	console.log("      sub       ");
	console.log("****************");
	client.action('phirehero', '@' + username + ", enjoy 1 complementary Spicy Taco coin, in thanks for the sub!");
	
	var user = username.toLowerCase();

    if(!SpicyTacoData[user]) {
		SpicyTacoData[user] = {
			daily: 1,
			gifted: 0,
			streak: 0
		};
	} else {
		SpicyTacoData[user].daily++;
	}
});

client.on("resub", function(channel, username, months, message, userstate, method) {
	console.log("****************");
	console.log("     resub      ");
	console.log("****************");
	
	var user = username.toLowerCase();

    if(!SpicyTacoData[user]) {
		SpicyTacoData[user] = {
			daily: 1,
			gifted: 0,
			streak: 0
		};

		client.action('phirehero', '@' + username + ", enjoy 1 complementary Spicy Taco coin, in thanks for the resub!");
	} else {
		if(months % 3 === 0) {
			client.action('phirehero', '@' + username + ", enjoy 2 complementary Spicy Taco coins, in thanks for the resub AND the streak!");
			SpicyTacoData[user].daily = SpicyTacoData[user].daily + 2;
		} else {
			client.action('phirehero', '@' + username + ", enjoy 1 complementary Spicy Taco coin, in thanks for the resub!");
			SpicyTacoData[user].daily++;
		}
		
	}
});

client.on('chat', function(channel, user, message, self) {
	
	var username = user.username.toLowerCase();

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

	   //Gifted sub message
	   if(message.indexOf(resub[0]) >= 0) {
	      let gifter = message.substr(0, message.indexOf(',')).toLowerCase();

	      let giftee = message.substring(message.indexOf(resub[0]) + resub[0].length, message.indexOf(resub[1]) - 2);

	      console.log("****************");
	      console.log("* " + gifter + ' gifted a sub to ' + giftee + " *");
	      console.log("****************");

	      if(!SpicyTacoData[gifter]) {
			SpicyTacoData[gifter] = {
					daily: 0,
					gifted: 1,
					streak: 0
				};
			} else if(SpicyTacoData[gifter].gifted === 0) {
				SpicyTacoData[gifter].gifted++;
			}
	   }
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

	if(message.indexOf('!sad') >= 0) {
		fs.copyFileSync('../plumbobs/sad_plumbob.gif', '../plumbobs/plumbob.gif');	
	}

	if(message.indexOf('!constipated') >= 0) {
		fs.copyFileSync('../plumbobs/constipated_plumbob.gif', '../plumbobs/plumbob.gif');	
	}

	if(message.indexOf('!spicytacos') >= 0) {
		let stc = getSpicyTacos(username);
		let msg = "@" + user.username + ", you have " + stc + " Spicy Taco coin";
		if(stc === 1) {
			msg += "!";
		} else {
			msg += "s!";
		}

		client.say('phirehero', msg);
	}

	if(message.indexOf('!startgiveaway') >= 0) {
		giveawayActive = true;
		client.action('phirehero', 'The monthly giveaway has started! Cough up those Spicy Taco coins to enter! \'!enter\' to enter!')
	}

	if(message.indexOf('!enter') >= 0) {
		if(giveawayActive) {
			var tokens = SpicyTacoData[username].daily + SpicyTacoData[username].gifted + SpicyTacoData[username].streak;
			console.log(tokens);

			for(var i = 0; i < tokens; i++) {
				giveawayEntries.push(user.username);
			}

			client.action('phirehero', user.username + " entered the giveaway with " + tokens + " Spicy Taco Coins!");

			clearTacoCoins(username);
		}
	}

	if(message.indexOf('!closegiveaway') >= 0) {
		giveawayActive = false;
		client.action('phirehero', 'The monthly giveaway has been closed! Good luck everyone!');
		setTimeout(function() {
			shuffle(giveawayEntries);
			shuffle(giveawayEntries);

			var winner = giveawayEntries[Math.floor(Math.random() * giveawayEntries.length)];

			client.action('phirehero', 'The winner this month is: ' + winner);
			client.action('phirehero', 'CONGRATS!!!!!');
		}, 1000);
	}


	if(message.indexOf('!linkit') == 0) {
		let twitterhandle = message.substr(message.indexOf('!linkit') + 8);

		if(twitterhandle === "") {
			client.say('phirehero', '@' + user.username + ', your linked twitter is ' + twitterLookup.twitch[user.username]);
		} else {
			if(twitterhandle.indexOf('@') >= 0) {
				twitterhandle = twitterhandle.substr(1);
			}
			
			if(twitterLookup.twitch[user.username]) {
				var prevTwitter = twitterLookup.twitch[user.username];
				delete twitterLookup.twitter[prevTwitter];
				twitterLookup.twitter[twitterhandle] = user.username;
				twitterLookup.twitch[user.username] = twitterhandle;
				client.say('phirehero', '@' + user.username + ', you updated your twitter from ' + prevTwitter + ' to ' + twitterhandle + '!');
			} else {
				twitterLookup.twitter[twitterhandle] = user.username;
				twitterLookup.twitch[user.username] = twitterhandle;
				client.say('phirehero', '@' + user.username + ', your Twitter is now linked to ' + twitterhandle + '! phirehHype');
			}
		}
	}

});

let stream = twitterClient.stream('statuses/filter', { track: '#phirestarters,#phiretacos'});
let linkMessage = true;

var peopleRetweeted = [];

stream.on('data', function (tweet) {
	//Look up person in mapping file
	//If exist, give tacos
	//If not, do nothing
	let user = tweet.user.screen_name;

	if(!peopleRetweeted.includes(user) && !(user === "phirehero")) {
		console.log(">>>>> " + user + ' added to those who tweeted');
		peopleRetweeted.push(user);
		
		if(twitterLookup.twitter[user]) {
			client.say('phirehero', '@' + twitterLookup.twitter[user] + ', thanks for the retweet!');
			client.say('phirehero', '!Tacos Add ' + twitterLookup.twitter[user] + ' 100');
		} else {
			if(linkMessage) {
				linkMessage = false;
				client.action('phirehero', 'Make sure to link your twitter & twitch to receive tacos for those retweets! Use !linkit [twitter handle]');
				setTimeout(function() {
					linkMessage = true;
				}, 300000) // only show message again if retweeted after 5 minutes since last message sent
			}
			
		}
	}
	console.log(">>>>> " + tweet.user.screen_name + " just tweeted the stream!");
});

var distributeSpicyTacos = function() {
	Object.keys(earlyBirds).map(function(member, index) {

		var user = member.toLowerCase();

		if(SpicyTacoData[user]) {
			SpicyTacoData[user].daily++
		} else {
			SpicyTacoData[user] = {
				daily: 1,
				gifted: 0,
				streak: 0
			};
		}
	});
};

var getSpicyTacos = function(user) {

	var username = user.toLowerCase();

   if(!SpicyTacoData[username]) {
      SpicyTacoData[username] = {
			daily: 0,
			gifted: 0,
			streak: 0
		};
   }

   return SpicyTacoData[username].daily + SpicyTacoData[username].gifted + SpicyTacoData[username].streak;
};

var clearTacoCoins = function(user) {

	var username = user.toLowerCase();

	if(!SpicyTacoData[username]) {
		return;
	}

	SpicyTacoData[username] = {
		daily: 0,
		gifted: 0,
		streak: 0
	};
}

var shuffle = function (array) {

	var currentIndex = array.length;
	var temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;

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


