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
const ResourceTransforms = require('../../../src/listener/utils/resource-transforms');
const OneViewBrain = require('../../../src/middleware/ov-brain');
const OVClient = require('../../../src/oneview-sdk/ov-client');

const sinon = require('sinon');
const chai = require('chai');

chai.should();
const assert = chai.assert;

describe('ResourceTransforms', () => {

  const robot = {
    name: 'bot',
    adapterName: 'shell',
    receive: function () {},
    on: function () {},
    listen: function () {},
    respond: function () {},
    messageRoom: function () {},
    listenerMiddleware: function() {},
    logger: {debug: function () {}, error: function () {}, info: function () {}}
  };

  const oneviewConfig = {
    hosts: []
  };
  const oVClient = new OVClient(oneviewConfig, robot);
  const brain = new OneViewBrain(oVClient, robot, {});

  afterEach(() => {
    robot.adapterName = 'shell';
  });

  it('slack', () => {
    robot.adapterName = 'slack';
    let resourceTransforms = new ResourceTransforms(robot, brain);
    let text = 'Hello\nWorld!';
    let result = resourceTransforms.list(text);
    '  \u2022 Hello.\n  \u2022 World!.'.should.equal(result);
  });

  it('hipchat', () => {
    robot.adapterName = 'hipchat';
    let resourceTransforms = new ResourceTransforms(robot, brain);
    let text = 'Hello\nWorld!';
    let result = resourceTransforms.list(text);
    '  - Hello.\n  - World!.'.should.equal(result);
  });

  it('list', () => {
    let resourceTransforms = new ResourceTransforms(robot, brain);
    let text = 'Hello\nWorld!';
    let result = resourceTransforms.list(text);
    '  - Hello.\n  - World!.'.should.equal(result);
  });

  it('messageRoom', () => {
    let spy = sinon.spy(robot, "messageRoom");

    let resourceTransforms = new ResourceTransforms(robot, brain);
    let text = 'Hello World!';
    resourceTransforms.messageRoom('slack-channel', {}, text);

    assert(robot.messageRoom.callCount === 2);
    ['slack-channel', 'Hello World!.'].should.deep.equal(robot.messageRoom.args[0]);
    ['slack-channel', '{}'].should.deep.equal(robot.messageRoom.args[1])

    spy.restore();
  });

  it('messageRoom resource', () => {
    let spy = sinon.spy(robot, "messageRoom");

    let resourceTransforms = new ResourceTransforms(robot, brain);
    let text = 'Hello World!';
    resourceTransforms.messageRoom('slack-channel', 'resource', text);

    assert(robot.messageRoom.callCount === 1);
    ['slack-channel', 'resource.'].should.deep.equal(robot.messageRoom.args[0]);

    spy.restore();
  });

  it('makePlural server profile', () => {
    let resourceTransforms = new ResourceTransforms(robot, brain);
    let word = 'server profile';
    let result = resourceTransforms.makePlural(1 , word);
    '1 server profile'.should.equal(result);
  });

  it('makePlural server hardware', () => {
    let resourceTransforms = new ResourceTransforms(robot, brain);
    let word = 'server hardware';
    let result = resourceTransforms.makePlural(2 , word);
    '2 server hardwares'.should.equal(result);
  });

  it('makePlural vowel', () => {
    let resourceTransforms = new ResourceTransforms(robot, brain);
    let word = 'power delivery';
    let result = resourceTransforms.makePlural(2 , word);
    '2 power deliveries'.should.equal(result);
  });

  it('makePlural no count', () => {
    let resourceTransforms = new ResourceTransforms(robot, brain);
    let word = 'server profile';
    let result = resourceTransforms.makePlural(0 , word);
    'no server profiles'.should.equal(result);
  });

  it('isAre 1', () => {
    let resourceTransforms = new ResourceTransforms(robot, brain);
    let word = 'server profile';
    let result = resourceTransforms.isAre(1 , word);
    'is 1 server profile'.should.equal(result);
  });

  it('isAre 2', () => {
    let resourceTransforms = new ResourceTransforms(robot, brain);
    let word = 'server profile';
    let result = resourceTransforms.isAre(2 , word);
    'are 2 server profiles'.should.equal(result);
  });

  it('error', () => {
    let resourceTransforms = new ResourceTransforms(robot, brain);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot show last fiv alerts.'}},
      count: 1,
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");
    let error = {};

    resourceTransforms.error(msg, error);

    assert(msg.send.callCount === 1);
    spy.restore();
  });

});
