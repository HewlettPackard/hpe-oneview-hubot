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

function error(err, robot) {
  robot.logger.error("Error initializing the OneView brain", err);
}

export default class OneViewBrain {
  constructor(client, robot, Lexer) {

    client.ServerHardware.getAllServerHardware().then((res) => {
      if (res && res.members) {
        for (var i = 0; i < res.members.length; i++) {
          const sh = res.members[i];
          Lexer.addNamedDevice(sh.name, sh.uri, 'name');
          Lexer.addNamedDevice(sh.serialNumber, sh.uri, 'serialNumber');
          robot.brain.set("__hpe__" + sh.uri, {uri:sh.uri, keys:{name:sh.name, serialNumber: sh.serialNumber}});
        }
      }
    }).catch(error, robot);

    client.ServerProfiles.getAllServerProfiles().then((res) => {
      if (res && res.members) {
        for (var i = 0; i < res.members.length; i++) {
          const sp = res.members[i];
          Lexer.addNamedDevice(sp.name, sp.uri, 'name');
          if (sp.serialNumberType === 'Virtual') {
            Lexer.addNamedDevice(sp.serialNumber, sp.uri, 'serialNumber');
          }
          //robot.brain.set("__hpe__" + sh.uri, {uri:sh.uri, keys:{name:sh.name, serialNumber: sh.serialNumber}});
        }
      }
    }).catch(error, robot);

    client.ServerProfileTemplates.getAllServerProfileTemplates().then((res) => {
      if (res && res.members) {
        for (var i = 0; i < res.members.length; i++) {
          const spt = res.members[i];
          Lexer.addNamedDevice(spt.name, spt.uri, 'name');
          //robot.brain.set("__hpe__" + sh.uri, {uri:sh.uri, keys:{name:sh.name, serialNumber: sh.serialNumber}});
        }
      }
    }).catch(error, robot);

    robot.on('__hpe__brain_notification__', function (message) {
      if (message) {
        if (message.changeType.toLowerCase() === 'created' && (message.resource.type.toLowerCase().includes('serverprofile') || message.resource.type.toLowerCase().includes('server-hardware'))) {
          Lexer.addNamedDevice(message.resource.name, message.resource.uri, 'name');
          robot.logger.debug('Adding named device ' + message.resource.name + ' ' + message.resource.uri);
          if (message.resource.serialNumberType === 'Virtual' && !message.resource.type.toLowerCase().includes('template')) {
            Lexer.addNamedDevice(message.resource.serialNumber, message.resource.uri, 'serialNumber');
            robot.logger.debug('Adding named device ' + message.resource.serialNumber + ' ' + message.resource.uri);
          }
        }

        if (message.changeType.toLowerCase() === 'updated' && message.resource.type.toLowerCase().includes('serverprofile')) {
          Lexer.updateNamedDevice(robot, message.resource.name, message.resource.uri);
        }
      }
    });

    //Introduce robot after the brain has been built
    robot.messageRoom('#' + client.notificationsRoom, "Hello, I'm " + robot.name + "!  How can I assist you? Type '@" + robot.name + " help' to learn what I can do.");
  }
}
