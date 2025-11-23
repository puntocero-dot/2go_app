'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type RangoVolumen = {
  desde: number;
  hasta: number | null;
  precio: number;
};

type ReglaCobroFormProps = {
  proyectoId: string;
  reglaActual: any;
};

export default function ReglaCobroForm({ proyectoId, reglaActual }: ReglaCobroFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [tipo, setTipo] = useState<'COBRO_FIJO_UNITARIO' | 'COBRO_POR_VOLUMEN'>(
    reglaActual?.tipoPrincipal || 'COBRO_FIJO_UNITARIO'
  );

  const [precioFijo, setPrecioFijo] = useState(
    reglaActual?.precioFijoUnitario || 25
  );

  const [rangos, setRangos] = useState<RangoVolumen[]>(
    reglaActual?.rangosVolumen || [
      { desde: 1, hasta: 50, precio: 30 },
      { desde: 51, hasta: 100, precio: 28 },
      { desde: 101, hasta: null, precio: 25 }
    ]
  );

  const agregarRango = () => {
    const ultimoRango = rangos[rangos.length - 1];
    const nuevoDesde = (ultimoRango?.hasta || 0) + 1;
    setRangos([...rangos, { desde: nuevoDesde, hasta: null, precio: 25 }]);
  };

  const eliminarRango = (index: number) => {
    if (rangos.length > 1) {
      setRangos(rangos.filter((_, i) => i !== index));
    }
  };

  const actualizarRango = (index: number, field: keyof RangoVolumen, value: any) => {
    const nuevosRangos = [...rangos];
    nuevosRangos[index] = {
      ...nuevosRangos[index],
      [field]: value === '' ? null : value
    };
    setRangos(nuevosRangos);
  };

  const validarRangos = (): boolean => {
    // Validar que no haya gaps
    for (let i = 0; i < rangos.length - 1; i++) {
      const actual = rangos[i];
      const siguiente = rangos[i + 1];
      
      if (actual.hasta === null) {
        setError('Solo el último rango puede tener "hasta" infinito');
        return false;
      }
      
      if (siguiente.desde !== actual.hasta + 1) {
        setError(`Gap detectado entre rangos ${i + 1} y ${i + 2}`);
        return false;
      }
    }

    // Validar precios
    for (const rango of rangos) {
      if (rango.precio <= 0) {
        setError('Todos los precios deben ser mayores a 0');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tipo === 'COBRO_POR_VOLUMEN' && !validarRangos()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        tipoPrincipal: tipo,
        ...(tipo === 'COBRO_FIJO_UNITARIO' 
          ? { precioFijoUnitario: parseFloat(precioFijo.toString()) }
          : { rangosVolumen: rangos }
        )
      };

      const res = await fetch(`/api/proyectos/${proyectoId}/reglas`, {
        method: reglaActual ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar');
      }

      alert('✅ Regla de cobro guardada exitosamente');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selector de tipo */}
      <div className="space-y-2">
        <Label>Tipo de Regla</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="COBRO_FIJO_UNITARIO"
              checked={tipo === 'COBRO_FIJO_UNITARIO'}
              onChange={(e) => setTipo(e.target.value as any)}
              className="w-4 h-4"
            />
            <span>Cobro Fijo por Orden</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="COBRO_POR_VOLUMEN"
              checked={tipo === 'COBRO_POR_VOLUMEN'}
              onChange={(e) => setTipo(e.target.value as any)}
              className="w-4 h-4"
            />
            <span>Cobro por Volumen (Rangos)</span>
          </label>
        </div>
      </div>

      {/* Cobro Fijo */}
      {tipo === 'COBRO_FIJO_UNITARIO' && (
        <div className="space-y-2">
          <Label htmlFor="precioFijo">Precio por Orden ($)</Label>
          <Input
            id="precioFijo"
            type="number"
            step="0.01"
            min="0"
            value={precioFijo}
            onChange={(e) => setPrecioFijo(parseFloat(e.target.value))}
            required
          />
          <p className="text-sm text-muted-foreground">
            Se cobrará este monto por cada orden completada
          </p>
        </div>
      )}

      {/* Cobro por Volumen */}
      {tipo === 'COBRO_POR_VOLUMEN' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Rangos de Volumen</Label>
            <Button type="button" onClick={agregarRango} variant="outline" size="sm">
              + Agregar Rango
            </Button>
          </div>

          {rangos.map((rango, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Desde</Label>
                  <Input
                    type="number"
                    min="1"
                    value={rango.desde}
                    onChange={(e) => actualizarRango(index, 'desde', parseInt(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label>Hasta</Label>
                  <Input
                    type="number"
                    min={rango.desde}
                    value={rango.hasta || ''}
                    onChange={(e) => actualizarRango(index, 'hasta', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="∞"
                  />
                </div>
                <div>
                  <Label>Precio ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rango.precio}
                    onChange={(e) => actualizarRango(index, 'precio', parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div className="flex items-end">
                  {rangos.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => eliminarRango(index)}
                      className="w-full"
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          <p className="text-sm text-muted-foreground">
            💡 El precio se aplica según el total de órdenes completadas en el periodo
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Regla'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}