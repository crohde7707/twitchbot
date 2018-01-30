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