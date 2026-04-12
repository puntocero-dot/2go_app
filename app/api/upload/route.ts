import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { withRateLimit } from "@/lib/api-helpers";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { UploadMetadataSchema, validateImageFile } from "@/lib/schemas/upload.schemas";
import { logAuditFromSession } from "@/lib/audit-logger";

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST - Subir imagen a Cloudinary
const uploadHandler = async (request: NextRequest) => {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    const folderRaw = formData.get("folder");
    const fileName = file?.name;

    const metadataResult = UploadMetadataSchema.safeParse({
      folder: typeof folderRaw === "string" ? folderRaw : undefined,
      fileName,
    });

    if (!metadataResult.success) {
      return NextResponse.json(
        { error: "Metadatos de archivo inválidos" },
        { status: 400 }
      );
    }

    const folder = metadataResult.data.folder ?? "armados2go";

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    // Validar archivo con helper
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a Cloudinary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "image",
          transformation: [
            { width: 800, height: 800, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    // Auditar upload (session ya fue verificado arriba)
    await logAuditFromSession({
      session: session!,
      action: "UPLOAD_FILE",
      resource: "archivo",
      resourceId: result.public_id,
      changes: {
        after: {
          url: result.secure_url,
          folder,
          size: file.size,
          type: file.type,
        },
      },
      request,
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error) {
    console.error("Error subiendo archivo:", error);
    return NextResponse.json(
      { error: "Error al subir el archivo" },
      { status: 500 }
    );
  }
};

// Exportar con rate limiting
export const POST = withRateLimit(
  uploadHandler,
  RATE_LIMITS.UPLOAD,
  (request) => {
    // Key: userId (necesitamos extraerlo del session)
    // Por ahora usamos IP como fallback
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return `upload:${ip}`;
  }
);

// DELETE - Eliminar imagen de Cloudinary
const deleteHandler = async (request: NextRequest) => {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return NextResponse.json(
        { error: "No se proporcionó publicId" },
        { status: 400 }
      );
    }

    // Eliminar de Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    await logAuditFromSession({
      session,
      action: "DELETE_FILE",
      resource: "archivo",
      resourceId: publicId,
      changes: {
        before: {
          publicId,
        },
        after: {
          result,
        },
      },
      request,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error eliminando archivo:", error);
    return NextResponse.json(
      { error: "Error al eliminar el archivo" },
      { status: 500 }
    );
  }
};

export const DELETE = withRateLimit(
  deleteHandler,
  RATE_LIMITS.UPLOAD,
  (request) => {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return `upload-delete:${ip}`;
  }
);
