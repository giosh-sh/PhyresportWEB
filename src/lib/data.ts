export const siteConfig = {
  name: "Phyresport",
  fullName: "Phyresport & Nutrición",
  description:
    "Centro de fisioterapia deportiva, osteopatía y rehabilitación en Santa Cruz de Tenerife. Especialistas en EPI Ecoguiada.",
  url: "https://www.phyresport.com",
  phone: "664 01 66 79",
  phoneHref: "tel:664016679",
  whatsapp: "34664016679",
  whatsappHref: "https://wa.me/34664016679",
  whatsappBookingHref:
    "https://wa.me/34664016679?text=Hola%2C%20me%20gustar%C3%ADa%20reservar%20una%20valoraci%C3%B3n%20en%20Phyresport.",
  email: "info@phyresport.com",
  address: {
    street: "Calle Domingo Pérez MiniK, 35",
    city: "38006 Santa Cruz de Tenerife",
    region: "Islas Canarias, España",
  },
  hours: "Lunes a Viernes: 10:00 – 21:00",
  cif: "B76702653",
  social: {
    facebook: "https://www.facebook.com/Phyresport-1695151087369065/",
  },
  logo: "https://www.phyresport.com/images/Logos/LogoPhyresport.png",
  bonificaTuCurso:
    "https://www.bonificatucurso.com/centros/phyresport",
} as const;

export const services = [
  {
    slug: "fisioterapia",
    title: "Fisioterapia — EPI Ecoguiada",
    shortTitle: "Fisioterapia",
    eyebrow: "Técnica EPI® Ecoguiada",
    image: "https://www.phyresport.com/images/Servicios/slide5_03.png",
    icon: "activity",
    description:
      "Electrólisis percutánea intratisular guiada por ecografía. Tratamiento de tendinopatías y lesiones musculoesqueléticas con control en tiempo real.",
    content: {
      intro:
        "Los tendones juegan un papel esencial en el sistema músculo-esquelético mediante la transferencia de cargas de tracción desde el músculo al hueso a fin de permitir movimientos en la articulación y estabilizar las articulaciones.",
      sections: [
        {
          title: "¿Qué es la técnica EPI®?",
          text: "La técnica EPI® consiste en la aplicación de corriente contínua (CC) a través de una aguja de acupuntura que actúa como electrodo negativo (cátodo) y que, mediante control ecográfico, va a provocar una reacción electroquímica en la región degenerada del tendón y/o cualquier patología del tejido blando.",
        },
        {
          title: "Objetivo principal",
          text: "Producir un cambio en la configuración molecular del tejido blando afectado, bien sea tendinopatías, lesiones musculares o lesiones ligamentosas. El trasvase del flujo catódico produce una reacción química que normaliza el pH haciendo compatible el metabolismo anabólico del tejido afectado.",
        },
        {
          title: "Patologías tratadas",
          text: "Tendinopatía de Aquiles, tendinopatía rotuliana, fascitis plantar, epicondilitis, síndrome de la cintilla iliotibial, pubalgias, lesiones musculares, síndrome del túnel carpiano, fibrosis musculares, puntos de gatillo miofascial, lesiones de ligamentos y tendinopatías de tendones sinoviales.",
        },
      ],
    },
    source: "Dr. Jose Manuel Sánchez-Ibáñez — www.cerede.es" as string | undefined,
  },
  {
    slug: "terapia-manual",
    title: "Terapia Manual y Manipulación de la Fascia",
    shortTitle: "Terapia Manual",
    eyebrow: "Método Luigi Stecco",
    image: "https://www.phyresport.com/images/Servicios/slide1_02.png",
    icon: "hand",
    description:
      "Manipulación de la fascia según el método Luigi Stecco. Tratamiento de disfunciones musculoesqueléticas con técnicas manuales avanzadas.",
    content: {
      intro:
        "La Manipulación de la Fascia es una terapia manual desarrollada por Luigi Stecco, fisioterapeuta del norte de Italia. Este método ha evolucionado en los últimos 30 años gracias al estudio y a la práctica clínica en el tratamiento de innumerables casos de problemas músculo-esqueléticos.",
      sections: [
        {
          title: "El sistema miofascial",
          text: "Esta terapia va dirigida a la fascia, en particular a la fascia profunda muscular, incluyendo el epimisio y los retináculos, y considera que el sistema miofascial es una continuidad tridimensional. El cuerpo se divide en 14 segmentos, cada uno gestionado por seis unidades miofasciales.",
        },
        {
          title: "Centros de Coordinación",
          text: "Las tracciones musculares convergen en puntos precisos llamados Centros de Coordinación (CC). La localización de cada CC se calcula teniendo en cuenta la suma de las fuerzas vectoriales que actúan durante la ejecución de cada movimiento.",
        },
        {
          title: "Propiocepción y control motor",
          text: "La fascia profunda es una estructura ideal para percibir y asistir en la organización de los movimientos. Cualquier dificultad en el deslizamiento de la fascia puede alterar la información aferente, provocando movimientos incoordinados.",
        },
      ],
    },
    source: undefined,
  },
  {
    slug: "descompresion-muscular",
    title: "Descompresión Muscular",
    shortTitle: "Descompresión",
    eyebrow: "Tratamiento con dispositivo",
    image: "/img/Muscle Descompresion.jpeg",
    icon: "waves",
    description:
      "El dispositivo de Descompresión Muscular para un tratamiento muscular preciso y profundo.",
    content: {
      intro:
        "La Descompresión Muscular es un tratamiento que combina tracción y descompresión controlada del tejido para liberar tensiones, mejorar la circulación y favorecer la recuperación muscular.",
      sections: [
        {
          title: "¿En qué consiste?",
          text: "Mediante un dispositivo específico se aplican fuerzas de descompresión controladas sobre el tejido muscular, favoreciendo la liberación de adherencias, la mejora del flujo sanguíneo y la recuperación de la movilidad.",
        },
        {
          title: "Indicaciones",
          text: "Contracturas, sobrecargas musculares, recuperación post-esfuerzo, dolor miofascial y tratamientos de recuperación muscular en deportistas y población activa.",
        },
      ],
    },
    source: undefined,
  },
] as const;

