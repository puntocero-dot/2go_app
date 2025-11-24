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

type CobroMunicipio = {
  municipio: string;
  precio: number;
};

type Penalizacion = {
  tipo: 'PEDIDO_CANCELADO_EN_RUTA' | 'CLIENTE_NO_CONTESTO';
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

  // Prioridades
  const [precioVIP, setPrecioVIP] = useState(reglaActual?.precioVIP || 50);
  const [precioUrgente, setPrecioUrgente] = useState(reglaActual?.precioUrgente || 30);
  const [precioMedia, setPrecioMedia] = useState(reglaActual?.precioMedia || 15);
  const [precioNormal, setPrecioNormal] = useState(reglaActual?.precioNormal || 0);

  // Tamaños
  const [precioGrande, setPrecioGrande] = useState(reglaActual?.precioGrande || 40);
  const [precioMediano, setPrecioMediano] = useState(reglaActual?.precioMediano || 25);
  const [precioPequeno, setPrecioPequeno] = useState(reglaActual?.precioPequeno || 15);

  // Municipios
  const [municipios, setMunicipios] = useState<CobroMunicipio[]>(
    reglaActual?.cobrosDistancia || []
  );
  const [nuevoMunicipio, setNuevoMunicipio] = useState('');
  const [nuevoPrecioMunicipio, setNuevoPrecioMunicipio] = useState(10);

  // Penalizaciones
  const [penalizaciones, setPenalizaciones] = useState<Penalizacion[]>(
    reglaActual?.penalizaciones || [
      { tipo: 'PEDIDO_CANCELADO_EN_RUTA', precio: 20 },
      { tipo: 'CLIENTE_NO_CONTESTO', precio: 10 }
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

  const agregarMunicipio = () => {
    setMunicipios([...municipios, { municipio: nuevoMunicipio, precio: nuevoPrecioMunicipio }]);
    setNuevoMunicipio('');
    setNuevoPrecioMunicipio(10);
  };

  const eliminarMunicipio = (index: number) => {
    setMunicipios(municipios.filter((_, i) => i !== index));
  };

  const actualizarMunicipio = (index: number, field: keyof CobroMunicipio, value: any) => {
    const nuevosMunicipios = [...municipios];
    nuevosMunicipios[index] = {
      ...nuevosMunicipios[index],
      [field]: value
    };
    setMunicipios(nuevosMunicipios);
  };

  const agregarPenalizacion = () => {
    setPenalizaciones([...penalizaciones, { tipo: 'PEDIDO_CANCELADO_EN_RUTA', precio: 20 }]);
  };

  const eliminarPenalizacion = (index: number) => {
    setPenalizaciones(penalizaciones.filter((_, i) => i !== index));
  };

  const actualizarPenalizacion = (index: number, field: keyof Penalizacion, value: any) => {
    const nuevasPenalizaciones = [...penalizaciones];
    nuevasPenalizaciones[index] = {
      ...nuevasPenalizaciones[index],
      [field]: value
    };
    setPenalizaciones(nuevasPenalizaciones);
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
        ),
        // Prioridades
        precioVIP: parseFloat(precioVIP.toString()),
        precioUrgente: parseFloat(precioUrgente.toString()),
        precioMedia: parseFloat(precioMedia.toString()),
        precioNormal: parseFloat(precioNormal.toString()),
        // Tamaños
        precioGrande: parseFloat(precioGrande.toString()),
        precioMediano: parseFloat(precioMediano.toString()),
        precioPequeno: parseFloat(precioPequeno.toString()),
        // Municipios
        cobrosDistancia: municipios,
        // Penalizaciones
        penalizaciones: penalizaciones
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

      {/* Prioridades */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold">Recargos por Prioridad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="precioVIP">VIP ($)</Label>
            <Input
              id="precioVIP"
              type="number"
              step="0.01"
              min="0"
              value={precioVIP}
              onChange={(e) => setPrecioVIP(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="precioUrgente">Urgente ($)</Label>
            <Input
              id="precioUrgente"
              type="number"
              step="0.01"
              min="0"
              value={precioUrgente}
              onChange={(e) => setPrecioUrgente(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="precioMedia">Media ($)</Label>
            <Input
              id="precioMedia"
              type="number"
              step="0.01"
              min="0"
              value={precioMedia}
              onChange={(e) => setPrecioMedia(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="precioNormal">Normal ($)</Label>
            <Input
              id="precioNormal"
              type="number"
              step="0.01"
              min="0"
              value={precioNormal}
              onChange={(e) => setPrecioNormal(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Tamaños */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold">Recargos por Tamaño</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="precioGrande">Grande ($)</Label>
            <Input
              id="precioGrande"
              type="number"
              step="0.01"
              min="0"
              value={precioGrande}
              onChange={(e) => setPrecioGrande(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="precioMediano">Mediano ($)</Label>
            <Input
              id="precioMediano"
              type="number"
              step="0.01"
              min="0"
              value={precioMediano}
              onChange={(e) => setPrecioMediano(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="precioPequeno">Pequeño ($)</Label>
            <Input
              id="precioPequeno"
              type="number"
              step="0.01"
              min="0"
              value={precioPequeno}
              onChange={(e) => setPrecioPequeno(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Municipios */}
      <div className="space-y-4 border-t pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cobros por Municipio</h3>
        </div>
        
        {/* Agregar nuevo municipio */}
        <Card className="p-4 bg-blue-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nuevoMunicipio">Municipio</Label>
              <Input
                id="nuevoMunicipio"
                value={nuevoMunicipio}
                onChange={(e) => setNuevoMunicipio(e.target.value)}
                placeholder="Ej: San Salvador"
              />
            </div>
            <div>
              <Label htmlFor="nuevoPrecioMunicipio">Precio ($)</Label>
              <div className="flex gap-2">
                <Input
                  id="nuevoPrecioMunicipio"
                  type="number"
                  step="0.01"
                  min="0"
                  value={nuevoPrecioMunicipio}
                  onChange={(e) => setNuevoPrecioMunicipio(parseFloat(e.target.value))}
                />
                <Button
                  type="button"
                  onClick={agregarMunicipio}
                  disabled={!nuevoMunicipio.trim()}
                  size="sm"
                >
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de municipios */}
        {municipios.length > 0 && (
          <div className="space-y-2">
            {municipios.map((mun, index) => (
              <Card key={index} className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <Input
                      value={mun.municipio}
                      onChange={(e) => actualizarMunicipio(index, 'municipio', e.target.value)}
                      placeholder="Municipio"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={mun.precio}
                      onChange={(e) => actualizarMunicipio(index, 'precio', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => eliminarMunicipio(index)}
                      className="w-full"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Penalizaciones */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold">Penalizaciones</h3>
        {penalizaciones.map((pen, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <Label>Tipo</Label>
                <select
                  value={pen.tipo}
                  onChange={(e) => actualizarPenalizacion(index, 'tipo', e.target.value)}
                  className="w-full mt-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="PEDIDO_CANCELADO_EN_RUTA">Orden Cancelada</option>
                  <option value="CLIENTE_NO_CONTESTO">Cliente No Contesta</option>
                </select>
              </div>
              <div>
                <Label>Precio ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pen.precio}
                  onChange={(e) => actualizarPenalizacion(index, 'precio', parseFloat(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                {penalizaciones.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => eliminarPenalizacion(index)}
                    className="w-full"
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        <Button type="button" onClick={agregarPenalizacion} variant="outline" size="sm">
          + Agregar Penalización
        </Button>
      </div>

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