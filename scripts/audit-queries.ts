/**
 * Script para auditar queries de Prisma
 * Ejecutar: npx tsx scripts/audit-queries.ts
 */

import { PrismaClient } from '@prisma/client';

interface QueryLog {
  query: string;
  duration: number;
  params: string;
  timestamp: Date;
}

const queries: QueryLog[] = [];

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
  ],
});

// Capturar todas las queries
prisma.$on('query', (e) => {
  queries.push({
    query: e.query,
    duration: e.duration,
    params: e.params,
    timestamp: new Date()
  });
});

async function auditQueries() {
  console.log('🔍 Iniciando auditoría de queries...\n');
  console.log('=' .repeat(60));
  
  // ===== Test 1: Listado de órdenes =====
  console.log('\n📋 Test 1: Listado de órdenes (20 registros)');
  const startOrdenes = Date.now();
  
  await prisma.orden.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      armador: {
        include: {
          usuario: {
            select: { nombre: true, fotoPerfil: true }
          }
        }
      },
      proyecto: {
        select: { nombreComercial: true }
      },
      usuarioFinal: {
        select: { nombre: true, direccionCompleta: true }
      }
    }
  });
  
  console.log(`   Tiempo total: ${Date.now() - startOrdenes}ms`);
  
  // ===== Test 2: Listado de turnos =====
  console.log('\n📋 Test 2: Listado de turnos (20 registros)');
  const startTurnos = Date.now();
  
  await prisma.turno.findMany({
    take: 20,
    orderBy: { inicioTurno: 'desc' },
    include: {
      armador: {
        include: {
          usuario: {
            select: { nombre: true }
          }
        }
      },
      _count: {
        select: { rutaPuntos: true }
      }
    }
  });
  
  console.log(`   Tiempo total: ${Date.now() - startTurnos}ms`);
  
  // ===== Test 3: Dashboard stats (paralelo) =====
  console.log('\n📋 Test 3: Dashboard stats (queries paralelas)');
  const startDashboard = Date.now();
  
  await Promise.all([
    prisma.orden.count(),
    prisma.orden.count({ where: { estado: 'SIN_ASIGNAR' } }),
    prisma.orden.count({ where: { estado: 'ARMADO_COMPLETADO' } }),
    prisma.armador.count(),
    prisma.turno.count({
      where: {
        inicioTurno: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  ]);
  
  console.log(`   Tiempo total: ${Date.now() - startDashboard}ms`);
  
  // ===== Test 4: Turno con ruta completa =====
  console.log('\n📋 Test 4: Turno con ruta (caso pesado)');
  const startRuta = Date.now();
  
  const turnoConRuta = await prisma.turno.findFirst({
    include: {
      rutaPuntos: {
        orderBy: { timestamp: 'asc' },
        take: 100 // Limitar para no sobrecargar
      }
    }
  });
  
  console.log(`   Tiempo total: ${Date.now() - startRuta}ms`);
  if (turnoConRuta) {
    console.log(`   Puntos cargados: ${turnoConRuta.rutaPuntos.length}`);
  }
  
  // ===== Análisis de resultados =====
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 RESULTADOS DE AUDITORÍA\n');
  
  const slowQueries = queries.filter(q => q.duration > 100);
  const verySlowQueries = queries.filter(q => q.duration > 1000);
  
  console.log(`Total queries ejecutadas: ${queries.length}`);
  console.log(`Queries lentas (>100ms): ${slowQueries.length}`);
  console.log(`Queries muy lentas (>1s): ${verySlowQueries.length}`);
  
  // Detectar posibles N+1
  const queryPatterns = new Map<string, number>();
  queries.forEach(q => {
    const normalized = q.query
      .replace(/\$\d+/g, '$N')
      .replace(/'[^']*'/g, "'?'")
      .substring(0, 100);
    queryPatterns.set(normalized, (queryPatterns.get(normalized) || 0) + 1);
  });
  
  const repeatedQueries = Array.from(queryPatterns.entries())
    .filter(([_, count]) => count > 5)
    .sort((a, b) => b[1] - a[1]);
  
  if (repeatedQueries.length > 0) {
    console.log('\n⚠️  Posibles N+1 (queries repetidas >5 veces):');
    repeatedQueries.forEach(([pattern, count]) => {
      console.log(`   ${count}x: ${pattern}...`);
    });
  }
  
  if (verySlowQueries.length > 0) {
    console.log('\n🐌 Queries muy lentas (>1s):');
    verySlowQueries.forEach(q => {
      console.log(`   ${q.duration}ms: ${q.query.substring(0, 80)}...`);
    });
  }
  
  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:\n');
  
  if (verySlowQueries.length > 0) {
    console.log('   • Revisar índices en tablas con queries lentas');
    console.log('   • Considerar paginación para listados grandes');
  }
  
  if (repeatedQueries.length > 0) {
    console.log('   • Usar include/select para evitar N+1');
    console.log('   • Considerar dataloader pattern para relaciones');
  }
  
  console.log('   • Usar _count en lugar de cargar relaciones completas');
  console.log('   • Usar Promise.all para queries independientes');
  console.log('   • Limitar campos con select para reducir payload');
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Auditoría completada\n');
  
  await prisma.$disconnect();
}

auditQueries()
  .catch((error) => {
    console.error('❌ Error en auditoría:', error);
    process.exit(1);
  });
