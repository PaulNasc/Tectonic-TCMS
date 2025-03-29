import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import styled from '@emotion/styled';

const LoadingContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
`;

const LoadingScreen = () => {
  return (
    <LoadingContainer>
      <CircularProgress size={60} sx={{ color: '#00a0fc' }} />
      <Typography
        variant="h6"
        sx={{
          mt: 2,
          color: '#ffffff',
          fontWeight: 500
        }}
      >
        Carregando...
      </Typography>
    </LoadingContainer>
  );
};

export default LoadingScreen; 