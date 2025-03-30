import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { db } from '../../config/firebase';
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

const StyledTableCell = styled(TableCell)(({ theme, covered }) => ({
  backgroundColor: covered 
    ? theme.palette.success.light 
    : theme.palette.error.light,
  color: covered 
    ? theme.palette.success.contrastText 
    : theme.palette.error.contrastText,
  cursor: 'pointer',
  '&:hover': {
    opacity: 0.9
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  backgroundColor: 
    status === 'active' ? theme.palette.success.light :
    status === 'draft' ? theme.palette.warning.light :
    status === 'deprecated' ? theme.palette.error.light :
    theme.palette.grey[500],
  color: 
    status === 'active' ? theme.palette.success.contrastText :
    status === 'draft' ? theme.palette.warning.contrastText :
    status === 'deprecated' ? theme.palette.error.contrastText :
    theme.palette.common.white
}));

const RequirementsTraceabilityMatrix = ({ projectId }) => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [traceabilityMap, setTraceabilityMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAddRequirement, setOpenAddRequirement] = useState(false);
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [linkData, setLinkData] = useState(null);
  const [newRequirement, setNewRequirement] = useState({
    name: '',
    description: '',
    priority: 'medium',
    category: '',
    status: 'active'
  });
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [availableTestCases, setAvailableTestCases] = useState([]);
  
  // Carregar requisitos e casos de teste do projeto
  useEffect(() => {
    const fetchTraceabilityData = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Buscar requisitos
        const requirementsRef = collection(db, 'requirements');
        const requirementsQuery = query(requirementsRef, where('projectId', '==', projectId));
        const requirementsSnapshot = await getDocs(requirementsQuery);
        
        const requirementsList = requirementsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        }));
        
        // Buscar teste suites e seus casos de teste
        const suitesRef = collection(db, 'testSuites');
        const suitesQuery = query(suitesRef, where('projectId', '==', projectId));
        const suitesSnapshot = await getDocs(suitesQuery);
        
        let allTestCases = [];
        
        for (const suiteDoc of suitesSnapshot.docs) {
          const suiteData = suiteDoc.data();
          const testCasesList = suiteData.testCases || [];
          
          // Mapear casos de teste da suíte
          const mappedTestCases = testCasesList.map(tc => ({
            id: tc.id,
            ...tc,
            suiteId: suiteDoc.id,
            suiteName: suiteData.name
          }));
          
          allTestCases = [...allTestCases, ...mappedTestCases];
        }
        
        // Buscar relacionamentos de rastreabilidade
        const traceabilityRef = collection(db, 'traceability');
        const traceabilityQuery = query(traceabilityRef, where('projectId', '==', projectId));
        const traceabilitySnapshot = await getDocs(traceabilityQuery);
        
        const traceabilityData = {};
        
        traceabilitySnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.requirementId && data.testCaseId) {
            if (!traceabilityData[data.requirementId]) {
              traceabilityData[data.requirementId] = [];
            }
            traceabilityData[data.requirementId].push({
              testCaseId: data.testCaseId,
              id: doc.id,
              coverage: data.coverage || 'partial'
            });
          }
        });
        
        setRequirements(requirementsList);
        setTestCases(allTestCases);
        setTraceabilityMap(traceabilityData);
      } catch (err) {
        console.error('Erro ao carregar dados de rastreabilidade:', err);
        setError('Erro ao carregar matriz de rastreabilidade');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTraceabilityData();
  }, [projectId]);
  
  // Manipuladores para adição de requisitos
  const handleOpenAddRequirement = () => {
    setOpenAddRequirement(true);
    setNewRequirement({
      name: '',
      description: '',
      priority: 'medium',
      category: '',
      status: 'active'
    });
  };
  
  const handleCloseAddRequirement = () => {
    setOpenAddRequirement(false);
  };
  
  const handleRequirementChange = (e) => {
    const { name, value } = e.target;
    setNewRequirement(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveRequirement = async () => {
    try {
      if (!newRequirement.name) {
        return;
      }
      
      const requirementData = {
        ...newRequirement,
        projectId,
        createdBy: user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'requirements'), requirementData);
      
      // Atualizar estado local
      setRequirements(prev => [...prev, {
        id: docRef.id,
        ...requirementData,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
      
      setOpenAddRequirement(false);
    } catch (err) {
      console.error('Erro ao adicionar requisito:', err);
      setError('Falha ao adicionar requisito');
    }
  };
  
  // Manipuladores para vincular teste a requisito
  const handleOpenLinkDialog = (requirementId) => {
    // Filtrar os casos de teste que não estão vinculados a este requisito
    const linkedTestIds = (traceabilityMap[requirementId] || []).map(link => link.testCaseId);
    const unlinkedTests = testCases.filter(tc => !linkedTestIds.includes(tc.id));
    
    setAvailableTestCases(unlinkedTests);
    setLinkData({
      requirementId,
      selectedTests: []
    });
    setOpenLinkDialog(true);
  };
  
  const handleCloseLinkDialog = () => {
    setOpenLinkDialog(false);
    setLinkData(null);
    setSelectedTestCase(null);
  };
  
  const handleSelectTest = (event, test) => {
    setSelectedTestCase(test);
  };
  
  const handleSaveLink = async () => {
    if (!linkData.requirementId || !selectedTestCase) return;
    
    try {
      // Adicionar relação de rastreabilidade
      const traceabilityData = {
        projectId,
        requirementId: linkData.requirementId,
        testCaseId: selectedTestCase.id,
        createdBy: user.id,
        createdAt: serverTimestamp(),
        coverage: 'partial' // Padrão
      };
      
      const docRef = await addDoc(collection(db, 'traceability'), traceabilityData);
      
      // Atualizar estado local
      setTraceabilityMap(prev => {
        const updated = { ...prev };
        if (!updated[linkData.requirementId]) {
          updated[linkData.requirementId] = [];
        }
        updated[linkData.requirementId].push({
          testCaseId: selectedTestCase.id,
          id: docRef.id,
          coverage: 'partial'
        });
        return updated;
      });
      
      handleCloseLinkDialog();
    } catch (err) {
      console.error('Erro ao vincular teste a requisito:', err);
      setError('Falha ao vincular teste a requisito');
    }
  };
  
  // Remover vínculo entre teste e requisito
  const handleRemoveLink = async (requirementId, linkId) => {
    try {
      // Remover relação de rastreabilidade
      await deleteDoc(doc(db, 'traceability', linkId));
      
      // Atualizar estado local
      setTraceabilityMap(prev => {
        const updated = { ...prev };
        if (updated[requirementId]) {
          updated[requirementId] = updated[requirementId].filter(link => link.id !== linkId);
        }
        return updated;
      });
    } catch (err) {
      console.error('Erro ao remover vínculo:', err);
      setError('Falha ao remover vínculo');
    }
  };
  
  // Alternar cobertura (total/parcial) de um vínculo
  const handleToggleCoverage = async (requirementId, linkId, currentCoverage) => {
    try {
      const newCoverage = currentCoverage === 'full' ? 'partial' : 'full';
      
      // Atualizar documento
      await updateDoc(doc(db, 'traceability', linkId), {
        coverage: newCoverage
      });
      
      // Atualizar estado local
      setTraceabilityMap(prev => {
        const updated = { ...prev };
        if (updated[requirementId]) {
          updated[requirementId] = updated[requirementId].map(link => 
            link.id === linkId ? { ...link, coverage: newCoverage } : link
          );
        }
        return updated;
      });
    } catch (err) {
      console.error('Erro ao atualizar cobertura:', err);
      setError('Falha ao atualizar cobertura');
    }
  };
  
  // Verificar se um requisito tem pelo menos um teste vinculado
  const isRequirementCovered = (requirementId) => {
    return Boolean(traceabilityMap[requirementId]?.length > 0);
  };
  
  // Obter casos de teste vinculados a um requisito
  const getLinkedTestCases = (requirementId) => {
    const links = traceabilityMap[requirementId] || [];
    return links.map(link => {
      const testCase = testCases.find(tc => tc.id === link.testCaseId) || {};
      return {
        ...testCase,
        linkId: link.id,
        coverage: link.coverage
      };
    });
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box sx={{ mt: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Matriz de Rastreabilidade de Requisitos
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenAddRequirement}
        >
          Adicionar Requisito
        </Button>
      </Box>
      
      {requirements.length === 0 ? (
        <Alert severity="info">
          Nenhum requisito cadastrado. Adicione requisitos para construir a matriz de rastreabilidade.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Requisito</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Prioridade</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Cobertura</TableCell>
                <TableCell>Testes Vinculados</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requirements.map((req) => {
                const covered = isRequirementCovered(req.id);
                const linkedTests = getLinkedTestCases(req.id);
                
                return (
                  <TableRow key={req.id}>
                    <TableCell>{req.id.substring(0, 8)}</TableCell>
                    <TableCell>
                      <Tooltip title={req.description || 'Sem descrição'}>
                        <Typography variant="body2">{req.name}</Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{req.category || 'Geral'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={req.priority === 'high' ? 'Alta' : req.priority === 'medium' ? 'Média' : 'Baixa'} 
                        color={req.priority === 'high' ? 'error' : req.priority === 'medium' ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <StatusChip 
                        label={
                          req.status === 'active' ? 'Ativo' : 
                          req.status === 'draft' ? 'Rascunho' : 
                          'Depreciado'
                        } 
                        status={req.status}
                        size="small"
                      />
                    </TableCell>
                    <StyledTableCell covered={covered}>
                      {covered ? `${linkedTests.length} teste(s)` : 'Não coberto'}
                    </StyledTableCell>
                    <TableCell>
                      {linkedTests.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {linkedTests.map(test => (
                            <Tooltip 
                              key={test.linkId} 
                              title={`${test.suiteName} - Cobertura: ${test.coverage === 'full' ? 'Total' : 'Parcial'}`}
                            >
                              <Chip
                                label={test.name}
                                size="small"
                                variant={test.coverage === 'full' ? 'filled' : 'outlined'}
                                color="primary"
                                onClick={() => handleToggleCoverage(req.id, test.linkId, test.coverage)}
                                onDelete={() => handleRemoveLink(req.id, test.linkId)}
                                deleteIcon={<LinkOffIcon />}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Nenhum teste vinculado
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Vincular caso de teste">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenLinkDialog(req.id)}
                        >
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Diálogo para adicionar requisito */}
      <Dialog open={openAddRequirement} onClose={handleCloseAddRequirement} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Requisito</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Nome do Requisito"
                name="name"
                value={newRequirement.name}
                onChange={handleRequirementChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrição"
                name="description"
                value={newRequirement.description}
                onChange={handleRequirementChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Categoria"
                name="category"
                value={newRequirement.category}
                onChange={handleRequirementChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Prioridade"
                name="priority"
                value={newRequirement.priority}
                onChange={handleRequirementChange}
                select
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Status"
                name="status"
                value={newRequirement.status}
                onChange={handleRequirementChange}
                select
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value="draft">Rascunho</option>
                <option value="active">Ativo</option>
                <option value="deprecated">Depreciado</option>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddRequirement}>Cancelar</Button>
          <Button 
            onClick={handleSaveRequirement} 
            variant="contained"
            disabled={!newRequirement.name}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para vincular caso de teste */}
      <Dialog open={openLinkDialog} onClose={handleCloseLinkDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Vincular Caso de Teste</DialogTitle>
        <DialogContent>
          {availableTestCases.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Autocomplete
                options={availableTestCases}
                getOptionLabel={(option) => `${option.name} (${option.suiteName})`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Selecionar Caso de Teste"
                    variant="outlined"
                  />
                )}
                value={selectedTestCase}
                onChange={handleSelectTest}
              />
            </Box>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              Não há casos de teste disponíveis para vincular a este requisito.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLinkDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveLink} 
            variant="contained"
            disabled={!selectedTestCase}
          >
            Vincular
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequirementsTraceabilityMatrix; 