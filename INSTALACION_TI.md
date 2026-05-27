# Guia de instalacion para TI

Sistema de Gestion de Acuerdos Municipales - Municipalidad de Flores

Este documento resume los pasos para levantar el sistema desde cero en una computadora o servidor de la Municipalidad.

## 1. Requisitos

Instalar previamente:

- Node.js 20 LTS
- MySQL 8.0
- MySQL Workbench
- Git

Verificar desde consola:

```powershell
node -v
npm -v
git --version
```

Nota para Windows/PowerShell: si `npm install` falla por politicas de ejecucion de scripts, usar `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

## 2. Base de datos

1. Abrir MySQL Workbench.
2. Conectarse al servidor MySQL.
3. Abrir el archivo entregado `sistema_acuerdos.sql`.
4. Ejecutarlo completo.

El script debe crear:

- Base de datos `sistema_acuerdos`
- Tablas principales
- Vistas
- Triggers
- Usuario administrador inicial

Validar que la base exista:

```sql
SHOW DATABASES;
USE sistema_acuerdos;
SHOW TABLES;
```

El sistema espera que existan, al menos, estas tablas/vistas:

- `usuarios`
- `actas`
- `acuerdos`
- `oficios`
- `historial_cambios`
- `vista_acuerdos_semaforo`
- `vista_dashboard_estados`

## 3. Configurar backend

Entrar a la carpeta del backend:

```powershell
cd backend
```

Instalar dependencias:

```powershell
npm.cmd install
```

Crear el archivo `.env` dentro de la carpeta `backend`.

Ejemplo:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=CONTRASENA_MYSQL
DB_NAME=sistema_acuerdos
JWT_SECRET=CAMBIAR_POR_UNA_CLAVE_LARGA_Y_SEGURA
JWT_EXPIRES_IN=2h
UPLOADS_PATH=./uploads/actas
```

Crear carpetas para los PDF:

```powershell
mkdir uploads
mkdir uploads\actas
mkdir uploads\oficios
```

Levantar backend:

```powershell
npm.cmd run dev
```

O en modo normal:

```powershell
npm.cmd start
```

Validar backend en el navegador:

```text
http://localhost:3000/api/health
```

Respuesta esperada:

```json
{
  "estado": "ok",
  "timestamp": "..."
}
```

## 4. Configurar frontend

Abrir otra consola. Desde la raiz del proyecto:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Abrir:

```text
http://localhost:5173
```

Importante: deben quedar corriendo dos consolas:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

## 5. Inicio de sesion

El usuario administrador inicial viene en el script `sistema_acuerdos.sql`.

Si no se conoce la contrasena del administrador, generar una nueva con bcrypt:

```powershell
node -e "require('bcryptjs').hash('NuevaContrasena', 12, (e,h) => console.log(h))"
```

Luego actualizar el hash en MySQL:

```sql
USE sistema_acuerdos;
UPDATE usuarios
SET password_hash = 'HASH_GENERADO'
WHERE correo = 'admin@flores.go.cr';
```

## 6. Problemas comunes

### El frontend abre, pero no deja iniciar sesion

Revisar que el backend tambien este corriendo.

Probar:

```text
http://localhost:3000/api/health
```

Si no responde, el backend no esta levantado.

### Error de conexion a MySQL

Revisar `backend/.env`:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Tambien verificar que MySQL este encendido y que la base `sistema_acuerdos` exista.

### Error al subir actas u oficios

Revisar que existan estas carpetas:

```text
backend/uploads/actas
backend/uploads/oficios
```

### En PowerShell no funciona `npm`

Usar:

```powershell
npm.cmd install
npm.cmd run dev
```

### Desde otras computadoras no abre bien

En desarrollo local el frontend apunta al backend en:

```text
http://localhost:3000/api
```

`localhost` significa "esta misma computadora". Si el sistema se instala en un servidor y las secretarias entran desde otras computadoras, TI debe configurar la IP o dominio del servidor en el frontend, por ejemplo:

```text
http://IP_DEL_SERVIDOR:3000/api
```

Tambien debe configurar `FRONTEND_URL` en el archivo `backend/.env`.

## 7. Puesta en produccion para uso de secretarias

Para produccion no se recomienda usar `npm.cmd run dev`. Ese comando es solo para desarrollo.

La idea recomendada es:

1. Instalar el sistema en una computadora/servidor que permanezca encendido en horario laboral.
2. Levantar el backend con `npm.cmd start` y dejarlo configurado como servicio o tarea del servidor.
3. Compilar el frontend con `npm.cmd run build`.
4. Publicar la carpeta `frontend/dist` con IIS, Apache, Nginx u otro servidor web estatico.
5. Configurar las URLs para que las computadoras de las secretarias apunten al servidor.

### Ejemplo con IP interna

Supongamos que el servidor tiene esta IP interna:

```text
192.168.1.50
```

Backend:

Archivo `backend/.env`:

```env
PORT=3000
FRONTEND_URL=http://192.168.1.50
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=CONTRASENA_MYSQL
DB_NAME=sistema_acuerdos
JWT_SECRET=CAMBIAR_POR_UNA_CLAVE_LARGA_Y_SEGURA
JWT_EXPIRES_IN=2h
UPLOADS_PATH=./uploads/actas
```

Frontend:

Crear archivo `frontend/.env` antes de compilar:

```env
VITE_API_URL=http://192.168.1.50:3000/api
```

Luego compilar:

```powershell
cd frontend
npm.cmd install
npm.cmd run build
```

La carpeta generada:

```text
frontend/dist
```

es la que TI debe publicar en el servidor web.

### Backend como proceso permanente

Para una prueba simple:

```powershell
cd backend
npm.cmd install
npm.cmd start
```

Para produccion en Windows Server, TI debe configurarlo como servicio o tarea permanente con la herramienta que utilicen internamente, por ejemplo el Programador de tareas de Windows o un servicio configurado por TI. El objetivo es que `npm.cmd start` se ejecute automaticamente al iniciar el servidor y se mantenga disponible durante el horario de uso.

### Puertos que deben estar permitidos

TI debe validar firewall/red:

- Puerto del frontend: depende del servidor web usado, normalmente 80 o 443.
- Puerto del backend: `3000`, si se mantiene separado.
- Puerto de MySQL: `3306`, solo debe ser accesible desde el servidor, no desde las computadoras de las secretarias.

### URL para las secretarias

Si se publica por IP:

```text
http://192.168.1.50
```

Si TI configura dominio interno:

```text
http://acuerdos.flores.local
```

Las secretarias no deberian entrar a `localhost`, porque `localhost` en cada computadora apunta a la propia computadora de la secretaria, no al servidor.

## 8. Orden correcto para levantar en desarrollo local

1. Encender MySQL.
2. Ejecutar/importar `sistema_acuerdos.sql`.
3. Configurar `backend/.env`.
4. Crear carpetas `backend/uploads/actas` y `backend/uploads/oficios`.
5. Levantar backend.
6. Validar `http://localhost:3000/api/health`.
7. Levantar frontend.
8. Abrir `http://localhost:5173`.
9. Iniciar sesion con el usuario administrador.
