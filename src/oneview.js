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

import nlp, { Lexer } from './middleware/nlp-middleware';
import ovListener from './listener/ov-listener';
import ovClient from './oneview-sdk/ov-client';
import ovBrain from './ov-brain';
import configLoader from './config-loader';

const main = (robot) => {
  // load OneView configuration data from external file
  let oneview_config = configLoader(robot);

  robot.logger.info('Initializing NLP');
  nlp(robot);

  robot.logger.info('Initializing OneView');
  const client = new ovClient(oneview_config.applianceIp,
    oneview_config.apiVersion, oneview_config.pollingInterval,
    oneview_config.readOnly, oneview_config.notificationsRoom,
    robot);
  client.login({'userName': oneview_config.userName,
      'password': oneview_config.password}, false).then(() => {
    robot.logger.info('Logged into OV appliance.')
    const brain = new ovBrain(client, robot, Lexer);

    ovListener(robot, client);
  }); //end login

  //TODO: Bug #22 Not working.  Need to perform an aysnc shutdown from the SCMB
  function exitHandler(options, err) {
    robot.logger.debug('in exitHandler, calling disconnect');
    client.Notifications.disconnect();
  }

  process.on('exit', exitHandler.bind(null,{cleanup:true}));
}

export default main;
module.exports = main;
