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

import OVClient from '../oneview-sdk/ov-client';
import ServerProfiles from '../oneview-sdk/server-profiles';

let chai = require('chai');
let sinon = require('sinon');
let nock = require('nock');
let Bluebird = require('bluebird');

describe('ServerProfiles', () => {
  let oVClient;
  var serverProfiles;
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

  it('get critical profiles', sinon.test(function() {
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
    });
  }));

  it('get warning profiles', sinon.test(function() {
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
    });
  }));

  it('get OK profiles', sinon.test(function() {
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
    });
  }));

  it('get disabled profiles', sinon.test(function() {
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
    });
  }));

});
