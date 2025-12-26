import  {z, ZodError } from "zod";
import { USER_ROLES } from "@/config/constants";

// Signup schema
export const signUpSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password must be less than 50 characters")
    .refine(
      (val) => /[A-Z]/.test(val),
      "Password must contain at least one uppercase letter"
    )
    .refine(
      (val) => /[a-z]/.test(val),
      "Password must contain at least one lowercase letter"
    )
    .refine(
      (val) => /[0-9]/.test(val),
      "Password must contain at least one number"
    )
    .refine(
      (val) => /[!@#$%^&*(),.?":{}|<>]/.test(val),
      "Password must contain at least one special character"
    ),
  role: z.enum(Object.values(USER_ROLES)).optional().default("USER"),
});

// Signin schema
export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Type inference
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;


// Validators Fucnctions:
interface IValidateReturn<T>{
    success: boolean;
    data?: T;
    errors?: z.ZodError
}
export const validateSignUpInput = (input:SignUpInput):IValidateReturn<SignUpInput>=>{
    const result = signUpSchema.safeParse(input);
    return {
        success: result.success,
        data: result.success ? result.data : undefined,
        errors: result.success ? undefined : result.error
    } 
}
export const validateSignInInput = (input:SignInInput):IValidateReturn<SignInInput>=>{
    const result = signInSchema.safeParse(input);
    return {
        success: result.success,
        data: result.success ? result.data : undefined,
        errors: result.success ? undefined : result.error
    } 
}
