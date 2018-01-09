var tmi = require('tmi.js');
var fs = require('fs');

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

var loadAdventurers = function() {

	return new Promise(function(resolve, reject) {
		fs.exists('/Users/itg8498/Documents/Ankhbot/adventure/adventurers.json', function(exists){
		    if(exists) {
		        fs.readFile('/Users/itg8498/Documents/Ankhbot/adventure/adventurers.json', function(err, data){
			        if (err){
			            console.log(err);
			            reject();
			        } else {
			        	console.log(JSON.parse(data));
		        		adventurerData.adventurers = JSON.parse(data);
		        		resolve();
		        	}
		        });
		    } else {
		    	resolve();
		    }
		});
	});
};

var loadEquipment = function() {
	return new Promise(function(resolve, reject) {
		fs.readFile('/Users/itg8498/Documents/Ankhbot/adventure/equipment.json', function(err, data) {
			if(err) {
				console.log(err);
				reject();
			} else {
				adventurerData.equipment = JSON.parse(data);
				resolve();
			}
		});
	});
}

var loadBosses = function() {
	return new Promise(function(resolve, reject) {
		fs.readFile('/Users/itg8498/Documents/Ankhbot/adventure/bosses.json', function(err, data) {
			if(err) {
				console.log(err);
				reject();
			} else {
				adventurerData.bosses = JSON.parse(data);
				resolve();
			}
		});
	});
}

var createAdventurer = function(name) {
	var adventurer = {
		name: name,
		lvl: 1,
		exp: 0,
		equipment: {
			chest: "Cloth Tunic",
			weapon: "Fists"
		}
	};

	client.action('phirehero', name + ' has geared up for an adventure');
	
	adventurerData.adventurers.push(adventurer);
}

var saveAdventurers = function() {
	fs.exists('/Users/itg8498/Documents/Ankhbot/adventure/adventurers.json', function(exists){
    	if(exists){
        	console.log("yes file exists");
        	fs.readFile('/Users/itg8498/Documents/Ankhbot/adventure/adventurers.json', function(err, data){
        		if (err){
            		console.log(err);
        		} else {
        			var obj = JSON.parse(data); 
        			
        			var merged = Object.assign({}, obj, adventurerData.adventurers);

        			var json = JSON.stringify(merged); 
        			fs.writeFile('/Users/itg8498/Documents/Ankhbot/adventure/adventurers.json', json, function(err) {
        				if (err) {
        					console.log(err);
        				}
        			}); 
        		}
        	});
    	} else {
        	console.log("file not exists")
        	var json = JSON.stringify(adventurerData.adventurers);
        	fs.writeFile('/Users/itg8498/Documents/Ankhbot/adventure/adventurers.json', json, function(err) {
        		if (err) {
        			console.log(err);
        		}
        	});
        }
    });
}