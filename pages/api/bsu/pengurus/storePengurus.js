import { nullObjectRemover } from "@/lib/api/nullObjectRemover";
import prisma from "@/lib/api/prisma";
import { verifyToken } from "@/lib/api/checkAuthentication";
import { z } from "zod";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const auth = verifyToken(req, res);
      if (auth.status == 401) {
        return responseMessage(auth.status, auth.message, res);
      }

      const pengeluaranSchema = z.object({
        tanggalPengeluaran: z.string().min(1),
        tujuan: z.string().min(3),
        saldo: z.string().min(1),
        bukti: z.string().min(3)
      });

      const validate = pengeluaranSchema.safeParse(req.body);
      if (!validate.success) {
        const error = validate.error.issues;
        return responseError(error, res);
      }

      let body = req.body;
      body = nullObjectRemover(body);

      await prisma.pengeluaran.create({
        data: body,
      });

      return responseMessage(200, "Pengeluaran berhasil ditambahkan.", res);
    } catch (error) {
      return responseMessage(500, error.message, res);
    }
  } else {
    return responseMessage(401, "Not Found", res);
  }
}