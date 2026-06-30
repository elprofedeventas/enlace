// ENLACE - texto y version del consentimiento LOPDP (Ecuador, Art. 12).
// ENLACE capta datos personales de TERCEROS (los invitados de la pareja), que
// NO tienen cuenta. Por eso el formulario de RSVP exige un checkbox NO premarcado
// y se guarda el registro del consentimiento junto con la respuesta.

export const CONSENTIMIENTO_VERSION = '2026-06-29';

export const POLITICA_TITULO = 'Politica de Privacidad y Tratamiento de Datos';

// Secciones del texto legal. El responsable del tratamiento es Nueva Orbita
// (operadora del producto, "Inspiracion by Romina Ordonez"); Google/Firebase
// actuan como encargados (transferencia internacional).
export const POLITICA_SECCIONES: { titulo: string; cuerpo: string }[] = [
  {
    titulo: '1. Quien es el responsable',
    cuerpo:
      'ENLACE es un producto operado por Nueva Orbita ("Inspiracion by Romina Ordonez"), responsable del tratamiento. La pareja anfitriona usa la plataforma para organizar su boda. Las consultas sobre tus datos se dirigen al correo de contacto indicado por la operadora.',
  },
  {
    titulo: '2. Que datos se tratan',
    cuerpo:
      'Al confirmar tu asistencia se recogen tu nombre, si asistes o no, el numero de acompanantes y, opcionalmente, un mensaje para la pareja. Pedimos solo lo necesario para organizar el evento (principio de minimizacion).',
  },
  {
    titulo: '3. Para que se usan',
    cuerpo:
      'Para gestionar la lista de asistentes de la boda y comunicar a la pareja las confirmaciones. No se venden ni se ceden a terceros ajenos a la organizacion del evento.',
  },
  {
    titulo: '4. Por cuanto tiempo',
    cuerpo:
      'Los datos de confirmacion se conservan mientras se organiza la boda y se eliminan o anonimizan tras el evento, salvo que se contrate el servicio de recuerdo permanente, que tiene su propia finalidad y consentimiento.',
  },
  {
    titulo: '5. Tus derechos',
    cuerpo:
      'Puedes solicitar el acceso, rectificacion, eliminacion u oposicion al tratamiento de tus datos personales conforme a la Ley Organica de Proteccion de Datos Personales del Ecuador, escribiendo al correo de contacto de la operadora.',
  },
  {
    titulo: '6. Seguridad y transferencias',
    cuerpo:
      'Los datos viajan cifrados y se almacenan en la infraestructura de Google Firebase (encargado del tratamiento), lo que implica una transferencia internacional con las garantias correspondientes. El acceso esta restringido por rol.',
  },
];
