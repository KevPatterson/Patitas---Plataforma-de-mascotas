import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { AuthCard } from '../../components/ui/auth-card';
import { Button, LinkButton } from '../../components/ui/button';
import { TextField } from '../../components/ui/text-field';
import { loginSchema, type LoginInput } from '../../lib/validations/auth';
import { signInWithPassword, signInWithGoogle } from '../../lib/supabase/auth';
import { setPageMeta } from '../../lib/seo/page-meta';
import { useEffect } from 'react';

export function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    setPageMeta({
      title: 'Iniciar sesión — Patitas',
      description: 'Accede a tu cuenta de Patitas para gestionar tus publicaciones y ayudar a que más mascotas vuelvan a casa.',
      canonicalPath: '/auth/login',
    });
  }, []);

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
        title="🐾 Bienvenido de vuelta"
        description="Hay muchas patitas esperando una historia feliz."
        footer={
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 text-sm text-navy/70">
            <span>¿No tienes cuenta?</span>
            <LinkButton href="/auth/register" variant="ghost">
              Crear cuenta
            </LinkButton>
          </div>
        }
      >
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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
            autoComplete="current-password" 
            placeholder="••••••••" 
            error={errors.password?.message} 
            {...register('password')} 
          />
          
          {serverError ? (
            <div className="rounded-xl bg-lost/10 border-2 border-lost/20 px-4 py-3 text-sm font-medium text-lost">
              {serverError}
            </div>
          ) : null}
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link className="text-sm font-semibold text-orange hover:text-orange-dark transition-colors" to="/auth/forgot-password">
              Olvidé mi contraseña
            </Link>
            <Button type="submit" variant="primary" disabled={isSubmitting} className="gap-2">
              <PawPrint className="h-4 w-4" />
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
          
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
        </form>
      </AuthCard>
    </section>
  );
}
