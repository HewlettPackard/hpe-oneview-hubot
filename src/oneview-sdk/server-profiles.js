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

const uri = '/rest/server-profiles/';

export default class ServerProfiles {
  constructor (ov_client) {
    this.ov_client = ov_client;
  }

  getAllServerProfiles(filter) {
    return this.ov_client.connection.get(uri, filter);
  }

  getServerProfile(id) {
    return this.ov_client.connection.get((id.startsWith(uri) ? id : uri + id));
  }

  getProfilesByStatus(status) {
      return this.ov_client.connection.get("/rest/server-profiles?filter=\"status=" + status + "\"");
  }

  createServerProfile(profile) {
    return this.ov_client.ClientConnection.post(uri, profile);
  }

  deleteServerProfile(id) {
    return this.ov_client.ClientConnection.delete((id.startsWith(uri) ? id : uri + id));
  }

  getServerProfileCompliancePreview(id){
    return this.ov_client.connection.get((id.startsWith(uri) ? id : uri + id) + '/compliance-preview');
  }

  updateServerProfileCompliance(id) {
    let body = [{'op':'replace','path':'/templateCompliance','value':'Compliant'}];
    return this.ov_client.connection.patch((id.startsWith(uri) ? id : uri + id), body);
  }

  getAvailableTargets(serverHardwareTypeUri, enclosureGroupUri) {
    return this.ov_client.connection.get(uri + 'available-targets?serverHardwareTypeUri=' + serverHardwareTypeUri + '&enclosureGroupUri=' + enclosureGroupUri);
  }

}
