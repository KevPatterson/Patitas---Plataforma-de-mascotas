import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '../../components/ui/auth-card';
import { Button, LinkButton } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { loginSchema, type LoginInput } from '../../lib/validations/auth';
import { signInWithPassword, signInWithGoogle } from '../../lib/supabase/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      await signInWithPassword(values.email, values.password);
      navigate('/publicar', { replace: true });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No pudimos iniciar sesión.');
    }
  };

  const handleGoogle = async () => {
    setServerError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No pudimos iniciar con Google.');
    }
  };

  return (
    <section className="grid min-h-[calc(100vh-8rem)] place-items-center py-10">
      <AuthCard
        eyebrow="Acceso"
        title="Entrar a Patitas"
        description="Recupera el control de tus publicaciones, tus reportes y tus notificaciones."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-(--color-muted)">
            <span>¿No tienes cuenta?</span>
            <LinkButton href="/auth/register" variant="ghost">Crear cuenta</LinkButton>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <TextField label="Correo" type="email" autoComplete="email" placeholder="tu@correo.com" error={errors.email?.message} {...register('email')} />
          <TextField label="Contraseña" type="password" autoComplete="current-password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          {serverError ? <p className="rounded-2xl bg-[rgba(181,76,69,0.12)] px-4 py-3 text-sm font-medium text-(--color-danger)">{serverError}</p> : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link className="text-sm font-semibold text-(--color-primary) hover:underline" to="/auth/forgot-password">Olvidé mi contraseña</Link>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Entrando...' : 'Entrar'}</Button>
          </div>
          <div className="relative py-2 text-center text-xs font-semibold uppercase tracking-widest text-(--color-muted)">
            <span className="relative bg-white px-3 dark:bg-[#0B3B3C]">o</span>
          </div>
          <Button type="button" variant="secondary" className="w-full justify-center" onClick={handleGoogle}>Continuar con Google</Button>
        </form>
      </AuthCard>
    </section>
  );
}
