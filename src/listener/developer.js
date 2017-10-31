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
const Listener = require('./base-listener');

class DeveloperListener extends Listener {
  constructor(robot, client, transform) {
    super(robot, client, transform);
    this.title = "Developer";
    this.capabilities = [];
    this.respond(/(?:get|list|show) \/rest\/(:<category>[a-zA-Z0-9_-]*?)\/(:<id>[a-zA-Z0-9_-]*?) json\.$/i, this.ListRaw.bind(this)); //Developer end point (echoes raw JSON)
    this.capabilities.push(this.BULLET + "List /rest/category/id as json (e.g. list /rest/enclosure/12325dd7).");
    this.respond(/(?:get|list|show) \/rest\/(:<category>[a-zA-Z0-9_-]*?)\/(:<id>[a-zA-Z0-9_-]*?) clean\.$/i, this.ListClean.bind(this)); //Developer end point (echoes a clean resource)
    this.capabilities.push(this.BULLET + "List /rest/category/id as clean resource (e.g. list rest/enclosure/12325dd7).");
  }

  ListRaw(msg) {
    this.client.ClientConnection.get('/rest/' + msg.category + '/' + msg.id).then((res) => {
      return this.transform.text(msg, JSON.stringify(res, null, '  '));
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  ListClean(msg) {
    this.client.ClientConnection.get('/rest/' +  msg.category + '/' + msg.id).then((res) => {
      return this.transform.send(msg, res.members || res);
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }
}

module.exports = DeveloperListener;
