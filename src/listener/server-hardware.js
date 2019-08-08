/*
(c) Copyright 2016-2019 Hewlett Packard Enterprise Development LP

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
const Listener = require('./base');
const buildD3Chart = require('../charting/chart');
const Conversation = require('hubot-conversation');

const rtrim = /\/statistics\/d\d*/i;

class ServerHardwareListener extends Listener {
  constructor(robot, client, transform, brain) {
    super(robot, client, transform);

    this.room = client.chatRoom;
    this.brain = brain;
    this.title = "Server hardware";
    this.capabilities = [];

    this.POWER_ON=/(?:turn|power) on (:<host>.*?)(?:\/rest\/server-hardware\/)(:<serverId>[a-zA-Z0-9_-]*?)\.$/i;
    this.POWER_OFF=/(?:turn|power) off (:<host>.*?)(?:\/rest\/server-hardware\/)(:<serverId>[a-zA-Z0-9_-]*?)\.$/i;
    this.LIST_ALL=/(?:get|list|show) all (?:server ){0,1}hardware\.$/i;
    this.LIST_UTILIZATION=/(?:get|list|show) (:<host>.*?)(?:\/rest\/server-hardware\/)(:<serverId>[a-zA-Z0-9_-]*?) utilization\.$/i;
    this.LIST_ALL_UTILIZATION=/(?:get|list|show) (:<host>.*?)(?:\/rest\/server-hardware\/)(:<serverId>[a-zA-Z0-9_-]*?) all utilization\.$/i;
    this.LIST=/(?:get|list|show) (?!\/rest\/server-profiles\/)(:<host>.*?)(?:\/rest\/server-hardware\/)(:<serverId>[a-zA-Z0-9_-]*?)\.$/i;
    this.LIST_STATUS=/(?:get|list|show) (?:all ){0,1}(:<status>critical|ok|disabled|warning*?) (?:server ){0,1}hardware\.$/i;
    this.LIST_POWER=/(?:get|list|show) (?:all ){0,1}(:<powerState>powered on|powered off*?) (?:server ){0,1}hardware\.$/i;

    this.switchBoard = new Conversation(robot);

    this.respond(this.POWER_ON, this.PowerOn.bind(this));
    this.respond(this.POWER_OFF, this.PowerOff.bind(this));
    this.capabilities.push(this.BULLET + "Power on/off a specific (server) hardware (e.g. turn on Encl1, bay 1).");

    this.respond(this.LIST_ALL, this.ListServerHardware.bind(this));
    this.capabilities.push(this.BULLET + "List all (server) hardware (e.g. list all hardware).");

    this.respond(this.LIST_UTILIZATION, this.ListServerHardwareUtilization.bind(this));
    this.capabilities.push(this.BULLET + "List server hardware utilization (e.g. list Encl1, bay 1 utilization).");

    this.respond(this.LIST_ALL_UTILIZATION, this.ListAllServerHardwareUtilization.bind(this));
    this.capabilities.push(this.BULLET + "List server hardware utilization (e.g. list Encl1, bay 1 utilization).");

    this.respond(this.LIST, this.ListServerHardwareById.bind(this));
    this.capabilities.push(this.BULLET + "List server hardware by name (e.g. list Encl1, bay 1).");

    this.respond(this.LIST_STATUS, this.ListHardwareByStatus.bind(this));
    this.capabilities.push(this.BULLET + "List all critical/warning/ok/disabled (server) hardware (e.g. list all critical hardware).");

    this.respond(this.LIST_POWER, this.ListHardwareByPowerState.bind(this));
    this.capabilities.push(this.BULLET + "List all powered on/off (server) hardware.");
  }

  PowerOnHardware(msg) {
    if(this.client.isReadOnly()) {
      return this.transform.text(msg, "Not so fast...  You'll have to set readOnly mode to false in your config file first if you want to do that...");
    }
    let startMessage = true;
    return this.client.ServerHardware.setPowerState(msg.host, msg.serverId, "On").feedback((res) => {
      if (startMessage && res.associatedResource.resourceHyperlink) {
        startMessage = false;
        this.transform.text(msg, "I am powering on " + this.transform.hyperlink(res.associatedResource.resourceHyperlink, res.associatedResource.resourceName) + ", this may take some time.");
      }
    }).then((res) => {
      this.transform.send(msg, res, "Finished powering on " + res.name);
    });
  }

