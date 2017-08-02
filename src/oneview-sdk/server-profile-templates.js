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

import PromiseFeedback from './utils/emitter';

const uri = '/rest/server-profile-templates/';

export default class ServerProfileTemplates {
  constructor (ov_client) {
    this.ov_client = ov_client;
    this.connections = ov_client.getConnections();
  }

  getAllServerProfileTemplates(filter) {
    let promises = [];
    let resObj = {'members': []};

    for (let connection of this.connections.values()) {
      promises.push(connection.get(uri, filter));
    }

    return Promise.all(promises).then(response => {
      for (let res of response) {
        resObj.members.push(...res.members);
      }
      return new Promise((resolve) => {
        resolve(resObj);
      });
    });
  }

  getServerProfileTemplate(host, id) {
    const connection = this.connections.get(host);
    return connection.get(id.startsWith(uri) ? id : uri + id);
  }

  getAvailableTargets(host, id, target) {
    return this.getServerProfileTemplate(host, id).then((spt) => {
      if (target) {
        target(spt);
      }
      return this.ov_client.ServerProfiles.getAvailableTargets(host, spt.serverHardwareTypeUri, spt.enclosureGroupUri);
    }).then((available) => {
      return (available.targets || []).filter((t) => { return t.serverHardwareUri; });
    });
  }

  deployProfile(host, templateUri, serverHardwareUri, name) {
    const connection = this.connections.get(host);
    return PromiseFeedback((feedback) => {
      return connection.get((templateUri.startsWith(uri) ? templateUri : uri + templateUri) + '/new-profile').then((profile) => {
        profile.serverHardwareUri = serverHardwareUri;
        profile.name = name;
        return this.ov_client.ServerProfiles.createServerProfile(host, profile).feedback(feedback);
      });
    });
  }

  getProfilesUsingTemplate(host, templateUri, target) {
    const connection = this.connections.get(host);
    return connection.get('/rest/index/trees' + (templateUri.startsWith(uri) ? templateUri : uri + templateUri) + '?childDepth=1&parentDepth=1').then((res) => {
      if (target) {
        target(res.resource);
      }

      let profiles = [];
      if (res.children) {
        profiles = res.children.server_profile_template_to_server_profiles || [];
      }
      return Promise.all(profiles.map((i) => { return this.ov_client.ServerProfiles.getServerProfile(host, i.resource.uri); }));
    });
  }

  getNonCompliantProfiles(host, templateUri, target) {
    const connection = this.connections.get(host);
    return this.getServerProfileTemplate(host, templateUri).then((template) => {
      target(template);
    }).then(() => {
      return connection.get('/rest/index/associations/resources' + '?parentUri=' + (templateUri.startsWith(uri) ? templateUri : uri + templateUri) +
                                                                                        '&name=server_profile_template_to_server_profiles&hasARelationship=true&sort=name:asc' +
                                                                                        '&count=100&start=0&category=server-profiles&query="templateCompliance:\'NonCompliant\'"');
    }).then((res) => {
      if (res && res.members) {
        return Promise.all(res.members.map((m) => { return this.ov_client.ServerProfiles.getServerProfile(host, m.childResource.uri); }));
      }
      return [];
    });
  }
}
