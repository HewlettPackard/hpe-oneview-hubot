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

import Listener from "./base-listener";
import { getDeviceNameAndHyperLink } from '../ov-brain';
const Conversation = require("hubot-conversation");

export default class ServerProfilesListener extends Listener {
  constructor(robot, client, transform, serverHardware) {
    super(robot, client, transform);
    this.serverHardware = serverHardware;

    this.switchBoard = new Conversation(robot);

    this.title = "Server Profile";
    this.capabilities = [];
    this.respond(/(?:get|list|show) all (?:server ){0,1}profiles\.$/i, ::this.ListServerProfiles);
    this.capabilities.push(this.BULLET + "Show all (server) profiles (e.g. show all profiles).");

    this.respond(/(?:get|list|show) (:<host>.*?)(?:\/rest\/server-profiles\/)(:<profileId>[a-zA-Z0-9_-]*?)\.$/i, ::this.ListServerProfile);
    this.capabilities.push(this.BULLET + "Show a specific (server) profile (e.g. show hadoop cluster).");

    this.respond(/(?:get|list|show) (:<host>.*?)(?:\/rest\/server-profiles\/)(:<profileId>[a-zA-Z0-9_-]*?) compliance(?: preview){0,1}\.$/i, ::this.ListServerProfileCompliancePreview);
    this.capabilities.push(this.BULLET + "Show a specific (server) profile compliance (e.g. show hadoop cluster compliance).");

    this.respond(/(?:update|make) (:<host>.*?)(?:\/rest\/server-profiles\/)(:<profileId>[a-zA-Z0-9_-]*?) (?:compliance|compliant)\.$/i, ::this.HandleServerCompliantMessage);
    this.capabilities.push(this.BULLET + "Make/update a specific (server) profile compliance (e.g. make hadoop cluster compliant).");

    this.respond(/(?:turn|power) on (:<host>.*?)(?:\/rest\/server-profiles\/)(:<profileId>[a-zA-Z0-9_-]*?)\.$/i, ::this.PowerOnServerProfile);
    this.respond(/(?:turn|power) off (:<host>.*?)(?:\/rest\/server-profiles\/)(:<profileId>[a-zA-Z0-9_-]*?)\.$/i, ::this.PowerOffServerProfile);
    this.capabilities.push(this.BULLET + "Power on/off a specific (server) profile (e.g. turn on hadoop cluster).");

    this.respond(/(?:get|list|show) (?:all ){0,1}(:<status>critical|ok|disabled|warning*?) (?:server ){0,1}profiles\.$/i, ::this.ListProfilesByStatus);
    this.capabilities.push(this.BULLET + "List all critical/warning/ok/disabled (server) profiles (e.g. list all critical profiles).");
  }

