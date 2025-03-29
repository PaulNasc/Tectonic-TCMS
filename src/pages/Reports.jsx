import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import * as testService from '../services/testService';

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const StatsCard = styled(Card)`
  padding: 24px;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  height: 100%;
`;

const StatValue = styled(Typography)`
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--neon-primary);
  margin: 8px 0;
`;

const ChartCard = styled(Card)`
  padding: 24px;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  margin-top: 24px;
`;

const COLORS = ['#00C49F', '#FF8042', '#FFBB28'];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [stats, setStats] = useState({
    totalTests: 0,
    executedTests: 0,
    successRate: 0,
    statusDistribution: {
      passed: 0,
      failed: 0,
      blocked: 0
    },
    executionHistory: []
  });

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await testService.getTestStats(timeRange);
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatStatusDistribution = () => {
    const { passed, failed, blocked } = stats.statusDistribution;
    return [
      { name: 'Aprovados', value: passed },
      { name: 'Falhas', value: failed },
      { name: 'Bloqueados', value: blocked }
    ];
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Header>
          <Typography variant="h4">
            Relatórios
          </Typography>
          <FormControl 
            sx={{ 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'var(--border-color)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--neon-primary)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--neon-primary)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--text-secondary)',
                '&.Mui-focused': {
                  color: 'var(--neon-primary)',
                },
              },
              '& .MuiSelect-select': {
                color: 'var(--text-primary)',
              },
            }}
          >
            <InputLabel>Período</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Período"
            >
              <MenuItem value={7}>Última Semana</MenuItem>
              <MenuItem value={30}>Último Mês</MenuItem>
              <MenuItem value={90}>Último Trimestre</MenuItem>
            </Select>
          </FormControl>
        </Header>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatsCard>
              <Typography variant="h6" color="var(--text-primary)">
                Total de Testes
              </Typography>
              <StatValue>
                {stats.totalTests}
              </StatValue>
              <Typography variant="body2" color="var(--text-secondary)">
                Casos de teste cadastrados
              </Typography>
            </StatsCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <StatsCard>
              <Typography variant="h6" color="var(--text-primary)">
                Testes Executados
              </Typography>
              <StatValue>
                {stats.executedTests}
              </StatValue>
              <Typography variant="body2" color="var(--text-secondary)">
                No período selecionado
              </Typography>
            </StatsCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <StatsCard>
              <Typography variant="h6" color="var(--text-primary)">
                Taxa de Sucesso
              </Typography>
              <StatValue>
                {stats.successRate.toFixed(1)}%
              </StatValue>
              <Typography variant="body2" color="var(--text-secondary)">
                Testes aprovados / executados
              </Typography>
            </StatsCard>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <ChartCard>
              <Typography variant="h6" gutterBottom color="var(--text-primary)">
                Distribuição de Status
              </Typography>
              <Divider sx={{ borderColor: 'var(--border-color)', mb: 3 }} />
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={formatStatusDistribution()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {formatStatusDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </ChartCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <ChartCard>
              <Typography variant="h6" gutterBottom color="var(--text-primary)">
                Histórico de Execuções
              </Typography>
              <Divider sx={{ borderColor: 'var(--border-color)', mb: 3 }} />
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={stats.executionHistory}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="var(--text-secondary)"
                      tick={{ fill: 'var(--text-secondary)' }}
                    />
                    <YAxis 
                      stroke="var(--text-secondary)"
                      tick={{ fill: 'var(--text-secondary)' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="passed" name="Aprovados" fill={COLORS[0]} />
                    <Bar dataKey="failed" name="Falhas" fill={COLORS[1]} />
                    <Bar dataKey="blocked" name="Bloqueados" fill={COLORS[2]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </ChartCard>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default Reports; 