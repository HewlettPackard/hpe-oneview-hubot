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

import HipChatTransform from './transforms/hipchat';
import ShellTransform from './transforms/shell';
import SlackTransform from './transforms/slack';

//From: http://stackoverflow.com/questions/591857/how-can-i-get-a-javascript-stack-trace-when-i-throw-an-exception
function st() {
    var err = new Error();
    return err.stack;
}

function stacktrace(error) {
  if (error) {
    let message = error.toString();
    if (error.stack) {
      message += error.stack;
    }
    return message;
  } else {
    return "Unknown error\n" + st();
  }
}

function addPeriod(text) {
  if (text && !text.endsWith('.')) {//TODO" Naieve assumption that the bot will never use ! or ?
    return text + '.';
  }
  return text;
}

function isVowel(x) {
  return /[aeiouAEIOU]/.test(x);
}

export default class ResourceTransforms {
  constructor(robot) {
    if (robot.adapterName === 'slack') {
      this.provider = new SlackTransform();
    } else if (robot.adapterName === 'hipchat') {
      this.provider = new HipChatTransform();
    } else {
      this.provider = new ShellTransform();
    }
    this.robot = robot;
  }

  hyperlink(uri, name) {
    return this.provider.hyperlink(uri, name);
  }

  list(text) {
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      lines[i] = addPeriod(lines[i]);
    }
    return this.provider.list(lines).join('\n');
  }

  error(msg, error) {
    if (error && error.errorName == 'UserException') {
      this.provider.text(msg, error.toMessage());
    } else {
      try {
        let err = JSON.stringify(error, null, '  ');
        if (err === '{}') {
          this.provider.text(msg, stacktrace(error));
        } else {
          this.provider.error(msg, error);
        }
      } catch (err) {
        this.robot.logger.error("Transform error in error handler", err);
      }
    }
  }

  text(msg, text) {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.provider.text(msg, addPeriod(text)));
      } catch (err) {
        this.robot.logger.error("Transform error in text handler", err);
        reject(err);
      }
    });
  }

  send(msg, resource, text) {
    return new Promise((resolve, reject) => {
      try {
        if (typeof resource === 'string') {
          this.text(msg, resource).then(resolve).catch(reject);
        } else {
          resolve(this.provider.send(msg, resource, addPeriod(text)));
        }
      } catch (err) {
        this.robot.logger.error("Transform error in send handler", err);
        reject(err);
      }
    });
  }

  messageRoom(room, resource, text) {
    return new Promise((resolve, reject) => {
      try {
        let r = room;
        if (this.provider.getProviderName() === 'HipChat') {
          r = process.env.HUBOT_HIPCHAT_ROOMS;
        }
        this.robot.logger.debug('Selecting room ' + r + ' to send message to.');
        if (typeof resource === 'string') {
          resolve(this.provider.messageRoom(this.robot, r, null, addPeriod(resource)));
        } else {
          resolve(this.provider.messageRoom(this.robot, r, resource, addPeriod(text)));
        }
      } catch (err) {
        this.robot.logger.error("Transform error in messageRoom handler", err);
        reject(err);
      }
    });
  }

  //http://www.really-learn-english.com/spelling-rules-add-s-verb.html
  makePlural(count, word) {
    var out = word;
    if (count === 1) {
      return "1 " + word;
    }
    if(
      word.endsWith("s") ||		// miss  --> misses
      word.endsWith("ch") ||	// watch --> watches
      word.endsWith("x") ||		// mix   --> mixes
      word.endsWith("z") ||		// buzz  --> buzzes
      word.endsWith("o") ||		// go    --> goes
      word.endsWith("sh") ) {	// wash  --> washes
      out += "es";
    } else {
      var before = 'a';
      if (word.length>=2) {
        before = word.charAt(word.length-2);			//2nd to last char
      }
      if( word.endsWith("y") && !isVowel(before) ) {	// fly --> flies
        out = word.substring(0, word.length-1);
        out += "ies";
      } else {
        // add --> adds (default)
        out += "s";
      }
    }
    if (count === 0) {
      return "no " + out;
    }
    return count + " " + out;
  }

  isAre(count, word) {
    if (count === 1) {
        return "is 1 " + word;
    }
    return "are " + this.makePlural(count, word);
  }
}
