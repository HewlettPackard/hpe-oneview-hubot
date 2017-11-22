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
const DefaultListener = require('../../src/listener/default');
const OneViewBrain = require('../../src/middleware/ov-brain');
const OVClient = require('../../src/oneview-sdk/ov-client');
const ResourceTransforms = require('../../src/listener/utils/resource-transforms');

const chai = require('chai');
const sinon = require('sinon');
const Bluebird = require('bluebird');

const util = require('util')

chai.should();
const assert = chai.assert;

describe('DefaultListener', () => {

  const robot = {name: 'bot', adapterName: 'shell', catchAll: function () {}, on: function () { }, listen: function () {}, respond: function () {}, listenerMiddleware: function() {}, logger: {debug: function () {}, error: function () {}, info: function () {}}};

  const oneviewConfig = {
    hosts: []
  };
  const oVClient = new OVClient(oneviewConfig, robot);
  const brain = new OneViewBrain(oVClient, robot, {});
  const transform = new ResourceTransforms(robot, brain);

  it('constructor', (done) => {
    sinon.spy(robot, "catchAll");
    defaultListener = new DefaultListener(robot, transform);

    let args = robot.catchAll.getCalls()[0].args;
    assert(typeof args[0] === 'function');
    assert(args[0].name === 'bound Fallback');
    assert.isFalse(args[0].hasOwnProperty('prototype')); //bound functions do not have a prototype property

    done();
  });

  it('fallback', (done) => {

    defaultListener = new DefaultListener(robot, transform);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot show dashboard.'}},
      count: 1,
      send: function () {},
      message: {user: {name: 'name'}}
    };
    sinon.spy(msg, "send");

    defaultListener.Fallback(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "I'm sorry, I didn't understand that. Try typing '@bot help' to see a list of my capabilities.".should.equal(msg.send.args[0][0]);
      done();
    });
  });

});
