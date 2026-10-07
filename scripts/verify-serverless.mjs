#!/usr/bin/env node

/**
 * Script para verificar la cantidad de serverless functions que se desplegarán
 */

import { readdir } from 'fs/promises';
import { join } from 'path';

const API_DIR = 'api';
const MAX_FUNCTIONS = 12;

// Archivos y directorios que NO son funciones serverless
const EXCLUDED = [
  '_lib',
  'ai/',
  'publications/',
  'uploads/',
  'README.md'
];

async function getServerlessFunctions(dir, prefix = '') {
  const functions = [];
  const entries = await readdir(join(process.cwd(), dir), { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    
    // Verificar si está excluido
    const isExcluded = EXCLUDED.some(ex => 
      relativePath.includes(ex) || entry.name.includes(ex)
    );
    
    if (isExcluded) continue;

    if (entry.isDirectory()) {
      const subFunctions = await getServerlessFunctions(
        join(dir, entry.name),
        relativePath
      );
      functions.push(...subFunctions);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
      functions.push(relativePath);
    }
  }

  return functions;
}

async function main() {
  console.log('🔍 Verificando serverless functions...\n');

  try {
    const functions = await getServerlessFunctions(API_DIR);
    
    console.log('📦 Funciones que se desplegarán:\n');
    functions.forEach((fn, index) => {
      console.log(`   ${index + 1}. ${fn}`);
    });

    console.log(`\n📊 Total: ${functions.length} funciones`);
    console.log(`📏 Límite de Vercel: ${MAX_FUNCTIONS} funciones`);
    console.log(`✅ Slots disponibles: ${MAX_FUNCTIONS - functions.length}`);

    if (functions.length > MAX_FUNCTIONS) {
      console.error(`\n❌ ERROR: Excedes el límite de ${MAX_FUNCTIONS} funciones`);
      process.exit(1);
    } else if (functions.length === MAX_FUNCTIONS) {
      console.warn(`\n⚠️  ADVERTENCIA: Estás en el límite exacto`);
    } else {
      console.log(`\n✨ Perfecto! Estás ${MAX_FUNCTIONS - functions.length} funciones por debajo del límite`);
    }

    // Detalles de consolidación
    console.log('\n📋 Detalles de consolidación:\n');
    console.log('   • api/ai.ts → Consolida 6 endpoints de IA');
    console.log('   • api/publications.ts → Consolida 2 endpoints');
    console.log('   • api/admin/moderation.ts → Endpoint único');
    console.log('   • api/health.ts → Health check');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
