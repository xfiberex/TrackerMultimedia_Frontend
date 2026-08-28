# TrackerMultimedia

Aplicación para gestionar y descubrir anime, manga, manhwa y más contenido multimedia.
Conecta con la API de [Jikan](https://jikan.moe/) para búsquedas externas.

## Requisitos previos

- [Node.js](https://nodejs.org/) 20 o superior
- [.NET 10 SDK](https://dotnet.microsoft.com/download) — para el backend
- [Docker](https://www.docker.com/products/docker-desktop/) — la base de datos corre en un
  contenedor; **no hace falta instalar PostgreSQL en la máquina**
- [`dotnet-ef` tools](https://learn.microsoft.com/en-us/ef/core/cli/dotnet): `dotnet tool install --global dotnet-ef`

---

## Setup de desarrollo

### Backend

> El backend es un repositorio independiente (`TrackerMultimedia_Backend`). Lo que
> sigue es el resumen mínimo para levantarlo junto al frontend; la referencia
> completa y actualizada de secretos, migraciones y despliegue está en el `README.md`
> de ese repositorio. Si los dos textos se contradicen, manda el suyo.

Clónalo al lado de este y sitúate en él:

```bash
git clone <url-del-repositorio-backend>
cd TrackerMultimedia_Backend
```

#### 1. Levantar la base de datos

PostgreSQL corre en Docker, definido por el `docker-compose.yml` del repositorio del
backend. Copia `.env.example` a `.env`, pon una contraseña, y arranca:

```bash
cp .env.example .env         # y rellena POSTGRES_PASSWORD
docker compose up -d         # PostgreSQL en 127.0.0.1:5433
docker compose ps            # debe decir "healthy" antes de seguir
```

El puerto es el **5433**, no el 5432, para no chocar con una instalación nativa de
PostgreSQL. Los datos viven en un volumen con nombre: `docker compose down` los conserva y
`docker compose down -v` los borra.

#### 2. Configurar los secretos

Se guardan con `dotnet user-secrets`, fuera de la carpeta del repositorio, así que no pueden
acabar en un commit. **En PowerShell, comillas simples para los valores**: entre comillas
dobles, PowerShell expande lo que empiece por `$` y deja la clave vacía sin avisar.

```powershell
dotnet user-secrets init

# Base de datos: puerto y nombre los fija docker-compose.yml; la contraseña, tu .env
dotnet user-secrets set "ConnectionStrings:DefaultConnection" 'Host=localhost;Port=5433;Database=trackerMultimedia;Username=postgres;Password=<la-de-tu-.env>;'

# JWT, generado sin que aparezca en pantalla
$bytes = New-Object byte[] 48
(New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
dotnet user-secrets set "Jwt:Secret" ([Convert]::ToBase64String($bytes))
Remove-Variable bytes

# Correo y OAuth: solo si vas a usarlos. Sin ellos la aplicación funciona,
# pero no envía correos de confirmación ni permite entrar con Google o GitHub.
dotnet user-secrets set "Smtp:Username"             '<mailtrap-username>'
dotnet user-secrets set "Smtp:Password"             '<mailtrap-password>'
dotnet user-secrets set "OAuth:Google:ClientId"     '<google-client-id>'
dotnet user-secrets set "OAuth:Google:ClientSecret" '<google-client-secret>'
dotnet user-secrets set "OAuth:GitHub:ClientId"     '<github-client-id>'
dotnet user-secrets set "OAuth:GitHub:ClientSecret" '<github-client-secret>'
```

> En user-secrets va **solo lo secreto**. Lo demás —host y puerto SMTP, si un proveedor
> está activo, las URLs de callback, los orígenes CORS— es configuración normal y vive en
> `appsettings.Local.json`, que se copia de `appsettings.Local.example.json`. La referencia
> completa está en el README del backend.

#### 3. Aplicar migraciones

```bash
dotnet ef database update
```

#### 4. Iniciar el servidor

```bash
dotnet run
```

El API queda disponible en `http://localhost:5218`.

---

### Frontend

```bash
cd TrackerMultimedia_Frontend
```

Instala las dependencias:

```bash
npm install
```

Copia el archivo de variables de entorno:

```bash
cp .env.example .env
```

Edita `.env` con la URL del backend (ya tiene el valor por defecto para desarrollo):

```
VITE_API_URL=/api
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

La interfaz queda disponible en `http://localhost:5173`, y el proxy de Vite reenvía todo lo
que empiece por `/api` al backend en el 5218. Por eso `VITE_API_URL` es una **ruta relativa**
y no una URL absoluta: el navegador la resuelve contra el host desde el que cargó la página.

### Abrirlo desde otro dispositivo de la red

```bash
npm run dev -- --host
```

Vite imprime entonces una segunda dirección del tipo `http://192.168.x.x:5173`, accesible
desde el móvil o desde otro ordenador de la misma red. Funciona sin tocar nada más
precisamente porque `VITE_API_URL=/api` es relativa: con una URL absoluta a `localhost`,
el otro dispositivo intentaría hablar con **su propio** localhost y no encontraría nada.

Dos cosas que conviene saber antes de usarlo así:

- **Expone la aplicación a toda la red local.** No hay nada más entre ella y quien esté
  conectado al mismo router. Para una red doméstica de confianza es razonable; en una red
  compartida o pública, no.
- **El backend sigue escuchando solo en `localhost`.** Solo el proxy de Vite llega a él,
  que es justo lo que se quiere: la API no queda expuesta por su cuenta.

### Pruebas

124 pruebas de componente con Vitest y Testing Library. No necesitan backend ni base de
datos: las llamadas a la API van simuladas.

```bash
npm run test -- --run        # una pasada, ~9 s
npm run test                 # modo watch
```

**No hay integración continua y no va a haberla** (proyecto de un solo desarrollador), así
que la verificación antes de cada commit es manual. Son cinco comandos, menos de un minuto:

```bash
# En TrackerMultimedia_Backend/
dotnet test TrackerMultimedia_Backend.slnx
dotnet restore                             # no debe emitir ningún NU1903

# En TrackerMultimedia_Frontend/
npm run lint
npm run test -- --run
npm run build                              # incluye tsc -b
```

Ninguno sobra, por dos huecos que ya han mordido en este proyecto: **`npm run build` no
ejecuta el linter** —solo hace `tsc -b && vite build`—, y **`tsc -b` no ejecuta las
pruebas**, ni las pruebas comprueban tipos.

Los tests se versionan como código fuente, pero no sus resultados generados: el `.gitignore`
excluye `coverage/`, `.vitest/`, `test-results/` y los reportes `junit*.xml`.

---

## Configuración de proveedores OAuth

### Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials.
2. Crea un **OAuth 2.0 Client ID** (tipo: Web application).
3. Añade `http://localhost:5218/api/auth/google/callback` a los **Authorized redirect URIs**.
4. Copia el `Client ID` y `Client Secret` en los user-secrets del backend.

### GitHub

1. Ve a GitHub → Settings → Developer settings → [OAuth Apps](https://github.com/settings/developers).
2. Crea una nueva app con **Authorization callback URL**: `http://localhost:5218/api/auth/github/callback`.
3. Copia el `Client ID` y genera un `Client Secret`. Ponlos en los user-secrets del backend.

---

## Comandos útiles

### Backend

```bash
docker compose up -d                  # Levantar PostgreSQL (127.0.0.1:5433)
docker compose down                   # Pararlo, conservando los datos
docker compose down -v                # Pararlo y BORRAR los datos
dotnet build                          # Compilar
dotnet run                            # Iniciar en desarrollo
dotnet test TrackerMultimedia_Backend.slnx   # Suite de integración (105 pruebas)
dotnet ef migrations add <Nombre>     # Crear una nueva migración
dotnet ef database update             # Aplicar migraciones pendientes
dotnet ef migrations list             # Ver cuáles existen y cuáles están aplicadas
dotnet user-secrets list              # Ver secretos configurados (imprime los valores)
```

Tras tocar el modelo o una migración, comprueba el esquema desde cero. Es lo único que
detecta una migración que no se aplica, porque las pruebas usan SQLite y se las saltan:

```bash
docker compose down -v && docker compose up -d && dotnet ef database update
```

### Frontend

```bash
npm run dev      # Servidor de desarrollo (HMR)
npm run build    # Build de producción
npm run lint     # Verificar calidad del código
npm run preview  # Vista previa del build
```

---

## Estructura del proyecto

```
TrackerMultimedia_Frontend/
├── public/                     # Estáticos servidos tal cual
├── index.html                  # Punto de entrada de Vite
├── netlify.toml                # Blueprint de despliegue
├── vite.config.ts              # Build, proxy de desarrollo y configuración de tests
└── src/
    ├── config/                 # Variables de entorno y configuración global
    ├── features/               # Funcionalidades por dominio
    │   ├── auth/               # Autenticación: contexto, API, vistas, hooks
    │   ├── media-items/        # Biblioteca: API, componentes, vistas
    │   └── search/             # Descubrimiento: API, componentes, vistas
    ├── layouts/                # Shell de la aplicación
    ├── shared/                 # API base, componentes y utilidades comunes
    └── test/                   # Configuración de Vitest y utilidades de test
```

El backend vive en un repositorio aparte, `TrackerMultimedia_Backend`. Su estructura
y su despliegue se documentan allí.

---

## Despliegue en Netlify — *inactivo*

> ⚠️ **No hay despliegue.** Desde el 2026-08-27 la aplicación se usa **solo en local**, a
> través del servidor de desarrollo de Vite. Los servicios de Netlify, Render y Neon están
> deshabilitados. Esta sección se conserva como receta para volver a desplegar.

El blueprint `netlify.toml` está en la raíz de este repositorio, que es también la raíz
del proyecto de Vite: por eso no declara `base`. Netlify lo detecta al conectar el
repositorio y de ahí saca el comando de build, el directorio publicado y la regla de
reescritura que mantiene funcionando el enrutado de React Router.

### Variable obligatoria

- `VITE_API_URL` — URL pública del backend **incluyendo `/api`**, por ejemplo
  `https://trackermultimedia-backend.onrender.com/api`. Vite la incrusta en el bundle
  en tiempo de build, así que cambiarla exige volver a desplegar, no solo reiniciar.

### Al conectar los dos servicios

La misma URL pública que Netlify asigne a este sitio tiene que quedar registrada en el
backend, en `App__FrontendBaseUrl` y en `Cors__AllowedOrigins__0`. Si no, el navegador
bloqueará las peticiones por CORS y los enlaces de los correos apuntarán a otro sitio.
