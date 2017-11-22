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
const AlertsListener = require('../../src/listener/alerts');
const OneViewBrain = require('../../src/middleware/ov-brain');
const OVClient = require('../../src/oneview-sdk/ov-client');
const ResourceTransforms = require('../../src/listener/utils/resource-transforms');
const NamedRegExp = require('../../src/listener/named-regexp');

const chai = require('chai');
const sinon = require('sinon');
const Bluebird = require('bluebird');

chai.should();
const assert = chai.assert;

describe('AlertsListener', () => {

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
  const oVClient = new OVClient(oneviewConfig, robot);
  const brain = new OneViewBrain(oVClient, robot, {});
  const transform = new ResourceTransforms(robot, brain);

  const alertResponse = {
    members: [
      {
        type: "AlertResourceV3",
        uri: "/rest/alerts/476",
        category: "alerts",
        associatedEventUris: [
          "/rest/events/1774"
        ],
        resourceID: null,
        correctiveAction: "",
        description: "The backup has not been...",
        alertTypeID: "Backup",
        urgency: "Medium",
        healthCategory: "backups",
        lifeCycle: false,
        associatedResource: {
          resourceName: "Backup.",
          resourceUri: "/rest/backups",
          resourceCategory: "backups",
          associationType: "HAS_A",
          resourceHyperlink: "https://0.0.0.0/#//rest/backups?s_sid=NjA2ODA"
        },
        severity: "Warning",
        alertState: "Locked",
        physicalResourceType: "backups",
        resourceUri: "/rest/backups",
        hyperlink: "https://0.0.0.0/#/activity/r/rest/alerts/476?s_sid=NjA2ODA",
        resourceHyperlink: "https://0.0.0.0/#//rest/backups?s_sid=NjA2ODA"
      }
    ]
  };

  const err = {
    error: {errorCode: 'OOPS'}
  };

  it('constructor', (done) => {
    let spy = sinon.spy(robot, "respond");
    const alertsListener = new AlertsListener(robot, oVClient, transform);

    let rgx0 = new NamedRegExp(alertsListener.LIST_COUNT);
    let rgx1 = new NamedRegExp(alertsListener.LIST_STATUS);

    let constructorArgs = robot.respond.getCalls();

    rgx0.should.deep.equal(constructorArgs[0].args[0]);
    assert(typeof constructorArgs[0].args[2] === 'function');
    'bound ListNumberOfAlerts'.should.equal(constructorArgs[0].args[2].name);
    assert.isFalse(constructorArgs[0].args[2].hasOwnProperty('prototype'));

    rgx1.should.deep.equal(constructorArgs[1].args[0]);
    assert(typeof constructorArgs[1].args[2] === 'function');
    'bound ListFilteredAlerts'.should.equal(constructorArgs[1].args[2].name);
    assert.isFalse(constructorArgs[1].args[2].hasOwnProperty('prototype'));

    assert(constructorArgs.length === 2);

    spy.restore();
    done();
  });

  it('test regexps', (done) => {
    const alertsListener = new AlertsListener(robot, oVClient, transform);

    let rgx0 = new NamedRegExp(alertsListener.LIST_COUNT);
    let rgx1 = new NamedRegExp(alertsListener.LIST_STATUS);

    assert.isTrue(rgx0.test('@bot show last 7 alerts.'));
    assert.isTrue(rgx1.test('@bot show all active alerts from today.'));
    assert.isTrue(rgx1.test('@bot show all critical alerts from last 7 days.'));
    assert.isTrue(rgx1.test('@bot show all disabled alerts from last 30 days.'));
    assert.isTrue(rgx1.test('@bot show all locked ok alerts from last 30 days.'));

    done();
  });

  it('list alerts by number', (done) => {
    let stub = sinon.stub(oVClient.Alerts, 'getNumberOfAlerts').returns(Bluebird.resolve(alertResponse));
    const alertsListener = new AlertsListener(robot, oVClient, transform);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot show last 1 alerts.'}},
      count: 1,
      send: function () {}
    };
    sinon.spy(msg, "send");

    alertsListener.ListNumberOfAlerts(msg);

    const expectedJsonResults = JSON.stringify(alertResponse, null, '  ');
    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 2);
      'Here are the last 1 alerts.'.should.equal(msg.send.args[0][0]);
      expectedJsonResults.should.equal(msg.send.args[1][0]);
      stub.restore();
      done();
    }, 100);
  });

  it('list alerts by filter', (done) => {
    let stub = sinon.stub(oVClient.Alerts, 'getFilteredAlerts').returns(Bluebird.resolve(alertResponse));
    const alertsListener = new AlertsListener(robot, oVClient, transform);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot show all active warning alerts from today.'}},
      count: 1,
      status: 'warning',
      state: 'active',
      time: 'today',
      send: function () {}
    };
    sinon.spy(msg, "send");

    alertsListener.ListFilteredAlerts(msg);

    const expectedJsonResults = JSON.stringify(alertResponse, null, '  ');
    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 2);
      'I found the following alerts.'.should.equal(msg.send.args[0][0]);
      expectedJsonResults.should.equal(msg.send.args[1][0]);
      stub.restore();
      done();
    }, 100);
  });

  it('list alerts by filter, no match today', (done) => {
    let stub = sinon.stub(oVClient.Alerts, 'getFilteredAlerts').returns(Bluebird.resolve({members: []}));
    const alertsListener = new AlertsListener(robot, oVClient, transform);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot show all active critical alerts from today.'}},
      count: 1,
      status: 'warning',
      state: 'active',
      time: 'today',
      send: function () {}
    };
    sinon.spy(msg, "send");

    alertsListener.ListFilteredAlerts(msg);

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "I didn't find any warning active alerts from today.".should.equal(msg.send.args[0][0]);
      stub.restore();
      done();
    }, 100);
  });

  it('list alerts by filter, no match', (done) => {
    let stub = sinon.stub(oVClient.Alerts, 'getFilteredAlerts').returns(Bluebird.resolve({members: []}));
    const alertsListener = new AlertsListener(robot, oVClient, transform);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot show all active critical alerts from last 7 days.'}},
      count: 1,
      status: 'critical',
      state: 'active',
      time: '7 days',
      send: function () {}
    };
    sinon.spy(msg, "send");

    alertsListener.ListFilteredAlerts(msg);

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "I didn't find any critical active alerts from the 7 days.".should.equal(msg.send.args[0][0]);
      stub.restore();
      done();
    }, 100);
  });

  it('list alerts by filter, no match undef', (done) => {
    let stub = sinon.stub(oVClient.Alerts, 'getFilteredAlerts').returns(Bluebird.resolve({members: []}));
    const alertsListener = new AlertsListener(robot, oVClient, transform);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot show all   alerts from .'}},
      count: 1,
      status: undefined,
      state: undefined,
      time: undefined,
      send: function () {}
    };
    sinon.spy(msg, "send");

    alertsListener.ListFilteredAlerts(msg);

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "I didn't find any alerts.".should.equal(msg.send.args[0][0]);
      stub.restore();
      done();
    }, 100);
  });

  it('list alerts by number error', (done) => {
    let stub = sinon.stub(oVClient.Alerts, 'getNumberOfAlerts').returns(Bluebird.reject(err));
    const alertsListener = new AlertsListener(robot, oVClient, transform);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot show last 1 alerts.'}},
      count: 1,
      send: function () {}
    };
    sinon.spy(msg, "send");

    alertsListener.ListNumberOfAlerts(msg);

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "Oops there was a problem.\n\nOneView error code: OOPS\n".should.equal(msg.send.args[0][0]);
      stub.restore();
      done();
    }, 100);
  });

  it('list alerts by filter error', (done) => {
    let stub = sinon.stub(oVClient.Alerts, 'getFilteredAlerts').returns(Bluebird.reject(err));
    const alertsListener = new AlertsListener(robot, oVClient, transform);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot show all active warning alerts from today.'}},
      count: 1,
      status: 'warning',
      state: 'active',
      time: 'today',
      send: function () {}
    };
    sinon.spy(msg, "send");

    alertsListener.ListFilteredAlerts(msg);

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "Oops there was a problem.\n\nOneView error code: OOPS\n".should.equal(msg.send.args[0][0]);
      stub.restore();
      done();
    }, 100);
  });

});
