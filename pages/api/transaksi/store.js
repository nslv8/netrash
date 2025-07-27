import prisma from "@/lib/api/prisma";
import { verifyToken } from "@/lib/api/checkAuthentication";
import { responseData, responseMessage } from "@/lib/api/responHandler";
import { updateSaldoNasabah } from "@/lib/api/updateSaldoNasabah";

export default async function handler(req, res) {
  const auth = verifyToken(req, res);
  if (auth.status == 401) {
    return responseMessage(auth.status, auth.message, res);
  }

  if (req.method !== "POST") {
    return responseMessage(405, "Method not allowed", res);
  }

  try {
    const { idNasabah, items, bsuId } = req.body;

    if (!idNasabah || !items || items.length === 0) {
      return responseMessage(400, "Data transaksi tidak lengkap", res);
    }

    // Validasi data items
    for (const item of items) {
      if (!item.idJenisSampah || !item.berat || !item.harga) {
        return responseMessage(
          400,
          "Data item transaksi tidak lengkap (id sampah, berat, atau harga kosong)",
          res
        );
      }
    }

    // Hitung total harga
    const totalHarga = items.reduce(
      (acc, item) => acc + parseFloat(item.harga),
      0
    );

    // Get last transaksi ID
    const lastTransaksi = await prisma.transaksi.findFirst({
      orderBy: {
        idTransaksi: "desc",
      },
    });
    const nextId = (lastTransaksi?.idTransaksi || 0) + 1;

    // Create transaksi
    const transaksi = await prisma.transaksi.create({
      data: {
        idTransaksi: nextId,
        nasabahId: parseInt(idNasabah),
        totalHarga: totalHarga,
        tanggal: new Date(), // Tambahkan field tanggal yang required
      },
    });

    // Create transaksi details
    const transaksiDetails = await Promise.all(
      items.map((item) =>
        prisma.transaksidetail.create({
          data: {
            transaksiId: transaksi.idTransaksi,
            jenisSampahId: parseInt(item.idJenisSampah),
            berat: parseFloat(item.berat),
            hargaTotal: parseFloat(item.harga),
          },
        })
      )
    );

    // Update saldo nasabah menggunakan fungsi utilitas
    await updateSaldoNasabah(idNasabah);

    return responseData(
      200,
      {
        message: "Transaksi berhasil disimpan dan saldo nasabah diperbarui",
        data: { transaksi, details: transaksiDetails },
      },
      res
    );
  } catch (error) {
    console.error("Error creating transaction:", error);
    return responseMessage(
      500,
      `Gagal menyimpan transaksi: ${error.message}`,
      res
    );
  }
}
