import { z } from "zod";

export const walletSchema = z.object({
  name: z.string().min(2, { message: "Nama wallet minimal 2 karakter" }),
  type: z.enum(["bank", "cash", "e-wallet"], {
    message: "Pilih jenis wallet",
  }),
  balance: z
    .number({ message: "Saldo harus berupa angka" })
    .min(0, { message: "Saldo tidak boleh negatif" }),
});

export type WalletFormValues = z.infer<typeof walletSchema>;
