-- GUAU · Migración 7: contenido semilla de actividades.
--
-- IMPORTANTE (docs/08-health-safety.md, docs/14... no): estas actividades son de
-- BAJO RIESGO (juego, olfato, calma, cooperación básica) y están redactadas para
-- el lanzamiento, pero su review_status es 'pending_review': quedan pendientes de
-- validación por especialistas en comportamiento animal. Se publican (published=true)
-- porque son seguras y aportan valor, y la UI muestra que aún no están clínicamente
-- validadas. No se presenta este contenido como validado por profesionales.

insert into public.activities
  (slug, title, objective, description, category, duration_min, difficulty, materials,
   preparation, context, steps, comfort_signals, stop_signals, common_mistakes,
   precautions, expected_outcome, closing_question, min_activity_level, review_status, published)
values
(
  'olfato-busca-premio', 'Busca el premio',
  'Estimular el olfato y la concentración de forma tranquila.',
  'Un juego de olfato sencillo en el que tu perro busca pequeñas recompensas escondidas. Cansa de forma saludable y sube la confianza.',
  'play', 10, 1, array['5-8 premios pequeños'],
  'Elige una zona tranquila y sin distracciones. Ten los premios a mano.',
  'Ideal para casa o un jardín conocido. Mejor con hambre ligera, no recién comido.',
  array[
    'Enseña a tu perro un premio y deja que lo huela.',
    'Con él mirando, esconde 2-3 premios a la vista, en el suelo.',
    'Anímale con calma: "busca".',
    'Cuando lo domine, esconde los premios un poco más difíciles.',
    'Termina siempre con un par de premios fáciles para acabar en positivo.'
  ],
  array['Mueve la cola con soltura', 'Olfatea con interés', 'Vuelve a ti buscando más'],
  array['Se aleja o pierde el interés', 'Se muestra frustrado o nervioso', 'Jadea en exceso'],
  array['Esconder demasiado difícil al principio', 'Repetir hasta aburrir', 'Usar premios demasiado grandes'],
  'Si tu perro tiene restricciones dietéticas, usa parte de su ración habitual.',
  'Un perro más tranquilo y satisfecho tras usar el olfato.',
  '¿Cómo de concentrado y disfrutando has visto a tu perro?',
  'low', 'pending_review', true
),
(
  'calma-manta-segura', 'La manta segura',
  'Crear un lugar de calma asociado a algo positivo.',
  'Enseña a tu perro que una manta o colchoneta es su sitio de relax. Útil para bajar revoluciones.',
  'calm', 8, 1, array['Una manta o colchoneta'],
  'Coloca la manta en un lugar tranquilo donde suela descansar.',
  'Mejor en momentos de calma, no cuando esté muy excitado.',
  array[
    'Deja la manta en el suelo y premia cualquier interés por ella.',
    'Cuando ponga una pata o se acerque, prémialo con voz suave.',
    'Si se tumba, prémialo con calma sin excitarle.',
    'Asocia una palabra tranquila como "sitio" o "calma".',
    'Termina dejándole descansar allí si quiere.'
  ],
  array['Se tumba relajado', 'Respira despacio', 'Suspira o se acomoda'],
  array['Se levanta inquieto', 'Evita la manta', 'Muestra tensión'],
  array['Forzarle a quedarse', 'Premiar con demasiada energía', 'Usar la manta como castigo'],
  'Nunca uses este sitio para aislar o castigar; debe ser siempre positivo.',
  'Un lugar de referencia para que tu perro se relaje solo.',
  '¿Ha encontrado tu perro algo de calma en su manta?',
  'low', 'pending_review', true
),
(
  'confianza-toca-la-mano', 'Toca la mano',
  'Reforzar la comunicación y la confianza con un gesto sencillo.',
  'Tu perro aprende a tocar tu mano con el hocico. Es la base de muchos ejercicios de cooperación y refuerza vuestro vínculo.',
  'cooperation', 7, 1, array['Premios pequeños'],
  'Ten premios en una mano. Empieza en un sitio sin distracciones.',
  'Perfecto para ratos cortos varias veces al día.',
  array[
    'Ofrece la palma abierta cerca del hocico de tu perro.',
    'Por curiosidad la tocará: en ese instante di "sí" y premia.',
    'Repite y añade la palabra "toca" justo antes.',
    'Aleja un poco la mano para que dé un pasito.',
    'Termina con éxitos fáciles y una caricia.'
  ],
  array['Se acerca con interés', 'Toca con suavidad', 'Repite contento'],
  array['Se agobia o se retira', 'Salta o mordisquea la mano', 'Pierde interés'],
  array['Mover la mano demasiado rápido', 'Sesiones largas', 'Repetir sin premiar'],
  'Mantén las sesiones cortas y positivas. Nunca fuerces el contacto.',
  'Una señal de comunicación clara y divertida entre los dos.',
  '¿Con qué ganas ha respondido tu perro a tu mano?',
  'low', 'pending_review', true
),
(
  'relax-respira-juntos', 'Respirar en calma juntos',
  'Bajar el nivel de activación de ambos con presencia tranquila.',
  'Un momento de calma compartida: te sientas cerca de tu perro y le acompañas con respiración lenta y caricias suaves si las acepta.',
  'relax', 6, 1, array[]::text[],
  'Busca un momento del día tranquilo, sin prisas.',
  'Ideal al final del día o tras un paseo relajado.',
  array[
    'Siéntate cerca de tu perro sin exigirle nada.',
    'Respira despacio y habla poco, con voz suave.',
    'Si busca contacto, ofrece caricias lentas y largas.',
    'Si prefiere su espacio, simplemente acompáñale en silencio.',
    'Deja que el momento termine de forma natural.'
  ],
  array['Se relaja y se acomoda', 'Respira más despacio', 'Busca tu contacto'],
  array['Se muestra inquieto', 'Se aparta', 'No quiere contacto (respétalo)'],
  array['Buscar contacto a la fuerza', 'Alargar demasiado', 'Hacerlo con ruido alrededor'],
  'Respeta siempre si tu perro no quiere caricias en ese momento.',
  'Un rato de conexión tranquila que os relaja a los dos.',
  '¿Habéis conseguido un momento de calma juntos?',
  'low', 'pending_review', true
),
(
  'comunicacion-mira-y-nombra', 'Mírame',
  'Fomentar el contacto visual voluntario como base de la comunicación.',
  'Tu perro aprende a mirarte a los ojos cuando dices su nombre, sin presión. Mejora la atención y la conexión.',
  'communication', 6, 2, array['Premios pequeños'],
  'Empieza en un entorno tranquilo y conocido.',
  'Sesiones cortas, cuando tu perro esté receptivo.',
  array[
    'Di el nombre de tu perro una sola vez, con voz amable.',
    'En cuanto te mire (aunque sea un instante) di "sí" y premia.',
    'Si no te mira, espera sin repetir; prémiale cualquier mirada.',
    'Aumenta poco a poco el tiempo de contacto visual.',
    'Termina con un premio fácil y una caricia.'
  ],
  array['Te busca con la mirada', 'Responde a su nombre', 'Se muestra atento'],
  array['Se agobia con la insistencia', 'Evita la mirada', 'Se distrae y frustra'],
  array['Repetir el nombre muchas veces', 'Forzar la mirada', 'Sesiones largas'],
  'No fuerces el contacto visual sostenido; para algunos perros es incómodo.',
  'Un perro que te presta atención cuando lo llamas, por gusto.',
  '¿Te ha mirado tu perro con ganas al oír su nombre?',
  'medium', 'pending_review', true
),
(
  'paseo-de-olfateo', 'Paseo de olfateo',
  'Permitir un paseo centrado en oler, a ritmo del perro.',
  'Un paseo tranquilo donde lo importante no es la distancia sino dejar que tu perro huela todo lo que quiera. Enriquece y relaja mucho.',
  'play', 20, 1, array['Correa larga (opcional)'],
  'Elige una ruta tranquila y date tiempo sin prisa.',
  'Mejor en horas tranquilas y en un entorno seguro.',
  array[
    'Sal sin objetivo de distancia: el plan es oler.',
    'Deja que tu perro marque el ritmo y elija dónde detenerse.',
    'Afloja la correa cuando sea seguro para que explore.',
    'Acompáñale con calma, sin meter prisa.',
    'Vuelve cuando notes que está satisfecho.'
  ],
  array['Olfatea con interés', 'Camina relajado', 'Elige su ritmo'],
  array['Tira con ansiedad', 'Se muestra estresado', 'Evita explorar'],
  array['Meter prisa', 'Tirar de la correa', 'Convertirlo en paseo deportivo'],
  'Mantén a tu perro seguro: correa en zonas con tráfico o desconocidas.',
  'Un perro mentalmente satisfecho tras oler a su ritmo.',
  '¿Ha disfrutado tu perro explorando con el olfato?',
  'medium', 'pending_review', true
);
