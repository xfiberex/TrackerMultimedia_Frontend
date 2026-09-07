import type { es } from './es'

/**
 * English texts.
 *
 * The type annotation is the whole point: `Traducciones` is derived from `es.ts`,
 * so TypeScript rejects a missing key, an extra key and a mistyped one. A string
 * that nobody translated cannot reach the interface unnoticed — the build fails
 * first.
 */
type Traducciones = {
  readonly [K in keyof typeof es]: { readonly [S in keyof (typeof es)[K]]: string }
}

export const en: Traducciones = {
  comun: {
    guardar: 'Save',
    guardando: 'Saving…',
    cancelar: 'Cancel',
    cerrar: 'Close',
    confirmar: 'Confirm',
    procesando: 'Working…',
    eliminar: 'Delete',
    editar: 'Edit',
    volver: 'Back',
    reintentar: 'Try again',
    sinFecha: 'No date',
    sinPuntuacion: 'Not rated',
    volverAlLogin: 'Back to sign in',
  },

  idioma: {
    etiqueta: 'Language',
    cambiarA: 'Switch to {{idioma}}',
  },

  cabecera: {
    saltarAlContenido: 'Skip to content',
    subtitulo: 'Organise and track your media.',
    salir: 'Sign out',
    aModoClaro: 'Switch to light mode',
    aModoOscuro: 'Switch to dark mode',
    navegacionPrincipal: 'Main navigation',
    cierreSinAvisar:
      'You were signed out on this device, but the server could not be notified. ' +
      'If you did not open the session elsewhere, close every session from your profile.',
  },

  nav: {
    biblioteca: 'Library',
    catalogo: 'Catalogue',
  },

  cargador: {
    titulo: 'Loading TrackerMultimedia',
    mensaje: 'Getting your library, stats and results ready.',
  },

  notificacion: {
    cerrar: 'Dismiss notification',
  },

  errorGrave: {
    titulo: 'Something broke on our side',
    mensaje:
      'This page could not be shown. Nothing you saved has been lost: the failure is in the ' +
      'interface, not in your data.',
    recargar: 'Reload the page',
    inicio: 'Back to start',
    detalle: 'Technical detail (development only)',
  },
  validacion: {
    emailInvalido: 'Invalid email',
    passwordMinima: 'Password: at least 8 characters',
    nombreRequerido: 'Name required',
    maximo100: 'At most 100 characters',
    passwordRequerida: 'Password required',
    passwordActualRequerida: 'Current password required',
    colorInvalido: 'Invalid colour',
    maximo60: 'At most 60 characters',
  },

  errores: {
    red: 'Connection error. Check your internet and try again.',
    validacion: 'Validation error',
    servidor: 'Server error',
    credenciales: 'Invalid credentials',
    sinPermiso: 'You do not have permission',
    interno: 'Internal server error. Try again later.',
    inesperado: 'Unexpected error',
  },

  oauth: {
    access_denied: 'You cancelled the sign-in with the provider.',
    invalid_callback: 'The provider sent back an incomplete response. Try again.',
    state_mismatch: 'The sign-in session with the provider expired. Try again.',
    profile_error: 'The sign-in with the provider could not be completed.',
    create_failed: 'Your account could not be created with the provider.',
    missing_tokens: 'The provider response did not include the expected session.',
    session_error: 'The session returned by the provider could not be opened.',
    account_unavailable:
      'That account could not be signed in. Check your email or try again later.',
    noSePudoIniciar: 'The sign-in with {{proveedor}} could not be started.',
    redirigiendo: 'Redirecting…',
    conGoogle: 'Continue with Google',
    conGitHub: 'Continue with GitHub',
  },

  acceso: {
    titulo: 'Sign in',
    subtitulo: 'Welcome back.',
    separador: 'or',
    correo: 'Email address',
    contrasena: 'Password',
    entrar: 'Sign in',
    entrando: 'Signing in…',
    sinCuenta: 'No account yet?',
    registrate: 'Sign up',
    olvidaste: 'Forgot your password?',
    noRecibisteConfirmacion: 'Did not get the confirmation email?',
  },

  registro: {
    titulo: 'Create account',
    subtitulo: 'Start managing your media.',
    separador: 'or sign up with email',
    nombreVisible: 'Display name',
    opcional: '(optional)',
    confirmarContrasena: 'Confirm password',
    crear: 'Create account',
    creando: 'Creating account…',
    noCoinciden: 'The passwords do not match.',
    noSePudoCrear: 'The account could not be created. Try again.',
    yaTienesCuenta: 'Already have an account?',
    iniciaSesion: 'Sign in',
    hechoTitulo: 'Account created!',
    hechoSubtitulo:
      'We sent an email to <destacado>{{correo}}</destacado>. Open the confirmation link to ' +
      'activate your account.',
    hechoNoRecibiste: 'Did not get the email?',
  },
  confirmacion: {
    confirmando: 'Confirming account…',
    espera: 'Please wait a moment.',
    hechoTitulo: 'Account confirmed!',
    errorTitulo: 'Invalid link',
    enlaceInvalido: 'The confirmation link is not valid or has expired.',
    nuevoEnlace: 'Request a new link',
  },

  recuperar: {
    titulo: 'Reset password',
    subtitulo: 'Enter your email and we will send you the instructions.',
    aviso: 'If that email exists, we will send instructions to recover your account.',
    error: 'The request could not be processed. Try again.',
    enviando: 'Sending…',
    enviar: 'Send instructions',
    hechoTitulo: 'Check your email',
    hechoSubtitulo:
      'If that email is registered, you will receive the instructions to recover your account.',
  },

  reenvio: {
    titulo: 'Resend confirmation',
    subtitulo: 'Enter your email and we will send you a new confirmation link.',
    aviso: 'If there is an unconfirmed account for {{correo}}, we will send a new link.',
    error: 'The email could not be sent. Try again later.',
    enviando: 'Sending…',
    enviar: 'Send link',
    hechoTitulo: 'Email sent',
    hechoSubtitulo:
      'If there is an unconfirmed account for <destacado>{{correo}}</destacado>, you will ' +
      'receive the confirmation link.',
  },
  nuevaContrasena: {
    titulo: 'New password',
    subtitulo: 'Enter your new password.',
    codigo: 'Recovery code',
    nueva: 'New password',
    confirmar: 'Confirm password',
    actualizando: 'Updating…',
    establecer: 'Set new password',
    hecho: 'Password updated. You can sign in now.',
    enlaceInvalido: 'The recovery link is not valid or has expired.',
  },

  vinculacion: {
    titulo: 'Link account',
    subtitulo:
      'An account already exists for <destacado>{{correo}}</destacado>. Enter your password to ' +
      'link your {{proveedor}} account.',
    contrasenaActual: 'Current password',
    vinculando: 'Linking…',
    vincularCon: 'Link with {{proveedor}}',
    error: 'The account could not be linked. Check your password.',
    invalidoTitulo: 'Invalid link',
    invalidoSubtitulo: 'The linking link is not valid or has expired.',
  },
  perfil: {
    titulo: 'My profile',
    volver: '← Back',

    cuentaTitulo: 'Account details',
    nombreMostrado: 'Display name',
    guardarCambios: 'Save changes',
    perfilActualizado: 'Profile updated.',
    perfilError: 'The profile could not be updated.',

    contrasenaTitulo: 'Change password',
    contrasenaActual: 'Current password',
    contrasenaNueva: 'New password',
    contrasenaConfirmar: 'Confirm new password',
    contrasenaActualizando: 'Updating…',
    contrasenaCambiar: 'Change password',
    contrasenaNoCoinciden: 'The new passwords do not match.',
    contrasenaHecha: 'Password updated. Sessions on your other devices have been signed out.',
    contrasenaError: 'The password could not be changed.',

    sesionesTitulo: 'Sessions',
    sesionesTexto: 'Revoke every refresh token and force a new sign-in on all of your devices.',
    sesionesCerrando: 'Closing sessions…',
    sesionesCerrarTodas: 'Close every session',
    sesionesHecho: 'All of your sessions were closed.',
    sesionesError: 'The sessions could not all be closed.',
    sesionesDialogoTitulo: 'Close every session',
    sesionesDialogoMensaje:
      'Your refresh tokens will be invalidated and you will have to sign in again on all of ' +
      'your devices. Use this when you suspect someone else has access or you want a clean ' +
      'restart.',
    sesionesDialogoConfirmar: 'Yes, close them all',
    sesionesDialogoCancelar: 'Stay signed in',

    datosTitulo: 'Download my data',
    datosTexto:
      'A JSON file with everything stored about you: your account details, the providers you ' +
      'have linked, your open sessions, your formats and your full library with its ' +
      'categories. It contains no passwords and no tokens.',
    datosPreparando: 'Preparing the download…',
    datosDescargar: 'Download my data',
    datosHecho: 'The file with your data was downloaded.',
    datosError: 'Your data could not be downloaded.',

    borradoTitulo: 'Delete the account',
    borradoTexto:
      'This deletes your account and <destacado>everything</destacado> in it: your library, ' +
      'your categories, your formats and your sessions. There is no way to get it back, and no ' +
      'copy is emailed to you.',
    borradoPideContrasena: 'Type your password to continue',
    borradoPideCorreo: 'Type {{correo}} to continue',
    borradoEnCurso: 'Deleting…',
    borradoBoton: 'Delete my account',
    borradoHecho: 'Your account and all of your data have been deleted.',
    borradoError: 'The account could not be deleted.',
    borradoDialogoTitulo: 'Delete the account permanently',
    borradoDialogoMensaje:
      'This deletes your account and all of your data: library, categories, formats and ' +
      'sessions. The action cannot be undone and no copy is kept.',
    borradoDialogoConfirmar: 'Yes, delete my account',
  },
  medios: {
    tipo_Series: 'Series',
    tipo_Movie: 'Film',
    tipo_Book: 'Book',
    tipo_Comic: 'Comic',
    tipo_Game: 'Game',
    tipo_Podcast: 'Podcast',
    tipo_Video: 'Video',
    tipo_Album: 'Album',
    tipo_Other: 'Other',

    estado_Planned: 'Planned',
    estado_InProgress: 'In progress',
    estado_Completed: 'Completed',
    estado_OnHold: 'On hold',
    estado_Dropped: 'Dropped',

    unidad_Episodes: 'Episodes',
    unidad_Chapters: 'Chapters',
    unidad_Volumes: 'Volumes',
    unidad_Pages: 'Pages',
    unidad_Hours: 'Hours',
    unidad_Seasons: 'Seasons',
    unidad_Tracks: 'Tracks',
    unidad_Items: 'Items',
    unidad_None: 'No unit',

    breve_Episodes: 'Ep.',
    breve_Chapters: 'Ch.',
    breve_Volumes: 'Vol.',
    breve_Pages: 'Pg.',
    breve_Hours: 'Hrs.',
    breve_Seasons: 'Ssn.',
    breve_Tracks: 'Track',
    breve_Items: 'Item',
    breve_None: '—',

    orden_CreatedAt: 'Date added',
    orden_PersonalScore: 'Personal score',
    orden_ReleaseYear: 'Release year',
    orden_Title: 'Title',

    sentido_Asc: 'Ascending',
    sentido_Desc: 'Descending',
  },
  tarjeta: {
    sinTituloAlternativo: 'No alternative title',
    anioSinRegistrar: 'Year not recorded',
    estreno: 'Released {{anio}}',
    temporada: 'Season {{numero}}',
    sinProgreso: 'No progress',
    progreso: 'Progress {{actual}}',
    progresoConUnidad: 'Progress {{actual}}{{total}} {{unidad}}',
    progresoBreve: '{{unidad}} {{actual}}',
    progresoBreveTemporada: 'S{{temporada}} · {{unidad}} {{actual}}',
    eliminando: 'Deleting…',
  },
  filtros: {
    titulo: 'Library filters',
    descripcion:
      'Search by title, sort by date or score, and narrow down by format, status, categories ' +
      'and source.',

    categoriasActivas_one: '{{count}} active category',
    categoriasActivas_other: '{{count}} active categories',
    avanzadosActivos_one: '{{count}} advanced setting active',
    avanzadosActivos_other: '{{count}} advanced settings active',
    activos_one: '{{count}} active',
    activos_other: '{{count}} active',

    vistaCompacta: 'Compact view',
    limpiar: 'Clear',
    buscarTitulo: 'Search title',
    buscarPista: 'Naruto, Solo Leveling, Vagabond...',
    buscar: 'Search',
    formato: 'Format',
    todos: 'All',
    estado: 'Status',
    origen: 'Source',
    categorias: 'Categories',
    sinCategorias: 'You have not created any categories to filter by yet.',
    masFiltros: 'More filters and sorting',
    masFiltrosPista:
      'Adjust score, dates, sorting and list density without cluttering the main view.',
    opcional: 'Optional',
    ordenarPor: 'Sort by',
    direccion: 'Direction',
    puntuacionMinima: 'Minimum score',
    puntuacionMaxima: 'Maximum score',
    agregadoDesde: 'Added from',
    agregadoHasta: 'Added to',
    porPagina: 'Items per page',
  },
  editor: {
    etiqueta: 'Library editor',
    tituloEditar: 'Edit entry',
    tituloNuevo: 'New manual entry',
    descripcionEditar:
      'Adjust the base format, the flexible progress and the visible metadata of the selected ' +
      'entry.',
    descripcionNuevo:
      'Create a manual entry with the new flexible model, without relying on the external search.',
    origenExterno: 'The external source and its identifiers will be kept when you save.',
    tituloPrincipal: 'Main title',
    descripcion: 'Description',
    formato: 'Format',
    sinFormato: 'No format',
    estadoRegistro: 'Entry status',
    categorias: 'Categories',
    sinCategorias: 'You have no categories yet. Create them from the Catalogue section.',
    anioEstreno: 'Release year',
    puntuacion: 'Personal score (0–10)',
    temporada: 'Season',
    portada: 'Cover URL',
    referencia: 'Reference link',
    fechaInicio: 'Start date',
    fechaFin: 'Completion date',
    notas: 'Personal notes',
    guardarNuevo: 'Save new entry',
  },
  importacion: {
    etiqueta: 'Quick import',
    sinEstadoEditorial: 'No publication status',
    sinAnio: 'No year',
    puntuacionExterna: 'External score: {{valor}}',
    estadoInicial: 'Initial status',
    puntuacionPersonal: 'Personal score',
    opcional: 'Optional',
    categorias: 'Categories',
    sinCategorias: 'You have no categories to classify this import yet.',
    notas: 'Starting notes',
    notasPista: 'Personal context, why you are adding it, where to start...',
    guardar: 'Save to library',
    guardandoBreve: 'Saving...',
    importar: 'Import',
    abrirEn: 'Open {{titulo}} on {{origen}}',
  },
  // Etiquetas de columna compartidas por las tablas de Biblioteca, Catalogo y
  // Categorias. Vivian bajo `descubrir` porque esa pantalla fue la primera en
  // usar la tabla; al retirarse (2026-09-06) se quedaron aqui, con un nombre
  // que ya no describe a ninguno de sus tres usuarios.
  tabla: {
    colTitulo: 'Title',
    colTipo: 'Type',
    colAnio: 'Year',
    colPuntuacion: 'Score',
    colAcciones: 'Actions',
  },
  categorias: {
    eyebrow: 'Categories',
    titulo: 'Your categories',
    descripcion:
      'Create, rename and delete personal categories to organise your library by your own rules.',
    cuenta_one: '{{count}} category',
    cuenta_other: '{{count}} categories',
    coloresOpcionales: 'Colours optional',
    abrirEditor: 'Open editor',

    cargandoTitulo: 'Loading categories',
    cargandoMensaje: 'Getting your personal taxonomy ready.',
    sincronizacionTitulo: 'The taxonomy could not be synchronised.',
    sincronizacionTexto:
      'You can keep working in the editor, but the list was not refreshed correctly.',

    editorTitulo: 'Category editor',
    editorDescripcion:
      'Use optional colours to tell groups apart, such as backlog, favourites, pending or ' +
      'seasons.',
    nuevaCategoria: 'New category',
    formulario: 'Category form',
    nombre: 'Category name',
    color: 'Colour',
    cancelarEdicion: 'Cancel editing',
    crear: 'Create category',

    sinColor: 'No colour',
    selectorColor: 'Colour picker',
    coloresPredefinidos: 'Preset colours',
    personalizado: 'Custom',
    hexadecimal: 'Hexadecimal colour value',
    quitar: 'Remove',

    disponiblesTitulo: 'Available categories',
    disponiblesSubtitulo:
      'Every category is private to your account and can be assigned to several items.',
    errorTitulo: 'The categories could not be loaded',
    errorMensaje: 'Reload the view or check the connection to the backend.',
    vaciaTitulo: 'You have no categories yet',
    vaciaMensaje: 'Create the first one to start grouping your library by your own rules.',
    colNombre: 'Name',

    creada: '"{{nombre}}" was created.',
    actualizada: '"{{nombre}}" was updated.',
    eliminada: '"{{nombre}}" was deleted.',
    errorCrear: 'The category could not be created.',
    errorActualizar: 'The category could not be updated.',
    errorEliminar: 'The category could not be deleted.',

    dialogoTitulo: 'Delete the category "{{nombre}}"',
    dialogoTituloGenerico: 'Delete category',
    dialogoMensaje:
      'This category will disappear from your personal taxonomy and will no longer be ' +
      'available in Library.',
    dialogoConfirmar: 'Delete category',
    dialogoCancelar: 'Keep category',
  },
  biblioteca: {
    eyebrow: 'Library',
    titulo: 'Your library',
    descripcion: 'Find, filter and update your collection from a single panel.',
    registros_one: '{{count}} entry',
    registros_other: '{{count}} entries',
    filtrosActivos_one: '{{count}} active filter',
    filtrosActivos_other: '{{count}} active filters',
    sinFiltros: 'No extra filters',
    pagina: 'Page {{numero}}',
    nuevoRegistro: 'New entry',
    ocultarFiltros: 'Hide filters',
    mostrarFiltros: 'Show filters',
    importar: 'Import',
    exportar: 'Export',

    cargandoTitulo: 'Loading library',
    cargandoMensaje: 'Synchronising filters and listing.',
    noSincronizadaTitulo: 'The library was not synchronised.',
    noSincronizadaTexto: 'Retry the load or check the backend before carrying on editing.',
    categoriasNoCargadasTitulo: 'The categories were not loaded.',
    categoriasNoCargadasTexto:
      'The editor and the filters will stay without categories until the connection is back.',
    categoriasAyuda:
      'Categories are not available right now. You can still filter by text, status and source.',

    resultadosTitulo: 'Results',
    resultadosError: 'We could not update the listing with the current criteria.',
    coincidencias_one: '{{count}} match for the current criteria.',
    coincidencias_other: '{{count}} matches for the current criteria.',
    errorTitulo: 'The library could not be loaded',
    errorMensaje: 'Check your connection or reload the page.',
    vaciaTitulo: 'Your library is still empty',
    vaciaMensaje: 'Add your first entry by hand and fill in its details at your own pace.',
    agregarManual: 'Add manually',

    colProgreso: 'Progress',
    anterior: 'Previous',
    siguiente: 'Next',
    paginaDe: 'Page {{actual}} of {{total}}',

    editarTitulo: 'Edit {{titulo}}',
    crearTitulo: 'Create library entry',
    edicionRapida: 'Quick edit',
    registroManual: 'Manual entry',
    pistaEdicion:
      'Adjust the selected entry without losing the context of the listing or the current ' +
      'filters.',
    pistaCreacion: 'Add a new entry from the library without moving the main content.',

    actualizado: '"{{titulo}}" was updated.',
    agregado: '"{{titulo}}" was added to your library.',
    eliminado: '"{{titulo}}" was removed from your library.',
    errorActualizar: 'The entry could not be updated.',
    errorCrear: 'The entry could not be created.',
    errorEliminar: 'The entry could not be deleted.',

    exportado: 'Your library was downloaded in {{formato}} format.',
    errorExportar: 'The library could not be exported as {{formato}}.',
    errorImportar: 'The {{formato}} file could not be imported.',
    importSinCambios: '{{formato}} import completed with no changes.',
    importResumen: '{{formato}} import completed: {{detalles}}.',
    importCreados_one: '{{count}} created',
    importCreados_other: '{{count}} created',
    importActualizados_one: '{{count}} updated',
    importActualizados_other: '{{count}} updated',
    importCategorias_one: '{{count}} new category',
    importCategorias_other: '{{count}} new categories',

    dialogoTitulo: 'Delete "{{titulo}}"',
    dialogoTituloGenerico: 'Delete entry',
    dialogoMensaje:
      'This takes the entry out of your library. You can create or import it again later, but ' +
      'you will lose its current status and notes.',
    dialogoConfirmar: 'Delete entry',
    dialogoCancelar: 'Keep entry',
  },
  catalogo: {
    eyebrow: 'Catalogue',
    titulo: 'Your personal catalogue',
    descripcion:
      'Manage the categories and formats you use to organise and classify your media library.',
    pestanaCategorias: 'Categories',
    pestanaFormatos: 'Formats',

    categoriasDescripcion:
      'Personal labels to organise your library. Optional colours to tell groups apart.',
    nuevaCategoria: 'New category',
    categoriasVaciaTitulo: 'You have no categories yet',
    categoriasVaciaMensaje: 'Create the first one to start organising your library.',
    editarCategoria: 'Edit category',
    editarNombrado: 'Edit "{{nombre}}"',
    nombre: 'Name',
    eliminarNombrado: 'Delete "{{nombre}}"',
    categoriaDialogoMensaje:
      'This category will be removed from your library and will no longer be available on any ' +
      'entry.',
    conservar: 'Keep',

    formatosDescripcion:
      'Personal labels to classify the content of your library: Anime, Series, Film, Manga, etc.',
    nuevoFormato: 'New format',
    formatosCargando: 'Loading formats',
    formatosErrorTitulo: 'The formats could not be loaded',
    formatosVaciaTitulo: 'You have no formats yet',
    formatosVaciaMensaje: 'Create the first one so it shows up in the library selector.',
    editarFormato: 'Edit format',
    nombreFormato: 'Format name',
    nombreFormatoPista: 'e.g. OVA, Visual novel, Short film…',
    crearFormato: 'Create format',
    formatoErrorCrear: 'The format could not be created.',
    formatoErrorActualizar: 'The format could not be updated.',
    formatoErrorEliminar: 'The format could not be deleted.',
    formatoDialogoTituloGenerico: 'Delete format',
    formatoDialogoMensaje:
      'This format will stop appearing in the library selector. Existing entries are not ' +
      'affected.',
    formatoDialogoConfirmar: 'Delete format',
  },
}
