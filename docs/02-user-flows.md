# 02 — Flujos de usuario

Notación: `→` transición; **[servidor]** lógica validada en Postgres/Edge Function.

## Arranque y enrutado (`src/app/index.tsx`)

```
App abre → AuthProvider restaura sesión persistida
  ├─ sin sesión            → /welcome
  ├─ sesión, sin perro     → /onboarding
  └─ sesión, con perro     → /(tabs)
```

## Registro (implementado)

```
/welcome → "Crear cuenta" → /sign-up
  email + contraseña (validación cliente: email válido, ≥8 car.)
  → [servidor] supabase.auth.signUp
      ├─ trigger handle_new_user crea profiles + paw_accounts (saldo 0)  [servidor]
      ├─ con sesión inmediata → /onboarding
      └─ requiere confirmación → pantalla "revisa tu correo" → /sign-in
```

## Onboarding del perro (implementado — 7 pasos)

```
intro (personaje saluda)
 → nombre            (obligatorio, ≤60)
 → sexo + esterilización
 → nacimiento        (exacto DD/MM/AAAA validado | aproximado por años)
 → raza + ¿cruce?
 → peso (kg, coma decimal) + nivel de actividad
 → foto (opcional, expo-image-picker) + resumen
 → "Crear perfil de {nombre}"
     → [servidor] insert pets (RLS owner=uid; trigger límite de mascotas)
     → [servidor] upload foto a bucket privado {uid}/{petId}/… + update photo_path
     → [servidor] profiles.onboarding_completed_at = now()
     → /(tabs)
```

Toda decisión de validación de fecha/peso vive en `src/core/petSchema.ts` (testeada).

## Perfil del perro — ver y editar (implementado)

```
/(tabs)/dog
  vista: foto (URL firmada 1h) + ficha (nombre, sexo, esterilización, nacimiento,
         raza/cruce, peso, actividad, edad calculada)
  nota de procedencia: "todos los datos los has introducido tú"
  → "Editar" → formulario → guardar
       → [servidor] update pets (RLS); si escribes fecha exacta, deja de ser aprox.
  → cambiar foto → nueva subida privada
```

## Ajustes, privacidad y borrado de cuenta (implementado)

```
/(tabs)/settings
  cuenta: correo, plan (Gratuito), Huellas, idioma, versión
  privacidad: tarjeta en modo sanitario sobrio
  → "Cerrar sesión" → signOut → /welcome
  → "Eliminar cuenta y datos" → Alert de confirmación
       → [servidor] Edge Function delete-account:
            verifica JWT → borra archivos de Storage del usuario →
            auth.admin.deleteUser (cascada sobre profiles/pets/ledger/…) →
            audit_log
       → signOut → /welcome
```

## Consumo de Huellas (contrato listo para las Etapas 7–9)

```
usuario lanza un escáner de coste
  → [servidor] spend_paws(operation, idempotency_key, related_entity)
       reintento con misma key → devuelve el movimiento original (no recobra)
       saldo insuficiente → error INSUFFICIENT_PAWS → UI ofrece recargar
  → se ejecuta la operación de IA (Edge Function)
```

## Flujos preparados (modelo de datos y contratos listos; UI en próximas etapas)

Cartilla: capturar → OCR → **revisión campo a campo** → confirmación humana explícita
(ningún dato sanitario se confirma solo) → recordatorios opcionales. Recuerdos: texto o
voz → transcripción editable → versión procesada conservando el original. Actividad
diaria: selección determinista por perfil → notificación → registro → pregunta de
respuesta del perro → alimenta futuras recomendaciones. Ver docs 07/08/12/13.
