# CRM QA Test - Sistema de Gerenciamento de Testes

Um sistema completo para gerenciamento de testes de software seguindo a metodologia ORANGE, desenvolvido com React, Material UI e Firebase.

## 🔍 Sobre o Projeto

O CRM QA Test é uma plataforma abrangente para gerenciamento de testes de qualidade em projetos de software. Permite criar, organizar, executar e acompanhar testes, gerando métricas e relatórios para uma visão completa da qualidade do produto.

### Metodologia ORANGE

O sistema é baseado na metodologia ORANGE:

- **O**rganização: Projetos como unidade principal, suítes de teste organizadas por projeto e casos de teste dentro das suítes.
- **R**equisitos: Descrição detalhada dos casos de teste, pré-requisitos documentados e priorização.
- **A**utomação: Suporte para testes manuais e automatizados, cálculo de taxas de automação.
- **N**avegação: Interface intuitiva com navegação hierárquica e opções de filtragem.
- **G**erenciamento: Controle de acesso baseado em papéis, estatísticas, métricas e histórico de execução.
- **E**xecução: Execução de testes manuais e automatizados, registro de resultados e coleta de evidências.

## 🚀 Recursos Principais

- **Gerenciamento de Projetos**: Crie e gerencie projetos, defina membros e acompanhe o progresso.
- **Organização de Testes**: Organize testes em suítes lógicas com casos de teste detalhados.
- **Execução de Testes**: Execute testes e registre resultados (passou, falhou, bloqueado).
- **Relatórios**: Gere relatórios detalhados sobre progresso e qualidade dos testes.
- **Painel Administrativo**: Gerencie usuários, papéis e configurações do sistema.
- **Tema Escuro/Claro**: Interface adaptável com suporte a temas.

## 💻 Tecnologias Utilizadas

- **Frontend**: React, Material UI, Framer Motion
- **Backend**: Firebase (Firestore, Authentication)
- **Autenticação**: Firebase Authentication
- **Estrutura de Dados**: Firestore Database

## 🏗️ Arquitetura do Sistema

- **Autenticação**: Sistema completo de login, registro e recuperação de senha
- **Gerenciamento de Usuários**: Administração de usuários e papéis (admin, gerente, usuário)
- **Projetos**: Criação e gerenciamento de projetos com controle de membros
- **Suítes de Teste**: Organização lógica de testes relacionados
- **Casos de Teste**: Definição detalhada de testes individuais
- **Execução**: Sistema para executar e registrar resultados de testes
- **Relatórios**: Métricas e estatísticas para acompanhamento de progresso

## 🔧 Configuração e Uso

### Pré-requisitos

- Node.js (v14.0.0 ou superior)
- npm ou yarn
- Conta no Firebase com Firestore e Authentication configurados

### Instalação

1. Clone o repositório
   ```
   git clone https://github.com/seu-usuario/crm-qa-test.git
   cd crm-qa-test
   ```

2. Instale as dependências
   ```
   npm install
   ```

3. Configure as variáveis de ambiente criando um arquivo `.env.local` na raiz do projeto
   ```
   VITE_FIREBASE_API_KEY=seu-api-key
   VITE_FIREBASE_AUTH_DOMAIN=seu-auth-domain
   VITE_FIREBASE_PROJECT_ID=seu-project-id
   VITE_FIREBASE_STORAGE_BUCKET=seu-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu-messaging-sender-id
   VITE_FIREBASE_APP_ID=seu-app-id
   ```

4. Inicie o servidor de desenvolvimento
   ```
   npm run dev
   ```

### Acessando o Sistema

- O sistema estará acessível em `http://localhost:5173`
- Para acessar como administrador, use o email `admin@hybex` e a senha configurada

## 📋 Informações Importantes

### Índices do Firestore

Para o funcionamento correto, é necessário criar os seguintes índices no Firestore:

1. **Índice de Projetos**:
   - Coleção: `projects`
   - Campos: `memberIds` (array) ASC, `createdAt` DESC

2. **Índice de Suítes de Teste**:
   - Coleção: `testSuites`
   - Campos: `projectId` ASC, `createdAt` DESC

### Funções de Administrador

O usuário `admin@hybex` tem acesso a funcionalidades administrativas:
- Gerenciamento de usuários
- Visualização de estatísticas globais
- Opção para resetar dados do sistema (protegida por múltiplas confirmações)

## 📱 Capturas de Tela

![Dashboard](image_url_here)
![Gestão de Projetos](image_url_here)
![Execução de Testes](image_url_here)

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.

---

Desenvolvido como parte do sistema de gerenciamento de qualidade para projetos de software. 