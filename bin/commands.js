const fs = require('fs');
const { spawn } = require("child_process");

const createNewChunk = () => {
    const pathToFile = __dirname + `/../recordings/${Date.now()}.pcm`;
    return fs.createWriteStream(pathToFile);
};

function mg() {
    var fs = require('fs'),
    chunks = fs.readdirSync(__dirname + '/../recordings'),
    inputStream,
    currentfile,
    outputStream = fs.createWriteStream(__dirname + '/../recordings/merge.pcm');

    chunks.sort((a, b) => { return a - b; });

    function appendFiles() {
        if (!chunks.length) {
            outputStream.end(() => console.log('Finished.'));
            return;
        }

        currentfile = `${__dirname}/../recordings/` + chunks.shift();
        inputStream = fs.createReadStream(currentfile);

        inputStream.pipe(outputStream, { end: false });

        inputStream.on('end', function() {
            console.log(currentfile + ' appended');
            appendFiles();
        });
    }

    appendFiles();
    spawn("ffmpeg", ["-f", "s16le", "-ar", "48000", "-ac", "2", "-i", "../recordings/merge.pcm", "../out.mp3"])
}

exports.enter = function(msg, channelName) {
    channelName = channelName.toLowerCase();
    
    //filter out all channels that aren't voice or stage
    const voiceChannel = msg.guild.channels.cache
                            .filter(c => c.type === "voice" || c.type === "stage")
                            .find(channel => channel.name.toLowerCase() === channelName);
    
    //if there is no voice channel at all or the channel is not voice or stage
    if (!voiceChannel || (voiceChannel.type !== 'voice' && voiceChannel.type !== 'stage'))
        return msg.reply(`The channel #${channelName} doesn't exist or isn't a voice channel.`);
    
    console.log(`Sliding into ${voiceChannel.name} ...`);
    voiceChannel.join()
        .then(conn => {
            
            const dispatcher = conn.play(__dirname + '/../sounds/drop.mp3');
            dispatcher.on('finish', () => { console.log(`Joined ${voiceChannel.name}!\n\nREADY TO RECORD\n`); });
            
            const receiver = conn.receiver;
            conn.on('speaking', (user, speaking) => {
                if (speaking) {
                    console.log(`${user.username} started speaking`);
                    const audioStream = receiver.createStream(user, { mode: 'pcm' });
                    audioStream.pipe(createNewChunk());
                    audioStream.on('end', () => { console.log(`${user.username} stopped speaking`); });
                }
            });
        })
        .catch(err => { throw err; });
}

exports.exit = function (msg) {
    //check to see if the voice cache has any connections and if there is
    //no ongoing connection (there shouldn't be undef issues with this).
    if(msg.guild.voiceStates.cache.filter(a => a.connection !== null).size !== 1)
        return;
    
    //make sure it's .last() not .first().  some discord js magic going on rn
    const { channel: voiceChannel, connection: conn } = msg.guild.voiceStates.cache.last();
    const dispatcher = conn.play(__dirname + "/../sounds/badumtss.mp3", { volume: 0.45 });
    dispatcher.on("finish", () => {
        voiceChannel.leave();
        console.log(`\nSTOPPED RECORDING\n`);
        mg();
    });
};
