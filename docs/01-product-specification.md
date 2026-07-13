# 01 — Especificación de producto

## Qué es GUAU

Aplicación móvil premium de salud, cuidado y vínculo entre una persona y su perro.
Un sistema único (no una colección de herramientas) que conoce el contexto del perro y
ayuda a cuidarlo mejor y a fortalecer la relación.

> GUAU ayuda a cuidar, entender y recordar toda la vida compartida con tu perro.

## Tres dimensiones

1. **Utilidad:** escáneres (físico, comida, cartilla), calendario, recordatorios,
   notificaciones, historial.
2. **Relación emocional:** actividades de confianza/juego/calma, actividad diaria,
   rachas, recompensas, recuerdos.
3. **Experiencia premium:** diseño diferencial, motion con propósito, personaje
   virtual, haptics, claridad máxima en información sanitaria.

## Público inicial

Propietarios de perros que consideran a su perro parte de la familia, se preocupan por
su alimentación y cuidado, quieren mejorar la relación y conservar recuerdos, valoran
lo premium y pagan por utilidad + tranquilidad + conexión. Idioma inicial: es-ES,
preparado para i18n. **Solo perros** en el alcance funcional; el modelo de datos admite
otras especies (`pets.species`) pero está restringido a `'dog'` por CHECK.

## Alcance de la fase 1 (29 funciones)

Registro/auth · perfil de usuario · perfil del perro · escáner físico · escáner de
comida · escáner de cartilla · historial de escaneos · calendario · recordatorios ·
notificaciones configurables · actividades · actividad diaria · rachas · recompensas ·
cuaderno de recuerdos · recuerdos por texto · recuerdos por voz · personaje virtual ·
plan gratuito · Pro mensual · Pro anual · Huellas · packs de Huellas · recarga
personalizada · historial de Huellas · configuración/privacidad · analítica · gestión
de errores · administración mínima.

El **chat conversacional completo** es la única función prescindible para el
lanzamiento; su arquitectura se prepara (feature flag `chat`, tablas de contexto
futuras) pero no retrasa lo principal.

## Estado de implementación (esta entrega — Etapa 1)

| Función | Estado | Dónde |
| --- | --- | --- |
| Registro/login reales | ✅ Funcional e2e | `sign-up.tsx`, `sign-in.tsx`, Supabase Auth |
| Perfil de usuario | ✅ Base (profiles + trigger) | migración 1, `settings.tsx` |
| Perfil del perro (con procedencia) | ✅ CRUD + foto + edición | `onboarding.tsx`, `(tabs)/dog.tsx`, `pets/api.ts` |
| Personaje virtual v0 | ✅ Estados + regla sanitaria | `features/character/Mascot.tsx` |
| Economía de Huellas (ledger) | ✅ Backend atómico verificado | migración 2, funciones RPC |
| Catálogo de planes/packs/costes | ✅ En servidor, precios correctos | migración 2, tests `pricing.test.ts` |
| Feature flags y config remota | ✅ Legibles, gobiernan la Home | migración 1, `remoteConfig.ts` |
| Analítica | ✅ Taxonomía + emisión con RLS | `analytics.ts`, migración 3 |
| Privacidad (RLS, storage privado, borrado de cuenta) | ✅ Verificado e2e | migraciones, Edge Function `delete-account` |
| Escáneres / calendario / actividades / rachas / recuerdos | ⛔ Detrás de feature flag; contratos y modelo de datos preparados | docs 07–13, migraciones futuras |

Ninguna función principal está falseada: las que aún no existen se muestran en la Home
como "en construcción" gobernadas por flags de servidor, sin botones sin función.

## Prohibiciones respetadas

Sin red social, sin sección "Hoy", sin marketplace, sin telemedicina, sin comunidades,
sin funciones para veterinarios, sin diagnósticos ni prescripciones, sin cobrar Huellas
por acciones básicas, sin hardcodear el saldo, sin confirmar cartilla automáticamente,
sin guardar salidas de IA sin validación, sin interfaz infantil, sin claves en cliente.
