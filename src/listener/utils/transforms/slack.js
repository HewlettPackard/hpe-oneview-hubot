/*
(c) Copyright 2016 Hewlett Packard Enterprise Development LP

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

const util = require('util')

function AttachmentTitle(resource) {
  if (resource.type) {
    if (resource.type.startsWith('AlertResource')) {
      if (resource.alertTypeID && resource.alertTypeID.startsWith("Trap")) {
        return "Trap: " + resource.description;
      }
      return resource.description;
    }

    if (resource.type.startsWith('server-hardware')) {
      return 'Server Hardware: ' + resource.name
    }

    if (resource.type.startsWith('ServerProfileTemplate')) {
      return 'Profile Template: ' + resource.name
    }

    if (resource.type.startsWith('ServerProfile')) {
      return 'Profile: ' + resource.name
    }
  }

  //Fall-back as clean as we can, resort to URI as all objects are guaranteed to have that
  return resource.name || resource.uri;
}

function ToAttachment(resource) {
  let color = '';
  switch (resource.type.startsWith('AlertResource') ? resource.severity : resource.status) {
    case 'OK':
      color = '#01A982'//OneView Green Status
      break;
    case 'Warning':
      color = '#FFD042'//OneView Yellow Status
      break;
    case 'Critical':
      color = '#FF454F'//OneView Red Status
      break;
    case 'Disabled':
    case 'Unknown':
    default:
      color = '#CCCCCC'//OneView Grey Status
      break;
  }

  let fields = [];
  if (resource.associatedResource && resource.associatedResource.resourceName) {
    fields.push({
      title: 'Resource',
      short: true,
      value: '<' + resource.associatedResource.resourceHyperlink + '|' + resource.associatedResource.resourceName + '>'
    });
  }

/*
  if (resource.serialNumber) {
    fields.push({
      title: 'Serial Number',
      short: true,
      value: resource.serialNumber
    });
  }*/

  if (resource.type.startsWith('server-hardware')) {
    if (resource.serverProfileUri) {
      fields.push({
        title: 'Profile',
        short: true,
        value: '<' + resource.serverProfileHyperlink + '|' + resource.serverProfileUri.replace(/.*\/(.*)$/, '$1') + '>'
      });
    } else {
      fields.push({
        title: 'Profile',
        short: true,
        value: 'Available for deployment'
      });
    }
  }

  if (resource.powerState) {
    fields.push({
      title: 'Power',
      short: true,
      value: resource.powerState
    });
  }
/*
  if (resource.uuid) {
    fields.push({
      title: 'UUID',
      short: false,
      value: resource.uuid
    });
  }*/

  // add description here for SCMs
  if (resource.type.startsWith('AlertResource') && resource.description) {
    fields.push({
      title: 'Description',
      short: false,
      value: resource.description
    });
  }

  return {
    title: AttachmentTitle(resource),
    title_link: resource.hyperlink,
    color: color,
    //fallback: TODO: Describe object as text,
    fields: fields,
    text: '',
    pretext: '',
  };
}

function attachments(resource) {
  if (Array.isArray(resource)) {
    return resource.map(ToAttachment);
  } else if (resource.members) {
    return resource.members.map(ToAttachment);
  } else {
    return [ToAttachment(resource)];
  }
  return [];
}

export default class SlackTransform {
  hyperlink(uri, name) {
    return '<' + uri + '|' + name + '>';
  }

  list(lines) {
    for (var i = 0; i < lines.length; i++) {
      lines[i] = '  • ' + lines[i];
    }
    return lines;
  }

  text(msg, text) {
    msg.send({text:text});
  }

  send(msg, resource, text) {
    if (!resource) {
      throw "Resource was null";
    }

    const message = {
      attachments: attachments(resource)
    };

    if (text) {
      message.text = text;
    }

    msg.send(message);
  }

  messageRoom(robot, room, resource, text) {
    const message = {
      attachments: attachments(resource)
    };

    if (text) {
      message.text = text;
    }

    robot.messageRoom(room, message);
  }
}
