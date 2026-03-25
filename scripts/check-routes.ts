import { prisma } from '../lib/prisma';

async function checkRoutes() {
  console.log('Verificando rutas en la base de datos...');
  
  // 1. Verificar turnos
  const turnos = await prisma.turno.findMany({
    include: {
      armador: {
        include: {
          usuario: {
            select: { nombre: true, email: true }
          }
        }
      },
      rutaPuntos: {
        orderBy: { timestamp: 'asc' },
        take: 5
      },
      _count: {
        select: { rutaPuntos: true }
      }
    },
    orderBy: { inicioTurno: 'desc' },
    take: 10
  });

  console.log(`\n=== Turnos encontrados: ${turnos.length} ===`);
  
  turnos.forEach((turno, index) => {
    console.log(`\n${index + 1}. Turno: ${turno.id}`);
    console.log(`   Armador: ${turno.armador.usuario.nombre}`);
    console.log(`   Estado: ${turno.estado}`);
    console.log(`   Puntos de ruta: ${turno._count.rutaPuntos}`);
    console.log(`   Inicio: ${turno.inicioTurno}`);
    
    if (turno.rutaPuntos.length > 0) {
      console.log(`   Primer punto: ${turno.rutaPuntos[0].latitud}, ${turno.rutaPuntos[0].longitud}`);
      console.log(`   Tipo: ${turno.rutaPuntos[0].tipo}`);
    }
  });

  // 2. Verificar todos los puntos de ruta
  const totalPuntos = await prisma.rutaPunto.count();
  console.log(`\n=== Total de puntos de ruta en BD: ${totalPuntos} ===`);

  if (totalPuntos === 0) {
    console.log('\n⚠️  No hay puntos de ruta en la base de datos');
    console.log('Posibles causas:');
    console.log('- El GPS tracking no está activo');
    console.log('- No hay turnos iniciados');
    console.log('- Los puntos no se están guardando correctamente');
    
    // 3. Verificar si hay turnos activos
    const turnosActivos = await prisma.turno.findMany({
      where: { estado: 'ACTIVO' },
      include: {
        armador: {
          include: {
            usuario: { select: { nombre: true } }
          }
        }
      }
    });
    
    console.log(`\n=== Turnos ACTIVOS: ${turnosActivos.length} ===`);
    turnosActivos.forEach((turno) => {
      console.log(`- ${turno.armador.usuario.nombre} (${turno.id})`);
    });
  } else {
    // Mostrar algunos puntos de ejemplo
    const puntosRecientes = await prisma.rutaPunto.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: {
        turno: {
          include: {
            armador: {
              include: {
                usuario: { select: { nombre: true } }
              }
            }
          }
        }
      }
    });
    
    console.log('\n=== Puntos recientes ===');
    puntosRecientes.forEach((punto, index) => {
      console.log(`${index + 1}. ${punto.turno.armador.usuario.nombre} - ${punto.tipo}`);
      console.log(`   Coords: ${punto.latitud}, ${punto.longitud}`);
      console.log(`   Timestamp: ${punto.timestamp}`);
    });
  }

  await prisma.$disconnect();
}

checkRoutes().catch(console.error);
