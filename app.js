var tmi = require('tmi.js');
var fs = require('fs');
var adventure = require('./games/adventure.js');

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
   adventurers: [],
   equipment: {
      chests: [],
      weapons: []
   },
   bosses: []
};

var t2notify = {};
var goodBands = ['Paramore', 'John Mayer', 'Fall Out Boy'];

var client = new tmi.client(options);
client.connect();

client.on('chat', function(channel, user, message, self) {
	//Tier 2 sub announcements
	var username = user.username;
	if(username === 'domma7' && !t2notify[username]) {
	   t2notify[username] = true;
	   client.say('phirehero', '!domma');
	}

	if(username === 'nyla18' && !t2notify[username]) {
		t2notify[username] = true;
		client.say('phirehero', '!nyla');
	}

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
		console.log('We are going on an adventure!');

		let adv = loadAdventurers();
		let eqp = loadEquipment();
		let bosses = loadBosses();

		Promise.all([adv, eqp, bosses]).then(function(data) {
			console.log('Data loaded for adventure!');
			saveAdventurers();
		});
	}

	if(message == '!joinAdventure') {
		createAdventurer(user.username);
		saveAdventurers();
	}

	//!embark, auto at 2 minutes

	//!gear

});