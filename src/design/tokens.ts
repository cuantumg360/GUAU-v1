/**
 * GUAU · Tokens de diseño.
 *
 * Dos registros de expresión (docs/04-design-system.md):
 *  - Cotidiano/emocional: calidez, movimiento, personaje.
 *  - Sanitario: sobriedad, contraste alto, jerarquía estricta (tokens `health*`).
 *
 * Dirección cromática: crema cálido + tinta carbón + terracota (vínculo, calidez)
 * con acento verde azulado (calma). El modo sanitario usa azul pizarra sobrio.
 * Contrastes verificados AA para texto sobre sus fondos correspondientes.
 */

export const palette = {
  cream50: '#FBF7F2',
  cream100: '#F3ECE2',
  cream200: '#E8DECF',
  white: '#FFFFFF',
  ink900: '#231F1A',
  ink600: '#5C554B',
  ink400: '#8A8177',
  terracotta600: '#B44A28',
  terracotta500: '#C2512F',
  terracotta100: '#F6E0D6',
  teal700: '#25635E',
  teal500: '#2E7E78',
  teal100: '#D9EAE8',
  slate700: '#33566E',
  slate100: '#E8EFF4',
  green700: '#3E6B4F',
  green100: '#DFEDE4',
  amber700: '#8A5A14',
  amber100: '#F6E8CD',
  red700: '#A03A2C',
  red100: '#F7DFDA',
  // Oscuro (cálido, no negro puro)
  dusk950: '#191511',
  dusk900: '#201B16',
  dusk800: '#2B251E',
  sand100: '#F1EAE0',
  sand300: '#C9BFB1',
  terracotta300: '#E58A66',
  teal300: '#6FB5AE',
  slate300: '#8FB0C7',
  green300: '#8FC2A2',
  amber300: '#E0B15E',
  red300: '#E08A79',
} as const;

export type ColorScheme = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  /** Modo sanitario: color principal sobrio y su fondo. */
  health: string;
  healthSoft: string;
  border: string;
};

export const lightColors: ColorScheme = {
  background: palette.cream50,
  surface: palette.white,
  surfaceAlt: palette.cream100,
  text: palette.ink900,
  textSecondary: palette.ink600,
  primary: palette.terracotta500,
  onPrimary: palette.white,
  primarySoft: palette.terracotta100,
  accent: palette.teal500,
  accentSoft: palette.teal100,
  success: palette.green700,
  successSoft: palette.green100,
  warning: palette.amber700,
  warningSoft: palette.amber100,
  danger: palette.red700,
  dangerSoft: palette.red100,
  health: palette.slate700,
  healthSoft: palette.slate100,
  border: palette.cream200,
};

export const darkColors: ColorScheme = {
  background: palette.dusk950,
  surface: palette.dusk900,
  surfaceAlt: palette.dusk800,
  text: palette.sand100,
  textSecondary: palette.sand300,
  primary: palette.terracotta300,
  onPrimary: palette.dusk950,
  primarySoft: '#3A2A21',
  accent: palette.teal300,
  accentSoft: '#20312F',
  success: palette.green300,
  successSoft: '#22301F',
  warning: palette.amber300,
  warningSoft: '#332A18',
  danger: palette.red300,
  dangerSoft: '#38221D',
  health: palette.slate300,
  healthSoft: '#1F2B35',
  border: '#3A332B',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const typography = {
  /** Titulares: redondeada del sistema (cálida sin ser infantil). */
  display: { fontSize: 30, lineHeight: 36, fontWeight: '700' as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
} as const;

/**
 * Motion tokens. El modo sanitario usa exclusivamente `calm`
 * (sin rebotes ni celebraciones cerca de información de salud).
 */
export const motion = {
  quick: 150,
  standard: 250,
  gentle: 400,
  calm: 200,
} as const;

/** Área táctil mínima accesible. */
export const minTouchTarget = 44;
