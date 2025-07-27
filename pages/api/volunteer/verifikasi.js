import { responseData, responseError, responseMessage } from "@/lib/api/responHandler";
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
      const userSchema = z.object({
        volunteerId: z.number(),
        bsuId: z.number(),
        lokasi: z.string().min(3),
        dokumen: z.string().min(3),
        luasTempat: z.string().min(3),
        kondisiBangunan: z.string().min(3),
        fasilitas: z.array(z.object({}))
      });
      const validate = userSchema.safeParse(req.body);
      if (!validate.success) {
        const error = validate.error.issues;
        return responseError(error, res);
      }
      let body = req.body
      const {dokumen}= req.body
      body.fasilitas = JSON.stringify(body.fasilitas)
      body.fotoKunjungan = dokumen
      delete body.dokumen
      body = nullObjectRemover(body);
      await prisma.hasilverifikasi.upsert({
        where:{
          bsuId:body.bsuId,
          deletedAt:null
        },
        update: body,
        create: body,
      });
      return responseMessage(200, "Verifikasi Berhasil Disimpan.", res);
    } catch (error) {
      return responseMessage(500, error.message, res);
    }
  } else {
    return responseMessage(401, "Not Found", res);
  }
}
