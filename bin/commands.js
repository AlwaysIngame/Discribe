const fs = require('fs');

const createNewChunk = () => {
    const pathToFile = __dirname + `/../recordings/${Date.now()}.pcm`;
    return fs.createWriteStream(pathToFile);
};

function onmerge(pysh, msg) {
    var exec = require('child_process').exec;
    const currdate = Date.now();
    exec('ffmpeg -f s16le -ar 48000 -ac 2 -i ' + __dirname + '/../recordings/merge.pcm ' + __dirname + `/../${currdate}.mp3`,
        function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
                
            } else {
                const dir = __dirname + '/../recordings'
                // delete directory recursively
                fs.readdir(dir, (err, files) => {
                    if (err) console.log(err);
                    for (const file of files) {
                        fs.unlink(require('path').join(dir, file), err => {
                            if (err) console.log(err);
                        });
                    }
                });
                msg.reply("Here is your recording. Transcript and summarization will arrive soon", { files: [__dirname + `/../${currdate}.mp3`] });
                pysh.stdin.write(__dirname + `/../${currdate}.mp3\n`)
            }
        }
    );
}
function mg(pysh, msg) {
    var f = fs,
    chunks = f.readdirSync(__dirname + '/../recordings'),
    inputStream,
    currentfile,
    outputStream = f.createWriteStream(__dirname + '/../recordings/merge.pcm');

    chunks.sort((a, b) => { return a - b; });

    function appendFiles() {
        if (!chunks.length) {
            outputStream.end(() => console.log('Finished.'));
            onmerge(pysh, msg);
            return;
        }

        currentfile = `${__dirname}/../recordings/` + chunks.shift();
        inputStream = f.createReadStream(currentfile);

        inputStream.pipe(outputStream, { end: false });

        inputStream.on('end', function() {
            console.log(currentfile + ' appended');
            appendFiles();
        });
    }

    appendFiles();
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
    msg.reply(':red_circle: Starting recording...')
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

exports.exit = function (msg, pysh) {
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
        mg(pysh, msg);
    });
    return msg
};
