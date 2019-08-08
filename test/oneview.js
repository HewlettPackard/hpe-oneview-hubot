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
const main = require('../src/oneview');
const ovClient = require('../src/oneview-sdk/ov-client');
const Lexer = require('../src/middleware/utils/lexer');
const ovListener = require('../src/listener/oneview');
const ovBrain = require('../src/middleware/ov-brain');

const nlp = require('compromise');
const chai = require('chai');
const sinon = require('sinon');
const Bluebird = require('bluebird');

chai.should();
const assert = chai.assert;

describe('OneView', () => {

  let robot = {
    name: 'bot',
  	catchAll: function() {},
  	listen: function() {},
  	respond: function() {},
  	listenerMiddleware: function() {},
  	receiveMiddleware: function() {},
  	adapterName: 'shell',
  	on: function() {},
  	logger: {
  		debug: function() {},
  		error: function() {},
  		info: function() {}
  	},
    messageRoom: function () {}
  };

  let serverHardwareResponse = {
    "type": "server-hardware-list",
    "category": "server-hardware",
    "count": 1,
    "members": [{}]
  };

  let serverProfileResponse = {
    "type": "server-profiles-list",
    "category": "server-profiles",
    "count": 1,
    "members": [{}]
  };

  let serverProfileTemplateResponse = {
    "type": "server-profile-templates-list",
    "category": "server-profile-templates",
    "count": 1,
    "members": [{}]
  };

  it('success', (done) => {
    let spy = sinon.spy(robot, "messageRoom");
    const oneviewConfig = {hosts: []};

    const client = new ovClient(oneviewConfig, robot);
    const lex = new Lexer(nlp);
    const brain = new ovBrain(client, robot, {});

    let stub1 = sinon.stub(client, 'login').returns(Bluebird.resolve());
    let stub2 = sinon.stub(client.ServerHardware, 'getAllServerHardware').returns(Bluebird.resolve(serverHardwareResponse));
    let stub3 = sinon.stub(client.ServerProfiles, 'getAllServerProfiles').returns(Bluebird.resolve(serverProfileResponse));
    let stub4 = sinon.stub(client.ServerProfileTemplates, 'getAllServerProfileTemplates').returns(Bluebird.resolve(serverProfileTemplateResponse));

    main(robot, client, lex, ovListener(robot, client, brain));

    let expected = "Hello, I'm bot! Your OneView instance is currently showing:"
        + "\n\t\u2022 1 server(s)."
        + "\n\t\u2022 1 server profile(s)."
        + "\n\t\u2022 1 server profile template(s).\n"
        + "How can I assist you? Type '@bot help' to learn what I can do."

    setTimeout(() => {
      assert(robot.messageRoom.callCount === 1);
      '#slack-channel'.should.equal(robot.messageRoom.args[0][0]);
      expected.should.equal(robot.messageRoom.args[0][1]);
      spy.restore();
      stub1.restore();
      stub2.restore();
      stub3.restore();
      stub4.restore();
      done();
    }, 10);
  });

  it('success flowdock', (done) => {
    robot.adapterName = 'flowdock';

    let spy = sinon.spy(robot, "messageRoom");
    const oneviewConfig = {hosts: []};

    const client = new ovClient(oneviewConfig, robot);
    const lex = new Lexer(nlp);
    const brain = new ovBrain(client, robot, {});

    let stub1 = sinon.stub(client, 'login').returns(Bluebird.resolve());
    let stub2 = sinon.stub(client.ServerHardware, 'getAllServerHardware').returns(Bluebird.resolve(serverHardwareResponse));
    let stub3 = sinon.stub(client.ServerProfiles, 'getAllServerProfiles').returns(Bluebird.resolve(serverProfileResponse));
    let stub4 = sinon.stub(client.ServerProfileTemplates, 'getAllServerProfileTemplates').returns(Bluebird.resolve(serverProfileTemplateResponse));

    main(robot, client, lex, ovListener(robot, client, brain));

    let expected = "Hello, I'm bot! Your OneView instance is currently showing:"
        + "\n\t\u2022 1 server(s)."
        + "\n\t\u2022 1 server profile(s)."
        + "\n\t\u2022 1 server profile template(s).\n"
        + "How can I assist you? Type '@bot help' to learn what I can do."

    setTimeout(() => {
      assert(robot.messageRoom.callCount === 1);
      'slack-channel'.should.equal(robot.messageRoom.args[0][0]);
      expected.should.equal(robot.messageRoom.args[0][1]);
      spy.restore();
      stub1.restore();
      stub2.restore();
      stub3.restore();
      stub4.restore();
      done();
    }, 10);
  });

  it('error', (done) => {
    let spy = sinon.spy(robot, "messageRoom");
    const oneviewConfig = {hosts: []};

    const client = new ovClient(oneviewConfig, robot);
    const lex = new Lexer(nlp);
    const brain = new ovBrain(client, robot, {});

    let stub1 = sinon.stub(client, 'login').returns(Bluebird.reject('Error'));

    main(robot, client, lex, ovListener(robot, client, brain));

    setTimeout(() => {
      assert(robot.messageRoom.callCount === 0);
      spy.restore();
      stub1.restore();
      done();
    }, 10);
  });
});
