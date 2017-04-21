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

import Resource from '../listener/utils/transforms/resource';

let chai = require('chai');

describe('Resource', () => {

  let oneViewResource;

  beforeEach(() => {
    oneViewResource = {
      type: 'ServerProfileTest',
      status: 'Ok',
      state: 'Assigned',
      description: 'This server profile description',
      hyperlink: 'serverProfileHyperLink',
      sanStorage: {},
      pxeBootPolicy: {}
    };

  });

  it('camelCaseToTitleCase uncapitalized results in 2 title case words', () => {
    let serverProfileResource = new Resource(oneViewResource);
    let myKeys = Object.keys(oneViewResource);
    serverProfileResource.camelCaseToTitleCase(myKeys[5]).should.equal('San Storage');
    myKeys[5].should.equal('sanStorage');
  });

  it('camelCaseToTitleCase uncapitalized results in 3 title case words', () => {
    let serverProfileResource = new Resource(oneViewResource);
    let myKeys = Object.keys(oneViewResource);
    serverProfileResource.camelCaseToTitleCase(myKeys[6]).should.equal('Pxe Boot Policy');
    myKeys[6].should.equal('pxeBootPolicy');
  });

  it('camelCaseToTitleCase empty', () => {
    let serverProfileResource = new Resource(oneViewResource);
    let myKeys = Object.keys(oneViewResource);
    serverProfileResource.camelCaseToTitleCase('').should.equal('');
  });

  it('camelCaseToTitleCase undefined', () => {
    let serverProfileResource = new Resource(oneViewResource);
    let myKeys = Object.keys(oneViewResource);
    let result = serverProfileResource.camelCaseToTitleCase(undefined);
    chai.expect(result).to.equal(undefined);
  });

  it('camelCaseToTitleCase null', () => {
    let serverProfileResource = new Resource(oneViewResource);
    let myKeys = Object.keys(oneViewResource);
    let result = serverProfileResource.camelCaseToTitleCase(null);
    chai.expect(result).to.equal(null);
  });
});
