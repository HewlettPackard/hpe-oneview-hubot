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

import FuzzySet from 'fuzzyset.js';

const space = /\s+/;
const bladeName = /^(\D*)(.*?), bay (\d+)$/;
const maxNgram = 10;
const minNgram = 3;
const fuzzySetThreshold = 0.83;//A fuzzy match that is less than this value is not considered a good enough match to replace
const namedDevices = [];

export default class Lexer {
  constructor(nlp) {
    this.nlp = nlp;
    this.lex = nlp.lexicon();
    this.fuzzyset = FuzzySet([], true, minNgram, maxNgram);//Initialize with levenshtein, min gram size, and max gram size
    this.lookupset = {};
    this.largestDevice = 1;

    //TODO: BUG - This should really be part of a spelling error correction task, we should use an independent fuzzy set that operates on individual words.
    // for (let k in defaults) {
      //TODO: this seems to be stripping words that are needed in the regexs in the individual listeners (ie this @hubot list all server profiles becomes  @hubot list all server)
      // this.lex[k] = defaults[k];
      // this.__addFuzzyLookup__(k, k);
    // }
  }

  addNamedDevice(search, replacement) {
    const tSearch = search.trim();

    this.__addNamedDevice__(tSearch, replacement);

    if (bladeName.test(tSearch)) {//We know blades conform to a specific naming pattern so we can get really accurate fuzzy search results by mapping some explicit typographic errors to the correct value
      this.__addFuzzyLookup__(tSearch.replace(bladeName, '$1$2, bay $3'), tSearch);
      this.__addFuzzyLookup__(tSearch.replace(bladeName, '$1 $2, bay $3'), tSearch);
      this.__addFuzzyLookup__(tSearch.replace(bladeName, '$1$2 bay $3'), tSearch);
      this.__addFuzzyLookup__(tSearch.replace(bladeName, '$1 $2 bay $3'), tSearch);
      this.__addFuzzyLookup__(tSearch.replace(bladeName, '$1$2, bay$3'), tSearch);
      this.__addFuzzyLookup__(tSearch.replace(bladeName, '$1 $2, bay$3'), tSearch);
      this.__addFuzzyLookup__(tSearch.replace(bladeName, '$1$2 bay$3'), tSearch);
      this.__addFuzzyLookup__(tSearch.replace(bladeName, '$1 $2 bay$3'), tSearch);
    } else {//Device did not conform to a standard naming pattern so just add it as is
      this.__addFuzzyLookup__(tSearch, tSearch);
    }

    const words = tSearch.split(space).length + 1;
    if (words > this.largestDevice) {
      this.largestDevice = words;
    }
  }

  updateNamedDevice(robot, search, replacement) {
    const tSearch = search.trim();
    namedDevices.forEach((namedDevice) => {
      if (namedDevice.replacement === replacement) {
        robot.logger.debug('Lexer updating named device: ' + namedDevice.search + ' from: ' + namedDevice.search + ' to: ' + search + ' with uri: ' + namedDevice.replacement);
        namedDevice.search = new RegExp('\\b' + search + '\\b', 'ig');
      }
    });
  }

  __addNamedDevice__(key, replacement) {
    namedDevices.push({search: new RegExp('\\b' + key + '\\b', 'ig'), replacement: replacement});
  }

  __addFuzzyLookup__(key, mapped) {
    let tKey = key.trim();
    this.fuzzyset.add(tKey);
    this.lookupset[tKey] = mapped;
  }

  resolveDevices(text) {
    text = this.nlp.text(text).sentences.map((sentence) => { //Split the message into sentences so our window is applied on each sentence.
      let text = sentence.str.trim();
      if (text.endsWith('.')) {
        text = text.slice(0, -1);
      }
      // return this.__fuzzyResolve__(text); // this is a mess and is breaking regexs in listeners
      return text + '.';
    }).join('  ');

    // sort namedDevices by 'complexity' of the search regular expressions
    namedDevices.sort(function(a, b) {
      return b.search.toString().length - a.search.toString().length;
    });

    namedDevices.forEach((device) => {
      text = text.replace(device.search, device.replacement);
    });

    return text;
  }

  /**
   * This is a really ugly routine, sorry.
   *   - We split a sentence into words using the space regex, we map those into an array of {str:word, processed: false} objects.
   *   - The essence of the algorithim is to move a 'window' over the entire sentence.
   *     - We initialize the window to contain the # of words we have in our 'largestDevice'.
   *     - The contents of that window is passed to the fuzzy set.
   *     - If we recognize a term out of the fuzzy set we mark those words as processed, and track the replacement.
   *     - The window will never contain a word that has already been processed, if we encounter that we rebuild the window.
   *   - After we have traversed the whole sentence at the current window size, decrement the number of words in the window by 1.
   *   - Rinse and Repeat until our window is size 0.
   *
   *  In performance testing, we spend our time in the fuzzy lookup, notes on performance:
   *   - Learning: Negative checks (key does not exist with a remote match) are rejected extreemly quickly.
   *   - Learning: Fuzzyset performs well until its key set gets over 1024 keys.
   *   - Learning: Fuzzyset performs better when its keyspace is diverse.
   *   - We could wrap fuzzyset with our own object, once we get >256 keys create a second set.
   *     - Our facade compares all fuzzy sets and returns the best match from all.
   *     - If 1 is encountered that is an exact match return imediatley.
   *   - We could introduce a second fuzzy set that has the words for our rules instead of putting those into the main sets.
   *     - Negative results return almost imediatley, we want to have common words we understand matched quickly so we can discard them from the process queue.
   */
  __fuzzyResolve__(text) {
    const words = text.split(space).map((s) => { return {str:s, processed:false}; });
    const len = words.length;
    const empty = {};

    const initWindow = (start, size) => {
      let window = [];
      for (let i = 0; i < size; i++) { window.push(empty); }

      let j = 0;
      let i = start;
      for (; i < len && j < size; i++, j++) {
        window[j] = words[i];
        if (words[i].processed) {
          j = 0;
        }
      }

      if (j !== size) {
        return null;
      }

      return { window: window, i: i };
    };

    const process = (buffer) => {
      const set = this.fuzzyset.get(buffer.window.map((s) => { return s.str; }).join(' '));
      if (set && set[0][0] > fuzzySetThreshold) {
        buffer.window[0].value = this.lookupset[set[0][1]];
        buffer.window.forEach((w) => {
          w.processed = true;
        });
      }
    };

    for (let j = this.largestDevice; j > 0; j--) {
      if (j > words.length) {
        continue;
      }

      let buffer = initWindow(0, j);
      if (buffer === null) {
        continue;
      }
      process(buffer);

      for (let i = j; i < words.length; i++) {
        if (words[i].processed) {
          buffer = initWindow(i, j);
          if (buffer === null) {
            break;
          }
          i = buffer.i;
        } else {
          for (let k = 0; k < j; k++) {
            buffer.window[k] = buffer.window[k+1];
          }
          buffer.window[j-1] = words[i];
        }

        process(buffer);
      }
    }

    return words.map((s) => { return (s.processed ? (s.value || '') : s.str); }).filter((s) => { return s; }).join(' ') + '.';
  }
}
