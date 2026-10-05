import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '../../components/ui/auth-card';
import { Button } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { newPasswordSchema, type NewPasswordInput } from '../../lib/validations/auth';
import { updatePassword } from '../../lib/supabase/auth';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NewPasswordInput>({ resolver: zodResolver(newPasswordSchema) });

  const onSubmit = async (values: NewPasswordInput) => {
    setServerError(null);
    setSuccessMessage(null);

    try {
      await updatePassword(values.password);
      setSuccessMessage('Contraseña actualizada.');
      navigate('/publicar', { replace: true });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No pudimos actualizar tu contraseña.');
    }
  };

  return (
    <section className="grid min-h-[calc(100vh-8rem)] place-items-center py-10">
      <AuthCard
        eyebrow="Seguridad"
        title="Nueva contraseña"
        description="El enlace de recuperación te trajo aquí. Elige una contraseña nueva para seguir usando Patitas."
        footer={<Link className="text-sm font-semibold text-(--color-primary) hover:underline" to="/auth/login">Volver al inicio de sesión</Link>}
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <TextField label="Nueva contraseña" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" error={errors.password?.message} {...register('password')} />
          <TextField label="Confirmar contraseña" type="password" autoComplete="new-password" placeholder="Repite la contraseña" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          {serverError ? <p className="rounded-2xl bg-[rgba(181,76,69,0.12)] px-4 py-3 text-sm font-medium text-(--color-danger)">{serverError}</p> : null}
          {successMessage ? <p className="rounded-2xl bg-[rgba(46,139,87,0.12)] px-4 py-3 text-sm font-medium text-(--color-success)">{successMessage}</p> : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Actualizar contraseña'}</Button>
        </form>
      </AuthCard>
    </section>
  );
}