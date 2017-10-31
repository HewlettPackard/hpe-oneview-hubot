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
const nlp = require('nlp_compromise');
const Lexer = require('../src/middleware/utils/lexer');

const lex = new Lexer(nlp);
let chai = require('chai');
let sinon = require('sinon');
let assert = chai.assert;

chai.should();

describe('Lexer', () => {

  lex.addNamedDevice('profile2', '/rest/server-profiles/eb13eab4', 'name', 'https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/eb13eab4?s_sid=LTE', undefined);
  lex.addNamedDevice('profile2 docker', '/rest/server-profiles/eb13eab5', 'name', 'https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/eb13eab5?s_sid=LTE', undefined);
  lex.addNamedDevice('Profile3 - hadoop', '/rest/server-profiles/eb13eab6', 'name', 'https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/eb13eab6?s_sid=LTE', undefined);
  lex.addNamedDevice('Profile3hadoop', '/rest/server-profiles/eb13eab7', 'name', 'https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/eb13eab7?s_sid=LTE', undefined);
  lex.addNamedDevice('Hadoop, profile1', '/rest/server-profiles/eb13eab17', 'name', 'https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/eb13eab17?s_sid=LTE', undefined);
  lex.addNamedDevice('Hadoop', '/rest/server-profile-templates/eb13eab27', 'name', 'https://10.1.1.1/#/profiles/show/overview/r/rest/server-profile-templates/eb13eab27?s_sid=LTE', undefined);
  //TODO make this pass (need to escape special characters in resource names)
  // lex.addNamedDevice('*Profile3hadoop?', '/rest/server-profiles/eb13eab8', 'name', 'https://10.1.1.1/#/profiles/show/overview/r/rest/server-profiles/eb13eab8?s_sid=LTE', undefined);

  it('resolveDevices simple name', () => {
    const result = lex.resolveDevices('@hubot show profile2');
    result.should.equal('@hubot show /rest/server-profiles/eb13eab4.');
  });

  it('resolveDevices complex name 1', () => {
    const result = lex.resolveDevices('@hubot show profile2 docker');
    result.should.equal('@hubot show /rest/server-profiles/eb13eab5.');
  });

  it('resolveDevices complex name 2', () => {
    const result = lex.resolveDevices('@hubot show Profile3 - hadoop');
    result.should.equal('@hubot show /rest/server-profiles/eb13eab6.');
  });

  it('resolveDevices complex name 3', () => {
    const result = lex.resolveDevices('@hubot show Profile3hadoop');
    result.should.equal('@hubot show /rest/server-profiles/eb13eab7.');
  });

  it('resolveDevices complex name 4', () => {
    const result = lex.resolveDevices('@hubot show Hadoop, profile1');
    result.should.equal('@hubot show /rest/server-profiles/eb13eab17.');
  });

  it('resolveDevices complex name 5', () => {
    const result = lex.resolveDevices('@hubot show Hadoop');
    result.should.equal('@hubot show /rest/server-profile-templates/eb13eab27.');
  });

  it('updateNamedDevice', () => {
    let robot = {adapterName: 'shell', on: function () { }, logger: {debug: function () {}, error: function () {}, info: function () {}}};
    lex.updateNamedDevice(robot, 'profile2 - updated', '/rest/server-profiles/eb13eab4');
    const result = lex.resolveDevices('@hubot show profile2 - updated');
    result.should.equal('@hubot show /rest/server-profiles/eb13eab4.');
  });

  it('updateNamedDevice no match', () => {
    let robot = {adapterName: 'shell', on: function () { }, logger: {debug: function () {}, error: function () {}, info: function () {}}};
    lex.updateNamedDevice(robot, 'profile22', '/rest/server-profiles/eb13eab67');
    const result = lex.resolveDevices('@hubot show profile22');
    result.should.equal('@hubot show profile22.');
  });

  //TODO make this pass (need to escape special characters in resource names)
  // it('resolveDevices complex name 4', () => {
  //   const result = lex.resolveDevices('@hubot show *Profile3hadoop??');
  //   result.should.equal('@hubot show /rest/server-profiles/eb13eab8.');
  // });
});
