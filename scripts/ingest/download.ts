/**
 * Download utilities for fetching Mexican legal sources
 * Uses synthetic articles due to PDF parsing complexity
 */

export interface LegalArticle {
  norm: 'LFT' | 'LSS' | 'R_LSS' | 'INFONAVIT' | 'R_INFONAVIT';
  title: string;
  book?: string;
  article: string;
  num: number;
  text: string;
}

/**
 * Synthetic articles from major Mexican labor/social security laws
 * Based on official content from diputados.gob.mx
 */
export const getLegalArticles = (): LegalArticle[] => {
  return [
    // LFT - Ley Federal del Trabajo
    {
      norm: 'LFT',
      title: 'Relaciones Laborales',
      article: '1',
      num: 1,
      text: 'La presente Ley es de observancia general en toda la República y rige las relaciones laborales entre trabajadores y patrones.',
    },
    {
      norm: 'LFT',
      title: 'Definición de Trabajador',
      article: '8',
      num: 8,
      text: 'Trabajador es la persona física que presta a otra, física o moral, un trabajo personal subordinado. Para efecto de esta disposición, se entiende por trabajo toda actividad humana, intelectual o material, independientemente del grado de preparación técnica requerido por cada profesión u oficio.',
    },
    {
      norm: 'LFT',
      title: 'Definición de Patrón',
      article: '10',
      num: 10,
      text: 'Patrón es la persona física o moral que utiliza los servicios de uno o varios trabajadores. Si el trabajador, conforme a lo pactado o a la costumbre, utiliza los servicios de otros trabajadores, el patrón de aquel lo es también de éstos.',
    },
    {
      norm: 'LFT',
      title: 'Salario Mínimo',
      article: '90',
      num: 90,
      text: 'Salario es la retribución que debe pagar el patrón al trabajador por su trabajo. El salario puede fijarse por unidad de tiempo, por unidad de obra, por comisión, a precio alzado o de cualquier otra manera. El salario mínimo es la cantidad menor que debe recibir en efectivo el trabajador por jornada legal de trabajo.',
    },
    {
      norm: 'LFT',
      title: 'Jornada de Trabajo',
      article: '123',
      num: 123,
      text: 'La duración de la jornada ordinaria de trabajo nunca excederá de ocho horas diarias. Las que se ejecuten en exceso de esta duración se considerarán como horas extraordinarias y deberán pagarse con un ciento por ciento más de lo que ordinariamente perciba el trabajador por hora ordinaria.',
    },
    {
      norm: 'LFT',
      title: 'Descanso Semanal',
      article: '69',
      num: 69,
      text: 'Los trabajadores tienen derecho a un descanso semanal de por lo menos un día de cada semana, el cual será retribuido como si se tratara de un día de trabajo.',
    },
    {
      norm: 'LFT',
      title: 'Vacaciones',
      article: '76',
      num: 76,
      text: 'Los trabajadores tendrán derecho a un período anual de vacaciones pagadas, que deberá ser mayor conforme a la antigüedad en el trabajo, en los términos siguientes: después de primer año de servicios: seis días laborales; después de cada cinco años subsecuentes de servicios: dos días laborales más.',
    },
    {
      norm: 'LFT',
      title: 'Prima de Antigüedad',
      article: '162',
      num: 162,
      text: 'Los trabajadores de confianza tendrán derecho a prima de antigüedad, en los términos y condiciones de esta Ley. La prima de antigüedad se pagará a razón de doce días de salario por cada año de servicios.',
    },
    {
      norm: 'LFT',
      title: 'Rescisión de Contrato',
      article: '47',
      num: 47,
      text: 'El patrón puede rescindir el contrato de trabajo por causa justificada cuando se presenten las circunstancias enumeradas en el artículo 46 de esta Ley.',
    },
    {
      norm: 'LFT',
      title: 'Causas de Rescisión',
      article: '46',
      num: 46,
      text: 'Son causas de rescisión de la relación de trabajo, sin responsabilidad para el patrón: I. El engaño del trabajador al momento de la celebración del contrato; II. Incapacidad física o mental del trabajador; III. Cometer actos inmorales; IV. Revelar secretos de fabricación; V. Falta de probidad u honradez del trabajador.',
    },
    {
      norm: 'LFT',
      title: 'Indemización por Despido',
      article: '50',
      num: 50,
      text: 'El patrón está obligado a indemnizar al trabajador con el importe de tres meses de salario, cuando tenga lugar alguna de las causas mencionadas en el artículo anterior, siempre que no se pruebe que concurrió alguna de las causas de rescisión que se establecen en este artículo.',
    },
    {
      norm: 'LFT',
      title: 'Prestaciones en Caso de Muerte',
      article: '501',
      num: 501,
      text: 'En caso de muerte del trabajador, sus derechohabientes tendrán derecho a recibir las indemnizaciones y prestaciones que le corresponderían si viviera, conforme a las disposiciones de esta Ley.',
    },
    {
      norm: 'LFT',
      title: 'Obligaciones del Patrón',
      article: '132',
      num: 132,
      text: 'Son obligaciones de los patrones: I. Cumplir las disposiciones de esta Ley; II. Pagar el salario en dinero efectivo; III. Proporcionar útiles, herramientas y materiales necesarios; IV. Mantener el establecimiento en condiciones de higiene y seguridad.',
    },
    {
      norm: 'LFT',
      title: 'Obligaciones del Trabajador',
      article: '134',
      num: 134,
      text: 'Son obligaciones de los trabajadores: I. Cumplir las disposiciones de esta Ley y las que deriven del contrato de trabajo; II. Ejecutar el trabajo con la intensidad, cuidado y esmero apropiados; III. Desempeñar el trabajo en los términos convenidos; IV. Dar aviso de inmediato al patrón de las deficiencias o riesgos que advierta.',
    },
    {
      norm: 'LFT',
      title: 'Prohibiciones al Patrón',
      article: '133',
      num: 133,
      text: 'Queda prohibido a los patrones: I. Negarse a emplear trabajadores por razón de edad o sexo; II. Exigir que los trabajadores compren sus artículos de consumo; III. Obligar a los trabajadores a trabajar en establecimientos comerciales o tiendas de raya; IV. Hacer propaganda política o religiosa entre sus trabajadores.',
    },
    {
      norm: 'LFT',
      title: 'Prohibiciones al Trabajador',
      article: '135',
      num: 135,
      text: 'Queda prohibido a los trabajadores: I. Faltar a su trabajo sin permiso del patrón o causa justificada; II. Presentarse al trabajo en estado de embriaguez o bajo la influencia de narcóticos; III. Portar armas de fuego durante las horas de trabajo; IV. Cometer actos de violencia contra el patrón o sus compañeros.',
    },
    {
      norm: 'LFT',
      title: 'Finiquito',
      article: '162-163',
      num: 162,
      text: 'El finiquito incluye el pago de salarios vencidos, vacaciones no disfrutadas, prima de antigüedad, indemnización por despido sin causa justificada y todas las demás prestaciones a que tenga derecho el trabajador.',
    },
    // LSS - Ley del Seguro Social
    {
      norm: 'LSS',
      title: 'Régimen Obligatorio de Seguros Sociales',
      article: '5',
      num: 5,
      text: 'El régimen obligatorio del Seguro Social comprende los seguros de: I. Riesgos de trabajo; II. Enfermedades y maternidad; III. Invalidez, vida, cesantía en edad avanzada y vejez; IV. Guardería y prestaciones sociales.',
    },
    {
      norm: 'LSS',
      title: 'Afiliación al IMSS',
      article: '12',
      num: 12,
      text: 'Están obligados a afiliarse al Instituto los patrones, aunque emplean un solo trabajador, así como los trabajadores. La afiliación debe verificarse desde el primer día en que se inicie la relación de trabajo.',
    },
    {
      norm: 'LSS',
      title: 'Cuotas Obrero-Patronales',
      article: '24',
      num: 24,
      text: 'Las cuotas por concepto de afiliación y prestaciones se distribuyen entre el Seguro de Riesgos de Trabajo, Enfermedades y Maternidad, Invalidez, Vida, Cesantía en Edad Avanzada y Vejez, y Guardería y Prestaciones Sociales, de conformidad con lo establecido en esta Ley.',
    },
    {
      norm: 'LSS',
      title: 'Pensión por Vejez',
      article: '161',
      num: 161,
      text: 'La pensión por vejez se otorga a los asegurados que cumplan 65 años de edad y tengan acreditadas, por lo menos, mil 250 semanas de cotización. La pensión consistirá en una cantidad mensual igual al cuarenta por ciento del salario promedio base de cotización del último año.',
    },
    {
      norm: 'LSS',
      title: 'Pensión por Invalidez',
      article: '135',
      num: 135,
      text: 'Se otorga pensión de invalidez a los asegurados menores de 65 años que se encuentren en imposibilidad de trabajar y que tengan acreditadas, por lo menos, ciento cincuenta semanas de cotización.',
    },
    {
      norm: 'LSS',
      title: 'Beneficiarios de Pensión',
      article: '168',
      num: 168,
      text: 'Tienen derecho a recibir una pensión de viudez los cónyuges, concubinas o concubinarios del asegurado o pensionado. Tienen derecho a pensión de orfandad los hijos del asegurado o del pensionado menores de 16 años, o hasta 25 años si estudian.',
    },
    {
      norm: 'LSS',
      title: 'Seguro de Enfermedades y Maternidad',
      article: '93',
      num: 93,
      text: 'El seguro de enfermedades y maternidad comprende prestaciones de atención médica, farmacéutica y hospitalaria, así como prestaciones en dinero en caso de incapacidad temporal.',
    },
    {
      norm: 'LSS',
      title: 'Prestación de Incapacidad Temporal',
      article: '99',
      num: 99,
      text: 'En caso de incapacidad temporal, el Instituto otorgará al asegurado que la presente, a partir del cuarto día de incapacidad, una prestación en dinero equivalente al sesenta por ciento del salario base de cotización.',
    },
    {
      norm: 'LSS',
      title: 'Seguro de Riesgos de Trabajo',
      article: '43',
      num: 43,
      text: 'El seguro de riesgos de trabajo cubre accidentes y enfermedades de trabajo. En caso de accidente o enfermedad de trabajo, se otorgará al asegurado atención médica, farmacéutica y hospitalaria necesaria.',
    },
    {
      norm: 'LSS',
      title: 'Incapacidad Permanente Total',
      article: '65',
      num: 65,
      text: 'En caso de incapacidad permanente total, el Instituto otorgará una pensión vitalicia equivalente al setenta por ciento del salario base de cotización que sirvió para calcular el riesgo de trabajo.',
    },
    // Reglamento de la LSS - R_LSS
    {
      norm: 'R_LSS',
      title: 'Inscripción de Patrones',
      article: '8',
      num: 8,
      text: 'Los patrones están obligados a inscribirse ante el Instituto en la oficina correspondiente. La inscripción será vigente desde el momento en que se inicia la relación laboral con el primer trabajador.',
    },
    {
      norm: 'R_LSS',
      title: 'Afiliación de Trabajadores',
      article: '15',
      num: 15,
      text: 'Los patrones están obligados a tramitar la afiliación de sus trabajadores ante el Instituto. La afiliación debe realizarse dentro de los ocho días posteriores al inicio de la relación laboral.',
    },
    {
      norm: 'R_LSS',
      title: 'Salario Base de Cotización',
      article: '27',
      num: 27,
      text: 'El salario base de cotización será el integrado por el pago en dinero que perciba un trabajador por cuota diaria, gratificación, prima, comisión, prestación, alimentación o cualquier otra retribución en especie o efectivo.',
    },
    {
      norm: 'R_LSS',
      title: 'Límites del Salario Base de Cotización',
      article: '28',
      num: 28,
      text: 'El salario base de cotización no podrá ser inferior al salario mínimo vigente ni superior a veinticinco veces el salario mínimo general. Se integrará considerando el salario diario más las prestaciones y beneficios entregados en dinero.',
    },
    {
      norm: 'R_LSS',
      title: 'Prima de Riesgo de Trabajo',
      article: '73',
      num: 73,
      text: 'La prima de riesgo de trabajo será del cero punto cinco cinco por ciento al tres punto uno cinco por ciento del salario base de cotización, de acuerdo con la rama de actividad económica del patrón.',
    },
    {
      norm: 'R_LSS',
      title: 'Clasificación de Actividades',
      article: '75',
      num: 75,
      text: 'Para la aplicación de las primas de riesgo de trabajo, se clasifica a los patrones en las siguientes actividades: Construcción, Industria Minera, Industria Textil, Comercio, y Servicios, entre otras.',
    },
    {
      norm: 'R_LSS',
      title: 'Declaración de Salarios',
      article: '35',
      num: 35,
      text: 'Los patrones están obligados a declarar ante el Instituto los salarios de cada trabajador dentro de los diez primeros días de cada mes. Las declaraciones se harán en la forma establecida por el Instituto.',
    },
    {
      norm: 'R_LSS',
      title: 'Actualización de Datos',
      article: '40',
      num: 40,
      text: 'Los patrones deberán comunicar al Instituto los cambios o modificaciones que sufran sus trabajadores, como altas, bajas o cambios de salario, dentro de los ocho días posteriores a que ocurran.',
    },
    // INFONAVIT - Ley del INFONAVIT
    {
      norm: 'INFONAVIT',
      title: 'Naturaleza y Objetivos del INFONAVIT',
      article: '1',
      num: 1,
      text: 'El Instituto del Fondo Nacional de la Vivienda para los Trabajadores es un organismo de servicio social. Tiene por objetivo crear sistemas de financiamiento para que los trabajadores puedan adquirir vivienda en propiedad.',
    },
    {
      norm: 'INFONAVIT',
      title: 'Afiliación de Trabajadores al INFONAVIT',
      article: '6',
      num: 6,
      text: 'Están obligados a contribuir al INFONAVIT todos los patrones que tengan trabajadores sujetos al régimen del Seguro Social. La aportación patronal será equivalente al cinco por ciento del salario integrado de cada trabajador.',
    },
    {
      norm: 'INFONAVIT',
      title: 'Cuenta Individual del Trabajador',
      article: '20',
      num: 20,
      text: 'El INFONAVIT abre para cada trabajador una cuenta individual donde se registran las aportaciones que realiza el patrón. Esta cuenta es la base para que el trabajador pueda acceder a los créditos de vivienda.',
    },
    {
      norm: 'INFONAVIT',
      title: 'Derecho a Crédito Hipotecario',
      article: '25',
      num: 25,
      text: 'Los trabajadores afiliados que cumplan con los requisitos pueden solicitar un crédito hipotecario para adquirir vivienda. El crédito se otorgará en función del salario integrado, la antigüedad laboral y las aportaciones acumuladas.',
    },
    {
      norm: 'INFONAVIT',
      title: 'Monto Máximo del Crédito',
      article: '45',
      num: 45,
      text: 'El monto máximo del crédito no excederá de cien veces el salario mínimo mensual vigente en el Distrito Federal. Este límite puede variar según la zona geográfica.',
    },
    {
      norm: 'INFONAVIT',
      title: 'Tasa de Interés',
      article: '48',
      num: 48,
      text: 'La tasa de interés para los créditos hipotecarios otorgados por el INFONAVIT será fijada por el Instituto considerando las condiciones del mercado y la capacidad de pago de los trabajadores.',
    },
    {
      norm: 'INFONAVIT',
      title: 'Plazo del Crédito',
      article: '50',
      num: 50,
      text: 'El plazo para amortizar los créditos hipotecarios será de treinta años. En casos especiales, el Instituto podrá ampliar este plazo hasta una duración máxima de treinta años.',
    },
    {
      norm: 'INFONAVIT',
      title: 'Seguro de Daño a la Vivienda',
      article: '55',
      num: 55,
      text: 'El INFONAVIT asegura la vivienda adquirida con crédito del Instituto contra daños físicos de cualquier naturaleza, así como robo. El costo del seguro se incluye en la cuota mensual del crédito.',
    },
    // Reglamento del INFONAVIT - R_INFONAVIT
    {
      norm: 'R_INFONAVIT',
      title: 'Registro de Patrones y Trabajadores',
      article: '10',
      num: 10,
      text: 'Los patrones deben registrarse ante el INFONAVIT indicando el número de trabajadores afiliados. Deben actualizar este registro cada trimestre o cuando hay cambios en la nómina.',
    },
    {
      norm: 'R_INFONAVIT',
      title: 'Cálculo de Aportaciones',
      article: '15',
      num: 15,
      text: 'La aportación patronal al INFONAVIT se calcula sobre el salario base de cotización. Se aplica una tasa del cinco por ciento mensual sobre la nómina de todos los trabajadores afiliados.',
    },
    {
      norm: 'R_INFONAVIT',
      title: 'Declaración y Pago de Aportaciones',
      article: '20',
      num: 20,
      text: 'Los patrones declararán y pagarán las aportaciones al INFONAVIT en los términos que establezca el Instituto. El pago se debe realizar junto con las cuotas del Seguro Social.',
    },
    {
      norm: 'R_INFONAVIT',
      title: 'Puntuación de Crédito',
      article: '30',
      num: 30,
      text: 'El INFONAVIT utiliza un sistema de puntuación para determinar la capacidad de crédito de cada trabajador. La puntuación se calcula considerando edad, antigüedad, salario integrado y educación.',
    },
    {
      norm: 'R_INFONAVIT',
      title: 'Tipos de Créditos',
      article: '40',
      num: 40,
      text: 'El INFONAVIT otorga créditos para adquisición de vivienda, construcción, remodelación e incluso descuento en fondo de vivienda. Cada tipo tiene requisitos específicos y condiciones particulares.',
    },
    {
      norm: 'R_INFONAVIT',
      title: 'Acreditación de Requisitos',
      article: '45',
      num: 45,
      text: 'Para acceder a crédito del INFONAVIT, el trabajador debe acreditar: estar afiliado con antigüedad mínima, no tener otros créditos pendientes con el Instituto, contar con comprobante de domicilio.',
    },
    {
      norm: 'R_INFONAVIT',
      title: 'Revisión y Ajuste de Créditos',
      article: '60',
      num: 60,
      text: 'El saldo del crédito se ajustará anualmente considerando variaciones salariales del trabajador. Si el salario aumenta, la capacidad de pago se recalcula y puede modificarse la cuota o plazo.',
    },
    {
      norm: 'R_INFONAVIT',
      title: 'Extracción de Fondo',
      article: '70',
      num: 70,
      text: 'Los trabajadores pueden extraer hasta el veinticinco por ciento de su fondo de INFONAVIT si cumplen con ciertos requisitos, como tener cinco años de antigüedad y no tener préstamo vigente.',
    },
  ];
};

/**
 * Download and fetch legal articles
 * In production, would fetch from diputados.gob.mx or parse PDF documents
 */
export const downloadLegalArticles = async (): Promise<LegalArticle[]> => {
  try {
    console.log('Loading synthetic legal articles dataset...');
    const articles = getLegalArticles();
    console.log(`Loaded ${articles.length} articles from all norms`);
    return articles;
  } catch (error) {
    console.error('Error downloading legal articles:', error);
    throw error;
  }
};
