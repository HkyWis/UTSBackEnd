const usersService = require('./users-service');
const { errorResponder, errorTypes } = require('../../../core/errors');

//soal pertama
/**
 * Handle get list of users request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUsers(request, response, next) {
  try {
    const page = parseInt(request.query.page); // ada berapa page
    const pageSize = parseInt(request.query.page_size); // besar pagenya 
    const sort = usersService.paramSort(request.query.sort); // Menggunakan paramSort dari usersService
    const search = usersService.paramSearch(request.query.search);// Menggunakan paramSearch dari usersService

    const success = await usersService.getUsers(page, pageSize, sort, search);
    return response.status(200).json(success);
  } catch (error) {
    return next(error);
  }
}
//batas

// login
let  maxAttempts = 5;
 // max attempt untuk percobaan login
async function login(request, response, next) {
  try {
    const email = request.body.email;
    const password = request.body.password;    
    const password_confirm = request.body.password_confirm;
    // Apakah password != password confirm ?
    if (password !== password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        `Password confirmation tidak sama. Sisa ${maxAttempts} attempt(s) .`
      );
    }

    const user = await usersService.getUserByEmail(email);

    // apakah user telah dibuat ?
    if (!user) {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        `Salah email / password. Sisa ${maxAttempts} attempt(s).`
      );
    }

    const isPasswordCorrect = await usersService.checkPassword(user.id, password, password_confirm);

    // Apakah pwnya sama dengan yang dahulu ?
    if (!isPasswordCorrect) {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        `Salah email / password. Sisa ${maxAttempts} attempt(s).`
      );
    }

    //login berhasil 
    return response.status(200).json({ id: user.id, name: user.name, email: user.email });
  } catch (error) {
    if (maxAttempts > 0) {
      maxAttempts--; // jika salah maka kurang attempt
    } else {
     maxAttempts += 4 ; // jika sudah gagal login dan menunggu 1 menit maka dapat balik attemptnya 
    }
    return next(error);
  }
}
//batas


/**
 * Handle get user detail request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUser(request, response, next) {
  try {
    const user = await usersService.getUser(request.params.id);

    if (!user) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'Unknown user');
    }

    return response.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle create user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middleware
 * @returns {object} Response object or pass an error to the next route
 */
async function createUser(request, response, next) {
  try {
    const name = request.body.name;
    const email = request.body.email;
    const password = request.body.password;
    const password_confirm = request.body.password_confirm;

    // Check confirmation password
    if (password !== password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        `Password confirmation mismatched.`
      );
    }

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        `Email is already registered.`
      );
    }

    const success = await usersService.createUser(name, email, password);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to create user'
      );
    }

    return response.status(200).json({ name, email });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle update user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function updateUser(request, response, next) {
  try {
    const id = request.params.id;
    const name = request.body.name;
    const email = request.body.email;

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    const success = await usersService.updateUser(id, name, email);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to update user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle delete user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function deleteUser(request, response, next) {
  try {
    const id = request.params.id;

    const success = await usersService.deleteUser(id);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle change user password request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function changePassword(request, response, next) {
  try {
    // Check password confirmation
    if (request.body.password_new !== request.body.password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Check old password
    if (
      !(await usersService.checkPassword(
        request.params.id,
        request.body.password_old
      ))
    ) {
      throw errorResponder(errorTypes.INVALID_CREDENTIALS, 'Wrong password');
    }

    const changeSuccess = await usersService.changePassword(
      request.params.id,
      request.body.password_new
    );

    if (!changeSuccess) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to change password'
      );
    }

    return response.status(200).json({ id: request.params.id });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getUser,
  login,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
};
