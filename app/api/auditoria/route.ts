import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAuditLogs, exportAuditLogsToCSV } from "@/lib/audit-logger";

// GET - Obtener logs de auditoría con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    const userId = searchParams.get("userId") || undefined;
    const action = searchParams.get("action") as any;
    const resource = searchParams.get("resource") as any;
    const resourceId = searchParams.get("resourceId") || undefined;
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate") 
      ? new Date(searchParams.get("startDate")!) 
      : undefined;
    const endDate = searchParams.get("endDate") 
      ? new Date(searchParams.get("endDate")!) 
      : undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const export_format = searchParams.get("export");

    const result = await getAuditLogs({
      userId,
      action,
      resource,
      resourceId,
      status,
      startDate,
      endDate,
      limit,
      offset,
    });

    // Si se solicita exportación a CSV
    if (export_format === "csv") {
      const csv = exportAuditLogsToCSV(result.logs);
      
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error obteniendo logs de auditoría:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
