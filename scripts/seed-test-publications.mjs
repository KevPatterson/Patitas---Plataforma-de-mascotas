#!/usr/bin/env node
/**
 * Script para insertar publicaciones de prueba en Supabase
 * Uso: node scripts/seed-test-publications.mjs
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Ubicaciones en La Habana con coordenadas reales
const locations = [
  {
    name: 'Malecón',
    province: 'La Habana',
    municipality: 'Centro Habana',
    zone: 'Malecón y Prado',
    lat: 23.1418,
    lng: -82.3643
  },
  {
    name: 'Vedado',
    province: 'La Habana',
    municipality: 'Plaza de la Revolución',
    zone: 'Calle 23 y 12',
    lat: 23.1377,
    lng: -82.3872
  },
  {
    name: 'Plaza Vieja',
    province: 'La Habana',
    municipality: 'Habana Vieja',
    zone: 'Plaza Vieja',
    lat: 23.1355,
    lng: -82.3508
  },
  {
    name: 'Miramar',
    province: 'La Habana',
    municipality: 'Playa',
    zone: '5ta Avenida',
    lat: 23.1146,
    lng: -82.4338
  },
  {
    name: 'Parque Central',
    province: 'La Habana',
    municipality: 'Habana Vieja',
    zone: 'Parque Central',
    lat: 23.1366,
    lng: -82.3587
  },
  {
    name: 'Línea y Paseo',
    province: 'La Habana',
    municipality: 'Plaza de la Revolución',
    zone: 'Línea y Paseo',
    lat: 23.1329,
    lng: -82.3911
  }
];

// Publicaciones de prueba
const testPublications = [
  {
    type: 'LOST',
    title: 'Perrita blanca perdida en el Malecón',
    description: 'Mi perrita Luna se perdió el sábado por la tarde cerca del Malecón. Es muy cariñosa y responde a su nombre. Tiene collar rojo. Por favor ayúdenme a encontrarla.',
    species: 'dog',
    breed: 'Mestizo',
    sex: 'female',
    size: 'medium',
    color: 'Blanco',
    age_approx: 'young',
    has_collar: true,
    locationIdx: 0
  },
  {
    type: 'FOUND',
    title: 'Gato negro encontrado en Vedado',
    description: 'Encontré un gato negro muy amigable en la Calle 23. Tiene un collar azul pero no tiene placa. Está bien cuidado, parece que tiene dueño. Lo estoy cuidando temporalmente.',
    species: 'cat',
    sex: 'male',
    size: 'small',
    color: 'Negro',
    age_approx: 'adult',
    has_collar: true,
    locationIdx: 1
  },
  {
    type: 'ADOPTION',
    title: 'Cachorro busca hogar amoroso',
    description: 'Hermoso cachorro de 3 meses busca familia responsable. Es muy juguetón y cariñoso. Ya tiene sus primeras vacunas. Se entrega desparasitado.',
    species: 'dog',
    breed: 'Mestizo',
    sex: 'male',
    size: 'small',
    color: 'Marrón y blanco',
    age_approx: 'puppy',
    has_collar: false,
    locationIdx: 2
  },
  {
    type: 'LOST',
    title: 'Perro labrador perdido en Miramar',
    description: 'Max, mi labrador dorado, se escapó del patio el lunes en la mañana. Es muy grande y amigable. Tiene microchip. RECOMPENSA por información que ayude a encontrarlo.',
    species: 'dog',
    breed: 'Labrador',
    sex: 'male',
    size: 'large',
    color: 'Dorado',
    age_approx: 'adult',
    has_collar: true,
    reward: '1000 CUP',
    locationIdx: 3
  },
  {
    type: 'SIGHTING',
    title: 'Perro callejero necesita ayuda',
    description: 'Vi un perro callejero cerca del Parque Central que se ve enfermo y desnutrido. Parece tener una pata lastimada. Alguien que pueda ayudarlo?',
    species: 'dog',
    sex: 'unknown',
    size: 'medium',
    color: 'Gris',
    age_approx: 'senior',
    has_collar: false,
    locationIdx: 4
  },
  {
    type: 'ADOPTION',
    title: 'Gata tricolor en adopción',
    description: 'Gatita de 1 año muy cariñosa busca hogar. Es super limpia, usa su arenero perfectamente. Esterilizada y vacunada. Ideal para apartamento.',
    species: 'cat',
    sex: 'female',
    size: 'small',
    color: 'Tricolor (naranja, negro y blanco)',
    age_approx: 'young',
    has_collar: false,
    locationIdx: 5
  }
];

async function getOrCreateTestUser(username) {
  // Buscar si existe un perfil con este username
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existingProfile) {
    console.log(`✅ Usuario existente encontrado: ${username}`);
    return existingProfile.id;
  }

  console.log(`⚠️  Usuario ${username} no existe. Usa un usuario real de tu base de datos.`);
  return null;
}

async function getFirstUser() {
  // Obtener el primer usuario disponible
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username')
    .limit(1)
    .single();

  if (error || !profiles) {
    console.error('❌ No hay usuarios en la base de datos. Crea un usuario primero.');
    return null;
  }

  console.log(`✅ Usando usuario existente: ${profiles.username}`);
  return profiles.id;
}

async function seedPublications() {
  console.log('🌱 Iniciando seed de publicaciones de prueba...\n');

  // Obtener un usuario existente para las publicaciones
  const userId = await getFirstUser();

  if (!userId) {
    console.error('❌ No se pudo obtener un usuario. Asegúrate de tener al menos un usuario registrado en la aplicación.');
    console.log('\n💡 Crea un usuario primero:');
    console.log('   1. Abre http://localhost:5173');
    console.log('   2. Regístrate con tu email');
    console.log('   3. Ejecuta este script de nuevo\n');
    return;
  }

  console.log(`\n📝 Creando ${testPublications.length} publicaciones...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < testPublications.length; i++) {
    const pub = testPublications[i];
    const location = locations[pub.locationIdx];

    try {
      // Aplicar difuminación de ±50m (±0.0005°)
      const fuzzLat = location.lat + (Math.random() - 0.5) * 0.001;
      const fuzzLng = location.lng + (Math.random() - 0.5) * 0.001;

      // 1. Crear location
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .insert({
          province: location.province,
          municipality: location.municipality,
          zone: location.zone,
          approximate_lat: fuzzLat,
          approximate_lng: fuzzLng
        })
        .select('id')
        .single();

      if (locationError) throw locationError;

      // 2. Crear pet
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .insert({
          owner_profile_id: userId,
          species: pub.species,
          breed: pub.breed || null,
          sex: pub.sex || null,
          size: pub.size || null,
          age_approx: pub.age_approx || null,
          color: pub.color,
          has_collar: pub.has_collar || false,
          has_plate: false
        })
        .select('id')
        .single();

      if (petError) throw petError;

      // 3. Crear slug único
      const slug = `${pub.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${i}`;

      // 4. Crear publication
      const { data: publicationData, error: publicationError } = await supabase
        .from('publications')
        .insert({
          owner_profile_id: userId,
          slug: slug,
          location_id: locationData.id,
          pet_id: petData.id,
          type: pub.type,
          title: pub.title,
          description: pub.description,
          species: pub.species,
          breed: pub.breed || null,
          sex: pub.sex || null,
          size: pub.size || null,
          age_approx: pub.age_approx || null,
          color: pub.color,
          collar: pub.has_collar || false,
          plate: false,
          reward: pub.reward || null,
          contact_mode: 'INTERNAL',
          status: 'ACTIVE'
        })
        .select('id, slug, title')
        .single();

      if (publicationError) throw publicationError;

      console.log(`✅ [${i + 1}/${testPublications.length}] ${pub.title}`);
      console.log(`   📍 ${location.name} (${fuzzLat.toFixed(4)}, ${fuzzLng.toFixed(4)})`);
      console.log(`   🔗 /p/${publicationData.slug}\n`);

      successCount++;

    } catch (error) {
      console.error(`❌ [${i + 1}/${testPublications.length}] Error:`, pub.title);
      console.error(`   ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Publicaciones creadas: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log('='.repeat(50) + '\n');

  if (successCount > 0) {
    console.log('🗺️  Puedes ver las publicaciones en:');
    console.log('   - Mapa: http://localhost:5173/mapa');
    console.log('   - Cerca de ti: http://localhost:5173/cerca-de-ti');
    console.log('   - Buscar: http://localhost:5173/buscar\n');
  }
}

// Ejecutar
seedPublications()
  .then(() => {
    console.log('✅ Seed completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
