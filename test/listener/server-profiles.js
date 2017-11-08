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
const ServerProfilesListener = require('../../src/listener/server-profiles');
const ServerHardwareListener = require('../../src/listener/server-hardware');
const OneViewBrain = require('../../src/middleware/ov-brain');
const OVClient = require('../../src/oneview-sdk/ov-client');
const ResourceTransforms = require('../../src/listener/utils/resource-transforms');
const NamedRegExp = require('../../src/listener/named-regexp');

const chai = require('chai');
const sinon = require('sinon');
const Bluebird = require('bluebird');

chai.should();
const assert = chai.assert;

describe('ServerProfilesListener', () => {

  const profilesResponse = {
    members: [
      {
        type: "ServerProfileV6",
        uri: "/rest/server-profiles/1a94be5c",
        name: "profile",
        description: "",
        serialNumber: "VCGLPVN007",
        uuid: "1a94be5c",
        hyperlink: "https://0.0.0.0/#/profiles/show/overview/r/rest/server-profiles/1a94be5c?s_sid=LTIyNDcK",
        serverProfileTemplateHyperlink: "https://0.0.0.0/#/profile-templates/show/overview/r/rest/server-profile-templates/650449e6?s_sid=LTIyNDcK",
        serverHardwareHyperlink: "https://0.0.0.0/#/server-hardware/show/overview/r/rest/server-hardware/37333036?s_sid=LTIyNDcK",
        serverHardwareTypeHyperlink: "https://0.0.0.0/#/server-hardware-types/show/general/r/rest/server-hardware-types/30D74951?s_sid=LTIyNDcK",
        enclosureGroupHyperlink: "https://0.0.0.0/#/enclosuregroups/show/interconectbayconfiguration/r/rest/enclosure-groups/dfebe3a3?s_sid=LTIyNDcK",
        enclosureHyperlink: "https://0.0.0.0/#/enclosure/show/overview/r/rest/enclosures/09SGHX6J1?s_sid=LTIyNDcK",
        taskHyperlink: "https://0.0.0.0/#/activity/r/rest/tasks/85EDF0DA?s_sid=LTIyNDcK"
      }]
  };

  const robot = {adapterName: 'shell', on: function () { }, listen: function () {}, respond: function () {}, listenerMiddleware: function() {}, logger: {debug: function () {}, error: function () {}, info: function () {}}};

  const oneviewConfig = {
    hosts: []
  };
  const client = new OVClient(oneviewConfig, robot);

  sinon.stub(client.ServerHardware, 'getAllServerHardware').returns(Bluebird.resolve([]));
  sinon.stub(client.ServerProfiles, 'getAllServerProfiles').returns(Bluebird.resolve(profilesResponse));
  sinon.stub(client.ServerProfileTemplates, 'getAllServerProfileTemplates').returns(Bluebird.resolve([]));
  sinon.stub(client.LogicalInterconnects, 'getAllLogicalInterconnects').returns(Bluebird.resolve([]));

  const brain = new OneViewBrain(client, robot, {});
  const transform = new ResourceTransforms(robot, brain);

  const sh = new ServerHardwareListener(robot, client, transform, brain);

  it('constructor', (done) => {
    sinon.spy(robot, "respond");
    const serverProfilesListener = new ServerProfilesListener(robot, client, transform, sh, brain);

    let rgx0 = new NamedRegExp(serverProfilesListener.LIST_ALL);
    let rgx1 = new NamedRegExp(serverProfilesListener.LIST);
    let rgx2 = new NamedRegExp(serverProfilesListener.LIST_COMPLIANCE);
    let rgx3 = new NamedRegExp(serverProfilesListener.MAKE_COMPLIANT);
    let rgx4 = new NamedRegExp(serverProfilesListener.POWER_ON);
    let rgx5 = new NamedRegExp(serverProfilesListener.POWER_OFF);
    let rgx6 = new NamedRegExp(serverProfilesListener.LIST_STATUS);

    let constructorArgs = robot.respond.getCalls();

    rgx0.should.deep.equal(constructorArgs[0].args[0]);
    assert(typeof constructorArgs[0].args[2] === 'function');
    'bound ListServerProfiles'.should.equal(constructorArgs[0].args[2].name);
    assert.isFalse(constructorArgs[0].args[2].hasOwnProperty('prototype'));

    rgx1.should.deep.equal(constructorArgs[1].args[0]);
    assert(typeof constructorArgs[1].args[2] === 'function');
    'bound ListServerProfile'.should.equal(constructorArgs[1].args[2].name);
    assert.isFalse(constructorArgs[1].args[2].hasOwnProperty('prototype'));

    rgx2.should.deep.equal(constructorArgs[2].args[0]);
    assert(typeof constructorArgs[2].args[2] === 'function');
    assert(constructorArgs[2].args[2].name === 'bound ListServerProfileCompliancePreview');
    assert.isFalse(constructorArgs[2].args[2].hasOwnProperty('prototype'));

    rgx3.should.deep.equal(constructorArgs[3].args[0]);
    assert(typeof constructorArgs[3].args[2] === 'function');
    'bound HandleServerCompliantMessage'.should.equal(constructorArgs[3].args[2].name);
    assert.isFalse(constructorArgs[3].args[2].hasOwnProperty('prototype'));

    rgx4.should.deep.equal(constructorArgs[4].args[0]);
    assert(typeof constructorArgs[4].args[2] === 'function');
    'bound PowerOnServerProfile'.should.equal(constructorArgs[4].args[2].name);
    assert.isFalse(constructorArgs[4].args[2].hasOwnProperty('prototype'));

    rgx5.should.deep.equal(constructorArgs[5].args[0]);
    assert(typeof constructorArgs[5].args[2] === 'function');
    'bound PowerOffServerProfile'.should.equal(constructorArgs[5].args[2].name);
    assert.isFalse(constructorArgs[5].args[2].hasOwnProperty('prototype'));

    rgx6.should.deep.equal(constructorArgs[6].args[0]);
    assert(typeof constructorArgs[6].args[2] === 'function');
    'bound ListProfilesByStatus'.should.equal(constructorArgs[6].args[2].name);
    assert.isFalse(constructorArgs[6].args[2].hasOwnProperty('prototype'));

    assert(constructorArgs.length === 7);

    done();
  });

  it('test regexps', (done) => {
    const serverProfilesListener = new ServerProfilesListener(robot, client, transform, sh, brain);

    let rgx0 = new NamedRegExp(serverProfilesListener.LIST_ALL);
    let rgx1 = new NamedRegExp(serverProfilesListener.LIST);
    let rgx2 = new NamedRegExp(serverProfilesListener.LIST_COMPLIANCE);
    let rgx3 = new NamedRegExp(serverProfilesListener.MAKE_COMPLIANT);
    let rgx4 = new NamedRegExp(serverProfilesListener.POWER_ON);
    let rgx5 = new NamedRegExp(serverProfilesListener.POWER_OFF);
    let rgx6 = new NamedRegExp(serverProfilesListener.LIST_STATUS);

    assert.isTrue(rgx0.test('@bot list all profiles.'));
    assert.isTrue(rgx1.test('@bot list 0.0.0.0/rest/server-profiles/1a94be5c-46e1.'));
    assert.isTrue(rgx2.test('@bot list localhost/rest/server-profiles/1a94be5c-46e1 compliance preview.'));
    assert.isTrue(rgx3.test('@bot make 0.0.0.0/rest/server-profiles/1a94be5c-46e1 compliant.'));
    assert.isTrue(rgx4.test('@bot power on localhost/rest/server-profiles/1a94be5c-46e1.'));
    assert.isTrue(rgx5.test('@bot power off 0.0.0.0/rest/server-profiles/1a94be5c-46e1.'));
    assert.isTrue(rgx6.test('@bot show all ok profiles.'));
    assert.isTrue(rgx6.test('@bot show all critical profiles.'));
    assert.isTrue(rgx6.test('@bot show all disabled profiles.'));
    assert.isTrue(rgx6.test('@bot show all warning profiles.'));

    done();
  });

  it('list all profiles', (done) => {
    const serverProfilesListener = new ServerProfilesListener(robot, client, transform, sh, brain);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot show all server profiles.'}},
      count: 1,
      send: function () {}
    };
    sinon.spy(msg, "send");

    serverProfilesListener.ListServerProfiles(msg);

    const expectedJsonResults = JSON.stringify(profilesResponse, null, '  ');

    //sleep a momemt to wait for results
    setTimeout(() => {
      assert(msg.send.callCount === 1);
      expectedJsonResults.should.equal(msg.send.args[0][0]);
      done();
    }, 100);
  });

});
