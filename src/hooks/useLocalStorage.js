import { useState, useEffect } from 'react';

/**
 * Hook personalizado para gerenciar dados no localStorage
 * @param {string} key - Chave para armazenar no localStorage
 * @param {any} initialValue - Valor inicial caso não exista no localStorage
 * @returns {Array} - [storedValue, setValue] par de estado e função para atualizar
 */
export const useLocalStorage = (key, initialValue) => {
  // Estado para armazenar nosso valor
  // Passa a função inicial para useState para que a lógica seja executada apenas uma vez
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Obter do localStorage pelo key
      const item = window.localStorage.getItem(key);
      // Analisar o item armazenado ou retornar initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Se ocorrer um erro, retornar initialValue
      console.error(`Erro ao recuperar do localStorage: ${error}`);
      return initialValue;
    }
  });

  // Retornar uma versão encapsulada da função setter do useState
  // que persiste o novo valor no localStorage
  const setValue = (value) => {
    try {
      // Permitir que value seja uma função para que tenhamos a mesma API que useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Salvar estado
      setStoredValue(valueToStore);
      // Salvar no localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Erro ao salvar no localStorage: ${error}`);
    }
  };

  // Efeito para atualizar o localStorage se a chave mudar
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Erro ao atualizar o localStorage: ${error}`);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}; 