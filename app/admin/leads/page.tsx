import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MessageCircle, Calendar, Phone } from "lucide-react";
import { LeadEstadoSelect, ConvertirLeadButton } from "@/components/leads-table-actions";

function badgeVariantForEstado(estado: string | null) {
  switch (estado) {
    case "CONVERTIDO":
      return "default" as const;
    case "DESCARTADO":
      return "destructive" as const;
    case "CALIFICADO":
    case "CONTACTADO":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export default async function LeadsPage() {
  const session = await getSession();

  if (!session || session.rol !== "ADMIN") {
    redirect("/login");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.userId },
  });

  if (!usuario) {
    redirect("/login");
  }

  const leads = await prisma.proyecto.findMany({
    where: { esLead: true },
    orderBy: { createdAt: "desc" },
  });

  const hasLeads = leads.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navbar user={usuario} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 fade-in">
          <h1 className="text-4xl font-bold text-gradient mb-2 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-primary" />
            Leads de 2GoBot
          </h1>
          <p className="text-muted-foreground text-lg">
            Prospectos capturados por el asistente de la landing. Conviértelos en clientes
            cuando estén listos para operar.
          </p>
        </div>

        {hasLeads ? (
          <EnhancedCard hover>
            <div className="rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Negocio</TableHead>
                    <TableHead className="font-semibold">Contacto</TableHead>
                    <TableHead className="font-semibold">Notas</TableHead>
                    <TableHead className="font-semibold">Cita</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const contacto = lead.contactoLead as { nombre?: string; telefono?: string } | null;
                    return (
                      <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{lead.nombreComercial}</TableCell>
                        <TableCell>
                          <div className="text-sm">{contacto?.nombre ?? "—"}</div>
                          {contacto?.telefono && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {contacto.telefono}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {lead.notasLead ?? "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          {lead.citaProgramadaEn ? (
                            <div className="text-xs flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(lead.citaProgramadaEn).toLocaleString("es-SV", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin cita</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={badgeVariantForEstado(lead.estadoLead)}>
                              {lead.estadoLead ?? "NUEVO"}
                            </Badge>
                            <LeadEstadoSelect leadId={lead.id} estadoActual={lead.estadoLead} />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <ConvertirLeadButton leadId={lead.id} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </EnhancedCard>
        ) : (
          <EmptyState
            icon={<MessageCircle className="w-8 h-8 text-muted-foreground" />}
            title="Todavía no hay leads"
            description="Cuando alguien agende o deje sus datos con 2GoBot en la landing, aparecerá aquí."
          />
        )}
      </main>
    </div>
  );
}
