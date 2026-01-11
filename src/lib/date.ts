export function formatDateUTC(input: string | Date) {
  const d = typeof input === 'string' ? new Date(input) : input;
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function formatDateTimeUTC(input: string | Date) {
  const d = typeof input === 'string' ? new Date(input) : input;
  const date = d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const time = d.toLocaleTimeString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}
