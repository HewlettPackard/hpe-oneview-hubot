import { isTerminal } from '../oneview-sdk/tasks';

let chai = require('chai');

chai.should();

describe('Tasks', () => {
  let userException;

  it('isTerminal terminal task', () => {
    let task = {type: 'TaskResource', taskState: 'Completed'};
    isTerminal(task).should.equal(true);
  });

  it('isTerminal non-terminal task', () => {
    let task = {type: 'TaskResource', taskState: 'Running'};
    isTerminal(task).should.equal(false);
  });
});
