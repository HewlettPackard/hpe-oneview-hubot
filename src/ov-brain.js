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

const logicalInterconnectsMap = new Map();

export default class OneViewBrain {
  constructor(client, robot, Lexer) {
    client.ServerHardware.getAllServerHardware().then((res) => {
      if (res && res.members) {
        for (var i = 0; i < res.members.length; i++) {
          const sh = res.members[i];
          Lexer.addNamedDevice(sh.name, sh.uri, 'name', sh.hyperlink);
          Lexer.addNamedDevice(sh.serialNumber, sh.uri, 'serialNumber', sh.hyperlink);
          robot.brain.set("__hpe__" + sh.uri, {uri:sh.uri, keys:{name:sh.name, serialNumber: sh.serialNumber, hyperlink : sh.hyperlink}});
          robot.logger.info('Found server hardware: (Name: ' + sh.name + ', Serial Number: ' + sh.serialNumber + ', URI: ' + sh.uri + ')');
        }
      }
    }).catch(error, robot);

    client.ServerProfiles.getAllServerProfiles().then((res) => {
      if (res && res.members) {
        for (var i = 0; i < res.members.length; i++) {
          const sp = res.members[i];
          Lexer.addNamedDevice(sp.name, sp.uri, 'name', sp.hyperlink);
          if (sp.serialNumberType === 'Virtual') {
            Lexer.addNamedDevice(sp.serialNumber, sp.uri, 'serialNumber', sp.hyperlink);
          }
          robot.logger.info('Found server profile: (Name: ' + sp.name + ', URI: ' + sp.uri + ')');
          //robot.brain.set("__hpe__" + sh.uri, {uri:sh.uri, keys:{name:sh.name, serialNumber: sh.serialNumber}});
        }
      }
    }).catch(error, robot);

    client.ServerProfileTemplates.getAllServerProfileTemplates().then((res) => {
      if (res && res.members) {
        for (var i = 0; i < res.members.length; i++) {
          const spt = res.members[i];
          Lexer.addNamedDevice(spt.name, spt.uri, 'name', spt.hyperlink);
          robot.logger.info('Found server profile template: (Name: ' + spt.name + ', URI: ' + spt.uri + ')');
          //robot.brain.set("__hpe__" + spt.uri, {uri:spt.uri, keys:{name:spt.name, serialNumber: spt.serialNumber, hyperlink: spt.hyperlink}});
        }
      }
    }).catch(error, robot);

    client.LogicalInterconnects.getAllLogicalInterconnects().then((res) => {
      if (res && res.members) {
        for (var i = 0; i < res.members.length; i++) {
          const lic = res.members[i];
          const ics = lic.interconnects;
          for (let ic of ics) {
            logicalInterconnectsMap.set(ic, lic.uri);
          }

        }
      }
    }).catch(error, robot);

    robot.on('__hpe__brain_notification__', function (message) {
      if (message) {
        if (message.changeType.toLowerCase() === 'created' && (message.resource.type.toLowerCase().includes('serverprofile') || message.resource.type.toLowerCase().includes('server-hardware'))) {
          Lexer.addNamedDevice(message.resource.name, message.resource.uri, 'name', message.resource.hyperlink);
          robot.logger.debug('Adding named device ' + message.resource.name + ' ' + message.resource.uri);
          if (message.resource.serialNumberType === 'Virtual' && !message.resource.type.toLowerCase().includes('template')) {
            Lexer.addNamedDevice(message.resource.serialNumber, message.resource.uri, 'serialNumber', message.resource.hyperlink);
            robot.logger.debug('Adding named device ' + message.resource.serialNumber + ' ' + message.resource.uri + ' ' + message.resource.hyperlink);
          }
        }

        if (message.changeType.toLowerCase() === 'updated' && message.resource.type.toLowerCase().includes('serverprofile')) {
          Lexer.updateNamedDevice(robot, message.resource.name, message.resource.uri, message.resource.hyperlink);
        }
      }
    });
  }
}

export function getLogicalInterconnectsMap() {
  return logicalInterconnectsMap;
}
