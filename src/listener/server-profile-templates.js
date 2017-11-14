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
const UserException = require('../oneview-sdk/user-exception');
const Conversation = require('hubot-conversation');

class ServerProfileTemplateListener extends Listener {
  constructor(robot, client, transform, serverHardware, serverProfiles, brain) {
    super(robot, client, transform);
    this.serverHardware = serverHardware;
    this.serverProfiles = serverProfiles;
    this.brain = brain;
    this.switchBoard = new Conversation(robot);

    this.title = "Server Profile Template";
    this.capabilities = [];

    this.LIST_ALL = /(?:get|list|show) all (?:server profile ){0,1}templates\.$/i;
    this.respond(this.LIST_ALL, this.ListServerProfileTemplates.bind(this));
    this.capabilities.push(this.BULLET + "Show all (server) profile templates (e.g. show all templates).");

    this.LIST_AVAILABLE_TARGETS = /(?:get|list|show) available (?:hardware|targets) for (:<host>.*?)(?:\/rest\/server-profile-templates\/)(:<templateId>[a-zA-Z0-9_-]*?)\.$/i;
    this.respond(this.LIST_AVAILABLE_TARGETS, this.GetAvailableTargets.bind(this));
    this.capabilities.push(this.BULLET + "Show available targets for a server profile template (e.g. show available targets for docker swarm).");

    this.LIST_DEPLOYED_PROFILES = /(?:get|list|show) profile[s]{0,1} (?:using|deployed from|deployed by) (:<host>.*?)(?:\/rest\/server-profile-templates\/)(:<templateId>[a-zA-Z0-9_-]*?)\.$/i;
    this.respond(this.LIST_DEPLOYED_PROFILES, this.GetDeployedProfiles.bind(this));
    this.capabilities.push(this.BULLET + "Show profile(s) using a server profile template (e.g. show profiles using docker swarm).");

    this.CREATE_PROFILES_FROM_TEMPATE = /(?:deploy|create) (:<count>\d+) profile[s]{0,1} (?:from|for|using) (:<host>.*?)(?:\/rest\/server-profile-templates\/)(:<templateId>[a-zA-Z0-9_-]*?)\.$/i;
    this.respond(this.CREATE_PROFILES_FROM_TEMPATE, this.DeployProfiles.bind(this));
    this.capabilities.push(this.BULLET + "Create profile(s) using a server profile template (e.g. create 1 profile from docker swarm).");

    this.GROW_TEMPLATE = /(?:flex|grow)(?: the)? (:<host>.*?)(?:\/rest\/server-profile-templates\/)(:<templateId>[a-zA-Z0-9_-]*?) by (:<count>\d+)(?: profile| profiles| hardware| servers)?\.$/i;
    this.respond(this.GROW_TEMPLATE, this.DeployProfiles.bind(this));
    this.capabilities.push(this.BULLET + "Flex/grow a server profile template by a given amount (e.g. grow docker swarm by 4 profiles).");

    this.UNDEPLOY_PROFILES_USING_TEMPLATE = /(?:undeploy|remove) (:<count>\d+) profile[s]{0,1} (?:from|that were deployed from|that were using) (:<host>.*?)(?:\/rest\/server-profile-templates\/)(:<templateId>[a-zA-Z0-9_-]*?)\.$/i;
    this.respond(this.UNDEPLOY_PROFILES_USING_TEMPLATE, this.UnDeployProfiles.bind(this));
    this.UNDEPLOY_PROFILES_USING_SERVERS_IN_TEMPLATE = /(?:undeploy|remove) (:<count>\d+) server[s]{0,1} (?:from|that were deployed from|that were using) (:<host>.*?)(?:\/rest\/server-profile-templates\/)(:<templateId>[a-zA-Z0-9_-]*?)\.$/i;
    this.respond(this.UNDEPLOY_PROFILES_USING_SERVERS_IN_TEMPLATE, this.UnDeployProfiles.bind(this));
    this.capabilities.push(this.BULLET + "Remove a number of profiles/servers from a profile template (e.g. remove 2 profiles from docker swarm).");

    this.FIX_PROFILE_COMPLIANCE = /(?:fix)(?: all)? compliance(?: issues)? for (:<host>.*?)(?:\/rest\/server-profile-templates\/)(:<templateId>[a-zA-Z0-9_-]*?)\.$/i;
    this.respond(this.FIX_PROFILE_COMPLIANCE, this.FixCompliance.bind(this));
    this.capabilities.push(this.BULLET + "Fix compliance for a profile template (e.g. fix compliance for docker swarm).");
  }

