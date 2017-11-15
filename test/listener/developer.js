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
const DeveloperListener = require('../../src/listener/developer');
const OneViewBrain = require('../../src/middleware/ov-brain');
const OVClient = require('../../src/oneview-sdk/ov-client');
const ResourceTransforms = require('../../src/listener/utils/resource-transforms');
const NamedRegExp = require('../../src/listener/named-regexp');

const chai = require('chai');
const sinon = require('sinon');
const Bluebird = require('bluebird');

chai.should();
const assert = chai.assert;

describe('DeveloperListener', () => {

  const robot = {
    name: 'bot',
    adapterName: 'shell',
    receive: function () {},
    on: function () { },
    listen: function (matcher, options) {listeners.push(matcher, options)},
    respond: function () {},
    listenerMiddleware: function() {},
    logger: {debug: function () {}, error: function () {}, info: function () {}}
  };

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

  const client = new OVClient(oneviewConfig, robot);
  const transform = new ResourceTransforms(robot, {});

  it('constructor', (done) => {
    let spy = sinon.spy(robot, "respond");
    const developerListener = new DeveloperListener(robot, client, transform);

    let rgx0 = new NamedRegExp(developerListener.LIST_RAW);
    let rgx1 = new NamedRegExp(developerListener.LIST_CLEAN);

    let constructorArgs = robot.respond.getCalls();

    rgx0.should.deep.equal(constructorArgs[0].args[0]);
    assert(typeof constructorArgs[0].args[2] === 'function');
    'bound ListRaw'.should.equal(constructorArgs[0].args[2].name);
    assert.isFalse(constructorArgs[0].args[2].hasOwnProperty('prototype'));

    rgx1.should.deep.equal(constructorArgs[1].args[0]);
    assert(typeof constructorArgs[1].args[2] === 'function');
    'bound ListClean'.should.equal(constructorArgs[1].args[2].name);
    assert.isFalse(constructorArgs[1].args[2].hasOwnProperty('prototype'));

    spy.restore();
    done();
  });

  it('test regexps', (done) => {
    const developerListener = new DeveloperListener(robot, client, transform);

    let rgx0 = new NamedRegExp(developerListener.LIST_RAW);
    let rgx1 = new NamedRegExp(developerListener.LIST_CLEAN);

    assert.isTrue(rgx0.test('@bot show /rest/server-hardware/1231asdf json.'));
    assert.isTrue(rgx1.test('@bot show /rest/server-hardware/1231asdf clean.'));

    done();
  });

  it('list raw', (done) => {
    let stub = sinon.stub(client.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve({}));

    const developerListener = new DeveloperListener(robot, client, transform);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot show /rest/server-hardware/1231asdf json.'}},
      count: 1,
      host: 'localhost',
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    developerListener.ListRaw(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      '{}.'.should.equal(msg.send.args[0][0]);
      spy.restore();
      stub.restore();
      done();
    }, 10);
  });

  it('list clean', (done) => {
    let stub = sinon.stub(client.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve({}));

    const developerListener = new DeveloperListener(robot, client, transform);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot show /rest/server-hardware/1231asdf clean.'}},
      count: 1,
      host: 'localhost',
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    developerListener.ListClean(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      '{}'.should.equal(msg.send.args[0][0]);
      spy.restore();
      stub.restore();
      done();
    }, 10);
  });

});
