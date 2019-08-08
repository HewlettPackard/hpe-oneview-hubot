/*
(c) Copyright 2016-2019 Hewlett Packard Enterprise Development LP

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
const nlp_compromise = require('compromise');
const SpellCheck = require('./utils/spell-check');
const Lexer = require('./utils/lexer');

// Matches whenever there are more than 1 space between words
const wordSpacer = /\b\s\s+\b/g;

// Matches sentence punctuation (use a negative look ahead to ignore doubles #.#
const sentenceSpacer = /\s*([?!])\s*|(?!\d*\.\d+)\s*([.])\s*/g;

// Matches the end of a sentence, optionally matching . or ! or ?
const sentenceTerminal = /\s*[.?!]{0,1}$/;

// Custom plugin that normalizes text
const toNormal = {
  Term: {
    toNormal: function() {
      if (this.hasOwnProperty('number') && this.number !== null) {
        let next = '' + this.number;
        if (this.text.endsWith(',')) {
          next += ',';
        } else if (this.text.endsWith('.')) {
          next += '.';
        } else if (this.text.endsWith('!')) {
          next += '!';
        } else if (this.text.endsWith('?')) {
          next += '?';
        }
        this.text = next;
        this.rebuild();
      }
      return SpellCheck(this);
    }
  }, Sentence: {
      toNormal : function() {
        this.terms.forEach((t) => { t.toNormal(); });
        return this;
      }
  }, Text: {
    toNormal : function() {
      this.sentences.forEach((s) => { s.toNormal(); });
      return this;
    }
  }
};

nlp_compromise.plugin(toNormal);

function runNLP(message, logger, lex) {
  if (typeof message.text === 'undefined') {
    return;
  }
  const cleaned = message.text.replace(wordSpacer, ' ').replace(sentenceSpacer, "$1$2  ").trim();

  let cleanSentences = null;
  // If text contains IP address don't run through nlp_compromise
  if (/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/.test(cleaned)) {
    cleanSentences = cleaned;
  } else {
    let normalized = nlp_compromise(cleaned).normalize().out();

    if (normalized.contractions && normalized.contractions.expand) {
      normalized = normalized.contractions.expand();
    }
    // Ensure that all sentences end with '.' a note, this will replace ! and ? with .
    cleanSentences = nlp_compromise(normalized).sentences().data().map((s) => {
      return s.text.trim().replace(sentenceTerminal, '.');
    }).join('  ');
  }

  const start = Date.now();
  const resolved = lex.resolveDevices(cleanSentences).trim();
  logger.debug('Took', (Date.now() - start) +"ms", "to resolve dependencies, normalized string: ", resolved);

  message.original_text = message.text;
  message.text = resolved;
  message.nlp = nlp_compromise(message.text);
};
module.exports.runNLP = runNLP; //export for testing

const nlp = (robot) => {
  const lex = new Lexer(nlp_compromise);
  robot.receiveMiddleware((context, next, done) => {
    const message = context.response.message.message || context.response.message;
    runNLP(message, robot.logger, lex);

    if (typeof message.text === 'undefined' || !message.text.includes('@' + robot.name)) {
      context.response.message.done = true;
    }

    next();
  });
  return lex;
};
module.exports.nlp = nlp;
