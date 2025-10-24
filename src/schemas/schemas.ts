import { z } from "zod";

const maxSize = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

export const signupSchema = z.object({
  username: z.string().nonempty(),
  birthdate: z
    .string()
    .nonempty()
    .refine((val) => {
      const date = new Date(val);
      const ageDifMs = Date.now() - date.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      return age >= 18;
    }),
  email: z.email().nonempty(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.email().nonempty("Field is required"),
  password: z.string().min(8).max(20),
});

export const serverImageSchema = z.object({
  originalname: z.string().max(255),
  mimetype: z.enum(allowedTypes),
  size: z.number().max(maxSize),
  buffer: z.instanceof(Buffer),
});

export const editUserSchema = z
  .object({
    username: z.string().nonempty("Field is required"),
    bio: z.string(),
    profilePicture: serverImageSchema.optional(),
  })
  .partial();
