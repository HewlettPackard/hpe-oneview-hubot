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
const ServerProfile = require('../../../../src/listener/utils/transforms/server-profile');
const OneViewBrain = require('../../../../src/middleware/ov-brain');
const OVClient = require('../../../../src/oneview-sdk/ov-client');

const chai = require('chai');
const sinon = require('sinon');
const Bluebird = require('bluebird');

chai.should();

describe('ServerProfile', () => {

  const ServerProfileResourceHardware = {
    type: "ServerProfileV6",
    uri: "/rest/server-profiles/1a94be5c",
    name: "spt - Encl1, bay 4",
    description: "",
    serialNumber: "BCGLPVN00",
    serverProfileTemplateUri: "/rest/server-profile-templates/650449e6",
    templateCompliance: "Compliant",
    serverHardwareUri: "/rest/server-hardware/37333036",
    serverHardwareTypeUri: "/rest/server-hardware-types/30D74951",
    enclosureGroupUri: "/rest/enclosure-groups/dfebe3a3",
    enclosureUri: "/rest/enclosures/09S",
    status: "OK",
    affinity: "Bay",
    hyperlink: "https://0.0.0.0/#/profiles/show/overview/r/rest/server-profiles/1a94be5c?s_sid=MjA4Mj",
    serverProfileTemplateHyperlink: "https://0.0.0.0/#/profile-templates/show/overview/r/rest/server-profile-templates/650449e6?s_sid=MjA4Mj",
    serverHardwareHyperlink: "https://0.0.0.0/#/server-hardware/show/overview/r/rest/server-hardware/37333036?s_sid=MjA4Mj",
    serverHardwareTypeHyperlink: "https://0.0.0.0/#/server-hardware-types/show/general/r/rest/server-hardware-types/30D74951?s_sid=MjA4Mj",
    enclosureGroupHyperlink: "https://0.0.0.0/#/enclosuregroups/show/interconectbayconfiguration/r/rest/enclosure-groups/dfebe3a3?s_sid=MjA4Mj",
    enclosureHyperlink: "https://0.0.0.0/#/enclosure/show/overview/r/rest/enclosures/09S?s_sid=MjA4Mj"
  };

  const ServerProfileResource = {
    type: "ServerProfileV6",
    uri: "/rest/server-profiles/1a94be5c",
    name: "spt - Encl1, bay 4",
    description: "",
    serialNumber: "BCGLPVN00",
    serverProfileTemplateUri: "/rest/server-profile-templates/650449e6",
    templateCompliance: "Compliant",
    serverHardwareUri: null,
    serverHardwareTypeUri: "/rest/server-hardware-types/30D74951",
    enclosureGroupUri: "/rest/enclosure-groups/dfebe3a3",
    enclosureUri: "/rest/enclosures/09S",
    status: "OK",
    affinity: "Bay",
    hyperlink: "https://0.0.0.0/#/profiles/show/overview/r/rest/server-profiles/1a94be5c?s_sid=MjA4Mj",
    serverProfileTemplateHyperlink: "https://0.0.0.0/#/profile-templates/show/overview/r/rest/server-profile-templates/650449e6?s_sid=MjA4Mj",
    serverHardwareTypeHyperlink: "https://0.0.0.0/#/server-hardware-types/show/general/r/rest/server-hardware-types/30D74951?s_sid=MjA4Mj",
    enclosureGroupHyperlink: "https://0.0.0.0/#/enclosuregroups/show/interconectbayconfiguration/r/rest/enclosure-groups/dfebe3a3?s_sid=MjA4Mj",
    enclosureHyperlink: "https://0.0.0.0/#/enclosure/show/overview/r/rest/enclosures/09S?s_sid=MjA4Mj"
  };

  const robot = {adapterName: 'shell', on: function () { }, logger: {debug: function () {}, error: function () {}, info: function () {}}};

  const oneviewConfig = {
    hosts: []
  };
  const oVClient = new OVClient(oneviewConfig, robot);
  sinon.stub(oVClient.ServerHardware, 'getAllServerHardware').returns(Bluebird.resolve([]));
  sinon.stub(oVClient.ServerProfiles, 'getAllServerProfiles').returns(Bluebird.resolve([]));
  sinon.stub(oVClient.ServerProfileTemplates, 'getAllServerProfileTemplates').returns(Bluebird.resolve([]));
  sinon.stub(oVClient.LogicalInterconnects, 'getAllLogicalInterconnects').returns(Bluebird.resolve([]));

  const brain = new OneViewBrain(oVClient, robot, {});
  sinon.stub(brain, 'getDeviceNameAndHyperLink').returns({deviceName: '0000A66101, bay 8'});
  sinon.stub(brain, 'getHardwareModel').returns('HPE Synergy 480 Gen9 Compute Module');

  it('buildPlainTextHipchatOutput with hardware', () => {
    let expected = "\t\u2022 Affinity: Bay\n\t\u2022 Serial Number: BCGLPVN00\n\t\u2022 Server Hardware: 0000A66101, bay 8\n\t\u2022 Hardware Model: HPE Synergy 480 Gen9 Compute Module\n\t\u2022 Status: OK\n";
    const profile = new ServerProfile(ServerProfileResourceHardware, brain);

    let result = profile.buildPlainTextHipchatOutput();
    expected.should.eql(result);
  });

  it('buildPlainTextHipchatOutput without hardware', () => {
    let expected = "\t\u2022 Affinity: Bay\n\t\u2022 Serial Number: BCGLPVN00\n\t\u2022 Status: OK\n";
    const profile = new ServerProfile(ServerProfileResource, brain);

    let result = profile.buildPlainTextHipchatOutput();
    expected.should.eql(result);
  });

  it('buildPlainTextFlowdockOutput with hardware', () => {
    let expected = "\t\u2022 **Affinity**: Bay\n\t\u2022 **Serial Number**: BCGLPVN00\n\t\u2022 **Server Hardware**: 0000A66101, bay 8\n\t\u2022 **Hardware Model**: HPE Synergy 480 Gen9 Compute Module\n\t\u2022 **Status**: OK\n";
    const profile = new ServerProfile(ServerProfileResourceHardware, brain);

    let result = profile.buildPlainTextFlowdockOutput();
    expected.should.eql(result);
  });

  it('buildPlainTextFlowdockOutput without hardware', () => {
    let expected = "\t\u2022 **Affinity**: Bay\n\t\u2022 **Serial Number**: BCGLPVN00\n\t\u2022 **Status**: OK\n";
    const profile = new ServerProfile(ServerProfileResource, brain);

    let result = profile.buildPlainTextFlowdockOutput();
    expected.should.eql(result);
  });

  it('buildSlackFields with hardware', () => {
    let expected = [{ title: 'Affinity', short: true, value: 'Bay'},
      {title: 'Serial Number', short: true, value: 'BCGLPVN00'},
      {title: 'Server Hardware',
        short: true,
        value: '<https://0.0.0.0/#/server-hardware/show/overview/r/rest/server-hardware/37333036?s_sid=MjA4Mj|0000A66101, bay 8>'},
      {title: 'Hardware Model',
        short: true,
        value: 'HPE Synergy 480 Gen9 Compute Module'}];

    const profile = new ServerProfile(ServerProfileResourceHardware, brain);

    let result = profile.buildSlackFields();
    expected.should.eql(result);
  });

  it('buildSlackFields without hardware', () => {
    let expected = [{ title: 'Affinity', short: true, value: 'Bay'},
      {title: 'Serial Number', short: true, value: 'BCGLPVN00'}];

    const profile = new ServerProfile(ServerProfileResource, brain);

    let result = profile.buildSlackFields();
    expected.should.eql(result);
  });
});
