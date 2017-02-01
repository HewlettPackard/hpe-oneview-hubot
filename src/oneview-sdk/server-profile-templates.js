/*
(c) Copyright (2016-2017) Hewlett Packard Enterprise Development LP

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

import PromiseFeedback from './utils/emitter';

const uri = '/rest/server-profile-templates/';

export default class ServerProfileTemplates {
  constructor (ov_client) {
    this.ov_client = ov_client;
  }

  getAllServerProfileTemplates(filter) {
    return this.ov_client.ClientConnection.get(uri, filter);
  }

  getServerProfileTemplate(id) {
    return this.ov_client.ClientConnection.get(uri + id);
  }

  getAvailableTargets(id, target) {
    return this.getServerProfileTemplate(id).then((spt) => {
      if (target) {
        target(spt);
      }

      return this.ov_client.ServerProfiles.getAvailableTargets(spt.serverHardwareTypeUri, spt.enclosureGroupUri);
    }).then((available) => {
      return (available.targets || []).filter((t) => { return t.serverHardwareUri; });
    });
  }

  deployProfile(templateUri, serverHardwareUri, name) {
    return PromiseFeedback((feedback) => {
      return this.ov_client.ClientConnection.get((templateUri.startsWith(uri) ? templateUri : uri + templateUri) + '/new-profile').then((profile) => {
        profile.serverHardwareUri = serverHardwareUri;
        profile.name = name;
        return this.ov_client.ServerProfiles.createServerProfile(profile).feedback(feedback);
      });
    });
  }

  getProfilesUsingTemplate(templateUri, target) {
    return this.ov_client.ClientConnection.get('/rest/index/trees' + (templateUri.startsWith(uri) ? templateUri : uri + templateUri) + '?childDepth=1&parentDepth=1').then((res) => {
      if (target) {
        target(res.resource);
      }

      let profiles = [];
      if (res.children) {
        profiles = res.children.server_profile_template_to_server_profiles || [];
      }
      return Promise.all(profiles.map((i) => { return this.ov_client.ServerProfiles.getServerProfile(i.resource.uri); }));
    });
  }

  getNonCompliantProfiles(templateUri, target) {
    return this.getServerProfileTemplate(templateUri).then((template) => {
      target(template);
    }).then(() => {
      return this.ov_client.ClientConnection.get('/rest/index/associations/resources' + '?parentUri=' + (templateUri.startsWith(uri) ? templateUri : uri + templateUri) +
                                                                                        '&name=server_profile_template_to_server_profiles&hasARelationship=true&sort=name:asc' +
                                                                                        '&count=100&start=0&category=server-profiles&query="templateCompliance:\'NonCompliant\'"');
    }).then((res) => {
      if (res && res.members) {
        return Promise.all(res.members.map((m) => { return this.ov_client.ServerProfiles.getServerProfile(m.childResource.uri); }));
      }
      return [];
    });
  }
}
