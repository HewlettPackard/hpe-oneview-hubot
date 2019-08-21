/*
(c) Copyright 2016-2019 Hewlett Packard Enterprise Development LP

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
const ServerHardwareListener = require('../../src/listener/server-hardware');
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

describe('ServerHardware', function() {
  this.timeout(19000);

  let serverHardwareResponseCritical = {
    type: "server-hardware",
    name: "0000A6610EE, bay 5",
    powerState: "Off",
    status: "Critical",
    uri: "/rest/server-hardware/eb13eab8-adsf",
    model: "BL460c Gen8 1",
    serialNumber: "1234",
    hyperlink: "https://localhost/#/server-hardware/show/overview/r/rest/server-hardware/eb13eab8-adsf?s_sid=LTE"
  };

  let serverHardwareResponseOk = {
    type: "server-hardware",
    name: "0000A6610EE, bay 5",
    powerState: "Off",
    status: "Ok",
    assetTag: "1234",
    uuidState: "On",
    uri: "/rest/server-hardware/eb13eab8-adsf",
    model: "BL460c Gen8 1",
    serialNumber: "1234",
    hyperlink: "https://localhost/#/server-hardware/show/overview/r/rest/server-hardware/eb13eab8-adsf?s_sid=LTE",
    serverInterconnectPortLinks: [
      '/rest/interconnects/aeb17900/statistics/d7',
      '/rest/interconnects/6a07ee2b/statistics/d7'
    ]
  };

  let serverHardwaresResponseOk = {
    type: "server-hardware-list",
    category: "server-hardware",
    count: 1,
    members: [serverHardwareResponseOk]
  };

  let serverHardwaresResponseCritical = {
    type: "server-hardware-list",
    category: "server-hardware",
    count: 1,
    members: [serverHardwareResponseCritical]
  };

  let serverHardwareUtilization = {
    metricList: [
      {metricName: 'CpuAverageFreq',
       metricCapacity: null,
       metricSamples: [[1511300700000, 21 ], [1511300400000, 21 ]] },
      {metricName: 'CpuUtilization',
       metricCapacity: 100,
       metricSamples: [[1511300700000, 11 ], [1511300400000, 12 ]]}
     ],
    resolution: 300000,
    isFresh: false,
    uri: '/rest/server-hardware/36343537',
    hyperlink: 'https://localhost/#/server-hardware/show/overview/r/rest/server-hardware/36343537?s_sid=LTE1M'
  };

  let serverNetworkUtilization = [{
    advancedStatistics: {
      type: 'AdvancedStatistics',
      portNumber: 7,
      resetTimeEpoch: null,
      linkChanges: null,
      receiveKilobitsPerSec: '96:96:96:96:96:96:96:96:96:96:96:96',
      transmitKilobitsPerSec: 'NA:NA:NA:NA:NA:NA:NA:NA:NA:NA:NA:NA',
      receiveKilobytesPerSec: '12:12:12:12:12:12:12:12:12:12:12:12',
      transmitKilobytesPerSec: 'NA:NA:NA:NA:NA:NA:NA:NA:NA:NA:NA:NA',
      receivePacketsPerSec: '073:072:070:072:070:070:075:070:072:070:070:075',
      transmitPacketsPerSec: 'NA:NA:NA:NA:NA:NA:NA:NA:NA:NA:NA:NA',
      receiveNonunicastPacketsPerSec: '73:72:70:72:70:70:75:70:72:70:70:75',
      transmitNonunicastPacketsPerSec: 'NA:NA:NA:NA:NA:NA:NA:NA:NA:NA:NA:NA'}
  },
  {
    sampleInterval: 300
  }];

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

  // capture dialog liseners
  let listeners = [];

  const oneviewConfig = {
    hosts: []
  };
  const client = new OVClient(oneviewConfig, robot);
  const brain = new OneViewBrain(client, robot, {});
  const transform = new ResourceTransforms(robot, brain);

  const err = {
    error: {errorCode: 'OOPS'}
  };

  afterEach(function () {
    client.readOnly = false;
    listeners = [];
  });

  it('constructor', (done) => {
    let spy = sinon.spy(robot, "respond");
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let rgx0 = new NamedRegExp(serverHardwareListener.POWER_ON);
    let rgx1 = new NamedRegExp(serverHardwareListener.POWER_OFF);
    let rgx2 = new NamedRegExp(serverHardwareListener.LIST_ALL);
    let rgx3 = new NamedRegExp(serverHardwareListener.LIST_UTILIZATION);
    let rgx4 = new NamedRegExp(serverHardwareListener.LIST_ALL_UTILIZATION);
    let rgx5 = new NamedRegExp(serverHardwareListener.LIST);
    let rgx6 = new NamedRegExp(serverHardwareListener.LIST_STATUS);
    let rgx7 = new NamedRegExp(serverHardwareListener.LIST_POWER);
    let rgx8 = new NamedRegExp(serverHardwareListener.LIST_UUID_LIGHT);
    let rgx9 = new NamedRegExp(serverHardwareListener.LIST_ASSETTAG);
    let rgx10 = new NamedRegExp(serverHardwareListener.LIST_PROFILE_APPLIED);
    let rgx11 = new NamedRegExp(serverHardwareListener.LIST_NO_PROFILE_APPLIED);

    let constructorArgs = robot.respond.getCalls();

    rgx0.should.deep.equal(constructorArgs[0].args[0]);
    assert(typeof constructorArgs[0].args[2] === 'function');
    'bound PowerOn'.should.equal(constructorArgs[0].args[2].name);
    assert.isFalse(constructorArgs[0].args[2].hasOwnProperty('prototype'));

    rgx1.should.deep.equal(constructorArgs[1].args[0]);
    assert(typeof constructorArgs[1].args[2] === 'function');
    'bound PowerOff'.should.equal(constructorArgs[1].args[2].name);
    assert.isFalse(constructorArgs[1].args[2].hasOwnProperty('prototype'));

    rgx2.should.deep.equal(constructorArgs[2].args[0]);
    assert(typeof constructorArgs[2].args[2] === 'function');
    'bound ListServerHardware'.should.equal(constructorArgs[2].args[2].name);
    assert.isFalse(constructorArgs[2].args[2].hasOwnProperty('prototype'));

    rgx3.should.deep.equal(constructorArgs[3].args[0]);
    assert(typeof constructorArgs[3].args[2] === 'function');
    'bound ListServerHardwareUtilization'.should.equal(constructorArgs[3].args[2].name);
    assert.isFalse(constructorArgs[3].args[2].hasOwnProperty('prototype'));

    rgx4.should.deep.equal(constructorArgs[4].args[0]);
    assert(typeof constructorArgs[4].args[2] === 'function');
    'bound ListAllServerHardwareUtilization'.should.equal(constructorArgs[4].args[2].name);
    assert.isFalse(constructorArgs[4].args[2].hasOwnProperty('prototype'));

    rgx5.should.deep.equal(constructorArgs[5].args[0]);
    assert(typeof constructorArgs[5].args[2] === 'function');
    'bound ListServerHardwareById'.should.equal(constructorArgs[5].args[2].name);
    assert.isFalse(constructorArgs[5].args[2].hasOwnProperty('prototype'));

    rgx6.should.deep.equal(constructorArgs[6].args[0]);
    assert(typeof constructorArgs[6].args[2] === 'function');
    'bound ListHardwareByStatus'.should.equal(constructorArgs[6].args[2].name);
    assert.isFalse(constructorArgs[6].args[2].hasOwnProperty('prototype'));

    rgx7.should.deep.equal(constructorArgs[7].args[0]);
    assert(typeof constructorArgs[7].args[2] === 'function');
    'bound ListHardwareByPowerState'.should.equal(constructorArgs[7].args[2].name);
    assert.isFalse(constructorArgs[7].args[2].hasOwnProperty('prototype'));

    rgx8.should.deep.equal(constructorArgs[8].args[0]);
    assert(typeof constructorArgs[8].args[2] === 'function');
    'bound ListHardwareByUuidLight'.should.equal(constructorArgs[8].args[2].name);
    assert.isFalse(constructorArgs[8].args[2].hasOwnProperty('prototype'));

    rgx9.should.deep.equal(constructorArgs[9].args[0]);
    assert(typeof constructorArgs[9].args[2] === 'function');
    'bound ListHardwareByAssetTag'.should.equal(constructorArgs[9].args[2].name);
    assert.isFalse(constructorArgs[9].args[2].hasOwnProperty('prototype'));

    rgx10.should.deep.equal(constructorArgs[10].args[0]);
    assert(typeof constructorArgs[10].args[2] === 'function');
    'bound ListHardwareWithProfiles'.should.equal(constructorArgs[10].args[2].name);
    assert.isFalse(constructorArgs[10].args[2].hasOwnProperty('prototype'));

    rgx11.should.deep.equal(constructorArgs[11].args[0]);
    assert(typeof constructorArgs[11].args[2] === 'function');
    'bound ListHardwareWithNoProfiles'.should.equal(constructorArgs[11].args[2].name);
    assert.isFalse(constructorArgs[11].args[2].hasOwnProperty('prototype'));

    spy.restore();
    done();
  });

  it('test regexps', (done) => {
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let rgx0 = new NamedRegExp(serverHardwareListener.POWER_ON);
    let rgx1 = new NamedRegExp(serverHardwareListener.POWER_OFF);
    let rgx2 = new NamedRegExp(serverHardwareListener.LIST_ALL);
    let rgx3 = new NamedRegExp(serverHardwareListener.LIST_UTILIZATION);
    let rgx4 = new NamedRegExp(serverHardwareListener.LIST_ALL_UTILIZATION);
    let rgx5 = new NamedRegExp(serverHardwareListener.LIST);
    let rgx6 = new NamedRegExp(serverHardwareListener.LIST_STATUS);
    let rgx7 = new NamedRegExp(serverHardwareListener.LIST_POWER);
    let rgx8 = new NamedRegExp(serverHardwareListener.LIST_UUID_LIGHT);
    let rgx9 = new NamedRegExp(serverHardwareListener.LIST_ASSETTAG);
    let rgx10 = new NamedRegExp(serverHardwareListener.LIST_PROFILE_APPLIED);
    let rgx11 = new NamedRegExp(serverHardwareListener.LIST_NO_PROFILE_APPLIED);

    assert.isTrue(rgx0.test('@bot power on /rest/server-hardware/eb13eab8-adsf.'));
    assert.isTrue(rgx1.test('@bot power off /rest/server-hardware/eb13eab8-adsf.'));
    assert.isTrue(rgx2.test('@bot list all server hardware.'));
    assert.isTrue(rgx3.test('@bot list /rest/server-hardware/eb13eab8-adsf utilization.'));
    assert.isTrue(rgx4.test('@bot list /rest/server-hardware/eb13eab8-adsf all utilization.'));
    assert.isTrue(rgx5.test('@bot list /rest/server-hardware/eb13eab8-adsf.'));
    assert.isTrue(rgx6.test('@bot list all critical hardware.'));
    assert.isTrue(rgx7.test('@bot list all powered on hardware.'));
    assert.isTrue(rgx8.test('@bot show all hardware with uuid light off.'));
    assert.isTrue(rgx9.test('@bot show hardware with asset tag 1234P.'));
    assert.isTrue(rgx10.test('@bot show hardware with profiles.'));
    assert.isTrue(rgx11.test('@bot show hardware with no profiles.'));

    done();
  });

  it('test power on hardware', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'setPowerState').returns(
      new PromiseFeedback((feedback) => {
        return Bluebird.resolve(serverHardwareResponseOk);
      })
    );

    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot power on /rest/server-hardware/eb13eab8-adsf.'}},
      count: 1,
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.PowerOnHardware(msg);

    const expectedJsonResults = JSON.stringify(serverHardwareResponseOk, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 2);
      'Finished powering on 0000A6610EE, bay 5.'.should.equal(msg.send.args[0][0]);
      expectedJsonResults.should.equal(msg.send.args[1][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('test power on hardware read only', (done) => {
    client.readOnly = true;
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot power on /rest/server-hardware/eb13eab8-adsf.'}},
      count: 1,
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.PowerOnHardware(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "Not so fast...  You'll have to set readOnly mode to false in your config file first if you want to do that...".should.equal(msg.send.args[0][0]);
      spy.restore();
      done();
    }, 10);
  });

  it('test power on yes', (done) => {
    let stub1 = sinon.stub(brain, 'getDeviceNameAndHyperLink').returns({ deviceName: 'myprofile', hyperlink: '' });
    let stub2 = sinon.stub(client.ServerHardware, 'setPowerState').returns(
      new PromiseFeedback((feedback) => {
        return Bluebird.resolve(serverHardwareResponseOk);
      })
    );

    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      message: {text: '@bot yes.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.PowerOn(msg);

    listeners[1](msg); //call the dialog listener with the msg

    const expectedJsonResults = JSON.stringify(serverHardwareResponseOk, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 3);
      'Ok name I am going to power on the blade myprofile.  Are you sure you want to do this?\n\t\u2022 @bot yes\n\t\u2022 @bot no.'.should.equal(msg.send.args[0][0]);
      'Finished powering on 0000A6610EE, bay 5.'.should.equal(msg.send.args[1][0]);
      expectedJsonResults.should.equal(msg.send.args[2][0]);
      stub1.restore();
      stub2.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('test power on no', (done) => {
    let stub = sinon.stub(brain, 'getDeviceNameAndHyperLink').returns({ deviceName: 'myprofile', hyperlink: '' });
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      message: {text: '@bot no.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.PowerOn(msg);

    listeners[1](msg); //call the dialog listener with the msg

    setTimeout(() => {
      assert(msg.send.callCount === 2);
      'Ok name I am going to power on the blade myprofile.  Are you sure you want to do this?\n\t\u2022 @bot yes\n\t\u2022 @bot no.'.should.equal(msg.send.args[0][0]);
      "Ok name I won't do that.".should.equal(msg.send.args[1][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('test power on read only', (done) => {
    client.readOnly = true;
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: {},
      message: {TextMessage: {user: '', text: '@bot power on /rest/server-hardware/eb13eab8-adsf.'}},
      count: 1,
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.PowerOn(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "Not so fast...  You'll have to set readOnly mode to false in your config file first if you want to do that...".should.equal(msg.send.args[0][0]);
      spy.restore();
      done();
    }, 10);
  });

  it('test power off momentary press', (done) => {
    let stub1 = sinon.stub(brain, 'getDeviceNameAndHyperLink').returns({ deviceName: 'myprofile', hyperlink: '' });
    let stub2 = sinon.stub(client.ServerHardware, 'setPowerState').returns(
      new PromiseFeedback((feedback) => {
        return Bluebird.resolve(serverHardwareResponseOk);
      })
    );

    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      message: {text: '@bot momentary press.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.PowerOff(msg);

    listeners[1](msg); //call the dialog listener with the msg

    const expectedJsonResults = JSON.stringify(serverHardwareResponseOk, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 3);
      'How would you like to power off the server?\n\t\u2022 @bot Momentary Press\n\t\u2022 @bot Press and Hold.'.should.equal(msg.send.args[0][0]);
      "Finished powering off 0000A6610EE, bay 5.".should.equal(msg.send.args[1][0]);
      expectedJsonResults.should.equal(msg.send.args[2][0]);
      stub1.restore();
      stub2.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('test power off press and hold', (done) => {
    let stub1 = sinon.stub(brain, 'getDeviceNameAndHyperLink').returns({ deviceName: 'myprofile', hyperlink: '' });
    let stub2 = sinon.stub(client.ServerHardware, 'setPowerState').returns(
      new PromiseFeedback((feedback) => {
        return Bluebird.resolve(serverHardwareResponseOk);
      })
    );

    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      message: {text: '@bot press and hold.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.PowerOff(msg);

    listeners[1](msg); //call the dialog listener with the msg

    const expectedJsonResults = JSON.stringify(serverHardwareResponseOk, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 3);
      'How would you like to power off the server?\n\t\u2022 @bot Momentary Press\n\t\u2022 @bot Press and Hold.'.should.equal(msg.send.args[0][0]);
      "Finished powering off 0000A6610EE, bay 5.".should.equal(msg.send.args[1][0]);
      expectedJsonResults.should.equal(msg.send.args[2][0]);
      stub1.restore();
      stub2.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('test power off press and hold error', (done) => {
    let stub1 = sinon.stub(brain, 'getDeviceNameAndHyperLink').returns({ deviceName: 'myprofile', hyperlink: '' });
    let stub2 = sinon.stub(client.ServerHardware, 'setPowerState').returns(
      new PromiseFeedback((feedback) => {
        return Bluebird.reject(err);
      })
    );

    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      message: {text: '@bot press and hold.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.PowerOff(msg);

    listeners[1](msg); //call the dialog listener with the msg

    setTimeout(() => {
      assert(msg.send.callCount === 2);
      'How would you like to power off the server?\n\t\u2022 @bot Momentary Press\n\t\u2022 @bot Press and Hold.'.should.equal(msg.send.args[0][0]);
      'Oops there was a problem.\n\nOneView error code: OOPS\n'.should.equal(msg.send.args[1][0]);
      stub1.restore();
      stub2.restore();
      spy.restore();
      done();
    }, 10);
  });


  it('test power off read only', (done) => {
    client.readOnly = true;
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      message: {text: '@bot power off /rest/server-hardware/eb13eab8-adsf.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.PowerOff(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "I don\'t think I should be doing that if you are in readOnly mode...  You\'ll have to set readOnly mode to false in your config file first if you want to do that...".should.equal(msg.send.args[0][0]);
      spy.restore();
      done();
    }, 10);
  });

  it('list all hardware', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getAllServerHardware').returns(Bluebird.resolve(serverHardwaresResponseOk));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      message: {text: '@bot show all server hardware', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListServerHardware(msg);

    const expectedJsonResults = JSON.stringify(serverHardwaresResponseOk, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      expectedJsonResults.should.equal(msg.send.args[0][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list all hardware error', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getAllServerHardware').returns(Bluebird.reject(err));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      message: {text: '@bot show all server hardware', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListServerHardware(msg);

    const expectedJsonResults = JSON.stringify(serverHardwaresResponseOk, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "Oops there was a problem.\n\nOneView error code: OOPS\n".should.equal(msg.send.args[0][0]);
      spy.restore();
      done();
    }, 10);
  });

  it('list hardware', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getServerHardware').returns(Bluebird.resolve(serverHardwareResponseOk));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      message: {text: '@bot show /rest/server-hardware/eb13eab8-adsf.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListServerHardwareById(msg);

    const expectedJsonResults = JSON.stringify(serverHardwareResponseOk, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      expectedJsonResults.should.equal(msg.send.args[0][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list hardware error', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getServerHardware').returns(Bluebird.reject(err));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      message: {text: '@bot show /rest/server-hardware/eb13eab8-adsf.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListServerHardwareById(msg);

    const expectedJsonResults = JSON.stringify(serverHardwareResponseOk, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "Oops there was a problem.\n\nOneView error code: OOPS\n".should.equal(msg.send.args[0][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list by ok status', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareByStatus').returns(Bluebird.resolve(serverHardwaresResponseOk));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      status: 'Ok',
      message: {text: '@bot show all Ok hardware.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareByStatus(msg);

    const expectedJsonResults = JSON.stringify(serverHardwaresResponseOk, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 2);
      "Okay name, the following blades have an OK status.".should.equal(msg.send.args[0][0]);
      expectedJsonResults.should.equal(msg.send.args[1][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list by critical status', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareByStatus').returns(Bluebird.resolve(serverHardwaresResponseCritical));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      status: 'Critical',
      message: {text: '@bot show all critical hardware.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareByStatus(msg);

    const expectedJsonResults = JSON.stringify(serverHardwaresResponseCritical, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 2);
      "Okay name, the following blades have an CRITICAL status.".should.equal(msg.send.args[0][0]);
      expectedJsonResults.should.equal(msg.send.args[1][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list by status no results', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareByStatus').returns(Bluebird.resolve({members: []}));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      status: 'unknown',
      message: {text: '@bot show all unknown hardware.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareByStatus(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "name, I didn't find any blades with a UNKNOWN status.".should.equal(msg.send.args[0][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list by status error', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareByStatus').returns(Bluebird.reject(err));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      status: 'unknown',
      message: {text: '@bot show all unknown hardware.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareByStatus(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "Oops there was a problem.\n\nOneView error code: OOPS\n".should.equal(msg.send.args[0][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list by power state', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareByPowerState').returns(Bluebird.resolve(serverHardwaresResponseOk));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      powerState: 'powered off',
      message: {text: '@bot show all powered off hardware.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareByPowerState(msg);

    const expectedJsonResults = JSON.stringify(serverHardwaresResponseOk, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 2);
      "Okay, name, the following blades are powered off.".should.equal(msg.send.args[0][0]);
      expectedJsonResults.should.equal(msg.send.args[1][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list by power state no results', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareByPowerState').returns(Bluebird.resolve({members: []}));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      powerState: 'powered off',
      message: {text: '@bot show all powered off hardware.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareByPowerState(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "name, I didn't find any blades that are powered off.".should.equal(msg.send.args[0][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list by power error', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareByPowerState').returns(Bluebird.reject(err));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      powerState: 'powered off',
      message: {text: '@bot show all powered off hardware.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareByPowerState(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "Oops there was a problem.\n\nOneView error code: OOPS\n".should.equal(msg.send.args[0][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list hardware utilization', (done) => {
    let stub1 = sinon.stub(client.ServerHardware, 'getServerHardware').returns(Bluebird.resolve(serverHardwareResponseOk));
    let stub2 = sinon.stub(client.ServerHardware, 'getServerUtilization').returns(Bluebird.resolve(serverHardwareUtilization));
    let stub3 = sinon.stub(client.ServerHardware, 'getServerNetworkUtilization').returns(Bluebird.resolve(serverNetworkUtilization));

    let logicalInterconnectsMap = new Map();
    logicalInterconnectsMap.set('localhost/rest/interconnects/aeb17900', '/rest/logical-interconnects/c06c7011')
    logicalInterconnectsMap.set('localhost/rest/interconnects/6a07ee2b', '/rest/logical-interconnects/c06c7011')
    let stub4 = sinon.stub(brain, 'getLogicalInterconnectsMap').returns(logicalInterconnectsMap);

    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      powerState: 'powered off',
      message: {text: '@bot show /rest/server-hardware/eb13eab8-adsf utilization.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {},
      host: 'localhost'
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListServerHardwareUtilization(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 2);
      "Ok name I'm going to create the CPU and network utilization charts. This can take quite some time.".should.equal(msg.send.args[0][0]);
      "name I've finished creating the hardware utilization charts.".should.equal(msg.send.args[1][0]);
      stub1.restore();
      stub2.restore();
      stub3.restore();
      stub4.restore();
      spy.restore();
      done();
    }, 8500);
  });

  it('list all hardware utilization', (done) => {
    let stub1 = sinon.stub(client.ServerHardware, 'getServerHardware').returns(Bluebird.resolve(serverHardwareResponseOk));
    let stub2 = sinon.stub(client.ServerHardware, 'getServerUtilization').returns(Bluebird.resolve(serverHardwareUtilization));
    let stub3 = sinon.stub(client.ServerHardware, 'getServerNetworkUtilization').returns(Bluebird.resolve(serverNetworkUtilization));

    let logicalInterconnectsMap = new Map();
    logicalInterconnectsMap.set('localhost/rest/interconnects/aeb17900', '/rest/logical-interconnects/c06c7011')
    logicalInterconnectsMap.set('localhost/rest/interconnects/6a07ee2b', '/rest/logical-interconnects/c06c7011')
    let stub4 = sinon.stub(brain, 'getLogicalInterconnectsMap').returns(logicalInterconnectsMap);

    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      powerState: 'powered off',
      message: {text: '@bot show /rest/server-hardware/eb13eab8-adsf all utilization.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {},
      host: 'localhost'
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListAllServerHardwareUtilization(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 2);
      "name I'm going to create all of the server utilization charts including CPU, temp, power and network utilization. This can take quite some time.".should.equal(msg.send.args[0][0]);
      "Ok name I've finished creating all the hardware utilization charts.".should.equal(msg.send.args[1][0]);
      stub1.restore();
      stub2.restore();
      stub3.restore();
      stub4.restore();
      spy.restore();
      done();
    }, 14000);
  });

  it('list by uuid on', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareWithFilter').returns(Bluebird.resolve(serverHardwaresResponseOk));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      uuidlight: 'on',
      message: {text: '@bot show all hardware with uuid light on.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareByUuidLight(msg);

    const expectedJsonResults = JSON.stringify(serverHardwaresResponseOk, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 2);
      "Okay name, the following hardware have the UUID light ON.".should.equal(msg.send.args[0][0]);
      expectedJsonResults.should.equal(msg.send.args[1][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list by uuid no results', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareWithFilter').returns(Bluebird.resolve({members: []}));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      uuidlight: 'on',
      message: {text: '@bot show all hardware with uuid light on.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareByUuidLight(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "name, I didn't find any hardware with the UUID light ON.".should.equal(msg.send.args[0][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list by asset tag', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareWithFilter').returns(Bluebird.resolve(serverHardwaresResponseOk));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      assettag: '1234',
      message: {text: '@bot show all hardware with asset tag 1234.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareByAssetTag(msg);

    const expectedJsonResults = JSON.stringify(serverHardwaresResponseOk, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 2);
      "Okay name, the following hardware have the asset tag 1234.".should.equal(msg.send.args[0][0]);
      expectedJsonResults.should.equal(msg.send.args[1][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list by asset tag no results', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareWithFilter').returns(Bluebird.resolve({members: []}));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      assettag: '5678',
      message: {text: '@bot show all hardware with asset tag 5678.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareByAssetTag(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "name, I didn't find any hardware with the asset tag 5678.".should.equal(msg.send.args[0][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list with profiles', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareWithFilter').returns(Bluebird.resolve(serverHardwaresResponseOk));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      message: {text: '@bot show all hardware with profiles.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareWithProfiles(msg);

    const expectedJsonResults = JSON.stringify(serverHardwaresResponseOk, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 2);
      "Okay name, the following hardware have profiles.".should.equal(msg.send.args[0][0]);
      expectedJsonResults.should.equal(msg.send.args[1][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list with profiles no results', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareWithFilter').returns(Bluebird.resolve({members: []}));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      message: {text: '@bot show all hardware with profiles.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareWithProfiles(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "name, I didn't find any hardware with profiles.".should.equal(msg.send.args[0][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list with no profiles', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareWithFilter').returns(Bluebird.resolve(serverHardwaresResponseOk));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      message: {text: '@bot show all hardware with no profiles.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareWithNoProfiles(msg);

    const expectedJsonResults = JSON.stringify(serverHardwaresResponseOk, null, '  ');

    setTimeout(() => {
      assert(msg.send.callCount === 2);
      "Okay name, the following hardware have no profiles applied.".should.equal(msg.send.args[0][0]);
      expectedJsonResults.should.equal(msg.send.args[1][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

  it('list with no profiles no results', (done) => {
    let stub = sinon.stub(client.ServerHardware, 'getHardwareWithFilter').returns(Bluebird.resolve({members: []}));
    const serverHardwareListener = new ServerHardwareListener(robot, client, transform, brain);

    let msg = {
      robot: robot,
      message: {text: '@bot show all hardware with profiles.', user: {name: 'name', id: '1234'}, room: 'room'},
      send: function () {}
    };
    let spy = sinon.spy(msg, "send");

    serverHardwareListener.ListHardwareWithNoProfiles(msg);

    setTimeout(() => {
      assert(msg.send.callCount === 1);
      "name, I didn't find any hardware without profiles.".should.equal(msg.send.args[0][0]);
      stub.restore();
      spy.restore();
      done();
    }, 10);
  });

});
