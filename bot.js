const Discord = require('discord.js');
const config = require('./config.js');
const fs = require('fs');

const client = new Discord.Client();
const token = config.token;

client.login(token);

function initialize(client) {
  client.on('disconnect', closeEvent => {
    if (closeEvent.code === 4005 || closeEvent.code === 4004) {
      return false;
    }

    client.destroy().then(() => client.login(token));
  });

  client.on('message', message => {
    const character = getCharacter(message);

    if (character !== null) {
      const textChannel = message.channel;
      const guild = message.guild;

      let options = {};
      options.voiceChannel = message.member.voiceChannel;
      options.play = true;
      options.file = getRandomAudio(character);

      let content = message.content.toLowerCase();

      if (options.leave) {
        let voiceConnection = client.voiceConnections.get(guild.id);

        if (voiceConnection) {
          voiceConnection.disconnect();
          voiceConnection.channel.leave();
        }
      }

      if (options.play === true) {
        if (options.voiceChannel) {
          playAudio(options.voiceChannel, options.file, character, textChannel);
        } else {
          textChannel.send('You have to be in a voice channel to do this.');
        }
      }
    }
  });
}

initialize(client);

function getCharacter(message) {
  const content = message.content.toLowerCase();

  let character = null;

  if (content.startsWith('!mark')) {
    character = 'mark';
  } 
  else if (content.startsWith('!jeremy') || content.startsWith('!jez')) {
    character = 'jeremy';
  }

  return character;
}

function getRandomAudio(character) {
  const files = fs.readdirSync('./audio/' + character);
  const index = Math.floor(Math.random() * files.length);

  return './audio/' + character + '/' + files[index];
}

function playAudio(voiceChannel, file, character, textChannel) {
  // check for permissions first
  if (!voiceChannel.permissionsFor(client.user.id).has("CONNECT")) {
    textChannel.send("You do not have permissions to join this channel.")
    return;
  };
  if (!voiceChannel.permissionsFor(client.user.id).has("SPEAK")) {
    textChannel.send("You do not have permission to speak in this channel")
    return;
  };

  voiceChannel.join().then(connection => {
    connection.playFile(file).on("end", () => {
      connection.disconnect();
      voiceChannel.leave();
    });
  }).catch(error => {
    textChannel.send(error.toString());
  });
}