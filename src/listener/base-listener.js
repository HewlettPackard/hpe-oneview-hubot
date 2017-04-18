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

const normalizeGroups = /\(:<(\w+)>/g;
const namedGroups = /\(:<(\w+)>|\((?!\?[:!]).*?\)/g;
class NamedRegExp extends RegExp {
  constructor(rgx) {
    super(rgx.source.replace(normalizeGroups, '('), (rgx.global ? 'g' : '') + (rgx.ignoreCase ? 'i' : '') + (rgx.multiline  ? 'm' : ''));

    this.namedGroups = [''];
    let match = namedGroups.exec(rgx.source);
    while (match !== null) {
      this.namedGroups.push(match[1] || '');
      if (!match[1]) {
        this.robot.logger.info('Regex without named groups', rgx.source, 'use ?: to prevent capture or name groups with :<name>');
      }
      match = namedGroups.exec(rgx.source);
    }
  }
}

let registeredMiddleware = false;
export default class Listener {
  constructor(robot, client, transform) {
    this.robot = robot;
    this.client = client;
    this.transform = transform;
    this.indent = '\t\u2022 ';

    if (! registeredMiddleware) {
      registeredMiddleware = true;
      robot.listenerMiddleware((context, next, done) => {
        if (context.listener.options && context.listener.options.namedGroups) {
          context.listener.options.namedGroups(context.response);
        }
        next();
      });
    }
  }

  respond(rgx, options, cb) {
    if (!cb) {
      cb = options;
      options = {};
    }

    rgx = new NamedRegExp(rgx);
    if (rgx.namedGroups) {
      let hasNamedGroups = false;
      for (let i = 0; i < rgx.namedGroups.length; i++) {
        if (rgx.namedGroups[i]) {
          hasNamedGroups = true;
          break;
        }
      }

      if (hasNamedGroups) {
        options.namedGroups = (response) => {
          const match = response.match;
          for (let i = 1; i < match.length; i++) {
            const param = rgx.namedGroups[i];
            if (param) {
              response[param] = match[i];
            }
          }
        };
      }
    }

    this.robot.respond(rgx, options, cb);
  }

  error(msg) {
    return (err) => {
      this.transform.error(msg, err);
    };
  }
}
