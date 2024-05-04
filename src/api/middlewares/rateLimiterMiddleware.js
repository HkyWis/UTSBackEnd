const limit = new Map();

async function rateLimiterMiddleware(request, response, next) {
  const ip = request.ip; // mengambil ip 

  // mencheck apakah ip ada atau tidak di ratelimitMap
  if (limit.has(ip)) {
    const { count, lastR } = limit.get(ip);// Mendapatkan jumlah  waktu dari limit
    const now = Date.now(); // mengambil waktu sekarang

    // membuat 1 menit untuk pinalti
    if (now - lastR <= 1 * 60 * 1000) {
      // adanya 5 percobaan
      if (count >= 5) {
        const waktuReset = Math.ceil((lastR + (1 * 60 * 1000) - now) / 1000); // hitung waktu resetnya 
        // jika gagal maka keluar status error
        return response.status(403).json({ error: `Sudah melebihi limit. Tunggu ${waktuReset} detik lagi sebelum mencoba lagi.` });
      } else { 
        // untuk terkena pinalti
        limit.set(ip, { count: count + 1, lastR: now });
      }
    } else {
      // untuk terkena pinalti
      limit.set(ip, { count: 1, lastR: now });
    }
  } else {
    // Inisialisasi ip dalam limit jika belum ada
    limit.set(ip, { count: 1 , lastR: Date.now() });
  }
  // lanjut ke middleware berikutnya
  next();
}

module.exports = rateLimiterMiddleware;