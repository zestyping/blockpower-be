/*
 *
 * This class is simply a specific error type.
 *
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

module.exports = {
  ValidationError: ValidationError
};
