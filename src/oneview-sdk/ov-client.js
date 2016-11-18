/*
(c) Copyright 2016 Hewlett Packard Enterprise Development LP

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

'use strict';

import connection from './connection';
import serverhardware from './server-hardware';
import serverprofiles from './server-profiles';
import ServerProfileTemplates from './server-profile-templates';
import notifications from './notifications';

export default class OVClient {
  constructor(applianceIp, apiVersion, pollingInterval, readOnly,
    notificationsRoom, robot) {
    this.host = applianceIp;
    this.connection = new connection(applianceIp, apiVersion, readOnly);
    this.pollingInterval = pollingInterval;
    this.server_hardware = new serverhardware(this);
    this.server_profiles = new serverprofiles(this);
    this.serverProfileTemplates = new ServerProfileTemplates(this);
    this.notifications = new notifications(applianceIp, this.connection, robot);
    this.notificationsRoom = notificationsRoom;
    if (this.notificationsRoom === undefined) {
      this.notificationsRoom = 'clean-room';
    }
  }

  login(credentials, reconnect) {
    let body =  {
      'authLoginDomain': undefined,
      'password': credentials.password,
      'userName': credentials.userName,
      'loginMsgAck': 'true'
    };

    const auth = () => {
      return this.connection.post('/rest/login-sessions', body).then((res) => {
        return res.sessionID;
      });
    };

    //TODO: This needs to be per user once we have a per user login-session
    this.connection.__newSession__ = auth;

    return auth().then((auth) => {
      this.connection.headers['auth'] = auth;
      this.connection.loggedIn = true;
      return auth;
    }).then(() => {
      if (!reconnect) {
        this.notifications.__connect__();
      }
      this.__pollAuthToken__(credentials);
    });
  }

  isLoggedIn() {
    return this.connection.loggedIn;
  }

  //Need to make sure we don't confuse this with OneView connections
  get ClientConnection() {
    return this.connection;
  }

  get ServerHardware() {
    return this.server_hardware;
  }

  get ServerProfiles() {
    return this.server_profiles;
  }

  get ServerProfileTemplates() {
    return this.serverProfileTemplates;
  }

  get Notifications() {
    return this.notifications;
  }

  __pollAuthToken__(credentials) {
    this.__delay__(this.pollingInterval * 60000).then(() => {
      this.__checkToken__().then((res) => {
        console.log('Existing OV auth token is still valid.');
        this.__pollAuthToken__(credentials);
      }).catch((err) => {
         console.log('Existing OV auth token appears to no longer be valid.  Creating new token now.');
         this.login(credentials, true);
         this.__pollAuthToken__(credentials);
       });
    }).catch((err) => {
      console.log(err);
    });
  }

  __delay__(ms) {
    return new Promise ((resolve, reject) => {
      setTimeout(function(){
          resolve();
      }, ms);
    });
  }

  __checkToken__() {
    return new Promise ((resolve, reject) => {
      this.connection.headers['session-id'] = this.connection.headers['auth'];
      this.connection.get('/rest/sessions').then((res) => {
        resolve(res.sessionID);
      }).catch((err) => {
        reject(err);
      });
    });
  }

}
