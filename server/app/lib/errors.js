class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

class SMSError extends Error {
  constructor(message) {
    super(message);
    this.name = "SMSError";
  }
}

module.exports = {
  ValidationError: ValidationError,
  SMSError: SMSError
};
