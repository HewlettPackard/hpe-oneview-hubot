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

export default class ServerProfileCompliancePreview extends Resource {

  constructor(oneViewResource) {
    if (oneViewResource) {
      super(oneViewResource);
      this.isOnlineUpdate = oneViewResource.isOnlineUpdate;
      this.automaticUpdates = oneViewResource.automaticUpdates;
      this.manualUpdates = oneViewResource.manualUpdates;
      this.status = 'Warning';
      this.pretext = 'The preview of manual and automatic updates required to make the server profile consistent with its template.';
      this.isOnlineUpdate = oneViewResource.isOnlineUpdate;
    }
  }

  buildSlackFields() {
    let fields = [];
    for (const field in this) {
      if (this.__isNonDisplayField__(field) || !this[field]) {
        continue;
      }
      let value = '';
      if (Array.isArray(this[field])) {
        value = this[field].join("\n");
      } else {
        value = this[field];
      }

      let displayField = this.camelCaseToTitleCase(field);

      fields.push({
        title: displayField,
        short: false,
        value: value
      });
    }
    return fields;
  }

  buildHipChatOutput() {
    let output = '';
    for (const field in this) {
      if (this.__isNonDisplayField__(field) || !this[field]) {
        continue;
      }
      let value = '';
      if (Array.isArray(this[field])) {
        value = this[field].join("\n");
      } else {
        value = this[field];
      }
      if (value) {
        output += field + ':\n' + value + '\n';
      }
    }
    return output;
  }

  __isNonDisplayField__(field){
    var nonDisplayFields = ['type', 'status', 'pretext', 'hyperlink'];
    return nonDisplayFields.includes(field.toLowerCase());
  }
}
