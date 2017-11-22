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
const uri = '/rest/server-hardware/';
const url = require('url');

class ServerHardware {
  constructor (ov_client) {
    this.ov_client = ov_client;
    this.connections = ov_client.getConnections();
  }

  getAllServerHardware(filter) {
    let promises = [];
    let resObj = {'members': []};

    for (let connection of this.connections.values()) {
      promises.push(connection.get(uri, filter));
    }

    return Promise.all(promises).then(response => {
      for (let res of response) {
        resObj.members.push(...res.members);
      }
      return new Promise((resolve) => {
        resolve(resObj);
      });
    });
  }

  getServerHardware(host, id) {
    const connection = this.connections.get(host);
    return connection.get(id.startsWith(uri) ? id : uri + id);
  }

  setPowerState(host, id, state, control) {
    const connection = this.connections.get(host);
    let body = {powerState:state};
    if (control) {
      body.powerControl = control;
    }
    return connection.put((id.startsWith(uri) ? id : uri + id) + '/powerState', body);
  }

  getHardwareByPowerState(state) {
    let promises = [];
    let resObj = {'members': []};

    for (let connection of this.connections.values()) {
      promises.push(connection.get(uri + "?filter=\"powerState=" + state + "\""));
    }

    return Promise.all(promises).then(response => {
      for (let res of response) {
        resObj.members.push(...res.members);
      }
      return new Promise((resolve) => {
        resolve(resObj);
      });
    });
  }

  getServerUtilization(host, id, filter) {
    const connection = this.connections.get(host);
    return connection.get((id.startsWith(uri) ? id : uri + id) + '/utilization', filter);
  }

  getHardwareByStatus(status) {
    let promises = [];
    let resObj = {'members': []};

    for (let connection of this.connections.values()) {
      promises.push(connection.get(uri + "?filter=\"status=" + status + "\""));
    }

    return Promise.all(promises).then(response => {
      for (let res of response) {
        resObj.members.push(...res.members);
      }
      return new Promise((resolve) => {
        resolve(resObj);
      });
    });
  }

  /*
  This function returns a response that contains both the server's interconnect port
  statistics and the telemetry configurations for the port.
  @param server hardware interconnect port statistics uri
  @param server hardware logical interconnect uri
  */
  getServerNetworkUtilization(host, shInterconnectPortStatisticsUri, shLogicalInterconnectUri) {
    const connection = this.connections.get(host);
    return connection.get(shInterconnectPortStatisticsUri).then((res) => {
      let uri = url.parse('https://' + shLogicalInterconnectUri);
      return Promise.all([res, this.ov_client.LogicalInterconnects.getLogicalInterconnectTelemetryConfiguration(host, uri.pathname)]);
    });
  }
};

module.exports = ServerHardware;
