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

});
