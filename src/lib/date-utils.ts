/**
 * Utilitários para manipulação segura de datas
 */

/**
 * Converte uma data para string no formato YYYY-MM-DD no fuso horário do Brasil
 * @param dateString - String da data ou objeto Date
 * @returns String no formato YYYY-MM-DD ou null se inválida
 */
export function convertToBrazilDateString(dateString: string | Date | null | undefined): string | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('⚠️ Data inválida:', dateString);
      return null;
    }
    
    // Converter para o fuso do Brasil
    const brazilDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    
    // Retornar no formato YYYY-MM-DD
    return brazilDate.toISOString().split('T')[0];
  } catch (error) {
    console.warn('⚠️ Erro ao converter data:', dateString, error);
    return null;
  }
}

/**
 * Verifica se uma data é válida
 * @param dateString - String da data ou objeto Date
 * @returns true se a data for válida
 */
export function isValidDate(dateString: string | Date | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Obtém a data atual no fuso horário do Brasil no formato YYYY-MM-DD
 * @returns String no formato YYYY-MM-DD
 */
export function getTodayBrazilString(): string {
  const hoje = new Date();
  const hojeBrasil = new Date(hoje.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  return hojeBrasil.toISOString().split('T')[0];
}

/**
 * Filtra registros por data de hoje no fuso do Brasil
 * @param records - Array de registros
 * @param dateField - Campo que contém a data
 * @returns Array filtrado
 */
export function filterByToday<T extends Record<string, any>>(
  records: T[], 
  dateField: keyof T
): T[] {
  const hojeString = getTodayBrazilString();
  
  return records.filter(record => {
    const dateString = record[dateField];
    if (!dateString) return false;
    
    const recordDateString = convertToBrazilDateString(dateString);
    return recordDateString === hojeString;
  });
}








