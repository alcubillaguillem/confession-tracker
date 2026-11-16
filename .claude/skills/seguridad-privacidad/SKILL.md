---
name: seguridad-privacidad
description: Requisitos obligatorios de seguridad y privacidad (datos de menores y dato religioso, art. 9 RGPD) con comandos de comprobación. Úsala en cualquier cambio de código, dependencias o configuración.
---
# Seguridad y privacidad

## Reglas
1. **Cero red**: nada de `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, analítica, fuentes o CDNs externos. Todo se sirve desde el mismo origen. Única excepción: `fetch('./curso.enc')` (mismo origen) en `almacen.ts`.
9. **Datos del curso publicados**: solo cifrados con contraseña (PBKDF2 600 000 + AES-256-GCM, `src/domain/cifrado.ts`) en `public/curso.enc`. La contraseña nunca en el código, el repositorio, archivos ni logs (`CT_CONTRASENA` al publicar).
2. **CSP estricta** (`vite.config.ts`): `default-src 'none'`, sin `unsafe-inline` ni `unsafe-eval`. No añadir orígenes.
3. **Sin inyección de HTML**: prohibidos `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `dangerouslySetInnerHTML`, `eval`, `new Function`, `document.write`. Solo JSX (escapa el texto).
4. **Estilos**: solo en `src/ui/estilos.css` mediante clases; nada de atributos `style` (los bloquea la CSP).
5. **Validación**: toda entrada externa (CSV, XLSX, copia JSON) pasa por un esquema Zod antes de guardarse. Límite de tamaño de archivo: 5 MB.
6. **Datos**: solo en IndexedDB del dispositivo. Sin botón de borrado por decisión del usuario: se borran quitando la app o los datos del sitio en el navegador. Nada en `localStorage`, URL ni logs (`console.*` prohibido en `src/`, salvo en los tests).
7. **Repositorio**: `horarios_y_alumnos/` y cualquier archivo con alumnos reales están en `.gitignore` y `.graphifyignore`. Los tests usan datos ficticios.
8. **Dependencias**: versiones exactas, `npm audit` = 0. No añadir ninguna sin aprobación.

## Comprobación (debe salir vacío, salvo el último comando)
```bash
grep -rnE "innerHTML|outerHTML|insertAdjacentHTML|dangerouslySetInnerHTML|eval\(|new Function|document\.write" src
grep -rnE "fetch\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|console\." src --include=*.ts --include=*.tsx | grep -v "\.test\.ts" | grep -v "fetch('./curso.enc'"
grep -rn "style=" src
npm audit
```