  PowerOn(msg) {
    if(this.client.isReadOnly()) {
      return this.transform.text(msg, "Not so fast...  You'll have to set readOnly mode to false in your config file first if you want to do that...");
    }

    let dialog = this.switchBoard.startDialog(msg);

    let deviceAndHyperlink = this.brain.getDeviceNameAndHyperLink(msg.host + "/rest/server-hardware/" + msg.serverId);
    this.transform.text(msg, "Ok " + msg.message.user.name + " I am going to power on the blade " + this.transform.hyperlink(deviceAndHyperlink.hyperlink, deviceAndHyperlink.deviceName) +
    ".  Are you sure you want to do this?\n" + this.BULLET + "@" + this.robot.name + " yes\n" + this.BULLET + "@" + this.robot.name + " no");

    dialog.addChoice(/yes/i, () => {
      this.PowerOnHardware(msg, false).catch((err) => {
        return this.transform.error(msg, err);
      });
    });

    dialog.addChoice(/no/i, () => {
      return this.transform.text(msg, "Ok " + msg.message.user.name + " I won't do that.");
    });
  }

  PowerOff(msg) {
    if(this.client.isReadOnly()) {
      return this.transform.text(msg, "I don't think I should be doing that if you are in readOnly mode...  You'll have to set readOnly mode to false in your config file first if you want to do that...");
    }

    let dialog = this.switchBoard.startDialog(msg);
    this.transform.text(msg, "How would you like to power off the server?\n" +
    this.BULLET + "@" + this.robot.name + " Momentary Press\n" + this.BULLET + "@" + this.robot.name + " Press and Hold");

    dialog.addChoice(/momentary press/i, () => {
      let startMessage = true;
      return this.client.ServerHardware.setPowerState(msg.host, msg.serverId, "Off", "MomentaryPress").feedback((res, err) => {
        if (startMessage && res.associatedResource.resourceHyperlink) {
          startMessage = false;
          this.transform.text(msg, "Hey " + msg.message.user.name + " I am powering off " + this.transform.hyperlink(res.associatedResource.resourceHyperlink, res.associatedResource.resourceName) + " with a Momentary Press. This may take some time.");
        }
      }).then((res) => {
        this.transform.send(msg, res, "Finished powering off " + res.name);
      }).catch((err) => {
        this.transform.error(msg, err);
      });
    });

    dialog.addChoice(/press and hold/i, () => {
      let startMessage = true;
      return this.client.ServerHardware.setPowerState(msg.host, msg.serverId, "Off", "PressAndHold").feedback((res, err) => {
        if (startMessage && res.associatedResource.resourceHyperlink) {
          startMessage = false;
          this.transform.text(msg, "Hey " + msg.message.user.name + " I am powering off " + this.transform.hyperlink(res.associatedResource.resourceHyperlink, res.associatedResource.resourceName) + " with Press and Hold. This may take some time.");
        }
      }).then((res) => {
        this.transform.send(msg, res, "Finished powering off " + res.name);
      }).catch((err) => {
        this.transform.error(msg, err);
      });
    });
  }

