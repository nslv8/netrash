import prisma from "@/lib/api/prisma";
import { verifyToken } from "@/lib/api/checkAuthentication";
import {
  responseData,
  responseError,
  responseMessage,
} from "@/lib/api/responHandler";
import { updateSaldoNasabah } from "@/lib/api/updateSaldoNasabah";

export default async function handler(req, res) {
  // const auth = verifyToken(req, res)
  // if (auth.status == 401) {
  //   return responseMessage(auth.status, auth.message, res)
  // }
  const { id } = req.query;
  if (req.method === "POST") {
    const { statusKonfirmasi } = req.body;
    try {
      const update = await prisma.penarikan.update({
        where: {
          idPenarikan: parseInt(id),
        },
        data: {
          statusKonfirmasi,
          tanggalKonfirmasi: new Date(),
        },
      });
      if (statusKonfirmasi === "Berhasil") {
        const penarikan = await prisma.penarikan.findUnique({
          where: {
            idPenarikan: parseInt(id),
          },
          select: {
            nasabahId: true,
            totalPenarikan: true,
          },
        });

        const nasabah = await prisma.nasabah.findUnique({
          where: {
            idNasabah: parseInt(penarikan.nasabahId),
          },
          select: {
            bsuId: true,
          },
        });

        // Update saldo BSU
        await prisma.bsu.update({
          where: {
            idBsu: parseInt(nasabah.bsuId),
          },
          data: {
            saldo: {
              decrement: parseInt(penarikan.totalPenarikan),
            },
          },
        });

        // Update saldo nasabah menggunakan fungsi utilitas
        await updateSaldoNasabah(penarikan.nasabahId);
      }
      return responseData(200, update, res);
    } catch (error) {
      console.error("Error fetching data:", error);
      responseError(500, error.message, res);
    }
  } else {
    return responseMessage(405, "Method not allowed", res);
  }
}
