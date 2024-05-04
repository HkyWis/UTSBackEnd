const bankRepository = require('./bank-repository');
const { hashPassword, passwordMatched } = require('../../../utils/password');
const { User } = require('../../../modelsBank');

// create user
/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {boolean}
 */
async function createUser(name, email, password,nominal,kartu) {
  // Hash Password / menyembunyikan password
  const hashedPassword = await hashPassword(password);

  try {
    // apabila kartu !== premium / non-premium maka error
    if (kartu !== "premium" && kartu !== "non-premium") {
      throw new Error("Kartunya harus bertipe premium atau non-premium");
    }

    // apabila kartu === premium tetapi dibawah 50000 maka error
    if (kartu === "premium" && nominal <= 50000) {
      throw new Error("Untuk tipe kartu premium, nominal harus lebih dari 50 ribu");
    }

    // apabila kartu === non-premium tetapi diatas 50000 maka error
    if (kartu === "non-premium" && nominal > 50000) {
      throw new Error("Untuk tipe kartu non-premium, nominal harus kurang dari atau sama dengan 50 ribu");
    }

    //masuk ke bankRepository 
    await bankRepository.createUser(name, email, hashedPassword,nominal,kartu);

    //jika sukses maka berhasil
    return true; 
  } catch (error) {
    throw error; // jika gagal 
  }
}
/**
 * Check whether the email is registered
 * @param {string} email - Email
 * @returns {boolean}
 */
async function emailIsRegistered(email) {
  const user = await bankRepository.getUserByEmail(email); // menggunakan fungsi pada bankRepository yaitu mencari email

  if (user) {
    return true; // jika benar berhasil
  }

  return false; // jika gagal
}

//login
/**
 * Get user by email
 * @param {string} email - User's email
 * @returns {Promise}
 */
async function getUserByEmail(email) {
  return User.findOne({ email }); // mencari email 
}

//untuk login controller
/**
 * Check whether the password is correct
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function checkPassword(userId, password) {
  const user = await bankRepository.getUser(userId); // memanggil fungsi pada bankRepository yaitu mencari id
  return passwordMatched(password, user.password); // jika passwordnya benar dengan yang dahulu maka berhasil
}

//mencek acc
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

//transfer
async function transfer(pengirimId, penerimaEmail, nominal) {
  const pengirim = await bankRepository.getUser(pengirimId); // memanggil fungsi pada bankRepository yaitu mencari id 
  const penerima = await bankRepository.getUserByEmail(penerimaEmail); // menggunakan fungsi pada bankRepository yaitu mencari email

  // mencek apakah ada user id dari pengirim // user email dari penerima ?
  if (!pengirim || !penerima) {
    throw new Error("Tidak menemukan penerim / pengirim"); //jika tidak error
  }

  // mengecek jika saldo pada pengirim tidak mencukupi yang ia ingin transfer maka error
  if (pengirim.nominal < nominal) {
    throw new Error(`Balance anda tidak cukup ${pengirim.nominal}`);
  }

  // mengurangi saldo dari pengirim
  pengirim.nominal -= (nominal + (nominal * 0.05));
  // menambahkan saldo dari penerima
  penerima.nominal += nominal;

  try {
    // akan disimpan pembaharuannya
    await pengirim.save();
    await penerima.save();
    return true; // Transfer berhasil
  } catch (error) {
    return false; // Transfer gagal
  }
}

// add balance
/**
 * Add balance to user's account
 * @param {string} userId - User ID
 * @param {string} email - User's email
 * @param {number} nominal - Amount to be added
 * @returns {boolean} - Returns true if balance addition is successful
 */
async function addBalance(userId, email, nominal) {
  try {
    const user = await bankRepository.getUser(userId); // memanggil fungsi pada bankRepository yaitu mencari id

    if (!user) {
      throw new Error("User not found"); // jika tidak ada user maka error
    }

    // Cek apakah email sesuai dengan email dahulunya
    if (user.email !== email) {
      throw new Error("Invalid email"); 
    }

    // Tambahkan saldo ke user
    user.nominal += nominal;

    // Simpan perubahan
    await user.save();

    return true; // Penambahan saldo berhasil
  } catch (error) {
    throw error; // Gagal tambah saldo
  }
}

//Tarik Tunai
async function tarikTunai(userId, email, kartu, nominal) {
  try {
    const user = await bankRepository.getUser(userId); // memanggil fungsi pada bankRepository yaitu mencari id

    if (!user) {
      throw new Error("User not found"); // jika tidak ada user maka error
    }

     // Cek apakah email sesuai dengan email dahulunya
    if (user.email !== email) {
      throw new Error("Salah email / Id"); 
    }

    // Cek apakah kartu sesuai dengan kartu yang ia tulis
    if (user.kartu !== kartu) {
      throw new Error("Kartunya harus bertipe premium atau non-premium");
    }

    // jika kartu non-premium maka kena biaya admin 5% jika premium sebaliknya
    if (kartu === "non-premium") {
      user.nominal -= (nominal + (nominal * 0.05));
    } else {
      user.nominal -= nominal;
    }

    // jika user nominalnya dibawah dari nominal yang ia tarik maka error
    if (user.nominal < nominal) {
      throw new Error("Nominal g cukup tidak boleh dibawah 10000");
    }

    // Simpan perubahan
    await user.save();

    return true; // jika berhasil
  } catch (error) {
    throw error; // jika gagal
  }
}

//delete acc
/**
 * Delete user
 * @param {string} id - User ID
 * @returns {boolean}
 */
async function deleteUser(id) {
  const user = await bankRepository.getUser(id); // memanggil fungsi pada bankRepository yaitu mencari id

  //jika tidak menemukan user
  if (!user) {
    return null;
  }

  try {
    await bankRepository.deleteUser(id); // memanggil fungsi pada bankRepository yaitu deleteUser
  } catch (err) {
    return null; // jika gagal
  }
  return true; // jika berhasil
}

module.exports = {
  createUser,
  emailIsRegistered,
  getUserByEmail,
  checkPassword,
  transfer,
  getUsers,
  paramSort: paramSort,
  paramSearch: paramSearch,
  addBalance,
  tarikTunai,
  deleteUser,
};
