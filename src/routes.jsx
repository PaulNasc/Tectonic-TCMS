import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectView from './pages/ProjectView';
import TestExecution from './pages/TestExecution';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './layouts/Layout';
import NotFound from './pages/NotFound';
import LoadingScreen from './components/LoadingScreen';
import { useAuth } from './contexts/AuthContext';
import ProjectSettings from './pages/ProjectSettings';
import ProjectMembers from './pages/ProjectMembers';
import TestSuiteView from './pages/TestSuiteView';
import AdminPage from './pages/AdminPage';
import UserProfile from './pages/UserProfile';
import TestSuiteEdit from './pages/TestSuiteEdit';
import TestSuiteExecute from './pages/TestSuiteExecute';
import Requirements from './pages/Requirements';
import RequirementLinkTestCases from './pages/RequirementLinkTestCases';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return typeof children === 'function' ? children({ user }) : children;
};

const AppRoutes = ({ toggleTheme }) => {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rotas privadas */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout toggleTheme={toggleTheme} />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        
        {/* Rotas de Projetos */}
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectView />} />
        <Route path="projects/:projectId/suites/:suiteId" element={<TestSuiteView />} />
        <Route path="projects/:projectId/suites/:suiteId/edit" element={<TestSuiteEdit />} />
        <Route path="projects/:projectId/suites/:suiteId/execute" element={<TestSuiteExecute />} />
        <Route path="projects/:projectId/settings" element={<ProjectSettings />} />
        <Route path="projects/:projectId/members" element={<ProjectMembers />} />
        
        {/* Rotas de Requisitos e Rastreabilidade */}
        <Route path="projects/:projectId/requirements" element={<Requirements />} />
        <Route path="projects/:projectId/requirements/:requirementId/link-tests" element={<RequirementLinkTestCases />} />
        
        {/* Outras rotas */}
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<UserProfile />} />
        
        {/* Rota de Admin */}
        <Route path="admin" element={
          <PrivateRoute>
            {({ user }) => {
              if (user?.role === 'admin' || user?.email === 'admin@hybex') {
                return <AdminPage />;
              }
              return <Navigate to="/" replace />;
            }}
          </PrivateRoute>
        } />
        
        {/* Rota 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes; 