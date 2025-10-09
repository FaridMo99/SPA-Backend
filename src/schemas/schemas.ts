import { z } from "zod"

export const signupSchema = z.object({
  username: z.string().nonempty(),
  birthdate: z
    .string()
    .nonempty()
    .refine(
      (val) => {
        const date = new Date(val);
        const ageDifMs = Date.now() - date.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        return age >= 18;
      }
    ),
  email: z
    .email()
    .nonempty(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  username: z.string().nonempty("Field is required"),
  password: z.string().min(8).max(20),
});


export const postSchema = z.object({
    
})