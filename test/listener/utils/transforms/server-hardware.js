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
const ServerHardware = require('../../../../src/listener/utils/transforms/server-hardware');
const OneViewBrain = require('../../../../src/middleware/ov-brain');
const OVClient = require('../../../../src/oneview-sdk/ov-client');

const chai = require('chai');
const sinon = require('sinon');
const Bluebird = require('bluebird');

chai.should();

describe('ServerHardware', () => {

  const ServerHardwareResourceProfile = {
    type: "server-hardware-5",
    name: "0000A66103, bay 11",
    state: "ProfileApplied",
    category: "server-hardware",
    description: null,
    formFactor: "HalfHeight",
    locationUri: "/rest/enclosures/000",
    memoryMb: 4096,
    model: "Synergy 480 Gen10",
    serverGroupUri: "/rest/enclosure-groups/84da6697",
    serverHardwareTypeUri: "/rest/server-hardware-types/31C9613F",
    serverProfileUri: "/rest/server-profiles/31C9613F",
    serverProfileHyperlink: "https://0.0.0.0/#/server-profiles/show/overview/r/rest/server-profiles/31C9613F?s_sid=LTQ2OT",
    status: "OK",
    powerState: "On"
  };

  const ServerHardwareResource = {
    type: "server-hardware-5",
    name: "0000A66103, bay 11",
    state: "NoProfileApplied",
    category: "server-hardware",
    description: null,
    formFactor: "HalfHeight",
    locationUri: "/rest/enclosures/000",
    memoryMb: 4096,
    model: "Synergy 480 Gen10",
    serverGroupUri: "/rest/enclosure-groups/84da6697",
    serverHardwareTypeUri: "/rest/server-hardware-types/31C9613F",
    serverProfileUri: null,
    status: "OK",
    powerState: "On"
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
  sinon.stub(brain, 'getDeviceNameAndHyperLink').returns({deviceName: '0000A66103_b11 profile'});

  it('buildPlainTextOutput with profile', () => {
    let expected = "\t\u2022 State: ProfileApplied\n\t\u2022 Model: Synergy 480 Gen10\n\t\u2022 Power State: On\n\t\u2022 Profile: 0000A66103_b11 profile\n\t\u2022 Status: OK\n";
    const sh = new ServerHardware(ServerHardwareResourceProfile, brain);

    let result = sh.buildPlainTextOutput();

    expected.should.eql(result);
  });

  it('buildPlainTextHipchatOutput without profile', () => {
    let expected = "\t\u2022 State: NoProfileApplied\n\t\u2022 Model: Synergy 480 Gen10\n\t\u2022 Power State: On\n\t\u2022 Profile: Available for deployment\n\t\u2022 Status: OK\n";
    const sh = new ServerHardware(ServerHardwareResource, brain);

    let result = sh.buildPlainTextHipchatOutput();

    expected.should.eql(result);
  });

  it('buildPlainTextFlowdockOutput without profile', () => {
    let expected = "\t\u2022 **State**: NoProfileApplied\n\t\u2022 **Model**: Synergy 480 Gen10\n\t\u2022 **Power State**: On\n\t\u2022 **Profile**: Available for deployment\n\t\u2022 **Status**: OK\n";
    const sh = new ServerHardware(ServerHardwareResource, brain);

    let result = sh.buildPlainTextFlowdockOutput();

    expected.should.eql(result);
  });

  it('buildSlackFields with profile', () => {
    let expected = [{title: 'State', short: true, value: 'ProfileApplied'},
      {title: 'Model', short: true, value: 'Synergy 480 Gen10'},
      {title: 'Power State', short: true, value: 'On'},
      {title: 'Profile',
        short: true,
        value: '<https://0.0.0.0/#/server-profiles/show/overview/r/rest/server-profiles/31C9613F?s_sid=LTQ2OT|0000A66103_b11 profile>'}]

    const sh = new ServerHardware(ServerHardwareResourceProfile, brain);

    let result = sh.buildSlackFields();

    expected.should.eql(result);
  });

  it('buildSlackFields without profile', () => {
    let expected = [{title: 'State', short: true, value: 'NoProfileApplied'},
      {title: 'Model', short: true, value: 'Synergy 480 Gen10'},
      {title: 'Power State', short: true, value: 'On'},
      {title: 'Profile',
        short: true,
        value: 'Available for deployment'}]

    const sh = new ServerHardware(ServerHardwareResource, brain);

    let result = sh.buildSlackFields();

    expected.should.eql(result);
  });

});
