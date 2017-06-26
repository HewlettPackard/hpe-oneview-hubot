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

export default class Alerts {
  constructor (ov_client) {
    this.ov_client = ov_client;
  }

  getNumberOfAlerts(count, filter) {
    return this.ov_client.connection.get("/rest/alerts?view=alertSummary&count=" + count + "");
  }

  getFilteredAlerts(status, state, time) {
    let baseQuery = "/rest/alerts?count=100&filter=";
    let statusQuery = '';
    let stateQuery = '';
    let timeQuery = '';
    if (status) {
      status = status.charAt(0).toUpperCase() + status.slice(1);
      statusQuery = "\"severity EQ '" + status + "'\"";
      baseQuery += statusQuery;
    }
    if (state) {
      state = state.charAt(0).toUpperCase() + state.slice(1);
      if (status) {
        stateQuery += "&filter=";
      }
      stateQuery += "\"alertState EQ '" + state + "'\"";
      baseQuery += stateQuery;
    }

    var date = new Date();
    if (time) {
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
    return this.ov_client.connection.get(baseQuery);
  }

}
