import { z } from 'zod';

const password = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.');

export const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido.'),
  password,
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Ingresa tu nombre o apellido.'),
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres.')
    .regex(/^[a-z0-9._-]+$/i, 'Solo usa letras, números, puntos, guiones o guiones bajos.'),
  email: z.string().email('Ingresa un correo válido.'),
  password,
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Ingresa un correo válido.'),
});

export const newPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(8, 'Confirma la nueva contraseña.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;