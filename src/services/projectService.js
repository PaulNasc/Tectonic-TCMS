import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

const COLLECTION = 'projects';
const CONFIG_COLLECTION = 'configurations';

export const projectService = {
  async createProject(projectData) {
    try {
      // Garantir que o membro criador tenha todos os campos necessários
      const creatorMember = {
        userId: projectData.createdBy.id,
        name: projectData.createdBy.name,
        email: projectData.createdBy.email,
        role: 'admin',
        addedAt: new Date()
      };

      // Obter configurações globais para inicializar o projeto
      const globalConfigs = await this.getGlobalConfigurations();

      const docRef = await addDoc(collection(db, COLLECTION), {
        name: projectData.name,
        description: projectData.description,
        createdBy: projectData.createdBy,
        members: [creatorMember],
        memberIds: [projectData.createdBy.id], // Array simples com IDs para facilitar consultas
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        testSuites: [],
        environments: [],
        // Nova estrutura de estatísticas ampliada
        statistics: {
          totalTestCases: 0,
          totalSuites: 0,
          totalExecutions: 0,
          passRate: 0,
          lastExecution: null,
          automationRate: 0,
          failRate: 0,
          blockedRate: 0
        },
        // Nova estrutura de configurações
        config: {
          testTypes: globalConfigs.testTypes || [],
          priorities: globalConfigs.priorities || [],
          statuses: globalConfigs.statuses || [],
          tags: [],
          customFields: []
        }
      });
      
      const newProject = {
        id: docRef.id,
        name: projectData.name,
        description: projectData.description,
        createdBy: projectData.createdBy,
        members: [creatorMember],
        memberIds: [projectData.createdBy.id],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        testSuites: [],
        environments: [],
        statistics: {
          totalTestCases: 0,
          totalSuites: 0,
          totalExecutions: 0,
          passRate: 0,
          lastExecution: null,
          automationRate: 0,
          failRate: 0,
          blockedRate: 0
        },
        config: {
          testTypes: globalConfigs.testTypes || [],
          priorities: globalConfigs.priorities || [],
          statuses: globalConfigs.statuses || [],
          tags: [],
          customFields: []
        }
      };
      
      return { data: newProject, error: null };
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      return { data: null, error: error.message };
    }
  },

  // Função para obter configurações globais
  async getGlobalConfigurations() {
    try {
      const types = ['testTypes', 'priorities', 'statuses'];
      const configs = {};
      
      for (const type of types) {
        const q = query(
          collection(db, CONFIG_COLLECTION),
          where('type', '==', type),
          where('isGlobal', '==', true),
          orderBy('order', 'asc')
        );
        
        const snapshot = await getDocs(q);
        configs[type] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      // Se não houver configurações globais, usar valores padrão
      if (!configs.testTypes || configs.testTypes.length === 0) {
        configs.testTypes = [
          { id: 'default-manual', name: 'Manual', description: 'Testes manuais', order: 0, isGlobal: true, type: 'testTypes' },
          { id: 'default-auto', name: 'Automatizado', description: 'Testes automatizados', order: 1, isGlobal: true, type: 'testTypes' }
        ];
      }
      
      if (!configs.priorities || configs.priorities.length === 0) {
        configs.priorities = [
          { id: 'default-low', name: 'Baixa', color: '#4CAF50', order: 0, isGlobal: true, type: 'priorities' },
          { id: 'default-medium', name: 'Média', color: '#FFC107', order: 1, isGlobal: true, type: 'priorities' },
          { id: 'default-high', name: 'Alta', color: '#F44336', order: 2, isGlobal: true, type: 'priorities' }
        ];
      }
      
      if (!configs.statuses || configs.statuses.length === 0) {
        configs.statuses = [
          { id: 'default-pending', name: 'Pendente', color: '#9E9E9E', order: 0, isGlobal: true, type: 'statuses' },
          { id: 'default-progress', name: 'Em Andamento', color: '#2196F3', order: 1, isGlobal: true, type: 'statuses' },
          { id: 'default-pass', name: 'Passou', color: '#4CAF50', order: 2, isGlobal: true, type: 'statuses' },
          { id: 'default-fail', name: 'Falhou', color: '#F44336', order: 3, isGlobal: true, type: 'statuses' },
          { id: 'default-blocked', name: 'Bloqueado', color: '#9C27B0', order: 4, isGlobal: true, type: 'statuses' }
        ];
      }
      
      return configs;
    } catch (error) {
      console.error('Erro ao obter configurações globais:', error);
      // Retornar valores padrão em caso de erro
      return {
        testTypes: [
          { id: 'default-manual', name: 'Manual', description: 'Testes manuais', order: 0, isGlobal: true, type: 'testTypes' },
          { id: 'default-auto', name: 'Automatizado', description: 'Testes automatizados', order: 1, isGlobal: true, type: 'testTypes' }
        ],
        priorities: [
          { id: 'default-low', name: 'Baixa', color: '#4CAF50', order: 0, isGlobal: true, type: 'priorities' },
          { id: 'default-medium', name: 'Média', color: '#FFC107', order: 1, isGlobal: true, type: 'priorities' },
          { id: 'default-high', name: 'Alta', color: '#F44336', order: 2, isGlobal: true, type: 'priorities' }
        ],
        statuses: [
          { id: 'default-pending', name: 'Pendente', color: '#9E9E9E', order: 0, isGlobal: true, type: 'statuses' },
          { id: 'default-progress', name: 'Em Andamento', color: '#2196F3', order: 1, isGlobal: true, type: 'statuses' },
          { id: 'default-pass', name: 'Passou', color: '#4CAF50', order: 2, isGlobal: true, type: 'statuses' },
          { id: 'default-fail', name: 'Falhou', color: '#F44336', order: 3, isGlobal: true, type: 'statuses' },
          { id: 'default-blocked', name: 'Bloqueado', color: '#9C27B0', order: 4, isGlobal: true, type: 'statuses' }
        ]
      };
    }
  },

  // Método para atualizar projeto com contadores de estatísticas
  async updateProjectStatistics(projectId, update) {
    try {
      const projectRef = doc(db, COLLECTION, projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Projeto não encontrado');
      }
      
      const projectData = projectDoc.data();
      const statistics = projectData.statistics || {};
      
      // Atualizar estatísticas com os novos valores
      const updatedStats = { ...statistics };
      
      for (const [key, value] of Object.entries(update)) {
        if (typeof value === 'number' && typeof statistics[key] === 'number') {
          // Incrementar o valor existente
          updatedStats[key] = statistics[key] + value;
        } else {
          // Substituir o valor
          updatedStats[key] = value;
        }
      }
      
      // Recalcular taxas se necessário
      if (updatedStats.totalExecutions > 0) {
        if ('passCount' in update || 'totalExecutions' in update) {
          updatedStats.passRate = (updatedStats.passCount / updatedStats.totalExecutions) * 100;
        }
        
        if ('failCount' in update || 'totalExecutions' in update) {
          updatedStats.failRate = (updatedStats.failCount / updatedStats.totalExecutions) * 100;
        }
        
        if ('blockedCount' in update || 'totalExecutions' in update) {
          updatedStats.blockedRate = (updatedStats.blockedCount / updatedStats.totalExecutions) * 100;
        }
      }
      
      if (updatedStats.totalTestCases > 0 && 'automatedTestCases' in update) {
        updatedStats.automationRate = (updatedStats.automatedTestCases / updatedStats.totalTestCases) * 100;
      }
      
      await updateDoc(projectRef, {
        statistics: updatedStats,
        updatedAt: new Date()
      });
      
      return { data: updatedStats, error: null };
    } catch (error) {
      console.error('Erro ao atualizar estatísticas do projeto:', error);
      return { data: null, error: error.message };
    }
  },

  // Adicionar tag ao projeto
  async addTagToProject(projectId, tag) {
    try {
      const projectRef = doc(db, COLLECTION, projectId);
      
      const newTag = {
        id: tag.id || `tag-${Date.now()}`,
        name: tag.name,
        color: tag.color || '#3f51b5',
        description: tag.description || ''
      };
      
      await updateDoc(projectRef, {
        'config.tags': arrayUnion(newTag),
        updatedAt: new Date()
      });
      
      return { data: newTag, error: null };
    } catch (error) {
      console.error('Erro ao adicionar tag ao projeto:', error);
      return { data: null, error: error.message };
    }
  },

  // Remover tag do projeto
  async removeTagFromProject(projectId, tagId) {
    try {
      const projectRef = doc(db, COLLECTION, projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Projeto não encontrado');
      }
      
      const projectData = projectDoc.data();
      const tags = projectData.config?.tags || [];
      const tagToRemove = tags.find(tag => tag.id === tagId);
      
      if (!tagToRemove) {
        throw new Error('Tag não encontrada');
      }
      
      await updateDoc(projectRef, {
        'config.tags': arrayRemove(tagToRemove),
        updatedAt: new Date()
      });
      
      return { data: tagId, error: null };
    } catch (error) {
      console.error('Erro ao remover tag do projeto:', error);
      return { data: null, error: error.message };
    }
  },

  async getProjectById(id) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Projeto não encontrado');
      }

      const data = docSnap.data();
      
      // Converter timestamps do Firestore para Date
      const project = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        members: data.members?.map(member => ({
          ...member,
          addedAt: member.addedAt?.toDate?.() || member.addedAt
        })) || []
      };

      console.log('Projeto carregado:', project);
      return { data: project, error: null };
    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      return { data: null, error: error.message };
    }
  },

  async updateProject(id, updates) {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });

      return { data: { id, ...updates }, error: null };
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      return { data: null, error: error.message };
    }
  },

  async listProjects(filters = {}) {
    try {
      let q = collection(db, COLLECTION);
      
      // Aplicar filtros
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.userId) {
        // Buscar projetos onde o userId está na propriedade members
        q = query(q, where('memberIds', 'array-contains', filters.userId));
      }
      
      // Ordenar por data de criação
      q = query(q, orderBy('createdAt', 'desc'));
      
      console.log('Buscando projetos com filtros:', filters);
      console.log('Query Firestore:', q);
      
      const querySnapshot = await getDocs(q);
      console.log('Projetos encontrados:', querySnapshot.size);
      
      const projects = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Dados do projeto:', doc.id, data);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          members: Array.isArray(data.members) ? data.members.map(member => ({
            ...member,
            addedAt: member.addedAt?.toDate?.() || member.addedAt
          })) : []
        };
      });

      return { data: projects, error: null };
    } catch (error) {
      console.error('Erro ao listar projetos:', error);
      
      // Erro específico para índices ausentes
      if (error.code === 'failed-precondition' && error.message && error.message.includes('index')) {
        console.error('ERRO DE ÍNDICE:', error.message);
        
        // Extrair o link do índice, se disponível
        const indexUrlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com\/[^\s"')]+/);
        const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null;
        
        if (indexUrl) {
          console.log('LINK PARA CRIAR ÍNDICE:', indexUrl);
          return { data: [], error: `É necessário criar um índice composto para esta consulta. Link do índice: ${indexUrl}` };
        }
      }
      
      return { data: [], error: error.message };
    }
  },

  async addMemberToProject(projectId, member) {
    try {
      const docRef = doc(db, COLLECTION, projectId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Projeto não encontrado');
      }

      const project = docSnap.data();
      const members = project.members || [];
      let memberIds = project.memberIds || [];
      
      // Verificar se o membro já existe
      if (members.some(m => m.userId === member.userId)) {
        throw new Error('Usuário já é membro do projeto');
      }

      // Adicionar aos arrays
      members.push({
        ...member,
        addedAt: new Date()
      });
      
      memberIds.push(member.userId);

      await updateDoc(docRef, { 
        members,
        memberIds,
        updatedAt: new Date()
      });

      return { data: { id: projectId, members, memberIds }, error: null };
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      return { data: null, error: error.message };
    }
  },

  async updateProjectStatistics(projectId, statistics) {
    try {
      const docRef = doc(db, COLLECTION, projectId);
      await updateDoc(docRef, {
        statistics,
        updatedAt: new Date()
      });

      return { data: { id: projectId, statistics }, error: null };
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
      return { data: null, error: error.message };
    }
  }
}; 