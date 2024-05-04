const { User } = require('../../../modelsBank');

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Hashed password
 * @returns {Promise}
 */
async function createUser(name, email, password,nominal,kartu) {
  // akan menghasilkan name,email,password,nominal,kartu
  return User.create({
    name,
    email,
    password,
    nominal,
    kartu,
  });
}

// buat create user
/**
 * Get user by email to prevent duplicate email
 * @param {string} email - Email
 * @returns {Promise}
 */
async function getUserByEmail(email) {
  return User.findOne({ email }); // untuk mencari email 
}

//buat check password
/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function getUser(id) {
  return User.findById(id); // untuk mencari id 
}

//mencek acc bank
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

//delete acc
/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function deleteUser(id) {
  return User.deleteOne({ _id: id }); // mencari id lalu di delete
}

module.exports = {
  createUser,
  getUserByEmail,
  getUser,
  getUsers,
  deleteUser,
};