  ListServerHardware(msg) {
    this.client.ServerHardware.getAllServerHardware().then((res) => {
      return this.pagination(msg, res);
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  ListServerHardwareById(msg) {
    this.client.ServerHardware.getServerHardware(msg.host, msg.serverId).then((res) => {
      return this.transform.send(msg, res);
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  ListHardwareByStatus(msg) {
    let status = msg.status.toLowerCase();
    status = status.charAt(0).toUpperCase() + status.slice(1);
    this.client.ServerHardware.getHardwareByStatus(status).then((res) => {

      if (res.members.length === 0) {
        return this.transform.text(msg, msg.message.user.name + ", I didn't find any blades with a " + status.toUpperCase() + " status.");
      }
      else {
        if (status.toLowerCase() === "ok") {
          return this.pagination(msg, res, "Okay " + msg.message.user.name + ", the following blades have an " + status.toUpperCase() + " status.");
        } else {
          return this.pagination(msg, res, "Okay " + msg.message.user.name + ", the following blades have an " + status.toUpperCase() + " status.");
        }
      }
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  ListHardwareByPowerState(msg) {
    let state = msg.powerState.substring(8, msg.powerState.length);
    state = state.charAt(0).toUpperCase() + state.slice(1);
    this.client.ServerHardware.getHardwareByPowerState(state).then((res) => {
      if (res.members.length === 0) {
        return this.transform.text(msg, msg.message.user.name + ", I didn't find any blades that are powered " + state.toLowerCase() + ".");
      } else {
        return this.pagination(msg, res, "Okay, " + msg.message.user.name + ", the following blades are powered " + state.toLowerCase() + ".");
      }
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  ListServerHardwareUtilization(msg) {
    this.transform.send(msg, "Ok " + msg.message.user.name + " I'm going to create the CPU and network utilization charts. This can take quite some time.");

    let icMap = this.brain.getLogicalInterconnectsMap();

    let p1 = this.client.ServerHardware.getServerUtilization(msg.host, msg.serverId, {fields: 'CpuUtilization,CpuAverageFreq'}).then((res) => {
      return buildD3Chart(this.robot, this.room, 'CPU', res.metricList);
    });

    let p2 = this.client.ServerHardware.getServerHardware(msg.host, msg.serverId).then((res) => {
      let promises = [];
      for (let serverInterconnectPortLink of res.serverInterconnectPortLinks) {
        let shInterconnectUri = serverInterconnectPortLink.replace(rtrim, ''); //remove statistics port to make lookup key
        let shLogicalInterconnectUri = icMap.get(msg.host + '' + shInterconnectUri);
        if(shLogicalInterconnectUri) { //don't query if the interconnect is not part of a logical interconnect
          promises.push(this.client.ServerHardware.getServerNetworkUtilization(msg.host, serverInterconnectPortLink, shLogicalInterconnectUri));
        }
      }
      return Promise.all(promises);
    }).then((responses) => {
      //responses will be pairs of port statistics and telemetry configuration
      let promises = [];
      for (let response of responses) {
        if (response[0].advancedStatistics) {
          let receiveKilobytesPerSec = {metricName: 'receiveKilobytesPerSec', metricSamples: response[0].advancedStatistics.receiveKilobytesPerSec.split(':')};
          let transmitKilobytesPerSec = {metricName: 'transmitKilobytesPerSec', metricSamples: response[0].advancedStatistics.transmitKilobytesPerSec.split(':')};
          promises.push(buildD3Chart(this.robot, this.room, 'Network Utilization Port ' + response[0].portNumber, [receiveKilobytesPerSec, transmitKilobytesPerSec], response[1].sampleInterval));
        }
      }
      return Promise.all(promises);
    });

    Promise.all([p1, p2]).then((res) => {
      this.robot.logger.info('All charts finished.');
      return this.transform.send(msg, msg.message.user.name + " I've finished creating the hardware utilization charts.");
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  ListAllServerHardwareUtilization(msg) {
    this.transform.send(msg, msg.message.user.name + " I'm going to create all of the server utilization charts including CPU, temp, power and network utilization. This can take quite some time.");

    let icMap = this.brain.getLogicalInterconnectsMap();

    let p1 = this.client.ServerHardware.getServerUtilization(msg.host, msg.serverId, {fields: 'AveragePower,PeakPower,PowerCap'}).then((res) => {
      return Promise.all([res, buildD3Chart(this.robot, this.room, 'Power', res.metricList)]);
    });

    let p2 = this.client.ServerHardware.getServerUtilization(msg.host, msg.serverId, {fields: 'AmbientTemperature'}).then((res) => {
      return Promise.all([res, buildD3Chart(this.robot, this.room, 'Temperature', res.metricList)]);
    });

    let p3 = this.client.ServerHardware.getServerUtilization(msg.host, msg.serverId, {fields: 'CpuUtilization,CpuAverageFreq'}).then((res) => {
      return Promise.all([res, buildD3Chart(this.robot, this.room, 'CPU', res.metricList)]);
    });

    let p4 = this.client.ServerHardware.getServerHardware(msg.host, msg.serverId).then((res) => {
      let promises = [];
      for (let serverInterconnectPortLink of res.serverInterconnectPortLinks) {
        let shInterconnectUri = serverInterconnectPortLink.replace(rtrim, ''); //remove statistics port to make lookup key
        let shLogicalInterconnectUri = icMap.get(msg.host + '' + shInterconnectUri);
        if(shLogicalInterconnectUri) { //don't query if the interconnect is not part of a logical interconnect
          promises.push(this.client.ServerHardware.getServerNetworkUtilization(msg.host, serverInterconnectPortLink, shLogicalInterconnectUri));
        }
      }
      return Promise.all(promises);
    }).then((responses) => {
      //responses will be pairs of port statistics and telemetry configuration
      let promises = [];
      for (let response of responses) {
        if (response[0].advancedStatistics) {
          let receiveKilobytesPerSec = {metricName: 'receiveKilobytesPerSec', metricSamples: response[0].advancedStatistics.receiveKilobytesPerSec.split(':')};
          let transmitKilobytesPerSec = {metricName: 'transmitKilobytesPerSec', metricSamples: response[0].advancedStatistics.transmitKilobytesPerSec.split(':')};
          promises.push(buildD3Chart(this.robot, this.room, 'Network Utilization Port ' + response[0].advancedStatistics.portNumber, [receiveKilobytesPerSec, transmitKilobytesPerSec], response[1].sampleInterval));
        }
      }
      return Promise.all(promises);
    });

    Promise.all([p1, p2, p3, p4]).then(() => {
      this.robot.logger.info('All charts finished.');
      return this.transform.send(msg, "Ok " + msg.message.user.name + " I've finished creating all the hardware utilization charts.");
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }
}

module.exports = ServerHardwareListener;
