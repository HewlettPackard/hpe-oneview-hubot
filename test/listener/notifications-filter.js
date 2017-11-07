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
const NotificationsFilter = require('../../src/listener/notifications-filter');

const chai = require('chai');
const sinon = require('sinon');

chai.should();
const assert = chai.assert;

describe('NotificationsFilter', () => {

  const robot = {adapterName: 'shell', on: function () { }, listen: function () {}, respond: function () {}, listenerMiddleware: function() {}, logger: {debug: function () {}, error: function () {}, info: function () {}}};

  const okResource = {
    resourceUri: '/rest/alerts/14610',
    changeType: 'Created',
    newState: 'Cleared',
    resource: {
      type: 'AlertResourceV3',
      uri: '/rest/alerts/14610',
      category: 'alerts',
      associatedEventUris: [ '/rest/events/43435' ],
      resourceID: '/rest/server-hardware/3030343',
      description: 'The server has been powered on.',
      alertTypeID: 'Trap.cpqSm2ServerPowerOn',
      urgency: 'None',
      healthCategory: 'Power',
      lifeCycle: true,
      associatedResource: {
        resourceName: '0000A66, bay 8',
        resourceUri: '/rest/server-hardware/3030343',
        resourceCategory: 'server-hardware',
        associationType: 'HAS_A',
        resourceHyperlink: 'https://0.0.0.0/#/server-hardware/show/overview/r/rest/server-hardware/3030343?s_sid=LTI2MDA4' },
      severity: 'OK',
      alertState: 'Cleared',
      physicalResourceType: 'server-hardware',
      resourceUri: '/rest/server-hardware/3030343',
      serviceEventSource: false,
      hyperlink: 'https://0.0.0.0/#/activity/r/rest/alerts/14610?s_sid=LTI2MDA4',
      resourceHyperlink: 'https://0.0.0.0/#/server-hardware/show/overview/r/rest/server-hardware/3030343?s_sid=LTI2MDA4' },
    userInitiatedTask: false,
    changedAttributes: [],
    resourceHyperlink: 'https://0.0.0.0/#/activity/r/rest/alerts/14610?s_sid=LTI2MDA4'
  };

  const criticalResource = {
    resourceUri: '/rest/alerts/14610',
    changeType: 'Created',
    newState: 'Cleared',
    resource: {
      type: 'AlertResourceV3',
      uri: '/rest/alerts/14610',
      category: 'alerts',
      associatedEventUris: [ '/rest/events/43435' ],
      resourceID: '/rest/server-hardware/3030343',
      description: 'The server has been powered on.',
      alertTypeID: 'Trap.cpqSm2ServerPowerOn',
      urgency: 'None',
      healthCategory: 'Power',
      lifeCycle: true,
      associatedResource: {
        resourceName: '0000A66, bay 8',
        resourceUri: '/rest/server-hardware/3030343',
        resourceCategory: 'server-hardware',
        associationType: 'HAS_A',
        resourceHyperlink: 'https://0.0.0.0/#/server-hardware/show/overview/r/rest/server-hardware/3030343?s_sid=LTI2MDA4' },
      severity: 'Critical',
      alertState: 'Cleared',
      physicalResourceType: 'server-hardware',
      resourceUri: '/rest/server-hardware/3030343',
      serviceEventSource: false,
      hyperlink: 'https://0.0.0.0/#/activity/r/rest/alerts/14610?s_sid=LTI2MDA4',
      resourceHyperlink: 'https://0.0.0.0/#/server-hardware/show/overview/r/rest/server-hardware/3030343?s_sid=LTI2MDA4' },
    userInitiatedTask: false,
    changedAttributes: [],
    resourceHyperlink: 'https://0.0.0.0/#/activity/r/rest/alerts/14610?s_sid=LTI2MDA4'
  };

  it('constructor', (done) => {
    notificationsFilter = new NotificationsFilter(robot);

    let expected = [{severity: "Critical"}];

    expected.should.eql(notificationsFilter.filters);
    done();
  });

  it('check message negative', (done) => {
    notificationsFilter = new NotificationsFilter(robot);
    let result = notificationsFilter.check(okResource);
    assert(result.length === 0);
    done();
  });

  it('check message positive', (done) => {
    notificationsFilter = new NotificationsFilter(robot);
    let result = notificationsFilter.check(criticalResource);
    assert(result.length === 1);
    done();
  });

});
