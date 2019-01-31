var Twitter = require('twitter');

var twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

let stream = twitterClient.stream('statuses/filter', { track: '#phirestarters, #phiretacos'});

var tweetsToProcess = [];

stream.on('data', function (tweet) {
	console.log(tweet.user.screen_name + " just tweeted the stream!");
});