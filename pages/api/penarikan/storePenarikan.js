import {
  responseData,
  responseError,
  responseMessage,
} from "@/lib/api/responHandler";
import prisma from "@/lib/api/prisma";
import { verifyToken } from "@/lib/api/checkAuthentication";
import { updateSaldoNasabah } from "@/lib/api/updateSaldoNasabah";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const auth = verifyToken(req, res);
  if (auth.status == 401) {
    return responseMessage(auth.status, auth.message, res);
  }

  if (req.method === "GET") {
    try {
      console.log("Fetching penarikan data...");

      // Ambil BSU ID dari query parameter atau dari token
      const { bsuId } = req.query;
      let targetBsuId = bsuId;

      // Jika tidak ada bsuId di query, ambil dari token user
      if (!targetBsuId) {
        // Decode token untuk mendapatkan user info
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (token) {
          try {
            const jwt = require("jsonwebtoken");
            const decoded = jwt.decode(token);
            if (decoded && decoded.id) {
              // Cari BSU berdasarkan user ID
              const bsu = await prisma.bsu.findFirst({
                where: { idBsu: decoded.id },
              });
              if (bsu) {
                targetBsuId = bsu.idBsu;
              }
            }
          } catch (tokenError) {
            console.log("Token decode error:", tokenError);
          }
        }
      }

      let penarikanList;

      if (targetBsuId) {
        console.log("Filtering penarikan for BSU ID:", targetBsuId);

        // Ambil daftar nasabah yang terdaftar pada BSU tertentu
        const nasabahList = await prisma.nasabah.findMany({
          where: { bsuId: parseInt(targetBsuId) },
          select: { idNasabah: true, nama: true, bsuId: true },
        });

        const nasabahIds = nasabahList.map((n) => n.idNasabah);

        if (nasabahIds.length === 0) {
          console.log("No nasabah found for BSU ID:", targetBsuId);
          return responseData(200, [], res);
        }

        // Query penarikan hanya untuk nasabah dari BSU tersebut
        penarikanList = await prisma.penarikan.findMany({
          where: {
            nasabahId: {
              in: nasabahIds,
            },
          },
          orderBy: {
            tanggalPenarikan: "desc",
          },
        });

        // Gabungkan dengan data nasabah yang sudah di-cache
        const penarikanWithNasabah = penarikanList.map((penarikan) => {
          const nasabah = nasabahList.find(
            (n) => n.idNasabah === penarikan.nasabahId
          );
          return {
            ...penarikan,
            nasabah,
          };
        });

        console.log(
          "Found filtered penarikan data:",
          penarikanWithNasabah.length,
          "records for BSU",
          targetBsuId
        );
        return responseData(200, penarikanWithNasabah, res);
      } else {
        console.log("No BSU filter applied, fetching all penarikan data");

        // Query untuk mengambil semua data penarikan (fallback)
        penarikanList = await prisma.penarikan.findMany({
          orderBy: {
            tanggalPenarikan: "desc",
          },
        });

        // Ambil data nasabah secara terpisah
        const penarikanWithNasabah = await Promise.all(
          penarikanList.map(async (penarikan) => {
            const nasabah = await prisma.nasabah.findUnique({
              where: { idNasabah: penarikan.nasabahId },
              select: {
                nama: true,
                bsuId: true,
              },
            });

            return {
              ...penarikan,
              nasabah,
            };
          })
        );

        console.log(
          "Found all penarikan data:",
          penarikanWithNasabah.length,
          "records"
        );
        return responseData(200, penarikanWithNasabah, res);
      }
      if (penarikanWithNasabah.length === 0) {
        console.log("No penarikan data found, returning empty array");
        return responseData(200, [], res);
      }

      return responseData(200, penarikanWithNasabah, res);
    } catch (error) {
      console.error("Error fetching penarikan data:", error);
      return responseMessage(500, `Database error: ${error.message}`, res);
    }
  }

  if (req.method === "POST") {
    try {
      const {
        nasabahId,
        totalPenarikan,
        metodePembayaran,
        tanggalPenarikan,
        statusKonfirmasi,
      } = req.body;

      // Validasi input
      if (
        !nasabahId ||
        !totalPenarikan ||
        !metodePembayaran ||
        !tanggalPenarikan
      ) {
        return responseMessage(400, "Semua field harus diisi", res);
      }

      const nasabah = await prisma.nasabah.findUnique({
        where: {
          idNasabah: parseInt(nasabahId),
        },
        include: {
          transaksi: {
            select: {
              totalHarga: true,
            },
          },
        },
      });

      if (!nasabah) {
        return responseMessage(404, "Nasabah not found", res);
      }

      // Calculate current saldo from transactions and approved withdrawals
      const totalPemasukan = nasabah.transaksi.reduce(
        (total, transaksi) => total + (transaksi.totalHarga || 0),
        0
      );

      const approvedPenarikan = await prisma.penarikan.aggregate({
        where: {
          nasabahId: parseInt(nasabahId),
          statusKonfirmasi: "Berhasil",
        },
        _sum: {
          totalPenarikan: true,
        },
      });

      const totalApprovedPenarikan = approvedPenarikan._sum.totalPenarikan || 0;
      const currentSaldo = totalPemasukan - totalApprovedPenarikan;

      if (currentSaldo < parseFloat(totalPenarikan)) {
        return responseMessage(
          400,
          `Saldo tidak mencukupi untuk penarikan. Saldo tersedia: ${currentSaldo}`,
          res
        );
      }

      // Gunakan transaction untuk memastikan atomicity
      const result = await prisma.$transaction(async (prisma) => {
        // Buat record penarikan dengan status langsung "Berhasil"
        const penarikan = await prisma.penarikan.create({
          data: {
            nasabahId: parseInt(nasabahId),
            tanggalPenarikan: new Date(tanggalPenarikan),
            totalPenarikan: parseFloat(totalPenarikan),
            metodePembayaran: metodePembayaran,
            statusKonfirmasi: "Berhasil", // Langsung set sebagai berhasil
            tanggalKonfirmasi: new Date(), // Set tanggal konfirmasi saat ini
          },
        });

        // Update saldo BSU (kurangi saldo BSU)
        await prisma.bsu.update({
          where: {
            idBsu: parseInt(nasabah.bsuId),
          },
          data: {
            saldo: {
              decrement: parseFloat(totalPenarikan),
            },
          },
        });

        return penarikan;
      });

      // Update saldo nasabah menggunakan fungsi utilitas
      await updateSaldoNasabah(nasabahId);

      return responseData(200, result, res);
    } catch (error) {
      console.error("Error creating penarikan:", error);
      return responseMessage(
        500,
        `Error creating penarikan: ${error.message}`,
        res
      );
    }
  } else {
    return responseMessage(405, "Method not allowed", res);
  }
}