export type Service = (typeof services)[number];

export const team = [
  {
    slug: "javier-adrian-gonzalvez-fernandez",
    name: "Javier A. Gonzálvez",
    fullName: "Javier Adrián Gonzálvez Fernández",
    role: "Director — Fisioterapeuta",
    phone: "",
    image: "https://www.phyresport.com/images/Equipo/JaviV1.png",
    description:
      "Profesor de EPI®. Máster en Fisioterapia Deportiva y Osteopatía. Fisioterapeuta de la selección española de squash.",
    credentials: [
      "Diplomado en Fisioterapia — Colegiado 1751",
      "Profesor de la técnica EPI®",
      "Máster en Fisioterapia Deportiva",
      "Máster en Osteopatía por la EOM",
      "Profesor de Ecografía para Vinno Spain",
      "Fisioterapeuta de la selección española de squash",
      "Profesor de postgrado de fisioterapia Invasiva UCAM",
    ],
  },
  {
    slug: "ruth-gutierrez-gonzalez",
    name: "Ruth Gutiérrez",
    fullName: "Ruth Gutiérrez González",
    role: "Fisioterapeuta",
    phone: "696 86 37 06",
    image: "https://www.phyresport.com/images/Equipo/RuthV1.png",
    description:
      "Especialista en terapia manual ortopédica y manipulación fascial según el método Stecco.",
    credentials: [
      "Grado de Fisioterapia — Colegiada 2404",
      "Máster en Terapia Manual Ortopédica",
      "EPI® Nivel 1",
      "Manipulación Fascial (Stecco) nivel",
    ],
  },
  {
    slug: "francisco-javier-marichal-garcia",
    name: "Francisco J. Marichal",
    fullName: "Francisco Javier Marichal García",
    role: "Fisioterapeuta",
    phone: "682 88 64 23",
    image: "https://www.phyresport.com/images/Equipo/FranciscoJavierV1.png",
    description:
      "Formación en técnicas invasivas y ecografía musculoesquelética. Enfoque basado en evidencia.",
    credentials: [],
  },
  {
    slug: "elisa-rodriguez-lapido",
    name: "Elisa Rodríguez",
    fullName: "Elisa Rodríguez Lápido",
    role: "Fisioterapeuta",
    phone: "747 86 78 37",
    image: "https://www.phyresport.com/images/Equipo/3206.png",
    description:
      "Especializada en terapia fascial y tratamiento de patologías crónicas del aparato locomotor.",
    credentials: [],
  },
  {
    slug: "maria-pinto-diaz",
    name: "María Pinto",
    fullName: "María Pinto Díaz",
    role: "Nutrición clínica y readaptación",
    phone: "649 00 32 72",
    image: "/img/image_0eeea3.png",
    description:
      "Nutrición clínica en Oncología y valoración morfofuncional (pacientes desnutridos).",
    credentials: [
      "Máster Readaptación de Lesiones y Entrenamiento",
      "Técnico superior en dietética y nutrición",
    ],
  },
  {
    slug: "orestes-santiago-rodriguez-hernandez",
    name: "Orestes Santiago",
    fullName: "Orestes Santiago Rodríguez Hernández",
    role: "Fisioterapeuta",
    phone: "636 52 17 97",
    image: "https://www.phyresport.com/images/Equipo/Orestes.jpg",
    description:
      "Formación en fisioterapia deportiva y técnicas manuales. Atención centrada en el retorno seguro al deporte.",
    credentials: [],
  },
  {
    slug: "luis-garcia-garcia-faria",
    name: "Luis G. García Faria",
    fullName: "Luis Garcia Garcia Faria",
    role: "Fisioterapeuta",
    phone: "651 95 10 00",
    image: "https://www.phyresport.com/images/Equipo/Luis.jpg",
    description: "Fisioterapeuta especializado en rehabilitación deportiva.",
    credentials: [],
  },
] as const;

