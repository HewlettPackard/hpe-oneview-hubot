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


import Listener from './base-listener';
const Conversation = require("hubot-conversation");

export default class AlertsListener extends Listener {
  constructor(robot, client, transform) {
    super(robot, client, transform);

    this.switchBoard = new Conversation(robot);

    this.title = "Alerts";
    this.capabilities = [];
    this.respond(/(?:get|list|show) last (:<count>[0-9]*?) alerts\.$/i, ::this.ListNumberOfAlerts);
    this.capabilities.push(this.indent + "List last [insert #] alerts (e.g. list last 10 alerts)");

    this.respond(/(?:get|list|show) all (:<status>critical|warning|ok|disabled){0,1}(?: ?)(:<state>active|locked|cleared){0,1}(?: ?)alerts(?: from ){0,1}(:<time>today|last 7 days|last 30 days){0,1}\.$/i, ::this.ListFilteredAlerts);
    this.capabilities.push(this.indent + "List all critical/warning/ok/disabled active/locked/cleared alerts from today/last 7 days/last 30 days (e.g. list all (critical) (active) alerts (from today)) ")
  }

  ListNumberOfAlerts(msg) {
    let count = msg.count;
    this.client.Alerts.getNumberOfAlerts(count).then((res) => {
      return this.transform.send(msg, res, "Here are the last " + count + " alerts.");
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  ListFilteredAlerts(msg) {
    let status = msg.status;
    let state = msg.state;
    let time = msg.time;

    this.client.Alerts.getFilteredAlerts(status, state, time).then((res) => {
      if (res.count === 0) {
        let message = "I didn't find any ";
        if (status != undefined) {
          message += status + " ";
        }
        if (state != undefined) {
          message += state + " ";
        }
        message += "alerts";
        if (time != undefined) {
          if (time === "today") {
            message += " from " + time + ".";
          }
          else {
            message += " from the " + time + ".";
          }
        }
        return this.transform.text(msg, message);
      }
      return this.transform.send(msg, res, "I found the following alerts.");
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }
}
