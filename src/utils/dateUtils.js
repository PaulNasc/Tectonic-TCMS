/**
 * Formatação de datas para o padrão brasileiro
 */

/**
 * Formata uma data para exibição
 * @param {Date|string|object} date - Data para formatar
 * @param {object} options - Opções de formatação
 * @returns {string} Data formatada
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  try {
    // Se for um objeto Firebase Timestamp
    if (date && typeof date.toDate === 'function') {
      date = date.toDate();
    } 
    // Se for string, converter para Date
    else if (typeof date === 'string') {
      date = new Date(date);
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', date);
      return '';
    }
    
    const defaultOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    return new Intl.DateTimeFormat('pt-BR', mergedOptions).format(date);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
};

/**
 * Formata uma data para exibição em formato curto (sem horas)
 * @param {Date|string|object} date - Data para formatar
 * @returns {string} Data formatada
 */
export const formatShortDate = (date) => {
  return formatDate(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: undefined,
    minute: undefined
  });
};

/**
 * Retorna uma data relativa (ex: há 2 dias, agora, etc)
 * @param {Date|string|object} date - Data para formatar
 * @returns {string} Data relativa
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  try {
    // Se for um objeto Firebase Timestamp
    if (date && typeof date.toDate === 'function') {
      date = date.toDate();
    } 
    // Se for string, converter para Date
    else if (typeof date === 'string') {
      date = new Date(date);
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', date);
      return '';
    }
    
    const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
    const now = new Date();
    const diffInSeconds = Math.floor((date - now) / 1000);
    
    // Menos de 1 minuto
    if (Math.abs(diffInSeconds) < 60) {
      return 'Agora';
    }
    
    // Menos de 1 hora
    if (Math.abs(diffInSeconds) < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return rtf.format(minutes, 'minute');
    }
    
    // Menos de 1 dia
    if (Math.abs(diffInSeconds) < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return rtf.format(hours, 'hour');
    }
    
    // Menos de 1 mês
    if (Math.abs(diffInSeconds) < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return rtf.format(days, 'day');
    }
    
    // Menos de 1 ano
    if (Math.abs(diffInSeconds) < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return rtf.format(months, 'month');
    }
    
    // Mais de 1 ano
    const years = Math.floor(diffInSeconds / 31536000);
    return rtf.format(years, 'year');
  } catch (error) {
    console.error('Erro ao calcular tempo relativo:', error);
    return formatDate(date);
  }
}; 