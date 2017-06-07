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
import UserException from '../oneview-sdk/user-exception';
import { getDeviceNameAndHyperLink } from '../middleware/utils/lexer';
const Conversation = require('hubot-conversation');

export default class ServerProfileTemplateListener extends Listener {
  constructor(robot, client, transform, serverHardware, serverProfiles) {
    super(robot, client, transform);
    this.serverHardware = serverHardware;
    this.serverProfiles = serverProfiles;

    this.switchBoard = new Conversation(robot);

    this.title = "Server Profile Template (spt)";
    this.capabilities = [];
    this.respond(/(?:get|list|show) all (?:server profile ){0,1}templates\.$/i, ::this.ListServerProfileTemplates);
    this.capabilities.push(this.indent + "Show all (server) profile templates (e.g. show all templates).");

    this.respond(/(?:get|list|show) available (?:hardware|targets) for (?:\/rest\/server-profile-templates\/)(:<templateId>[a-zA-Z0-9_-]*?)\.$/i, ::this.GetAvailableTargets);
    this.capabilities.push(this.indent + "Show available targets for a server profile template (e.g. show available targets for docker swarm).");

    this.respond(/(?:get|list|show) profile[s]{0,1} (?:using|deployed from|deployed by) (?:\/rest\/server-profile-templates\/)(:<templateId>[a-zA-Z0-9_-]*?)\.$/i, ::this.GetDeployedProfiles);
    this.capabilities.push(this.indent + "Show profile(s) using a server profile template (e.g. show profile using docker swarm).");

    this.respond(/(?:deploy|create) (:<count>\d+) profile[s]{0,1} (?:from|for|using) (?:\/rest\/server-profile-templates\/)(:<templateId>[a-zA-Z0-9_-]*?)\.$/i, ::this.DeployProfiles);
    this.capabilities.push(this.indent + "Create profile(s) using a server profile template (e.g. create profile for docker swarm).");

    this.respond(/(?:flex|grow)(?: the)? (?:\/rest\/server-profile-templates\/)(:<templateId>[a-zA-Z0-9_-]*?) by (:<count>\d+)(?: profile| profiles| hardware| servers)?\.$/i, ::this.DeployProfiles);
    this.capabilities.push(this.indent + "Flex/grow a server profile template by a given amount (e.g. grow docker swarm by 4 profiles).");

    this.respond(/(?:undeploy|remove) (:<count>\d+) profile[s]{0,1} (?:from|that were deployed from|that were using) (?:\/rest\/server-profile-templates\/)(:<templateId>[a-zA-Z0-9_-]*?)\.$/i, ::this.UnDeployProfiles);
    this.respond(/(?:undeploy|remove) (:<count>\d+) server[s]{0,1} (?:from|that were deployed from|that were using) (?:\/rest\/server-profile-templates\/)(:<templateId>[a-zA-Z0-9_-]*?)\.$/i, ::this.UnDeployProfiles);
    this.capabilities.push(this.indent + "Remove a number of profiles/servers from a profile template (e.g. remove 2 profiles from docker swarm).");

    this.respond(/(?:fix)(?: all)? compliance(?: issues)? for (?:\/rest\/server-profile-templates\/)(:<templateId>[a-zA-Z0-9_-]*?)\.$/i, ::this.FixCompliance);
    this.capabilities.push(this.indent + "Fix compliance for a profile template (e.g. fix compliance for docker swarm).");
  }

  __getAvailableTargets__(id, target) {
    return this.client.ServerProfileTemplates.getAvailableTargets(id, target).then((targets) => {
      return Promise.allSettled(targets.map((t) => { return this.client.ServerHardware.getServerHardware(t.serverHardwareUri); }));
    });
  }

