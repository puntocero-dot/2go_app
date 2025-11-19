"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  crearUsuarioSchema,
  actualizarUsuarioSchema,
} from "@/lib/schemas/usuario.schema";
import { useToast } from "@/hooks/use-toast";

const ROLES: Array<{ value: RolPermitido; label: string }> = [
  { value: "ADMIN", label: "Administrador" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "ARMADOR", label: "Armador" },
];

const ESTADOS_ARMADOR: EstadoArmadorPermitido[] = [
  "ACTIVO",
  "INACTIVO",
  "VACACIONES",
];

const DEFAULT_FORM_STATE: FormState = {
  nombre: "",
  email: "",
  telefono: "",
  password: "",
  rol: "ARMADOR",
  estadoArmador: "ACTIVO",
  habilidades: "",
};

export type RolPermitido = "ADMIN" | "SUPERVISOR" | "ARMADOR";
export type EstadoArmadorPermitido = "ACTIVO" | "INACTIVO" | "VACACIONES";

type UsuarioItem = {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: RolPermitido;
  activo: boolean;
  createdAt: string;
  armador: {
    id: string;
    estado: EstadoArmadorPermitido;
    habilidades: string[];
    ordenesActivas: number;
  } | null;
};

type FormState = {
  nombre: string;
  email: string;
  telefono: string;
  password: string;
  rol: RolPermitido;
  estadoArmador: EstadoArmadorPermitido;
  habilidades: string;
};

type EditFormState = {
  nombre: string;
  email: string;
  telefono: string;
  rol: RolPermitido;
  estadoArmador: EstadoArmadorPermitido;
  habilidades: string;
  nuevaContrasena: string;
};

type Props = {
  initialUsers: UsuarioItem[];
};

function getPasswordChecks(value: string) {
  const trimmed = value ?? "";
  return {
    length: trimmed.length >= 8,
    upper: /[A-Z]/.test(trimmed),
    lower: /[a-z]/.test(trimmed),
    number: /[0-9]/.test(trimmed),
    symbol: /[^A-Za-z0-9]/.test(trimmed),
  };
}

