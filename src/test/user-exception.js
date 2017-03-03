import UserException from '../oneview-sdk/user-exception';

let chai = require('chai');

chai.should();

describe('UserException', () => {
  let userException;

  it('toMessage with message and resolution', () => {
    userException = new UserException('This is the error.', 'This is the resolution.');
    userException.toMessage().should.equal('This is the error.\nThis is the resolution.');
  });

  it('toMessage with message', () => {
    userException = new UserException('This is the error.');
    userException.toMessage().should.equal('This is the error.');
  });
});
