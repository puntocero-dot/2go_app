#!/usr/bin/env node

/**
 * Script de pre-commit para verificar que el código compila correctamente
 * Ejecuta type-check antes de permitir el commit
 */

const { execSync } = require('child_process');

console.log('🔍 Verificando tipos de TypeScript...\n');

try {
  // Ejecutar type-check de Next.js
  execSync('npm run type-check', { stdio: 'inherit' });
  
  console.log('\n✅ Type-check exitoso! Puedes hacer commit.\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Error de tipos detectado!');
  console.error('Por favor corrige los errores antes de hacer commit.\n');
  process.exit(1);
}
