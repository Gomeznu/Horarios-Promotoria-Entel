# Tablero de rutas · PayJoy

Organizador semanal de rutas de supervisores y turnos de promotores, con
generación automática de la pre-carga ZOHO y del directorio.

## Qué hace

**Vista pública** — cualquiera con el enlace ve tres pestañas de solo lectura:
Supervisores, Puntos de venta y Directorio. No expone DNI.

**Vista administrador** — protegida por clave. Suma las pestañas de Cobertura,
Cargar semana, Pre-carga ZOHO y Exportar mes.

Cuando el administrador carga el Excel de la semana, los datos se guardan en el
servidor y la vista pública se actualiza sola. No hay que republicar el sitio.

## Publicar por primera vez

Este proyecto tiene funciones serverless, así que **no funciona arrastrándolo**
a Netlify: hace falta que Netlify lo construya. Dos caminos.

### Opción A · GitHub (recomendado)

1. Crea un repositorio y sube el contenido de esta carpeta.
2. En Netlify: Add new project > Import an existing project > GitHub.
3. Elige el repo. Netlify lee `netlify.toml`, no hay que configurar nada.
4. Deploy.

Después, cada mejora es un `git push` y Netlify republica solo.

### Opción B · Netlify CLI

    npm install -g netlify-cli
    netlify login
    cd tablero-rutas-payjoy
    netlify link          # elegir el proyecto tablero-rutas-payjoy
    netlify deploy --build --prod

## Configurar la clave (obligatorio)

Sin esto el login no funciona.

1. Netlify > Project configuration > Environment variables.
2. Add a variable:
   - Key: `CLAVE_ADMIN`
   - Value: la clave que quieras
   - Scopes: Functions
3. Vuelve a desplegar para que la variable tome efecto.

Para cambiar la clave, edita la variable y redespliega.

## Abrir el acceso público

El proyecto se creó con login de equipo Netlify obligatorio, así que hoy solo
entran miembros del equipo. Para que funcione con solo el enlace:

Project configuration > Access & security > Visitor access > desactivar el
requisito de SSO.

## Estructura

    public/index.html            El tablero completo
    public/_headers              Cabeceras de seguridad
    netlify/functions/publico.mjs  GET /api/publico   datos sin DNI, sin clave
    netlify/functions/admin.mjs    /api/admin         login, leer y guardar
    netlify.toml                 Configuración de build
    package.json                 Dependencia @netlify/blobs

## Cómo se guardan los datos

En Netlify Blobs, en un store llamado `rutas`, bajo la clave `acumulado`.
Los Excel nunca se suben: se procesan en el navegador y solo viaja el JSON
resultante.

## Rutina semanal

1. Entra al sitio y pulsa Ingresar.
2. Pestaña Cargar semana, arrastra el Excel de rutas.
3. Listo. La vista pública ya muestra la semana nueva.
4. Cuando lo necesites, descarga la pre-carga ZOHO y el directorio.

La plantilla del directorio se sube una sola vez, en la pestaña Directorio,
y se reemplaza solo cuando cambie.
