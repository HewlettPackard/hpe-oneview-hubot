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
const ServerProfileTemplate = require('../../../../src/listener/utils/transforms/server-profile-template');

const chai = require('chai');

chai.should();

describe('ServerProfileTemplate', () => {

  const ServerProfileTemplateResource = {
    type: "ServerProfileTemplateV2",
    uri: "/rest/server-profile-templates/40e9d6af",
    name: "synergy1",
    description: "A server profile template",
    serverProfileDescription: "",
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

  it('buildPlainTextOutput', () => {
    let expected = '\t\u2022 Description: A server profile template\n';
    const template = new ServerProfileTemplate(ServerProfileTemplateResource);

    let result = template.buildPlainTextOutput();
    expected.should.eql(result);
  });

  it('buildSlackFields', () => {
    let expected = [{ title: 'Description',
      short: true,
      value: 'A server profile template' }];

    const template = new ServerProfileTemplate(ServerProfileTemplateResource);

    let result = template.buildSlackFields();
    expected.should.eql(result);
  });

});
