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
const Alert = require('../../../../src/listener/utils/transforms/alert');

const chai = require('chai');

chai.should();

describe('Alert', () => {

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

  it('buildPlainTextHipchatOutput', () => {
    let expected = "\t\u2022 Description: The server has been powered off.\n\t\u2022 Resource: 0000A66101, bay 3\n\t\u2022 Alert State: OK\n\t\u2022 Severity: OK\n"
    const alert = new Alert(AlertResource);

    let result = alert.buildPlainTextHipchatOutput();

    expected.should.eql(result);
  });

  it('buildPlainTextFlowdockOutput', () => {
    let expected = "\t\u2022 **Description**: The server has been powered off.\n\t\u2022 **Resource**: 0000A66101, bay 3\n\t\u2022 **Alert State**: OK\n\t\u2022 **Severity**: OK\n"
    const alert = new Alert(AlertResource);

    let result = alert.buildPlainTextFlowdockOutput();

    expected.should.eql(result);
  });

  it('buildSlackFields', () => {
    let expected = [ { title: 'Description',
        short: true,
        value: 'The server has been powered off.' },
      { title: 'Resource',
        short: true,
        value: '<https://0.0.0.0/#/server-hardware/show/overview/r/rest/server-hardware/30373737?s_sid=LTQ2OT|0000A66101, bay 3>' },
      { title: 'Alert State', short: true, value: 'OK' } ];
    const alert = new Alert(AlertResource);

    let result = alert.buildSlackFields();

    expected.should.eql(result);
  });

});
