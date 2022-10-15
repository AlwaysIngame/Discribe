const Discord = require('discord.js');
const client = new Discord.Client(
    {intents: ["GUILD_MESSAGES", "GUILD_VOICE_STATES", "GUILDS"]}
);

const config = require('./config.json');
const commands = require(`./bin/commands`);

client.login(config.BOT_TOKEN);
let lastexit;
let spawn = require('child_process').spawn,
    pyshell    = spawn('python', ['summarize.py']);
pyshell.stdout.on('data', function(data){
    data.toString().match(/.{1,1999}/g).forEach(s => client.channels.cache.get('1030656604342849599').send(s));
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
        
        if (commandBody[0] === ('enter') && commandBody[1]) commands.enter(msg, channelName);
        if (commandBody[0] === ('exit')) lastexit = commands.exit(msg, pyshell);
    }
});

client.on('ready', () => {
    console.log(`\nONLINE\n`);
    channel = client.channels.cache.get(1030656604342849599);
});
