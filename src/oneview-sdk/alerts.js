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

const uri = '/rest/alerts/';

class Alerts {
  constructor (ov_client) {
    this.ov_client = ov_client;
    this.connections = ov_client.getConnections();
  }

  getNumberOfAlerts(count) {
    let promises = [];
    let resObj = {'members': []};

    for (let connection of this.connections.values()) {
      promises.push(connection.get(uri + "?view=alertSummary&count=" + count + ""));
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

  getFilteredAlerts(status, state, time) {
    let baseQuery = uri + "?count=100&filter=";
    if (status) {
      status = status.charAt(0).toUpperCase() + status.slice(1);
      let statusQuery = "\"severity EQ '" + status + "'\"";
      baseQuery += statusQuery;
    }
    if (state) {
      let stateQuery = '';
      state = state.charAt(0).toUpperCase() + state.slice(1);
      if (status) {
        stateQuery += "&filter=";
      }
      stateQuery += "\"alertState EQ '" + state + "'\"";
      baseQuery += stateQuery;
    }

    let date = new Date();
    if (time) {
      let timeQuery = '';
      time = time.toLowerCase();
      if (time === "last 7 days") {
        date.setDate(date.getDate() - 7);
        date = date.toISOString();
        time = date;
      }
      if (time === "last 30 days") {
        date.setDate(date.getDate() - 30);
        date = date.toISOString();
        time = date;
      }
      if (status || state) {
        timeQuery += "&filter=";
      }
      timeQuery += "\"created GT '" + time + "'\"";
      baseQuery += timeQuery;
    }

    let promises = [];
    let resObj = {'members': []};

    for (let connection of this.connections.values()) {
      promises.push(connection.get(baseQuery));
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

};

module.exports = Alerts;
