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

import OVClient from '../oneview-sdk/ov-client';
import ServerHardware from '../oneview-sdk/server-hardware';
import ServerProfiles from '../oneview-sdk/server-profiles';
import ServerProfileTemplates from '../oneview-sdk/server-profile-templates';
import Notifications from '../oneview-sdk/notifications';

let chai = require('chai');
let sinon = require('sinon');
let nock = require('nock');
let assert = require('assert');

chai.should();

describe('OVClient', () => {
  let oVClient;

  beforeEach(() => {
    oVClient = new OVClient('localhost', 300, 60, true, 'room', {});
  });

  it('login failure', () => {
    nock('https://localhost')
      .post('/rest/login-sessions', {userName: 'admin', password: 'password'})
      .reply(503, {sessionID: ''});

    return oVClient.login({userName: 'admin', password: 'password'}, true).then(() => {
      assert.fail('Fail');
    }).catch((e) => {
      oVClient.isLoggedIn().should.equal(false);
    });
  });

  it('login success', () => {
    nock('https://localhost')
      .post('/rest/login-sessions', {userName: 'admin', password: 'password'})
      .reply(200, {sessionID: 'ASD-1231-asd_Ll'});

    return oVClient.login({userName: 'admin', password: 'password'}, true).then(() => {
      oVClient.isLoggedIn().should.equal(true);
    });
  });

  it('get ServerHardware', () => {
    oVClient.ServerHardware.should.be.an.instanceof(ServerHardware);
  });

  it('get ServerProfiles', () => {
    oVClient.ServerProfiles.should.be.an.instanceof(ServerProfiles);
  });

  it('get ServerProfileTemplates', () => {
    oVClient.ServerProfileTemplates.should.be.an.instanceof(ServerProfileTemplates);
  });

  it('get Notifications', () => {
    oVClient.Notifications.should.be.an.instanceof(Notifications);
  });
});
