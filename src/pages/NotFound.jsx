import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
`;

const Content = styled.div`
  text-align: center;
`;

const ErrorCode = styled(Typography)`
  font-size: 120px;
  font-weight: bold;
  background: linear-gradient(45deg, var(--neon-primary), var(--neon-tertiary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
`;

const HomeButton = styled(Button)`
  background: linear-gradient(45deg, var(--neon-primary), var(--neon-tertiary));
  color: #000;
  padding: 12px 24px;
  font-weight: 600;
  margin-top: 20px;
  
  &:hover {
    background: linear-gradient(45deg, var(--neon-tertiary), var(--neon-primary));
  }
`;

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Content>
          <ErrorCode variant="h1">
            404
          </ErrorCode>
          <Typography variant="h4" gutterBottom>
            Página não encontrada
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            A página que você está procurando não existe ou foi movida.
          </Typography>
          <HomeButton
            variant="contained"
            onClick={() => navigate('/')}
          >
            Voltar para o início
          </HomeButton>
        </Content>
      </motion.div>
    </Container>
  );
};

export default NotFound; 