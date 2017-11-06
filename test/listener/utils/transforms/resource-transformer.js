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
const transform = require('../../../../src/listener/utils/transforms/resource-transformer');

const chai = require('chai');

chai.should();

describe('Transform', () => {

  const ServerHardwareResource = {
    type: "server-hardware-5",
    name: "0000A66103, bay 11",
    state: "NoProfileApplied",
    category: "server-hardware",
    description: null,
    model: "Synergy 480 Gen10",
    serverGroupUri: "/rest/enclosure-groups/84da6697",
    serverHardwareTypeUri: "/rest/server-hardware-types/31C9613F",
    serverProfileUri: null,
    status: "OK",
    powerState: "On"
  };

  const AlertResource = {
    type: 'AlertResourceV3',
    severity: 'OK',
    alertState: 'OK',
    taskHyperlink: '',
    associatedResource: {
      resourceName: "0000A66101, bay 3",
      resourceUri: "/rest/server-hardware/30373737",
      resourceCategory: "server-hardware",
      associationType: "HAS_A",
      resourceHyperlink: "https://0.0.0.0/#/server-hardware/show/overview/r/rest/server-hardware/30373737?s_sid=LTQ2OT"
    },
    description: "The server has been powered off.",
    hyperlink: "https://0.0.0.0/#/activity/r/rest/alerts/5483?s_sid=LTQ2OT",
  };

  const ServerProfileResource = {
    type: "ServerProfileV6",
    uri: "/rest/server-profiles/1a94be5c",
    name: "spt - Encl1, bay 4",
    description: "",
    serialNumber: "BCGLPVN00",
    serverProfileTemplateUri: "/rest/server-profile-templates/650449e6",
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

  const ServerProfileCompliancePreviewResource = {
    type: "ServerProfileCompliancePreviewV1",
    isOnlineUpdate: false,
    automaticUpdates: [
      "Create a connection to network {\"name\":\"eth\", \"uri\":\"/rest/ethernet-networks/95717f69\"} with id 2 on Mezzanine (Mezz) 3:2."
    ],
    manualUpdates: []
  };

  const ServerProfileTemplateResource = {
    type: "ServerProfileTemplateV2",
    uri: "/rest/server-profile-templates/40e9d6af",
    name: "synergy1",
    description: "A server profile template",
    serverHardwareTypeUri: "/rest/server-hardware-types/7863984F",
    enclosureGroupUri: "/rest/enclosure-groups/84da6697",
    affinity: "Bay",
    serialNumberType: "Virtual",
    status: "OK",
    state: null,
    hyperlink: "https://0.0.0.0/#/profile-templates/show/overview/r/rest/server-profile-templates/40e9d6af?s_sid=LTc2",
    serverHardwareTypeHyperlink: "https://0.0.0.0/#/server-hardware-types/show/general/r/rest/server-hardware-types/7863984F?s_sid=LTc2",
    enclosureGroupHyperlink: "https://0.0.0.0/#/enclosuregroups/show/interconectbayconfiguration/r/rest/enclosure-groups/84da6697?s_sid=LTc2"
  };

  it('server hardware', () => {
    let expected = {
      type: 'server-hardware-5',
      status: 'OK',
      state: 'NoProfileApplied',
      description: null,
      hyperlink: undefined,
      name: '0000A66103, bay 11',
      model: 'Synergy 480 Gen10',
      powerState: 'On',
      serverProfileUri: null,
      serverProfileHyperlink: undefined
    };

    let result = transform(ServerHardwareResource, {});
    expected.should.eql(result);
  });

  it('alert', () => {
    let expected = {
      type: 'AlertResourceV3',
      status: undefined,
      state: undefined,
      description: 'The server has been powered off.',
      hyperlink: 'https://0.0.0.0/#/activity/r/rest/alerts/5483?s_sid=LTQ2OT',
      associatedResource:
       { resourceName: '0000A66101, bay 3',
         resourceUri: '/rest/server-hardware/30373737',
         resourceCategory: 'server-hardware',
         associationType: 'HAS_A',
         resourceHyperlink: 'https://0.0.0.0/#/server-hardware/show/overview/r/rest/server-hardware/30373737?s_sid=LTQ2OT' },
      severity: 'OK',
      alertState: 'OK',
      taskHyperlink: ''
    };

    let result = transform(AlertResource, {});
    expected.should.eql(result);
  });

  it('server profile', () => {
    let expected = {
      type: 'ServerProfileV6',
      status: 'OK',
      state: undefined,
      description: '',
      hyperlink: 'https://0.0.0.0/#/profiles/show/overview/r/rest/server-profiles/1a94be5c?s_sid=MjA4Mj',
      name: 'spt - Encl1, bay 4',
      affinity: 'Bay',
      serialNumber: 'BCGLPVN00',
      serverHardwareUri: null,
      serverHardwareHyperlink: undefined
    };

    let result = transform(ServerProfileResource, {});
    expected.should.eql(result);
  });

  it('server profile compliance', () => {
    let expected = {
      type: 'ServerProfileCompliancePreviewV1',
      status: 'Warning',
      state: undefined,
      description: undefined,
      hyperlink: undefined,
      isOnlineUpdate: false,
      automaticUpdates: [ 'Create a connection to network {"name":"eth", "uri":"/rest/ethernet-networks/95717f69"} with id 2 on Mezzanine (Mezz) 3:2.' ],
      manualUpdates: [],
      pretext: 'The preview of manual and automatic updates required to make the server profile consistent with its template.'
    };

    let result = transform(ServerProfileCompliancePreviewResource, {});
    expected.should.eql(result);
  });

  it('server profile template', () => {
    let expected = {
      type: 'ServerProfileTemplateV2',
      status: 'OK',
      state: null,
      description: 'A server profile template',
      hyperlink: 'https://0.0.0.0/#/profile-templates/show/overview/r/rest/server-profile-templates/40e9d6af?s_sid=LTc2',
      name: 'synergy1'
    };

    let result = transform(ServerProfileTemplateResource, {});
    expected.should.eql(result);
  });

});
