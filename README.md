# Cursiva

App universitaria en español. React + Vite, API Node.js/Express y Supabase (Postgres y Auth).

**Versión actualizada:** ver `ACTUALIZACION.md` para instalar colores personalizados, PDFs privados, recordatorios por correo y Google Calendar. Sobre una base existente, aplicar únicamente `supabase/migrations/002_colors_pdfs_reminders.sql`.

## Iniciar

1. `npm install`
2. Copiar `.env.example` a `.env` y completar la clave publicable.
3. Para una base nueva, ejecutar `supabase/schema.sql` y después `supabase/migrations/002_colors_pdfs_reminders.sql` en el SQL Editor. Sobre una base Cursiva existente, ejecutar sólo la migración 002.
4. En Supabase Auth, habilitar email/password y configurar Site URL y Redirect URLs para el dominio de la app y `http://127.0.0.1:5173`.
5. `npm run server` y, en otra terminal, `npm run dev`.

Para usar el backend Node, configurar `VITE_API_URL=http://127.0.0.1:3001`. Reiniciar Vite al cambiar variables. Sin esa variable, la app utiliza el cliente oficial de Supabase directamente, manteniendo las mismas políticas RLS. La versión alojada en Sites publica el frontend y usa esta conexión directa; el servidor Express requiere alojamiento Node independiente para habilitarlo allí.

## Funciones

- Registro e inicio de sesión con Supabase; confirmación de email según configuración del proyecto.
- Perfil inicial: nombre, carrera, institución, duración y año actual.
- Plan por años, estado de materia, profesor y horario.
- Parciales, TP, actividades, finales y recuperatorios con fecha, temas, nota y resultado.
- Avance ponderado: pesos aprobados/completados dividido por pesos totales. No mide contenidos vistos ni calcula automáticamente la nota final.
- Recuperatorios vinculados al original. Por defecto peso cero; actualizar la evaluación original al aprobar para no duplicar el avance.
- Apuntes de texto, enlaces y varios PDFs privados por apunte (hasta 10 MB cada uno).
- Colores personalizados y acciones con texto en celular.
- Recordatorios por email el día anterior y suscripción de calendario: requieren configuración de servidor descrita en `ACTUALIZACION.md`.
- Calendario, filtros, búsqueda y respaldo JSON.
- Demo separada que persiste sólo en localStorage. No se importa a cuentas reales.

## Seguridad y estado

La clave publicable no es una clave administrativa. RLS restringe las tablas de estudiantes al propietario autenticado. Las relaciones compuestas impiden enlazar notas/evaluaciones con materias de otros usuarios. La API de datos verifica el JWT con Supabase y usa el mismo token para conservar RLS. Los trabajos de recordatorio, limpieza de archivos y suscripción requieren una clave administrativa sólo en el servidor; no está incluida en el código ni en el frontend.

La migración no se aplicó automáticamente: la clave publicable no autoriza SQL/DDL. Hasta que se ejecute y se verifique con dos cuentas, el aislamiento en la base queda pendiente de validación en el proyecto real. La demo funciona sin tablas.

Eliminar una materia borra sus evaluaciones y apuntes, tras confirmación. Si una evaluación tiene recuperatorios vinculados, eliminar primero los recuperatorios antes de eliminar el original.

## Verificar y compilar

`npm test` verifica el cálculo de avance. `npm run build` crea `dist/`.

En producción Node configurar `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ALLOWED_ORIGIN` y `PORT`. El frontend recibe `VITE_API_URL` durante el build. La clave publicable y URL incluidas son las provistas para este proyecto; pueden reemplazarse con variables Vite.
