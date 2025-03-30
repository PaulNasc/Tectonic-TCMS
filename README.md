# Tectonic TCMS

Plataforma completa de gerenciamento de casos de testes e ciclos de execução desenvolvida com React, Material UI e Firebase. Uma solução robusta para equipes de QA gerenciarem seus processos de teste de forma eficiente e escalável.

## Características Principais

- Gerenciamento completo de projetos de teste
- Criação e organização de suítes de teste
- Definição detalhada de casos de teste com passos, pré-requisitos e resultados esperados
- Execução de ciclos de teste com ambiente configurável
- Histórico de execuções com métricas e estatísticas
- Relatórios detalhados de progresso e cobertura de testes
- Interface moderna e responsiva com Material UI
- Tema escuro (Dark Mode) para redução de fadiga visual
- Autenticação segura com Firebase
- Banco de dados em tempo real com Firestore
- Administração de usuários e permissões

## Tecnologias Utilizadas

- React 18
- Material UI 5
- Firebase (Auth & Firestore)
- Vite
- React Router
- Context API
- Custom Hooks

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Firebase
- Git

## Configuração

1. Clone o repositório:
```bash
git clone https://github.com/PaulNasc/Tectonic-TCMS.git
cd Tectonic-TCMS
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
- Copie o arquivo `.env.example` para `.env`
- Preencha as variáveis com suas credenciais do Firebase

```env
# Firebase
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id

# Configurações do App
VITE_APP_NAME=Tectonic TCMS
VITE_APP_DESCRIPTION=Plataforma de gerenciamento de testes
```

## Desenvolvimento

Para iniciar o ambiente de desenvolvimento:

```bash
npm run dev
```

## Build

Para criar uma build de produção:

```bash
npm run build
```

## Funcionalidades Detalhadas

### Gerenciamento de Projetos
- Criação de múltiplos projetos
- Associação de usuários a projetos específicos
- Visualização de status e progresso de projetos

### Suítes de Teste
- Agrupamento lógico de casos de teste
- Definição de descrição e propósito da suíte
- Métricas de passagem e cobertura

### Casos de Teste
- Definição detalhada com título, descrição e prioridade
- Pré-requisitos para execução
- Passos sequenciais de teste
- Resultados esperados
- Associação com requisitos ou funcionalidades

### Execução de Testes
- Fluxo intuitivo de execução de testes
- Definição de ambiente (Desenvolvimento, Homologação, Produção)
- Status individuais por caso de teste (Passou, Falhou, Bloqueado)
- Registro de observações por execução de teste

### Relatórios e Métricas
- Dashboard com visão geral do projeto
- Taxas de passagem por suíte e projeto
- Histórico completo de execuções
- Detalhamento de falhas e bloqueios

### Administração
- Gerenciamento de usuários
- Atribuição de papéis e permissões
- Configurações globais do sistema

## Roadmap de Funcionalidades Futuras

- Integração com sistemas de CI/CD
- API para automação de resultados
- Integração com ferramentas de bug tracking
- Exportação de relatórios em diversos formatos
- Matriz de rastreabilidade de requisitos

## Contribuições

Contribuições para este projeto são bem-vindas! Se você tem ideias, sugestões ou correções, sinta-se à vontade para:

1. Abrir uma issue descrevendo a funcionalidade ou correção proposta
2. Enviar um pull request com suas alterações
3. Compartilhar feedback sobre melhorias possíveis

Para contribuir:
```bash
# Faça um fork do repositório
# Clone seu fork
git clone https://github.com/seu-usuario/Tectonic-TCMS.git

# Adicione o repositório original como upstream
git remote add upstream https://github.com/PaulNasc/Tectonic-TCMS.git

# Crie uma branch para suas alterações
git checkout -b feature/sua-funcionalidade

# Faça commit das alterações
git commit -m "Adicionada funcionalidade X"

# Envie para seu fork
git push origin feature/sua-funcionalidade

# Abra um Pull Request no GitHub
```

## Repositório

O código-fonte está disponível em: [https://github.com/PaulNasc/Tectonic-TCMS](https://github.com/PaulNasc/Tectonic-TCMS)

## Licença

Este projeto está disponível para uso e contribuições da comunidade.

---

Desenvolvido por Paulo Ricardo Nascimento dos Santos 