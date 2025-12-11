import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllFlags, getEnabledFlagsForUser } from '@/lib/feature-flags';

/**
 * GET /api/feature-flags
 * Obtener flags habilitados para el usuario actual
 */
export async function GET(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      // Sin sesión, devolver flags públicos
      return NextResponse.json({
        flags: getEnabledFlagsForUser(),
        authenticated: false,
      });
    }

    // Con sesión, devolver flags específicos del usuario
    const enabledFlags = getEnabledFlagsForUser(session.userId, session.rol);

    // Si es admin, también devolver todos los flags con su config
    if (session.rol === 'ADMIN') {
      return NextResponse.json({
        flags: enabledFlags,
        allFlags: getAllFlags(),
        authenticated: true,
        userId: session.userId,
        rol: session.rol,
      });
    }

    return NextResponse.json({
      flags: enabledFlags,
      authenticated: true,
      userId: session.userId,
      rol: session.rol,
    });
  } catch (error) {
    console.error('Error obteniendo feature flags:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
