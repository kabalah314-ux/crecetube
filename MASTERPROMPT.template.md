# Master Prompt — [Nombre del proyecto]

> Esta es la plantilla del MASTERPROMPT. Cópiala como `MASTERPROMPT.md` (sin `.template`) en cada proyecto nuevo y rellénala antes de iniciar al agente.
>
> El agente la leerá UNA vez al iniciar el proyecto, poblará `TASKS.json` con las fases que aquí definas, y no la volverá a tocar.

---

## 1. Objetivo del proyecto
Describe en 2-4 líneas qué se va a construir y para quién.
Ejemplo: *"Web de gestión de clientes para una clínica dental. Una sola admin gestiona citas, historial clínico básico y facturación simple. Optimizada para tablet."*

---

## 2. Stack técnico
- Frontend: ej. React 18 + Tailwind + Vite
- Backend: ej. FastAPI + MongoDB
- Auth: ej. JWT propio / Google OAuth / ninguno
- Hosting: ej. Vercel + Railway
- Otros: ej. Stripe para pagos, Cloudinary para imágenes

---

## 3. Restricciones y reglas del proyecto
Lista lo que NO se debe hacer. Ejemplos:
- No usar librerías de pago
- No instalar dependencias sin pedir confirmación
- No tocar la carpeta `legacy/`
- Mantener compatibilidad con navegadores de 2 años atrás
- Todas las rutas de API deben empezar por `/api`

---

## 4. Fases del proyecto (en orden estricto)

### Fase 1 — Setup
- Estructura de carpetas
- Configuración de entorno
- Variables `.env`

### Fase 2 — Backend base
- Modelos de datos
- Endpoints CRUD principales
- Autenticación

### Fase 3 — Frontend base
- Layout y navegación
- Páginas principales
- Conexión con backend

### Fase 4 — Funcionalidades específicas
- (Lista aquí las features concretas)

### Fase 5 — Pulido
- Estados de error y carga
- Validaciones
- Tests críticos

### Fase 6 — Despliegue
- Variables de producción
- Build y deploy

---

## 5. Criterios de "hecho"
Una tarea está completada cuando:
- El código funciona en local
- Los tests asociados pasan
- Se ha documentado en `progress/`
- No introduce errores en `init.sh`

---

## 6. Glosario / decisiones tomadas
Términos del proyecto o decisiones que el agente debe respetar siempre.
Ejemplo:
- "cliente" siempre significa el usuario final, no el dueño del negocio
- Los importes se guardan en céntimos (enteros), nunca en decimales
- Las fechas en UTC siempre, conversión a local solo en frontend
