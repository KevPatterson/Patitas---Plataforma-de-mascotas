import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PawPrint } from 'lucide-react';
import { AuthCard } from '../../components/ui/auth-card';
import { Button, LinkButton } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { registerSchema, type RegisterInput } from '../../lib/validations/auth';
import { signUpWithPassword, signInWithGoogle } from '../../lib/supabase/auth';
import { setPageMeta } from '../../lib/seo/page-meta';

export function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    setPageMeta({
      title: 'Crear cuenta — Patitas',
      description: 'Únete a la comunidad de Patitas y ayuda a que más mascotas encuentren el camino a casa.',
      canonicalPath: '/auth/register',
    });
  }, []);

  const onSubmit = async (values: RegisterInput) => {
    setServerError(null);
    setSuccessMessage(null);
    try {
      await signUpWithPassword(values.email, values.password, {
        fullName: values.fullName,
        username: values.username.toLowerCase(),
      });
      setSuccessMessage('🎉 Cuenta creada. Revisa tu correo para verificar tu sesión.');
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
        title="🐾 Únete a Patitas"
        description="Sé parte de la comunidad que ayuda a que las mascotas vuelvan a casa."
        footer={
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 text-sm text-navy/70">
            <span>¿Ya tienes cuenta?</span>
            <LinkButton href="/auth/login" variant="ghost">
              Entrar
            </LinkButton>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <TextField 
            label="Nombre" 
            autoComplete="name" 
            placeholder="Tu nombre" 
            error={errors.fullName?.message} 
            {...register('fullName')} 
          />
          <TextField 
            label="Usuario" 
            autoComplete="username" 
            placeholder="tu_usuario" 
            error={errors.username?.message} 
            {...register('username')} 
          />
          <TextField 
            label="Correo" 
            type="email" 
            autoComplete="email" 
            placeholder="tu@correo.com" 
            error={errors.email?.message} 
            {...register('email')} 
          />
          <TextField 
            label="Contraseña" 
            type="password" 
            autoComplete="new-password" 
            placeholder="Mínimo 8 caracteres" 
            error={errors.password?.message} 
            {...register('password')} 
          />
          
          {serverError ? (
            <div className="rounded-xl bg-lost/10 border-2 border-lost/20 px-4 py-3 text-sm font-medium text-lost">
              {serverError}
            </div>
          ) : null}
          
          {successMessage ? (
            <div className="rounded-xl bg-found/10 border-2 border-found/20 px-4 py-3 text-sm font-medium text-found">
              {successMessage}
            </div>
          ) : null}
          
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isSubmitting} 
            className="w-full gap-2"
          >
            <PawPrint className="size-4" />
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
          
          <div className="relative py-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-navy/10"></div>
            </div>
            <span className="relative bg-white px-4 text-xs font-bold uppercase tracking-wider text-navy/40">
              o
            </span>
          </div>
          
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full justify-center border-2" 
            onClick={handleGoogle}
          >
            Continuar con Google
          </Button>
          
          <p className="text-center text-xs leading-relaxed text-navy/60 pt-2">
            Al registrarte aceptas que Patitas use tu perfil para publicaciones y seguimiento de casos.
          </p>
        </form>
      </AuthCard>
    </section>
  );
}
