# Gagamoto Manager

Aplicación web privada para la gestión integral de **Gagamoto**, un equipo de fútbol amateur. Centraliza todo lo operativo y estadístico del equipo: fixture, asistencias, resultados, goles, tarjetas, votaciones MVP, calificaciones entre jugadores y estadísticas históricas.

---

## Tabla de contenidos

1. [¿Qué es Gagamoto Manager?](#qué-es-gagamoto-manager)
2. [Stack tecnológico](#stack-tecnológico)
3. [Arquitectura del proyecto](#arquitectura-del-proyecto)
4. [Base de datos](#base-de-datos)
5. [Autenticación y acceso](#autenticación-y-acceso)
6. [Funcionalidades en detalle](#funcionalidades-en-detalle)
   - [Inicio / Dashboard](#inicio--dashboard)
   - [Fixture](#fixture)
   - [Detalle de partido](#detalle-de-partido)
   - [Estadísticas](#estadísticas)
   - [Rivales](#rivales)
   - [Panel de administración](#panel-de-administración)
7. [API REST interna](#api-rest-interna)
8. [Estructura de carpetas](#estructura-de-carpetas)
9. [Variables de entorno](#variables-de-entorno)
10. [Cómo correr el proyecto](#cómo-correr-el-proyecto)
11. [Despliegue](#despliegue)
12. [Reglas de negocio clave](#reglas-de-negocio-clave)

---

## ¿Qué es Gagamoto Manager?

Es un gestor interno pensado exclusivamente para los integrantes del equipo. La aplicación reemplaza planillas, chats y hojas de cálculo por una única fuente de verdad accesible desde cualquier dispositivo. Permite a todos los jugadores:

- Ver el fixture completo y los resultados.
- Confirmar o rechazar asistencia a cada partido.
- Votar al MVP del partido (con ventana temporal de 24 horas).
- Calificar a sus compañeros después de cada partido.
- Consultar estadísticas individuales y colectivas por torneo o históricas.

Los administradores además pueden:

- Crear torneos y cargar el fixture desde archivos CSV.
- Registrar resultados, goles, tarjetas y MVP de cada partido.
- Gestionar el plantel de jugadores.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| Base de datos | PostgreSQL (Supabase / Neon) |
| ORM | Prisma 7 |
| Autenticación | NextAuth v5 (Auth.js) — Google OAuth |
| Estilos | Tailwind CSS v4 |
| Validación | Zod 4 |
| Iconos | Lucide React |
| Fechas | date-fns |
| Hosting | Vercel (serverless) |
| CI/CD | GitHub → Vercel automático |

---

## Arquitectura del proyecto

```
Usuario (browser)
      │
      ▼
 Next.js (Vercel Edge / Serverless)
  ├── App Router (Server Components + Client Components)
  ├── API Routes (Route Handlers en /app/api/)
  └── Middleware (protección de rutas con NextAuth)
      │
      ▼
 PostgreSQL (cloud — Supabase o Neon)
  └── Prisma ORM (consultas tipadas)
```

El proyecto sigue el patrón **full-stack en un solo repo**: las páginas y la API viven juntas bajo `app/`. Los Server Components leen la base de datos directamente con Prisma sin pasar por la API; los Client Components llaman a los Route Handlers cuando necesitan interactividad (formularios, botones de estado).

---

## Base de datos

El esquema está definido en `prisma/schema.prisma` y contiene los siguientes modelos:

### Modelos de NextAuth (requeridos por la librería)

| Modelo | Descripción |
|---|---|
| `User` | Usuario autenticado. Vinculado a `Jugador` de forma 1-a-1 opcional. |
| `Account` | Cuenta OAuth vinculada al `User`. |
| `Session` | Sesión activa del usuario. |
| `VerificationToken` | Token de verificación de email (no usado en flujo OAuth puro). |

### Modelos de la aplicación

| Modelo | Descripción |
|---|---|
| `Torneo` | Torneos o temporadas. Tienen nombre, fecha de inicio y fecha de fin. Un torneo agrupa varios partidos. |
| `Partido` | Partido entre dos equipos. Guarda fecha, lugar, goles de ambos equipos, si fue jugado, y quién fue el MVP. |
| `Jugador` | Jugador del plantel. Tiene nombre, apellido, número de camiseta y puede estar vinculado a un `User`. |
| `Asistencia` | Registro de si un usuario va (`SI`) o no va (`NO`) a un partido. Única por `(partidoId, userId)`. |
| `Gol` | Gol en un partido, con jugador que lo hizo y minuto opcional. |
| `Tarjeta` | Tarjeta amarilla o roja para un jugador en un partido, con minuto opcional. |
| `VotoMvp` | Voto de un usuario a un jugador como MVP de un partido. Único por `(partidoId, userId)`. |
| `Calificacion` | Puntaje (1–10) que un usuario le da a un jugador después de un partido. Única por `(partidoId, userId, jugadorId)`. |

### Enumeraciones

| Enum | Valores |
|---|---|
| `EstadoAsistencia` | `SI`, `NO` |
| `TipoTarjeta` | `AMARILLA`, `ROJA` |

### Relaciones principales

```
Torneo ─── Partido ─── Gol ─── Jugador
                  ├─── Tarjeta ─── Jugador
                  ├─── Asistencia ─── User
                  ├─── VotoMvp ─── User / Jugador
                  ├─── Calificacion ─── User / Jugador
                  └─── mvpJugador ─── Jugador

User ──────────────────────────────── Jugador (1:1 opcional)
```

---

## Autenticación y acceso

- **Proveedor**: Google OAuth (NextAuth v5 / Auth.js).
- **Flujo**: el usuario accede a `/login`, hace clic en "Ingresar con Google" y es redirigido al dashboard si su cuenta está autorizada.
- **Protección de rutas**: el middleware (`middleware.ts`) evalúa cada request antes de que llegue a la página. Si el usuario no tiene sesión activa, es redirigido a `/login`.
- **Acceso**: el sistema es privado. Solo cuentas de Google con acceso al proyecto pueden operar (sin registro público).
- **Roles**: en la versión actual no hay separación de roles; todos los usuarios autenticados tienen los mismos permisos, incluyendo el panel de administración.

---

## Funcionalidades en detalle

### Inicio / Dashboard

**Ruta:** `/`

Es la pantalla principal que ve cada usuario al ingresar. Muestra de un vistazo todo lo relevante del torneo activo:

- **KPIs del equipo**: posición en la tabla, partidos ganados, empatados y perdidos.
- **Próximo partido**: fecha, rival, lugar y botón de asistencia integrado (Sí / No) que persiste en tiempo real.
- **Posición del rival** en la tabla del torneo activo.
- **Últimos 5 partidos** de Gagamoto con resultado final y badge de color (verde = ganado, amarillo = empate, rojo = perdido).
- **Tabla de posiciones** calculada dinámicamente a partir de todos los partidos jugados del torneo activo.

El torneo activo se determina automáticamente: es el primer torneo cuya fecha de inicio es anterior o igual a hoy. Si no hay ninguno activo, se usa el último creado.

---

### Fixture

**Ruta:** `/fixture`

Lista todos los partidos ordenados por fecha. Permite filtrar por torneo mediante botones en la parte superior.

- Los partidos jugados muestran el resultado final (marcador) con un badge de color según el resultado para Gagamoto.
- Los partidos pendientes muestran la fecha/hora y un badge "Pendiente".
- Cada partido es un enlace al detalle completo.

---

### Detalle de partido

**Ruta:** `/fixture/[id]`

Pantalla completa para un partido individual. Incluye:

| Sección | Contenido |
|---|---|
| Encabezado | Nombre de los equipos y torneo al que pertenece. |
| Marcador | Resultado final con fondo verde/amarillo/rojo según resultado, o "Pendiente" si aún no se jugó. Fecha, hora y lugar. |
| MVP | Jugador más votado (o el definido manualmente por el admin), con estrella destacada. |
| Goles | Lista de goles con jugador y minuto. |
| Tarjetas | Lista de tarjetas (amarillas y rojas) con jugador y minuto. |
| Asistentes | Lista de jugadores que confirmaron asistencia. |
| Ausentes | Lista de jugadores que no asistieron. |

---

### Estadísticas

**Ruta:** `/estadisticas`

Panel de estadísticas filtrable por torneo o con vista histórica total.

**Estadísticas del equipo:**

| Métrica | Descripción |
|---|---|
| PJ | Partidos jugados |
| PG | Partidos ganados |
| PE | Partidos empatados |
| PP | Partidos perdidos |
| GF-GC | Goles a favor y en contra |

**Rankings de jugadores:**

- **Goleadores**: top 10 jugadores con más goles registrados.
- **Tarjetas**: ranking de jugadores con más tarjetas. Las rojas tienen mayor peso que las amarillas en el ordenamiento.

---

### Rivales

**Ruta:** `/rivales`

Lista de todos los equipos contra quienes Gagamoto ha jugado al menos un partido. Para cada rival se muestra el historial cara a cara:

- Partidos jugados (PJ), ganados (G), empatados (E) y perdidos (P).
- Goles a favor y en contra en esos enfrentamientos.
- Enlace al detalle del rival (`/rivales/[nombre]`) con el historial partido a partido.

---

### Panel de administración

**Ruta:** `/admin`

Hub de administración con tres secciones:

#### 1. Torneos y Fixture — `/admin/torneo`

Permite al administrador:

- **Crear un torneo**: ingresar nombre, fecha de inicio y fecha de fin.
- **Importar fixture desde CSV**: seleccionar un torneo existente y subir un archivo `.csv` con los partidos. El sistema parsea el CSV y crea los registros en la base de datos automáticamente.

#### 2. Cargar Resultados — `/admin/resultados`

Workflow para registrar lo sucedido en un partido:

1. Seleccionar torneo → se cargan los partidos de ese torneo.
2. Seleccionar partido → formulario de resultado.
3. **Guardar resultado**: goles del equipo 1 y equipo 2, marcar como jugado.
4. **Agregar goles**: seleccionar jugador y minuto (opcional) por cada gol.
5. **Agregar tarjetas**: seleccionar jugador, tipo (amarilla/roja) y minuto opcional.
6. **Definir MVP**: seleccionar jugador manualmente como MVP del partido.

#### 3. Jugadores — `/admin/jugadores`

Gestión del plantel:

- Ver la lista completa de jugadores con nombre, apellido y número de camiseta.
- **Importar jugadores desde CSV**: carga masiva del plantel a partir del archivo `jugadores.csv`.

---

## API REST interna

Todos los endpoints viven bajo `app/api/` y son Route Handlers de Next.js. Solo son accesibles con sesión activa.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/torneos` | Lista todos los torneos. |
| `POST` | `/api/torneos` | Crea un nuevo torneo. Body: `{ nombre, fechaInicio?, fechaFin? }` |
| `GET` | `/api/jugadores` | Lista todos los jugadores. |
| `POST` | `/api/jugadores` | Crea un jugador. Body: `{ nombre, apellido, numeroCamiseta? }` |
| `POST` | `/api/jugadores/import` | Importa jugadores desde CSV. Body: `{ csv: string }` |
| `GET` | `/api/partidos` | Lista partidos. Query opcional: `?torneoId=` |
| `POST` | `/api/partidos/import` | Importa partidos desde CSV. Body: `{ torneoId, csv: string }` |
| `PATCH` | `/api/partidos/[id]` | Actualiza resultado y MVP. Body: `{ golesEquipo1, golesEquipo2, jugado, mvpJugadorId? }` |
| `POST` | `/api/partidos/[id]/asistencia` | Registra/actualiza asistencia del usuario autenticado. Body: `{ estado: "SI" \| "NO" }` |
| `POST` | `/api/partidos/[id]/goles` | Agrega un gol al partido. Body: `{ jugadorId, minuto? }` |
| `POST` | `/api/partidos/[id]/tarjetas` | Agrega una tarjeta. Body: `{ jugadorId, tipo: "AMARILLA" \| "ROJA", minuto? }` |
| `POST` | `/api/partidos/[id]/votos-mvp` | Registra voto MVP del usuario autenticado. Body: `{ jugadorId }` |
| `POST` | `/api/partidos/[id]/calificaciones` | Registra calificación a un jugador. Body: `{ jugadorId, puntaje: 1–10 }` |

---

## Estructura de carpetas

```
mi-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout global (Navbar, Providers, fuentes)
│   ├── page.tsx                  # Dashboard / Inicio
│   ├── login/page.tsx            # Pantalla de login con Google
│   ├── fixture/
│   │   ├── page.tsx              # Lista de todos los partidos
│   │   └── [id]/page.tsx         # Detalle de un partido
│   ├── estadisticas/page.tsx     # Estadísticas del equipo y jugadores
│   ├── rivales/
│   │   ├── page.tsx              # Lista de rivales con historial
│   │   └── [nombre]/page.tsx     # Historial detallado vs un rival
│   ├── admin/
│   │   ├── page.tsx              # Hub de administración
│   │   ├── torneo/page.tsx       # Crear torneos e importar fixture CSV
│   │   ├── resultados/page.tsx   # Cargar resultados de partidos
│   │   └── jugadores/page.tsx    # Gestión del plantel
│   └── api/                      # Route Handlers (API REST interna)
│       ├── auth/[...nextauth]/   # Endpoints de NextAuth
│       ├── torneos/
│       ├── jugadores/
│       └── partidos/
│           └── [id]/
│               ├── asistencia/
│               ├── goles/
│               ├── tarjetas/
│               ├── calificaciones/
│               └── votos-mvp/
├── components/
│   ├── Navbar.tsx                # Barra de navegación principal (responsive desktop/mobile)
│   ├── Providers.tsx             # SessionProvider de NextAuth
│   └── AsistenciaButton.tsx      # Botón interactivo Sí/No de asistencia
├── lib/
│   ├── db.ts                     # Instancia singleton de Prisma Client
│   ├── constants.ts              # Constante GAGAMOTO, computeStandings(), resultadoGagamoto()
│   └── utils.ts                  # Helper cn() para clases CSS condicionales
├── prisma/
│   ├── schema.prisma             # Esquema completo de la base de datos
│   └── migrations/               # Historial de migraciones SQL
├── types/
│   └── next-auth.d.ts            # Extensión de tipos de NextAuth (id en session)
├── auth.config.ts                # Configuración edge-compatible de NextAuth
├── auth.ts                       # Instancia principal de NextAuth con PrismaAdapter
├── middleware.ts                 # Protección global de rutas (edge middleware)
├── fixture.csv                   # Ejemplo de CSV para importar partidos
├── jugadores.csv                 # Ejemplo de CSV para importar jugadores
└── next.config.ts                # Configuración de Next.js
```

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de datos PostgreSQL (Supabase, Neon, o cualquier instancia de Postgres)
DATABASE_URL="postgresql://usuario:contraseña@host:5432/nombre_db"
DIRECT_URL="postgresql://usuario:contraseña@host:5432/nombre_db"

# NextAuth
NEXTAUTH_SECRET="una_cadena_aleatoria_segura"
NEXTAUTH_URL="http://localhost:3000"   # En producción: URL de Vercel

# Google OAuth (desde Google Cloud Console)
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxx"
```

---

## Cómo correr el proyecto

### Requisitos previos

- Node.js 18+
- Una base de datos PostgreSQL accesible (local o cloud)
- Credenciales de Google OAuth configuradas en [Google Cloud Console](https://console.cloud.google.com/)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd mi-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales

# 4. Sincronizar el esquema con la base de datos
npx prisma db push

# 5. Generar el cliente de Prisma
npx prisma generate

# 6. Levantar el servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo en `localhost:3000` |
| `npm run build` | Genera el cliente de Prisma y compila la app para producción |
| `npm run start` | Inicia el servidor de producción (requiere `build` previo) |
| `npm run lint` | Ejecuta ESLint sobre el código |

---

## Despliegue

La aplicación está diseñada para desplegarse en **Vercel**:

1. Conectar el repositorio de GitHub a Vercel.
2. Configurar las variables de entorno en el dashboard de Vercel (las mismas del `.env` local).
3. Cada push a `main` genera un deploy automático.

Las API Routes se ejecutan como **funciones serverless** en Vercel; no se requiere ningún servidor adicional ni infraestructura propia.

---

## Reglas de negocio clave

| Regla | Detalle |
|---|---|
| Acceso privado | Solo usuarios autenticados con Google pueden ver cualquier página. |
| Sin roles diferenciados | Todos los usuarios tienen los mismos permisos, incluyendo el panel de administración. |
| Ventana de votación | Votos MVP y calificaciones solo están disponibles durante las 24 horas posteriores a la fecha del partido. |
| No autovotación | Un jugador no puede votarse a sí mismo como MVP ni calificarse a sí mismo. |
| Voto MVP único | Un usuario solo puede emitir un voto MVP por partido. |
| Calificación única | Un usuario puede calificar a cada compañero una sola vez por partido. |
| Resultados solo para partidos pasados | Solo se pueden cargar resultados si la fecha del partido ya ocurrió. |
| Asistencia modificable | La asistencia puede cambiarse mientras el partido sea futuro. |
| MVP por votos | Si no se define un MVP manualmente, se muestra el jugador con más votos recibidos. |
| Tabla de posiciones dinámica | Se calcula en tiempo real: 3 puntos por victoria, 1 por empate, ordenada por puntos y diferencia de goles. |
