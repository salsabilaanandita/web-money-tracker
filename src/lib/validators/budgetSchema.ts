import { z } from "zod";

export const budgetSchema = z.object({
  category_id: z.string().min(1, { message: "Pilih kategori" }),
  amount_limit: z
    .number({ message: "Limit harus berupa angka" })
    .positive({ message: "Limit harus lebih dari 0" }),
  month: z
    .number()
    .min(1, { message: "Bulan tidak valid" })
    .max(12, { message: "Bulan tidak valid" }),
  year: z.number().min(2000, { message: "Tahun tidak valid" }),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;
