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

function noop() {};

export class Emitter {
  constructor() {
    this.next = noop;//Until a caller is registered, the next function is a noop
  }

  register(cb) {
    this.next = cb.bind(this);
  }

  feedback(arg) {
    try {
      this.next(arg);
    } catch(err) {
      this.robot.logger.error("Error in feedback", err)
    }
  }
}

function feedback(pipe, cb) {
  pipe.register(cb);
  return this;
}

export default function PromiseFeedback(exec) {
  const pipe = new Emitter();
  const promise = exec(::pipe.feedback);
  promise.feedback = feedback.bind(promise, pipe);
  return promise;
}

if (!Promise.allSettled) {
  Promise.allSettled = function(arr) {
    return new Promise((resolve, reject) => {
      if (!arr || !Array.isArray(arr) || arr.length <= 0) {
        reject('Expected an array of promises, got none');
      } else {
        const results = Array.apply(null, Array(arr.length));
        let resolved = 0;

        const exec = (index) => {
          return function(res) {
            resolved += 1;
            results[index] = res;
            if (resolved == arr.length) {
              resolve(results);
            }
          }
        }

        for (var i = 0; i < arr.length; i++) {
          arr[i].then(exec(i)).catch(exec(i));
        }
      }
    });
  }
}
