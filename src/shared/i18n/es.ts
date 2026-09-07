/**
 * Textos en español. **Este archivo es el original**, no una traducción.
 *
 * Dos consecuencias prácticas:
 *
 * 1. `en.ts` está tipado como `typeof es`, así que TypeScript exige que tenga
 *    exactamente estas claves. Añadir una aquí y olvidarla allí rompe `tsc -b`;
 *    no hay forma de que se cuele un texto sin traducir.
 * 2. Las 189 pruebas unitarias y las 13 end-to-end localizan elementos por su
 *    texto en español. Cambiar la *redacción* de un valor de aquí puede romper
 *    pruebas aunque la clave siga igual. Mover un texto a este archivo es seguro;
 *    reescribirlo de paso, no.
 */
export const es = {
  comun: {
    guardar: 'Guardar',
    guardando: 'Guardando…',
    cancelar: 'Cancelar',
    cerrar: 'Cerrar',
    confirmar: 'Confirmar',
    procesando: 'Procesando…',
    eliminar: 'Eliminar',
    editar: 'Editar',
    volver: 'Volver',
    reintentar: 'Reintentar',
    sinFecha: 'Sin fecha',
    sinPuntuacion: 'Sin puntuación',
    volverAlLogin: 'Volver al inicio de sesión',
  },

  idioma: {
    etiqueta: 'Idioma',
    cambiarA: 'Cambiar a {{idioma}}',
  },

  cabecera: {
    saltarAlContenido: 'Saltar al contenido',
    subtitulo: 'Organiza y sigue tu contenido multimedia.',
    salir: 'Salir',
    aModoClaro: 'Cambiar a modo claro',
    aModoOscuro: 'Cambiar a modo oscuro',
    navegacionPrincipal: 'Navegación principal',
    cierreSinAvisar:
      'Se cerró la sesión en este dispositivo, pero no se pudo avisar al servidor. ' +
      'Si no fuiste tú quien la abrió en otro sitio, cierra todas las sesiones desde tu perfil.',
  },

  nav: {
    biblioteca: 'Biblioteca',
    catalogo: 'Catálogo',
  },

  cargador: {
    titulo: 'Cargando TrackerMultimedia',
    mensaje: 'Preparando biblioteca, métricas y resultados para ti.',
  },

  notificacion: {
    cerrar: 'Cerrar notificación',
  },

  errorGrave: {
    titulo: 'Algo se ha roto por nuestra parte',
    mensaje:
      'La página no ha podido mostrarse. No has perdido nada de lo que tengas guardado: el ' +
      'fallo está en la interfaz, no en tus datos.',
    recargar: 'Recargar la página',
    inicio: 'Volver al inicio',
    detalle: 'Detalle técnico (solo en desarrollo)',
  },
  validacion: {
    emailInvalido: 'Email inválido',
    passwordMinima: 'Contraseña: mínimo 8 caracteres',
    nombreRequerido: 'Nombre requerido',
    maximo100: 'Máximo 100 caracteres',
    passwordRequerida: 'Contraseña requerida',
    passwordActualRequerida: 'Contraseña actual requerida',
    colorInvalido: 'Color inválido',
    maximo60: 'Máximo 60 caracteres',
  },

  errores: {
    red: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
    validacion: 'Error de validación',
    servidor: 'Error en el servidor',
    credenciales: 'Credenciales inválidas',
    sinPermiso: 'No tienes permiso',
    interno: 'Error interno del servidor. Intenta más tarde.',
    inesperado: 'Error inesperado',
  },

  oauth: {
    access_denied: 'Cancelaste el acceso con el proveedor.',
    invalid_callback: 'La respuesta del proveedor llegó incompleta. Inténtalo de nuevo.',
    state_mismatch: 'La sesión de acceso con el proveedor expiró. Vuelve a intentarlo.',
    profile_error: 'No se pudo completar el acceso con el proveedor.',
    create_failed: 'No se pudo crear tu cuenta con el proveedor.',
    missing_tokens: 'La respuesta del proveedor no incluyó la sesión esperada.',
    session_error: 'No se pudo abrir la sesión devuelta por el proveedor.',
    account_unavailable:
      'No se pudo iniciar sesión con esa cuenta. Comprueba tu correo o inténtalo más tarde.',
    noSePudoIniciar: 'No se pudo iniciar el acceso con {{proveedor}}.',
    redirigiendo: 'Redirigiendo…',
    conGoogle: 'Continuar con Google',
    conGitHub: 'Continuar con GitHub',
  },

  acceso: {
    titulo: 'Iniciar sesión',
    subtitulo: 'Bienvenido de vuelta.',
    separador: 'o',
    correo: 'Correo electrónico',
    contrasena: 'Contraseña',
    entrar: 'Iniciar sesión',
    entrando: 'Iniciando sesión…',
    sinCuenta: '¿Aún no tienes cuenta?',
    registrate: 'Regístrate',
    olvidaste: '¿Olvidaste tu contraseña?',
    noRecibisteConfirmacion: '¿No recibiste el correo de confirmación?',
  },

  registro: {
    titulo: 'Crear cuenta',
    subtitulo: 'Comienza a gestionar tu contenido multimedia.',
    separador: 'o regístrate con correo',
    nombreVisible: 'Nombre visible',
    opcional: '(opcional)',
    confirmarContrasena: 'Confirmar contraseña',
    crear: 'Crear cuenta',
    creando: 'Creando cuenta…',
    noCoinciden: 'Las contraseñas no coinciden.',
    noSePudoCrear: 'No se pudo crear la cuenta. Inténtalo de nuevo.',
    yaTienesCuenta: '¿Ya tienes cuenta?',
    iniciaSesion: 'Inicia sesión',
    hechoTitulo: '¡Cuenta creada!',
    hechoSubtitulo:
      'Te hemos enviado un correo a <destacado>{{correo}}</destacado>. Abre el enlace de ' +
      'confirmación para activar tu cuenta.',
    hechoNoRecibiste: '¿No recibiste el correo?',
  },
  confirmacion: {
    confirmando: 'Confirmando cuenta…',
    espera: 'Por favor espera un momento.',
    hechoTitulo: '¡Cuenta confirmada!',
    errorTitulo: 'Enlace no válido',
    enlaceInvalido: 'El enlace de confirmación no es válido o ha expirado.',
    nuevoEnlace: 'Solicitar un nuevo enlace',
  },

  recuperar: {
    titulo: 'Recuperar contraseña',
    subtitulo: 'Introduce tu correo y te enviaremos las instrucciones.',
    aviso: 'Si el correo existe, te enviaremos instrucciones para recuperar tu cuenta.',
    error: 'No se pudo procesar la solicitud. Inténtalo de nuevo.',
    enviando: 'Enviando…',
    enviar: 'Enviar instrucciones',
    hechoTitulo: 'Revisa tu correo',
    hechoSubtitulo:
      'Si ese correo está registrado, recibirás las instrucciones para recuperar tu cuenta.',
  },

  reenvio: {
    titulo: 'Reenviar confirmación',
    subtitulo: 'Ingresa tu correo y te enviaremos un nuevo enlace de confirmación.',
    aviso: 'Si existe una cuenta sin confirmar para {{correo}}, enviaremos un nuevo enlace.',
    error: 'No se pudo enviar el correo. Inténtalo más tarde.',
    enviando: 'Enviando…',
    enviar: 'Enviar enlace',
    hechoTitulo: 'Correo enviado',
    hechoSubtitulo:
      'Si existe una cuenta sin confirmar para <destacado>{{correo}}</destacado>, recibirás el ' +
      'enlace de confirmación.',
  },
  nuevaContrasena: {
    titulo: 'Nueva contraseña',
    subtitulo: 'Introduce tu nueva contraseña.',
    codigo: 'Código de recuperación',
    nueva: 'Nueva contraseña',
    confirmar: 'Confirmar contraseña',
    actualizando: 'Actualizando…',
    establecer: 'Establecer nueva contraseña',
    hecho: 'Contraseña actualizada. Ya puedes iniciar sesión.',
    enlaceInvalido: 'El enlace de recuperación no es válido o ha expirado.',
  },

  vinculacion: {
    titulo: 'Vincular cuenta',
    subtitulo:
      'Ya existe una cuenta con el correo <destacado>{{correo}}</destacado>. Ingresa tu ' +
      'contraseña para vincular tu cuenta de {{proveedor}}.',
    contrasenaActual: 'Contraseña actual',
    vinculando: 'Vinculando…',
    vincularCon: 'Vincular con {{proveedor}}',
    error: 'No se pudo vincular la cuenta. Verifica tu contraseña.',
    invalidoTitulo: 'Enlace inválido',
    invalidoSubtitulo: 'El enlace de vinculación no es válido o ha expirado.',
  },
  perfil: {
    titulo: 'Mi perfil',
    volver: '← Volver',

    cuentaTitulo: 'Información de cuenta',
    nombreMostrado: 'Nombre mostrado',
    guardarCambios: 'Guardar cambios',
    perfilActualizado: 'Perfil actualizado correctamente.',
    perfilError: 'No se pudo actualizar el perfil.',

    contrasenaTitulo: 'Cambiar contraseña',
    contrasenaActual: 'Contraseña actual',
    contrasenaNueva: 'Nueva contraseña',
    contrasenaConfirmar: 'Confirmar nueva contraseña',
    contrasenaActualizando: 'Actualizando…',
    contrasenaCambiar: 'Cambiar contraseña',
    contrasenaNoCoinciden: 'Las contraseñas nuevas no coinciden.',
    contrasenaHecha:
      'Contraseña actualizada. Se han cerrado las sesiones de los demás dispositivos.',
    contrasenaError: 'No se pudo cambiar la contraseña.',

    sesionesTitulo: 'Sesiones',
    sesionesTexto:
      'Revoca todos los refresh tokens y fuerza un nuevo inicio de sesión en todos tus ' +
      'dispositivos.',
    sesionesCerrando: 'Cerrando sesiones…',
    sesionesCerrarTodas: 'Cerrar todas las sesiones',
    sesionesHecho: 'Se cerraron todas tus sesiones correctamente.',
    sesionesError: 'No se pudieron cerrar todas las sesiones.',
    sesionesDialogoTitulo: 'Cerrar todas las sesiones',
    sesionesDialogoMensaje:
      'Se invalidarán tus refresh tokens y tendrás que iniciar sesión de nuevo en todos tus ' +
      'dispositivos. Usa esta acción cuando sospeches actividad ajena o quieras forzar un ' +
      'reinicio completo.',
    sesionesDialogoConfirmar: 'Sí, cerrar todas',
    sesionesDialogoCancelar: 'Seguir conectado',

    datosTitulo: 'Descargar mis datos',
    datosTexto:
      'Un archivo JSON con todo lo que se guarda de ti: los datos de la cuenta, los proveedores ' +
      'que tengas vinculados, tus sesiones abiertas, tus formatos y tu biblioteca completa con ' +
      'sus categorías. No incluye contraseñas ni tokens.',
    datosPreparando: 'Preparando la descarga…',
    datosDescargar: 'Descargar mis datos',
    datosHecho: 'Se descargó el archivo con tus datos.',
    datosError: 'No se pudieron descargar tus datos.',

    borradoTitulo: 'Borrar la cuenta',
    borradoTexto:
      'Se borran tu cuenta y <destacado>todo</destacado> lo que contiene: tu biblioteca, tus ' +
      'categorías, tus formatos y tus sesiones. No hay forma de recuperarlo, y no se envía ' +
      'ninguna copia por correo.',
    borradoPideContrasena: 'Escribe tu contraseña para continuar',
    borradoPideCorreo: 'Escribe {{correo}} para continuar',
    borradoEnCurso: 'Borrando…',
    borradoBoton: 'Borrar mi cuenta',
    borradoHecho: 'Tu cuenta y todos tus datos se han borrado.',
    borradoError: 'No se pudo borrar la cuenta.',
    borradoDialogoTitulo: 'Borrar la cuenta definitivamente',
    borradoDialogoMensaje:
      'Esto borra tu cuenta y todos tus datos: biblioteca, categorías, formatos y sesiones. La ' +
      'acción no se puede deshacer y no queda ninguna copia.',
    borradoDialogoConfirmar: 'Sí, borrar mi cuenta',
  },
  medios: {
    tipo_Series: 'Serie',
    tipo_Movie: 'Película',
    tipo_Book: 'Libro',
    tipo_Comic: 'Cómic',
    tipo_Game: 'Juego',
    tipo_Podcast: 'Podcast',
    tipo_Video: 'Video',
    tipo_Album: 'Álbum',
    tipo_Other: 'Otro',

    estado_Planned: 'Planeado',
    estado_InProgress: 'En progreso',
    estado_Completed: 'Completado',
    estado_OnHold: 'En pausa',
    estado_Dropped: 'Abandonado',

    unidad_Episodes: 'Episodios',
    unidad_Chapters: 'Capítulos',
    unidad_Volumes: 'Volúmenes',
    unidad_Pages: 'Páginas',
    unidad_Hours: 'Horas',
    unidad_Seasons: 'Temporadas',
    unidad_Tracks: 'Pistas',
    unidad_Items: 'Elementos',
    unidad_None: 'Sin unidad',

    breve_Episodes: 'Ep.',
    breve_Chapters: 'Cap.',
    breve_Volumes: 'Vol.',
    breve_Pages: 'Pág.',
    breve_Hours: 'Hrs.',
    breve_Seasons: 'Temp.',
    breve_Tracks: 'Pista',
    breve_Items: 'Ítem',
    breve_None: '—',

    orden_CreatedAt: 'Fecha agregado',
    orden_PersonalScore: 'Puntuación personal',
    orden_ReleaseYear: 'Año de estreno',
    orden_Title: 'Título',

    sentido_Asc: 'Ascendente',
    sentido_Desc: 'Descendente',
  },
  tarjeta: {
    sinTituloAlternativo: 'Sin título alternativo',
    anioSinRegistrar: 'Año sin registrar',
    estreno: 'Estreno {{anio}}',
    temporada: 'Temporada {{numero}}',
    sinProgreso: 'Sin progreso',
    progreso: 'Progreso {{actual}}',
    progresoConUnidad: 'Progreso {{actual}}{{total}} {{unidad}}',
    progresoBreve: '{{unidad}} {{actual}}',
    progresoBreveTemporada: 'T{{temporada}} · {{unidad}} {{actual}}',
    eliminando: 'Eliminando…',
  },
  filtros: {
    titulo: 'Filtros de biblioteca',
    descripcion:
      'Busca por título, ordena por fecha o puntuación y segmenta por formato, estado, ' +
      'categorías y origen.',

    // Las tres cuentas de abajo llevan sufijo `_one` / `_other`: i18next elige la forma
    // según `count`. Antes se escribían con una plantilla y siempre en plural, así que
    // con una sola categoría se leía «1 categorías activas».
    categoriasActivas_one: '{{count}} categoría activa',
    categoriasActivas_other: '{{count}} categorías activas',
    avanzadosActivos_one: '{{count}} ajuste avanzado activo',
    avanzadosActivos_other: '{{count}} ajustes avanzados activos',
    activos_one: '{{count}} activo',
    activos_other: '{{count}} activos',

    vistaCompacta: 'Vista compacta',
    limpiar: 'Limpiar',
    buscarTitulo: 'Buscar título',
    buscarPista: 'Naruto, Solo Leveling, Vagabond...',
    buscar: 'Buscar',
    formato: 'Formato',
    todos: 'Todos',
    estado: 'Estado',
    origen: 'Origen',
    categorias: 'Categorías',
    sinCategorias: 'Todavía no has creado categorías para usar en filtros.',
    masFiltros: 'Más filtros y orden',
    masFiltrosPista:
      'Ajusta puntuación, fechas, orden y densidad del listado sin saturar la vista principal.',
    opcional: 'Opcional',
    ordenarPor: 'Ordenar por',
    direccion: 'Dirección',
    puntuacionMinima: 'Puntuación mínima',
    puntuacionMaxima: 'Puntuación máxima',
    agregadoDesde: 'Agregado desde',
    agregadoHasta: 'Agregado hasta',
    porPagina: 'Elementos por página',
  },
  editor: {
    etiqueta: 'Editor de biblioteca',
    tituloEditar: 'Editar elemento',
    tituloNuevo: 'Nuevo elemento manual',
    descripcionEditar:
      'Ajusta el formato base, el progreso flexible y los metadatos visibles del elemento ' +
      'seleccionado.',
    descripcionNuevo:
      'Crea un registro manual con el nuevo modelo flexible, sin depender del buscador externo.',
    origenExterno: 'El origen externo y sus identificadores se conservarán al guardar.',
    tituloPrincipal: 'Título principal',
    descripcion: 'Descripción',
    formato: 'Formato',
    sinFormato: 'Sin formato',
    estadoRegistro: 'Estado del registro',
    categorias: 'Categorías',
    sinCategorias: 'Aún no tienes categorías. Créalas desde la sección Catálogo.',
    anioEstreno: 'Año de estreno',
    puntuacion: 'Puntuación personal (0–10)',
    temporada: 'Temporada',
    portada: 'Portada URL',
    referencia: 'Enlace de referencia',
    fechaInicio: 'Fecha de inicio',
    fechaFin: 'Fecha de finalización',
    notas: 'Notas personales',
    guardarNuevo: 'Guardar nuevo registro',
  },
  importacion: {
    etiqueta: 'Importación rápida',
    sinEstadoEditorial: 'Estado editorial sin dato',
    sinAnio: 'Año sin dato',
    puntuacionExterna: 'Puntuación externa: {{valor}}',
    estadoInicial: 'Estado inicial',
    puntuacionPersonal: 'Puntuación personal',
    opcional: 'Opcional',
    categorias: 'Categorías',
    sinCategorias: 'Todavía no tienes categorías para clasificar esta importación.',
    notas: 'Notas de arranque',
    notasPista: 'Contexto personal, por qué lo agregas, punto de entrada...',
    guardar: 'Guardar en biblioteca',
    guardandoBreve: 'Guardando...',
    importar: 'Importar',
    abrirEn: 'Abrir {{titulo}} en {{origen}}',
  },
  // Etiquetas de columna compartidas por las tablas de Biblioteca, Catalogo y
  // Categorias. Vivian bajo `descubrir` porque esa pantalla fue la primera en
  // usar la tabla; al retirarse (2026-09-06) se quedaron aqui, con un nombre
  // que ya no describe a ninguno de sus tres usuarios.
  tabla: {
    colTitulo: 'Título',
    colTipo: 'Tipo',
    colAnio: 'Año',
    colPuntuacion: 'Puntuación',
    colAcciones: 'Acciones',
  },
  categorias: {
    eyebrow: 'Categorías',
    titulo: 'Tus categorías',
    descripcion:
      'Crea, renombra y elimina categorías personales para organizar tu biblioteca con tus ' +
      'propias reglas.',
    cuenta_one: '{{count}} categoría',
    cuenta_other: '{{count}} categorías',
    coloresOpcionales: 'Colores opcionales',
    abrirEditor: 'Abrir editor',

    cargandoTitulo: 'Cargando categorías',
    cargandoMensaje: 'Preparando tu taxonomía personal.',
    sincronizacionTitulo: 'La taxonomía no se pudo sincronizar.',
    sincronizacionTexto:
      'Puedes seguir preparando el editor, pero la lista no se refrescó correctamente.',

    editorTitulo: 'Editor de categorías',
    editorDescripcion:
      'Usa colores opcionales para distinguir grupos como backlog, favoritos, pendientes o ' +
      'temporadas.',
    nuevaCategoria: 'Nueva categoría',
    formulario: 'Formulario de categorías',
    nombre: 'Nombre de la categoría',
    color: 'Color',
    cancelarEdicion: 'Cancelar edición',
    crear: 'Crear categoría',

    sinColor: 'Sin color',
    selectorColor: 'Selector de color',
    coloresPredefinidos: 'Colores predefinidos',
    personalizado: 'Personalizado',
    hexadecimal: 'Valor hexadecimal del color',
    quitar: 'Quitar',

    disponiblesTitulo: 'Categorías disponibles',
    disponiblesSubtitulo:
      'Cada categoría es privada para tu cuenta y puede asignarse a varios ítems.',
    errorTitulo: 'No se pudieron cargar las categorías',
    errorMensaje: 'Recarga la vista o revisa la conexión con el backend.',
    vaciaTitulo: 'Todavía no tienes categorías',
    vaciaMensaje: 'Crea la primera para empezar a agrupar tu biblioteca con reglas propias.',
    colNombre: 'Nombre',

    creada: '"{{nombre}}" se creó correctamente.',
    actualizada: '"{{nombre}}" se actualizó correctamente.',
    eliminada: '"{{nombre}}" se eliminó correctamente.',
    errorCrear: 'No se pudo crear la categoría.',
    errorActualizar: 'No se pudo actualizar la categoría.',
    errorEliminar: 'No se pudo eliminar la categoría.',

    dialogoTitulo: 'Eliminar la categoría "{{nombre}}"',
    dialogoTituloGenerico: 'Eliminar categoría',
    dialogoMensaje:
      'Esta categoría desaparecerá de tu taxonomía personal y dejará de estar disponible en ' +
      'Biblioteca.',
    dialogoConfirmar: 'Eliminar categoría',
    dialogoCancelar: 'Conservar categoría',
  },
  biblioteca: {
    eyebrow: 'Biblioteca',
    titulo: 'Tu biblioteca',
    descripcion: 'Encuentra, filtra y actualiza tu colección desde un único panel.',
    registros_one: '{{count}} registro',
    registros_other: '{{count}} registros',
    filtrosActivos_one: '{{count}} filtro activo',
    filtrosActivos_other: '{{count}} filtros activos',
    sinFiltros: 'Sin filtros extra',
    pagina: 'Página {{numero}}',
    nuevoRegistro: 'Nuevo registro',
    ocultarFiltros: 'Ocultar filtros',
    mostrarFiltros: 'Mostrar filtros',
    importar: 'Importar',
    exportar: 'Exportar',

    cargandoTitulo: 'Cargando biblioteca',
    cargandoMensaje: 'Sincronizando filtros y listado.',
    noSincronizadaTitulo: 'La biblioteca no se sincronizó.',
    noSincronizadaTexto: 'Reintenta la carga o revisa el backend antes de seguir editando.',
    categoriasNoCargadasTitulo: 'Las categorías no se cargaron.',
    categoriasNoCargadasTexto:
      'El editor y los filtros seguirán sin categorías hasta que vuelva la conexión.',
    categoriasAyuda:
      'Las categorías no están disponibles ahora mismo. Puedes seguir filtrando por texto, ' +
      'estado y origen.',

    resultadosTitulo: 'Resultados',
    resultadosError: 'No pudimos actualizar el listado con los criterios actuales.',
    coincidencias_one: '{{count}} coincidencia con los criterios actuales.',
    coincidencias_other: '{{count}} coincidencias con los criterios actuales.',
    errorTitulo: 'No se pudo cargar la biblioteca',
    errorMensaje: 'Verifica tu conexión o recarga la página.',
    vaciaTitulo: 'Tu biblioteca todavía está vacía',
    vaciaMensaje: 'Añade tu primer registro a mano y ve completando su ficha a tu ritmo.',
    agregarManual: 'Agregar manualmente',

    colProgreso: 'Progreso',
    anterior: 'Anterior',
    siguiente: 'Siguiente',
    paginaDe: 'Página {{actual}} de {{total}}',

    editarTitulo: 'Editar {{titulo}}',
    crearTitulo: 'Crear elemento de biblioteca',
    edicionRapida: 'Edición rápida',
    registroManual: 'Registro manual',
    pistaEdicion:
      'Ajusta la ficha seleccionada sin perder el contexto del listado ni los filtros actuales.',
    pistaCreacion:
      'Añade un nuevo elemento desde la biblioteca sin desplazar el contenido principal.',

    actualizado: '"{{titulo}}" se actualizó correctamente.',
    agregado: '"{{titulo}}" se agregó a tu biblioteca.',
    eliminado: '"{{titulo}}" se eliminó de tu biblioteca.',
    errorActualizar: 'No se pudo actualizar el elemento.',
    errorCrear: 'No se pudo crear el elemento.',
    errorEliminar: 'No se pudo eliminar el elemento.',

    exportado: 'Se descargó tu biblioteca en formato {{formato}}.',
    errorExportar: 'No se pudo exportar la biblioteca en {{formato}}.',
    errorImportar: 'No se pudo importar el archivo {{formato}}.',
    importSinCambios: 'Importación {{formato}} completada sin cambios.',
    importResumen: 'Importación {{formato}} completada: {{detalles}}.',
    importCreados_one: '{{count}} creado',
    importCreados_other: '{{count}} creados',
    importActualizados_one: '{{count}} actualizado',
    importActualizados_other: '{{count}} actualizados',
    importCategorias_one: '{{count}} categoría nueva',
    importCategorias_other: '{{count}} categorías nuevas',

    dialogoTitulo: 'Eliminar "{{titulo}}"',
    dialogoTituloGenerico: 'Eliminar elemento',
    dialogoMensaje:
      'Esta acción sacará el elemento de tu biblioteca. Podrás volver a crearlo o importarlo ' +
      'después, pero perderás su estado y notas actuales.',
    dialogoConfirmar: 'Eliminar elemento',
    dialogoCancelar: 'Conservar elemento',
  },
  catalogo: {
    eyebrow: 'Catálogo',
    titulo: 'Tu catálogo personal',
    descripcion:
      'Administra las categorías y formatos que usas para organizar y clasificar tu biblioteca ' +
      'multimedia.',
    pestanaCategorias: 'Categorías',
    pestanaFormatos: 'Formatos',

    categoriasDescripcion:
      'Etiquetas personales para organizar tu biblioteca. Colores opcionales para diferenciar ' +
      'grupos.',
    nuevaCategoria: 'Nueva categoría',
    categoriasVaciaTitulo: 'Todavía no tienes categorías',
    categoriasVaciaMensaje: 'Crea la primera para empezar a organizar tu biblioteca.',
    editarCategoria: 'Editar categoría',
    editarNombrado: 'Editar "{{nombre}}"',
    nombre: 'Nombre',
    eliminarNombrado: 'Eliminar "{{nombre}}"',
    categoriaDialogoMensaje:
      'Esta categoría se eliminará de tu biblioteca y dejará de estar disponible en todos los ' +
      'registros.',
    conservar: 'Conservar',

    formatosDescripcion:
      'Etiquetas personales para clasificar el contenido de tu biblioteca: Anime, Serie, ' +
      'Película, Manga, etc.',
    nuevoFormato: 'Nuevo formato',
    formatosCargando: 'Cargando formatos',
    formatosErrorTitulo: 'No se pudieron cargar los formatos',
    formatosVaciaTitulo: 'Todavía no tienes formatos',
    formatosVaciaMensaje: 'Crea el primero para que aparezca en el selector de la biblioteca.',
    editarFormato: 'Editar formato',
    nombreFormato: 'Nombre del formato',
    nombreFormatoPista: 'Ej: OVA, Novela visual, Cortometraje…',
    crearFormato: 'Crear formato',
    formatoErrorCrear: 'No se pudo crear el formato.',
    formatoErrorActualizar: 'No se pudo actualizar el formato.',
    formatoErrorEliminar: 'No se pudo eliminar el formato.',
    formatoDialogoTituloGenerico: 'Eliminar formato',
    formatoDialogoMensaje:
      'Este formato dejará de aparecer en el selector de la biblioteca. Los registros ' +
      'existentes no se verán afectados.',
    formatoDialogoConfirmar: 'Eliminar formato',
  },
} as const
