var fs = require('fs');
let child_p = require('child_process');

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
	let scenarios = loadScenarios(adventurerData);
	
	return [adv, eqp, bosses, scenarios];
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

var loadScenarios = function(adventurerData) {
	return new Promise(function(resolve, reject) {
		fs.readFile('/Users/crohd/Desktop/twitchbot/data/adventure/scenarios.json', function(err, data) {
			if(err) {
				console.log(err);
				reject();
			} else {
				adventurerData.scenarios = JSON.parse(data);
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

	if(currentAdventurers.length >= 1) {
		// Choose difficulty for adventure
		currentAdventurers.forEach(function(adventurer) {
			client.whisper(adventurer, 'Vote for the difficulty of your adventure: [!vote 1] Easy | [!vote 2] Normal')
		});

		adventurerData.nextStep = "firstScenario";
		adventurerData.vote.voteActive = true;

	} else {
		client.action('phirehero', 'We need at least 2 adventurers to stand a chance! The adventure has been called off!');
		let fresh = cleanup(adventurerData, currentAdventurers, client);
		adventurerData = fresh.adventurerData;
		currentAdventurers = fresh.currentAdventurers;
	}
}

let resetVotes = function(adventurerData) {
	adventurerData.vote = {
		voteCount: 0,
		votes: {},
		voteActive: false
	};
}

let getVote = function(adventurerData) {
	let vote1 = vote2 = vote3 = voteReady = voteFlee = 0;
	return new Promise(function(resolve, reject) {
		for (let adventurer in adventurerData.vote.votes) {
			switch (adventurerData.vote.votes[adventurer]) {
				case 1:
				   vote1++;
				   break;
			    
			    case 2:
			       vote2++;
			       break;

			    case 3:
			       vote3++;
			       break;
			    case 'ready':
			       voteReady++;
			       break;
			    case 'flee':
			       voteFlee++;
			       break;
			}
		}

		resetVotes(adventurerData);

		if(voteReady > 0 || voteFlee > 0) {
			// final vote
			if(voteReady > voteFlee) {
				resolve('ready');
			} else {
				resolve('flee');
			}
		} else {

			if(vote1 >= vote2 && vote1 >= vote3) {
				resolve(0);
			} else if (vote2 >= vote1 && vote2 >= vote3) {
				resolve(1);
			} else {
				resolve(2);
			}
		}
	})
}

let getDifficulty = function(adventurerData) {
	return new Promise(function(resolve, reject) {
		let easy = normal = hard = 0;

		for (let adventurer in adventurerData.vote.votes) {
			switch (adventurerData.vote.votes[adventurer]) {
				case 1:
				   easy++;
				   break;
			    case 2:
			       normal++;
			       break;
		        case 3:
		           hard++;
		           break;
			}
		}

		resetVotes(adventurerData);

		if(hard >= normal && hard >= easy) {
			adventurerData.difficulty = "hard";
			resolve();
		} else if (normal >= hard && normal >= easy) {
			adventurerData.difficulty = "normal";
			resolve();
		} else {
			adventurerData.difficulty = "easy";
			resolve();
		}

	})
}

let firstScenario = function(adventurerData, currentAdventurers, client) {
	
	getDifficulty(adventurerData).then(function() {
		client.action('phirehero', 'The following adventurers have left on a quest of ' + adventurerData.difficulty + ' difficulty: ' + currentAdventurers.join(', '));

		let scenarios = adventurerData.scenarios['stage1'];
		let scenarioNumber = getRandomIntInclusive(1, scenarios.length);
		let whisperMsg;

		adventurerData.activeScenario = scenarios[scenarioNumber - 1];

		if(Array.isArray(adventurerData.activeScenario.msg)) {
			adventurerData.activeScenario.msg.forEach(function(msg, index) {
				if(index < adventurerData.activeScenario.msg.length - 1) {
					client.action("phirehero", msg);
					child_p.execSync("sleep 1")
				} else {
					whisperMsg = msg
				}
			});
		} else {
			whisperMsg = adventurerData.activeScenario.msg
		}

		currentAdventurers.forEach(function(adventurer) {
			client.whisper(adventurer, whisperMsg);
		});

		adventurerData.nextStep = "firstScenarioResolution";
		adventurerData.vote.voteActive = true;
	});
	
}

let firstScenarioResolution = function(adventurerData, currentAdventurers, client, result) {

	getVote(adventurerData).then(function(option) {
		let randAdv = currentAdventurers[getRandomIntInclusive(0, currentAdventurers.length - 1)]

		//implement modifier to results based on skill for scenario

		let outcome = (getRandomIntInclusive(0, 100) >= 50) ? "success" : "failure";
		let outcomeMsg = adventurerData.activeScenario[outcome][option].msg.replace(/{ADVENTURER}/, '@' + randAdv);

		client.action("phirehero", outcomeMsg);

		let tacosRange = adventurerData.activeScenario[outcome][option].tacos;

		if (outcome === "success") {
			adventurerData.loot += getRandomIntInclusive(tacosRange[0], tacosRange[1]);
		} else {
			adventurerData.loot -= getRandomIntInclusive(tacosRange[0], tacosRange[1]);
		}

		client.action("phirehero", "Current loot from adventure: " + adventurerData.loot + " tacos");

		secondScenario(adventurerData, currentAdventurers, client);

	});
}

let secondScenario = function(adventurerData, currentAdventurers, client) {

	let scenarios = adventurerData.scenarios['stage2'];
	let scenarioNumber = getRandomIntInclusive(1, scenarios.length);
	let whisperMsg;
	let randAdv = currentAdventurers[getRandomIntInclusive(0, currentAdventurers.length - 1)]

	adventurerData.activeScenario = scenarios[scenarioNumber - 1];

	if(Array.isArray(adventurerData.activeScenario.msg)) {
		adventurerData.activeScenario.msg.forEach(function(msg, index) {
			let updatedMsg = msg.replace(/{ADVENTURER}/, '@' + randAdv);

			if(index < adventurerData.activeScenario.msg.length - 1) {
				client.action("phirehero", updatedMsg);
				child_p.execSync("sleep 1")
			} else {
				whisperMsg = updatedMsg
			}
		});
	} else {
		whisperMsg = adventurerData.activeScenario.msg.replace(/{ADVENTURER}/, '@' + randAdv);
	}

	currentAdventurers.forEach(function(adventurer) {
		client.whisper(adventurer, whisperMsg);
	});

	adventurerData.nextStep = "secondScenarioResolution";
	adventurerData.vote.voteActive = true;
}

let secondScenarioResolution = function(adventurerData, currentAdventurers, client, result) {
	getVote(adventurerData).then(function(option) {
		let randAdv = currentAdventurers[getRandomIntInclusive(0, currentAdventurers.length - 1)]

		//implement modifier to results based on skill for scenario

		let outcome = (getRandomIntInclusive(0, 100) >= 50) ? "success" : "failure";
		let dialog = adventurerData.activeScenario[outcome][option].msg;
		let tacosRange = adventurerData.activeScenario[outcome][option].tacos;

		if(Array.isArray(dialog)) {
			dialog.forEach(function(msg, index) {
				let updatedMsg = msg.replace(/{ADVENTURER}/, '@' + randAdv);

				client.action("phirehero", updatedMsg);
				child_p.execSync("sleep 1")
			});
		} else {
			client.action("phirehero", dialog.replace(/{ADVENTURER}/, '@' + randAdv));
		}

		if (outcome === "success") {
			adventurerData.loot += getRandomIntInclusive(tacosRange[0], tacosRange[1]);
		} else {
			adventurerData.loot -= getRandomIntInclusive(tacosRange[0], tacosRange[1]);
		}

		client.action("phirehero", "Current loot from adventure: " + adventurerData.loot + " tacos");

		finalScenario(adventurerData, currentAdventurers, client);

	});
}

let finalScenario = function(adventurerData, currentAdventurers, client) {

	let scenario = adventurerData.scenarios['finalStage'];
	let numBosses = adventurerData.bosses[adventurerData.difficulty].length;
	let randBoss = adventurerData.bosses[adventurerData.difficulty][getRandomIntInclusive(0, numBosses - 1)];

	adventurerData.activeScenario = scenario;

	adventurerData.activeScenario.boss = randBoss;
	
	client.action("phirehero", scenario.msg[0].replace(/{BOSS}/, randBoss.name));
	child_p.execSync("sleep 1")
	client.action("phirehero", "Health: " + randBoss.health + ", Attack: " + randBoss.attack + ", Speed: " + randBoss.speed)

	currentAdventurers.forEach(function(adventurer) {
		client.whisper(adventurer, scenario.msg[1]);
	});

	adventurerData.nextStep = "finalScenarioResolution";
	adventurerData.vote.voteActive = true;
}

let finalScenarioResolution = function(adventurerData, currentAdventurers, client, result) {
	console.log("finalScenarioResolution");
	getVote(adventurerData).then(function(option) {
		if(option === "flee") {
			client.action('phirehero', "The boss' presence was too much, causing our adventures to flee!");
			child_p.execSync("sleep 1");
		} else {
			//do battle
			doBattle(adventurerData, currentAdventurers, client);
		}

		if(adventurerData.loot <= 0) {
			client.action('phirehero', "Great adventure everyone! Unfortunately, you lost a few tacos along the way, but next time you will be more fortunate!");
		} else {
			client.action('phirehero', "Great adventure everyone! You managed to trade in your findings for some tacos! phirehHype ");
		}	

		currentAdventurers.forEach(function(adv) {
			if(adventurerData.loot < 0) {
				//lost tacos
				client.say('phirehero', '!Tacos Remove ' + adv + ' ' + Number.parseInt(adventurerData.loot.toString().substr(1)) );
			} else {
				client.say('phirehero', '!Tacos Add ' + adv + ' ' + adventurerData.loot);
			}
		});
	});
}

let doBattle = function(adventurerData, currentAdventurers, client) {
	let boss = adventurerData.activeScenario.boss;

	let order = [];

	currentAdventurers.forEach(function(adv) {
		order.push(adventurerData.adventurers[adv]);
	});
	order.push(boss);

	order.sort(function(node1, node2) {
		return node2.speed > node1.speed;
	});

	console.log(order);
}

let cleanup = function(adventurerData, currentAdventurers, client) {
	saveAdventurers(adventurerData);
	adventurerData = defaultData;

	currentAdventurers = [];
	return {adventurerData, currentAdventurers}
}

let getRandomIntInclusive = function(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
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
	embark: embark,
	firstScenario: firstScenario,
	firstScenarioResolution: firstScenarioResolution,
	secondScenarioResolution: secondScenarioResolution,
	finalScenarioResolution: finalScenarioResolution
}
