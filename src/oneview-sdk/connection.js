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

import request from 'request-promise';
import PromiseFeedback from './utils/emitter';
import Enhance from './utils/enhance';
import { isTerminal } from './tasks';

//TODO this is global to the NodeJS process we probably want to figure out a cleaner way to do this
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var useProxy = false;

export default class Connection {
  constructor(host, apiVersion, doProxy, proxyHost, proxyPort){
    this.host = host;
    this.apiVersion = apiVersion;
    this.enhance = new Enhance(this.host);
    this.headers = {
      'X-API-Version': apiVersion,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'auth': ''
    };

    if (doProxy) {
      useProxy = true;
      this.setProxy(proxyHost, proxyPort);
    }

    this.loggedIn = false;
  }

  setProxy(proxyHost, proxyPort) {
    this.proxyHost = proxyHost;
    this.proxyPort = proxyPort;
  }

  get(path, filter) {
    if (!path) {
      throw "The path for a GET request must be defined.";
    }

    const options = {
      method: 'GET',
      uri: 'https://' + this.host + path,
      json: true,
      headers: this.headers,
      resolveWithFullResponse: true
    };

    if (filter) {
      options.qs = filter;
    }

    return this.__http__(options);
  }

  post(path, body) {
    if (!path) {
      throw "The path for a POST request must be defined.";
    }

    return this.__http__({
      method: 'POST',
      uri: 'https://' + this.host + path,
      json: true,
      headers: this.headers,
      body: this.enhance.removeHyperlinks(body),
      resolveWithFullResponse: true
    });
  }

  put(path, body) {
    if (!path) {
      throw "The path for a PUT request must be defined.";
    }

    return this.__http__({
      method: 'PUT',
      uri: 'https://' + this.host + path,
      json: true,
      headers: this.headers,
      body: this.enhance.removeHyperlinks(body),
      resolveWithFullResponse: true
    });
  }

  patch(path, body) {
    if (!path) {
      throw "The path for a PATCH request must be defined.";
    }

    return this.__http__({
      method: 'PATCH',
      uri: 'https://' + this.host + path,
      json: true,
      headers: this.headers,
      body: this.enhance.removeHyperlinks(body),
      resolveWithFullResponse: true
    });
  }

  delete(path) {
    if (!path) {
      throw "The path for a DELETE request must be defined.";
    }

    return this.__http__({
      method: 'DELETE',
      uri: 'https://' + this.host + path,
      json: true,
      headers: this.headers,
      resolveWithFullResponse: true
    });
  }

  //Mark the method as "private" by convention, note this is pseudo privacy.
  __http__(options) {
    if (useProxy)
    {
      options.proxy = 'http://' + this.proxyHost + ':' + this.proxyPort;
    }

    if (options.uri.endsWith('/rest/login-sessions')) {
      return request(options).then(::this.__handleResponse__);
    }

    if (options.uri.endsWith('/rest/certificates/ca')) {
      //This result is just a string in the body, not a JSON object
      return request(options).then((res) => { return res.body; });
    }

    //Create a new promise that we can wrap with a feedback mechanisim so we can handle APIs that return TaskResources seemlessly
    return PromiseFeedback((feedback) => {
      return Promise.all([
        this.__newSession__(), //TODO: This auth request needs to be per user once we have a per user login-session
        this.__requestHandleTasks__(options, feedback)
      ]).then((arr) => {
        return this.enhance.transformHyperlinks(...arr);
      });
    });
  }

  __handleResponse__(res) {
    let response;
    if (typeof res === 'string') {
      response = JSON.parse(res);
    } else {
      response = res;
    }
    if (response && response.statusCode == 202 && response.headers.location) {
      return this.__getTask__(response.headers.location);
    }
    if (response && response.body) {
      return response.body;
    }

    return {};
  }

  __getTask__(uri) {
    if (!uri) {
      throw "The uri for the TaskResoruce must be defined.";
    }

    return request({
      method: 'GET',
      json: true,
      headers: this.headers,
      uri: 'https://' + this.host + uri
    });
  }

 __requestHandleTasks__(options, feedback) {
   return new Promise((resolve, reject) => {
     request(options).then(::this.__handleResponse__).then((res) => {
       try {
         if (!res.type || !res.type.startsWith("TaskResource") || options.uri.endsWith(res.uri)) {
           resolve(res);
         } else {
           let task = res;
           this.__newSession__().then((auth) => {
             //Start the polling loop
             this.__checkTask__(task, feedback, auth, options).then((res) => {
               resolve(res);
             });
           }).catch(reject);
         }
       } catch(err) {
         if (err) {
           reject(err);
         } else {
           reject({msg:'Error resolving request',arguments:arguments});
         }
       }
     }).catch(reject);
   });
 }

 __checkTask__(task, feedback, auth, options) {
   let resourceUri = task.associatedResource.resourceUri;
   const fetch = {
     method: 'GET', json: true, headers: this.headers,
     uri: 'https://' + this.host + task.uri
   };

   if (isTerminal(task)) {
     return new Promise((resolve, reject) => {
       if (!resourceUri || options.method === 'DELETE') {
         resolve(task);
       } else {
         fetch.uri = 'https://' + this.host + resourceUri;
         //TODO: What happens in the case of a SP/SPT operation that ends in parameter validation?
         request(fetch).then((res) => {
           res.__task_output__ = task;
           res.__task_state__ = task.taskState;
           return resolve(res);
         }).catch(reject);
       }
     });
   } else {
     return new Promise((r) => setTimeout(r, 150)).then(() => { return request(fetch); }).then((res) => {
       task = res;
       feedback(this.enhance.transformHyperlinks(auth, task));
       if (!resourceUri) {
         resourceUri = task.associatedResource.resourceUri;
       }
       return this.__checkTask__(task, feedback, auth, options);
     });
   }
 }
}
