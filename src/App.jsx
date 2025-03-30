import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, useMediaQuery } from '@mui/material'
import AppRoutes from './routes'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Snackbar, Alert, CircularProgress, Box } from '@mui/material'
import * as userService from './services/userService'
import './styles/global.css'
import OnboardingTour from './components/OnboardingTour'

// Temas do sistema
import { lightTheme, darkTheme } from './theme'

// Componente para depurar e garantir o carregamento do usuário
const SystemInitializer = () => {
  const { user } = useAuth()
  
  useEffect(() => {
    console.log('SystemInitializer - Verificando usuário atual:', user)
    
    if (user) {
      console.log('SystemInitializer - Email do usuário:', user.email)
      console.log('SystemInitializer - Função do usuário:', user.role)
      console.log('SystemInitializer - É admin@hybex?', user.email === 'admin@hybex')
      
      if (user.email === 'admin@hybex' && user.role !== 'admin') {
        console.error('ERRO: usuário admin@hybex sem role admin!')
      }
    } else {
      console.log('SystemInitializer - Nenhum usuário logado')
    }
  }, [user])
  
  return null // Componente não renderiza nada visualmente
}

// Componente principal com os providers
function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode')
    return savedMode || (prefersDarkMode ? 'dark' : 'light')
  })

  useEffect(() => {
    localStorage.setItem('themeMode', mode)
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light')
  }

  const theme = React.useMemo(() => {
    return mode === 'dark' ? darkTheme : lightTheme
  }, [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <AuthProvider>
        <SystemInitializer />
        <Router>
          <OnboardingTour />
          <AppRoutes toggleTheme={toggleTheme} />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App 