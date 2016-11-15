export default class UserException {
  constructor(message, resolution) {
    this.message = message;
    this.resolution = resolution;
    this.errorName = 'UserException';
  }

  toMessage() {
    if (this.message && this.resolution) {
      return this.message + "\n" + this.resolution;
    } else {
      return this.message;
    }
  }
}
