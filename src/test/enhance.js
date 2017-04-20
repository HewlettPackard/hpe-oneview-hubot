
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

import ResourceEnhancer from '../oneview-sdk/utils/enhance';

let chai = require('chai');
let sinon = require('sinon');

describe('ResourceEnhancer', () => {
  let resourceEnhancer;

  beforeEach(() => {
    resourceEnhancer = new ResourceEnhancer('localhost');
  });

  it('removeHyperlinks no change', () => {
    let body = {powerState: 'Off', powerControl: 'MomentaryPress'};
    let result = resourceEnhancer.removeHyperlinks(body);
    chai.expect(result).to.deep.equal({ powerState: 'Off', powerControl: 'MomentaryPress' });
  });

  it('removeHyperlinks change', () => {
    let body = {powerState: 'Off', powerControl: 'MomentaryPress', hyperlink: '/rest/resource'};
    let result = resourceEnhancer.removeHyperlinks(body);
    chai.expect(result).to.deep.equal({ powerState: 'Off', powerControl: 'MomentaryPress' });
  });

  it('transformHyperlinks server hardware', () => {
    let body = {uri: '/rest/server-hardware/resourceID'};
    let result = resourceEnhancer.transformHyperlinks('authtoken', body);
    chai.expect(result).to.deep.equal({
      uri: '/rest/server-hardware/resourceID',
      hyperlink: 'https://localhost/#/server-hardware/show/overview/r/rest/server-hardware/resourceID?s_sid=authtoken' });
  });

  it('transformHyperlinks server profiles', () => {
    let body = {uri: '/rest/server-profiles/resourceID'};
    let result = resourceEnhancer.transformHyperlinks('authtoken', body);
    chai.expect(result).to.deep.equal({
      uri: '/rest/server-profiles/resourceID',
      hyperlink: 'https://localhost/#/profiles/show/overview/r/rest/server-profiles/resourceID?s_sid=authtoken' });
  });

  it('transformHyperlinks server profile templates', () => {
    let body = {uri: '/rest/server-profile-templates/resourceID'};
    let result = resourceEnhancer.transformHyperlinks('authtoken', body);
    chai.expect(result).to.deep.equal({
      uri: '/rest/server-profile-templates/resourceID',
      hyperlink: 'https://localhost/#/profile-templates/show/overview/r/rest/server-profile-templates/resourceID?s_sid=authtoken' });
  });

  it('transformHyperlinks enclosures', () => {
    let body = {uri: '/rest/enclosures/resourceID'};
    let result = resourceEnhancer.transformHyperlinks('authtoken', body);
    chai.expect(result).to.deep.equal({
      uri: '/rest/enclosures/resourceID',
      hyperlink: 'https://localhost/#/enclosure/show/overview/r/rest/enclosures/resourceID?s_sid=authtoken' });
  });

  it('transformHyperlinks server hardware types', () => {
    let body = {uri: '/rest/server-hardware-types/resourceID'};
    let result = resourceEnhancer.transformHyperlinks('authtoken', body);
    chai.expect(result).to.deep.equal({
      uri: '/rest/server-hardware-types/resourceID',
      hyperlink: 'https://localhost/#/server-hardware-types/show/general/r/rest/server-hardware-types/resourceID?s_sid=authtoken' });
  });

  it('transformHyperlinks alerts and tasks', () => {
    let body = {uri: '/rest/alerts/resourceID'};
    let result = resourceEnhancer.transformHyperlinks('authtoken', body);
    chai.expect(result).to.deep.equal({
      uri: '/rest/alerts/resourceID',
      hyperlink: 'https://localhost/#/activity/r/rest/alerts/resourceID?s_sid=authtoken' });

    body = {uri: '/rest/tasks/resourceID'};
    result = resourceEnhancer.transformHyperlinks('authtoken', body);
    chai.expect(result).to.deep.equal({
      uri: '/rest/tasks/resourceID',
      hyperlink: 'https://localhost/#/activity/r/rest/tasks/resourceID?s_sid=authtoken' });
  });

  it('addSHInterconnectDowlinkHyperlinks 1 port', () => {
    let body = {
      type: 'server-hardware',
      portMap: {
        deviceSlots: [{
          physicalPorts: [{
            interconnectPort: 9,
            portNumber: 1,
            physicalInterconnectUri: '/rest/interconnects/id1'
          }]
        }]
      }
    };
    let result = resourceEnhancer.transformHyperlinks('authtoken', body);
    chai.expect(result).to.deep.equal(body);
  });

  it('addSHInterconnectDowlinkHyperlinks 2 ports', () => {
    let body = {
      type: 'server-hardware',
      portMap: {
        deviceSlots: [{
          physicalPorts: [{
            interconnectPort: 9,
            portNumber: 1,
            physicalInterconnectUri: '/rest/interconnects/id1'
          },
          {
            interconnectPort: 9,
            portNumber: 2,
            physicalInterconnectUri: '/rest/interconnects/id2'
          }]
        }]
      }
    };
    let result = resourceEnhancer.transformHyperlinks('authtoken', body);
    chai.expect(result).to.deep.equal(body);
  });
});
