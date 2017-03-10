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

import ServerProfilesListener from './server-profiles';

const BULLET = '\t\u2022 ';

export default class BotListener extends Listener {
  constructor(robot, client, transform, developer,
    serverHardware, serverProfiles, serverProfileTemplate) {
    super(robot, client, transform);
    this.developer = developer;
    this.serverHardware = serverHardware;
    this.serverProfiles = serverProfiles;
    this.serverProfileTemplate = serverProfileTemplate;

    this.title = "bot";
    this.capabilities = [];

    this.respond(/help\.$/i, ::this.ListActions);
    this.respond(/What can you do(?: for me){0,1}\.$/i, ::this.ListActions);
    this.capabilities.push(this.indent + "Help (Show list of areas of help).");

    this.respond(/(:<text>[a-zA-Z][a-z A-Z]*?) help\.$/i, ::this.ListActionsFor);
    this.capabilities.push(this.indent + "<text> Help (Show help in a specific area).");
  }

  ListActions(msg) {
    return this.transform.text(msg, this.GetActions());
  }

  GetActions() {
    return "What can I help you with today? Here's just a few things I can do:\n" +
      BULLET + this.serverProfiles.title + " help.\n" +
      BULLET + this.serverProfileTemplate.title + " help.\n" +
      BULLET + this.serverHardware.title + " help.\n";
//      BULLET + this.developer.capabilitiesHeader + "\n" +
  }

  ListAllActions(msg) {
    return this.transform.text(msg, this.GetAllActions());
  }

  GetAllActions() {
    return "I can do lots of things.  I can:\n" +
      this.serverProfiles.title + " commands:\n" +
      this.serverProfiles.capabilities.join('\n') + '\n' +
      this.serverProfileTemplate.title + " commands:\n" +
      this.serverProfileTemplate.capabilities.join('\n') + '\n' +
      this.serverHardware.title + " commands:\n" +
      this.serverHardware.capabilities.join('\n') + '\n' +
//      this.developer.title + " commands:\n" +
//      this.developer.capabilities +
      "";
  }

  ListActionsFor(msg) {
    return this.transform.text(msg, this.GetActionsFor(msg.text.toLowerCase()));
  }

  GetActionsFor(text) {
    switch (text) {
      case "server profiles":
      case "server profile":
      case "profiles":
      case "profile":
      case "sp":
        return this.serverProfiles.title + " commands:\n" +
          this.serverProfiles.capabilities.join('\n');
      case "server profile templates":
      case "server profile template":
      case "profile templates":
      case "profile template":
      case "templates":
      case "template":
      case "spt":
        return this.serverProfileTemplate.title + " commands:\n" +
          this.serverProfileTemplate.capabilities.join('\n');
      case "server hardware":
      case "hardware":
      case "sh":
        return this.serverHardware.title + " commands:\n" +
          this.serverHardware.capabilities.join('\n');
      case "all": //all help
        return this.GetAllActions();
      default:
        return this.GetActions();
    }
  }

}
