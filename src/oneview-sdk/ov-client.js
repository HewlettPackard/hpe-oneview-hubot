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
const connection = require('./connection');
const serverhardware = require('./server-hardware');
const serverprofiles = require('./server-profiles');
const serverprofiletemplates = require('./server-profile-templates');
const dashboard = require('./dashboard');
const alerts = require('./alerts');
const logicalinterconnects = require('./logical-interconnects');
const notifications = require('./notifications');

let logger = {};

class OVClient {
  constructor(oneviewConfig, robot) {
    this.connections = new Map();
    logger = robot.logger;
    this.hosts = oneviewConfig.hosts;
    for (let host of this.hosts) {
      this.connections.set(host.applianceIp, new connection(host.applianceIp, host.apiVersion, host.doProxy, host.proxyHost, host.proxyPort));
    }
    this.readOnly = oneviewConfig.readOnly;
    this.pollingInterval = oneviewConfig.pollingInterval;
    this.server_hardware = new serverhardware(this);
    this.server_profiles = new serverprofiles(this);
    this.server_profile_templates = new serverprofiletemplates(this);
    this.dashboard = new dashboard(this);
    this.alerts = new alerts(this);
    this.logical_interconnects = new logicalinterconnects(this);
    this.notifications = new notifications(this, robot);
    this.chatRoom = oneviewConfig.chatRoom;
    if (this.chatRoom === undefined) {
      this.chatRoom = 'slack-channel';
    }
  }

  isReadOnly() {
    return this.readOnly;
  }

  getConnections() {
    return this.connections;
  }

  login(reconnect) {
    let promises = [];
    const connections = this.getConnections();
    for (let host of this.hosts) {
      promises.push(__performLogin__(reconnect, host, connections, this.notifications, this.pollingInterval));
    }
    return Promise.all(promises);
  }

  getAuthToken(host) {
    let token;
    const connection = this.connections.get(host);
    if (connection) {
      token = connection.headers.auth;
    }
    return token;
  }

  get ServerHardware() {
    return this.server_hardware;
  }

  get ServerProfiles() {
    return this.server_profiles;
  }

  get ServerProfileTemplates() {
    return this.server_profile_templates;
  }

  get Dashboard() {
    return this.dashboard;
  }

  get Alerts() {
    return this.alerts;
  }

  get LogicalInterconnects() {
    return this.logical_interconnects;
  }

  get Notifications() {
    return this.notifications;
  }
};

function __performLogin__(reconnect, host, connections, notifications, pollingInterval) {
  let body =  {
    'authLoginDomain': undefined,
    'password': host.password,
    'userName': host.userName,
    'loginMsgAck': 'true'
  };

  const connection = connections.get(host.applianceIp);

  const auth = () => {
    return connection.post('/rest/login-sessions', body).then((res) => {
      return res.sessionID;
    });
  };

  //TODO: This needs to be per user once we have a per user login-session
  connection.__newSession__ = auth;

  return auth().then((sessionToken) => {
    connection.headers.auth = sessionToken;
    connection.loggedIn = true;
    return sessionToken;
  }).then((sessionToken) => {
    if (!reconnect) {
      notifications.connect(host.applianceIp);
    }
    __pollAuthToken__(host, connections, pollingInterval);
    logger.info('Successfully logged into host', host.applianceIp);
    return sessionToken;
  });
}

function __pollAuthToken__(host, connections, pollingInterval) {
  __delay__(pollingInterval * 60000).then(() => {
    __checkToken__(host, connections).then(() => {
      logger.debug('Existing OV auth token is still valid for host', host.applianceIp);
      __pollAuthToken__(host, connections, pollingInterval);
    }).catch(() => {
       logger.info('Existing OV auth token is no longer valid.  Creating new token now for host', host.applianceIp);
       __performLogin__(true, host, connections, notifications, pollingInterval);
       __pollAuthToken__(host, connections, pollingInterval);
     });
  }).catch((err) => {
    logger.error(err);
  });
}

function __delay__(ms) {
  return new Promise ((resolve) => {
    setTimeout(function(){
        resolve();
    }, ms);
  });
}

function __checkToken__(host, connections) {
  return new Promise ((resolve, reject) => {
    const connection = connections.get(host.applianceIp);
    connection.headers['session-id'] = connection.headers.auth;
    connection.get('/rest/sessions').then((res) => {
      resolve(res.sessionID);
    }).catch((err) => {
      reject(err);
    });
  });
}

module.exports = OVClient;
