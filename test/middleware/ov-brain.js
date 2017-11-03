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
const nlp = require('nlp_compromise');
const Lexer = require('../../src/middleware/utils/lexer');
const OVClient = require('../../src/oneview-sdk/ov-client');
const OneViewBrain = require('../../src/middleware/ov-brain');

const lex = new Lexer(nlp);

const chai = require('chai');
const sinon = require('sinon');
const Bluebird = require('bluebird');

chai.should();

describe('OV Brain', () => {

  let robot = {adapterName: 'shell', on: function () { }, logger: {debug: function () {}, error: function () {}, info: function () {}}};

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
          "uri": "/rest/server-hardware/eb13eab8-adsf",
          "model": "BL460c Gen8 1",
          "serialNumber": "1234",
          "hyperlink": "https://10.1.1.1/#/server-hardware/show/overview/r/rest/server-hardware/eb13eab8-adsf?s_sid=LTE"
        }]
  };

  let serverProfileResponse = {
    "type": "server-profiles-list",
    "category": "server-profiles",
    "count": 1,
    "members": [
        {
          "type": "ServerProfile",
          "name": "Profile101",
          "serverHardwareUri": "/rest/server-hardware/uri",
          "uri": "/rest/server-profiles/cc7b3c49-ef11",
          "hyperlink": "https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/ea54r213eab8-adsf?s_sid=LTE"
        }]
  };

  let serverProfileTemplateResponse = {
    "type": "server-profile-templates-list",
    "category": "server-profile-templates",
    "count": 1,
    "members": [
        {
          "type": "ServerProfileTemplate",
          "name": "ProfileTemplate101",
          "uri": "/rest/server-profile-templates/cc7b3c49-ef112",
          "hyperlink": "https://10.1.1.1/#/profile-templates/show/overview/r/rest/server-profile-templates/cc7b3c49-ef112?s_sid=LTE"
        }]
  };

  let logicalInterconnectsResponse = {
    "type": "LogicalInterconnectCollection",
    "category": "logical-interconnects",
    "count": 1,
    "members": [
        {
          "type": "logical-interconnect",
          "name": "Encl1 logical interconnect group",
          "uri": "/rest/logical-interconnects/47a1",
          "interconnects": ["/rest/interconnects/e", "/rest/interconnects/f"],
          "hyperlink": "https://10.1.1.1/#/logicalswitch/show/overview/r/rest/logical-interconnects/cc7b3c49-ef112?s_sid=LTE"
        }]
  };

  let oneviewConfig = {
    hosts: [{
        applianceIp: "10.1.1.1",
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
  let oVClient = new OVClient(oneviewConfig, robot);
  sinon.stub(oVClient.ServerHardware, 'getAllServerHardware').returns(Bluebird.resolve(serverHardwareResponse));
  sinon.stub(oVClient.ServerProfiles, 'getAllServerProfiles').returns(Bluebird.resolve(serverProfileResponse));
  sinon.stub(oVClient.ServerProfileTemplates, 'getAllServerProfileTemplates').returns(Bluebird.resolve(serverProfileTemplateResponse));
  sinon.stub(oVClient.LogicalInterconnects, 'getAllLogicalInterconnects').returns(Bluebird.resolve(logicalInterconnectsResponse));

  const brain = new OneViewBrain(oVClient, robot, lex);

  it('getHardwareModel', () => {
    const result = brain.getHardwareModel('10.1.1.1/rest/server-hardware/eb13eab8-adsf');
    result.should.equal('BL460c Gen8 1');
  });

  it('getHardwareModel empty', () => {
    const result = brain.getHardwareModel('10.1.1.1/rest/server-profiles/eb13eab7');
    result.should.equal('');
  });

  it('getDeviceNameAndHyperLink SH', () => {
    const result = brain.getDeviceNameAndHyperLink('10.1.1.1/rest/server-hardware/eb13eab8-adsf');
    const expected = {deviceName: '0000A6610EE, bay 5', hyperlink: 'https://10.1.1.1/#/server-hardware/show/overview/r/rest/server-hardware/eb13eab8-adsf?s_sid=LTE'};
    chai.expect(result).to.deep.equal(expected);
  });

  it('getDeviceNameAndHyperLink SP', () => {
    const result = brain.getDeviceNameAndHyperLink('10.1.1.1/rest/server-profiles/cc7b3c49-ef11');
    const expected = {deviceName: 'Profile101', hyperlink: 'https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/ea54r213eab8-adsf?s_sid=LTE'};
    chai.expect(result).to.deep.equal(expected);
  });

  it('getDeviceNameAndHyperLink SPT', () => {
    const result = brain.getDeviceNameAndHyperLink('10.1.1.1/rest/server-profile-templates/cc7b3c49-ef112');
    const expected = {deviceName: 'ProfileTemplate101', hyperlink: 'https://10.1.1.1/#/profile-templates/show/overview/r/rest/server-profile-templates/cc7b3c49-ef112?s_sid=LTE'};
    chai.expect(result).to.deep.equal(expected);
  });

  it('getDeviceNameAndHyperLink undef', () => {
    const result = brain.getDeviceNameAndHyperLink('10.1.1.1/rest/server-profiles/eb13eab99');
    const expected = {deviceName: '', hyperlink: ''};
    chai.expect(result).to.deep.equal(expected);
  });

  it('getLogicalInterconnectsMap', () => {
    const result = brain.getLogicalInterconnectsMap();
    const expected = new Map();
    expected.set('/rest/interconnects/e', '/rest/logical-interconnects/47a1');
    expected.set('/rest/interconnects/f', '/rest/logical-interconnects/47a1');
    chai.expect(result).to.deep.equal(expected);
  });
});
