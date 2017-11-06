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
const ShellTransform = require('../../../../src/listener/utils/transforms/shell');

const chai = require('chai');
const sinon = require('sinon');

chai.should();
const assert = chai.assert;

describe('ShellTransform', () => {

  const AlertResource = {
    type: 'AlertResourceV3'
  };

  const ServerProfileTemplateResource = {
    type: 'ServerProfileTemplateV2'
  };

  const ServerHardwareResource = {
    type: 'server-hardware-v4'
  };

  const ServerProfileResource = {
    type: 'ServerProfileV5'
  };

  it('getProviderName', () => {
    let shellTransform = new ShellTransform();
    'Shell'.should.eql(shellTransform.getProviderName());
  });

  it('error', () => {
    let err = {
      error: {
        errorCode: 'AUTHN_AUTH_FAIL',
        message: 'Unable to authenticate.',
        details: 'Unable to authenticate. A communication failure occurred within the appliance.',
        recommendedActions: ["Retry login."]
      }
    };

    let shellTransform = new ShellTransform();

    let msg = {
      send: function () { }
    };

    sinon.spy(msg, "send");

    shellTransform.error(msg, err);

    assert(msg.send.calledOnce);
    assert(msg.send.callCount === 1);
  });

  it('messageRoom text only', () => {
    let shellTransform = new ShellTransform();

    let robot = {
      messageRoom: function () { }
    };

    sinon.spy(robot, "messageRoom");

    shellTransform.messageRoom(robot, 'room', undefined, "Hello I'm bot");

    assert(robot.messageRoom.calledOnce);
    assert(robot.messageRoom.callCount === 1);
  });

  it('messageRoom text and resource', () => {
    let shellTransform = new ShellTransform();

    let robot = {
      messageRoom: function () { }
    };

    sinon.spy(robot, "messageRoom");

    shellTransform.messageRoom(robot, 'room', AlertResource, "Hello I'm bot");

    assert(robot.messageRoom.callCount === 2);
  });

  it('send text and resource', () => {
    let shellTransform = new ShellTransform();

    let msg = {
      send: function () { }
    };

    sinon.spy(msg, "send");

    try {
      shellTransform.send(msg, ServerProfileTemplateResource, "Hello I'm bot");
      assert(msg.send.callCount === 2);
    } catch (e) {
      sinon.assert.fail('Should not have thrown e!');
    }
  });

  it('send resource only', () => {
    let shellTransform = new ShellTransform();

    let msg = {
      send: function () { }
    };

    sinon.spy(msg, "send");

    try {
      shellTransform.send(msg, ServerHardwareResource, undefined);
      assert(msg.send.calledOnce);
      assert(msg.send.callCount === 1);
    } catch (e) {
      sinon.assert.fail('Should not have thrown e!');
    }
  });

  it('text', () => {
    let shellTransform = new ShellTransform();

    let msg = {
      send: function () { }
    };

    sinon.spy(msg, "send");

    shellTransform.text(msg, "Hello I'm bot");
    assert(msg.send.calledOnce);
    assert(msg.send.callCount === 1);
  });

  it('hyperlink link', () => {
    let shellTransform = new ShellTransform();
    let result = shellTransform.hyperlink('name', 'https://0.0.0.0/#/server-hardware/');
    'https://0.0.0.0/#/server-hardware/'.should.eql(result);
  });

  it('hyperlink name', () => {
    let shellTransform = new ShellTransform();
    let result = shellTransform.hyperlink('name', undefined);
    'name'.should.eql(result);
  });

});
