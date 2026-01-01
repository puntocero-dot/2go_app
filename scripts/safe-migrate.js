#!/usr/bin/env node
/**
 * Script de migración segura para Prisma
 * 
 * NUNCA permite ejecutar `migrate dev` o `migrate reset` contra producción.
 * Solo permite `migrate deploy` en producción.
 * 
 * Uso:
 *   node scripts/safe-migrate.js dev      # Para desarrollo (migrate dev)
 *   node scripts/safe-migrate.js deploy   # Para producción (migrate deploy)
 *   node scripts/safe-migrate.js status   # Ver estado de migraciones
 */

const { execSync } = require('child_process');

// ============================================
// CONFIGURACIÓN DE BASES DE DATOS
// ============================================

// Base de datos de DESARROLLO (Supabase DEV) - PERMITIDO migrate dev
const DEV_DATABASE_PATTERNS = [
  'owbudzbildgfhriabsts', // Supabase DEV project ID
  'us-west-2',            // Región de DEV
];

// Base de datos de PRODUCCIÓN (Supabase PRD) - BLOQUEADO migrate dev
const PROD_DATABASE_PATTERNS = [
  'fgpfycmdehoowsyrmbrh', // Supabase PRD project ID
  'us-east-1',            // Región de PRD
];

// Patrones genéricos que indican producción (si no es DEV explícito)
const PRODUCTION_CLOUD_PATTERNS = [
  'neon.tech',
  'planetscale.com',
  'railway.app',
  'render.com',
  'aws.amazon.com',
  'azure.com',
  'cloud.google.com',
];

// Palabras clave que indican producción
const PRODUCTION_KEYWORDS = [
  'prod',
  'production',
  'live',
];

function getDatabaseUrl() {
  return process.env.DATABASE_URL || '';
}

function isProductionDatabase(url) {
  const urlLower = url.toLowerCase();
  
  // PRIMERO: Verificar si es la base de datos de DESARROLLO (permitida)
  for (const pattern of DEV_DATABASE_PATTERNS) {
    if (urlLower.includes(pattern.toLowerCase())) {
      return false; // Es DEV, NO es producción
    }
  }
  
  // SEGUNDO: Verificar si es la base de datos de PRODUCCIÓN (bloqueada)
  for (const pattern of PROD_DATABASE_PATTERNS) {
    if (urlLower.includes(pattern.toLowerCase())) {
      return true; // Es PRD
    }
  }
  
  // TERCERO: Verificar otros proveedores cloud (probablemente producción)
  for (const pattern of PRODUCTION_CLOUD_PATTERNS) {
    if (urlLower.includes(pattern.toLowerCase())) {
      return true;
    }
  }
  
  // CUARTO: Verificar palabras clave de producción
  for (const keyword of PRODUCTION_KEYWORDS) {
    if (urlLower.includes(keyword)) {
      return true;
    }
  }
  
  // QUINTO: localhost siempre es desarrollo
  const isLocal = urlLower.includes('localhost') || 
                  urlLower.includes('127.0.0.1') ||
                  urlLower.includes('host.docker.internal');
  
  if (isLocal) {
    return false;
  }
  
  // Por defecto, si no reconocemos la URL, asumimos producción (seguro)
  return true;
}

function getEnvironmentName(url) {
  const urlLower = url.toLowerCase();
  
  for (const pattern of DEV_DATABASE_PATTERNS) {
    if (urlLower.includes(pattern.toLowerCase())) {
      return '🟢 DESARROLLO (Supabase DEV)';
    }
  }
  
  for (const pattern of PROD_DATABASE_PATTERNS) {
    if (urlLower.includes(pattern.toLowerCase())) {
      return '🔴 PRODUCCIÓN (Supabase PRD)';
    }
  }
  
  if (urlLower.includes('localhost') || urlLower.includes('127.0.0.1')) {
    return '🟢 DESARROLLO (localhost)';
  }
  
  return '⚠️  DESCONOCIDO (tratado como producción)';
}

function printError(message) {
  console.error('\n' + '='.repeat(70));
  console.error('❌ ERROR DE SEGURIDAD');
  console.error('='.repeat(70));
  console.error(message);
  console.error('='.repeat(70) + '\n');
}