export function AdminUsersManager({ initialUsers }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>(initialUsers);
  const [filterRol, setFilterRol] = useState<"ALL" | RolPermitido>("ALL");
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFieldErrors, setFormFieldErrors] = useState<Record<string, string>>({});

  const [editingUser, setEditingUser] = useState<UsuarioItem | null>(null);
  const [editingState, setEditingState] = useState<EditFormState | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [editingSuccess, setEditingSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();

  const scrollToCreateField = (field: string) => {
    if (typeof window === "undefined") return;

    const idMap: Record<string, string> = {
      nombre: "nombre",
      email: "email",
      password: "password",
      telefono: "telefono",
      rol: "rol",
      estadoArmador: "estadoArmador",
      habilidades: "habilidades",
    };

    const targetId = idMap[field] ?? field;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof (el as HTMLElement).focus === "function") {
        (el as HTMLElement).focus();
      }
    }
  };

  const scrollToEditField = (field: string) => {
    if (typeof window === "undefined") return;

    const idMap: Record<string, string> = {
      nombre: "edit-nombre",
      email: "edit-email",
      password: "edit-password",
      telefono: "edit-telefono",
      rol: "edit-rol",
      estadoArmador: "edit-estado-armador",
      habilidades: "edit-habilidades",
    };

    const targetId = idMap[field] ?? field;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof (el as HTMLElement).focus === "function") {
        (el as HTMLElement).focus();
      }
    }
  };

  const createPasswordChecks = getPasswordChecks(formState.password);
  const editPasswordChecks = editingState
    ? getPasswordChecks(editingState.nuevaContrasena)
    : null;

  const fetchUsuarios = useCallback(
    async (rol: "ALL" | RolPermitido) => {
      setListLoading(true);
      setListError(null);

      try {
        const query = rol === "ALL" ? "" : `?rol=${rol}`;
        const response = await fetch(`/api/usuarios${query}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || "Error obteniendo usuarios");
        }

        const data = await response.json();
        setUsuarios(data.usuarios ?? []);
      } catch (error) {
        console.error(error);
        setListError(
          error instanceof Error
            ? error.message
            : "Error inesperado obteniendo usuarios"
        );
      } finally {
        setListLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchUsuarios(filterRol);
  }, [fetchUsuarios, filterRol]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormError(null);
      setFormSuccess(null);
      setFormFieldErrors({});
      setIsSubmitting(true);

      try {
        const toValidate = {
          nombre: formState.nombre,
          email: formState.email,
          password: formState.password,
          telefono: formState.telefono || "",
          rol: formState.rol,
          estadoArmador: formState.rol === "ARMADOR" ? formState.estadoArmador : undefined,
          habilidades: formState.habilidades,
        };

        const validation = crearUsuarioSchema.safeParse(toValidate);

        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.errors.forEach((err) => {
            const field = err.path[0];
            if (typeof field === "string" && !fieldErrors[field]) {
              fieldErrors[field] = err.message;
            }
          });

          const orderedFields = [
            "nombre",
            "email",
            "password",
            "telefono",
            "rol",
            "estadoArmador",
            "habilidades",
          ];
          const firstErrorField =
            orderedFields.find((name) => fieldErrors[name]) ||
            Object.keys(fieldErrors)[0];

          if (firstErrorField) {
            scrollToCreateField(firstErrorField);
          }

          setFormFieldErrors(fieldErrors);
          setIsSubmitting(false);
          return;
        }

        const payload: Record<string, unknown> = {
          nombre: formState.nombre.trim(),
          email: formState.email.trim().toLowerCase(),
          password: formState.password,
          rol: formState.rol,
        };

        if (formState.telefono.trim()) {
          payload.telefono = formState.telefono.trim();
        }

        if (formState.rol === "ARMADOR") {
          payload.estadoArmador = formState.estadoArmador;

          const habilidadesLimpias = formState.habilidades
            .split(",")
            .map((habilidad) => habilidad.trim())
            .filter((habilidad) => habilidad.length > 0);

          if (habilidadesLimpias.length > 0) {
            payload.habilidades = habilidadesLimpias;
          }
        }

        const response = await fetch("/api/usuarios", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          const zodErrors =
            data?.detalles?.fieldErrors &&
            Object.values(data.detalles.fieldErrors)
              .flat()
              .filter((msg: unknown): msg is string => typeof msg === "string");

          const message =
            zodErrors && zodErrors.length > 0
              ? zodErrors.join(" ")
              : data?.error || "Error al crear usuario";

          throw new Error(message);
        }

        setFormSuccess("Usuario creado correctamente.");
        toast({
          title: "Usuario creado",
          description: `${formState.nombre.trim()} ha sido agregado exitosamente.`,
        });
        setFormState(DEFAULT_FORM_STATE);
        setFilterRol("ALL");
        await fetchUsuarios("ALL");
      } catch (error) {
        console.error(error);
        const message =
          error instanceof Error ? error.message : "Error inesperado al crear usuario";
        setFormError(message);
        toast({
          title: "Error al crear usuario",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchUsuarios, formState]
  );

  const usuariosFiltrados = useMemo(() => usuarios, [usuarios]);

  const mapUsuarioFromApi = useCallback((raw: any): UsuarioItem | null => {
    if (!raw) return null;
    return {
      id: raw.id,
      nombre: raw.nombre,
      email: raw.email,
      telefono: raw.telefono,
      rol: raw.rol,
      activo: raw.activo,
      createdAt:
        typeof raw.createdAt === "string"
          ? raw.createdAt
          : new Date(raw.createdAt).toISOString(),
      armador: raw.armador
        ? {
            id: raw.armador.id,
            estado: raw.armador.estado,
            habilidades: raw.armador.habilidades ?? [],
            ordenesActivas: raw.armador.ordenesActivas ?? 0,
          }
        : null,
    };
  }, []);

  const startEditUser = useCallback((usuario: UsuarioItem) => {
    setEditingUser(usuario);
    setEditingState({
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono ?? "",
      rol: usuario.rol,
      estadoArmador: usuario.armador ? usuario.armador.estado : "ACTIVO",
      habilidades: usuario.armador ? usuario.armador.habilidades.join(", ") : "",
      nuevaContrasena: "",
    });
    setEditingError(null);
    setEditingSuccess(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingUser(null);
    setEditingState(null);
    setEditingError(null);
    setEditingSuccess(null);
  }, []);

  const updateUsuarioEnEstado = useCallback((actualizado: UsuarioItem) => {
    setUsuarios((prev) =>
      prev.map((usuario) => (usuario.id === actualizado.id ? actualizado : usuario))
    );
  }, []);

  const handleToggleActivo = useCallback(
    async (usuario: UsuarioItem) => {
      try {
        setTogglingUserId(usuario.id);
        const response = await fetch(`/api/usuarios/${usuario.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activo: !usuario.activo }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "No se pudo actualizar el estado");
        }

        const usuarioActualizado = mapUsuarioFromApi(data?.usuario);
        if (usuarioActualizado) {
          updateUsuarioEnEstado(usuarioActualizado);
          if (editingUser && editingUser.id === usuarioActualizado.id) {
            setEditingUser(usuarioActualizado);
          }

          toast({
            title: usuarioActualizado.activo ? "Usuario activado" : "Usuario desactivado",
            description: `${usuarioActualizado.nombre} ha sido ${
              usuarioActualizado.activo ? "activado" : "desactivado"
            }.`,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error inesperado al actualizar";
        toast({
          title: "Error al actualizar usuario",
          description: message,
          variant: "destructive",
        });
      } finally {
        setTogglingUserId(null);
      }
    },
    [editingUser, mapUsuarioFromApi, updateUsuarioEnEstado]
  );

  const handleEditSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!editingUser || !editingState) return;

      setIsEditing(true);
      setEditingError(null);
      setEditingSuccess(null);
      setEditFieldErrors({});

      try {
        const toValidate: any = {
          nombre: editingState.nombre,
          email: editingState.email,
          telefono: editingState.telefono || "",
          rol: editingState.rol,
          estadoArmador:
            editingState.rol === "ARMADOR" ? editingState.estadoArmador : undefined,
          habilidades: editingState.habilidades,
        };

        if (editingState.nuevaContrasena.trim()) {
          toValidate.password = editingState.nuevaContrasena;
        }

        const validation = actualizarUsuarioSchema.safeParse(toValidate);

        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.errors.forEach((err) => {
            const field = err.path[0];
            if (typeof field === "string" && !fieldErrors[field]) {
              fieldErrors[field] = err.message;
            }
          });

          const orderedFields = [
            "nombre",
            "email",
            "password",
            "telefono",
            "rol",
            "estadoArmador",
            "habilidades",
          ];
          const firstErrorField =
            orderedFields.find((name) => fieldErrors[name]) ||
            Object.keys(fieldErrors)[0];

          if (firstErrorField) {
            scrollToEditField(firstErrorField);
          }

          setEditFieldErrors(fieldErrors);
          setIsEditing(false);
          return;
        }

        const payload: Record<string, unknown> = {
          nombre: editingState.nombre.trim(),
          email: editingState.email.trim().toLowerCase(),
          rol: editingState.rol,
        };

        const telefonoLimpio = editingState.telefono.trim();
        payload.telefono = telefonoLimpio.length > 0 ? telefonoLimpio : null;

        const nuevaPassLimpia = editingState.nuevaContrasena.trim();
        if (nuevaPassLimpia.length > 0) {
          payload.password = nuevaPassLimpia;
        }

        if (editingState.rol === "ARMADOR") {
          payload.estadoArmador = editingState.estadoArmador;
          const habilidadesLimpias = editingState.habilidades
            .split(",")
            .map((habilidad) => habilidad.trim())
            .filter((habilidad) => habilidad.length > 0);
          payload.habilidades = habilidadesLimpias;
        }

        const response = await fetch(`/api/usuarios/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
          const zodErrors =
            data?.detalles?.fieldErrors &&
            Object.values(data.detalles.fieldErrors)
              .flat()
              .filter((msg: unknown): msg is string => typeof msg === "string");

          const message =
            zodErrors && zodErrors.length > 0
              ? zodErrors.join(" ")
              : data?.error || "Error al actualizar usuario";

          throw new Error(message);
        }

        const usuarioActualizado = mapUsuarioFromApi(data?.usuario);
        if (usuarioActualizado) {
          updateUsuarioEnEstado(usuarioActualizado);
          setEditingUser(usuarioActualizado);
          setEditingSuccess("Usuario actualizado correctamente.");
          toast({
            title: "Usuario actualizado",
            description: `Los cambios de ${usuarioActualizado.nombre} han sido guardados.`,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error inesperado al actualizar";
        setEditingError(message);
        toast({
          title: "Error al actualizar usuario",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsEditing(false);
      }
    },
    [editingState, editingUser, mapUsuarioFromApi, updateUsuarioEnEstado]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Crear nuevo usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo *</Label>
              <Input
                id="nombre"
                value={formState.nombre}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, nombre: event.target.value }))
                }
                required
                disabled={isSubmitting}
                className={
                  formFieldErrors.nombre
                    ? "border-destructive focus-visible:ring-destructive"
                    : undefined
                }
              />
              {formFieldErrors.nombre ? (
                <p className="text-sm text-destructive">{formFieldErrors.nombre}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, email: event.target.value }))
                }
                required
                disabled={isSubmitting}
                className={
                  formFieldErrors.email
                    ? "border-destructive focus-visible:ring-destructive"
                    : undefined
                }
              />
              {formFieldErrors.email ? (
                <p className="text-sm text-destructive">{formFieldErrors.email}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formState.telefono}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, telefono: event.target.value }))
                }
                placeholder="Ej: 7000-0000"
                disabled={isSubmitting}
                className={
                  formFieldErrors.telefono
                    ? "border-destructive focus-visible:ring-destructive"
                    : undefined
                }
              />
              {formFieldErrors.telefono ? (
                <p className="text-sm text-destructive">{formFieldErrors.telefono}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña temporal *</Label>
              <Input
                id="password"
                type="password"
                value={formState.password}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, password: event.target.value }))
                }
                required
                disabled={isSubmitting}
                minLength={6}
                className={
                  formFieldErrors.password
                    ? "border-destructive focus-visible:ring-destructive"
                    : undefined
                }
              />
              <p className="text-xs text-gray-500">
                Comparte esta contraseña con el usuario para su primer ingreso.
              </p>
              <ul className="mt-1 space-y-0.5 text-xs">
                <li
                  className={
                    createPasswordChecks.length ? "text-emerald-700" : "text-gray-500"
                  }
                >
                  • Mínimo 8 caracteres
                </li>
                <li
                  className={
                    createPasswordChecks.upper ? "text-emerald-700" : "text-gray-500"
                  }
                >
                  • Al menos una mayúscula (A-Z)
                </li>
                <li
                  className={
                    createPasswordChecks.lower ? "text-emerald-700" : "text-gray-500"
                  }
                >
                  • Al menos una minúscula (a-z)
                </li>
                <li
                  className={
                    createPasswordChecks.number ? "text-emerald-700" : "text-gray-500"
                  }
                >
                  • Al menos un número (0-9)
                </li>
                <li
                  className={
                    createPasswordChecks.symbol ? "text-emerald-700" : "text-gray-500"
                  }
                >
                  • Al menos un símbolo (por ejemplo !, @, #)
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">Rol *</Label>
              <select
                id="rol"
                value={formState.rol}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    rol: event.target.value as RolPermitido,
                  }))
                }
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-vibrant-cyan focus:outline-none"
              >
                {ROLES.map((rol) => (
                  <option key={rol.value} value={rol.value}>
                    {rol.label}
                  </option>
                ))}
              </select>
            </div>

            {formState.rol === "ARMADOR" ? (
              <div className="space-y-4 rounded-md border border-gray-200 p-4">
                <div className="space-y-2">
                  <Label htmlFor="estadoArmador">Estado inicial</Label>
                  <select
                    id="estadoArmador"
                    value={formState.estadoArmador}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        estadoArmador: event.target.value as EstadoArmadorPermitido,
                      }))
                    }
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-vibrant-cyan focus:outline-none"
                  >
                    {ESTADOS_ARMADOR.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado.charAt(0) + estado.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="habilidades">Habilidades (opcional)</Label>
                  <Input
                    id="habilidades"
                    value={formState.habilidades}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        habilidades: event.target.value,
                      }))
                    }
                    placeholder="Ej: Muebles grandes, Instalaciones eléctricas"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">
                    Separa cada habilidad con coma. Se usarán como referencia en asignación.
                  </p>
                </div>
              </div>
            ) : null}

            {formError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            ) : null}
            {formSuccess ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {formSuccess}
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full bg-vibrant-cyan hover:bg-vibrant-cyan/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creando usuario..." : "Crear usuario"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Usuarios registrados</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="filtroRol" className="text-xs uppercase text-gray-500">
                Filtrar por rol
              </Label>
              <select
                id="filtroRol"
                value={filterRol}
                onChange={(event) =>
                  setFilterRol(event.target.value as "ALL" | RolPermitido)
                }
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-vibrant-cyan focus:outline-none"
              >
                <option value="ALL">Todos</option>
                {ROLES.map((rol) => (
                  <option key={rol.value} value={rol.value}>
                    {rol.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {listError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {listError}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuariosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      {listLoading ? "Cargando usuarios..." : "No hay usuarios registrados."}
                    </TableCell>
                  </TableRow>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="align-top">
                        <div className="font-medium text-gray-900">{usuario.nombre}</div>
                        {usuario.telefono ? (
                          <div className="text-xs text-gray-500">{usuario.telefono}</div>
                        ) : null}
                        {usuario.armador ? (
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-semibold">Armador:</span> {usuario.armador.estado}
                            {usuario.armador.habilidades.length > 0 ? (
                              <span>
                                {" "}- {usuario.armador.habilidades.join(", ")}
                              </span>
                            ) : null}
                            <span className="block text-[11px] text-gray-400">
                              Órdenes activas: {usuario.armador.ordenesActivas}
                            </span>
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="text-sm text-gray-700">{usuario.email}</div>
                      </TableCell>
                      <TableCell className="align-top">
                        <span className="rounded-full bg-electric-coral/10 px-2 py-1 text-xs font-medium uppercase text-electric-coral">
                          {usuario.rol}
                        </span>
                      </TableCell>
                      <TableCell className="align-top">
                        {usuario.activo ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                            Activo
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600">
                            Inactivo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-sm text-gray-600">
                        {new Date(usuario.createdAt).toLocaleDateString("es-SV", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditUser(usuario)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant={usuario.activo ? "ghost" : "secondary"}
                            onClick={() => handleToggleActivo(usuario)}
                            disabled={togglingUserId === usuario.id}
                          >
                            {togglingUserId === usuario.id
                              ? "Guardando..."
                              : usuario.activo
                              ? "Inactivar"
                              : "Activar"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {editingUser && editingState ? (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Editar usuario: {editingUser.nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-nombre">Nombre completo</Label>
                  <Input
                    id="edit-nombre"
                    value={editingState.nombre}
                    onChange={(event) =>
                      setEditingState((prev) =>
                        prev ? { ...prev, nombre: event.target.value } : prev
                      )
                    }
                    disabled={isEditing}
                    className={
                      editFieldErrors.nombre
                        ? "border-destructive focus-visible:ring-destructive"
                        : undefined
                    }
                  />
                  {editFieldErrors.nombre ? (
                    <p className="text-sm text-destructive">{editFieldErrors.nombre}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">Nueva contraseña (opcional)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={editingState.nuevaContrasena}
                    onChange={(event) =>
                      setEditingState((prev) =>
                        prev ? { ...prev, nuevaContrasena: event.target.value } : prev,
                      )
                    }
                    disabled={isEditing}
                    placeholder="Dejar vacío para no cambiar"
                    className={
                      editFieldErrors.password
                        ? "border-destructive focus-visible:ring-destructive"
                        : undefined
                    }
                  />
                  {editPasswordChecks ? (
                    <ul className="mt-1 space-y-0.5 text-xs">
                      <li
                        className={
                          editPasswordChecks.length
                            ? "text-emerald-700"
                            : "text-gray-500"
                        }
                      >
                        • Mínimo 8 caracteres
                      </li>
                      <li
                        className={
                          editPasswordChecks.upper
                            ? "text-emerald-700"
                            : "text-gray-500"
                        }
                      >
                        • Al menos una mayúscula (A-Z)
                      </li>
                      <li
                        className={
                          editPasswordChecks.lower
                            ? "text-emerald-700"
                            : "text-gray-500"
                        }
                      >
                        • Al menos una minúscula (a-z)
                      </li>
                      <li
                        className={
                          editPasswordChecks.number
                            ? "text-emerald-700"
                            : "text-gray-500"
                        }
                      >
                        • Al menos un número (0-9)
                      </li>
                      <li
                        className={
                          editPasswordChecks.symbol
                            ? "text-emerald-700"
                            : "text-gray-500"
                        }
                      >
                        • Al menos un símbolo (por ejemplo !, @, #)
                      </li>
                    </ul>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Correo electrónico</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingState.email}
                    onChange={(event) =>
                      setEditingState((prev) =>
                        prev ? { ...prev, email: event.target.value } : prev
                      )
                    }
                    disabled={isEditing}
                    className={
                      editFieldErrors.email
                        ? "border-destructive focus-visible:ring-destructive"
                        : undefined
                    }
                  />
                  {editFieldErrors.email ? (
                    <p className="text-sm text-destructive">{editFieldErrors.email}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-telefono">Teléfono</Label>
                  <Input
                    id="edit-telefono"
                    value={editingState.telefono}
                    onChange={(event) =>
                      setEditingState((prev) =>
                        prev ? { ...prev, telefono: event.target.value } : prev
                      )
                    }
                    disabled={isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-rol">Rol</Label>
                  <select
                    id="edit-rol"
                    value={editingState.rol}
                    onChange={(event) =>
                      setEditingState((prev) =>
                        prev
                          ? { ...prev, rol: event.target.value as RolPermitido }
                          : prev
                      )
                    }
                    disabled={isEditing}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-vibrant-cyan focus:outline-none"
                  >
                    {ROLES.map((rol) => (
                      <option key={rol.value} value={rol.value}>
                        {rol.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editingState.rol === "ARMADOR" ? (
                <div className="space-y-3 rounded-md border border-gray-200 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-estado-armador">Estado del armador</Label>
                    <select
                      id="edit-estado-armador"
                      value={editingState.estadoArmador}
                      onChange={(event) =>
                        setEditingState((prev) =>
                          prev
                            ? {
                                ...prev,
                                estadoArmador: event.target.value as EstadoArmadorPermitido,
                              }
                            : prev
                        )
                      }
                      disabled={isEditing}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-vibrant-cyan focus:outline-none"
                    >
                      {ESTADOS_ARMADOR.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado.charAt(0) + estado.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-habilidades">Habilidades</Label>
                    <Input
                      id="edit-habilidades"
                      value={editingState.habilidades}
                      onChange={(event) =>
                        setEditingState((prev) =>
                          prev ? { ...prev, habilidades: event.target.value } : prev
                        )
                      }
                      disabled={isEditing}
                      placeholder="Ej: Muebles grandes, Instalaciones eléctricas"
                    />
                    <p className="text-xs text-gray-500">
                      Separa cada habilidad con coma.
                    </p>
                  </div>
                </div>
              ) : null}

              {editingError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {editingError}
                </div>
              ) : null}
              {editingSuccess ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {editingSuccess}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isEditing}>
                  {isEditing ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancelEdit}
                  disabled={isEditing}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
