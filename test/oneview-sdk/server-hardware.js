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
const ServerHardware = require('../../src/oneview-sdk/server-hardware');

const chai = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const Bluebird = require('bluebird');

chai.should();

describe('ServerHardware', () => {
  let oVClient;
  let serverHardware;
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
    serverHardware = new ServerHardware(oVClient);
  });

  it('get "off" hardware', sinon.test(function() {

    let serverHardwareResponse = {
      "type": "server-hardware-list",
      "category": "server-hardware",
      "count": 1,
      "members": [
          {
              "type": "server-hardware",
              "name": "0000A6610EE, bay 5",
              "powerState": "Off",
              "status": "Critical",
          }]
    };

    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverHardwareResponse));
    return serverHardware.getHardwareByPowerState("Off").then(function(data) {
      data.members.length.should.equal(1);
      data.members[0].powerState.should.equal("Off");
    });
  }));

  it('get "on" hardware', sinon.test(function() {

    let serverHardwareResponse = {
      "type": "server-hardware-list",
      "category": "server-hardware",
      "count": 1,
      "members": [
          {
            "type": "server-hardware",
            "name": "0000A6710EE, bay 3",
            "powerState": "On",
            "status": "OK",
          }]
    };

    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverHardwareResponse));
    return serverHardware.getHardwareByPowerState("On").then(function(data) {
      data.members.length.should.equal(1);
      data.members[0].powerState.should.equal("On");
    });
  }));

  it('get critical hardware', sinon.test(function() {
    let serverHardwareResponse = {
      "type": "server-hardware-list",
      "category": "server-hardware",
      "count": 1,
      "members": [
          {
              "type": "server-hardware",
              "name": "0000A6610EE, bay 5",
              "powerState": "Off",
              "status": "Critical",
          }]
    };
    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverHardwareResponse));

    return serverHardware.getHardwareByStatus("Critical").then(function(data) {
      data.members.length.should.equal(1);
      data.members[0].status.should.equal("Critical");
    });
  }));

  it('get warning hardware', sinon.test(function() {
    let serverHardwareResponse = {
      "type": "server-hardware-list",
      "category": "server-hardware",
      "count": 1,
      "members": [
          {
            "type": "server-hardware",
            "name": "0000A6710EF, bay 2",
            "powerState": "On",
            "status": "Warning",
          }]
    };
    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverHardwareResponse));

    serverHardware.getHardwareByStatus("Warning").then(function(data) {
      data.members.length.should.equal(1);
      data.members[0].status.should.equal("Warning");
    });
  }));

  it('get disabled hardware', sinon.test(function() {
    let serverHardwareResponse = {
      "type": "server-hardware-list",
      "category": "server-hardware",
      "count": 1,
      "members": [
          {
            "type": "server-hardware",
            "name": "0000A6710EA, bay 7",
            "powerState": "On",
            "status": "Disabled",
          }]
    };

    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverHardwareResponse));

    serverHardware.getHardwareByStatus("Disabled").then(function(data) {
      data.members.length.should.equal(1);
      data.members[0].status.should.equal("Disabled");
    });
  }));

  it('get OK hardware', sinon.test(function() {
    let serverHardwareResponse = {
      "type": "server-hardware-list",
      "category": "server-hardware",
      "count": 1,
      "members": [
          {
            "type": "server-hardware",
            "name": "0000B6710EA, bay 7",
            "powerState": "On",
            "status": "OK",
          }]
    };

    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverHardwareResponse));

    serverHardware.getHardwareByStatus("OK").then(function(data) {
      data.members.length.should.equal(1);
      data.members[0].status.should.equal("OK");
    });
  }));

});
