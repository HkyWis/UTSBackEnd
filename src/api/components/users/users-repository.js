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



/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function getUser(id) {
  return User.findById(id);
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Hashed password
 * @returns {Promise}
 */
async function createUser(name, email, password) {
  return User.create({
    name,
    email,
    password,
  });
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {Promise}
 */
async function updateUser(id, name, email) {
  return User.updateOne(
    {
      _id: id,
    },
    {
      $set: {
        name,
        email,
      },
    }
  );
}

/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function deleteUser(id) {
  return User.deleteOne({ _id: id });
}

/**
 * Get user by email to prevent duplicate email
 * @param {string} email - Email
 * @returns {Promise}
 */
async function getUserByEmail(email) {
  return User.findOne({ email });
}

/**
 * Update user password
 * @param {string} id - User ID
 * @param {string} password - New hashed password
 * @returns {Promise}
 */
async function changePassword(id, password) {
  return User.updateOne({ _id: id }, { $set: { password } });
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserByEmail,
  changePassword,
};
