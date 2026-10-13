# Actualización: colores, celular, PDFs y recordatorios

## Aplicar sobre una instalación existente

1. Hacé un respaldo de tu proyecto. Copiá los archivos de esta versión conservando tu `.env` local.
2. En Supabase → SQL Editor ejecutá **`supabase/migrations/002_colors_pdfs_reminders.sql`**. No vuelvas a ejecutar `schema.sql` si ya tenés tablas y usuarios.
3. Reiniciá Vite y Node. No se agregaron dependencias nuevas.

Para una base nueva: ejecutar primero `schema.sql` y después la migración 002.

## Colores y celular

El editor de materias tiene selector nativo de color y entrada HEX. Las materias existentes mantienen sus colores. Se usa una variante clara del color elegido en fondos para conservar la legibilidad. Los botones principales muestran texto y ocupan el ancho disponible en celular; ya no se ocultan los nombres de las acciones.

## PDFs privados

Abrí un apunte guardado → Elegir PDFs. Acepta varios archivos, hasta 10 MB cada uno. Cada PDF se guarda en el bucket privado `note-pdfs`, en la carpeta del propietario y del apunte. Apertura con URL firmada válida durante cinco minutos; el enlace no se guarda públicamente. La app valida extensión, tamaño y cabecera `%PDF-`; el bucket restringe MIME y tamaño.

Los adjuntos se cargan o quitan inmediatamente, independientemente de los cambios de texto todavía sin guardar. Guardar un apunte nuevo deja el editor abierto para adjuntar archivos. En demo los archivos sólo existen mientras está abierto ese editor.

Al borrar un apunte o materia, un trigger encola la limpieza de sus archivos. El servidor elimina los objetos a través de Storage API. Debe estar activo con `SUPABASE_SERVICE_ROLE_KEY` para procesar esta cola. Un cierre abrupto justo después de subir un objeto y antes de guardar su registro puede dejar un objeto huérfano; revisar Storage periódicamente. No se borran objetos de otros usuarios para resolver errores.

## Correos un día antes

En cada evaluación: **Recordarme por correo el día anterior**. En el perfil: zona horaria IANA; predeterminada Argentina. Las evaluaciones existentes quedan desactivadas; las nuevas muestran la opción marcada. Se envía al correo confirmado de la cuenta a partir de las 09:00 del día anterior. Si se carga después de esa hora, entra en el próximo ciclo de cinco minutos. No se envía si está aprobada/completada, si se desactiva o si ya pasó el día anterior. No equivale a exactamente 24 horas antes porque las evaluaciones no tienen hora.

Configurar únicamente en el backend:

```env
SUPABASE_SERVICE_ROLE_KEY=clave_administrativa_solo_del_servidor
RESEND_API_KEY=clave_de_resend
REMINDER_FROM=Cursiva <avisos@tu-dominio-verificado.com>
REMINDERS_ENABLED=true
```

Crear/verificar el dominio remitente en Resend. La clave publicable de Supabase no alcanza para este trabajo administrativo. Ninguno de estos secretos debe llevar prefijo `VITE_` ni incluirse en el frontend.

El proceso Node debe mantenerse activo (hosting con proceso persistente). Un frontend Vite solo, una laptop apagada o un servidor suspendido no envían recordatorios. El servidor consulta cada cinco minutos; usa registros de envío, una reserva atómica de dos minutos y claves de idempotencia de Resend para evitar duplicados. Reintenta hasta ocho veces durante el día anterior. Un payload enviado al proveedor se mantiene idéntico en reintentos. No garantiza entrega en bandeja de entrada: revisar el estado en Resend. No se enviaron correos reales durante la implementación.

## Google Calendar

- Cada evaluación tiene **Agregar a Google Calendar**. Abre un evento para que el usuario revise y guarde. Esa copia es independiente; no se actualiza si cambia Cursiva.
- Configuración → Google Calendar → **Descargar calendario (.ics)**. Es una exportación estática importable en Google, Apple u Outlook.
- **Activar enlace privado** crea una suscripción de Cursiva hacia Google. Configurar `VITE_API_URL` en el frontend y `PUBLIC_API_URL=https://tu-api.example.com` junto con `SUPABASE_SERVICE_ROLE_KEY` en Node. Se necesita un backend HTTPS público accesible por Google. `HOST=0.0.0.0` en el hosting si corresponde.
- Google Calendar web → Otros calendarios → + → Desde URL → pegar el enlace. Google decide la frecuencia de actualización. No hay sincronización inversa de Google a Cursiva.
- El enlace es una credencial de lectura de las evaluaciones. Se muestra una vez al generarlo y sólo se guarda su hash en la base. Renovarlo invalida el enlace anterior; revocarlo detiene lecturas futuras, pero Google puede conservar datos ya descargados. Si se pierde, renovarlo y actualizar la suscripción en Google.

## Verificación

`npm test` usa pruebas locales y mocks: no envía emails, no sube archivos ni conecta un calendario real. `npm run build` compila el frontend. Pendiente de probar en el proyecto real después de aplicar SQL: subir/abrir/borrar PDFs con dos cuentas distintas, ejecutar el job con un remitente verificado y suscribir el feed desde Google.

Documentación consultada:
- https://supabase.com/docs/guides/storage/buckets/fundamentals
- https://supabase.com/docs/guides/storage/security/access-control
- https://resend.com/changelog/idempotency-keys
- https://support.google.com/calendar/answer/37100?hl=es
- https://support.google.com/calendar/answer/37118?hl=es
