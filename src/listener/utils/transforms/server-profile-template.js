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

class ServerProfileTemplate extends Resource {

  constructor(oneViewResource) {
    if (oneViewResource) {
      super(oneViewResource);
      this.name = oneViewResource.name;
      this.description = oneViewResource.description;
    }
  }

  buildPlainTextHipchatOutput() {
    let output = '';
    for (const field in this) {
      if (__isNonDisplayField__(field) || !this[field]) {
        continue;
      }
      output += '\t\u2022 ' + this.camelCaseToTitleCase(field) + ': ' + this[field] + '\n';
    }
    return output;
  }

  buildPlainTextFlowdockOutput() {
    let output = '>';
    for (const field in this) {
      if (__isNonDisplayField__(field) || !this[field]) {
        continue;
      }
      output += '\t\u2022 **' + this.camelCaseToTitleCase(field) + '**: ' + this[field] + '\n';
    }
    return output;
  }

  buildSlackFields() {
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
    return fields;
  }
}

function   __isNonDisplayField__(field){
  let nonDisplayFields = ['name', 'type', 'status', 'hyperlink'];
  return nonDisplayFields.includes(field.toLowerCase());
}

module.exports = ServerProfileTemplate;