  ListServerProfileTemplates(msg) {
    this.client.ServerProfileTemplates.getAllServerProfileTemplates().then((res) => {
      if (res && res.members.length > 0) {
        return this.transform.send(msg, res);
      } else {
        return this.transform.text(msg, 'There are no server templates deployed');
      }
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  GetAvailableTargets(msg) {
    var template = null;
    this.__getAvailableTargets__(msg.templateId, (spt) => { template = spt; }).then((targets) => {
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
    var template = null;
    this.client.ServerProfileTemplates.getProfilesUsingTemplate(msg.templateId, (spt) => { template = spt; }).then((profiles) => {
      return this.transform.send(msg, profiles, 'There ' + this.transform.isAre(profiles.length,  'profile') + ' using ' + this.transform.hyperlink(template.hyperlink, template.name));
    }).catch((err) => {
      return this.transform.error(msg, err);
    });
  }

  DeployProfiles(msg) {
    if(this.client.connection.isReadOnly()) {
      return this.transform.text(msg, "Hold on a sec...  You'll have to set readOnly mode to false in your config file first if you want to do that...   ");
    }

    let dialog = this.switchBoard.startDialog(msg);
    this.transform.text(msg, "Ok " + msg.message.user.name + " I am going to deploy " + this.transform.makePlural(msg.count, 'profile') + ".  Are you sure you want to do this? (yes/no)");

    dialog.addChoice(/yes/i, () => {
      var template = null;
      this.__getAvailableTargets__(msg.templateId, (spt) => { template = spt; }).then((targets) => {
        var i = -1;
        return targets.filter((t) => {
          if (t.powerState === 'Off') {
            i++;
            return i < msg.count
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
              return this.client.ServerProfileTemplates.deployProfile(template.uri, target.uri, template.name + ' - ' + target.name).feedback((res) => {
                this.robot.logger.debug(res);
              }).then((profile) => {
                return this.serverHardware.PowerOnHardware(profile.serverHardwareUri, msg, true);
              });
            }));
          });
        } else {
          throw new UserException('Oops there are no servers available for ' + template.name + '. It appears there are no matching servers that are not powered off or do not already have profiles.', 'Try checking the power state of the matching servers.');
        }
      }).then(() => {
        return this.client.ServerProfileTemplates.getProfilesUsingTemplate(msg.templateId).then((profiles) => {
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
    if(this.client.connection.isReadOnly()) {
      return this.transform.text(msg, "Hmm...  You'll have to set readOnly mode to false in your config file first if you want to do that...   ");
    }

    let dialog = this.switchBoard.startDialog(msg);
    this.transform.text(msg, "Ok " + msg.message.user.name + " I am going to un-deploy " + this.transform.makePlural(msg.count, 'profile') + ".  Are you sure you want to do this? (yes/no)");

    dialog.addChoice(/yes/i, () => {
      var template = null;
      this.client.ServerProfileTemplates.getProfilesUsingTemplate(msg.templateId, (spt) => { template = spt; }).then((profiles) => {
        var i = -1;
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
            return this.serverHardware.PowerOffHardware(profile.serverHardwareUri, msg, true).then(() => {
              return this.client.ServerProfiles.deleteServerProfile(profile.uri).feedback((res) => {
                this.robot.logger.debug(res);
              });
            });
          }));
        });
      }).then(() => {
        return this.client.ServerProfileTemplates.getProfilesUsingTemplate(msg.templateId).then((profiles) => {
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

  FixCompliance(msg) {
    if(this.client.connection.isReadOnly()) {
      return this.transform.text(msg, "I'm afraid you'll have to set readOnly mode to false in your config file first if you want to do that...");
    }

    let dialog = this.switchBoard.startDialog(msg);

    let nameAndHyperlink = getDeviceNameAndHyperLink("/rest/server-profile-templates/" + msg.templateId);
    let templateName = nameAndHyperlink.deviceName;
    let templateHyperlink = nameAndHyperlink.hyperlink;
    this.robot.logger.info("Template name: " + templateName + " template hyperlink: " + templateHyperlink);
    this.transform.text(msg, msg.message.user.name + " I am going to fix the compliance issues for the profile template " + this.transform.hyperlink(templateHyperlink, templateName) + ".  Are you sure you want to do this? (yes/no)");


    dialog.addChoice(/yes/i, () => {
      var template = null;
      this.client.ServerProfileTemplates.getNonCompliantProfiles(msg.templateId, (spt) => { template = spt; }).then((profiles) => {
        if (profiles.length == 0) {
          msg.send({text:'There are no profiles using <' + template.hyperlink + '|' + template.name + '> that are out of compliance.'})
        } else {
          return this.transform.send(msg, profiles, 'There ' + this.transform.isAre(profiles.length, 'profile') + ' that are out of compliance with ' + this.transform.hyperlink(template.hyperlink, template.name) + ' that I am going to automatically fix.\n' +
                                          'For each profile listed below, I will perform the following operations:\n' +
                      this.transform.list('Power off the profile\n' +
                                          'Apply all automatic remediations\n' +
                                          'Power on the profile') + "\n" +
                                          'This may take a while but I will let you know when I finish.').then(() => {
            return Promise.allSettled(profiles.map((profile) => {
              //TODO bug here if the template is not assigned to a blade, need to null check profile.serverHardwareUri
              return this.serverHardware.PowerOffHardware(profile.serverHardwareUri, msg, true).then(() => {
                return this.serverProfiles.MakeServerProfileCompliant(profile.uri, msg, true);
              }).then(() => {
                return this.serverHardware.PowerOnHardware(profile.serverHardwareUri, msg, true);
              }).then(() => {
                return this.client.ServerProfiles.getServerProfile(profile.uri);
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
}
