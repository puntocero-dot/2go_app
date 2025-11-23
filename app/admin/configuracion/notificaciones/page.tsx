import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

export default function ConfiguracionNotificacionesPage() {
  const emailConfigurado = !!process.env.RESEND_API_KEY;
  const smsConfigurado = process.env.TWILIO_ENABLED === 'true';
  const whatsappConfigurado = process.env.TWILIO_WHATSAPP_ENABLED === 'true';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Notificaciones</h1>
        <p className="text-muted-foreground">
          Estado de los canales de notificación al cliente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">📧 Email</CardTitle>
              {emailConfigurado ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <XCircle className="text-red-500" />
              )}
            </div>
            <CardDescription>
              Via Resend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={emailConfigurado ? 'default' : 'destructive'}>
              {emailConfigurado ? 'Activo' : 'Inactivo'}
            </Badge>
            <p className="text-sm text-muted-foreground mt-3">
              {emailConfigurado 
                ? 'Los clientes recibirán emails automáticos al cambiar el estado de su orden.'
                : 'Configura RESEND_API_KEY en variables de entorno.'}
            </p>
          </CardContent>
        </Card>

        {/* SMS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">📱 SMS</CardTitle>
              {smsConfigurado ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <XCircle className="text-red-500" />
              )}
            </div>
            <CardDescription>
              Via Twilio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={smsConfigurado ? 'default' : 'secondary'}>
              {smsConfigurado ? 'Activo' : 'Opcional'}
            </Badge>
            <p className="text-sm text-muted-foreground mt-3">
              {smsConfigurado 
                ? 'SMS automáticos habilitados.'
                : 'Activa TWILIO_ENABLED=true y configura Twilio.'}
            </p>
          </CardContent>
        </Card>

        {/* WhatsApp */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">💬 WhatsApp</CardTitle>
              {whatsappConfigurado ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <XCircle className="text-red-500" />
              )}
            </div>
            <CardDescription>
              Via Twilio Business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={whatsappConfigurado ? 'default' : 'secondary'}>
              {whatsappConfigurado ? 'Activo' : 'Opcional'}
            </Badge>
            <p className="text-sm text-muted-foreground mt-3">
              {whatsappConfigurado 
                ? 'WhatsApp Business habilitado.'
                : 'Requiere Twilio WhatsApp Business aprobado.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Instrucciones de Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Email (Resend)</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Crea una cuenta en <a href="https://resend.com" target="_blank" className="text-blue-600 underline">resend.com</a></li>
              <li>Obtén tu API Key</li>
              <li>Agrega <code>RESEND_API_KEY=re_xxx</code> a tus variables de entorno</li>
              <li>Configura <code>RESEND_FROM_EMAIL=noreply@tudominio.com</code></li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">SMS (Twilio)</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Crea una cuenta en <a href="https://twilio.com" target="_blank" className="text-blue-600 underline">twilio.com</a></li>
              <li>Obtén Account SID y Auth Token</li>
              <li>Compra un número de teléfono</li>
              <li>Agrega las variables: <code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code>, <code>TWILIO_PHONE_NUMBER</code></li>
              <li>Activa con <code>TWILIO_ENABLED=true</code></li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">WhatsApp Business (Twilio)</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Requiere cuenta Twilio aprobada para WhatsApp Business</li>
              <li>Solicita aprobación de plantillas de mensaje</li>
              <li>Configura <code>TWILIO_WHATSAPP_NUMBER=whatsapp:+xxx</code></li>
              <li>Activa con <code>TWILIO_WHATSAPP_ENABLED=true</code></li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}