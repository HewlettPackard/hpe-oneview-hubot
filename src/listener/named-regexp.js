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
};
module.exports = NamedRegExp;
