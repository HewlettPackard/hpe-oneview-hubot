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
const Resource = require('./resource');
let ov_brain;

class ServerProfile extends Resource {

  constructor(oneViewResource, brain) {
    if (oneViewResource) {
      super(oneViewResource);
      this.name = oneViewResource.name;
      this.affinity = oneViewResource.affinity;
      this.serialNumber = oneViewResource.serialNumber;
      this.serverHardwareUri = oneViewResource.serverHardwareUri;
      this.serverHardwareHyperlink = oneViewResource.serverHardwareHyperlink;
      ov_brain = brain;
    }
  }

  buildPlainTextHipchatOutput(host) {
    let output = '';
    for (const field in this) {
      if (__isNonDisplayField__(field) || !this[field]) {
        continue;
      }
      output += '\t\u2022 ' + this.camelCaseToTitleCase(field) + ': ' + this[field] + '\n';
    }
    if (this.serverHardwareUri) {
      output += '\t\u2022 Server Hardware: ' + ov_brain.getDeviceNameAndHyperLink(host + this.serverHardwareUri).deviceName + '\n';
      output += '\t\u2022 Hardware Model: ' + ov_brain.getHardwareModel(host + this.serverHardwareUri) + '\n';
    }

    output += '\t\u2022 Status: ' +  this.status + '\n';
    return output;
  }

  buildPlainTextFlowdockOutput(host) {
    let output = '>';
    for (const field in this) {
      if (__isNonDisplayField__(field) || !this[field]) {
        continue;
      }
      output += '\t\u2022 **' + this.camelCaseToTitleCase(field) + '**: ' + this[field] + '\n';
    }
    if (this.serverHardwareUri) {
      output += '\t\u2022 **Server Hardware**: ' + ov_brain.getDeviceNameAndHyperLink(host + this.serverHardwareUri).deviceName + '\n';
      output += '\t\u2022 **Hardware Model**: ' + ov_brain.getHardwareModel(host + this.serverHardwareUri) + '\n';
    }

    output += '\t\u2022 **Status**: ' +  this.status + '\n';
    return output;
  }

  buildSlackFields(host) {
    let fields = [];
    for (const field in this) {
      if (__isNonDisplayField__(field) || !this[field]) {
        continue;
      }

      fields.push({
        title: this.camelCaseToTitleCase(field),
        short: true,
        value: this[field]
      });
    }
    if (this.serverHardwareUri) {
      fields.push({
        title: 'Server Hardware',
        short: true,
        value: '<' + this.serverHardwareHyperlink + '|' + ov_brain.getDeviceNameAndHyperLink(host + this.serverHardwareUri).deviceName + '>'
      });
      fields.push({
        title: 'Hardware Model',
        short: true,
        value: ov_brain.getHardwareModel(host + this.serverHardwareUri)
      });
    }

    return fields;
  }
}

function   __isNonDisplayField__(field){
  let nonDisplayFields = ['name', 'type', 'status', 'serverhardwareuri', 'serverhardwarehyperlink', 'hyperlink', 'state'];
  return nonDisplayFields.includes(field.toLowerCase());
}

module.exports = ServerProfile;
