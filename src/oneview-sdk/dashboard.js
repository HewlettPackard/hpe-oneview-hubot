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

const uri = '/rest/index/resources/aggregated?';

class Dashboard {
  constructor (ov_client) {
    this.ov_client = ov_client;
    this.connections = ov_client.getConnections();
  }

  getAggregatedServerHardware() {
    let promises = [];
    let resObj = {'members': []};

    for (let connection of this.connections.values()) {
      promises.push(connection.get(uri + "category=server-hardware&attribute=status"));
    }

    return Promise.all(promises).then(response => {
      for (let res of response) {
        resObj.members.push(...res);
      }
      return new Promise((resolve) => {
        resolve(resObj);
      });
    });
  }

  getAggregatedServerProfiles() {
    let promises = [];
    let resObj = {'members': []};

    for (let connection of this.connections.values()) {
      promises.push(connection.get(uri + "category=server-profiles&attribute=status"));
    }

    return Promise.all(promises).then(response => {
      for (let res of response) {
        resObj.members.push(...res);
      }
      return new Promise((resolve) => {
        resolve(resObj);
      });
    });
  }

  getAggregatedAlerts() {
    let promises = [];
    let resObj = {'members': []};

    for (let connection of this.connections.values()) {
      promises.push(connection.get(uri + "category=alerts&userQuery='Active AND Locked'&attribute=status"));
    }

    return Promise.all(promises).then(response => {
      for (let res of response) {
        resObj.members.push(...res);
      }
      return new Promise((resolve) => {
        resolve(resObj);
      });
    });
  }

  getAggregatedServersWithProfiles() {
    let promises = [];
    let resObj = {'members': []};

    for (let connection of this.connections.values()) {
      promises.push(connection.get(uri + "category=server-hardware&attribute=state"));
    }

    return Promise.all(promises).then(response => {
      for (let res of response) {
        resObj.members.push(...res);
      }
      return new Promise((resolve) => {
        resolve(resObj);
      });
    });
  }
};

module.exports = Dashboard;
