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
