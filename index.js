const Discord = require('discord.js');
const client = new Discord.Client(
    {intents: ["GUILD_MESSAGES", "GUILD_VOICE_STATES", "GUILDS"]}
);

const config = require('./config.json');
const commands = require(`./bin/commands`);
let replychannel;
client.login(config.BOT_TOKEN);
let spawn = require('child_process').spawn,
    pyshell    = spawn('python', ['summarize.py']);
pyshell.stdout.on('data', function(data){
    data.toString().match(/.{1,1999}/g).forEach(s => replychannel.send(s));
});
pyshell.stderr.on('data', function(data){
    console.log(data.toString())
});

// end the input stream and allow the process to exit
// pyshell.end(function (err,code,signal) {
//   if (err) throw err;
//   console.log('The exit code was: ' + code);
//   console.log('The exit signal was: ' + signal);
//   console.log('finished');
// });

//in case the bot was not configured properly
if(!config.PREFIX || !config.BOT_TOKEN) {
    console.error("Error: The configuration file was configured improperly. Please ensure there are no spelling mistakes.");
    process.exit(1);
}

client.on('message', msg => {
    if (msg.content.startsWith(config.PREFIX)) {
        const commandBody = msg.content.substring(config.PREFIX.length).split(' ');
        const channelName = commandBody[1];
        lastmsgchannel = msg.channel
        if (commandBody[0] === ('enter') && commandBody[1]) commands.enter(msg, channelName);
        if (commandBody[0] === ('exit')) replychannel = commands.exit(msg, pyshell);
        if (commandBody[0] === ('ping')) {
            const pingEmbed = new Discord.MessageEmbed()
                .setTitle("Ping")
                .setDescription(`:ping_pong: Pong!\nLatency is : ${Date.now() - msg.createdTimestamp}ms. API Latency is : ${Math.round(client.ws.ping)}ms`)
                .setColor("#03a1fc")
            msg.channel.send(pingEmbed);
        }
    }
});

client.on('ready', () => {
    console.log(`\nONLINE\n`);
});
