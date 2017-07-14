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
import Enhance from './oneview-sdk/utils/enhance';

function error(err, robot) {
  robot.logger.error("Error initializing the OneView brain", err);
}

const logicalInterconnectsMap = new Map();
const resourcesMap = new Map();

export default class OneViewBrain {
  constructor(client, robot, Lexer) {

    this.auth = client.getAuthToken();
    this.enhance = new Enhance(client.host);

    client.ServerHardware.getAllServerHardware().then((res) => {
      if (res && res.members) {
        for (var i = 0; i < res.members.length; i++) {
          const sh = res.members[i];
          Lexer.addNamedDevice(sh.name, sh.uri,);
          Lexer.addNamedDevice(sh.serialNumber, sh.uri);
          resourcesMap.set(sh.uri, {name: sh.name, hyperlink: sh.hyperlink, model: sh.model});
          robot.logger.info('Found server hardware: (Name: ' + sh.name + ', Serial Number: ' + sh.serialNumber + ', URI: ' + sh.uri + ')');
        }
      }
    }).catch(error, robot);

    client.ServerProfiles.getAllServerProfiles().then((res) => {
      if (res && res.members) {
        for (var i = 0; i < res.members.length; i++) {
          const sp = res.members[i];
          Lexer.addNamedDevice(sp.name, sp.uri);
          if (sp.serialNumberType === 'Virtual') {
            Lexer.addNamedDevice(sp.serialNumber, sp.uri);
          }
          resourcesMap.set(sp.uri, {name: sp.name, hyperlink: sp.hyperlink, model: undefined});
          robot.logger.info('Found server profile: (Name: ' + sp.name + ', URI: ' + sp.uri + ')');
        }
      }
    }).catch(error, robot);

    client.ServerProfileTemplates.getAllServerProfileTemplates().then((res) => {
      if (res && res.members) {
        for (var i = 0; i < res.members.length; i++) {
          const spt = res.members[i];
          Lexer.addNamedDevice(spt.name, spt.uri);
          resourcesMap.set(spt.uri, {name: spt.name, hyperlink: spt.hyperlink, model: undefined});
          robot.logger.info('Found server profile template: (Name: ' + spt.name + ', URI: ' + spt.uri + ')');
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

    robot.on('__hpe__brain_notification__', ((message) => {
      if (message.changeType.toLowerCase() === 'created') {
        if (message.resource.type.toLowerCase().includes('serverprofile')) {
          Lexer.addNamedDevice(message.resource.name, message.resource.uri);
          resourcesMap.set(message.resource.uri, {name: message.resource.name, hyperlink: this.enhance.transformHyperlinks(this.auth, message).resourceHyperlink, model: undefined});
          robot.logger.debug('Adding named device ' + message.resource.name + ' ' + message.resource.uri);
        }
        if (message.resource.type.toLowerCase().includes('server-hardware')) {
          Lexer.addNamedDevice(message.resource.name, message.resource.uri,);
          resourcesMap.set(message.resource.uri, {name: message.resource.name, hyperlink: this.enhance.transformHyperlinks(this.auth, message).resourceHyperlink, model: message.resource.model});
          robot.logger.debug('Adding named device ' + message.resource.name + ' ' + message.resource.uri);
        }
        if (message.resource.serialNumberType === 'Virtual' && !message.resource.type.toLowerCase().includes('template')) {
          Lexer.addNamedDevice(message.resource.serialNumber, message.resource.uri);
          robot.logger.debug('Adding named device ' + message.resource.serialNumber + ' ' + message.resource.uri);
        }
      }
      if (message.changeType.toLowerCase() === 'updated' && message.resource.type.toLowerCase().includes('serverprofile')) {
        Lexer.updateNamedDevice(robot, message.resource.name, message.resource.uri);
        this.__updateResourcesMap__(message, robot);
      }
    }));
  }

  __updateResourcesMap__(message, robot) {
    let resource = resourcesMap.get(message.resource.uri);
    if (resource) {
      robot.logger.debug('Updating resource name for ' + resource.name + ' to ' + message.resource.name);
      resource.name = message.resource.name;
    }
  }
}

export function getLogicalInterconnectsMap() {
  return logicalInterconnectsMap;
}

export function getDeviceNameAndHyperLink(uri) {
  let deviceName = '', hyperlink = '';
  let resource = resourcesMap.get(uri);
  if (resource) {
    deviceName = resource.name;
    hyperlink = resource.hyperlink;
  }
  return {
    deviceName : deviceName,
    hyperlink : hyperlink
  };
}

export function getHardwareModel(uri) {
  let model = '';
  let resource = resourcesMap.get(uri);
  if (resource) {
    model = resource.model;
  }
  return model;
}