  ListServerProfileTemplates(msg) {
    this.client.ServerProfileTemplates.getAllServerProfileTemplates().then((res) => {
      if (res && res.members.length > 0) {
        return this.pagination(msg, res);
      } else {
        return this.transform.text(msg, 'There are no server templates deployed');
      }
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  GetAvailableTargets(msg) {
    let template = null;
    __getAvailableTargets__(msg, (spt) => {
      template = spt;
    }, this.client).then((targets) => {
      if (targets && targets.length > 0) {
        return this.transform.send(msg, targets, "I was able to dig up " + this.transform.makePlural(targets.length, 'server') + ' for ' + this.transform.hyperlink(template.hyperlink, template.name));
      } else {
        return this.transform.text(msg, 'There are no servers available for ' + this.transform.hyperlink(template.hyperlink, template.name));
      }
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  GetDeployedProfiles(msg) {
    let template = null;
    this.client.ServerProfileTemplates.getProfilesUsingTemplate(msg.host, msg.templateId, (spt) => {
      template = spt;
    }).then((profiles) => {
      return this.transform.send(msg, profiles, 'There ' + this.transform.isAre(profiles.length, 'profile') + ' using ' + this.transform.hyperlink(template.hyperlink, template.name));
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  DeployProfiles(msg) {
    let host = msg.host;
    if (this.client.isReadOnly()) {
      return this.transform.text(msg, "Hold on a sec...  You'll have to set readOnly mode to false in your config file first if you want to do that...   ");
    }

    let dialog = this.switchBoard.startDialog(msg);
    this.transform.text(msg, "Ok " + msg.message.user.name + " I am going to deploy " + this.transform.makePlural(msg.count, 'profile') +
      ".  Are you sure you want to do this?\n" + this.BULLET + "@" + this.robot.name + " yes\n" + this.BULLET + "@" + this.robot.name + " no");

    dialog.addChoice(/yes/i, () => {
      let template = null;
      __getAvailableTargets__(msg, (spt) => {
        template = spt;
      }, this.client).then((targets) => {
        let i = -1;
        return targets.filter((t) => {
          if (t.powerState === 'Off') {
            i++;
            return i < msg.count;
          }
        });
      }).then((targets) => {
        if (targets && targets.length > 0) {
          return this.transform.send(msg, targets, 'Alright, I am going to increase the capacity of ' + this.transform.hyperlink(template.hyperlink, template.name) + ' by ' + this.transform.makePlural(targets.length, 'profile') + '.\n' +
            'For each server listed below, I will perform the following operations:\n' +
            this.transform.list('Create a profile using this template\n' +
              'Power on the profile') + "\n" +
            "These operations will take a long time.  Grab a coffee.  I will let you know when I'm finished.").then(() => {
            return Promise.allSettled(targets.map((target) => {
              return this.client.ServerProfileTemplates.deployProfile(host, template.uri, target.uri, template.name + ' - ' + target.name).feedback((res) => {
                this.robot.logger.debug(res);
              }).then((profile) => {
                return this.serverHardware.PowerOnHardware(host, profile.serverHardwareUri, msg, true);
              });
            }));
          });
        } else {
          throw new UserException('Oops there are no servers available for ' + template.name + '. It appears there are no matching servers that are not powered off or do not already have profiles.', 'Try checking the power state of the matching servers.');
        }
      }).then(() => {
        return this.client.ServerProfileTemplates.getProfilesUsingTemplate(host, msg.templateId).then((profiles) => {
          return this.transform.send(msg, profiles, 'Yo ' + msg.message.user.name + ', I just finished deploying those profiles.  Now there ' + this.transform.isAre(profiles.length, 'profile') + ' using ' + this.transform.hyperlink(template.hyperlink, template.name));
        });
      }).catch((err) => {
        return this.transform.error(msg, err);
      });
    });

    dialog.addChoice(/no/i, () => {
      return this.transform.text(msg, "Ok " + msg.message.user.name + " I won't deploy the " + this.transform.makePlural(msg.count, 'profile'));
    });
  }

  UnDeployProfiles(msg) {
    let host = msg.host;
    if (this.client.isReadOnly()) {
      return this.transform.text(msg, "Hmm...  You'll have to set readOnly mode to false in your config file first if you want to do that...   ");
    }

    let dialog = this.switchBoard.startDialog(msg);
    this.transform.text(msg, "Ok " + msg.message.user.name + " I am going to un-deploy " + this.transform.makePlural(msg.count, 'profile') +
      ".  Are you sure you want to do this?\n" + this.BULLET + "@" + this.robot.name + " yes\n" + this.BULLET + "@" + this.robot.name + " no");

    dialog.addChoice(/yes/i, () => {
      let template = null;
      this.client.ServerProfileTemplates.getProfilesUsingTemplate(msg.host, msg.templateId, (spt) => {
        template = spt;
      }).then((profiles) => {
        let i = -1;
        return profiles.filter(() => {
          i++;
          return i < msg.count;
        });
      }).then((profiles) => {
        return this.transform.send(msg, profiles, 'I am going to decrease the capacity of ' + this.transform.hyperlink(template.hyperlink, template.name) + ' by ' + this.transform.makePlural(profiles.length, 'profile') + '.\n' +
          'For each profile listed below, I will perform the following operations:\n' +
          this.transform.list('Power off the profile\n' +
            'Remove the profile') + "\n" +
          'I will notify you when I am finished.  Grab a snack.  This is going to take a bit.').then(() => {
          return Promise.allSettled(profiles.map((profile) => {
            if (profile.serverHardwareUri) {
              return this.PowerOffHardware(host, profile.serverHardwareUri, msg).then(() => {
                return this.client.ServerProfiles.deleteServerProfile(host, profile.uri).feedback((res) => {
                  this.robot.logger.debug(res.taskState + ' ' + res.taskStatus);
                });
              });
            } else {
              return this.client.ServerProfiles.deleteServerProfile(host, profile.uri).feedback((res) => {
                this.robot.logger.debug(res.taskState + ' ' + res.taskStatus);
              });
            }
          }));
        });
      }).then(() => {
        return this.client.ServerProfileTemplates.getProfilesUsingTemplate(host, msg.templateId).then((profiles) => {
          return this.transform.send(msg, profiles, msg.message.user.name + ', I just wrapped up removing those profiles.  There are now ' + this.transform.makePlural(profiles.length, 'profile') + ' using ' + this.transform.hyperlink(template.hyperlink, template.name));
        });
      }).catch((err) => {
        return this.transform.error(msg, err);
      });
    });

    dialog.addChoice(/no/i, () => {
      return this.transform.text(msg, msg.message.user.name + " I won't un-deploy the " + this.transform.makePlural(msg.count, 'profile'));
    });
  }

  PowerOffHardware(host, id, msg) {
    return this.client.ServerHardware.setPowerState(host, id, "Off", "MomentaryPress").feedback((res, err) => {
      this.robot.logger.debug("Powering off blade to fix compliance.", res);
    }).then((res) => {
      return res;
    }).catch((err) => {
      this.transform.error(msg, err);
    });
  }

  FixCompliance(msg) {
    let host = msg.host;
    if (this.client.isReadOnly()) {
      return this.transform.text(msg, "I'm afraid you'll have to set readOnly mode to false in your config file first if you want to do that...");
    }

    let dialog = this.switchBoard.startDialog(msg);

    let nameAndHyperlink = this.brain.getDeviceNameAndHyperLink(host + "/rest/server-profile-templates/" + msg.templateId);
    this.transform.text(msg, msg.message.user.name + " I am going to fix the compliance issues for the profile template " + this.transform.hyperlink(nameAndHyperlink.hyperlink, nameAndHyperlink.deviceName) +
      ".  Are you sure you want to do this?\n" + this.BULLET + "@" + this.robot.name + " yes\n" + this.BULLET + "@" + this.robot.name + " no");

    dialog.addChoice(/yes/i, () => {
      let template = null;
      this.client.ServerProfileTemplates.getNonCompliantProfiles(host, msg.templateId, (spt) => {
        template = spt;
      }).then((profiles) => {
        if (profiles.length == 0) {
          msg.send({
            text: 'There are no profiles using <' + template.hyperlink + '|' + template.name + '> that are out of compliance.'
          });
        } else {
          return this.transform.send(msg, profiles, 'There ' + this.transform.isAre(profiles.length, 'profile') + ' that are out of compliance with ' + this.transform.hyperlink(template.hyperlink, template.name) + ' that I am going to automatically fix.\n' +
            'For each profile listed below, I will perform the following operations:\n' +
            this.transform.list('Power off the profile\n' +
              'Apply all automatic remediations\n' +
              'Power on the profile') + "\n" +
            'This may take a while but I will let you know when I finish.').then(() => {
            return Promise.allSettled(profiles.map((profile) => {
              return this.MakeProfileCompliant(profile, msg).then(() => {
                return this.client.ServerProfiles.getServerProfile(host, profile.uri);
              });
            }));
          }).then((profiles) => {
            return this.transform.send(msg, profiles, msg.message.user.name + ', I finished bringing ' + this.transform.makePlural(profiles.length, 'profile') + ' into compliance with ' + this.transform.hyperlink(template.hyperlink, template.name));
          });
        }
      }).catch((err) => {
        return this.transform.error(msg, err);
      });
    });

    dialog.addChoice(/no/i, () => {
      return this.transform.text(msg, "OK " + msg.message.user.name + " I won't fix the compliance issues.");
    });
  }

  MakeProfileCompliant(profile, msg) {
    if (profile.serverHardwareUri) {
      return this.PowerOffHardware(msg.host, profile.serverHardwareUri, msg).then(() => {

        return this.serverProfiles.MakeServerProfileCompliant(profile.uri, msg, true);
      }).then(() => {
        msg.serverId = profile.serverHardwareUri;
        return this.serverHardware.PowerOnHardware(msg, true);
      });
    } else {
      return this.serverProfiles.MakeServerProfileCompliant(profile.uri, msg, true);
    }
  }

}

function __getAvailableTargets__(msg, target, client) {
  let host = msg.host;
  return client.ServerProfileTemplates.getAvailableTargets(msg.host, msg.templateId, target).then((targets) => {
    if (targets.length > 0) {
      return Promise.allSettled(targets.map((t) => {
        return client.ServerHardware.getServerHardware(host, t.serverHardwareUri);
      }));
    } else {
      return [];
    }
  });
}

module.exports = ServerProfileTemplateListener;
