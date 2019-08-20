/*
(c) Copyright 2016-2019 Hewlett Packard Enterprise Development LP

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
const OVClient = require('../../src/oneview-sdk/ov-client');
const Notifications = require('../../src/oneview-sdk/notifications');
const MessageEmitter = require('../../src/oneview-sdk/notifications');
const chai = require('chai');
const sinon = require('sinon');
const assert = chai.assert;
const amqp = require('amqp');
const Bluebird = require('bluebird');

chai.should();

const robot = {adapterName: 'shell', on: function () { }, logger: {debug: function () {}, error: function () {}, info: function () {}}};

describe('Notifications', () => {

  it('constructor', () => {
    client = new OVClient({hosts: []}, robot);
    let notifications = new Notifications(client, robot);
    assert(notifications instanceof Notifications);
  });

  it('connect ', (done) => {
    const oneviewConfig = {
      hosts: [{
          applianceIp: "localhost",
          apiVersion: 300,
          userName: "admin",
          password: "password",
          doProxy: false,
          proxyHost: "0.0.0.0",
          proxyPort: 0
        }]
    };

    client = new OVClient(oneviewConfig, robot);

    let connection = {
      on: function () {}
    };
    let spy = sinon.spy(connection, "on");

    let stub1 = sinon.stub(client.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve({}));
    let stub2 = sinon.stub(amqp, 'createConnection').returns(connection);

    let notifications = new Notifications(client, robot);
    assert(notifications instanceof Notifications);

    notifications.connect('localhost');

    setTimeout(() => {
      assert(connection.on.callCount === 2);
      spy.restore();
      stub1.restore();
      stub2.restore();
      done();
    }, 10);
  });

});

describe('MessageEmitter', () => {

  it('constructor', () => {
    client = new OVClient({hosts: []}, robot);
    let emitter = new MessageEmitter(robot, 'queue', 'localhost');
    assert(emitter instanceof MessageEmitter);
  });

});
