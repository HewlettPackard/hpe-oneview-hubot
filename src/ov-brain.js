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
const url = require('url');

function error(err, robot) {
  robot.logger.error("Error initializing the OneView brain", err);
}

const logicalInterconnectsMap = new Map();
const resourcesMap = new Map();

export default class OneViewBrain {
  constructor(client, robot, Lexer) {

    client.ServerHardware.getAllServerHardware().then((res) => {
      if (res && res.members) {
        for (let member of res.members) {
          let uri = url.parse(member.hyperlink).hostname + member.uri;
          Lexer.addNamedDevice(member.name, uri,);
          Lexer.addNamedDevice(member.serialNumber, uri);
          resourcesMap.set(uri, {name: member.name, hyperlink: member.hyperlink, model: member.model});
          robot.logger.info('Found server hardware: (Name: ' + member.name + ', Serial Number: ' + member.serialNumber + ', URI: ' + uri + ')');
        }
      }
    }).catch(error, robot);

    client.ServerProfiles.getAllServerProfiles().then((res) => {
      if (res && res.members) {
        for (let member of res.members) {
          let uri = url.parse(member.hyperlink).hostname + '' + member.uri;
          Lexer.addNamedDevice(member.name, uri);
          if (member.serialNumberType === 'Virtual') {
            Lexer.addNamedDevice(member.serialNumber, uri);
          }
          resourcesMap.set(uri, {name: member.name, hyperlink: member.hyperlink, model: undefined});
          robot.logger.info('Found server profile: (Name: ' + member.name + ', URI: ' + uri + ')');
        }
      }
    }).catch(error, robot);

    client.ServerProfileTemplates.getAllServerProfileTemplates().then((res) => {
      if (res && res.members) {
        for (let member of res.members) {
          let uri = url.parse(member.hyperlink).hostname + member.uri;
          Lexer.addNamedDevice(member.name, uri);
          resourcesMap.set(uri, {name: member.name, hyperlink: member.hyperlink, model: undefined});
          robot.logger.info('Found server profile template: (Name: ' + member.name + ', URI: ' + uri + ')');
        }
      }
    }).catch(error, robot);

    client.LogicalInterconnects.getAllLogicalInterconnects().then((res) => {
      if (res && res.members) {
        for (let member of res.members) {
          let hostname = url.parse(member.hyperlink).hostname;
          let uri = hostname + '' + member.uri;
          const ics = member.interconnects;
          for (let ic of member.interconnects) {
            logicalInterconnectsMap.set(hostname +'' + ic, uri);
          }
        }
      }
    }).catch(error, robot);

    robot.on('__hpe__brain_notification__', ((message) => {
      if (message.changeType.toLowerCase() === 'created') {
        let host = url.parse('https://' + message.resourceUri).hostname;
        let enhance = new Enhance(host);
        let auth = client.getAuthToken(host);

        let model = message.resource.model;
        let uri = host + message.resource.uri;
        Lexer.addNamedDevice(message.resource.name, uri);
        resourcesMap.set(uri, {name: message.resource.name, hyperlink: enhance.transformHyperlinks(auth, message.resource).hyperlink, model: model});
        robot.logger.debug('Adding named device: ' + message.resource.name + ' with uri: ' + uri);

        if (message.resource.serialNumberType === 'Virtual' && !message.resource.type.toLowerCase().includes('template')) {
          let host = url.parse('https://' + message.resourceUri).hostname;
          let uri = host + message.resource.uri;
          Lexer.addNamedDevice(message.resource.serialNumber, uri);
          robot.logger.debug('Adding named device: ' + message.resource.name + ' with uri: ' + uri);
        }

      }
      if (message.changeType.toLowerCase() === 'updated' && message.resource.type.toLowerCase().includes('serverprofile')) {
        let host = url.parse('https://' + message.resourceUri).hostname;
        let enhance = new Enhance(host);
        let auth = client.getAuthToken(host);

        let model = message.resource.model;
        let uri = host + message.resource.uri;
        Lexer.updateNamedDevice(robot, message.resource.name, uri);
        this.__updateResourcesMap__(message, robot);
        robot.logger.debug('Updating named device: ' + message.resource.name + ' with uri: ' + uri);
      }
    }));
  }

  __updateResourcesMap__(message, robot) {
    let resource = resourcesMap.get(message.resource.uri);
    if (resource) {
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
