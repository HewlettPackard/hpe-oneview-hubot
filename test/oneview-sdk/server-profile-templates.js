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
const ServerProfileTemplates = require('../../src/oneview-sdk/server-profile-templates');
const PromiseFeedback = require('../../src/oneview-sdk/utils/emitter');

const chai = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const Bluebird = require('bluebird');

chai.should();

describe('Server Profile Templates', () => {
  let oVClient;
  let templates;

  beforeEach(() => {
    let oneviewConfig = {
      hosts: [{
          applianceIp: "localhost",
          apiVersion: 300,
          userName: "admin",
          password: "password",
          doProxy: false,
          proxyHost: "localhost",
          proxyPort: 0
        }],
      notificationsFilters: [{"severity": "Critical"}],
      pollingInterval: 30,
      readOnly: true,
      notificationsRoom: "room"
    };
    oVClient = new OVClient(oneviewConfig, {});
    templates = new ServerProfileTemplates(oVClient);
  });

  const serverProfileTemplateResponse = {
    type: "ServerProfileTemplateV2",
    uri: "/rest/server-profile-templates/650449e6",
    name: "spt",
    description: "",
    serverProfileDescription: "",
    serverHardwareTypeUri: "/rest/server-hardware-types/30D74951",
    enclosureGroupUri: "/rest/enclosure-groups/dfebe3a3",
    affinity: "Bay",
    serialNumberType: "Virtual",
    category: "server-profile-templates",
    status: "OK",
    state: null,
    hyperlink: "https://localhost/#/profile-templates/show/overview/r/rest/server-profile-templates/650449e6?s_sid=NTAxNDIx",
    serverHardwareTypeHyperlink: "https://localhost/#/server-hardware-types/show/general/r/rest/server-hardware-types/30D74951?s_sid=NTAxNDIx",
    enclosureGroupHyperlink: "https://localhost/#/enclosuregroups/show/interconectbayconfiguration/r/rest/enclosure-groups/dfebe3a3?s_sid=NTAxNDIx"
  };

  const serverProfileTemplatesResponse = {
    members: [serverProfileTemplateResponse]
  };

  const targetsResponse = {
    type: 'AvailableTargetsV2',
    targets: [ { enclosureGroupName: 'dcs',
         enclosureName: '0000A',
         enclosureUri: '/rest/enclosures/0A66101',
         enclosureBay: 8,
         serverHardwareName: '0000A66101, bay 8',
         serverHardwareUri: '/rest/server-hardware/30303437',
         serverHardwareTypeName: 'SY 480 Gen9 1',
         serverHardwareTypeUri: '/rest/server-hardware-types/7863984',
         enclosureGroupUri: '/rest/enclosure-groups/84da669',
         powerState: 'Off',
         formFactor: [Object],
         enclosureHyperlink: 'https://localhost/#/enclosure/show/overview/r/rest/enclosures/0A66101?s_sid=LTgxOTk2N',
         serverHardwareHyperlink: 'https://localhost/#/server-hardware/show/overview/r/rest/server-hardware/30303437?s_sid=LTgxOTk2N',
         serverHardwareTypeHyperlink: 'https://localhost/#/server-hardware-types/show/general/r/rest/server-hardware-types/7863984?s_sid=LTgxOTk2N',
         enclosureGroupHyperlink: 'https://localhost/#/enclosuregroups/show/interconectbayconfiguration/r/rest/enclosure-groups/84da669?s_sid=LTgxOTk2N' } ],
    uri: '/rest/server-profiles/available-targets',
    category: 'available-targets',
    hyperlink: 'https://localhost/#/profiles/show/overview/r/rest/server-profiles/available-targets?s_sid=LTgxOTk2N'
  };

  it('get all templates', (done) => {
    let stub = sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileTemplatesResponse));

    templates.getAllServerProfileTemplates().then(function(data) {
      data.members[0].name.should.equal("spt");
      data.members[0].type.should.equal("ServerProfileTemplateV2");
      data.members[0].status.should.equal("OK");
    }).then(() => done(), done);

    stub.restore();
  });

  it('get template', (done) => {
    let stub = sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileTemplateResponse));

    templates.getServerProfileTemplate('localhost', '650449e6').then(function(data) {
      data.name.should.equal("spt");
      data.type.should.equal("ServerProfileTemplateV2");
      data.status.should.equal("OK");
    }).then(() => done(), done);

    stub.restore();
  });

  it('get available targets', (done) => {
    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileTemplateResponse));
    sinon.stub(oVClient.ServerProfiles, 'getAvailableTargets').returns(Bluebird.resolve(targetsResponse));

    templates.getAvailableTargets('localhost', '650449e6', (spt) => { template = spt; }).then(function(data) {
      data.length.should.equal(1);
      data[0].enclosureName.should.equal('0000A');
      data[0].enclosureBay.should.equal(8)
    }).then(() => done(), done);
  });

  it('deploy profile', (done) => {
    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(serverProfileTemplateResponse));
    sinon.stub(oVClient.ServerProfiles, 'createServerProfile').returns(
      new PromiseFeedback((feedback) => {
          return Bluebird.resolve({type: 'ServerProfileV5'});
      })
    );

    templates.deployProfile('localhost', 'templateUri', 'serverHardwareUri', 'name').then(function(data) {
      data.type.should.equal('ServerProfileV5')
    }).then(() => done(), done);
  });

  it('get profiles using template', (done) => {
    sinon.stub(oVClient.getConnections().get('localhost'), '__http__').returns(
      Bluebird.resolve(
        {
          resource: serverProfileTemplateResponse,
          children: {server_profile_template_to_server_profiles: [{resource: {type: 'ServerProfileV5', uri: '/rest/server-profiles/asdf123aA'}}]}
        }
      )
    );
    sinon.stub(oVClient.ServerProfiles, 'getServerProfile').returns({type: 'ServerProfileV5', uri: '/rest/server-profiles/asdf123aA'});

    templates.getProfilesUsingTemplate('localhost', 'templateUri', (target) => { resource = target; }).then(function(data) {
      data[0].type.should.equal('ServerProfileV5');    
    }).then(() => done(), done);
  });

});
