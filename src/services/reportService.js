import { db } from '../config/firebase';
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { traceabilityService } from './traceabilityService';
import { projectService } from './projectService';

const REPORTS_COLLECTION = 'reports';

export const reportService = {
  // Função para gerar relatório completo de projeto
  async generateProjectReport(projectId) {
    try {
      // Verificar se o projeto existe
      const { data: project, error: projectError } = await projectService.getProjectById(projectId);
      
      if (projectError) {
        throw new Error(`Erro ao buscar projeto: ${projectError}`);
      }
      
      // Buscar dados de cobertura e matriz de rastreabilidade
      const { data: coverageStats, error: coverageError } = await traceabilityService.getRequirementsCoverage(projectId);
      const { data: matrix, error: matrixError } = await traceabilityService.buildTraceabilityMatrix(projectId);
      
      if (coverageError) {
        console.warn(`Aviso ao buscar dados de cobertura: ${coverageError}`);
      }
      
      if (matrixError) {
        console.warn(`Aviso ao buscar matriz de rastreabilidade: ${matrixError}`);
      }
      
      // Recolher dados de casos de teste
      const testCases = [];
      
      // Processar dados da matriz para obter insights
      const requirementsInsights = processRequirementsMatrix(matrix || []);
      
      // Criar relatório
      const report = {
        projectId,
        projectName: project.name,
        projectDescription: project.description,
        generatedAt: new Date(),
        createdBy: null, // Adicionar usuário que gerou o relatório
        
        // Estatísticas gerais do projeto
        statistics: project.statistics || {},
        
        // Estatísticas de cobertura de requisitos
        requirementsCoverage: coverageStats || {
          totalRequirements: 0,
          coveredRequirements: 0,
          coveragePercent: 0,
          passedRequirements: 0,
          passRate: 0
        },
        
        // Insights sobre requisitos e casos de teste
        insights: {
          requirements: requirementsInsights,
          risk: calculateProjectRisk(coverageStats, matrix || [])
        }
      };
      
      // Salvar o relatório no Firestore
      const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
        ...report,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { 
        data: { 
          id: docRef.id,
          ...report
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de projeto:', error);
      return { data: null, error: error.message };
    }
  },
  
  // Buscar relatório específico
  async getReportById(reportId) {
    try {
      const reportRef = doc(db, REPORTS_COLLECTION, reportId);
      const reportDoc = await getDoc(reportRef);
      
      if (!reportDoc.exists()) {
        throw new Error('Relatório não encontrado');
      }
      
      const report = {
        id: reportDoc.id,
        ...reportDoc.data(),
        generatedAt: reportDoc.data().generatedAt?.toDate?.() || null,
        createdAt: reportDoc.data().createdAt?.toDate?.() || null,
        updatedAt: reportDoc.data().updatedAt?.toDate?.() || null
      };
      
      return { data: report, error: null };
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
      return { data: null, error: error.message };
    }
  },
  
  // Listar relatórios de um projeto
  async getReportsByProject(projectId) {
    try {
      const q = query(
        collection(db, REPORTS_COLLECTION),
        where('projectId', '==', projectId)
      );
      
      const reportsSnapshot = await getDocs(q);
      const reports = reportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        generatedAt: doc.data().generatedAt?.toDate?.() || null,
        createdAt: doc.data().createdAt?.toDate?.() || null,
        updatedAt: doc.data().updatedAt?.toDate?.() || null
      }));
      
      return { data: reports, error: null };
    } catch (error) {
      console.error('Erro ao listar relatórios:', error);
      return { data: [], error: error.message };
    }
  },
  
  // Obter relatório completo em formato PDF
  async generateReportPDF(reportId) {
    try {
      // Implementar geração de PDF
      throw new Error('Função ainda não implementada');
    } catch (error) {
      console.error('Erro ao gerar PDF do relatório:', error);
      return { data: null, error: error.message };
    }
  },
  
  // Obter relatório completo em formato Excel
  async generateReportExcel(reportId) {
    try {
      // Implementar geração de Excel
      throw new Error('Função ainda não implementada');
    } catch (error) {
      console.error('Erro ao gerar Excel do relatório:', error);
      return { data: null, error: error.message };
    }
  }
};

