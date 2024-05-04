const bankService = require('./bank-service');
const { errorResponder, errorTypes } = require('../../../core/errors');

// create user //
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
    const nominal = request.body.nominal;
    const kartu = request.body.kartu;

    // apakah password dan confirmpassword tidak sama ?
    if (password !== password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        `Password confirmation mismatched.`
      );
    }

    // email harus berbeda dengan yang lain
    const emailIsRegistered = await bankService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        `Email is already registered.`
      );
    }

    // masuk ke bankService
    const success = await bankService.createUser(name, email, password,nominal,kartu);

    // jika gagal maka error
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to create user'
      );
    }

    return response.status(200).json({ name, email,nominal,kartu });
  } catch (error) {
    return next(error);
  }
}


//login
let maxAttempts = 5; // Tentukan batas maksimum percobaan
/**
 * Handle user login request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function login(request, response, next) {
  try {
    const email = request.body.email;
    const password = request.body.password;
    const password_confirm = request.body.password_confirm;

    // apakah password dan confirmpassword tidak sama ?
    if (password !== password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        `Password confirmation mismatched. ${maxAttempts} attempt(s) left.`
      );
    }

    const user = await bankService.getUserByEmail(email);

    // cek apakah user ada ?
    if (!user) {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        `Invalid email or password. ${maxAttempts} attempt(s) left.`
      );
    }

    // cek password sama apa tidak
    const isPasswordCorrect = await bankService.checkPassword(user.id, password);
    // jika tidak maka error
    if (!isPasswordCorrect) {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        `Invalid email or password ${maxAttempts} attempt(s) left.`
      );
    }

    // jika berhasil maka menampilkan id,name,email,nominal,kartu
    return response.status(200).json({ 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      nominal: user.nominal, 
      kartu : user.kartu
    });
  } catch (error) {
    if (maxAttempts > 0) {
      maxAttempts--; // kurang attempt 
    } else {
      maxAttempts += 4; // jika sudah gagal login dan menunggu 1 menit maka dapat balik attemptnya 
    }
    return next(error);
  }
}

//mencek semua acc bank
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
    const pageSize = parseInt(request.query.page_size) ; // besar pagenya 
    const sort = bankService.paramSort(request.query.sort); // Menggunakan paramSearch dari usersService
    const search = bankService.paramSearch(request.query.search); // Menggunakan paramSearch dari usersService

    // masuk ke bankService apakah benar ?
    const success = await bankService.getUsers(page, pageSize, sort, search);

    //jika benar maka hasilnya 
    return response.status(200).json(success);
  } catch (error) {
    return next(error);
  }
}

//transfer
async function transfer(request, response, next) {
  try {
    const pengirimId = request.body.pengirimId;
    const penerimaEmail = request.body.penerimaEmail;
    const nominal = request.body.nominal;

    // masuk ke bankService apakah benar ?
    const success = await bankService.transfer(pengirimId, penerimaEmail, nominal);

    //jika tidak maka error
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Gagal untuk mentransfer'
      );
    }

    //jika benar maka keluar hasilnya
    return response.status(200).json({ message: `Berhasil Trasfer sebesar ${nominal} dan dikenakan biaya admin 5% untuk pengirim` });
  } catch (error) {
    return next(error);
  }
}

//add balance
async function addBalance(request, response, next) {
  try {
    const userId = request.body.userId;
    const email = request.body.email;
    const nominal = request.body.nominal;

    // masuk ke bankService apakah benar ?
    const success = await bankService.addBalance(userId,email, nominal);

    //jika gagal maka error
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Gagal untuk tambah saldo'
      );
    }

    //jika berhasil keluar hasil
    return response.status(200).json({ message: `Berhasil tambah saldo sebesar ${nominal} ` });
  } catch (error) {
    return next(error);
  }
}

//Tarik Tunai
async function tarikTunai(request, response, next) {
  try {
    const userId = request.body.userId;
    const email = request.body.email;
    const kartu = request.body.kartu;
    const nominal = request.body.nominal;
    
    // masuk ke bankService apakah benar ?
    const success = await bankService.tarikTunai(userId,email,kartu, nominal);

    // jika gagal maka error
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Gagal untuk tarik tunai'
      );
    }

    // jika berhasil maka kartu mana yang mereka pakai kalau premium masuk ke premium dan sebaliknya
    if (kartu === "premium") {
      return response.status(200).json({ message: `Tarik Tunai sebesar ${nominal} untuk kartu premium` });
    } else if (kartu === "non-premium") {
      return response.status(200).json({ message: `Tarik Tunai sebesar ${nominal} untuk kartu non-premium dan dikenakan biaya admin 5%` });
    }  } catch (error) {
    return next(error);
  }
}

//delete acc
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

    // masuk ke bankService apakah benar ?
    const success = await bankService.deleteUser(id);

    //jika gagal maka error
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete user'
      );
    }

    // jika berhasil 
    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}


module.exports = {
  createUser,
  login,
  transfer,
  getUsers,
  addBalance,
  deleteUser,
  tarikTunai,
};