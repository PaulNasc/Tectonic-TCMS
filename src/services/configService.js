import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

const CONFIG_COLLECTION = 'configurations';

export const configService = {
  // Obter configurações aplicáveis a um elemento (globais + específicas do projeto)
  async getApplicableConfigs(type, projectId) {
    try {
      // Verificar se tipo foi fornecido
      if (!type) {
        throw new Error('Tipo de configuração é obrigatório');
      }
      
      let configsQuery;
      
      if (projectId) {
        // Buscar configurações específicas do projeto + configurações globais
        configsQuery = query(
          collection(db, 'configurations'),
          where('type', '==', type),
          where('projectId', '==', projectId),
          orderBy('order', 'asc')
        );
      } else {
        // Buscar apenas configurações globais
        configsQuery = query(
          collection(db, 'configurations'),
          where('type', '==', type),
          where('isGlobal', '==', true),
          orderBy('order', 'asc')
        );
      }
      
      const snapshot = await getDocs(configsQuery);
      
      const configs = snapshot.docs.map(doc => ({
        id: doc.id,
        value: doc.data().name,
        label: doc.data().name,
        ...doc.data()
      }));
      
      return { data: configs, error: null };
    } catch (error) {
      console.error(`Erro ao buscar configurações de ${type}:`, error);
      return { data: [], error: error.message };
    }
  },
  
  // Criar nova configuração (global ou específica do projeto)
  async createConfig(configData) {
    try {
      // Validar dados de entrada
      if (!configData.name || !configData.type) {
        throw new Error('Nome e tipo são obrigatórios');
      }
      
      const newConfig = {
        name: configData.name,
        description: configData.description || '',
        color: configData.color || '#808080',
        type: configData.type,
        isGlobal: configData.isGlobal || false,
        projectId: configData.isGlobal ? null : configData.projectId,
        order: configData.order || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Se for configuração de projeto, verificar se o projeto existe
      if (!newConfig.isGlobal && newConfig.projectId) {
        const projectRef = doc(db, 'projects', newConfig.projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (!projectDoc.exists()) {
          throw new Error('Projeto não encontrado');
        }
      }
      
      // Verificar se já existe uma configuração com o mesmo nome e tipo
      const existingQ = newConfig.isGlobal 
        ? query(
            collection(db, CONFIG_COLLECTION),
            where('name', '==', newConfig.name),
            where('type', '==', newConfig.type),
            where('isGlobal', '==', true)
          )
        : query(
            collection(db, CONFIG_COLLECTION),
            where('name', '==', newConfig.name),
            where('type', '==', newConfig.type),
            where('projectId', '==', newConfig.projectId)
          );
      
      const existingSnapshot = await getDocs(existingQ);
      
      if (!existingSnapshot.empty) {
        throw new Error(`Já existe uma configuração de ${newConfig.type} com o nome '${newConfig.name}'`);
      }
      
      const docRef = await addDoc(collection(db, CONFIG_COLLECTION), newConfig);
      
      return { 
        data: { 
          id: docRef.id, 
          ...newConfig,
          createdAt: new Date(),
          updatedAt: new Date()
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Erro ao criar configuração:', error);
      return { data: null, error: error.message };
    }
  },
  
  // Atualizar configuração existente
  async updateConfig(id, configData) {
    try {
      const configRef = doc(db, CONFIG_COLLECTION, id);
      const configDoc = await getDoc(configRef);
      
      if (!configDoc.exists()) {
        throw new Error('Configuração não encontrada');
      }
      
      const currentConfig = configDoc.data();
      
      // Não permitir mudar o tipo ou o atributo isGlobal
      delete configData.type;
      delete configData.isGlobal;
      delete configData.projectId;
      
      const updateData = {
        ...configData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(configRef, updateData);
      
      return { 
        data: { 
          id, 
          ...currentConfig, 
          ...updateData,
          updatedAt: new Date()
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      return { data: null, error: error.message };
    }
  },
  
  // Excluir configuração
  async deleteConfig(id) {
    try {
      const configRef = doc(db, CONFIG_COLLECTION, id);
      const configDoc = await getDoc(configRef);
      
      if (!configDoc.exists()) {
        throw new Error('Configuração não encontrada');
      }
      
      await deleteDoc(configRef);
      
      return { data: id, error: null };
    } catch (error) {
      console.error('Erro ao excluir configuração:', error);
      return { data: null, error: error.message };
    }
  },
  
  // Obter todas as configurações globais
  async getAllGlobalConfigs() {
    try {
      const q = query(
        collection(db, CONFIG_COLLECTION),
        where('isGlobal', '==', true),
        orderBy('type'),
        orderBy('order')
      );
      
      const snapshot = await getDocs(q);
      const configs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || null,
        updatedAt: doc.data().updatedAt?.toDate?.() || null
      }));
      
      // Agrupar por tipo
      const groupedConfigs = configs.reduce((acc, config) => {
        if (!acc[config.type]) {
          acc[config.type] = [];
        }
        acc[config.type].push(config);
        return acc;
      }, {});
      
      return { data: groupedConfigs, error: null };
    } catch (error) {
      console.error('Erro ao obter configurações globais:', error);
      return { data: null, error: error.message };
    }
  },
  
  // Obter configurações de um projeto específico
  async getProjectConfigs(projectId) {
    try {
      const q = query(
        collection(db, CONFIG_COLLECTION),
        where('projectId', '==', projectId),
        orderBy('type'),
        orderBy('order')
      );
      
      const snapshot = await getDocs(q);
      const configs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || null,
        updatedAt: doc.data().updatedAt?.toDate?.() || null
      }));
      
      // Agrupar por tipo
      const groupedConfigs = configs.reduce((acc, config) => {
        if (!acc[config.type]) {
          acc[config.type] = [];
        }
        acc[config.type].push(config);
        return acc;
      }, {});
      
      return { data: groupedConfigs, error: null };
    } catch (error) {
      console.error('Erro ao obter configurações do projeto:', error);
      return { data: null, error: error.message };
    }
  },
  
  // Aplicar configuração ao criar/atualizar um elemento
  async validateConfigValue(element, configType, projectId) {
    try {
      // Obter configurações aplicáveis
      const { data: configs } = await this.getApplicableConfigs(configType, projectId);
      
      // Verificar se o valor atual é válido baseado nas configurações
      const validValues = configs.map(c => c.name);
      
      // Se o valor não for válido, usar o primeiro valor disponível
      if (!element[configType] || !validValues.includes(element[configType])) {
        element[configType] = validValues[0] || '';
      }
      
      // Adicionar metadados da configuração
      const config = configs.find(c => c.name === element[configType]);
      if (config) {
        element[`${configType}Color`] = config.color;
        element[`${configType}Description`] = config.description;
      }
      
      return element;
    } catch (error) {
      console.error(`Erro ao validar configuração ${configType}:`, error);
      // Em caso de erro, manter o valor original
      return element;
    }
  },

  // Criar configurações padrão (globais)
  async createDefaultConfigurations() {
    try {
      const defaultConfigs = [
        // Tipos de teste
        {
          name: 'Manual',
          description: 'Testes executados manualmente por um testador',
          type: 'testTypes',
          isGlobal: true,
          order: 0
        },
        {
          name: 'Automatizado',
          description: 'Testes executados por scripts automatizados',
          type: 'testTypes',
          isGlobal: true,
          order: 1
        },
        {
          name: 'Exploratório',
          description: 'Testes sem script predefinido, explorando o sistema',
          type: 'testTypes',
          isGlobal: true,
          order: 2
        },
        
        // Prioridades
        {
          name: 'Baixa',
          description: 'Testes de prioridade baixa',
          color: '#4CAF50',
          type: 'priorities',
          isGlobal: true,
          order: 0
        },
        {
          name: 'Média',
          description: 'Testes de prioridade média',
          color: '#FFC107',
          type: 'priorities',
          isGlobal: true,
          order: 1
        },
        {
          name: 'Alta',
          description: 'Testes de prioridade alta',
          color: '#F44336',
          type: 'priorities',
          isGlobal: true,
          order: 2
        },
        {
          name: 'Crítica',
          description: 'Testes de prioridade crítica',
          color: '#9C27B0',
          type: 'priorities',
          isGlobal: true,
          order: 3
        },
        
        // Status
        {
          name: 'Pendente',
          description: 'Teste aguardando execução',
          color: '#9E9E9E',
          type: 'statuses',
          isGlobal: true,
          order: 0
        },
        {
          name: 'Em Andamento',
          description: 'Teste em execução',
          color: '#2196F3',
          type: 'statuses',
          isGlobal: true,
          order: 1
        },
        {
          name: 'Passou',
          description: 'Teste executado com sucesso',
          color: '#4CAF50',
          type: 'statuses',
          isGlobal: true,
          order: 2
        },
        {
          name: 'Falhou',
          description: 'Teste executado com falha',
          color: '#F44336',
          type: 'statuses',
          isGlobal: true,
          order: 3
        },
        {
          name: 'Bloqueado',
          description: 'Teste não pode ser executado',
          color: '#9C27B0',
          type: 'statuses',
          isGlobal: true,
          order: 4
        }
      ];
      
      // Verificar quais configurações já existem para não duplicar
      const { data: existingConfigs } = await this.getAllGlobalConfigs();
      
      const existingTypes = existingConfigs?.testTypes?.map(c => c.name) || [];
      const existingPriorities = existingConfigs?.priorities?.map(c => c.name) || [];
      const existingStatuses = existingConfigs?.statuses?.map(c => c.name) || [];
      
      const configsToCreate = defaultConfigs.filter(config => {
        if (config.type === 'testTypes' && existingTypes.includes(config.name)) {
          return false;
        }
        if (config.type === 'priorities' && existingPriorities.includes(config.name)) {
          return false;
        }
        if (config.type === 'statuses' && existingStatuses.includes(config.name)) {
          return false;
        }
        return true;
      });
      
      // Criar as configurações padrão que não existem
      for (const config of configsToCreate) {
        await this.createConfig(config);
      }
      
      return { data: true, error: null };
    } catch (error) {
      console.error('Erro ao criar configurações padrão:', error);
      return { data: null, error: error.message };
    }
  }
}; 