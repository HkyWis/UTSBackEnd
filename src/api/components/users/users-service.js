const usersRepository = require('./users-repository');
const { hashPassword, passwordMatched } = require('../../../utils/password');
const { User } = require('../../../models');

//Soal Pertama
/**
 * Get list of users
 * @param {number} page - Nomor halaman
 * @param {number} pageSize - Ukuran halaman 
 * @param {object} sort - Pengurutan data
 * @param {object} search - Kriteria pencarian
 * @returns {Object}
 */
async function getUsers(page, pageSize, sort, search) {
  try {
    let count = await User.countDocuments(search);// ada berapa user yang dibuat pada createUser
    const totalPages = count === 0 ? 1 : (count + pageSize - 1) / pageSize | 0; // ada berapa total halaman
    let users = [];// inisialisasi array untuk disimpan usernya
    //jika ditemukan usernya maka dimasukkan kedalam sini 
    if (count > 0) {
      users = await User.find(search)
        .sort(sort) // akan disorting dari terkecil ke terbesar melalui sort dari parameter getUsers()
        .skip((page - 1) * pageSize) // berapa dokumen yang harus diskip
        .limit(pageSize); // batas pagenya
    }
    //mengembalikan hasil yang sudah ditentukan diatas melalui param atau inisialisasi diatas
    return {
      page_number: page,
      page_size: pageSize,
      count,
      total_pages: totalPages,
      has_previous_page: page > 1,
      has_next_page: page < totalPages,
      data: users,
    };
  } catch (error) {  // jika error maka keluar ini
    throw new error;
  }
}
function paramSort(pasort) {
  const opsort = { desc: { email: 1 }}; // akan diurutkan dari terkecil ke terbesar
  return opsort[pasort] || opsort['desc']; // mengembalikan sortnya 
}
function paramSearch(pasearch) {
  //bisa memilih antar email / name
  const search1 = {
    email: (key) => ({ email: new RegExp(key, 'i') }), // akan memunculkan email sesuai yang dicari
    name: (key) => ({ name: new RegExp(key, 'i') }), // akan memunculkan nama sesuai yang dicari
  };
  const search3 = {}; // jika tidak mencari apa apa akan dikeluarkan semua
  if (!pasearch) return search3; // jika tidak menemukan apa apa kembalikan ke search3
  const [field, key] = pasearch.split(':'); // adanya kata kunci untuk pencarian " : " 
  const search2 = search1[field]; // mencari sesuai kata kunci
  return search2 ? search2(key) : search3; // ini operator tenary bahwa jika true maka pencarian akan ada jika false maka dikeluarkan semua
}
//batas

//login
/**
 * Get user by email
 * @param {string} email - User's email
 * @returns {Promise}
 */
async function getUserByEmail(email) {
  return User.findOne({ email }); // mencari email yang sudah dibuat oleh createUser
}
//batas

/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Object}
 */
async function getUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {boolean}
 */
async function createUser(name, email, password) {
  // Hash password
  const hashedPassword = await hashPassword(password);

  try {
    await usersRepository.createUser(name, email, hashedPassword);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {boolean}
 */
async function updateUser(id, name, email) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.updateUser(id, name, email);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {boolean}
 */
async function deleteUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.deleteUser(id);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Check whether the email is registered
 * @param {string} email - Email
 * @returns {boolean}
 */
async function emailIsRegistered(email) {
  const user = await usersRepository.getUserByEmail(email);

  if (user) {
    return true;
  }

  return false;
}

/**
 * Check whether the password is correct
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function checkPassword(userId, password) {
  const user = await usersRepository.getUser(userId);
  return passwordMatched(password, user.password);
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function changePassword(userId, password) {
  const user = await usersRepository.getUser(userId);

  // Check if user not found
  if (!user) {
    return null;
  }

  const hashedPassword = await hashPassword(password);

  const changeSuccess = await usersRepository.changePassword(
    userId,
    hashedPassword
  );

  if (!changeSuccess) {
    return null;
  }

  return true;
}

module.exports = {
  getUsers,
  paramSort: paramSort,
  paramSearch: paramSearch,
  getUserByEmail,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  emailIsRegistered,
  checkPassword,
  changePassword,
};