export type TeamMember = (typeof team)[number];

export const founderExperience = {
  slug: "javier-adrian-gonzalvez-fernandez",
  title: "Más de 15 años a la vanguardia de la fisioterapia avanzada",
  text: "Javier Adrián González Fernández es profesor del Grupo EPI Advanced desde 2014 y uno de los pioneros en Canarias en la aplicación de la electrólisis percutánea del Grupo EPI, técnica que incorporó a su práctica clínica desde 2010. Fue además uno de los primeros profesionales en Canarias en apostar por esta tecnología, acumulando una amplia experiencia clínica y docente en fisioterapia avanzada y tratamiento del dolor y Fisioterapeuta de la selección española de Squash.",
} as const;

export const courses = [
  {
    slug: "epi-en-neuroeje",
    title: "EPI en Neuroeje",
    date: "Septiembre 2026",
    image:
      "https://www.phyresport.com/images/Cursos/Curso_EcografiaNeuroeje_Septiembre2026_m.jpg",
    imageFull:
      "https://www.phyresport.com/images/Cursos/Curso_EcografiaNeuroeje_Septiembre2026.jpg",
    programPdf:
      "https://www.phyresport.com/images/Cursos/Curso_EcografiaNeuroeje_Septiembre2026_Programa.pdf",
    description:
      "Ecografía aplicada al neuroeje y técnicas de electrólisis percutánea para el tratamiento de patologías del sistema nervioso periférico.",
  },
  {
    slug: "epi-nivel-i-para-fisioterapeutas",
    title: "EPI Nivel I para Fisioterapeutas",
    date: "Octubre 2026",
    image:
      "https://www.phyresport.com/images/Cursos/Curso_EPI_NIVEL_I_FisioTerapeutas_Octubre2026_m.jpg",
    imageFull:
      "https://www.phyresport.com/images/Cursos/Curso_EPI_NIVEL_I_FisioTerapeutas_Octubre2026.jpg",
    programPdf:
      "https://www.phyresport.com/images/Cursos/Curso_EPI_NIVEL_I_FisioTerapeutas_Octubre2026_Programa.pdf",
    description:
      "Curso introductorio a la técnica EPI® Ecoguiada. Fundamentos teóricos y práctica clínica con supervisión directa.",
  },
] as const;

export const products = [
  {
    slug: "dispositivo-epi-pb3s",
    title: "Dispositivo EPI®-PB3S",
    image: "/img/EPI.jpeg",
    description:
      "Dispositivo profesional para la aplicación de la técnica EPI® con sistema PB3S de corriente pulsada.",
    catalogPdf: "https://www.phyresport.com/pdf/Dispositivos/CatalogoEPI PB3S.pdf",
  },
  {
    slug: "salus-talent-pro",
    title: "Salus Talent Pro",
    image: "https://www.phyresport.com/images/Productos/salus-talent-pro-sanro_00.jpg",
    description: "Equipo de radiofrecuencia para terapia física profunda.",
    catalogPdf: undefined,
  },
  {
    slug: "doctor-tecar-plus",
    title: "Doctor Tecar Plus",
    image: "https://www.phyresport.com/images/Productos/DoctorTecarPlus01.png",
    description: "Dispositivo de terapia Tecar para tratamiento de patologías musculoesqueléticas.",
    catalogPdf: undefined,
  },
  {
    slug: "impactis-m",
    title: "IMPACTIS M+",
    image: "https://www.phyresport.com/images/Productos/impactisM01.jpg",
    description: "Dispositivo de ondas de choque focales para tratamiento de tendinopatías y calcificaciones.",
    catalogPdf: undefined,
  },
] as const;

export const objectives = [
  {
    number: "01",
    title: "Prevención de lesiones",
    text: "El fisioterapeuta evaluará el riesgo de lesiones asociado a la participación de los deportistas en deportes específicos o en contextos de actividad física determinados.",
  },
  {
    number: "02",
    title: "Intervención aguda",
    text: "Respuesta apropiada en la lesión aguda o enfermedad, tanto en la competición como en el entrenamiento, con la coordinación previa con otros profesionales.",
  },
  {
    number: "03",
    title: "Rehabilitación",
    text: "Razonamiento clínico y competencias terapéuticas para realizar el diagnóstico y tratamiento fisioterápico en las lesiones relacionadas con el deporte.",
  },
  {
    number: "04",
    title: "Mejora del rendimiento",
    text: "Evaluación del perfil físico y de rendimiento para optimizar las condiciones para el máximo rendimiento en un deporte específico.",
  },
  {
    number: "05",
    title: "Estilo de vida activo",
    text: "Colaboración con otros profesionales para promover la participación segura en deportes y actividades para personas de todas las habilidades.",
  },
  {
    number: "06",
    title: "Aprendizaje continuo",
    text: "Mantenimiento e incremento de competencias clínicas mediante posición crítica, reflexiva y basada en la evidencia.",
  },
] as const;
