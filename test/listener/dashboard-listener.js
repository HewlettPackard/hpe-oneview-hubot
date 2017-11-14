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
const DashboardListener = require('../../src/listener/dashboard-listener');
const OneViewBrain = require('../../src/middleware/ov-brain');
const OVClient = require('../../src/oneview-sdk/ov-client');
const ResourceTransforms = require('../../src/listener/utils/resource-transforms');
const NamedRegExp = require('../../src/listener/named-regexp');

const chai = require('chai');
const sinon = require('sinon');
const Bluebird = require('bluebird');

chai.should();
const assert = chai.assert;

describe('DashboardListener', () => {

  const robot = {adapterName: 'shell', on: function () { }, listen: function () {}, respond: function () {}, listenerMiddleware: function() {}, logger: {debug: function () {}, error: function () {}, info: function () {}}};

  const oneviewConfig = {
    hosts: []
  };
  const oVClient = new OVClient(oneviewConfig, robot);
  const brain = new OneViewBrain(oVClient, robot, {});
  const transform = new ResourceTransforms(robot, brain);

  const serverHardwareResponse = {
    members: [{ attribute: 'status',
    counts: [{ value: 'OK', count: 7 }, { value: 'Critical', count: 1 }]},
    { attribute: 'status', counts: [ { value: 'OK', count: 21 }]}]};

  const serverProfilesResponse = {
    members: [{ attribute: 'state',
    counts: [{ value: 'NoProfileApplied', count: 7 },
    {value: 'ProfileApplied', count: 1 }]},
    {attribute: 'state',
    counts: [{ value: 'NoProfileApplied', count: 19 },
    {value: 'ProfileApplied', count: 2 }]}]};

  const alertsResponse = {
    members: [{ attribute: 'status',
    counts: [{ value: 'Critical', count: 1 },
    {value: 'Warning', count: 1 } ]},
    {attribute: 'status',
    counts: [ { value: 'OK', count: 719 }, { value: 'Warning', count: 1 } ]}]};

  const serversWithProfilesResponse = {
    members: [{ attribute: 'status', counts: [ { value: 'OK', count: 1 }]},
    {attribute: 'status', counts: [ { value: 'OK', count: 2 }]}]};

  const err = {
    error: {
      errorCode: 'OOPS'
    }
  };

  it('constructor', (done) => {
    let spy = sinon.spy(robot, "respond");
    const dashboardListener = new DashboardListener(robot, oVClient, transform);

    let rgx0 = new NamedRegExp(dashboardListener.SHOW);

    let constructorArgs = robot.respond.getCalls();

    rgx0.should.deep.equal(constructorArgs[0].args[0]);
    assert(typeof constructorArgs[0].args[2] === 'function');
    'bound ShowOneViewDashboard'.should.equal(constructorArgs[0].args[2].name);
    assert.isFalse(constructorArgs[0].args[2].hasOwnProperty('prototype'));

    assert(constructorArgs.length === 1);

    spy.restore();
    done();
  });

  it('test regexps', (done) => {
    const dashboardListener = new DashboardListener(robot, oVClient, transform);

    let rgx0 = new NamedRegExp(dashboardListener.SHOW);

    assert.isTrue(rgx0.test('@bot show dashboard.'));
    assert.isTrue(rgx0.test('@bot show oneview dashboard.'));
    assert.isTrue(rgx0.test('@bot show oneview status.'));

    done();
  });

  it('show', (done) => {
    let stub1 = sinon.stub(oVClient.Dashboard, 'getAggregatedAlerts').returns(Bluebird.resolve(alertsResponse));
    let stub2 = sinon.stub(oVClient.Dashboard, 'getAggregatedServerProfiles').returns(Bluebird.resolve(serverProfilesResponse));
    let stub3 = sinon.stub(oVClient.Dashboard, 'getAggregatedServerHardware').returns(Bluebird.resolve(serverHardwareResponse));
    let stub4 = sinon.stub(oVClient.Dashboard, 'getAggregatedServersWithProfiles').returns(Bluebird.resolve(serversWithProfilesResponse));

    const dashboardListener = new DashboardListener(robot, oVClient, transform);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot show dashboard.'}},
      count: 1,
      send: function () {},
      message: {user: {name: 'name'}}
    };
    sinon.spy(msg, "send");

    dashboardListener.ShowOneViewDashboard(msg);

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 1);
      'Ok name, I am going to generate your dashboard. This might take a little while.\nFor a more comprehensive view, see Dashboard.'.should.equal(msg.send.args[0][0]);
      stub1.restore();
      stub2.restore();
      stub3.restore();
      stub4.restore();
      done();
    }, 100);
  });

  it('show error', (done) => {
    let stub1 = sinon.stub(oVClient.Dashboard, 'getAggregatedAlerts').returns(Bluebird.reject(err));
    let stub2 = sinon.stub(oVClient.Dashboard, 'getAggregatedServerProfiles').returns(Bluebird.resolve(serverProfilesResponse));
    let stub3 = sinon.stub(oVClient.Dashboard, 'getAggregatedServerHardware').returns(Bluebird.resolve(serverHardwareResponse));
    let stub4 = sinon.stub(oVClient.Dashboard, 'getAggregatedServersWithProfiles').returns(Bluebird.resolve(serversWithProfilesResponse));

    const dashboardListener = new DashboardListener(robot, oVClient, transform);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot show dashboard.'}},
      count: 1,
      send: function () {},
      message: {user: {name: 'name'}}
    };
    sinon.spy(msg, "send");

    dashboardListener.ShowOneViewDashboard(msg);

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 2);
      'Ok name, I am going to generate your dashboard. This might take a little while.\nFor a more comprehensive view, see Dashboard.'.should.equal(msg.send.args[0][0]);
      'Oops there was a problem.\n\nOneView error code: OOPS\n'.should.equal(msg.send.args[1][0]);
      stub1.restore();
      stub2.restore();
      stub3.restore();
      stub4.restore();
      done();
    }, 100);
  });
});
