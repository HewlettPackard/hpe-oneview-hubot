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
const nlp_compromise = require('compromise');
const Lexer = require('../../src/middleware/utils/lexer');
const runNLP = require('../../src/middleware/nlp-middleware').runNLP;
const lex = new Lexer(nlp_compromise);
const nlp = require('../../src/middleware/nlp-middleware').nlp;

const sinon = require('sinon');
const chai = require('chai');

chai.should();
const assert = chai.assert;

describe('NLP Middleware', () => {

  const logger = {
    debug: function(params) {}
  };

  const robot = {
    name: 'bot',
    adapterName: 'shell',
    receive: function () {},
    on: function () {},
    listen: function () {},
    respond: function () {},
    listenerMiddleware: function () {},
    logger: {debug: function () {}, error: function () {}, info: function () {}},
    catchAll: function () {},
    receiveMiddleware : function () {}
  };

  //add a template
  lex.addNamedDevice('template1', '/rest/server-profile-templates/ad51166f', 'name', 'https://10.1.1.1/#/profile-templates/show/overview/r/rest/server-profile-templates/ad51166f?s_sid=LTE', undefined);
  //add a blade
  lex.addNamedDevice('0000A661, bay 2', '/rest/server-hardware/30303437', 'name', 'https://10.1.1.1/#/server-hardware/show/overview/r/rest/server-hardware/30303437?s_sid=LTE', 'HPE Synergy Compute Module');
  //add a profile
  lex.addNamedDevice('profile1', '/rest/server-profiles/eb13eab1', 'name', 'https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/eb13eab1?s_sid=LTE', undefined);
  //add a complex profile
  lex.addNamedDevice('profile1 - 0000A661, bay 2', '/rest/server-profiles/eb13eab2', 'name', 'https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/eb13eab2?s_sid=LTE', undefined);
  //add a complex profile
  lex.addNamedDevice('profile1 - docker', '/rest/server-profiles/eb13eab3', 'name', 'https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/eb13eab3?s_sid=LTE', undefined);

  it('runNLP simple template', () => {
    const Message = {
      user: { id: '1', name: 'Shell', room: 'Shell' },
      text: '@hubot show template1',
      id: 'messageId',
      done: false,
      room: 'Shell'
    };

    runNLP(Message, logger, lex);
    Message.text.should.equal('@hubot show /rest/server-profile-templates/ad51166f.');
    Message.original_text.should.equal('@hubot show template1');
    Message.nlp.out('text').should.equal('@hubot show /rest/server-profile-templates/ad51166f.');
  });

  it('runNLP simple profile', () => {
    const Message = {
      user: { id: '1', name: 'Shell', room: 'Shell' },
      text: '@hubot show profile1',
      id: 'messageId',
      done: false,
      room: 'Shell'
    };

    runNLP(Message, logger, lex);
    Message.text.should.equal('@hubot show /rest/server-profiles/eb13eab1.');
    Message.original_text.should.equal('@hubot show profile1');
    Message.nlp.out('text').should.equal('@hubot show /rest/server-profiles/eb13eab1.');
  });

  it('runNLP simple hardware', () => {
    const Message = {
      user: { id: '1', name: 'Shell', room: 'Shell' },
      text: '@hubot show 0000A661, bay 2',
      id: 'messageId',
      done: false,
      room: 'Shell'
    };

    runNLP(Message, logger, lex);
    Message.text.should.equal('@hubot show /rest/server-hardware/30303437.');
    Message.original_text.should.equal('@hubot show 0000A661, bay 2');
    Message.nlp.out('text').should.equal('@hubot show /rest/server-hardware/30303437.');
  });

  it('runNLP complex profile', () => {
    const Message = {
      user: { id: '1', name: 'Shell', room: 'Shell' },
      text: '@hubot show profile1 - docker',
      id: 'messageId',
      done: false,
      room: 'Shell'
    };

    runNLP(Message, logger, lex);
    Message.text.should.equal('@hubot show /rest/server-profiles/eb13eab3.');
    Message.original_text.should.equal('@hubot show profile1 - docker');
    Message.nlp.out('text').should.equal('@hubot show /rest/server-profiles/eb13eab3.');
  });

  it('runNLP complex profile', () => {
    const Message = {
      user: { id: '1', name: 'Shell', room: 'Shell' },
      text: '@hubot show profile1 - 0000A661, bay 2',
      id: 'messageId',
      done: false,
      room: 'Shell'
    };

    runNLP(Message, logger, lex);
    Message.text.should.equal('@hubot show /rest/server-profiles/eb13eab2.');
    Message.original_text.should.equal('@hubot show profile1 - 0000A661, bay 2');
    Message.nlp.out('text').should.equal('@hubot show /rest/server-profiles/eb13eab2.');
  });

  it('runNLP hardware with IP name', () => {
    const Message = {
      user: { id: '1', name: 'Shell', room: 'Shell' },
      text: '@hubot show 172.18.1.1',
      id: 'messageId',
      done: false,
      room: 'Shell'
    };

    runNLP(Message, logger, lex);
    Message.text.should.equal('@hubot show 172.18.1.1.');
    Message.original_text.should.equal('@hubot show 172.18.1.1');
    Message.nlp.out('text').should.equal('@hubot show 172.18.1.1.');
  });

  it('runNLP no message text', () => {
    const Message = {
      user: { id: '1', name: 'Shell', room: 'Shell' },
      text: undefined,
      id: 'messageId',
      done: false,
      room: 'Shell'
    };

    runNLP(Message, logger, lex);
    assert.equal(Message.text, undefined);
  });

  it('nlp receiveMiddleware', () => {
    let spy = sinon.spy(robot, "receiveMiddleware");

    nlp(robot);

    assert(robot.receiveMiddleware.callCount === 1);
    spy.restore();
  });

});
