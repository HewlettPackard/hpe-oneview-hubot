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
const listener = require('../../src/listener/oneview');
const OneViewBrain = require('../../src/middleware/ov-brain');
const OVClient = require('../../src/oneview-sdk/ov-client');

const chai = require('chai');
const sinon = require('sinon');
const Bluebird = require('bluebird');

chai.should();
const assert = chai.assert;

describe('OVListener', () => {

  const robot = {
    name: 'bot',
    adapterName: 'shell',
    receive: function () {},
    on: function () {},
    listen: function () {},
    respond: function () {},
    listenerMiddleware: function () {},
    logger: {debug: function () {}, error: function () {}, info: function () {}},
    catchAll: function () {}
  };

  const oneviewConfig = {
    hosts: []
  };
  const client = new OVClient(oneviewConfig, robot);
  const brain = new OneViewBrain(client, robot, {});

  it('constructor', (done) => {
    let spy = sinon.spy(robot, 'respond');
    listener(robot, client, brain);

    assert(robot.respond.callCount === 31); // 31 listeners
    spy.restore();
    done();
  });

  it('on', (done) => {
    let spy = sinon.spy(robot, 'on');
    listener(robot, client, brain);

    assert(robot.on.callCount === 1);
    '__hpe__notification__'.should.equal(robot.on.args[0][0]);
    spy.restore();
    done();
  });

});
