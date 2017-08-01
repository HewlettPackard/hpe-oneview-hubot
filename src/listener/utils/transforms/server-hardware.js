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

import Resource from './resource';
import { getDeviceNameAndHyperLink } from '../../../ov-brain';

export default class ServerHardware extends Resource {

  constructor(oneViewResource) {
    if (oneViewResource) {
      super(oneViewResource);
      this.name = oneViewResource.name;
      this.model = oneViewResource.model;
      this.powerState = oneViewResource.powerState;
      this.serverProfileUri = oneViewResource.serverProfileUri;
      this.serverProfileHyperlink = oneViewResource.serverProfileHyperlink;
    }
  }

  buildSlackFields(host) {
    let fields = [];
    let hasProfile = false;
    for (const field in this) {
      if (this.__isNonDisplayField__(field) || !this[field]) {
        continue;
      }

      fields.push({
        title: this.camelCaseToTitleCase(field),
        short: true,
        value: this[field]
      });
    }
    if (this.serverProfileUri) {
      fields.push({
        title: 'Profile',
        short: true,
        value: '<' + this.serverProfileHyperlink + '|' + getDeviceNameAndHyperLink(host + '' + this.serverProfileUri).deviceName + '>'
      });
      hasProfile = true;
    }
    if (!hasProfile) {
      fields.push({
        title: 'Profile',
        short: true,
        value: 'Available for deployment'
      });
    }
    return fields;
  }

  buildHipChatOutput(host) {
    let output = '';
    let hasProfile = false;
    for (const field in this) {
      if (this.__isNonDisplayField__(field) || !this[field]) {
        continue;
      }
      output += '\t\u2022 ' + this.camelCaseToTitleCase(field) + ': ' + this[field] + '\n';
    }
    if (this.serverProfileUri) {
      output += '\t\u2022 Profile: ' +  getDeviceNameAndHyperLink(host + '' + this.serverProfileUri).deviceName + '\n';
      hasProfile = true;
    }
    if (!hasProfile) {
      output += '\t\u2022 Profile: Available for deployment\n';
    }
    //Add status to output only for HipChat
    output += '\t\u2022 Status: ' +  this.status + '\n';

    return output;
  }

  __isNonDisplayField__(field){
    var nonDisplayFields = ['name', 'type', 'status', 'serverprofileuri', 'serverprofilehyperlink', 'hyperlink'];
    return nonDisplayFields.includes(field.toLowerCase());
  }
}
