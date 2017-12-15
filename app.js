var tmi = require('tmi.js');

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

var t2notify = {};

var client = new tmi.client(options);
client.connect();

client.on('chat', function(channel, user, message, self) {
	//Tier 2 sub announcements
	var username = user.username;
	if(username === 'domma7' && !t2notify[username]) {
	   t2notify[username] = true;
	   client.say('phirehero', '!domma');
	}
});

client.on('connected', function(address, port) {
	client.action("phirehero", "Hello, I am here!");
});
