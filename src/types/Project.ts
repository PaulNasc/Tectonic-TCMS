export type ProjectRole = 'admin' | 'manager' | 'tester' | 'viewer';

export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
  addedAt: Date;
}

export interface ProjectSettings {
  allowAutomation: boolean;
  requireEvidence: boolean;
  defaultTestTemplate: string;
  customFields: {
    name: string;
    type: 'text' | 'number' | 'select' | 'date';
    required: boolean;
    options?: string[];
  }[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  members: ProjectMember[];
  settings: ProjectSettings;
  status: 'active' | 'archived';
  testSuites: string[]; // IDs das suítes de teste
  environments: string[]; // IDs dos ambientes
  statistics: {
    totalTestCases: number;
    passRate: number;
    lastExecution: Date;
  };
} 