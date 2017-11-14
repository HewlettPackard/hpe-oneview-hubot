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
const Listener = require('./base-listener');
const buildDashboard = require('../charting/show-dashboard');

class DashboardListener extends Listener {
  constructor(robot, client, transform) {
    super(robot, client, transform);

    this.title = "Dashboard";
    this.capabilities = [];
    this.room = client.chatRoom;

    this.SHOW = /show (?:oneview ){0,1}(?:dashboard|status).$/i;

    this.respond(this.SHOW, this.ShowOneViewDashboard.bind(this));
    this.capabilities.push(this.BULLET + "show (OneView) dashboard");
  }

  ShowOneViewDashboard(msg) {
    this.transform.send(msg, "Ok " + msg.message.user.name + ", I am going to generate your dashboard. This might take a little while.\nFor a more comprehensive view, see " + this.transform.hyperlink("https://" + this.client.host + "/#/dashboard", "Dashboard"));

    let promises = [];

    promises.push(this.client.Dashboard.getAggregatedAlerts());
    promises.push(this.client.Dashboard.getAggregatedServerProfiles());
    promises.push(this.client.Dashboard.getAggregatedServerHardware());
    promises.push(this.client.Dashboard.getAggregatedServersWithProfiles());

    Promise.all(promises).then((res) => {
      buildDashboard(this.robot, this.room, res[0], res[1], res[2], res[3]);
    }).catch((err) => {
      this.robot.logger.error("Error getting dashboard data", err);
      this.transform.error(msg, err);
    });

  }
}

module.exports = DashboardListener;
