import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';

const COLLECTION = 'projects';

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
        statistics: {
          totalTestCases: 0,
          passRate: 0,
          lastExecution: null
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
          passRate: 0,
          lastExecution: null
        }
      };
      
      return { data: newProject, error: null };
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
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