// Função auxiliar para processar a matriz de rastreabilidade
function processRequirementsMatrix(matrix) {
  // Requisitos sem cobertura
  const uncovered = matrix
    .filter(item => item.linkedTestCases.length === 0)
    .map(item => item.requirement)
    .map(req => ({
      id: req.id,
      code: req.code,
      name: req.name,
      priority: req.priority
    }));
  
  // Requisitos críticos com falhas
  const criticalWithFailures = matrix
    .filter(item => 
      (item.requirement.priority === 'Alta' || item.requirement.priority === 'Crítica') && 
      item.executionSummary.failed > 0
    )
    .map(item => ({
      id: item.requirement.id,
      code: item.requirement.code,
      name: item.requirement.name,
      priority: item.requirement.priority,
      failedTests: item.executionSummary.failed
    }));
  
  // Total por prioridade
  const byPriority = matrix.reduce((acc, item) => {
    const priority = item.requirement.priority || 'Indefinida';
    if (!acc[priority]) {
      acc[priority] = {
        total: 0,
        covered: 0,
        passed: 0,
        failed: 0
      };
    }
    
    acc[priority].total++;
    
    if (item.linkedTestCases.length > 0) {
      acc[priority].covered++;
    }
    
    if (item.passRate >= 100) {
      acc[priority].passed++;
    }
    
    if (item.executionSummary.failed > 0) {
      acc[priority].failed++;
    }
    
    return acc;
  }, {});
  
  return {
    uncovered,
    criticalWithFailures,
    byPriority
  };
}

// Função para calcular o nível de risco do projeto
function calculateProjectRisk(coverageStats, matrix) {
  if (!coverageStats) {
    return { level: 'Indefinido', score: 0, factors: [] };
  }
  
  // Calcular pontuação de risco
  let riskScore = 0;
  const riskFactors = [];
  
  // Fator 1: Cobertura geral de requisitos
  if (coverageStats.coveragePercent < 50) {
    riskScore += 30;
    riskFactors.push({
      name: 'Baixa cobertura de requisitos',
      description: 'Menos de 50% dos requisitos possuem casos de teste associados',
      impact: 'alto'
    });
  } else if (coverageStats.coveragePercent < 80) {
    riskScore += 15;
    riskFactors.push({
      name: 'Cobertura moderada de requisitos',
      description: 'Entre 50% e 80% dos requisitos possuem casos de teste associados',
      impact: 'médio'
    });
  }
  
  // Fator 2: Requisitos críticos sem cobertura
  const criticalWithoutCoverage = matrix
    .filter(item => 
      (item.requirement.priority === 'Alta' || item.requirement.priority === 'Crítica') && 
      item.linkedTestCases.length === 0
    );
  
  if (criticalWithoutCoverage.length > 0) {
    riskScore += criticalWithoutCoverage.length * 10;
    riskFactors.push({
      name: 'Requisitos críticos sem cobertura',
      description: `${criticalWithoutCoverage.length} requisitos críticos não possuem casos de teste`,
      impact: 'alto'
    });
  }
  
  // Fator 3: Requisitos críticos com falhas
  const criticalWithFailures = matrix
    .filter(item => 
      (item.requirement.priority === 'Alta' || item.requirement.priority === 'Crítica') && 
      item.executionSummary.failed > 0
    );
  
  if (criticalWithFailures.length > 0) {
    riskScore += criticalWithFailures.length * 15;
    riskFactors.push({
      name: 'Requisitos críticos com falhas',
      description: `${criticalWithFailures.length} requisitos críticos possuem casos de teste que falharam`,
      impact: 'crítico'
    });
  }
  
  // Determinar nível de risco
  let riskLevel;
  if (riskScore >= 50) {
    riskLevel = 'Crítico';
  } else if (riskScore >= 30) {
    riskLevel = 'Alto';
  } else if (riskScore >= 15) {
    riskLevel = 'Médio';
  } else {
    riskLevel = 'Baixo';
  }
  
  return {
    level: riskLevel,
    score: riskScore,
    factors: riskFactors
  };
} 