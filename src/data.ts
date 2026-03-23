import { Subject } from './types';

export const subjects: Subject[] = [
  {
    id: "trabajo-docente",
    name: "Trabajo y Profesionalización Docente",
    career: "Carrera de Profesorados",
    field: "Campo de la Formación General",
    modality: "Materia",
    duration: "Cuatrimestral (Réplica 1º y 2º cuatrimestre)",
    shift: "Vespertino",
    hours: "4 horas (martes de 20:20 a 23 hs)",
    professor: "Prof. Lic. Erika Martinez Gomez",
    foundation: "El espacio curricular Trabajo y Profesionalización Docente es una materia optativa correspondiente al Campo de Formación General. La asignatura reúne un conjunto de conceptualizaciones que consideran al profesor/a como un sujeto histórico, social y económico, ubicado en su tiempo y su contexto. Desde aquí se pone en cuestión el concepto de 'apostolado' vigente en décadas pasadas, y se lo piensa como un trabajador y profesional dentro del conjunto de los trabajadores/profesionales.",
    objectives: [
      "Aplicar el trabajo en comunidad de aprendizaje para la construcción y circulación del conocimiento así como la importancia de los lazos afectivos en la enseñanza.",
      "Comprender los conceptos y debates centrales en torno a las categorías 'trabajo' y 'profesión' y su relación con la educación.",
      "Reconocer el proceso que va desde la concepción de la docencia como el ejercicio de un 'apostolado', a pensar al profesor como trabajador y profesional de la educación.",
      "Reflexionar acerca de las tensiones y conflictos que se presentan en el campo del trabajo y la profesión docente desde la perspectiva histórica.",
      "Identificar las dimensiones del rol docente como líder pedagógico, animador de procesos de aprendizaje y partícipe activo en la construcción del proyecto educativo institucional.",
      "Analizar las condiciones de trabajo y su relación con el proceso salud-enfermedad del trabajador docente.",
      "Adquirir la relevancia de la reflexión sobre la práctica para una enseñanza situada y significativa."
    ],
    units: [
      {
        title: "UNIDAD TRANSVERSAL: Hacia una identidad docente",
        description: "Explorará en profundidad el papel del/a docente en diversos contextos educativos y cómo su identidad, autoridad, interacción con estudiantes y sus prácticas docentes influyen en el proceso de aprendizaje."
      },
      {
        title: "UNIDAD 1: Trabajo y Profesionalización Docente. Entre lo Prescrito y lo Real",
        description: "El trabajo como categoría analítica para pensar la actividad docente. La formación profesional. La diferencia entre oficio, vocación, ocupación y profesión. Las concepciones de los/as docentes como trabajadores o como profesionales. La precarización laboral. La intensificación del trabajo."
      },
      {
        title: "UNIDAD 2: Marco Legal y Salud del Profesional Docente",
        description: "Marco legal del trabajador/profesional docente. Salud y trabajo docente. Conceptos de riesgo y peligro. Análisis de los factores de riesgo psíquico. Malestar docente. Síndrome de burnout. Derechos y deberes de los docentes. El Estatuto del Docente como marco normativo."
      }
    ],
    methodology: "Se trabajará desde un enfoque constructivista y con un pensamiento didáctico crítico, ubicando a los/as estudiantes en una posición activa en la construcción del conocimiento. Se adoptará el modelo andragógico y se trabajará como 'Comunidad de Aprendizaje'. Se utilizarán estrategias directas (exposición, debate) e indirectas (trabajos grupales, análisis de casos, simulaciones).",
    evaluation: "Evaluación formativa, autoevaluación por parte del estudiante. Instancia sumativa con calificación numérica. El parcial será integrador domiciliario e individual y consistirá en el análisis y articulación teórica de la bibliografía a partir de la elaboración de una entrevista a un/a docente. Promoción directa (7 o más puntos), Examen final (menos de 7 puntos).",
    bibliography: [
      "Fallas Jiménez, Y. (2009) Trabajo Social, Formación Profesional y Categoría Trabajo.",
      "Gavilán, M. (1999) La desvalorización del rol docente. Revista Iberoamericana de Educación.",
      "González, H. (2009). 'Transformar el trabajo docente para transformar la escuela'.",
      "Tedesco, J. C, y Tenti Fanfani, E. (2002) Nuevos tiempos, nuevos docentes.",
      "Alliaud, A. (2010) 'La biografía escolar en el desempeño profesional de docentes noveles'."
    ]
  },
  {
    id: "ciencias-lenguaje",
    name: "Introducción a las Ciencias del Lenguaje",
    career: "Profesorado de Enseñanza Superior en Lengua y Literatura",
    field: "Campo de la Formación Específica (CFE)",
    modality: "Materia",
    duration: "Cuatrimestral (1º cuatrimestre)",
    shift: "Mañana y vespertino",
    hours: "6 horas cátedra semanales",
    professor: "Mara Lis Bannon",
    foundation: "La asignatura Introducción a las ciencias del lenguaje pertenece al Área de Lingüística del Campo de la Formación Específica (CFE). Su inclusión reconoce la importancia que los estudios sobre el lenguaje han cobrado en las últimas décadas. Ofrece a los alumnos una primera aproximación a concepciones y problemáticas vinculadas con el lenguaje, que sirvan de base para el posterior abordaje de las diversas perspectivas lingüísticas.",
    objectives: [
      "Reconozcan la complejidad del lenguaje así como la necesidad y el interés de su estudio.",
      "Se inicien en la reflexión sistemática sobre los modelos teóricos que conforman las llamadas 'Ciencias del Lenguaje'.",
      "Logren un manejo fluido de las nociones fundamentales de las teorías lingüísticas estudiadas.",
      "Sean capaces de observar, analizar e interpretar datos lingüísticos.",
      "Reflexionen sobre la estructura y el uso de su propia lengua.",
      "Desarrollen estrategias de lectura y comprensión de textos y mejoren su capacidad de expresión oral y escrita.",
      "Continúen y profundicen su 'alfabetización académica'."
    ],
    units: [
      {
        title: "Unidad 1: El estudio del lenguaje. Conceptos generales",
        description: "Conceptos básicos en el estudio de la lengua como sistema: doble articulación del lenguaje, lengua y lenguaje; lengua y habla; el signo lingüístico; significado y significante; relaciones sintagmáticas y asociativas."
      },
      {
        title: "Unidad 2: Niveles de análisis lingüístico",
        description: "Delimitación de niveles y unidades de análisis lingüístico. La Gramática. Fonología: fonema, variación alofónica. Morfología: palabra, lexema, morfema, flexión, formación de palabras. Sintaxis: la oración, estructura jerárquica. Semántica: significado oracional y pragmático."
      },
      {
        title: "Unidad 3: Estudios lingüísticos más allá de la Gramática",
        description: "El texto y sus propiedades. Normas de textualidad: coherencia y cohesión textual. Aspectos gramático-textuales. Macroestructura y superestructura. La perspectiva pragmática: deixis, implicatura conversacional, actos de habla."
      }
    ],
    methodology: "Las clases son teórico-prácticas. En ellas se alternan situaciones de exposición de la docente con resolución de actividades por parte de los alumnos, en forma individual y/o grupal, seguidas de puestas en común para la reflexión sobre y la sistematización de los aspectos trabajados.",
    evaluation: "Los alumnos serán evaluados a través de dos parciales escritos y participación en clase. Promoción directa: aprobación de cada parcial con mínimo de 7 puntos y coloquio. Examen final: aprobación de parciales con mínimo de 4 puntos y prueba de producción oral.",
    bibliography: [
      "Martinet, A. (1965). Elementos de lingüística general. Madrid: Gredos.",
      "Saussure, Ferdinand de (1916) Curso de lingüística general. Buenos Aires: Losada.",
      "Adelstein, A. y V Nercesian (2021) 'Las palabras: léxico y morfología'.",
      "Di Tulio, A. (2001) Manual de gramática del español.",
      "Reyes, G. (1995) El abecé de la pragmática, Madrid: Arco Libros."
    ]
  },
  {
    id: "observacion-institucional",
    name: "Taller de observación institucional",
    career: "Profesorado de Educación Superior en Lengua y Literatura",
    field: "Campo de la Formación Específica",
    modality: "Taller",
    duration: "Primer cuatrimestre 2025",
    shift: "Mañana",
    hours: "4 horas cátedra",
    professor: "Romina Colussi",
    foundation: "Las instituciones escolares no son espacios objetivos y neutrales en los que se produce el encuentro entre actores sociales para la transmisión de un constructo neutro. Son lugares en los que se legitima determinada forma de conocimiento y relaciones sociales. El desafío del taller será acompañar a los estudiantes en la construcción de una mirada tendiente a desnaturalizar las representaciones cristalizadas y a interpretar las experiencias evitando una mirada cargada de prejuicios.",
    objectives: [
      "Apropiación de los marcos conceptuales y de las herramientas para la observación de las instituciones de educación formal.",
      "Estudio de las técnicas de procesamiento de la información empírica.",
      "Elaboración de los registros de observación desde una mirada de corte cualitativa.",
      "Construcción de una mirada interpretativa que revise, de modo crítico, algunas representaciones acerca de cotidianeidad escolar.",
      "Estudio y reflexión acerca de la dimensión política e ideológica del proceso de enseñanza.",
      "Estudio de los diversos géneros escriturarios que circulan por las instituciones escolares y de su relevancia en la construcción de la práctica docente."
    ],
    units: [
      {
        title: "Primera unidad: Las instituciones escolares",
        description: "La situación de formación y su análisis. El contexto social: los mandatos y las demandas. Imaginarios y representaciones sociales acerca de la escuela, los docentes, las clases y los grupos de aprendizaje. El estilo y la cultura institucional."
      },
      {
        title: "Segunda unidad: Las representaciones sobre el rol del profesor",
        description: "Los modelos y las trayectorias de formación. La historia personal y la trayectoria profesional en la constitución del rol docente. El rol del practicante. La relación con el saber y el vínculo con la relación pedagógica."
      },
      {
        title: "Tercera unidad: La práctica pedagógica",
        description: "Los actores sociales y el contenido escolar. La doble tradición en la constitución del rol docente. Los documentos de práctica pedagógica: los diseños curriculares, las planificaciones departamentales, los programas de las asignaturas."
      }
    ],
    methodology: "La modalidad de trabajo se centrará en poner en diálogo las entrevistas a los profesores, los directivos, las observaciones de campo y las interpretaciones de los registros con la exposición y discusión de los temas. Los contenidos y la bibliografía no seguirán una secuencia lineal sino que serán trabajados de manera transversal.",
    evaluation: "Asistencia mínima requerida del 75%. Presentación durante el cuatrimestre de escenas analizadas desde una perspectiva interpretativa que serán los insumos para escribir el guion de una charla TED. El guion será presentado y comentado en las últimas semanas. El trabajo final se aprueba con 4 puntos.",
    bibliography: [
      "Arnaus, 'Voces que cuentan y voces que interpretan: reflexiones en torno a la autoría en una investigación etnográfica'.",
      "Bohannan, L. 'Shakespeare en la selva'.",
      "Calvo, Beatriz, 'Etnografía de la educación'.",
      "Ezpeleta J. y Rockwell, E. 'La escuela, relato de un proceso de construcción inconcluso'.",
      "Geertz, C., 'Descripción densa: hacia una teoría interpretativa de la cultura'."
    ]
  },
  {
    id: "pedagogia",
    name: "Pedagogía",
    career: "Profesorados de Historia, Filosofía, Psicología, Matemática y Lengua y Literatura",
    field: "Campo de la Formación General",
    modality: "Materia",
    duration: "Anual",
    shift: "Vespertino",
    hours: "3 horas cátedra semanales",
    professor: "Sandra M. Aguilar",
    foundation: "Esta asignatura se inscribe en el Campo de Formación General. Su propósito es introducir a lxs futurxs docentes en el campo de la Pedagogía, brindando herramientas teóricas y conceptuales para comprender la educación como un fenómeno social, político y cultural en permanente transformación. La educación es una práctica históricamente situada, cuyos sentidos han sido definidos por diversos proyectos políticos y epistemológicos.",
    objectives: [
      "Comprendan y analicen el discurso pedagógico moderno desde una perspectiva histórica y las principales problemáticas vinculadas al campo pedagógico.",
      "Comprendan el surgimiento de la escuela moderna como una producción socio-histórica contradictoria y conflictiva tendiente a la normalización de las subjetividades.",
      "Adquieran un conocimiento crítico, teórico y práctico de las diferentes concepciones educativas.",
      "Construyan un marco conceptual que les permita analizar y entender qué sentidos del discurso pedagógico circulan en la realidad educativa actual.",
      "Tomen contacto con fuentes bibliográficas originales y avancen en la adquisición de su capacidad lectora y de escritura académica.",
      "Esbocen e intercambien opiniones críticas, sólidamente argumentadas sobre el material bibliográfico y las problemáticas educativas.",
      "Incorporen a la reflexión pedagógica la perspectiva de géneros y sexualidades."
    ],
    units: [
      {
        title: "UNIDAD I - Pedagogía y Educación. La educación como cuestión de Estado y el carácter histórico de la escuela moderna",
        description: "La educación como objeto de estudio de la Pedagogía Moderna. El positivismo y la pedagogía tradicional. La institución escolar como dispositivo de socialización, normalización y disciplinamiento en el marco de la modernidad. Producción de subjetividad."
      },
      {
        title: "UNIDAD II - Corrientes pedagógicas",
        description: "La Escuela Nueva. Innovaciones y propuestas metodológicas. Las corrientes neoweberianas o Teorías del consenso. La Concepción althusseriana del Estado. Teoría de la reproducción. La pedagogía como emancipación y la conformación de un lenguaje de posibilidad."
      },
      {
        title: "UNIDAD III – Tiempos de mercado, subjetividad y educación",
        description: "¿Qué queda de la escuela de los tiempos del estado nación hoy? La caída de la operatoria disciplinaria. Sociedad de control, nuevos modos de subjetivación, enseñanza y aprendizaje en la cultura digital. Transformación del Conocimiento."
      }
    ],
    methodology: "Trabajaremos centralmente con la bibliografía obligatoria de la materia, la docente se ocupará de la contextualización socio histórica de cada una de las principales categorías conceptuales. La modalidad de trabajo propuesta varía entre la exposición oral de la docente, el diálogo y el debate en pequeños grupos a partir del análisis de fuentes primarias.",
    evaluation: "Habrá tres instancias de evaluación individuales. La primera y la última serán domiciliarias. La segunda será una exposición oral en clase en modo debate. La nota final de la cursada será el promedio de las tres instancias. Promoción directa: alcanzar un 7 en cada instancia. Examen final: asistencia al 60% de las clases.",
    bibliography: [
      "Atwood, Margaret. El cuento de la criada. Ediciones Ibérica, Barcelona, 2023.",
      "Brailovsky, Daniel. (10/07/2018) ¿Qué hace la pedagogía y por qué es importante para los educadores?",
      "Durkheim, Émile. Capítulo I 'La Educación. Su naturaleza y papel' y Capítulo II 'Naturaleza y método de la Pedagogía'.",
      "Foucault, Michel. 'Los medios del buen encauzamiento' Apartado 2 del Capítulo 3. En: Vigilar y castigar.",
      "Pineau, Pablo. '¿Por qué triunfó la escuela? O la modernidad dijo: Esto es educación y la escuela respondió: Yo me ocupo'."
    ]
  },
  {
    id: "psicologia-educacional",
    name: "Psicología Educacional",
    career: "Profesorados de Matemática, Física, Historia, Lengua y Literatura y Filosofía",
    field: "Campo de Formación General",
    modality: "Asignatura",
    duration: "Cuatrimestral",
    shift: "Vespertino",
    hours: "4 horas cátedras semanales",
    professor: "Esp. Psp. Cristian Valenzuela",
    foundation: "La asignatura Psicología Educacional propone a docentes en formación construir herramientas de análisis para comprender los procesos de desarrollo de los sujetos de la educación del nivel así como sus procesos de construcción cognitiva. Buscaremos definir este campo disciplinar atendiendo al lugar privilegiado que logró adquirir durante la modernidad.",
    objectives: [
      "Desarrollen modelos de comprensión de los escenarios educativos actuales desde una mirada multicausal, contextual y ecológica.",
      "Identifiquen características psicoculturales del desarrollo en relación a la construcción de trayectos formativos.",
      "Reconozcan fundamentos e implicancias pedagógicas de teorías del aprendizaje constructivistas."
    ],
    units: [
      {
        title: "Unidad 1: Perspectiva epistemológica de la Psicología Educacional",
        description: "Orígenes de la Psicología Educacional. Relaciones entre psicología y educación: críticas al reduccionismo y al aplicacionismo. Fundamentos, alcances y relaciones. Una perspectiva psicológica contextualista y situacional. Constructivismo y transmisión cultural."
      },
      {
        title: "Unidad 2: Aportes al campo educativo desde la Psicología del Desarrollo",
        description: "Perspectiva de derechos para pensar las niñeces, adolescencias, adulteces jóvenes y mayores. Concepción lineal y adultocéntrica del desarrollo psicocultural. Ejes de la constitución subjetiva. El juego infantil como espacio de huella. Jóvenes, juventudes y adolescencias. Identidad y envejecimiento."
      },
      {
        title: "Unidad 3: El campo educativo como campo intersubjetivo: trayectorias, mediaciones y grupalidad",
        description: "La teoría socio-histórica vygotskiana: origen de los Procesos Psicológicos Superiores, instrumentos de mediación y Zona de Desarrollo Próximo. Trayectorias formativas: temporalidad, narración y pensamiento. La clase como grupo y la docencia como coordinación."
      }
    ],
    methodology: "Se diseñará una propuesta de enseñanza que tienda a la construcción de significados lógicos, psicológicos y sociales, y que ligue los bagajes de los/as estudiantes a los conocimientos presentados. Se propiciarán intercambios integradores de los nodos conceptuales presentados, y se buscará trazar relaciones entre las unidades temáticas.",
    evaluation: "1) Tareas para el abordaje de los materiales bibliográficos y audiovisuales que permitirán el seguimiento, el intercambio y la retroalimentación en clase. 2) Una evaluación sumativa escrita presencial e individual. Examen final: asistencia al 60% de las clases, un mínimo de dos parciales o sus respectivos recuperatorios aprobados con 4 o más.",
    bibliography: [
      "Baquero, R. (2001). La educabilidad bajo sospecha. Cuaderno de Pedagogía, Año IV, Nº 9, 71-85.",
      "Cimolai, S. (2022). La psicología educacional como campo de conocimientos. Historia, balances y miradas prospectivas.",
      "Prol, G. (2018a). Algunas puntuaciones conceptuales para pensar la psicología del desarrollo 1/2.",
      "Nicastro, S. y Greco, B. (2012a). Recorridos de la subjetividad. Trayectorias en el espacio de educar entre sujetos.",
      "Baquero, R. (1997). La Zona de Desarrollo Próximo y el análisis de las prácticas educativas."
    ]
  },
  {
    id: "taller-investigacion",
    name: "Taller de Investigación en Lengua y Literatura",
    career: "Profesorado de Educación Superior en Lengua y Literatura",
    field: "Campo de Formación Específica (CFE)",
    modality: "Taller",
    duration: "Cuatrimestral (1º cuatrimestre)",
    shift: "Vespertino",
    hours: "4 horas cátedra semanales",
    professor: "Melina Di Miro",
    foundation: "El taller de investigación en Lengua y Literatura, en el marco del trayecto de formación centrado en la práctica profesional, parte de la concepción de la investigación no solo como un proceso complejo de construcción de conocimiento, sino también como una práctica social y constructiva, reglada y situada sociohistóricamente.",
    objectives: [
      "Fomentar en los alumnos y las alumnas el desarrollo de competencias teóricas y prácticas específicas vinculadas con los procesos de investigación en ciencias sociales/humanas.",
      "Contribuir a la adquisición de estrategias de lectura y escritura académica que les permitan avanzar en los proyectos de investigación.",
      "Guiar a los alumnos y alumnas en la interiorización y apropiación de estrategias para el recorte del problema de investigación, el planteo de hipótesis y la formulación de objetivos.",
      "Ofrecer herramientas para la búsqueda, selección y análisis de fuentes primarias y secundarias.",
      "Acompañar a los y las estudiantes en el diseño y la formulación escrita de un proyecto de investigación."
    ],
    units: [
      {
        title: "UNIDAD 1: El conocimiento científico y la ciencia literaria",
        description: "Conocimiento científico y su diferencia con el saber común. Clasificación de las ciencias. Condiciones de posibilidad de la ciencia literaria. La teoría como condición de posibilidad de la investigación literaria."
      },
      {
        title: "UNIDAD 2: Diversidad de enfoques en la investigación científica",
        description: "Enfoques metodológicos cuantitativos y cualitativos. Diferencias entre investigación descriptiva e investigación explicativa. El análisis mixto. Fuentes primarias y fuentes secundarias."
      },
      {
        title: "UNIDAD 3: El proyecto de investigación y sus partes",
        description: "¿Qué es un proyecto de investigación? El proceso de investigación y las partes de un proyecto de investigación en ciencias sociales/humanas. Diferencia entre hipótesis e información; diferencia entre objetivos y propósitos."
      },
      {
        title: "UNIDAD 4: Escritura académica y escritura del proyecto de investigación",
        description: "Los géneros en la escritura académica: el informe, el ensayo, la monografía, la ponencia, el artículo científico y la tesis. Diseño del proyecto de investigación: Recortar un tema para delimitar un problema."
      }
    ],
    methodology: "El taller parte del supuesto pedagógico de que los procesos de investigación se desarrollan y perfeccionan tanto en su estudio y ejercitación interrelacionados y sostenidos como en su articulación con la reflexión y el conocimiento teórico. Se combinarán contenidos conceptuales y procedimentales.",
    evaluation: "Asistencia a clase (75%). Participación activa en clase. Producción y entrega de las actividades propuestas. Entrega del proyecto de investigación. Promoción directa: nota mínima 7 (siete). No puede darse en condición de libre.",
    bibliography: [
      "Bachelard, G. (1988). 'La noción del obstáculo epistemológico'.",
      "Eagleton, T. (1988). '¿Qué es la literatura?'.",
      "Bajtín, M. (1982). 'Hacia una metodología de las Ciencias Humanas'.",
      "Dalmaroni, M. (2020) 'El proyecto de investigación'.",
      "Cassany, D. (1995). La cocina de la escritura."
    ]
  },
  {
    id: "estudios-literarios",
    name: "Introducción a los estudios literarios",
    career: "Profesorado de Educación Superior en Lengua y Literatura",
    field: "Campo de la Formación Específica",
    modality: "Materia",
    duration: "Anual",
    shift: "Vespertino",
    hours: "3 horas cátedra semanales",
    professor: "Romina L. Vázquez",
    foundation: "La materia constituye una instancia fundamental en la formación de Profesores de Lengua y Literatura, pues, dado su carácter propedéutico, posibilita a los/as estudiantes adquirir las primeras herramientas conceptuales y metodológicas para el abordaje de 'lo literario' y la reflexión sobre la literatura en su dimensión sociohistórica y teórica. Sienta las bases de los saberes específicos sobre los estudios literarios que se profundizarán a lo largo de la carrera.",
    objectives: [
      "Conozcan el desarrollo y los cambios de los estudios literarios y sus problemáticas específicas.",
      "Incorporen el lenguaje técnico propio de los estudios literarios.",
      "Se inicien en el análisis e interpretación de diversos textos literarios.",
      "Elaboren hipótesis y planteen problemas a partir del trabajo teórico con un corpus literario determinado.",
      "Analicen críticamente y confronten diversas fuentes primarias y secundarias.",
      "Conozcan e integren las diversas estrategias y recursos de la exposición y argumentación en sus producciones."
    ],
    units: [
      {
        title: "Unidad 1. El concepto de literatura",
        description: "El concepto de literatura y la delimitación del campo literario. La literatura como producción cultural, social e histórica. Dimensiones de los estudios literarios: historia, teoría y crítica. La comunicación literaria. Los conceptos de obra, autor y lector."
      },
      {
        title: "Unidad 2. Los géneros literarios",
        description: "Los géneros discursivos y los géneros literarios. La teoría de los géneros discursivos. Historia y evolución de los géneros literarios. La división tripartita de Aristóteles: lírica, épica y dramática. Una tipología contemporánea de los géneros literarios."
      },
      {
        title: "Unidad 3. La lírica",
        description: "Introducción al estudio de la poesía: definiciones y concepciones. Las funciones del lenguaje. La función poética. Nociones de versificación: métrica, ritmo y rima. El lenguaje poético. Poesía y léxico. Las figuras retóricas. El yo poético."
      },
      {
        title: "Unidad 4. La obra dramática",
        description: "Introducción al estudio del teatro. El teatro como género literario y performativo. Texto primario y texto secundario (didascalias). La puesta en escena y la noción de convivio. La unidad clásica del género dramático. El teatro clásico griego y latino."
      },
      {
        title: "Unidad 5. La narrativa",
        description: "La narración. Los componentes de la secuencia narrativa. Narración, historia y relato. Estructura y funciones del relato. Elementos básicos de narratología para el análisis del relato. El tiempo del relato: orden, duración y frecuencia. Modo y voz."
      },
      {
        title: "Unidad 6. Periodización y canon literario",
        description: "El sistema literario y su dinamismo. La noción de período literario. Criterios para la periodización literaria. La historia literaria y la historia de la literatura. El canon literario argentino. La escuela y el canon."
      }
    ],
    methodology: "Se tendrá en cuenta una variedad de prácticas orientadas a fomentar la construcción colectiva del conocimiento, a partir del desarrollo de actividades individuales y grupales tendientes a poner en práctica las herramientas de análisis literario adquiridas. Los/as estudiantes también producirán textos académicos orales y escritos.",
    evaluation: "La evaluación será permanente: participación y desempeño en clase; compromiso con la asignatura; habilidad para relacionar conocimientos e ideas. Dos exámenes parciales, un trabajo práctico y un trabajo integrador final. Promoción: 75% asistencia y promedio >= 7. Examen final: 60% asistencia y promedio 4-6.",
    bibliography: [
      "BARTHES, R. (1994). 'Escribir la lectura', 'Sobre la lectura', 'La muerte del autor'.",
      "CULLER, J. (2004). '¿Qué es la teoría?', '¿Qué es la literatura, y qué importa lo que sea?'.",
      "ARISTÓTELES (2004). Poética. Buenos Aires: Colihue.",
      "BAJTIN, Mijail. (1998). 'El problema de los géneros discursivos'.",
      "EAGLETON, T. (2010). Cómo leer un poema. Madrid: Akal."
    ]
  }
];
