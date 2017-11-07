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
const AlertsListener = require('../../src/listener/alerts-listener');
const OneViewBrain = require('../../src/middleware/ov-brain');
const OVClient = require('../../src/oneview-sdk/ov-client');
const ResourceTransforms = require('../../src/listener/utils/resource-transforms');

const chai = require('chai');
const sinon = require('sinon');
const Bluebird = require('bluebird');

chai.should();
const assert = chai.assert;

describe('AlertsListener', () => {

  const robot = {adapterName: 'shell', on: function () { }, listen: function () {}, respond: function () {}, listenerMiddleware: function() {}, logger: {debug: function () {}, error: function () {}, info: function () {}}};

  const oneviewConfig = {
    hosts: []
  };
  const oVClient = new OVClient(oneviewConfig, robot);

  sinon.stub(oVClient.ServerHardware, 'getAllServerHardware').returns(Bluebird.resolve([]));
  sinon.stub(oVClient.ServerProfiles, 'getAllServerProfiles').returns(Bluebird.resolve([]));
  sinon.stub(oVClient.ServerProfileTemplates, 'getAllServerProfileTemplates').returns(Bluebird.resolve([]));
  sinon.stub(oVClient.LogicalInterconnects, 'getAllLogicalInterconnects').returns(Bluebird.resolve([]));

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
    error: {
      errorCode: 'OOPS'
    }
  };

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
      'Oops there was a problem.\n\nOneView error code: OOPS\n'.should.equal(msg.send.args[0][0]);
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
      'Oops there was a problem.\n\nOneView error code: OOPS\n'.should.equal(msg.send.args[0][0]);
      stub.restore();
      done();
    }, 100);
  });

});
