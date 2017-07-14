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
import { Lexer } from '../middleware/nlp-middleware';
import OVClient from '../oneview-sdk/ov-client';
import ovBrain from '../ov-brain';
import { getHardwareModel } from '../ov-brain';
import { getDeviceNameAndHyperLink } from '../ov-brain';
import { getLogicalInterconnectsMap } from '../ov-brain';

let chai = require('chai');
let sinon = require('sinon');
let Bluebird = require('bluebird');

chai.should();

describe('OV Brain', () => {

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
          "hyperlink": "https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/eb13eab8-adsf?s_sid=LTE"
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
          "hyperlink": "https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/eb13eab8-adsf?s_sid=LTE"
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
          "interconnects": ["/rest/interconnects/e", "/rest/interconnects/f"]
        }]
  };

  let oVClient;
  let oneviewConfig = {
    applianceIp: 'localhost',
    apiVersion: 300,
    readOnly: true,
    pollingInterval: 60,
    notificationsRoom: 'room'
  };
  oVClient = new OVClient(oneviewConfig, {});
  sinon.stub(oVClient.ServerHardware, 'getAllServerHardware').returns(Bluebird.resolve(serverHardwareResponse));
  sinon.stub(oVClient.ServerProfiles, 'getAllServerProfiles').returns(Bluebird.resolve(serverProfileResponse));
  sinon.stub(oVClient.ServerProfileTemplates, 'getAllServerProfileTemplates').returns(Bluebird.resolve(serverProfileTemplateResponse));
  sinon.stub(oVClient.LogicalInterconnects, 'getAllLogicalInterconnects').returns(Bluebird.resolve(logicalInterconnectsResponse));  

  let robot = {adapterName: 'shell', on: function () { }, logger: {debug: function () {}, error: function () {}, info: function () {}}};
  new ovBrain(oVClient, robot, Lexer);

  it('getHardwareModel', () => {
    const result = getHardwareModel('/rest/server-hardware/eb13eab8-adsf');
    result.should.equal('BL460c Gen8 1');
  });

  it('getHardwareModel empty', () => {
    const result = getHardwareModel('/rest/server-profiles/eb13eab7');
    result.should.equal('');
  });

  it('getDeviceNameAndHyperLink SH', () => {
    const result = getDeviceNameAndHyperLink('/rest/server-hardware/eb13eab8-adsf');
    const expected = {deviceName: '0000A6610EE, bay 5', hyperlink: 'https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/eb13eab8-adsf?s_sid=LTE'};
    chai.expect(result).to.deep.equal(expected);
  });

  it('getDeviceNameAndHyperLink SP', () => {
    const result = getDeviceNameAndHyperLink('/rest/server-profiles/cc7b3c49-ef11');
    const expected = {deviceName: 'Profile101', hyperlink: 'https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/eb13eab8-adsf?s_sid=LTE'};
    chai.expect(result).to.deep.equal(expected);
  });

  it('getDeviceNameAndHyperLink SPT', () => {
    const result = getDeviceNameAndHyperLink('/rest/server-profile-templates/cc7b3c49-ef112');
    const expected = {deviceName: 'ProfileTemplate101', hyperlink: 'https://10.1.1.1/#/profile-templates/show/overview/r/rest/server-profile-templates/cc7b3c49-ef112?s_sid=LTE'};
    chai.expect(result).to.deep.equal(expected);
  });

  it('getDeviceNameAndHyperLink undef', () => {
    const result = getDeviceNameAndHyperLink('/rest/server-profiles/eb13eab99');
    const expected = {deviceName: '', hyperlink: ''};
    chai.expect(result).to.deep.equal(expected);
  });

  it('getLogicalInterconnectsMap', () => {
    const result = getLogicalInterconnectsMap();
    const expected = new Map();
    expected.set('/rest/interconnects/e', '/rest/logical-interconnects/47a1');
    expected.set('/rest/interconnects/f', '/rest/logical-interconnects/47a1');
    chai.expect(result).to.deep.equal(expected);
  });

});
