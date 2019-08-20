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
const BotListener = require('../../src/listener/bot');
const OneViewBrain = require('../../src/middleware/ov-brain');
const OVClient = require('../../src/oneview-sdk/ov-client');
const ResourceTransforms = require('../../src/listener/utils/resource-transforms');
const ServerHardwareListener = require('../../src/listener/server-hardware');
const DeveloperListener = require('../../src/listener/developer');
const ServerProfilesListener = require('../../src/listener/server-profiles');
const ServerProfileTemplateListener = require('../../src/listener/server-profile-templates');
const NamedRegExp = require('../../src/listener/named-regexp');

const chai = require('chai');
const sinon = require('sinon');
const Bluebird = require('bluebird');

chai.should();
const assert = chai.assert;

describe('BotListener', () => {

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

  // capture dialog liseners
  let listeners = [];

  const oneviewConfig = {
    hosts: []
  };
  const client = new OVClient(oneviewConfig, robot);
  const brain = new OneViewBrain(client, robot, {});
  const transform = new ResourceTransforms(robot, brain);

  const dev = new DeveloperListener(robot, client, transform);
  const sh = new ServerHardwareListener(robot, client, transform, brain);
  const sp = new ServerProfilesListener(robot, client, transform, sh, brain);
  const spt = new ServerProfileTemplateListener(robot, client, transform, sh, sp, brain);

  it('constructor', (done) => {
    let spy = sinon.spy(robot, "respond");
    const botListener = new BotListener(robot, client, transform, dev, sh, sp, spt);

    let rgx0 = new NamedRegExp(botListener.LIST_HELP);
    let rgx1 = new NamedRegExp(botListener.LIST_ACTIONS);
    let rgx2 = new NamedRegExp(botListener.LIST_ACTION);

    let constructorArgs = robot.respond.getCalls();

    rgx0.should.deep.equal(constructorArgs[0].args[0]);
    assert(typeof constructorArgs[0].args[2] === 'function');
    'bound ListActions'.should.equal(constructorArgs[0].args[2].name);
    assert.isFalse(constructorArgs[0].args[2].hasOwnProperty('prototype'));

    rgx1.should.deep.equal(constructorArgs[1].args[0]);
    assert(typeof constructorArgs[1].args[2] === 'function');
    'bound ListActions'.should.equal(constructorArgs[1].args[2].name);
    assert.isFalse(constructorArgs[1].args[2].hasOwnProperty('prototype'));

    rgx2.should.deep.equal(constructorArgs[2].args[0]);
    assert(typeof constructorArgs[2].args[2] === 'function');
    'bound ListActionsFor'.should.equal(constructorArgs[2].args[2].name);
    assert.isFalse(constructorArgs[2].args[2].hasOwnProperty('prototype'));

    spy.restore();
    done();
  });

  it('test regexps', (done) => {
    const botListener = new BotListener(robot, client, transform, dev, sh, sp, spt);

    let rgx0 = new NamedRegExp(botListener.LIST_HELP);
    let rgx1 = new NamedRegExp(botListener.LIST_ACTIONS);
    let rgx2 = new NamedRegExp(botListener.LIST_ACTION);

    assert.isTrue(rgx0.test('@bot help.'));
    assert.isTrue(rgx1.test('@bot what can you do.'));
    assert.isTrue(rgx1.test('@bot what can you do for me.'));
    assert.isTrue(rgx2.test('@bot sp help.'));
    assert.isTrue(rgx2.test('@bot sh help.'));
    assert.isTrue(rgx2.test('@bot spt help.'));

    done();
  });

  it('help', (done) => {
    const botListener = new BotListener(robot, client, transform, dev, sh, sp, spt);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot help.'}},
      count: 1,
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    botListener.ListActions(msg);

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 1);
'What can I help you with today? Here\'s just a few things I can do:\n\t\u2022 \
Server Profile help (e.g. sp help).\n\t\u2022 Server Profile Template help \
(e.g. spt help).\n\t\u2022 Server hardware help (e.g. sh help).\n.'.should.equal(msg.send.args[0][0]);
      spy.restore();
      done();
    }, 100);
  });

  it('sh help', (done) => {
    const botListener = new BotListener(robot, client, transform, dev, sh, sp, spt);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot sh help.'}},
      count: 1,
      send: function () {},
      text: 'server hardware'
    };
    let spy = sinon.spy(msg, "send");

    botListener.ListActionsFor(msg);

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 1);
'Server hardware commands:\n\t\u2022 Power on/off a specific (server) hardware (e.g. turn on Encl1, bay 1).\
\n\t\u2022 List all (server) hardware (e.g. list all hardware).\
\n\t\u2022 List server hardware utilization (e.g. list Encl1, bay 1 utilization).\
\n\t\u2022 List server hardware utilization (e.g. list Encl1, bay 1 utilization).\
\n\t\u2022 List server hardware by name (e.g. list Encl1, bay 1).\
\n\t\u2022 List all critical/warning/ok/disabled (server) hardware (e.g. list all critical hardware).\
\n\t\u2022 List all powered on/off (server) hardware.\
\n\t\u2022 List all (server) hardware by UUID light state (e.g. list all hardware with UUID light on).\
\n\t\u2022 List (server) hardware by asset tag (e.g. show hardware with asset tag cluster1).'.should.equal(msg.send.args[0][0]);
      spy.restore();
      done();
    }, 100);
  });

  it('sp help', (done) => {
    const botListener = new BotListener(robot, client, transform, dev, sh, sp, spt);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot sp help.'}},
      count: 1,
      send: function () {},
      text: 'server profiles'
    };
    let spy = sinon.spy(msg, "send");

    botListener.ListActionsFor(msg);

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 1);
'Server Profile commands:\n\t\u2022 Show all (server) profiles (e.g. show all profiles).\
\n\t\u2022 Show a specific (server) profile (e.g. show hadoop cluster).\
\n\t\u2022 Show a specific (server) profile compliance (e.g. show hadoop cluster compliance).\
\n\t\u2022 Make/update a specific (server) profile compliance (e.g. make hadoop cluster compliant).\
\n\t\u2022 Power on/off a specific (server) profile (e.g. turn on hadoop cluster).\
\n\t\u2022 List all critical/warning/ok/disabled (server) profiles (e.g. list all critical profiles).'.should.equal(msg.send.args[0][0]);
      spy.restore();
      done();
    }, 100);
  });

  it('spt help', (done) => {
    const botListener = new BotListener(robot, client, transform, dev, sh, sp, spt);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot spt help.'}},
      count: 1,
      send: function () {},
      text: 'profile templates'
    };
    let spy = sinon.spy(msg, "send");

    botListener.ListActionsFor(msg);

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 1);
'Server Profile Template commands:\n\t\u2022 Show all (server) profile templates (e.g. show all templates).\
\n\t\u2022 Show available targets for a server profile template (e.g. show available targets for docker swarm).\
\n\t\u2022 Show profile(s) using a server profile template (e.g. show profiles using docker swarm).\
\n\t\u2022 Create a profile using a server profile template (e.g. create a profile from docker swarm).\
\n\t\u2022 Flex/grow a server profile template by a given amount (e.g. grow docker swarm by 4 profiles).\
\n\t\u2022 Remove a number of profiles/servers from a profile template (e.g. remove 2 profiles from docker swarm).\
\n\t\u2022 Fix compliance for a profile template (e.g. fix compliance for docker swarm).'.should.equal(msg.send.args[0][0]);
      spy.restore();
      done();
    }, 100);
  });

  it('all help', (done) => {
    const botListener = new BotListener(robot, client, transform, dev, sh, sp, spt);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot all help.'}},
      count: 1,
      send: function () {},
      text: 'all'
    };
    let spy = sinon.spy(msg, "send");

    botListener.ListActionsFor(msg);

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 1);
'I can do lots of things.  I can:\nServer Profile commands:\n\t\u2022 Show all (server) profiles (e.g. show all profiles).\
\n\t\u2022 Show a specific (server) profile (e.g. show hadoop cluster).\n\t\u2022 Show a specific (server) profile compliance \
(e.g. show hadoop cluster compliance).\n\t\u2022 Make/update a specific (server) profile compliance (e.g. make hadoop cluster compliant).\
\n\t\u2022 Power on/off a specific (server) profile (e.g. turn on hadoop cluster).\n\t\u2022 List all critical/warning/ok/disabled (server) \
profiles (e.g. list all critical profiles).\nServer Profile Template commands:\n\t\u2022 Show all (server) profile templates (e.g. show all \
templates).\n\t\u2022 Show available targets for a server profile template (e.g. show available targets for docker swarm).\n\t\u2022 Show \
profile(s) using a server profile template (e.g. show profiles using docker swarm).\n\t\u2022 Create a profile using a server profile template \
(e.g. create a profile from docker swarm).\n\t\u2022 Flex/grow a server profile template by a given amount (e.g. grow docker swarm by 4 profiles).\
\n\t\u2022 Remove a number of profiles/servers from a profile template (e.g. remove 2 profiles from docker swarm).\n\t\u2022 Fix compliance \
for a profile template (e.g. fix compliance for docker swarm).\nServer hardware commands:\n\t\u2022 Power on/off a specific (server) hardware \
(e.g. turn on Encl1, bay 1).\n\t• List all (server) hardware (e.g. list all hardware).\n\t\u2022 List server hardware utilization (e.g. list \
Encl1, bay 1 utilization).\n\t\u2022 List server hardware utilization (e.g. list Encl1, bay 1 utilization).\n\t\u2022 List server hardware by \
name (e.g. list Encl1, bay 1).\n\t\u2022 List all critical/warning/ok/disabled (server) hardware (e.g. list all critical hardware).\n\t\u2022 \
List all powered on/off (server) hardware.\n\t\u2022 List all (server) hardware by UUID light state (e.g. list all hardware with UUID light on).\n\t\u2022 \
List (server) hardware by asset tag (e.g. show hardware with asset tag cluster1).\n.'.should.equal(msg.send.args[0][0]);
      spy.restore();
      done();
    }, 100);
  });

  it('all help 2', (done) => {
    const botListener = new BotListener(robot, client, transform, dev, sh, sp, spt);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot all help.'}},
      count: 1,
      send: function () {},
      text: 'all'
    };
    let spy = sinon.spy(msg, "send");

    botListener.ListAllActions(msg);

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 1);
'I can do lots of things.  I can:\nServer Profile commands:\n\t\u2022 Show all (server) profiles (e.g. show all profiles).\
\n\t\u2022 Show a specific (server) profile (e.g. show hadoop cluster).\n\t\u2022 Show a specific (server) profile compliance \
(e.g. show hadoop cluster compliance).\n\t\u2022 Make/update a specific (server) profile compliance (e.g. make hadoop cluster compliant).\
\n\t\u2022 Power on/off a specific (server) profile (e.g. turn on hadoop cluster).\n\t\u2022 List all critical/warning/ok/disabled (server) \
profiles (e.g. list all critical profiles).\nServer Profile Template commands:\n\t\u2022 Show all (server) profile templates (e.g. show all \
templates).\n\t\u2022 Show available targets for a server profile template (e.g. show available targets for docker swarm).\n\t\u2022 Show \
profile(s) using a server profile template (e.g. show profiles using docker swarm).\n\t\u2022 Create a profile using a server profile template \
(e.g. create a profile from docker swarm).\n\t\u2022 Flex/grow a server profile template by a given amount (e.g. grow docker swarm by 4 profiles).\
\n\t\u2022 Remove a number of profiles/servers from a profile template (e.g. remove 2 profiles from docker swarm).\n\t\u2022 Fix compliance \
for a profile template (e.g. fix compliance for docker swarm).\nServer hardware commands:\n\t\u2022 Power on/off a specific (server) hardware \
(e.g. turn on Encl1, bay 1).\n\t• List all (server) hardware (e.g. list all hardware).\n\t\u2022 List server hardware utilization (e.g. list \
Encl1, bay 1 utilization).\n\t\u2022 List server hardware utilization (e.g. list Encl1, bay 1 utilization).\n\t\u2022 List server hardware by \
name (e.g. list Encl1, bay 1).\n\t\u2022 List all critical/warning/ok/disabled (server) hardware (e.g. list all critical hardware).\n\t\u2022 \
List all powered on/off (server) hardware.\n\t\u2022 List all (server) hardware by UUID light state (e.g. list all hardware with UUID light on).\n\t\u2022 \
List (server) hardware by asset tag (e.g. show hardware with asset tag cluster1).\n.'.should.equal(msg.send.args[0][0]);
      spy.restore();
      done();
    }, 100);
  });

  it('all help default', (done) => {
    const botListener = new BotListener(robot, client, transform, dev, sh, sp, spt);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot all help.'}},
      count: 1,
      send: function () {},
      text: ''
    };
    let spy = sinon.spy(msg, "send");

    botListener.ListActionsFor(msg);

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 1);
'What can I help you with today? Here\'s just a few things I can do:\
\n\t\u2022 Server Profile help (e.g. sp help).\
\n\t\u2022 Server Profile Template help (e.g. spt help).\
\n\t\u2022 Server hardware help (e.g. sh help).\
\n.'.should.equal(msg.send.args[0][0]);
      spy.restore();
      done();
    }, 100);
  });

});
