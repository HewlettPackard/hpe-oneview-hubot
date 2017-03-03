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
});
