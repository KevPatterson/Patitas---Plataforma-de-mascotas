#!/usr/bin/env node
/**
 * Script para verificar las coordenadas en la base de datos
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCoordinates() {
  console.log('🔍 Verificando coordenadas en la base de datos...\n');

  // Verificar las publicaciones
  const { data: pubs, error: pubsError } = await supabase
    .from('publications')
    .select('id, title, location_id')
    .order('created_at', { ascending: false })
    .limit(10);

  if (pubsError) {
    console.error('❌ Error obteniendo publicaciones:', pubsError);
    return;
  }

  console.log(`📝 Publicaciones encontradas: ${pubs.length}\n`);

  for (const pub of pubs) {
    console.log(`\n📄 ${pub.title}`);
    console.log(`   ID: ${pub.id}`);
    console.log(`   Location ID: ${pub.location_id}`);

    if (pub.location_id) {
      // Buscar la ubicación
      const { data: loc, error: locError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', pub.location_id)
        .single();

      if (locError) {
        console.log(`   ❌ Error obteniendo ubicación: ${locError.message}`);
      } else if (loc) {
        console.log(`   📍 Provincia: ${loc.province}`);
        console.log(`   📍 Municipio: ${loc.municipality}`);
        console.log(`   📍 Zona: ${loc.zone || 'N/A'}`);
        console.log(`   🗺️  Lat: ${loc.approximate_lat}`);
        console.log(`   🗺️  Lng: ${loc.approximate_lng}`);

        if (!loc.approximate_lat || !loc.approximate_lng) {
          console.log(`   ⚠️  ¡COORDENADAS FALTANTES!`);
        } else {
          console.log(`   ✅ Coordenadas OK`);
        }
      }
    } else {
      console.log(`   ⚠️  NO TIENE LOCATION_ID`);
    }
  }

  // Verificar con la consulta que usa la app
  console.log('\n\n🔍 Probando consulta de la app...\n');

  const { data: testData, error: testError } = await supabase
    .from('publications')
    .select('id, title, location:locations(province, municipality, zone, approximate_lat, approximate_lng)')
    .limit(3);

  if (testError) {
    console.error('❌ Error en consulta de prueba:', testError);
  } else {
    console.log('📊 Resultado de la consulta:');
    console.log(JSON.stringify(testData, null, 2));
  }
}

checkCoordinates()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
