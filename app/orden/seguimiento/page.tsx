import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SeguimientoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-navy via-bridge-blue to-vibrant-cyan flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            Seguir mi Pedido
          </CardTitle>
          <CardDescription className="text-center">
            Ingresa el código de seguimiento que recibiste por WhatsApp o Email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código de Seguimiento</Label>
              <Input
                id="codigo"
                type="text"
                placeholder="Ej: ABC123XYZ"
                required
              />
            </div>
            <Button className="w-full bg-vibrant-cyan hover:bg-vibrant-cyan/90" type="submit">
              Buscar Pedido
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/" className="text-vibrant-cyan hover:underline">
              ← Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}