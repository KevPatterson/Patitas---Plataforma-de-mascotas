import { useEffect } from 'react';
import { Camera, MapPin, Bell, Eye, ShieldCheck, Share2, Flag, CheckCircle } from 'lucide-react';
import { LinkButton } from '../components/ui/button';
import { setPageMeta } from '../lib/seo/page-meta';

const SECTIONS = [
  {
    icon: Camera,
    title: 'Publica en menos de unos minutos',
    text: 'Describe a la mascota paso a paso: especie, color, zona, fotos y cómo contactarte. No necesitas conocimientos técnicos.',
  },
  {
    icon: MapPin,
    title: 'Todo geolocalizado y buscable',
    text: 'Cada caso aparece en el mapa y en el buscador con filtros por tipo de caso, animal, provincia, fecha y más. Nada se pierde como en los estados de WhatsApp.',
  },
  {
    icon: Bell,
    title: 'Coincidencias automáticas',
    text: 'Cuando alguien publica un caso compatible con el tuyo (misma especie, zona y características), Patitas te avisa con una notificación.',
  },
  {
    icon: Eye,
    title: 'Avistamientos con línea temporal',
    text: 'Si alguien vio a tu mascota, puede reportarlo desde tu publicación. Cada avistamiento se suma a una línea temporal que ayuda a seguir su rastro.',
  },
  {
    icon: ShieldCheck,
    title: 'Tu privacidad primero',
    text: 'Nunca mostramos tu dirección exacta: las ubicaciones se difuminan automáticamente. Tu teléfono y correo solo se muestran si tú lo decides, y puedes recibir mensajes mediante Patitas.',
  },
  {
    icon: Share2,
    title: 'Comparte con un enlace',
    text: 'Cada publicación tiene un enlace único listo para compartir por WhatsApp, Facebook o Telegram.',
  },
  {
    icon: Flag,
    title: 'Comunidad cuidada por moderación',
    text: 'Cualquier persona puede reportar publicaciones falsas, spam o estafas. Un equipo de moderación revisa cada reporte.',
  },
  {
    icon: CheckCircle,
    title: 'Los finales felices se celebran',
    text: 'Cuando una mascota vuelve a casa, el caso se marca como resuelto y queda en el historial como una historia de esperanza para la comunidad.',
  },
];

export function HowItWorksPage() {
  useEffect(() => {
    setPageMeta({
      title: 'Cómo funciona — Patitas',
      description:
        'Descubre cómo Patitas centraliza casos de mascotas perdidas, encontradas, abandonadas y en adopción para que ninguna publicación se pierda. Publica, recibe coincidencias y comparte.',
      canonicalPath: '/como-funciona',
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1
        className="font-display font-extrabold text-3xl md:text-4xl text-(--color-text)"
        style={{ fontFamily: '"Baloo 2", cursive' }}
      >
        Cómo funciona Patitas
      </h1>
      <p
        className="mt-3 text-lg font-semibold leading-relaxed text-(--color-muted)"
        style={{ fontFamily: 'Figtree, sans-serif' }}
      >
        Patitas es el lugar donde buscas cuando una mascota desaparece. Centralizamos los casos de mascotas perdidas, encontradas,
        abandonadas y en adopción para que ninguna publicación se pierda.
      </p>

      <div className="soft-panel rounded-4xl p-6 md:p-8 mt-10 space-y-6">
        {SECTIONS.map((s, i) => (
          <div key={s.title} className="flex gap-4">
            <div className="shrink-0 w-12 h-12 rounded-full bg-secondary grid place-items-center text-secondary-foreground">
              <s.icon className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2
                className="font-display font-bold text-xl text-(--color-text)"
                style={{ fontFamily: '"Baloo 2", cursive' }}
              >
                <span className="text-primary mr-1">{i + 1}.</span> {s.title}
              </h2>
              <p className="mt-1 leading-relaxed text-(--color-muted)" style={{ fontFamily: 'Figtree, sans-serif' }}>
                {s.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-3xl bg-primary text-primary-foreground p-8 text-center">
        <h2
          className="font-display font-extrabold text-2xl"
          style={{ fontFamily: '"Baloo 2", cursive' }}
        >
          Ayudemos a que vuelvan a casa.
        </h2>
        <LinkButton href="/publicar" variant="secondary" className="rounded-full font-bold mt-5 bg-card text-foreground hover:bg-card/90">
          Publicar un caso
        </LinkButton>
      </div>
    </div>
  );
}

export default HowItWorksPage;
