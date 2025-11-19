import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-navy via-bridge-blue to-vibrant-cyan">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-white mb-4">
              Armados 2Go
            </h1>
            <p className="text-2xl text-white/90 mb-2">
              Sistema de Gestión de Armado de Muebles
            </p>
            <p className="text-lg text-white/70">
              Optimiza la asignación, seguimiento y facturación de servicios de armado
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/login">
              <Button 
                size="lg" 
                className="bg-electric-coral hover:bg-electric-coral/90 text-white px-8 py-6 text-lg"
              >
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/orden/seguimiento">
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-8 py-6 text-lg"
              >
                Seguir mi Pedido
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2">Gestión Integral</h3>
              <p className="text-white/80">
                Administra proyectos, órdenes y armadores desde un solo lugar
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">IA Inteligente</h3>
              <p className="text-white/80">
                Asignación automática optimizada con machine learning
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-semibold mb-2">Tracking en Tiempo Real</h3>
              <p className="text-white/80">
                Seguimiento GPS y notificaciones automáticas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
