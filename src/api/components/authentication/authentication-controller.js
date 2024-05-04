const { errorResponder, errorTypes } = require('../../../core/errors');
const authenticationServices = require('./authentication-service');

/**
 * Handle login request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
let attempt = 5; // max attempt login
async function login(request, response, next) {
  const { email, password } = request.body;

  try {
    // Check login credentials
    const loginSuccess = await authenticationServices.checkLoginCredentials(
      email,
      password
    );

    if (!loginSuccess) {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        `Wrong email or password ${attempt} `
      );
    }

    return response.status(200).json( {loginSuccess});
  } catch (error) {
    if (attempts > 0) {
      atempts--; // kurangin attempt login
    } else {
      attempts += 4; // jika sudah gagal login dan menunggu 1 menit maka dapat balik attemptnya
    }
    return next(error);
  }
}

module.exports = {
  login,
};
