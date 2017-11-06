/*
(c) Copyright 2016-2017 Hewlett Packard Enterprise Development LP

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

const nlp = require('./middleware/nlp-middleware').nlp;
const ovListener = require('./listener/ov-listener');
const ovClient = require('./oneview-sdk/ov-client');
const ovBrain = require('./middleware/ov-brain');

const BULLET = '\n\t\u2022 ';

const main = (robot) => {
  // load OneView configuration data from external file
  let oneviewConfig;
  try {
    const configuration = require('../oneview-configuration.json');
    robot.logger.info('Applying configuration from json file.');
    oneviewConfig = configuration;
  } catch(err) {
    robot.logger.error('Error reading OneView configuration file: ', err);
    //throw new error
    return;
  }

  robot.logger.info('Initializing NLP');
  const lex = nlp(robot);

  robot.logger.info('Initializing OneView');
  const client = new ovClient(oneviewConfig, robot);

  client.login(false).then(() => {
    robot.logger.info('Logged into OneView.');
    const brain = new ovBrain(client, robot, lex);
    ovListener(robot, client, brain);
    introBot();
  }).catch((err) => {
    robot.logger.error(err);
  });

  function introBot() {
    client.ServerHardware.getAllServerHardware().then((sh) => {
      client.ServerProfiles.getAllServerProfiles().then((sp) => {
        client.ServerProfileTemplates.getAllServerProfileTemplates()
          .then((spt) => {
            let room = '#' + client.chatRoom;

            if (robot.adapterName === 'flowdock') {
              room = client.chatRoom;
            }

            robot.messageRoom(room,
              "Hello, I'm " + robot.name + "! "
              +"Your OneView instance is currently showing:"
              + BULLET + sh.members.length + " server(s)."
              + BULLET + sp.members.length + " server profile(s)."
              + BULLET + spt.members.length +" server profile template(s)."
              + "\nHow can I assist you? Type '@" + robot.name
              + " help' to learn what I can do.");
          });
      });
    });
  }

  //TODO: Bug #22 Not working.  Need to perform an aysnc shutdown from the SCMB
  function exitHandler() {
    robot.logger.debug('in exitHandler, calling disconnect');
    client.Notifications.disconnect();
  }

  process.on('exit', exitHandler.bind(null, {
    cleanup: true
  }));
};

exports.default = main;
module.exports = main;
