var fs = require('fs');

var defaultData = {
   adventurers: {},
   equipment: {
      chests: [],
      weapons: []
   },
   bosses: [],
   loaded: false
};

var load = function(adventurerData) {
	let adv = loadAdventurers(adventurerData);
	let eqp = loadEquipment(adventurerData);
	let bosses = loadBosses(adventurerData);
	
	return [adv, eqp, bosses];
}

var loadAdventurers = function(adventurerData) {

	return new Promise(function(resolve, reject) {
		fs.exists('/Users/crohd/Desktop/twitchbot/data/adventure/adventurers.json', function(exists){
		    if(exists) {
		        fs.readFile('/Users/crohd/Desktop/twitchbot/data/adventure/adventurers.json', function(err, data){
			        if (err){
			            console.log(err);
			            reject();
			        } else {
			        	if(data.toString('utf8').length > 0) {
		        			adventurerData.adventurers = JSON.parse(data);	
			        	}
			        	
		        		resolve();
		        	}
		        });
		    } else {
		    	resolve();
		    }
		});
	});
};

var loadEquipment = function(adventurerData) {
	return new Promise(function(resolve, reject) {
		fs.readFile('/Users/crohd/Desktop/twitchbot/data/adventure/equipment.json', function(err, data) {
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

var loadBosses = function(adventurerData) {
	return new Promise(function(resolve, reject) {
		fs.readFile('/Users/crohd/Desktop/twitchbot/data/adventure/bosses.json', function(err, data) {
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

var createAdventurer = function(name, adventurerData, force) {
	if(adventurerData.adventurers[name] && !force) {
		console.log('We already have you on the roster! Type \'!stats\' to see your current stats!');
	} else {

		var adventurer = {
			name: name,
			lvl: 1,
			exp: 0,
			equipment: {
				armor: "Cloth Tunic",
				weapon: "Fists"
			}
		};
		
		adventurerData.adventurers[name] = adventurer;
	}
}

var saveAdventurers = function(adventurerData) {
	fs.exists('/Users/crohd/Desktop/twitchbot/data/adventure/adventurers.json', function(exists){
    	if(exists){
        	
        	fs.readFile('/Users/crohd/Desktop/twitchbot/data/adventure/adventurers.json', function(err, data){
        		if (err){
            		console.log(err);
        		} else {
        			var obj = JSON.parse(data); 
        			
        			var merged = Object.assign({}, obj, adventurerData.adventurers);

        			var json = JSON.stringify(merged); 
        			fs.writeFile('/Users/crohd/Desktop/twitchbot/data/adventure/adventurers.json', json, function(err) {
        				if (err) {
        					console.log(err);
        				}
        			}); 
        		}
        	});
    	} else {
        	var json = JSON.stringify(adventurerData.adventurers);
        	fs.writeFile('/Users/crohd/Desktop/twitchbot/data/adventure/adventurers.json', json, function(err) {
        		if (err) {
        			console.log(err);
        		}
        	});
        }
    });
}

var resetAdventurer = function(name, adventurerData) {
	createAdventurer(name, adventurerData, true);
}

var provideStats = function(name, adventurerData, client) {
	var adventurer = adventurerData.adventurers[name];

	client.whisper(name, "Stats for " + adventurer.name + ':');
	setTimeout(function() {
		client.whisper(name, " - Level: " + adventurer.lvl + " (" + adventurer.exp + "/)");	
	}, 800);

	setTimeout(function() {
		client.whisper(name, "   - Armor: " + adventurer.equipment.armor);
	}, 1600);
	setTimeout(function() {
		client.whisper(name, "   - Weapon: " + adventurer.equipment.weapon);
	}, 2400);
}

let embark = function(adventurerData, currentAdventurers, client) {
	if(currentAdventurers.size >= 2) {
		client.action('phirehero', 'The following adventuruers have left on a daring quest: ' + currentAdventurers.join(', '));
	} else {
		client.action('phirehero', 'We need at least 2 adventurers to stand a chance! The adventure has been called off!');
		let fresh = cleanup(adventurerData, currentAdventurers, client);
		adventurerData = fresh.adventurerData;
		currentAdventurers = fresh.currentAdventurers;
	}
}

let cleanup = function(adventurerData, currentAdventurers, client) {
	saveAdventurers(adventurerData);
	adventurerData = defaultData;
	console.log(adventurerData);
	currentAdventurers = [];
	return {adventurerData, currentAdventurers}
}

module.exports = {
	load: load,
	loadAdventurers: loadAdventurers,
	loadEquipment: loadEquipment,
	loadBosses: loadBosses,
	createAdventurer: createAdventurer,
	saveAdventurers: saveAdventurers,
	resetAdventurer: resetAdventurer,
	provideStats: provideStats,
	embark: embark
}
