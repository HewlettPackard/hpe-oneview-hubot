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
const PlainTextTransform = require('./transforms/plain-text');
const ShellTransform = require('./transforms/shell');
const SlackTransform = require('./transforms/slack');

class ResourceTransforms {
  constructor(robot, brain) {
    if (robot.adapterName === 'slack') {
      this.provider = new SlackTransform(brain);
    } else if (robot.adapterName === 'hipchat' || robot.adapterName === 'flowdock') {
      this.provider = new PlainTextTransform(brain, robot.adapterName);
    } else {
      this.provider = new ShellTransform();
    }
    this.robot = robot;
  }

  hyperlink(uri, name) {
    return this.provider.hyperlink(uri, name);
  }

  list(text) {
    let lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      lines[i] = __addPeriod__(lines[i]);
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
          this.provider.text(msg, __stacktrace__(error));
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
        resolve(this.provider.text(msg, __addPeriod__(text)));
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
          resolve(this.provider.send(msg, resource, __addPeriod__(text)));
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
          resolve(this.provider.messageRoom(this.robot, r, null, __addPeriod__(resource)));
        } else {
          resolve(this.provider.messageRoom(this.robot, r, resource, __addPeriod__(text)));
        }
      } catch (err) {
        this.robot.logger.error("Transform error in messageRoom handler", err);
        reject(err);
      }
    });
  }

  //http://www.really-learn-english.com/spelling-rules-add-s-verb.html
  makePlural(count, word) {
    let out = word;
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
      let before = 'a';
      if (word.length>=2) {
        before = word.charAt(word.length-2);			//2nd to last char
      }
      if( word.endsWith("y") && !__isVowel__(before) ) {	// fly --> flies
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

//From: http://stackoverflow.com/questions/591857/how-can-i-get-a-javascript-stack-trace-when-i-throw-an-exception
function __st__() {
    let err = new Error();
    return err.stack;
}

function __stacktrace__(error) {
  if (error) {
    let message = error.toString();
    if (error.stack) {
      message += error.stack;
    }
    return message;
  } else {
    return "Unknown error\n" + __st__();
  }
}

function __addPeriod__(text) {
  if (text && !text.endsWith('.')) {//TODO" Naieve assumption that the bot will never use ! or ?
    return text + '.';
  }
  return text;
}

function __isVowel__(x) {
  return /[aeiouAEIOU]/.test(x);
}

module.exports = ResourceTransforms;
