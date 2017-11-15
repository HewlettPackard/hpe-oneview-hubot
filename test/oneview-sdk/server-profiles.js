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
      chatRoom: "room"
    };
    oVClient = new OVClient(oneviewConfig, {});
    serverProfiles = new ServerProfiles(oVClient);
  });

  let serverProfileResponse = {
    type: "ServerProfileV6",
    uri: "/rest/server-profiles/1a94be5c",
    name: "myprofile",
    description: "",
    serialNumber: "VCGLPVN007",
    uuid: "1a94be5c",
    serverHardwareUri: null,
    hyperlink: "https://0.0.0.0/#/profiles/show/overview/r/rest/server-profiles/1a94be5c?s_sid=LTIyNDcK",
    serverProfileTemplateHyperlink: "https://0.0.0.0/#/profile-templates/show/overview/r/rest/server-profile-templates/650449e6?s_sid=LTIyNDcK",
    serverHardwareHyperlink: "https://0.0.0.0/#/server-hardware/show/overview/r/rest/server-hardware/37333036?s_sid=LTIyNDcK",
    serverHardwareTypeHyperlink: "https://0.0.0.0/#/server-hardware-types/show/general/r/rest/server-hardware-types/30D74951?s_sid=LTIyNDcK",
    enclosureGroupHyperlink: "https://0.0.0.0/#/enclosuregroups/show/interconectbayconfiguration/r/rest/enclosure-groups/dfebe3a3?s_sid=LTIyNDcK",
    enclosureHyperlink: "https://0.0.0.0/#/enclosure/show/overview/r/rest/enclosures/09SGHX6J1?s_sid=LTIyNDcK",
    taskHyperlink: "https://0.0.0.0/#/activity/r/rest/tasks/85EDF0DA?s_sid=LTIyNDcK",
    status: "OK"
  };

  it('get all profiles', (done) => {
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
    let stub = sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileResponse));

    serverProfiles.getAllServerProfiles().then(function(data) {
      data.members[0].status.should.equal("Critical");
    }).then(() => done(), done);

    stub.restore();
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
    let stub = sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileResponse));

    serverProfiles.getProfilesByStatus("Critical").then(function(data) {
      data.members[0].status.should.equal("Critical");
    }).then(() => done(), done);

    stub.restore();
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
    let stub = sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileResponse));

    serverProfiles.getProfilesByStatus("Warning").then(function(data) {
      data.members[0].status.should.equal("Warning");
    }).then(() => done(), done);

    stub.restore();
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
    let stub = sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileResponse));

    serverProfiles.getProfilesByStatus("OK").then(function(data) {
      data.members[0].status.should.equal("OK");
    }).then(() => done(), done);

    stub.restore();
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
    let stub = sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileResponse));

    serverProfiles.getProfilesByStatus("Disabled").then(function(data) {
      data.members[0].status.should.equal("Disabled");
    }).then(() => done(), done);

    stub.restore();
  });

  it('update server profile compliance', (done) => {
    let stub = sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileResponse));

    serverProfiles.updateServerProfileCompliance('localhost', '/rest/server-profiles/123as41').then((data) => {
      'ServerProfileV6'.should.equal(data.type);
    }).then(() => done(), done);

    stub.restore();
  });

  it('get server profile compliance preview', (done) => {
    let profileCompliance = {
      type: "ServerProfileCompliancePreviewV1",
      isOnlineUpdate: false,
      automaticUpdates: [
          "Create a connection to network {\"name\":\"eth1\", \"uri\":\"/rest/ethernet-networks/95717f69\"} with id 2 on Mezzanine (Mezz) 3:2-a."
      ],
      manualUpdates: []
    };

    let stub = sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(profileCompliance));

    serverProfiles.getServerProfileCompliancePreview('localhost', '/rest/server-profiles/123as41').then((data) => {
      'ServerProfileCompliancePreviewV1'.should.equal(data.type);
      data.manualUpdates.length.should.equal(0);
    }).then(() => done(), done);

    stub.restore();
  });

  it('delete server profile', (done) => {
    let task = {state: "Complete"};

    let stub = sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(task));

    serverProfiles.deleteServerProfile('localhost', '/rest/server-profiles/123as41').then((data) => {
      'Complete'.should.equal(data.state);
    }).then(() => done(), done);

    stub.restore();
  });

  it('create server profile', (done) => {
    let task = {state: "Complete"};

    let stub = sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(task));

    serverProfiles.createServerProfile('localhost', {}).then((data) => {
      'Complete'.should.equal(data.state);
    }).then(() => done(), done);

    stub.restore();
  });

  it('get server profile', (done) => {
    let stub = sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileResponse));

    serverProfiles.getServerProfile('localhost', '/rest/server-profiles/123as41').then((data) => {
      'ServerProfileV6'.should.equal(data.type);
    }).then(() => done(), done);

    stub.restore();
  });

  it('get available targets', (done) => {
    let targets = {
      type: 'AvailableTargetsV2',
      targets: [ { enclosureGroupName: 'dcs',
           enclosureName: '0000A',
           enclosureUri: '/rest/enclosures/0A66101',
           enclosureBay: 8,
           serverHardwareName: '0000A66101, bay 8'}]
    };

    let stub = sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(targets));

    serverProfiles.getAvailableTargets('localhost', '/rest/server-hardware/123as41', '/rest/enclosure-groups/asdfb').then((data) => {
      'AvailableTargetsV2'.should.equal(data.type);
      data.targets.length.should.equal(1);
    }).then(() => done(), done);

    stub.restore();
  });

});
