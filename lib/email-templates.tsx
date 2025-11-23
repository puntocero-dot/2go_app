import type { BillingDataset } from "@/lib/facturacion-data";

type DatosFacturacion = {
  contacto?: {
    nombre?: string;
    email?: string;
    telefono?: string;
  };
  razonSocial?: string;
  nombreCompleto?: string;
  direccion?: string;
};

// Template moderno para correo de facturación
export function generateBillingEmailHTML(dataset: BillingDataset, datos: DatosFacturacion): string {
  const totalFacturado = dataset.totalsByConcept.armado + 
                        dataset.totalsByConcept.tamano + 
                        dataset.totalsByConcept.distancia + 
                        dataset.totalsByConcept.penalizacion + 
                        dataset.totalsByConcept.prioridad;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facturación ${dataset.proyecto.nombreComercial}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .header {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 30px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        
        .logo {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            font-weight: bold;
            font-size: 24px;
            color: #667eea;
        }
        
        .header h1 {
            color: white;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
        }
        
        .content {
            background: white;
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            color: #1e293b;
            margin-bottom: 20px;
        }
        
        .greeting strong {
            color: #667eea;
        }
        
        .info-box {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-left: 4px solid #667eea;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .info-box p {
            color: #475569;
            font-size: 15px;
        }
        
        .info-box strong {
            color: #1e293b;
        }
        
        .billing-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 30px 0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.07);
        }
        
        .billing-table th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .billing-table td {
            padding: 16px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 15px;
        }
        
        .billing-table tr:last-child td {
            border-bottom: none;
        }
        
        .billing-table tr:hover {
            background-color: #f8fafc;
        }
        
        .concept-name {
            font-weight: 600;
            color: #374151;
        }
        
        .amount {
            text-align: right;
            font-weight: 700;
            color: #059669;
            font-size: 16px;
        }
        
        .total-row {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        }
        
        .total-row td {
            font-weight: 700;
            color: #1e293b;
            font-size: 18px;
            padding: 20px 16px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            border: 1px solid #fbbf24;
        }
        
        .stat-card.orders {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border-color: #3b82f6;
        }
        
        .stat-card.amount {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border-color: #10b981;
        }
        
        .stat-number {
            font-size: 32px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
        }
        
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .footer .company-info {
            font-size: 13px;
            color: #9ca3af;
        }
        
        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        
        .action-button:hover {
            transform: translateY(-2px);
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 12px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .billing-table {
                font-size: 14px;
            }
            
            .billing-table th,
            .billing-table td {
                padding: 12px 8px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">2Go</div>
            <h1>📊 Resumen de Facturación</h1>
            <p>${dataset.proyecto.nombreComercial} • ${dataset.periodoLabel}</p>
        </div>
        
        <div class="content">
            <p class="greeting">
                Estimado(a) <strong>${datos.contacto?.nombre || "cliente"}</strong>,
            </p>
            
            <div class="info-box">
                <p>
                    Nos complace enviarle el resumen de facturación correspondiente al proyecto 
                    <strong> ${dataset.proyecto.nombreComercial}</strong> para el período 
                    <strong> ${dataset.periodoLabel}</strong>.
                </p>
                <p style="margin-top: 10px;">
                    A continuación encontrará el desglose detallado de los conceptos facturados.
                </p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card orders">
                    <div class="stat-number">${dataset.ordenes.length}</div>
                    <div class="stat-label">Órdenes Procesadas</div>
                </div>
                <div class="stat-card amount">
                    <div class="stat-number">$${totalFacturado.toFixed(2)}</div>
                    <div class="stat-label">Total Facturado</div>
                </div>
            </div>
            
            <table class="billing-table">
                <thead>
                    <tr>
                        <th>Concepto</th>
                        <th style="text-align: right;">Monto</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="concept-name">📦 Armado</td>
                        <td class="amount">$${dataset.totalsByConcept.armado.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="concept-name">📏 Tamaño</td>
                        <td class="amount">$${dataset.totalsByConcept.tamano.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="concept-name">📍 Distancia</td>
                        <td class="amount">$${dataset.totalsByConcept.distancia.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="concept-name">⚠️ Penalización</td>
                        <td class="amount">$${dataset.totalsByConcept.penalizacion.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="concept-name">⚡ Prioridad</td>
                        <td class="amount">$${dataset.totalsByConcept.prioridad.toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td><strong>💰 TOTAL FACTURADO</strong></td>
                        <td class="amount"><strong>$${totalFacturado.toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>
            
            <p style="text-align: center; margin: 30px 0;">
                <strong>📎 Adjuntos encontrará:</strong><br>
                • Factura en formato PDF<br>
                • Detalle completo en formato CSV
            </p>
            
            <div style="text-align: center;">
                <a href="https://armados2go.com/admin" class="action-button">
                    🚀 Ver Dashboard Completo
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p>
                <strong>¿Preguntas sobre esta facturación?</strong><br>
                Contáctenos a través de nuestro portal o responda este correo.
            </p>
            <div class="company-info">
                <p>© 2024 Armados 2Go • Todos los derechos reservados</p>
                <p>Sistema de Gestión de Armados y Entregas</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Template para notificaciones de estado de orden
export function generateOrderStatusEmailHTML(
  orderCode: string,
  projectName: string,
  customerName: string,
  status: string,
  statusDescription: string,
  estimatedDelivery?: string
): string {
  const statusColors = {
    'ASIGNADO': { bg: '#dbeafe', text: '#1e40af', icon: '👤' },
    'EN_RUTA': { bg: '#fef3c7', text: '#92400e', icon: '🚚' },
    'ARMADO_INICIADO': { bg: '#e9d5ff', text: '#6b21a8', icon: '🔧' },
    'ARMADO_FINALIZADO': { bg: '#ccfbf1', text: '#065f46', icon: '✅' },
    'ARMADO_COMPLETADO': { bg: '#d1fae5', text: '#065f46', icon: '🎉' }
  };

  const statusStyle = statusColors[status as keyof typeof statusColors] || {
    bg: '#f3f4f6',
    text: '#374151',
    icon: '📋'
  };

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Actualización de Orden ${orderCode}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        }
        
        .logo {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            font-weight: bold;
            font-size: 24px;
            color: #667eea;
            position: relative;
            z-index: 1;
        }
        
        .header h1 {
            color: white;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
        }
        
        .header p {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
            position: relative;
            z-index: 1;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            color: #1e293b;
            margin-bottom: 20px;
        }
        
        .greeting strong {
            color: #667eea;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            background: ${statusStyle.bg};
            color: ${statusStyle.text};
            padding: 12px 20px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            border: 2px solid ${statusStyle.text}20;
        }
        
        .status-badge .icon {
            font-size: 20px;
            margin-right: 8px;
        }
        
        .order-info {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            border-left: 4px solid #667eea;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 15px;
        }
        
        .info-row:last-child {
            margin-bottom: 0;
        }
        
        .info-label {
            color: #6b7280;
            font-weight: 500;
        }
        
        .info-value {
            color: #1e293b;
            font-weight: 600;
        }
        
        .timeline {
            margin: 30px 0;
        }
        
        .timeline h3 {
            color: #1e293b;
            font-size: 18px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        .timeline h3::before {
            content: '📋';
            margin-right: 8px;
        }
        
        .timeline-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 20px;
            position: relative;
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 30px;
            bottom: -10px;
            width: 2px;
            background: #e2e8f0;
        }
        
        .timeline-item:last-child::before {
            display: none;
        }
        
        .timeline-dot {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: ${statusStyle.bg};
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .timeline-content {
            flex: 1;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .timeline-title {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 4px;
        }
        
        .timeline-time {
            font-size: 13px;
            color: #6b7280;
        }
        
        .delivery-info {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
            border: 1px solid #3b82f6;
        }
        
        .delivery-info h4 {
            color: #1e40af;
            font-size: 16px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
        }
        
        .delivery-info h4::before {
            content: '📅';
            margin-right: 8px;
        }
        
        .delivery-info p {
            color: #374151;
            font-size: 15px;
        }
        
        .action-buttons {
            display: flex;
            gap: 15px;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        
        .btn {
            flex: 1;
            min-width: 200px;
            padding: 14px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            text-align: center;
            transition: transform 0.2s;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-secondary {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .footer .help-text {
            font-size: 13px;
            color: #9ca3af;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 12px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .action-buttons {
                flex-direction: column;
            }
            
            .btn {
                min-width: auto;
            }
            
            .info-row {
                flex-direction: column;
                gap: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">2Go</div>
            <h1>📦 Actualización de tu Orden</h1>
            <p>Hay novedades sobre tu pedido</p>
        </div>
        
        <div class="content">
            <p class="greeting">
                Hola <strong>${customerName}</strong>,
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <div class="status-badge">
                    <span class="icon">${statusStyle.icon}</span>
                    ${statusDescription}
                </div>
            </div>
            
            <div class="order-info">
                <div class="info-row">
                    <span class="info-label">📋 Código de Orden:</span>
                    <span class="info-value">${orderCode}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">🏢 Proyecto:</span>
                    <span class="info-value">${projectName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">👤 Cliente:</span>
                    <span class="info-value">${customerName}</span>
                </div>
            </div>
            
            ${estimatedDelivery ? `
            <div class="delivery-info">
                <h4>Entrega Estimada</h4>
                <p>${estimatedDelivery}</p>
            </div>
            ` : ''}
            
            <div class="timeline">
                <h3>Estado Actual del Proceso</h3>
                <div class="timeline-item">
                    <div class="timeline-dot">
                        <span>${statusStyle.icon}</span>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-title">${statusDescription}</div>
                        <div class="timeline-time">Actualizado hace unos momentos</div>
                    </div>
                </div>
            </div>
            
            <div class="action-buttons">
                <a href="https://armados2go.com/cliente/orden/${orderCode}" class="btn btn-primary">
                    📊 Ver Detalles Completos
                </a>
                <a href="https://armados2go.com/soporte" class="btn btn-secondary">
                    💬 Contactar Soporte
                </a>
            </div>
            
            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
                Te mantendremos informado sobre cada paso de tu orden.
            </p>
        </div>
        
        <div class="footer">
            <p>
                <strong>¿Necesitas ayuda?</strong><br>
                Responde este correo o contáctanos a través de nuestro portal.
            </p>
            <div class="help-text">
                <p>© 2024 Armados 2Go • Sistema de Gestión de Entregas</p>
                <p>Este mensaje fue enviado automáticamente</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Template para notificaciones de sistema
export function generateSystemNotificationEmailHTML(
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            font-size: 28px;
        }
        
        .header h1 {
            color: white;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .notification-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #f59e0b;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            border: 1px solid #fbbf24;
        }
        
        .notification-box h3 {
            color: #92400e;
            font-size: 18px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }
        
        .notification-box h3::before {
            content: '⚠️';
            margin-right: 8px;
        }
        
        .notification-box p {
            color: #78350f;
            font-size: 15px;
            line-height: 1.7;
        }
        
        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 14px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        
        .action-button:hover {
            transform: translateY(-2px);
        }
        
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🔔</div>
            <h1>Notificación del Sistema</h1>
        </div>
        
        <div class="content">
            <div class="notification-box">
                <h3>${title}</h3>
                <p>${message}</p>
            </div>
            
            ${actionUrl ? `
            <div style="text-align: center;">
                <a href="${actionUrl}" class="action-button">
                    ${actionText || 'Ver Detalles'}
                </a>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>© 2024 Armados 2Go • Sistema de Gestión</p>
        </div>
    </div>
</body>
</html>`;
}