function printWarning(message) {
  console.warn('\n' + '⚠️  ' + message + '\n');
}

function printSuccess(message) {
  console.log('\n' + '✅ ' + message + '\n');
}

function printInfo(message) {
  console.log('ℹ️  ' + message);
}

function maskDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.password = '****';
    return parsed.toString();
  } catch {
    return url.replace(/:[^:@]+@/, ':****@');
  }
}

function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const migrationName = args[1];
  
  const databaseUrl = getDatabaseUrl();
  const isProduction = isProductionDatabase(databaseUrl);
  const maskedUrl = maskDatabaseUrl(databaseUrl);
  
  const envName = getEnvironmentName(databaseUrl);
  
  console.log('\n' + '─'.repeat(70));
  console.log('🔒 PRISMA SAFE MIGRATE');
  console.log('─'.repeat(70));
  printInfo(`Database: ${maskedUrl}`);
  printInfo(`Entorno: ${envName}`);
  console.log('─'.repeat(70));
  
  if (!command) {
    console.log(`
Uso:
  npm run db:migrate:dev [nombre]   # Solo desarrollo - crea y aplica migraciones
  npm run db:migrate:deploy         # Producción - aplica migraciones existentes
  npm run db:migrate:status         # Ver estado de migraciones
  npm run db:push                   # Solo desarrollo - sync sin migración

Comandos directos:
  node scripts/safe-migrate.js dev [nombre]
  node scripts/safe-migrate.js deploy
  node scripts/safe-migrate.js status
  node scripts/safe-migrate.js push
`);
    process.exit(0);
  }
  
  switch (command) {
    case 'dev': {
      if (isProduction) {
        printError(`
¡OPERACIÓN BLOQUEADA!

No puedes ejecutar 'migrate dev' contra una base de datos de producción.
Este comando puede BORRAR TODOS LOS DATOS.

Base de datos detectada: ${maskedUrl}

Si necesitas aplicar migraciones en producción, usa:
  npm run db:migrate:deploy

Si realmente estás en desarrollo, verifica tu archivo .env
y asegúrate de que DATABASE_URL apunte a tu base de datos local.
`);
        process.exit(1);
      }
      
      printSuccess('Entorno de desarrollo confirmado. Ejecutando migrate dev...');
      const nameArg = migrationName ? `--name ${migrationName}` : '';
      runCommand(`npx prisma migrate dev ${nameArg}`);
      break;
    }
    
    case 'deploy': {
      printInfo('Ejecutando migrate deploy (seguro para producción)...');
      printWarning('Este comando solo aplica migraciones existentes, no crea nuevas.');
      runCommand('npx prisma migrate deploy');
      break;
    }
    
    case 'status': {
      printInfo('Verificando estado de migraciones...');
      runCommand('npx prisma migrate status');
      break;
    }
    
    case 'push': {
      if (isProduction) {
        printError(`
¡OPERACIÓN BLOQUEADA!

No puedes ejecutar 'db push' contra una base de datos de producción.
Este comando puede causar pérdida de datos.

Base de datos detectada: ${maskedUrl}

Para producción, usa migraciones:
  npm run db:migrate:deploy
`);
        process.exit(1);
      }
      
      printSuccess('Entorno de desarrollo confirmado. Ejecutando db push...');
      runCommand('npx prisma db push');
      break;
    }
    
    case 'reset': {
      printError(`
¡OPERACIÓN BLOQUEADA!

El comando 'migrate reset' está PROHIBIDO en este proyecto.
Este comando BORRA TODOS LOS DATOS de la base de datos.

Si realmente necesitas resetear tu base de datos de desarrollo:
1. Asegúrate de que DATABASE_URL apunta a localhost
2. Ejecuta manualmente: npx prisma migrate reset

NUNCA ejecutes esto contra producción.
`);
      process.exit(1);
    }
    
    default: {
      console.error(`Comando desconocido: ${command}`);
      console.log('Usa: dev, deploy, status, push');
      process.exit(1);
    }
  }
}

main();
