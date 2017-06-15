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
import { getDeviceNameAndHyperLink } from '../middleware/utils/lexer';
const Conversation = require("hubot-conversation");

export default class ServerProfilesListener extends Listener {
  constructor(robot, client, transform, serverHardware) {
    super(robot, client, transform);
    this.serverHardware = serverHardware;

    this.switchBoard = new Conversation(robot);

    this.title = "Server Profile (sp)";
    this.capabilities = [];
    this.respond(/(?:get|list|show) all (?:server ){0,1}profiles\.$/i, ::this.ListServerProfiles);
    this.capabilities.push(this.indent + "Show all (server) profiles (e.g. show all profiles).");

    this.respond(/(?:get|list|show) (?:\/rest\/server-profiles\/)(:<profileId>[a-zA-Z0-9_-]*?)\.$/i, ::this.ListServerProfile);
    this.capabilities.push(this.indent + "Show a specific (server) profile (e.g. show hadoop cluster).");

    this.respond(/(?:get|list|show) (?:\/rest\/server-profiles\/)(:<profileId>[a-zA-Z0-9_-]*?) compliance(?: preview){0,1}\.$/i, ::this.ListServerProfileCompliancePreview);
    this.capabilities.push(this.indent + "Show a specific (server) profile compliance (e.g. show hadoop cluster compliance).");

    this.respond(/(?:update|make) (?:\/rest\/server-profiles\/)(:<profileId>[a-zA-Z0-9_-]*?) (?:compliance|compliant)\.$/i, ::this.HandleServerCompliantMessage);
    this.capabilities.push(this.indent + "Make/update a specific (server) profile compliance (e.g. make hadoop cluster compliant).");

    this.respond(/(?:turn|power) on (?:\/rest\/server-profiles\/)(:<profileId>[a-zA-Z0-9_-]*?)\.$/i, ::this.PowerOnServerProfile);
    this.respond(/(?:turn|power) off (?:\/rest\/server-profiles\/)(:<profileId>[a-zA-Z0-9_-]*?)\.$/i, ::this.PowerOffServerProfile);
    this.capabilities.push(this.indent + "Power on/off a specific (server) profile (e.g. turn on hadoop cluster).");
  }

  ListServerProfiles(msg) {
    this.client.ServerProfiles.getAllServerProfiles().then((res) => {
      return this.transform.send(msg, res, (res.members && res.members.length === 0 ? 'There are no profiles.' : ''));
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  ListServerProfile(msg) {
    this.client.ServerProfiles.getServerProfile(msg.profileId).then((res) => {
      return this.transform.send(msg, res);
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  ListServerProfileCompliancePreview(msg) {
    this.client.ServerProfiles.getServerProfileCompliancePreview(msg.profileId).then((res) => {
      return this.transform.send(msg, res);
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  MakeServerProfileCompliant(profileId, msg, suppress) {
    let startMessage = false;
    return this.client.ServerProfiles.updateServerProfileCompliance(profileId).feedback((res) => {
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
    this.MakeServerProfileCompliant(msg.profileId, msg).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  PowerOnServerProfile(msg) {
    if(this.client.connection.isReadOnly()) {
      return this.transform.text(msg, "Hold on a sec...  You'll have to set readOnly mode to false in your config file first if you want to do that...   ");
    }


    let dialog = this.switchBoard.startDialog(msg);

    let deviceAndHyperlink = getDeviceNameAndHyperLink("/rest/server-profiles/" + msg.profileId);
    let profileName = deviceAndHyperlink.deviceName;
    let profileHyperlink = deviceAndHyperlink.hyperlink;
    this.transform.text(msg, "Ok " + msg.message.user.name + " I am going to power on the server profile " + this.transform.hyperlink(profileHyperlink, profileName) + ".  Are you sure you want to do this? (@" + this.robot.name + " yes/@" + this.robot.name + " no)");


    dialog.addChoice(/yes/i, () => {
      this.client.ServerProfiles.getServerProfile(msg.profileId).then((res) => {
        return this.serverHardware.PowerOnHardware(res.serverHardwareUri, msg);
      }).catch((err) => {
        return this.transform.error(msg, err);
      });

    });

    dialog.addChoice(/no/i, () => {
      return this.transform.text(msg, "Ok " + msg.message.user.name + " I won't do that.");
    });
  }

  PowerOffServerProfile(msg) {
    if(this.client.connection.isReadOnly()) {
      return this.transform.text(msg, "Hold on a sec...  You'll have to set readOnly mode to false in your config file first if you want to do that...   ");
    }

    let dialog = this.switchBoard.startDialog(msg);

    let deviceAndHyperlink = getDeviceNameAndHyperLink("/rest/server-profiles/" + msg.profileId);
    let profileName = deviceAndHyperlink.deviceName;
    let profileHyperlink = deviceAndHyperlink.hyperlink;
    this.transform.text(msg, "Ok " + msg.message.user.name + " I am going to power off the server profile " + this.transform.hyperlink(profileHyperlink, profileName) + ".  Are you sure you want to do this? (@" + this.robot.name + " yes/@" + this.robot.name + " no)");


    dialog.addChoice(/yes/i, () => {
      this.client.ServerProfiles.getServerProfile(msg.profileId).then((res) => {
        return this.serverHardware.PowerOffHardware(res.serverHardwareUri, msg);
      }).catch((err) => {
        return this.transform.error(msg, err);
      });
    });

    dialog.addChoice(/no/i, () => {
      return this.transform.text(msg, "Ok " + msg.message.user.name + " I won't do that.");
    });
  }
}
