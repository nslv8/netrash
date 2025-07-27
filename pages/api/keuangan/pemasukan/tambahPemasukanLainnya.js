import { responseData, responseError, responseMessage } from "@/lib/api/responHandler";
import { nullObjectRemover } from "@/lib/api/nullObjectRemover";
import prisma from "@/lib/api/prisma";
import { verifyToken } from "@/lib/api/checkAuthentication";
import { z } from "zod";

export default async function handler(req, res) {
  if (req.method === "POST"){
    try{
      const auth = verifyToken(req, res);
      if (auth.status == 401){
        return responseMessage(auth.status, auth.message, res);
      }

      const userSchema = z.object({
        bsuId: z.number(),
        tanggal: z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        }), 
        tujuan: z.string().min(3),
        saldo: z.string().refine((val) => !isNaN(parseFloat(val)), {
          message: "Saldo must be a valid number",
        }),
        keterangan: z.string().min(3),
      });

      const validate = userSchema.safeParse(req.body);
      if (!validate.success){
        const error = validate.error.issues;
        return responseError(error, res);
      }

      let body = req.body;
      const { saldo } = req.body;
      body.saldo = parseFloat(saldo);
      body = nullObjectRemover(body);
      
      if (!body.tanggal) {
        return responseError([{ message: "tanggal Pemasukan is required" }], res);
      }

      const previousTotal = await prisma.pemasukan.aggregate({
        _sum: {
          saldo: true,
        },
      });

      const currentSaldo = body.saldo;
      const newTotalPemasukan = (previousTotal._sum.saldo || 0) + currentSaldo;

      const pemasukan = await prisma.pemasukan.create({
        data: {
          ...body,
          totalPemasukan: newTotalPemasukan,
        },
      });
      return responseMessage(200, "Pemasukan Berhasil Disimpan.", res, pemasukan);
    } catch (error){
      return responseMessage(500, error.message, res);
    }
  } else {
    return responseMessage(405, "Method Not Allowed", res);
  }
}
