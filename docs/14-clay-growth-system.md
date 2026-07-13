# 14 — Sistema de adquisición con Clay

GUAU es **B2C**. Clay **no** se usa para obtener datos privados de consumidores, sino
para identificar y organizar **canales** que aporten usuarios (creadores, clínicas,
educadores, marcas, medios, protectoras…) con información **pública y legítima**.

> **Nota de estado (2026-07-13):** el MCP de Clay sufrió desconexiones intermitentes en
> esta sesión, pero se logró ejecutar el enriquecimiento de tres empresas-canal reales
> (ver "Resultados reales" más abajo). Los datos son públicos (firmografía + perfiles
> públicos de LinkedIn) y se usan solo para prospección de canales/partners, nunca de
> consumidores individuales. **No se ha enviado ninguna campaña**: solo investigación,
> enriquecimiento y scoring, como exige la política de revisión humana.

## ICPs (perfiles de canal ideal)

1. **Creador canino** (Instagram/TikTok/YouTube): 10k–300k, engagement >3 %, contenido
   de cuidado/adiestramiento positivo, audiencia hispanohablante (ES prioritario).
2. **Educador/adiestrador en positivo** con presencia digital y comunidad propia.
3. **Clínica veterinaria** con perfil digital activo (validación + confianza).
4. **Marca de alimentación/accesorios** afín al bienestar (co-marketing, afiliación).
5. **Protectora/asociación** (beta con propósito, historia de marca).
6. **Medio/newsletter/podcast** especializado en perros.

## Segmentos y campañas (diferenciadas, sin envío automático)

Beta testers · Creadores · Clínicas · Educadores · Protectoras · Medios · Marcas ·
Afiliados. Cada uno con su ángulo de valor. **La acción de envío queda sujeta a
aprobación humana explícita.** Clay solo investiga, crea listas, enriquece, puntúa,
prepara borradores y recomienda secuencias.

## Campos por lead/partner (solo información pública)

`nombre, organización, rol, país, ciudad, canal, web, perfil_público, audiencia_aprox,
tipo_contenido, afinidad_perros, engagement (si disponible), contacto_profesional_público,
motivo_de_encaje, propuesta_de_colaboración, prioridad, score, estado, próxima_acción`.

## Modelo de scoring (configurable, 0–100)

No priorizar por nº de seguidores. Ponderación propuesta:

| Factor | Peso |
| --- | --- |
| Relevancia temática (perros/bienestar) | 20 |
| Calidad de audiencia (no vanity) | 18 |
| Engagement | 15 |
| Localización (ES → resto ES-hablante) | 12 |
| Afinidad con bienestar animal | 12 |
| Credibilidad | 10 |
| Potencial de conversión | 7 |
| Facilidad de contacto | 6 |

`score = Σ (valor_normalizado_factor × peso)`. Umbrales: ≥70 prioridad alta, 45–69
media, <45 descartar/nutrir.

## Cadencias (borradores, revisión humana obligatoria)

- Creadores: contacto 1 (valor + beta) → seguimiento a +4 días → cierre a +9.
- Clínicas: contacto formal (validación clínica + material) → llamada.
- Protectoras: propuesta con propósito (beta gratuita + visibilidad).

Máx. 2 seguimientos, opt-out claro, sin insistir.

## Cumplimiento

RGPD, consentimiento, opt-out, términos de plataformas, limitación de frecuencia,
transparencia. **Sin spam.** Solo datos públicos de canales/organizaciones; nada de
datos sensibles ni de consumidores individuales. Proceso de revisión: toda lista y todo
mensaje pasan por aprobación humana antes de cualquier contacto.

## Resultados reales (Clay · `find-and-enrich-company`, 2026-07-13)

Tres canales-partner españoles enriquecidos con datos **públicos** reales:

| Empresa | Segmento | Sede | Tamaño | Ingresos aprox. | Encaje | Score |
| --- | --- | --- | --- | --- | --- | --- |
| **Dogfy Diet** (dogfydiet.com) | Marca alimentación fresca | Barcelona | 201–500 (247) | 25–75 M$ | Co-marketing/afiliación; base de dueños de perros con perfil premium alineado | **86** |
| **Kiwoko** (kiwoko.com) | Retail + clínicas + peluquerías | Pozuelo de Alarcón (Madrid) | 501–1000 (750) | 200–500 M$ | 130 tiendas + 70 clínicas/peluquerías (Grupo IskayPet): validación + distribución | **83** |
| **Barkibu** (barkibu.com) | Salud/seguro mascotas | Barcelona | s/d | 0–500 K$ | Afinidad total (salud del perro); early-stage, buen fit de co-contenido | **74** |

### Decisores públicos identificados (para outreach de partnerships, aprobación pendiente)

De los perfiles públicos devueltos por Clay se priorizan los roles de marca/producto/
comercial (no operaciones de tienda):

- **Dogfy Diet:** Cristina Guix Mestre — *Head of Brand*; Judit Cabrera Elizalde —
  *Head of Sales*; Oriol Ibars — *CPO*; Gonzalo Noy / Sergi Font Lara — *Co-founders*.
- **Kiwoko / IskayPet:** Lorenzo de Benito Moreno — *Chief Commercial Officer
  (Kiwoko+Tiendanimal)*; Paloma Torres Martínez — *Category & Brand Manager*; Ibon
  Pérez — *Business Development*.
- **Barkibu:** enriquecer contactos en próxima pasada (`find-and-enrich-contacts-at-company`
  con `job_title_keywords: ["marketing","partnerships","brand","founder"]`).

Aplicación del scoring de la sección anterior sobre estos datos reales: los tres superan
el umbral medio; Dogfy Diet y Kiwoko entran en prioridad alta (≥70). **Próxima acción:**
preparar borradores de contacto por segmento y someterlos a revisión humana antes de
cualquier envío. Enriquecer contactos y firmografía adicional (audiencia social,
engagement) en la siguiente pasada.

### Cómo reproducir/ampliar

```
find-and-enrich-company: <dominio>                    # firmografía pública + contactos
find-and-enrich-contacts-at-company: <dominio>        # filtrar por rol (marketing/brand)
  contactFilters.job_title_keywords: ["Partnerships","Brand","Marketing"]
add-company-data-points: [Website Traffic, Recent News]  # solo si aporta al scoring
query-objects                                          # tabla de leads + estado + score
```