  ListServerProfiles(msg) {
    this.client.ServerProfiles.getAllServerProfiles().then((res) => {
      return this.transform.send(msg, res, (res.members && res.members.length === 0 ? 'There are no profiles.' : ''));
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  ListServerProfile(msg) {
    this.client.ServerProfiles.getServerProfile(msg.host, msg.profileId).then((res) => {
      return this.transform.send(msg, res);
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  ListServerProfileCompliancePreview(msg) {
    this.client.ServerProfiles.getServerProfileCompliancePreview(msg.host, msg.profileId).then((res) => {
      return this.transform.send(msg, res);
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  ListProfilesByStatus(msg) {
    let status = msg.status.toLowerCase();
    status = status.charAt(0).toUpperCase() + status.slice(1);
    this.client.ServerProfiles.getProfilesByStatus(status).then((res) => {
      if (res.count === 0) {
        return this.transform.text(msg, msg.message.user.name + ", I didn't find any profiles with a " + msg.status.toLowerCase() + " status.");
      } else {
        if (msg.status.toLowerCase() === "ok") {
          return this.transform.send(msg, res, "Okay " + msg.message.user.name + ", the following profiles have an " + msg.status.toUpperCase() + " status.");
        } else {
          return this.transform.send(msg, res, "Okay " + msg.message.user.name + ", the following profiles have a " + msg.status.toLowerCase() + " status.");
        }
      }
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  MakeServerProfileCompliant(id, msg, suppress) {
    let startMessage = false;
    return this.client.ServerProfiles.updateServerProfileCompliance(msg.host, id).feedback((res) => {
      if (!suppress && !startMessage && res.associatedResource.resourceHyperlink) {
        startMessage = true;
        this.transform.text(msg, "Hey " + msg.message.user.name + ", I am making " + this.transform.hyperlink(res.associatedResource.resourceHyperlink, res.associatedResource.resourceName) + " compliant, this may take some time.");
      }
    }).then((res) => {
      if (!suppress) {
        return this.transform.send(msg, res, 'Finished making ' + res.name + ' compliant.');
      }
    });
  }

  HandleServerCompliantMessage(msg) {
    this.MakeServerProfileCompliant(msg.profileId, msg, false).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  PowerOnServerProfile(msg) {
    if(this.client.isReadOnly()) {
      return this.transform.text(msg, "Hold on a sec...  You'll have to set readOnly mode to false in your config file first if you want to do that...   ");
    }

    let dialog = this.switchBoard.startDialog(msg);

    let deviceAndHyperlink = getDeviceNameAndHyperLink("/rest/server-profiles/" + msg.profileId);
    let profileName = deviceAndHyperlink.deviceName;
    let profileHyperlink = deviceAndHyperlink.hyperlink;
    this.transform.text(msg, "Ok " + msg.message.user.name + " I am going to power on the server profile " + this.transform.hyperlink(profileHyperlink, profileName) + 
    ".  Are you sure you want to do this?\n" + this.BULLET + "@" + this.robot.name + " yes\n" + this.BULLET + "@" + this.robot.name + " no");    

    dialog.addChoice(/yes/i, () => {
      this.client.ServerProfiles.getServerProfile(msg.host, msg.profileId).then((res) => {
        if (res.serverHardwareUri === null) {
          return this.transform.text(msg, msg.message.user.name + ", " + this.transform.hyperlink(profileHyperlink, profileName) + " does not have any assigned server hardware to power on. Try assigning server hardware to the profile.");
        }
        else {
          msg.serverId = res.serverHardwareUri;
          return this.serverHardware.PowerOnHardware(msg, false);
        }

      }).catch((err) => {
        return this.transform.error(msg, err);
      });
    });

    dialog.addChoice(/no/i, () => {
      return this.transform.text(msg, "Ok " + msg.message.user.name + " I won't do that.");
    });
  }

  PowerOffServerProfile(msg) {
    if(this.client.isReadOnly()) {
      return this.transform.text(msg, "Hold on a sec...  You'll have to set readOnly mode to false in your config file first if you want to do that...   ");
    }

    let dialog = this.switchBoard.startDialog(msg);

    let deviceAndHyperlink = getDeviceNameAndHyperLink("/rest/server-profiles/" + msg.profileId);
    let profileName = deviceAndHyperlink.deviceName;
    let profileHyperlink = deviceAndHyperlink.hyperlink;
    this.transform.text(msg, "Ok " + msg.message.user.name + " I am going to power off the server profile " + this.transform.hyperlink(profileHyperlink, profileName) + 
    ".  Are you sure you want to do this?\n" + this.BULLET + "@" + this.robot.name + " yes\n" + this.BULLET + "@" + this.robot.name + " no");    

    dialog.addChoice(/yes/i, () => {
      this.client.ServerProfiles.getServerProfile(msg.host, msg.profileId).then((res) => {
        if (res.serverHardwareUri === null) {
          return this.transform.text(msg, msg.message.user.name + ", " + this.transform.hyperlink(profileHyperlink, profileName) + " does not have any assigned server hardware to power off. Try assigning server hardware to the profile.");
        }
        else {
          msg.serverId = res.serverHardwareUri;
          return this.serverHardware.PowerOffHardware(msg, false);
        }
      }).catch((err) => {
        return this.transform.error(msg, err);
      });
    });

    dialog.addChoice(/no/i, () => {
      return this.transform.text(msg, "Ok " + msg.message.user.name + " I won't do that.");
    });
  }
}
