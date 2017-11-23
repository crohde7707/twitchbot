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

var client = new tmi.client(options);
client.connect();

client.on('chat', function(channel, user, message, self) {
	if(message === "!taco") {
		client.action("phirehero", user['display-name'] + ", yes, yes they are delicious!");
	}
});

client.on('connected', function(address, port) {
	client.action("phirehero", "Hello, I am here!");
});