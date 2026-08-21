import { z } from "zod";

export const savingGoalSchema = z.object({
  name: z.string().min(2, { message: "Nama target minimal 2 karakter" }),
  target_amount: z
    .number({ message: "Target harus berupa angka" })
    .positive({ message: "Target harus lebih dari 0" }),
  target_date: z.string().min(1, { message: "Tanggal target wajib diisi" }),
});

export type SavingGoalFormValues = z.infer<typeof savingGoalSchema>;

export const savingEntrySchema = z.object({
  amount: z
    .number({ message: "Nominal harus berupa angka" })
    .positive({ message: "Nominal harus lebih dari 0" }),
  date: z.string().min(1, { message: "Tanggal wajib diisi" }),
});

export type SavingEntryFormValues = z.infer<typeof savingEntrySchema>;
