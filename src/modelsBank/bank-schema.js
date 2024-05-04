const bankSchema = {
  name: String,
  email: String,
  password: String,
  nominal : Number, // menambahkan nominal untuk database
  kartu : String, // menambahkan kartu untuk database
};

module.exports = bankSchema;
