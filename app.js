var tmi = require('tmi.js');
var fs = require('fs');
var adventure = require('./games/adventure.js');

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

var adventurerData = {
   activeScenario: {},
   adventurers: {},
   bosses: {},
   difficulty: "",
   equipment: {
      chests: [],
      weapons: []
   },
   loaded: false,
   loot: 0,
   nextStep: false,
   scenarios: {},
   vote: {
   	  voteCount: 0,
   	  votes: {},
   	  voteActive: false
   }
};

var currentAdventurers = [];

let adventureStartTimer;

var t2notify = {};
var goodBands = ['Paramore', 'John Mayer', 'Fall Out Boy'];

var client = new tmi.client(options);
client.connect();

//Execute early message after 10 minutes
var earlyMsg = setTimeout(function() {
	client.action('phirehero', 'is handing out a second serving of tacos to all you early arrivals! Enjoy! phirehHype phirehHype phirehHype');
}, 600000);

client.on('chat', function(channel, user, message, self) {
	//Tier 2 sub announcements
	var username = user.username;

	if(username === 'phirebot') {
	   //Bot Specific messages
	   //Song request rewards
	   var band = message.substring(message.indexOf('The song') + 9, message.indexOf(' - '));
	   var viewer = message.substring(0, message.indexOf(' -->'));
	   if(goodBands.includes(band)) {
              client.action('phirehero', 'phirehHype Good Band Request Roulette Chance! phirehHype')
              var num = Math.floor(Math.random() * 100) + 1;
              var response = 'Roulette Result: ' + num;
              if(num >= 50) {
		      client.action('phirehero', response + '! ' + viewer + ' is rewarded 25 tacos!');
		      client.say('phirehero', '!tacos Add ' + viewer + ' 25');
	      } else {
                 client.action('phirehero', response + '. no tacos for ' + viewer + ' :(');
	      }
	   }
	}

	//Adventure
	if(message.indexOf('!adventure') >= 0) {
		
		if (adventurerData.loaded !== true) {
			adventurerData.loaded = true;
			client.action('phirehero', 'We are going on an adventure!');

			let loaders = adventure.load(adventurerData);

			return Promise.all(loaders).then(function(data) {
				console.log('Data loaded for adventure!');
				adventure.saveAdventurers(adventurerData);

				client.action('phirehero', "Type '!joinAdventure' to join in!");

				// Embark after 5 minutes
				adventureStartTimer = setTimeout(function() {
					adventure.embark(adventurerData, currentAdventurers, client);
				}, 45000)
			});

		} else {
			client.action('phirehero', 'There is already an adventure in progress! Wait by the campfire for the next to start!');
		}
	}

	if(message == '!createAdventurer') {
		if(adventurerData.loaded) {
			adventure.createAdventurer(user.username, adventurerData);
			client.action('phirehero', '@' + user.username + ' has geared up for an adventure for the first time!');
			adventure.saveAdventurers(adventurerData);
		}
	}

	if(message == '!resetAdventurer') {
		if(adventurerData.loaded) {
			adventure.resetAdventurer(user.username, adventurerData);
			client.action('phirehero', '@' + user.username + ' had nerfed their adventure! Probably was a tad OP, TBF Kappa');
			adventure.saveAdventurers(adventurerData);
		}
	}

	if(message == '!myAdventurer') {
		if(!adventurerData.loaded) {
			let loaders = adventure.load(adventurerData);
			Promise.all(loaders).then(function(data) {
				adventure.provideStats(user.username, adventurerData, client);
			})
		} else {
			adventure.provideStats(user.username, adventurerData, client);
		}
		
	}

	if(message == '!joinAdventure') {
		if(adventurerData.loaded) {
			if(!adventurerData.adventurers[user.username]) {
				adventure.createAdventurer(user.username, adventurerData);
				client.action('phirehero', '@' + user.username + ' has geared up for an adventure for the first time!');
				adventure.saveAdventurers(adventurerData);
			}

			if(currentAdventurers.indexOf(user.username) > -1) {
				client.whisper(user.username, 'You are already joined in on the adventure!');
			} else {
				currentAdventurers.push(user.username);
				client.action('phirehero', '@' + user.username + ' is ready to embark!');
			}
		}
	}

	//!embark, auto at 3 minutes
	if(message == '!embark') {
		adventure.embark(adventurerData, currentAdventurers, client);
	}
	

});

client.on('whisper', function (from, userstate, message, self) {
	if(self) return;

	if(adventurerData.loaded && adventurerData.vote.voteActive) {
		if(message.indexOf('!vote') === 0) {
			//Adventurer is voting
			let vote = message.substring(message.indexOf('!vote') + 5);

			try {
				adventurerData.vote.votes[from] = Number.parseInt(vote)
			} catch (e) {
				adventurerData.vote.votes[from] = 1
			}
			
			
			adventurerData.vote.voteCount++;

			//check if this is last vote needed
			if(adventurerData.vote.voteCount === currentAdventurers.length) {
				//continue Adventure
				adventurerData.vote.voteCount = 0;
				
				adventurerData.vote.voteActive = false;
				adventure[adventurerData.nextStep].call(this, adventurerData, currentAdventurers, client);
			}
		} else if(message.indexOf('!ready') === 0 || message.indexOf('!flee') === 0) {
			let vote = message.substr(1);

			if (vote === 'ready' || vote === 'flee') {
				adventurerData.vote.votes[from] = vote;
				adventurerData.vote.voteCount++;
			}
			//check if this is last vote needed
			if(adventurerData.vote.voteCount === currentAdventurers.length) {
				//continue Adventure
				adventurerData.vote.voteCount = 0;
				
				adventurerData.vote.voteActive = false;
				adventure[adventurerData.nextStep].call(this, adventurerData, currentAdventurers, client);
			}
		}

		
	}
});