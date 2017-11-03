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
const Connection = require('../../src/oneview-sdk/connection');

const sinon = require('sinon');
const chai = require('chai');
const Bluebird = require('bluebird');
const nock = require('nock');

chai.should();

let profileResponse = {
  "type":"ServerProfile",
  "name":"Profile101",
  "serverHardwareUri":"/rest/server-hardware/uri",
  "uri":"/rest/server-profiles/cc7b3c49-ef11",
  "__task_output__": {
    "type": "TaskResourceV2",
    "category": "tasks",
    "associatedResource": {
      "resourceUri": "/rest/server-profiles/cc7b3c49-ef11",
      "resourceCategory": "server-profiles",
      "resourceName": "asdf",
      "associationType": "MANAGED_BY"
    },
    "uri": "/rest/tasks/4634D96A-CE45-41F5-B9DF-7DC5AC6B2F12"
  },
  "__task_state__": "Completed"
};

let serverHardwareResponse = {
  "type": "server-hardware-list",
  "category": "server-hardware",
  "count": 1,
  "members": [
      {
          "type": "server-hardware",
          "name": "0000A6610EE, bay 5",
      }]
};

let taskResponse = {
  type: "TaskResourceV2",
  category: "tasks",
  associatedResource: {
    resourceUri: "",
    resourceCategory: "server-profiles",
    resourceName: "asdf",
    associationType: "MANAGED_BY"
  },
  uri: "/rest/tasks/4634D96A-CE45-41F5-B9DF-7DC5AC6B2F12",
  statusCode: 202,
  headers: {
    location: "/rest/tasks/4634D96A-CE45-41F5-B9DF-7DC5AC6B2F12"
  }
};

let updatedTaskResponse = {
  type: "TaskResourceV2",
  category: "tasks",
  associatedResource: {
    resourceUri: "/rest/server-profiles/cc7b3c49-ef11",
    resourceCategory: "server-profiles",
    resourceName: "asdf",
    associationType: "MANAGED_BY"
  },
  uri: "/rest/tasks/4634D96A-CE45-41F5-B9DF-7DC5AC6B2F12"
};

let updatedTaskResponseTerminal = {
  type: "TaskResourceV2",
  category: "tasks",
  associatedResource: {
    resourceUri: "/rest/server-profiles/cc7b3c49-ef11",
    resourceCategory: "server-profiles",
    resourceName: "asdf",
    associationType: "MANAGED_BY"
  },
  uri: "/rest/tasks/4634D96A-CE45-41F5-B9DF-7DC5AC6B2F12",
  taskState: 'Completed'
};

