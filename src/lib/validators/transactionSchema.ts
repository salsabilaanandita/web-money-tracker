import { z } from "zod";

export const transactionSchema = z.object({
  wallet_id: z.string().min(1, { message: "Pilih wallet" }),
  category_id: z.string().min(1, { message: "Pilih kategori" }),
  amount: z
    .number({ message: "Nominal harus berupa angka" })
    .positive({ message: "Nominal harus lebih dari 0" }),
  type: z.enum(["expense", "income"]),
  description: z.string().min(2, { message: "Deskripsi minimal 2 karakter" }),
  date: z.string().min(1, { message: "Tanggal wajib diisi" }),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
