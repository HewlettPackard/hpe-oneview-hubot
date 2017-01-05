/*
(c) Copyright 2016 Hewlett Packard Enterprise Development LP

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

'use strict';
import fs from 'fs';
import path from 'path';

const amqp = require('amqp');
const alerts = 'scmb.alerts.Created.#';
const sp = 'scmb.server-profiles.#';
const spt = 'scmb.server-profile-templates.#';
const sh = 'scmb.server-hardware.Created.#'

class MessageEmitter {
  constructor(robot, queue) {
    this.robot = robot;
    this.queue = queue;
  }

  onMessage(msg, cb) {
    if (msg && msg.resource.type) {
      let event;
      if (msg.resource.type.toLowerCase().includes('alertresource')) {
        event = '__hpe__notification__';
      }
      if (msg.resource.type.toLowerCase().includes('serverprofile') || msg.resource.type.toLowerCase().includes('server-hardware')) {
        event = '__hpe__brain_notification__';
      }
      this.robot.emit(event, msg);
      this.queue.shift();
    }
  }
}

function exists(filepath) {
  return new Promise((resolve, reject) => {
    fs.access(filepath, fs.F_OK, (err) => {
      resolve(!err);
    });
  });
}

function mkdir(p)
{
  p = path.resolve(p);
  return new Promise((resolve, reject) => {
    fs.mkdir(p, function (err) {
      if (!err) {
        resolve(p);
      } else if (err.code == 'ENOENT') {
        mkdir(path.dirname(p)).then(() => {
          return mkdir(p);
        }).then(resolve).catch(reject);
      } else {
        fs.stat(p, (err2, stat) => {
          if (err2 || !stat.isDirectory()) {
            reject(err);
          } else {
            resolve(p);
          }
        });
      }
    });
  });
}

function write(filepath, string) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, string, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve('Wrote: ' + filepath);
      }
    });
  });
}

export default class Notifications {
  constructor (host, restAPI, robot) {
    this.robot = robot;
    this.host = host;
    this.connection = undefined;
    this.queue = undefined;
    this.restAPI = restAPI;
  }

  disconnect () {
    this.robot.logger.info('Disonnecting from SCMB');
    var exchange = this.connection.exchange('scmb', {type: 'topic'});
    this.queue.unbind(exchange, alerts);
    this.queue.unbind(exchange, sp);
    this.queue.unbind(exchange, spt);
    this.queue.unbind(exchange, sh);
    this.robot.logger.info('Unbound from SCMB exchanges');
    this.connection.disconnect();
    this.robot.logger.info('Disconnected from SCMB');
  }

  // pass the robot to emit messages
  __connect__() {
    this.robot.logger.info('Connecting to SCMB');

    const sslFolder = 'oneview-hubot/pem_files/' + this.restAPI.host + '/';

    let ssl_options = {
      enabled : true,
      keyFile : sslFolder + 'key.pem',
      certFile : sslFolder + 'client.pem',
      caFile : sslFolder + 'caroot.pem',
      rejectUnauthorized : true
    }

    let options = {
      host: this.host,
      port: 5671,
      authMechanism: 'EXTERNAL',
      vhost: '/',
      noDelay: true,
      ssl: ssl_options
    }

    Promise.all([
      exists(ssl_options.keyFile),
      exists(ssl_options.certFile),
      exists(ssl_options.caFile)
    ]).then((arr) => {
      return this.__initCerts__({file:ssl_options.keyFile, exists:arr[0]}, {file:ssl_options.certFile, exists:arr[1]}, {file:ssl_options.caFile, exists:arr[2]});
    }).then(() => {
      let connection = amqp.createConnection(options, {reconnect: true});
      this.connection = connection;

      connection.on('error', (e) => {
        this.robot.logger.error("SCMB connection error", e);
      });

      connection.on('ready', ::this.__ready__);
    }).catch((err) => {
      this.robot.logger.error("Issue creating RabbitMQ connection, bot will not be able to push notifications");
      this.robot.logger.error(err);
    });
  }

  __ready__() {
    if (!this.ready) {
      this.ready = true;

      this.connection.queue('', { autoDelete: false, confirm: true }, (queue) => {
        this.queue = queue;

        const exchange = this.connection.exchange('scmb', {type: 'topic'});
        queue.bind(exchange, alerts);
        queue.bind(exchange, sp);
        queue.bind(exchange, spt);
        queue.bind(exchange, sh);
        this.robot.logger.info('Connected to SCMB, waiting for messages');

        const emitter = new MessageEmitter(this.robot, queue);
        queue.subscribe({ack: true}, ::emitter.onMessage);
      });
    }
  }

  __initCerts__(keyFile, certFile, caFile) {
    const createCertificate = () => {
      return new Promise((resolve, reject) => {
        this.restAPI.post("/rest/certificates/client/rabbitmq", {type:"RabbitMqClientCertV2",commonName:"default"}).then(resolve).catch((err) => {
          if (err && err.error && err.error.errorCode == "RABBITMQ_CLIENTCERT_CONFLICT") {
            resolve('Certificate already existed.');
          } else {
            reject(err);
          }
        });
      });
    }

    const writeClientCerts = () => {
      return this.restAPI.get('/rest/certificates/client/rabbitmq/keypair/default').then((cert) => {
        return Promise.all([
          write(keyFile.file, cert.base64SSLKeyData),
          write(certFile.file, cert.base64SSLCertData)
        ]);
      });
    }

    const writeCaCerts = () => {
      return this.restAPI.get('/rest/certificates/ca').then((ca) => {
        return write(caFile.file, ca);
      });
    }

    if (!keyFile.exists || !certFile.exists || !caFile.exists) {
      return createCertificate().then(() => {
        return mkdir(path.dirname(keyFile.file));
      }).then(writeClientCerts).then(writeCaCerts);
    }

    return true;
  }
}
