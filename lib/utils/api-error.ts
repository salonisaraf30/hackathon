export class ApiError extends Error {
  constructor(public message: string, public status: number = 500) {
    super(message)
  }
}

export function handleApiError(error: unknown) {
  console.error('[API Error]', error)
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status })
  }
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}
