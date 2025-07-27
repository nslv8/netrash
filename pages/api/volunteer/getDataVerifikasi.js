import { responseData, responseMessage } from "@/lib/api/responHandler";
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
        status: z.string(),
      });
      const validate = userSchema.safeParse(req.body);
      if (!validate.success) {
        const error = validate.error.issues;
        return responseError(error, res);
      }
      const body = req.body

      const bsu = await prisma.bsu.findMany({
        where:{
          deletedAt:null,
          status : body.status
        },
        include : {
          hasilverifikasi: {
            where:{
              deletedAt:null
            }
          },
          jadwal:true,
          pengurus:true,
          nasabah:true,
        },
        orderBy:[{
          updatedAt : 'asc'
        }]
      })
      let data = []
      for (const model of bsu) {
        if (model.hasilverifikasi) {
          model.hasilverifikasi.fasilitas = JSON.parse(model.hasilverifikasi.fasilitas)
        }
        data.push(model)
      }
      return responseData(200, data, res);
    } catch (error) {
      return responseMessage(500, error.message, res);
    }
  } else {
    return responseMessage(401, "Not Found", res);
  }
}
