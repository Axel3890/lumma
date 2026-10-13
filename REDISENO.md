# Rediseño de Cursiva

Esta versión adapta la interfaz a la referencia visual enviada: navegación superior flotante, tarjetas translúcidas, fondo suave salvia/lavanda y una composición de tarjetas de distintos tamaños.

## Qué cambió

- Navegación superior a Mi espacio, Mi carrera, Evaluaciones, Mis apuntes y Configuración.
- Inicio: carrera y estadísticas, materia destacada, acceso directo a apuntes y agenda.
- Si hay varias materias en curso, las flechas de la tarjeta destacada permiten recorrerlas. La primera prioriza la materia de la evaluación pendiente más cercana cuando está en curso.
- La interfaz utiliza los datos reales de la cuenta; la imagen no se usa como fondo ni se incorporan sus datos como contenido fijo.
- Materias, evaluaciones, apuntes, configuración, acceso y formularios comparten el nuevo tratamiento visual.
- En celular las tarjetas se apilan, el menú se despliega y las acciones conservan sus etiquetas de texto.
- Se conservan los colores personalizados y las funciones de PDFs, recordatorios y calendario de la versión anterior.
- La interfaz respeta la preferencia de movimiento reducido.

## Aplicación

Conservar el `.env` propio y actualizar el código. Ejecutar `npm run dev` para desarrollo o `npm run build` para compilar. Este rediseño no cambia la base de datos ni necesita una nueva migración. La configuración pendiente de las integraciones sigue documentada en `ACTUALIZACION.md`.

Los cambios visuales están en `src/Dashboard.jsx`, `src/design.css` y la navegación de `src/main.jsx`. El CSS nuevo se carga después de los estilos existentes para preservar el comportamiento de los componentes.

## Verificación

Build de producción y pruebas locales aprobadas. La herramienta de navegador del entorno falló al iniciarse; quedó pendiente la revisión visual en un navegador real. No se publicó en Sites.