describe('Connection', () => {
  let connection;

  beforeEach(() => {
    connection = new Connection("localhost", 300, false, "0.0.0.0", 0);
  });

  it('setProxy', () => {
    connection.setProxy('host', 8080);
    connection.proxyHost.should.equal('host');
    connection.proxyPort.should.equal(8080);
  });

  it('get', sinon.test(function() {
    sinon.stub(connection, '__http__').returns(Bluebird.resolve(serverHardwareResponse));

    connection.get('/rest/server-hardware', {}).then(function(data) {
      data.type.should.equal('server-hardware-list');
      data.count.should.equal(1);
      data.members[0].name.should.equal('0000A6610EE, bay 5');
    });
  }));

  it('post', sinon.test(function() {
    let data = {
      "type":"ServerProfile",
      "name":"Profile101",
      "serverHardwareUri":"/rest/server-hardware/uri"
    };

    sinon.stub(connection, '__http__').returns(Bluebird.resolve(profileResponse));

    return connection.post('/rest/server-profiles', data).then(function(data) {
      data.type.should.equal('ServerProfile');
      data.__task_output__.type.should.equal('TaskResourceV2');
      data.__task_output__.associatedResource.resourceUri.should.equal(data.uri);
      data.__task_state__.should.equal('Completed');
    });
  }));

  it('put', sinon.test(function() {
    let data = {
      "type":"ServerProfile",
      "name":"Profile102",
      "serverHardwareUri":"/rest/server-hardware/uri"
    };

    sinon.stub(connection, '__http__').returns(Bluebird.resolve(profileResponse));

    return connection.put('/rest/server-profiles/cc7b3c49-ef11', data).then(function(data) {
      data.type.should.equal('ServerProfile');
      data.__task_output__.type.should.equal('TaskResourceV2');
      data.__task_output__.associatedResource.resourceUri.should.equal(data.uri);
      data.__task_state__.should.equal('Completed');
    });
  }));

  it('patch', sinon.test(function() {
    let data = [{'op':'replace','path':'/templateCompliance','value':'Compliant'}];

    sinon.stub(connection, '__http__').returns(Bluebird.resolve(profileResponse));

    return connection.patch('/rest/server-profiles/cc7b3c49-ef11', data).then(function(data) {
      data.type.should.equal('ServerProfile');
      data.__task_output__.type.should.equal('TaskResourceV2');
      data.__task_output__.associatedResource.resourceUri.should.equal(data.uri);
      data.__task_state__.should.equal('Completed');
    });
  }));

  it('delete', sinon.test(function() {
    sinon.stub(connection, '__http__').returns(Bluebird.resolve(profileResponse));

    return connection.delete('/rest/server-profiles/cc7b3c49-ef11').then(function(data) {
      data.type.should.equal('ServerProfile');
      data.__task_output__.type.should.equal('TaskResourceV2');
      data.__task_output__.associatedResource.resourceUri.should.equal(data.uri);
      data.__task_state__.should.equal('Completed');
    });
  }));

  it('requestHandleTasks get', sinon.test(function(done) {
    let mockResponse = {
      body: serverHardwareResponse
    };

    nock('https://localhost')
      .get('/rest/server-hardware')
      .reply(200, mockResponse);

    let options = {
      method: "GET",
      url: "https://localhost/rest/server-hardware",
      headers: {
        "host": "localhost"
      }
    };

    connection.__requestHandleTasks__(options, {}).then(function(result){
      try {
        result.category.should.equal('server-hardware');
        result.count.should.equal(1);
        result.members[0].name.should.equal('0000A6610EE, bay 5');
        done();
      } catch(err) {
        done(err);
      }
    });
  }));

  it('checkTask delete', sinon.test(function(done) {

    taskResponse.taskState = 'Completed';

    nock('https://localhost')
      .get('/rest/tasks/4634D96A-CE45-41F5-B9DF-7DC5AC6B2F12')
      .reply(200, taskResponse);

    const options = {
      method: 'DELETE'
    };
    connection.__checkTask__(taskResponse, {}, '', options).then(function(result){
      try {
        result.category.should.equal('tasks');
        result.associatedResource.resourceUri.should.equal('');
        done();
      } catch(err) {
        done(err);
      }
    });
  }));

  it('checkTask post/put terminal', sinon.test(function(done) {

    updatedTaskResponse.taskState = 'Completed';

    nock('https://localhost')
      .get('/rest/tasks/4634D96A-CE45-41F5-B9DF-7DC5AC6B2F12')
      .reply(200, updatedTaskResponse);

    nock('https://localhost')
      .get('/rest/server-profiles/cc7b3c49-ef11')
      .reply(200, profileResponse);

    const options = {
      method: 'POST'
    };
    connection.__checkTask__(updatedTaskResponse, {}, '', options).then(function(result){
      try {
        result.type.should.equal('ServerProfile');
        result.name.should.equal('Profile101');
        result.__task_output__.type.should.equal('TaskResourceV2');
        result.__task_state__.should.equal('Completed');
        done();
      } catch(err) {
        done(err);
      }
    });
  }));

  //TODO fix this test
  // it('checkTask post/put polling', sinon.test(function(done) {
  //   nock('https://localhost', {
  //     reqheaders: {
  //         'X-API-Version': 300,
  //         'Accept': 'application/json',
  //         'Content-Type': 'application/json',
  //         'auth': ''
  //       }
  //     })
  //     .get('/rest/tasks/4634D96A-CE45-41F5-B9DF-7DC5AC6B2F12')
  //     .reply(200, updatedTaskResponseTerminal);
  //
  //   nock('https://localhost')
  //     .get('/rest/server-profiles/cc7b3c49-ef11')
  //     .reply(200, profileResponse);
  //
  //   const options = {
  //     method: 'POST'
  //   };
  //
  //   updatedTaskResponse.taskState = 'Running';
  //   connection.__checkTask__(updatedTaskResponse, {}, '', options).then(function(result){
  //     try {
  //       done();
  //     } catch(err) {
  //       done(err);
  //     }
  //   });
  // }));
});
