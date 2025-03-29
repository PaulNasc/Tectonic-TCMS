import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

const Container = styled.div`
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
  color: var(--text-primary);
`;

const ProcessesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const ProcessCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: var(--border-radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 15px;
  
  &:hover {
    box-shadow: var(--shadow-neon-primary-sm);
  }
`;

const ProcessHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProcessTitle = styled.h2`
  font-size: 18px;
  color: var(--text-primary);
  margin: 0;
`;

const ProcessStatus = styled.span`
  font-size: 12px;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  font-weight: 500;
  
  ${props => props.status === 'active' && `
    background-color: rgba(0, 255, 0, 0.1);
    color: #00cc00;
  `}
  
  ${props => props.status === 'inactive' && `
    background-color: rgba(255, 0, 0, 0.1);
    color: #ff4d4d;
  `}
  
  ${props => props.status === 'draft' && `
    background-color: rgba(255, 165, 0, 0.1);
    color: #ffa500;
  `}
`;

const ProcessDescription = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
`;

const ProcessMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-tertiary);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: auto;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border-radius: var(--border-radius-sm);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-speed) ease;
  
  ${props => props.primary && `
    background-color: var(--neon-primary);
    color: #000;
    border: none;
    
    &:hover {
      opacity: 0.9;
    }
  `}
  
  ${props => props.secondary && `
    background-color: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    
    &:hover {
      background-color: var(--bg-tertiary);
    }
  `}
`;

const qaProcesses = [
  {
    id: 1,
    title: 'Processo de Testes de API',
    description: 'Workflow completo para testes de API RESTful, incluindo validação de esquema, testes de performance e segurança.',
    status: 'active',
    created: '15/01/2023',
    steps: 12
  },
  {
    id: 2,
    title: 'Validação de UI/UX',
    description: 'Processo para garantir a consistência da interface e experiência do usuário em todos os módulos do sistema.',
    status: 'active',
    created: '03/02/2023',
    steps: 8
  },
  {
    id: 3,
    title: 'Testes de Regressão Automatizados',
    description: 'Fluxo para execução periódica de testes automatizados para identificar regressões no sistema.',
    status: 'inactive',
    created: '22/11/2022',
    steps: 5
  },
  {
    id: 4,
    title: 'Validação de Conformidade LGPD',
    description: 'Processo para validar se todas as funcionalidades estão de acordo com a Lei Geral de Proteção de Dados.',
    status: 'draft',
    created: '10/03/2023',
    steps: 9
  },
  {
    id: 5,
    title: 'Testes de Carga e Estresse',
    description: 'Workflow para testar o comportamento do sistema sob condições de carga elevada e picos de uso.',
    status: 'active',
    created: '05/12/2022',
    steps: 7
  },
  {
    id: 6,
    title: 'Análise de Segurança',
    description: 'Processo para identificar vulnerabilidades de segurança e validar a robustez do sistema contra ataques.',
    status: 'draft',
    created: '18/02/2023',
    steps: 10
  }
];

const QAProcess = () => {
  return (
    <Container>
      <Title>Processos de QA</Title>
      
      <ProcessesGrid>
        {qaProcesses.map((process) => (
          <ProcessCard 
            key={process.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: process.id * 0.1 }}
          >
            <ProcessHeader>
              <ProcessTitle>{process.title}</ProcessTitle>
              <ProcessStatus status={process.status}>
                {process.status === 'active' ? 'Ativo' : 
                 process.status === 'inactive' ? 'Inativo' : 'Rascunho'}
              </ProcessStatus>
            </ProcessHeader>
            
            <ProcessDescription>{process.description}</ProcessDescription>
            
            <ProcessMeta>
              <span>Criado em: {process.created}</span>
              <span>{process.steps} etapas</span>
            </ProcessMeta>
            
            <ActionButtons>
              <ActionButton primary>Gerenciar</ActionButton>
              <ActionButton secondary>Duplicar</ActionButton>
            </ActionButtons>
          </ProcessCard>
        ))}
      </ProcessesGrid>
    </Container>
  );
};

export default QAProcess; 