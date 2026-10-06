import { Route, Routes } from 'react-router-dom';
import { Home, PawPrint } from 'lucide-react';
import { Logo } from '../components/Logo';
import { LinkButton } from '../components/ui/button';
import { SiteShell } from '../components/layout/site-shell';
import { BottomNav } from '../components/layout/bottom-nav';
import { HomePage } from '../routes/home-page';
import { LoginPage } from '../routes/auth/login-page';
import { RegisterPage } from '../routes/auth/register-page';
import { CallbackPage } from '../routes/auth/callback-page';
import { ForgotPasswordPage } from '../routes/auth/forgot-password-page';
import { ResetPasswordPage } from '../routes/auth/reset-password-page';
import { SearchPage } from '../routes/search-page';
import { MapPage } from '../routes/map-page';
import { PublishPage } from '../routes/publish-page';
import { ProfilePage } from '../routes/profile-page';
import { PublicationPage } from '../routes/publication-page';
import { AdminPage } from '../routes/admin-page';
import { NotificationsPage } from '../routes/notifications-page';
import { AdoptionsPage } from '../routes/adoptions-page';
import { HowItWorksPage } from '../routes/how-it-works-page';
import { DashboardPage } from '../routes/dashboard-page';
function NotFound() {
  return (
    <div className="border-2 border-[#CFEFE6] bg-white rounded-[24px] p-10 max-w-lg mx-auto mt-10 text-center">
      <div className="flex justify-center mb-6">
        <Logo variant="mark" size={56} />
      </div>
      <h1
        className="text-2xl md:text-[28px] text-[#0B3B3C] leading-tight mb-3"
        style={{ fontFamily: '"Baloo 2", cursive', fontWeight: 800 }}
      >
        ¡Ups! Esta patita se perdió
      </h1>
      <p className="text-sm leading-relaxed text-[#0B3B3C]/70 mb-8">
        La página que buscas no existe o se movió. Pero ninguna patita se queda sin casa — te ayudamos a volver.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <LinkButton href="/" variant="primary">
          <Home className="h-4 w-4" aria-hidden="true" />
          Volver al inicio
        </LinkButton>
        <LinkButton href="/buscar" variant="secondary">
          <PawPrint className="h-4 w-4" aria-hidden="true" />
          Buscar mascota
        </LinkButton>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SiteShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/buscar" element={<SearchPage />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/publicar" element={<PublishPage />} />
        <Route path="/adopciones" element={<AdoptionsPage />} />
        <Route path="/p/:slug" element={<PublicationPage />} />
        <Route path="/perfil/:username" element={<ProfilePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/notificaciones" element={<NotificationsPage />} />
        <Route path="/como-funciona" element={<HowItWorksPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </SiteShell>
  );
}