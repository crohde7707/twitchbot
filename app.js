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
   adventurers: {},
   equipment: {
      chests: [],
      weapons: []
   },
   bosses: [],
   loaded: false
};

var currentAdventurers = [];

let adventureStartTimer;

var t2notify = {};
var goodBands = ['Paramore', 'John Mayer', 'Fall Out Boy'];

var client = new tmi.client(options);
client.connect();

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

				adventureStartTimer = setTimeout(function() {
					adventure.embark(adventurerData, currentAdventurers, client);
				}, 5000)
			});

		} else {
			console.log(adventurerData);
			console.log('There is already an adventure in progress! Wait by the campfire for the next to start!');
		}
	}

	if(message == '!createAdventurer') {
		if(adventurerData.loaded) {
			adventure.createAdventurer(user.username, adventurerData);
			client.action('phirehero', '@' + user.username + ' has geared up for an adventure');
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
		currentAdventurers.push[user.username];
		client.action('phirehero', '@' + user.username + ' is ready to embark!');
	}

	//!embark, auto at 3 minutes
	if(message == '!embark') {
		adventure.embark(adventurerData, currentAdventurers, client);
	}
	//!gear

});
