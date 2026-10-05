import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { AuthCard } from '../../components/ui/auth-card';
import { Button, LinkButton } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { resetPasswordSchema, type ResetPasswordInput } from '../../lib/validations/auth';
import { resetPassword } from '../../lib/supabase/auth';

export function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: ResetPasswordInput) => {
    setServerError(null);
    setSuccessMessage(null);

    try {
      await resetPassword(values.email);
      setSuccessMessage('Te enviamos un enlace para restablecer tu contraseña.');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No pudimos enviar el correo.');
    }
  };

  return (
    <section className="grid min-h-[calc(100vh-8rem)] place-items-center py-10">
      <AuthCard
        eyebrow="Recuperación"
        title="Restablecer contraseña"
        description="Te enviaremos un enlace seguro para volver a entrar sin perder tus publicaciones."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-(--color-muted)">
            <Link className="font-semibold text-(--color-primary) hover:underline" to="/auth/login">Volver al acceso</Link>
            <LinkButton href="/auth/register" variant="ghost">Crear cuenta</LinkButton>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <TextField label="Correo" type="email" autoComplete="email" placeholder="tu@correo.com" error={errors.email?.message} {...register('email')} />
          {serverError ? <p className="rounded-2xl bg-[rgba(181,76,69,0.12)] px-4 py-3 text-sm font-medium text-(--color-danger)">{serverError}</p> : null}
          {successMessage ? <p className="rounded-2xl bg-[rgba(46,139,87,0.12)] px-4 py-3 text-sm font-medium text-(--color-success)">{successMessage}</p> : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar enlace'}</Button>
        </form>
      </AuthCard>
    </section>
  );
}