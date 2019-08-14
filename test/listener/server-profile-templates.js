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
const ServerProfileTemplateListener = require('../../src/listener/server-profile-templates');
const ServerProfile = require('../../src/listener/utils/transforms/server-profile');
const ServerHardwareListener = require('../../src/listener/server-hardware');
const ServerProfilesListener = require('../../src/listener/server-profiles');
const OneViewBrain = require('../../src/middleware/ov-brain');
const OVClient = require('../../src/oneview-sdk/ov-client');
const ResourceTransforms = require('../../src/listener/utils/resource-transforms');
const NamedRegExp = require('../../src/listener/named-regexp');
const PromiseFeedback = require('../../src/oneview-sdk/utils/emitter');

const chai = require('chai');
const sinon = require('sinon');
const Bluebird = require('bluebird');

chai.should();
const assert = chai.assert;

describe('ServerProfileTemplateListener', () => {

  const templatesResponse = {
    members: [{
      type: "ServerProfileTemplateV2",
      uri: "/rest/server-profile-templates/1a94be5c",
      name: "template",
      serverProfileDescription: "",
      serialNumberType: "VCGLPVN007",
      uuid: "1a94be5c",
      hyperlink: "https://0.0.0.0/#/profiles/show/overview/r/rest/server-profile-templates/1a94be5c?s_sid=LTIyNDcK",
      serverHardwareTypeHyperlink: "https://0.0.0.0/#/server-hardware-types/show/general/r/rest/server-hardware-types/30D74951?s_sid=LTIyNDcK",
      enclosureGroupHyperlink: "https://0.0.0.0/#/enclosuregroups/show/interconectbayconfiguration/r/rest/enclosure-groups/dfebe3a3?s_sid=LTIyNDcK",
      taskHyperlink: "https://0.0.0.0/#/activity/r/rest/tasks/85EDF0DA?s_sid=LTIyNDcK"
    }]
  };

  const profileResponse = {
    type: "ServerProfileV6",
    uri: "/rest/server-profiles/1a94be5c",
    name: "spt - Encl1, bay 4",
    description: "",
    serialNumber: "BCGLPVN00",
    serverProfileTemplateUri: "/rest/server-profile-templates/650449e6",
    templateCompliance: "Compliant",
    serverHardwareUri: null,
  };

  const profilesResponse = {
    members: [profileResponse]
  };

  let listeners = [];
  const robot = {
    name: 'bot',
    adapterName: 'shell',
    receive: function () {},
    on: function () { },
    listen: function (matcher, options) {listeners.push(matcher, options)},
    respond: function () {},
    listenerMiddleware: function() {},
    logger: {debug: function () {}, error: function () {}, info: function () {}}
  };

  const oneviewConfig = {
    hosts: []
  };
  const client = new OVClient(oneviewConfig, robot);

  sinon.stub(client.ServerProfiles, 'getAllServerProfiles').returns(Bluebird.resolve(profilesResponse));
  sinon.stub(client.ServerProfileTemplates, 'getAllServerProfileTemplates').returns(Bluebird.resolve(templatesResponse));

  const brain = new OneViewBrain(client, robot, {});
  const transform = new ResourceTransforms(robot, brain);

  const sh = new ServerHardwareListener(robot, client, transform, brain);
  const serverProfilesListener = new ServerProfilesListener(robot, client, transform, sh, brain);

  it('constructor', (done) => {
    sinon.spy(robot, "respond");
    const serverProfileTemplateListener = new ServerProfileTemplateListener(robot, client, transform, sh, serverProfilesListener, brain);

    let rgx0 = new NamedRegExp(serverProfileTemplateListener.LIST_ALL);
    let rgx1 = new NamedRegExp(serverProfileTemplateListener.LIST_AVAILABLE_TARGETS);
    let rgx2 = new NamedRegExp(serverProfileTemplateListener.LIST_DEPLOYED_PROFILES);
    let rgx3 = new NamedRegExp(serverProfileTemplateListener.CREATE_PROFILE_FROM_TEMPATE);
    let rgx4 = new NamedRegExp(serverProfileTemplateListener.GROW_TEMPLATE);
    let rgx5 = new NamedRegExp(serverProfileTemplateListener.UNDEPLOY_PROFILES_USING_TEMPLATE);
    let rgx6 = new NamedRegExp(serverProfileTemplateListener.UNDEPLOY_PROFILES_USING_SERVERS_IN_TEMPLATE);
    let rgx7 = new NamedRegExp(serverProfileTemplateListener.FIX_PROFILE_COMPLIANCE);

    let constructorArgs = robot.respond.getCalls();

    rgx0.should.deep.equal(constructorArgs[0].args[0]);
    assert(typeof constructorArgs[0].args[2] === 'function');
    'bound ListServerProfileTemplates'.should.equal(constructorArgs[0].args[2].name);
    assert.isFalse(constructorArgs[0].args[2].hasOwnProperty('prototype'));

    rgx1.should.deep.equal(constructorArgs[1].args[0]);
    assert(typeof constructorArgs[1].args[2] === 'function');
    'bound GetAvailableTargets'.should.equal(constructorArgs[1].args[2].name);
    assert.isFalse(constructorArgs[1].args[2].hasOwnProperty('prototype'));

    rgx2.should.deep.equal(constructorArgs[2].args[0]);
    assert(typeof constructorArgs[2].args[2] === 'function');
    assert(constructorArgs[2].args[2].name === 'bound GetDeployedProfiles');
    assert.isFalse(constructorArgs[2].args[2].hasOwnProperty('prototype'));

    rgx3.should.deep.equal(constructorArgs[3].args[0]);
    assert(typeof constructorArgs[3].args[2] === 'function');
    'bound DeployProfile'.should.equal(constructorArgs[3].args[2].name);
    assert.isFalse(constructorArgs[3].args[2].hasOwnProperty('prototype'));

    rgx4.should.deep.equal(constructorArgs[4].args[0]);
    assert(typeof constructorArgs[4].args[2] === 'function');
    'bound DeployProfile'.should.equal(constructorArgs[4].args[2].name);
    assert.isFalse(constructorArgs[4].args[2].hasOwnProperty('prototype'));

    rgx5.should.deep.equal(constructorArgs[5].args[0]);
    assert(typeof constructorArgs[5].args[2] === 'function');
    'bound UnDeployProfiles'.should.equal(constructorArgs[5].args[2].name);
    assert.isFalse(constructorArgs[5].args[2].hasOwnProperty('prototype'));

    rgx6.should.deep.equal(constructorArgs[6].args[0]);
    assert(typeof constructorArgs[6].args[2] === 'function');
    'bound UnDeployProfiles'.should.equal(constructorArgs[6].args[2].name);
    assert.isFalse(constructorArgs[6].args[2].hasOwnProperty('prototype'));

    rgx7.should.deep.equal(constructorArgs[7].args[0]);
    assert(typeof constructorArgs[7].args[2] === 'function');
    'bound FixCompliance'.should.equal(constructorArgs[7].args[2].name);
    assert.isFalse(constructorArgs[7].args[2].hasOwnProperty('prototype'));

    assert(constructorArgs.length === 8);

    done();
  });

  it('test regexps', (done) => {
    const serverProfileTemplateListener = new ServerProfileTemplateListener(robot, client, transform, sh, serverProfilesListener, brain);

    let rgx0 = new NamedRegExp(serverProfileTemplateListener.LIST_ALL);
    let rgx1 = new NamedRegExp(serverProfileTemplateListener.LIST_AVAILABLE_TARGETS);
    let rgx2 = new NamedRegExp(serverProfileTemplateListener.LIST_DEPLOYED_PROFILES);
    let rgx3 = new NamedRegExp(serverProfileTemplateListener.CREATE_PROFILE_FROM_TEMPATE);
    let rgx4 = new NamedRegExp(serverProfileTemplateListener.GROW_TEMPLATE);
    let rgx5 = new NamedRegExp(serverProfileTemplateListener.UNDEPLOY_PROFILES_USING_TEMPLATE);
    let rgx6 = new NamedRegExp(serverProfileTemplateListener.UNDEPLOY_PROFILES_USING_SERVERS_IN_TEMPLATE);
    let rgx7 = new NamedRegExp(serverProfileTemplateListener.FIX_PROFILE_COMPLIANCE);

    assert.isTrue(rgx0.test('@bot list all templates.'));
    assert.isTrue(rgx1.test('@bot show available targets for localhost/rest/server-profile-templates/1243.'));
    assert.isTrue(rgx2.test('@bot show profiles using localhost/rest/server-profile-templates/1243.'));
    assert.isTrue(rgx3.test('@bot create a profile from localhost/rest/server-profile-templates/1243.'));
    assert.isTrue(rgx4.test('@bot grow localhost/rest/server-profile-templates/1243 by 4 profiles.'));
    assert.isTrue(rgx5.test('@bot remove 1 profile from localhost/rest/server-profile-templates/1243.'));
    assert.isTrue(rgx6.test('@bot remove 1 server from localhost/rest/server-profile-templates/1243.'));
    assert.isTrue(rgx7.test('@bot fix compliance for localhost/rest/server-profile-templates/1243.'));
        
    done();
  });

  it('test MakeProfileCompliant for unassigned profile', (done) => {
    const profile = new ServerProfile(profileResponse, brain);

    const serverProfileTemplateListener = new ServerProfileTemplateListener(robot, client, transform, sh, serverProfilesListener, brain);

    let msg = {
      host: {},
      serverId: 1
    };

    let spy1 = sinon.spy(serverProfileTemplateListener, "PowerOffHardware");
    let spy2 = sinon.spy(serverProfilesListener, "MakeServerProfileCompliant");

    let stub1 = sinon.stub(client.ServerProfiles, 'updateServerProfileCompliance').returns(
      new PromiseFeedback((feedback) => {
          return Bluebird.resolve(profileResponse);
      })
    );

    serverProfileTemplateListener.MakeProfileCompliant(profile, msg);

    assert(serverProfileTemplateListener.PowerOffHardware.callCount === 0);
    assert(serverProfilesListener.MakeServerProfileCompliant.callCount === 1);

    spy1.restore();
    spy2.restore();
    stub1.restore();

    done();
  });

  it('test MakeProfileCompliant for assigned profile', (done) => {
    profileResponse.serverHardwareUri = "/rest/server-profiles/1a94be5c";
    const profile = new ServerProfile(profileResponse, brain);

    const serverProfileTemplateListener = new ServerProfileTemplateListener(robot, client, transform, sh, serverProfilesListener, brain);
    let sp1 = sinon.spy(serverProfileTemplateListener, 'PowerOffHardware');

    let msg = {
      host: {},
      serverId: 1,
      send: function() {}
    };

    sinon.stub(client.ServerHardware, 'setPowerState').returns(
      new PromiseFeedback((feedback) => {
          return Bluebird.resolve(profileResponse);
      })
    );

    sinon.stub(serverProfilesListener, 'MakeServerProfileCompliant').returns(
      new PromiseFeedback((feedback) => {
          return Bluebird.resolve(profileResponse);
      })
    );

    serverProfileTemplateListener.MakeProfileCompliant(profile, msg);

    assert(sp1.calledOnce);

    sp1.restore();
    done();
  });
});
