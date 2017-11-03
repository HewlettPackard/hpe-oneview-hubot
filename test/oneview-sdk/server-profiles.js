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
const ServerProfiles = require('../../src/oneview-sdk/server-profiles');

const chai = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const Bluebird = require('bluebird');

chai.should();

describe('ServerProfiles', () => {
  let oVClient;
  let serverProfiles;
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
    serverProfiles = new ServerProfiles(oVClient);
  });

  it('get critical profiles', (done) => {
    let serverProfileResponse = {
      "type": "server-profile-list",
      "category": "server-profiles",
      "count": 1,
      "members": [
          {
            "type": "server-profiles",
            "name": "SP1",
            "status": "Critical",
          }]
    };
    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileResponse));

    serverProfiles.getProfilesByStatus("Critical").then(function(data) {
      data.members[0].status.should.equal("Critical");
    }).then(() => done(), done);
  });

  it('get warning profiles', (done) => {
    let serverProfileResponse = {
      "type": "server-profile-list",
      "category": "server-profiles",
      "count": 1,
      "members": [
          {
            "type": "server-profiles",
            "name": "SP1",
            "status": "Warning",
          }]
    };
    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileResponse));

    serverProfiles.getProfilesByStatus("Warning").then(function(data) {
      data.members[0].status.should.equal("Warning");
    }).then(() => done(), done);
  });

  it('get OK profiles', (done) => {
    let serverProfileResponse = {
      "type": "server-profile-list",
      "category": "server-profiles",
      "count": 1,
      "members": [
          {
            "type": "server-profiles",
            "name": "SP1",
            "status": "OK",
          }]
    };
    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileResponse));

    serverProfiles.getProfilesByStatus("OK").then(function(data) {
      data.members[0].status.should.equal("OK");
    }).then(() => done(), done);
  });

  it('get disabled profiles', (done) => {
    let serverProfileResponse = {
      "type": "server-profile-list",
      "category": "server-profiles",
      "count": 1,
      "members": [
          {
            "type": "server-profiles",
            "name": "SP1",
            "status": "Disabled",
          }]
    };
    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileResponse));

    serverProfiles.getProfilesByStatus("Disabled").then(function(data) {
      data.members[0].status.should.equal("Disabled");
    }).then(() => done(), done);
  });
});
