# TrackerMultimedia

Aplicación para gestionar y descubrir anime, manga, manhwa y más contenido multimedia.
Conecta con la API de [Jikan](https://jikan.moe/) para búsquedas externas.

## Requisitos previos

- [Node.js](https://nodejs.org/) 20 o superior
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [PostgreSQL](https://www.postgresql.org/) 14 o superior
- [`dotnet-ef` tools](https://learn.microsoft.com/en-us/ef/core/cli/dotnet): `dotnet tool install --global dotnet-ef`

---

## Setup de desarrollo

### Backend

```bash
cd Backend
```

#### 1. Inicializar User Secrets

Los secretos de desarrollo **nunca se versionan**. Se guardan localmente con `dotnet user-secrets`, que los almacena en `%APPDATA%\Microsoft\UserSecrets\` fuera del repositorio.

```bash
dotnet user-secrets init
```

#### 2. Configurar los secretos

Copia y ejecuta los siguientes comandos reemplazando los valores entre `<...>`:

```bash
# Base de datos
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=tracker_multimedia;Username=<usuario>;Password=<contraseña>"

# API key interna (header X-Api-Key para rutas administrativas)
dotnet user-secrets set "Security:ApiKey" "<cadena-aleatoria-larga>"

# JWT — debe ser una cadena de al menos 32 caracteres
dotnet user-secrets set "Jwt:Secret" "<cadena-aleatoria-de-32-o-mas-caracteres>"

# SMTP — Mailtrap (https://mailtrap.io → Email Testing → SMTP Settings)
dotnet user-secrets set "Smtp:Host"     "sandbox.smtp.mailtrap.io"
dotnet user-secrets set "Smtp:Port"     "587"
dotnet user-secrets set "Smtp:Username" "<mailtrap-username>"
dotnet user-secrets set "Smtp:Password" "<mailtrap-password>"
dotnet user-secrets set "Smtp:Enabled"  "true"

# Google OAuth (https://console.cloud.google.com → APIs & Services → Credentials)
dotnet user-secrets set "OAuth:Google:Enabled"      "true"
dotnet user-secrets set "OAuth:Google:ClientId"     "<google-client-id>"
dotnet user-secrets set "OAuth:Google:ClientSecret" "<google-client-secret>"

# GitHub OAuth (https://github.com/settings/developers → New OAuth App)
dotnet user-secrets set "OAuth:GitHub:Enabled"      "true"
dotnet user-secrets set "OAuth:GitHub:ClientId"     "<github-client-id>"
dotnet user-secrets set "OAuth:GitHub:ClientSecret" "<github-client-secret>"
```

> Los valores no-sensibles (`RedirectUri`, `FromAddress`, `FrontendBaseUrl`, etc.) ya están configurados en `appsettings.json` y no requieren secretos.

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
cd Frontend
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
VITE_API_URL=http://localhost:5218/api
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

La interfaz queda disponible en `http://localhost:5173`.

### Pruebas y artefactos locales

Los tests del frontend se versionan como código fuente, pero no sus resultados generados.

- El `.gitignore` excluye salidas locales como `coverage/`, `.vitest/`, `test-results/`, `playwright-report/` y reportes `junit*.xml`.
- Si generas cobertura o reportes de pruebas en local, esos archivos no deben subirse al repositorio.

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
dotnet build                          # Compilar
dotnet run                            # Iniciar en desarrollo
dotnet ef migrations add <Nombre>     # Crear una nueva migración
dotnet ef database update             # Aplicar migraciones pendientes
dotnet user-secrets list              # Ver secretos configurados
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
TrackerMultimedia/
├── Backend/
│   ├── Contracts/          # DTOs de entrada/salida del API
│   ├── Controllers/        # Endpoints REST
│   ├── Data/               # DbContext y configuración EF Core
│   ├── Domain/             # Entidades, enums y validaciones de dominio
│   ├── Infrastructure/     # Opciones tipadas (SmtpOptions, OAuthOptions, etc.)
│   ├── Migrations/         # Historial de migraciones de base de datos
│   ├── Properties/         # Configuración de arranque
│   ├── Services/           # Lógica de negocio y servicios externos
│   └── appsettings.json    # Configuración no-sensible (plantilla)
└── Frontend/
    └── src/
        ├── config/             # Variables de entorno y configuración global
        ├── features/           # Funcionalidades por dominio
        │   ├── auth/           # Autenticación: contexto, API, vistas, hooks
        │   ├── media-items/    # Biblioteca: API, componentes, vistas
        │   └── search/         # Descubrimiento: API, componentes, vistas
        ├── layouts/            # Shell de la aplicación
        └── shared/             # API base, componentes y utilidades comunes
```
