type ApiErrorShape = {
  message?: string;
  status?: number;
};

const MESSAGE_MAP: Record<string, string> = {
  'Invalid credentials': 'No puede ingresar, usuario y/o contrasena incorrecta.',
  'User has already voted': 'Ya realizo su voto, no puede volver a votar.',
  'Missing Bearer token': 'Sesion invalida, inicia sesion nuevamente.',
  'Invalid or expired token': 'Sesion expirada, inicia sesion nuevamente.',
  'Voter role required': 'Solo los votantes pueden emitir votos.',
  'Admin role required': 'Solo el administrador puede acceder.',
  'Election not started yet': 'La eleccion aun no ha iniciado.',
  'Election already ended': 'La eleccion ya finalizo.',
  'There is already an OPEN election': 'Ya existe una eleccion abierta.',
  'Cannot OPEN election without candidates': 'Agrega candidatos antes de abrir la eleccion.',
  'Cannot modify candidates on CLOSED election': 'No se puede modificar candidatos en una eleccion cerrada.',
  'Cannot delete OPEN election': 'No se puede eliminar una eleccion abierta.',
  'Candidate not found': 'Candidato no encontrado.',
  'Candidate update payload empty': 'Debes cambiar el nombre o el plan del candidato.',
};

export function resolveErrorMessage(error: unknown, fallback: string) {
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as ApiErrorShape).message ?? '')
      : '';

  if (!message) return fallback;

  for (const [key, value] of Object.entries(MESSAGE_MAP)) {
    if (message.startsWith(key)) return value;
  }

  return message || fallback;
}
