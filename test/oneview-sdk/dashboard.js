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
const OVClient = require('../../src/oneview-sdk/ov-client');
const Dashboard = require('../../src/oneview-sdk/dashboard');

const chai = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const Bluebird = require('bluebird');

chai.should();

describe('Dashboard', () => {

  let oneviewConfig = {
    hosts: [{
      applianceIp: "localhost",
      apiVersion: 300,
      userName: "admin",
      password: "password",
      doProxy: false,
      proxyHost: "0.0.0.0",
      proxyPort: 0
    }]
  };

  let client = new OVClient(oneviewConfig, {});

  it('get aggregated server hardware', () => {
    let res = [{
  		attribute: 'status',
  		counts: [{
  			value: 'Warning',
  			count: 3
  		},
  		{
  			value: 'Critical',
  			count: 1
  		}]
  	}];

    let stub = sinon.stub(client.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(res));

    let dashboard = new Dashboard(client);

    dashboard.getAggregatedServerHardware().then((result) => {
      result.members.length.should.equal(1);
      result.members[0].counts[0].value.should.equal('Warning');
      result.members[0].counts[1].value.should.equal('Critical');
      stub.restore();
    });
  });

  it('get aggregated server profiles', () => {
    let res = [{
  		attribute: 'status',
  		counts: [{
  			value: 'Warning',
  			count: 2
  		},
  		{
  			value: 'OK',
  			count: 1
  		}]
  	}];

    let stub = sinon.stub(client.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(res));

    let dashboard = new Dashboard(client);

    dashboard.getAggregatedServerProfiles().then((result) => {
      result.members.length.should.equal(1);
      result.members[0].counts[0].value.should.equal('Warning');
      result.members[0].counts[1].value.should.equal('OK');
      stub.restore();
    });
  });

  it('get aggregated alerts', () => {
    let res = [{
  		attribute: 'status',
  		counts: [{
  			value: 'Warning',
  			count: 3
  		},
  		{
  			value: 'Critical',
  			count: 1
  		}]
  	}];

    let stub = sinon.stub(client.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(res));

    let dashboard = new Dashboard(client);

    dashboard.getAggregatedAlerts().then((result) => {
      result.members.length.should.equal(1);
      result.members[0].counts[0].value.should.equal('Warning');
      result.members[0].counts[1].value.should.equal('Critical');
      stub.restore();
    });
  });

  it('get aggregated servers with profiles', () => {
    let res = [{
  		attribute: 'state',
  		counts: [{
  			value: 'NoProfileApplied',
  			count: 7
  		},
      {
  			value: 'ProfileApplied',
  			count: 12
  		},
  		{
  			value: 'ProfileError',
  			count: 1
  		}]
  	}];

    let stub = sinon.stub(client.getConnections().get('localhost'), '__http__').returns(Bluebird.resolve(res));

    let dashboard = new Dashboard(client);

    dashboard.getAggregatedServersWithProfiles().then((result) => {
      result.members.length.should.equal(1);
      result.members[0].counts[0].value.should.equal('NoProfileApplied');
      result.members[0].counts[1].value.should.equal('ProfileApplied');
      result.members[0].counts[2].value.should.equal('ProfileError');
      stub.restore();
    });
  });

});
