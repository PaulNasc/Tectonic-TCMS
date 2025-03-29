export interface TestStep {
  id: string;
  order: number;
  description: string;
  expectedResult: string;
  type: 'manual' | 'automated';
  data?: Record<string, any>; // Dados adicionais para steps automatizados
}

export interface TestCase {
  id: string;
  sequentialId: string; // TE/XXXX
  name: string;
  description: string;
  type: 'functional' | 'integration' | 'performance' | 'security' | 'usability';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active' | 'deprecated';
  prerequisites: string[];
  steps: TestStep[];
  tags: string[];
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastExecution?: {
    id: string;
    status: 'Passou' | 'Falhou' | 'Bloqueado' | 'Não Executado';
    executedAt: Date;
    executedBy: {
      id: string;
      name: string;
    };
  };
}

export interface TestSuite {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  testCases: TestCase[];
  environment: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  statistics: {
    totalTests: number;
    passRate: number;
    lastExecution: Date;
    automationRate: number;
  };
} 