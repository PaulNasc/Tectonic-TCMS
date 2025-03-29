import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import AppRoutes from './routes'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { Snackbar, Alert, CircularProgress, Box } from '@mui/material'
import * as userService from './services/userService'

// Componente para inicialização do sistema
const SystemInitializer = ({ children }) => {
  const { user } = useAuth()
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  
  useEffect(() => {
    const initSystem = async () => {
      try {
        // Verificar se o sistema foi inicializado
        console.log('Verificando inicialização do sistema...')
        
        // Garantir que o usuário admin@hybex esteja configurado como administrador
        if (user) {
          const { data, error } = await userService.ensureAdminUser('admin@hybex')
          
          if (error) {
            console.warn('Aviso sobre admin@hybex:', error)
            setMessage('O usuário admin@hybex precisa ser criado como administrador.')
          } else if (data) {
            console.log('Usuário admin@hybex configurado:', data)
          }
        }
        
        setInitialized(true)
      } catch (err) {
        console.error('Erro na inicialização do sistema:', err)
        setError(err.message)
        setInitialized(true) // Ainda permitir que o app carregue mesmo com erro
      }
    }
    
    if (user && !initialized) {
      initSystem()
    } else if (!user) {
      setInitialized(true) // Se não há usuário, não precisa inicializar ainda
    }
  }, [user, initialized])
  
  if (!initialized) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        height="100vh"
        gap={2}
      >
        <CircularProgress />
        <Alert severity="info">Inicializando o sistema...</Alert>
      </Box>
    )
  }
  
  return (
    <>
      {children}
      {message && (
        <Snackbar
          open={!!message}
          autoHideDuration={6000}
          onClose={() => setMessage('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setMessage('')} severity="info">
            {message}
          </Alert>
        </Snackbar>
      )}
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>
      )}
    </>
  )
}

// Componente principal com os providers
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <SystemInitializer>
            <AppComponent />
          </SystemInitializer>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

// Componente que usa os hooks dentro dos providers
function AppComponent() {
  const { toggleThemeMode } = useTheme()
  
  return <AppRoutes toggleTheme={toggleThemeMode} />
}

export default App 