import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthCard } from '../../components/ui/auth-card';
import { Button, LinkButton } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { registerSchema, type RegisterInput } from '../../lib/validations/auth';
import { signUpWithPassword, signInWithGoogle } from '../../lib/supabase/auth';

export function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterInput) => {
    setServerError(null);
    setSuccessMessage(null);
    try {
      await signUpWithPassword(values.email, values.password, {
        fullName: values.fullName,
        username: values.username.toLowerCase(),
      });
      setSuccessMessage('Cuenta creada. Revisa tu correo para verificar tu sesión.');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No pudimos crear tu cuenta.');
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
        eyebrow="Registro"
        title="Crear cuenta"
        description="Usa un perfil público limpio para seguir casos, publicar mascotas y recibir notificaciones relevantes."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-(--color-muted)">
            <span>¿Ya tienes cuenta?</span>
            <LinkButton href="/auth/login" variant="ghost">Entrar</LinkButton>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <TextField label="Nombre" autoComplete="name" placeholder="Tu nombre" error={errors.fullName?.message} {...register('fullName')} />
          <TextField label="Usuario" autoComplete="username" placeholder="tu_usuario" error={errors.username?.message} {...register('username')} />
          <TextField label="Correo" type="email" autoComplete="email" placeholder="tu@correo.com" error={errors.email?.message} {...register('email')} />
          <TextField label="Contraseña" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" error={errors.password?.message} {...register('password')} />
          {serverError ? <p className="rounded-2xl bg-[rgba(181,76,69,0.12)] px-4 py-3 text-sm font-medium text-(--color-danger)">{serverError}</p> : null}
          {successMessage ? <p className="rounded-2xl bg-[rgba(46,139,87,0.12)] px-4 py-3 text-sm font-medium text-(--color-success)">{successMessage}</p> : null}
          <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}</Button>
          <div className="relative py-2 text-center text-xs font-semibold uppercase tracking-widest text-(--color-muted)"><span className="relative bg-white px-3 dark:bg-[#0B3B3C]">o</span></div>
          <Button type="button" variant="secondary" className="w-full justify-center" onClick={handleGoogle}>Continuar con Google</Button>
          <p className="text-center text-xs leading-6 text-(--color-muted)">Al registrarte aceptas que Patitas use tu perfil para publicaciones y seguimiento de casos.</p>
        </form>
      </AuthCard>
    </section>
  );
}
