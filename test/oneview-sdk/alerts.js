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
const OVClient = require('../../src/oneview-sdk/ov-client');
const Alerts = require('../../src/oneview-sdk/alerts');

const chai = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const Bluebird = require('bluebird');

chai.should();

describe('Alerts', () => {
  let oVClient;
  let alerts;

  beforeEach(() => {
    let oneviewConfig = {
      hosts: [{
          applianceIp: "localhost",
          apiVersion: 300,
          userName: "admin",
          password: "password",
          doProxy: false,
          proxyHost: "0.0.0.0",
          proxyPort: 0
        }],
      notificationsFilters: [{"severity": "Critical"}],
      pollingInterval: 30,
      readOnly: true,
      notificationsRoom: "room"
    };
    oVClient = new OVClient(oneviewConfig, {});
    alerts = new Alerts(oVClient);
  });

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

  it('get alerts by count', (done) => {
    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(alertResponse));

    alerts.getNumberOfAlerts(1).then(function(data) {
      data.members[0].category.should.equal("alerts");
      data.members[0].severity.should.equal("Warning");
    }).then(() => done(), done);

    sinon.restore();
  });

  it('get alerts by state', (done) => {
    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(alertResponse));

    alerts.getFilteredAlerts("Locked").then(function(data) {
      data.members[0].category.should.equal("alerts");
      data.members[0].severity.should.equal("Warning");
    }).then(() => done(), done);

    sinon.restore();
  });

  it('get alerts by status', (done) => {
    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(alertResponse));

    alerts.getFilteredAlerts("Warning").then(function(data) {
      data.members[0].category.should.equal("alerts");
      data.members[0].severity.should.equal("Warning");
    }).then(() => done(), done);

    sinon.restore();
  });

  it('get alerts by status and time', (done) => {
    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(alertResponse));

    alerts.getFilteredAlerts("Warning", undefined, "last 7 days").then(function(data) {
      data.members[0].category.should.equal("alerts");
      data.members[0].severity.should.equal("Warning");
    }).then(() => done(), done);

    sinon.restore();
  });

});
