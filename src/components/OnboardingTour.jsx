import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useTheme } from '@mui/material/styles';
import { Typography, Button, Box } from '@mui/material';
import { useLocalStorage } from '../hooks/useLocalStorage';

const tourSteps = {
  dashboard: [
    {
      target: 'body',
      content: (
        <Box>
          <Typography variant="h6">Bem-vindo ao Tectonic TCMS!</Typography>
          <Typography variant="body2">
            Vamos conhecer as principais funcionalidades do sistema. Você pode pular este tour a qualquer momento.
          </Typography>
        </Box>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="dashboard-stats"]',
      content: 'Aqui você encontra estatísticas gerais do sistema, como total de testes, execuções e taxas de sucesso.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="projects-menu"]',
      content: 'Gerencie seus projetos de teste, crie novas suítes e organize seu trabalho.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="reports-menu"]',
      content: 'Acesse relatórios detalhados sobre os testes e suas execuções.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="user-menu"]',
      content: 'Acesse seu perfil, configurações e ferramentas administrativas.',
      disableBeacon: true,
    },
  ],
  projectView: [
    {
      target: 'body',
      content: (
        <Box>
          <Typography variant="h6">Visão do Projeto</Typography>
          <Typography variant="body2">
            Vamos conhecer como gerenciar projetos no Tectonic TCMS.
          </Typography>
        </Box>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="create-suite"]',
      content: 'Crie novas suítes de teste para seu projeto.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="project-members"]',
      content: 'Gerencie os membros e permissões do projeto.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="project-stats"]',
      content: 'Visualize estatísticas específicas deste projeto.',
      disableBeacon: true,
    },
  ],
  testSuite: [
    {
      target: 'body',
      content: (
        <Box>
          <Typography variant="h6">Suíte de Testes</Typography>
          <Typography variant="body2">
            Vamos conhecer como gerenciar casos de teste.
          </Typography>
        </Box>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="add-test-case"]',
      content: 'Adicione novos casos de teste à suíte.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="execute-suite"]',
      content: 'Execute a suíte de testes para registrar resultados.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="test-history"]',
      content: 'Visualize o histórico de execuções desta suíte.',
      disableBeacon: true,
    },
  ],
};

const OnboardingTour = () => {
  const location = useLocation();
  const theme = useTheme();
  const [tourState, setTourState] = useState({
    run: false,
    steps: [],
    stepIndex: 0,
  });
  const [completedTours, setCompletedTours] = useLocalStorage('completedTours', {});

  // Determinar quais passos exibir com base na rota atual
  useEffect(() => {
    let currentSteps = [];
    let shouldRun = false;

    // Dashboard
    if (location.pathname === '/') {
      currentSteps = tourSteps.dashboard;
      shouldRun = !completedTours.dashboard;
    }
    // Project View
    else if (location.pathname.match(/^\/projects\/[^\/]+$/)) {
      currentSteps = tourSteps.projectView;
      shouldRun = !completedTours.projectView;
    }
    // Test Suite
    else if (location.pathname.match(/^\/projects\/[^\/]+\/suites\/[^\/]+$/)) {
      currentSteps = tourSteps.testSuite;
      shouldRun = !completedTours.testSuite;
    }

    if (currentSteps.length > 0) {
      setTourState({
        run: shouldRun,
        steps: currentSteps,
        stepIndex: 0,
      });
    }
  }, [location, completedTours]);

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      // Atualizar o índice do passo
      setTourState(prevState => ({
        ...prevState,
        stepIndex: index + (action === ACTIONS.PREV ? -1 : 1),
      }));
    }

    // Tour completo ou pulado
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Marcar este tour como completo
      const tourKey = location.pathname === '/' 
        ? 'dashboard' 
        : location.pathname.match(/^\/projects\/[^\/]+$/) 
          ? 'projectView' 
          : 'testSuite';
      
      setCompletedTours({
        ...completedTours,
        [tourKey]: true,
      });
      
      setTourState(prevState => ({ ...prevState, run: false }));
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={tourState.run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={tourState.steps}
      stepIndex={tourState.stepIndex}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: theme.palette.primary.main,
          backgroundColor: theme.palette.background.paper,
          textColor: theme.palette.text.primary,
          arrowColor: theme.palette.background.paper,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonBack: {
          marginRight: 10,
        },
        buttonSkip: {
          color: theme.palette.text.secondary,
        },
      }}
      locale={{
        back: 'Anterior',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular',
      }}
    />
  );
};

export default OnboardingTour; 