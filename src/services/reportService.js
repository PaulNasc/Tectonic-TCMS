import { db } from '../config/firebase';
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit
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
  },

  /**
   * Gera um relatório completo de qualidade do projeto
   * @param {string} projectId - ID do projeto
   * @param {object} options - Opções de configuração do relatório
   * @returns {object} Relatório completo com métricas, análises e recomendações
   */
  async generateQualityReport(projectId, options = {}) {
    try {
      if (!projectId) {
        return { error: "ID do projeto não fornecido", data: null };
      }

      const includeMetrics = options.includeMetrics !== false;
      const includeRiskAnalysis = options.includeRiskAnalysis !== false;
      const includeCoverageAnalysis = options.includeCoverageAnalysis !== false;
      
      // Obter dados do projeto
      const projectResponse = await projectService.getProjectById(projectId);
      if (projectResponse.error) {
        return { error: projectResponse.error, data: null };
      }
      
      const projectData = projectResponse.data || projectResponse;
      
      // Relatório base
      const report = {
        projectId,
        projectName: projectData.name,
        generatedAt: new Date().toISOString(),
        summary: {},
        metrics: {},
        riskAnalysis: {},
        coverageAnalysis: {},
        recommendations: []
      };
      
      // Obter métricas de cobertura
      const coverageResponse = await traceabilityService.getRequirementsCoverage(projectId);
      if (coverageResponse.error) {
        console.warn("Erro ao obter dados de cobertura:", coverageResponse.error);
      } else {
        const coverageData = coverageResponse.data || {};
        
        // Adicionar ao sumário
        report.summary = {
          totalRequirements: coverageData.totalRequirements || 0,
          coveredRequirements: coverageData.coveredRequirements || 0,
          coveragePercentage: coverageData.coveragePercent || 0,
          passedRequirements: coverageData.passedRequirements || 0,
          failedRequirements: coverageData.failedRequirements || 0,
          passRate: coverageData.passRate || 0,
          totalTestCases: projectData.statistics?.totalTestsCount || 0,
          automatedTestCases: projectData.statistics?.automatedTestsCount || 0,
          automationRate: projectData.statistics?.automatedTestsCount 
            ? (projectData.statistics.automatedTestsCount / projectData.statistics.totalTestsCount) * 100 
            : 0
        };
        
        // Incluir métricas detalhadas se solicitado
        if (includeMetrics) {
          report.metrics = {
            requirements: {
              total: coverageData.totalRequirements || 0,
              covered: coverageData.coveredRequirements || 0,
              uncovered: (coverageData.totalRequirements || 0) - (coverageData.coveredRequirements || 0),
              coveragePercent: coverageData.coveragePercent || 0,
              priorityCoverage: coverageData.priorityCoverage || {},
              qualityScore: this._calculateQualityScore(coverageData.coveragePercent || 0, 100)
            },
            testing: {
              total: projectData.statistics?.totalTestsCount || 0,
              executed: projectData.statistics?.executedTestsCount || 0,
              passed: projectData.statistics?.passCount || 0,
              failed: projectData.statistics?.failCount || 0,
              executionRate: projectData.statistics?.totalTestsCount 
                ? (projectData.statistics.executedTestsCount / projectData.statistics.totalTestsCount) * 100 
                : 0,
              passRate: projectData.statistics?.executedTestsCount 
                ? (projectData.statistics.passCount / projectData.statistics.executedTestsCount) * 100 
                : 0,
              qualityScore: this._calculateQualityScore(
                projectData.statistics?.executedTestsCount 
                  ? (projectData.statistics.passCount / projectData.statistics.executedTestsCount) * 100 
                  : 0, 
                100
              )
            },
            automation: {
              total: projectData.statistics?.totalTestsCount || 0,
              automated: projectData.statistics?.automatedTestsCount || 0,
              manual: (projectData.statistics?.totalTestsCount || 0) - (projectData.statistics?.automatedTestsCount || 0),
              automationRate: projectData.statistics?.totalTestsCount 
                ? (projectData.statistics.automatedTestsCount / projectData.statistics.totalTestsCount) * 100 
                : 0,
              qualityScore: this._calculateQualityScore(
                projectData.statistics?.totalTestsCount 
                  ? (projectData.statistics.automatedTestsCount / projectData.statistics.totalTestsCount) * 100 
                  : 0, 
                100,
                0.8  // Fator de escala para automação (80% é considerado excelente)
              )
            }
          };
          
          // Calcular pontuação geral de qualidade
          report.metrics.overallQualityScore = (
            report.metrics.requirements.qualityScore +
            report.metrics.testing.qualityScore +
            report.metrics.automation.qualityScore
          ) / 3;
        }
        
        // Incluir análise de risco se solicitado
        if (includeRiskAnalysis) {
          // Obter matriz de rastreabilidade para análise de risco
          const matrixResponse = await traceabilityService.buildTraceabilityMatrix(projectId);
          if (!matrixResponse.error && matrixResponse.data) {
            const matrixData = matrixResponse.data;
            
            // Análise de requisitos críticos sem cobertura
            const criticalUncovered = matrixData.filter(item => 
              (item.requirement.priority === 'Alta' || item.requirement.priority === 'Crítica') && 
              item.linkedTestCases.length === 0
            );
            
            // Análise de requisitos críticos com testes falhando
            const criticalFailing = matrixData.filter(item => 
              (item.requirement.priority === 'Alta' || item.requirement.priority === 'Crítica') && 
              item.linkedTestCases.some(tc => tc.status === 'failed')
            );
            
            // Análise de risco
            report.riskAnalysis = {
              riskLevel: this._calculateRiskLevel(
                criticalUncovered.length, 
                coverageData.totalRequirements || 0,
                criticalFailing.length,
                coverageData.coveredRequirements || 0
              ),
              criticalUncoveredCount: criticalUncovered.length,
              criticalFailingCount: criticalFailing.length,
              criticalUncovered: criticalUncovered.map(item => ({
                id: item.requirement.id,
                name: item.requirement.name,
                priority: item.requirement.priority,
                description: item.requirement.description
              })),
              criticalFailing: criticalFailing.map(item => ({
                id: item.requirement.id,
                name: item.requirement.name,
                priority: item.requirement.priority,
                description: item.requirement.description,
                failingTests: item.linkedTestCases
                  .filter(tc => tc.status === 'failed')
                  .map(tc => ({
                    id: tc.id,
                    name: tc.name,
                    status: tc.status
                  }))
              }))
            };
            
            // Adicionar recomendações baseadas na análise de risco
            if (criticalUncovered.length > 0) {
              report.recommendations.push({
                type: "high",
                area: "coverage",
                message: `Adicione cobertura de teste para ${criticalUncovered.length} requisitos críticos sem testes.`,
                details: `Requisitos críticos sem cobertura representam um alto risco para a qualidade do projeto.`
              });
            }
            
            if (criticalFailing.length > 0) {
              report.recommendations.push({
                type: "critical",
                area: "execution",
                message: `Corrija falhas em ${criticalFailing.length} requisitos críticos com testes falhando.`,
                details: `Falhas em requisitos críticos indicam problemas graves que precisam de atenção imediata.`
              });
            }
          }
        }
        
        // Incluir análise de cobertura se solicitado
        if (includeCoverageAnalysis) {
          // Obter dados de cobertura por prioridade
          const priorityCoverage = coverageData.priorityCoverage || {};
          
          // Análise de cobertura
          report.coverageAnalysis = {
            overallCoverage: coverageData.coveragePercent || 0,
            coverageByPriority: priorityCoverage,
            trendAnalysis: {
              current: coverageData.coveragePercent || 0,
              target: 95,
              gap: 95 - (coverageData.coveragePercent || 0),
              status: this._getCoverageStatus(coverageData.coveragePercent || 0)
            }
          };
          
          // Adicionar recomendações baseadas na análise de cobertura
          if (report.coverageAnalysis.overallCoverage < 70) {
            report.recommendations.push({
              type: "medium",
              area: "coverage",
              message: `Aumente a cobertura geral de requisitos (atualmente em ${Math.round(report.coverageAnalysis.overallCoverage)}%).`,
              details: `Uma cobertura abaixo de 70% indica que muitos requisitos não estão sendo testados adequadamente.`
            });
          }
          
          // Verificar cobertura por prioridade
          for (const [priority, data] of Object.entries(priorityCoverage)) {
            if ((priority === 'Alta' || priority === 'Crítica') && data.coveragePercent < 80) {
              report.recommendations.push({
                type: "high",
                area: "coverage",
                message: `Aumente a cobertura de requisitos de prioridade ${priority} (atualmente em ${Math.round(data.coveragePercent)}%).`,
                details: `Requisitos de alta prioridade devem ter cobertura de pelo menos 80%.`
              });
            }
          }
        }
        
        // Adicionar recomendações gerais baseadas nos dados
        this._addGeneralRecommendations(report);
      }
      
      // Registrar relatório no Firestore se não for uma visualização prévia
      if (!options.preview) {
        await this._saveReportToFirestore(report);
      }
      
      return { data: report, error: null };
    } catch (error) {
      console.error("Erro ao gerar relatório de qualidade:", error);
      return { 
        error: `Erro ao gerar relatório: ${error.message}`, 
        data: null 
      };
    }
  },
  
  /**
   * Obtém relatórios históricos de um projeto
   * @param {string} projectId - ID do projeto
   * @param {number} limit - Limite de relatórios a serem retornados
   * @returns {Array} Lista de relatórios históricos
   */
  async getProjectReports(projectId, maxReports = 10) {
    try {
      if (!projectId) {
        return { error: "ID do projeto não fornecido", data: [] };
      }
      
      const reportsRef = collection(db, "reports");
      const q = query(
        reportsRef,
        where("projectId", "==", projectId),
        orderBy("generatedAt", "desc"),
        limit(maxReports)
      );
      
      const querySnapshot = await getDocs(q);
      const reports = [];
      
      querySnapshot.forEach((doc) => {
        reports.push({
          id: doc.id,
          ...doc.data(),
          generatedAt: doc.data().generatedAt.toDate().toISOString()
        });
      });
      
      return { data: reports, error: null };
    } catch (error) {
      console.error("Erro ao obter relatórios do projeto:", error);
      return { 
        error: `Erro ao obter relatórios: ${error.message}`, 
        data: [] 
      };
    }
  },
  
  /**
   * Calcula pontuação de qualidade baseada em um valor e meta
   * @private
   */
  _calculateQualityScore(value, target, scaleFactor = 1) {
    // Converter para escala de 0-5, onde 5 é o valor alvo
    const rawScore = (value / target) * 5 * scaleFactor;
    return Math.min(5, Math.max(0, rawScore));
  },
  
  /**
   * Calcula nível de risco baseado em cobertura e falhas
   * @private
   */
  _calculateRiskLevel(criticalUncoveredCount, totalRequirements, criticalFailingCount, coveredRequirements) {
    if (totalRequirements === 0) return "Indefinido";
    
    // Calcular porcentagens relativas
    const uncoveredRatio = criticalUncoveredCount / totalRequirements;
    const failingRatio = coveredRequirements > 0 ? criticalFailingCount / coveredRequirements : 0;
    
    // Ponderar o risco
    const riskScore = (uncoveredRatio * 0.6) + (failingRatio * 0.4);
    
    if (riskScore >= 0.20 || criticalUncoveredCount >= 3 || criticalFailingCount >= 3) {
      return "Crítico";
    } else if (riskScore >= 0.10 || criticalUncoveredCount >= 1 || criticalFailingCount >= 1) {
      return "Alto";
    } else if (riskScore >= 0.05) {
      return "Médio";
    } else {
      return "Baixo";
    }
  },
  
  /**
   * Determina o status de cobertura
   * @private
   */
  _getCoverageStatus(coveragePercent) {
    if (coveragePercent >= 90) return "Excelente";
    if (coveragePercent >= 75) return "Boa";
    if (coveragePercent >= 60) return "Regular";
    if (coveragePercent >= 40) return "Insuficiente";
    return "Crítica";
  },
  
  /**
   * Adiciona recomendações gerais ao relatório
   * @private
   */
  _addGeneralRecommendations(report) {
    const { metrics, summary } = report;
    
    // Verificar automação
    if (summary.automationRate < 30) {
      report.recommendations.push({
        type: "low",
        area: "automation",
        message: `Considere aumentar o nível de automação de testes (atualmente em ${Math.round(summary.automationRate)}%).`,
        details: `Maior automação reduz tempo de execução e aumenta a confiabilidade dos testes.`
      });
    }
    
    // Verificar taxa de aprovação
    if (summary.passRate < 80 && summary.coveredRequirements > 0) {
      report.recommendations.push({
        type: "medium",
        area: "execution",
        message: `Melhore a taxa de aprovação nos testes (atualmente em ${Math.round(summary.passRate)}%).`,
        details: `Uma taxa de aprovação baixa indica problemas de qualidade ou testes desatualizados.`
      });
    }
    
    // Ordenar recomendações por tipo (critical, high, medium, low)
    const priorityOrder = { "critical": 0, "high": 1, "medium": 2, "low": 3 };
    report.recommendations.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);
  },
  
  /**
   * Salva o relatório no Firestore
   * @private
   */
  async _saveReportToFirestore(report) {
    try {
      const reportsRef = collection(db, "reports");
      const reportToSave = {
        ...report,
        generatedAt: Timestamp.fromDate(new Date())
      };
      
      await addDoc(reportsRef, reportToSave);
    } catch (error) {
      console.error("Erro ao salvar relatório no Firestore:", error);
      throw error;
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