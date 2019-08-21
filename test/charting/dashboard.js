/*
(c) Copyright 2016-2019 Hewlett Packard Enterprise Development LP

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
const buildDashboard = require('../../src/charting/dashboard');
const fs = require("fs");
const path = require("path");
const expect = require("chai").expect;

const chai = require('chai');

chai.should();

describe('Dashboard', function() {
  this.timeout(2900);

  let aggregatedAlerts = {
  	members: [{
  		attribute: 'status',
  		counts: [{
  			value: 'Warning',
  			count: 3
  		},
  		{
  			value: 'Critical',
  			count: 1
  		}]
  	}]
  };

  let aggregatedServerProfiles = {
  	members: [{
  		attribute: 'status',
  		counts: [{
  			value: 'Warning',
  			count: 2
  		},
  		{
  			value: 'OK',
  			count: 1
  		}]
  	}]
  };

  let aggregatedServerHardware = {
  	members: [{
  		attribute: 'status',
  		counts: [{
  			value: 'OK',
  			count: 7
  		},
  		{
  			value: 'Critical',
  			count: 1
  		}]
  	}]
  };

  let aggregatedHardwareWithProfiles = {
  	members: [{
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
  	}]
  };

  it('buildDashboard', (done) => {
    let robot = {adapterName: 'shell', logger: {}};

    buildDashboard(robot, 'room', aggregatedAlerts, aggregatedServerProfiles, aggregatedServerHardware, aggregatedHardwareWithProfiles).then((result) => {
      result.should.equal('Adapter shell does not support web file upload.');
      expect(fs.existsSync(`dashboard.png`)).to.equal(true);
    }).then(() => done());

  });
});
