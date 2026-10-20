// O PostgREST do Supabase corta cada resposta em `max-rows` (padrão 1000) sem avisar.
// Para ler mais que isso é preciso paginar com .range().

// Limite máximo de pacientes carregados no CRM
export const MAX_PATIENTS = 5000;

// Deve ser <= max-rows do projeto Supabase (padrão 1000)
const PAGE_SIZE = 1000;

type RangeableQuery<T> = {
  range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>;
};

// buildQuery deve devolver uma query NOVA a cada chamada e com ordenação estável
// (ex: .order('id')), senão linhas podem repetir ou sumir entre as páginas.
export async function fetchAllPages<T>(
  buildQuery: () => RangeableQuery<T>,
  maxRows: number = MAX_PATIENTS
): Promise<{ data: T[]; error: unknown }> {
  const rows: T[] = [];

  for (let from = 0; from < maxRows; from += PAGE_SIZE) {
    const to = Math.min(from + PAGE_SIZE, maxRows) - 1;
    const { data, error } = await buildQuery().range(from, to);

    if (error) return { data: rows, error };

    rows.push(...(data || []));
    if (!data || data.length < to - from + 1) break;
  }

  return { data: rows, error: null };
}
