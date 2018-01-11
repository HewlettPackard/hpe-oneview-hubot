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
const ServerProfileCompliancePreview = require('../../../../src/listener/utils/transforms/server-profile-compliance-preview');

const chai = require('chai');

chai.should();

describe('ServerProfileCompliancePreview', () => {

  const ServerProfileCompliancePreviewResource = {
    type: "ServerProfileCompliancePreviewV1",
    isOnlineUpdate: false,
    automaticUpdates: [
      "Create a connection to network {\"name\":\"eth\", \"uri\":\"/rest/ethernet-networks/95717f69\"} with id 2 on Mezzanine (Mezz) 3:2."
    ],
    manualUpdates: []
  };

  it('buildPlainTextHipchatOutput', () => {
    let expected = "Automatic Updates:\nCreate a connection to network {\"name\":\"eth\", \"uri\":\"/rest/ethernet-networks/95717f69\"} with id 2 on Mezzanine (Mezz) 3:2.\n";
    const compliance = new ServerProfileCompliancePreview(ServerProfileCompliancePreviewResource);

    let result = compliance.buildPlainTextHipchatOutput();
    expected.should.eql(result);
  });

  it('buildPlainTextFlowdockOutput', () => {
    let expected = "**Automatic Updates**:\nCreate a connection to network {\"name\":\"eth\", \"uri\":\"/rest/ethernet-networks/95717f69\"} with id 2 on Mezzanine (Mezz) 3:2.\n";
    const compliance = new ServerProfileCompliancePreview(ServerProfileCompliancePreviewResource);

    let result = compliance.buildPlainTextFlowdockOutput();
    expected.should.eql(result);
  });

  it('buildSlackFields', () => {
    let expected = [{title: 'Automatic Updates',
      short: false,
      value: 'Create a connection to network {"name":"eth", "uri":"/rest/ethernet-networks/95717f69"} with id 2 on Mezzanine (Mezz) 3:2.' },
      {title: 'Manual Updates', short: false, value: '' }];

    const compliance = new ServerProfileCompliancePreview(ServerProfileCompliancePreviewResource);

    let result = compliance.buildSlackFields();

    expected.should.eql(result);
  });

});
