export function getFormString(form: FormData, field: string) {
  const value = form.get(field)
  return typeof value === 'string' ? value : ''
}
