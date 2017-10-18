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

import { transform } from './resource-transformer';
const url = require('url');

function Title(resource) {
  if (resource.type) {
    if (resource.type.startsWith('AlertResource')) {
      if (resource.alertTypeID && resource.alertTypeID.startsWith("Trap")) {
        return "Trap: " + resource.description;
      }
      return resource.description + '\n';
    }

    if (resource.type.startsWith('server-hardware')) {
      return 'Server Hardware: ' + resource.name + '\n';
    }

    if (resource.type.startsWith('ServerProfileTemplate')) {
      return 'Profile Template: ' + resource.name + '\n';
    }

    if (resource.type.startsWith('ServerProfile') && !resource.type.startsWith('ServerProfileCompliancePreview')) {
      return 'Profile: ' + resource.name + '\n';
    }
  }
}

function ToOutput(resource) {
  const transformedRes = transform(resource);
  let host;
  if (resource.hyperlink) {
    host = url.parse(resource.hyperlink).hostname;
  }

  const title = Title(transformedRes);

  let output = '';
  if (title) {
    output = title;
  }
  if(transformedRes.pretext) {
    output += transformedRes.pretext + '\n';
  }
  output += transformedRes.buildPlainTextOutput(host);
  return output;
}

function output(resource) {
  if (Array.isArray(resource)) {
    return resource.map(ToOutput);
  } else if (resource.members) {
    return resource.members.map(ToOutput);
  } else {
    return [ToOutput(resource)];
  }
  return [];
}

/**
 * PlainTextTransform it's a commom transformer to HipChat and Flowdock.
 */
export default class PlainTextTransform {
  hyperlink(uri, name) {
    return name ? name : uri;
  }

  list(lines) {
    for (var i = 0; i < lines.length; i++) {
      lines[i] = '  - ' + lines[i];
    }
    return lines;
  }

  text(msg, text) {
    msg.send(text);
  }

  send(msg, resource, text) {
    if (!resource) {
      throw "Resource was null";
    }

    const out = output(resource).join('\n');
    if (text) {
      msg.send(out);
    }

    msg.send(out);
  }

  messageRoom(robot, room, resource, text) {
    if (text) {
      robot.messageRoom(room, text);
    }

    if (resource) {
      const out = output(resource).join('\n');
      robot.messageRoom(room, out);
    }
  }

  error(msg, err) {
    let userError = "Oops there was a problem.\n\n";
    if (err.error.errorCode) {
      userError = userError.concat("OneView error code: ").concat(err.error.errorCode).concat("\n");
    }
    if (err.error.details) {
      userError = userError.concat(err.error.details).concat("\n");
    }
    if (err.error.message) {
      userError = userError.concat(err.error.message).concat("\n");
    }
    if (err.error.recommendedActions && Object.prototype.toString.call(err.error.recommendedActions) === '[object Array]') {
      err.error.recommendedActions.forEach(function(recommendedAction) {
        userError = userError.concat(recommendedAction).concat("\n");
      });
    }
    msg.send(userError);
  }

  getProviderName() {
    if (robot.adapterName === 'flowdock') {
      return 'Flowdock';
    } else {
      return 'HipChat';      
    }
  }
}
