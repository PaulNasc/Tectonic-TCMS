import React from 'react';
import styled from '@emotion/styled';

const TitleBarContainer = styled.div`
  height: 32px;
  background-color: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  -webkit-app-region: drag;
  user-select: none;
  border-bottom: 1px solid var(--bg-tertiary);
`;

const TitleActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  -webkit-app-region: no-drag;
`;

const MenuButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 4px;
  
  &:hover {
    background-color: var(--bg-tertiary);
    color: var(--neon-primary);
    box-shadow: none;
  }
`;

const WindowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
`;

const WindowButton = styled.button`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: none;
  
  &:hover {
    opacity: 0.8;
    box-shadow: none;
  }
`;

const MinimizeButton = styled(WindowButton)`
  background-color: var(--warning);
`;

const MaximizeButton = styled(WindowButton)`
  background-color: var(--info);
`;

const CloseButton = styled(WindowButton)`
  background-color: var(--error);
`;

const AppTitle = styled.div`
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
`;

const Avatar = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--neon-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: var(--text-primary);
`;

const TitleBar = ({ toggleSidebar, sidebarOpen, supabase }) => {
  const user = supabase.auth.getUser()?.data?.user;
  
  // Funções para controle da janela do Electron
  const minimizeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };
  
  const maximizeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };
  
  const closeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  return (
    <TitleBarContainer>
      <TitleActions>
        <MenuButton onClick={toggleSidebar}>
          {sidebarOpen ? '◀' : '▶'}
        </MenuButton>
        <AppTitle>CRM QA Test</AppTitle>
      </TitleActions>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {user && (
          <UserInfo>
            <Avatar>{user.email[0].toUpperCase()}</Avatar>
            <span>{user.email}</span>
            <MenuButton onClick={handleLogout} title="Sair">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </MenuButton>
          </UserInfo>
        )}
        
        <WindowActions>
          <MinimizeButton onClick={minimizeWindow} title="Minimizar" />
          <MaximizeButton onClick={maximizeWindow} title="Maximizar" />
          <CloseButton onClick={closeWindow} title="Fechar" />
        </WindowActions>
      </div>
    </TitleBarContainer>
  );
};

export default TitleBar; 