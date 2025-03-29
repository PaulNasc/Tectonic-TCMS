import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

const SidebarContainer = styled(motion.div)`
  background-color: var(--bg-primary);
  width: ${props => props.open ? '240px' : '64px'};
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width var(--transition-speed) ease;
  border-right: 1px solid var(--bg-tertiary);
  display: flex;
  flex-direction: column;
`;

const Logo = styled.div`
  padding: 20px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid var(--bg-tertiary);
`;

const LogoText = styled(motion.div)`
  font-size: 18px;
  font-weight: bold;
  color: var(--neon-primary);
  text-shadow: var(--shadow-neon-primary);
  white-space: nowrap;
`;

const MenuSection = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const MenuTitle = styled(motion.div)`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-tertiary);
  padding: 8px 16px;
  margin-bottom: 5px;
  white-space: nowrap;
`;

const MenuItem = styled(Link)`
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--text-secondary);
  border-left: 3px solid transparent;
  transition: all var(--transition-speed) ease;
  margin-bottom: 2px;
  position: relative;
  overflow: hidden;
  
  ${props => props.active && `
    background-color: var(--bg-secondary);
    color: var(--neon-primary);
    border-left-color: var(--neon-primary);
  `}
  
  &:hover {
    background-color: var(--bg-secondary);
    color: var(--neon-primary);
    text-shadow: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg, 
      transparent, 
      rgba(0, 255, 234, 0.1), 
      transparent
    );
    transition: 0.5s;
  }
  
  &:hover::after {
    left: 100%;
  }
`;

const MenuItemText = styled(motion.span)`
  white-space: nowrap;
`;

const MenuIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
`;

const Footer = styled.div`
  padding: 10px 16px;
  font-size: 11px;
  color: var(--text-tertiary);
  text-align: center;
  border-top: 1px solid var(--bg-tertiary);
  margin-top: auto;
`;

const footerVariants = {
  open: { opacity: 1 },
  closed: { opacity: 0 }
};

const textVariants = {
  open: { opacity: 1, display: 'block' },
  closed: { opacity: 0, display: 'none', transition: { duration: 0.1 } }
};

const Sidebar = ({ open }) => {
  const location = useLocation();
  
  return (
    <SidebarContainer open={open}>
      <Logo>
        {open ? (
          <LogoText
            initial="closed"
            animate={open ? "open" : "closed"}
            variants={textVariants}
          >
            CRM QA Test
          </LogoText>
        ) : (
          <MenuIcon style={{ color: 'var(--neon-primary)' }}>QA</MenuIcon>
        )}
      </Logo>
      
      <MenuSection>
        <MenuTitle
          initial="closed"
          animate={open ? "open" : "closed"}
          variants={textVariants}
        >
          Principal
        </MenuTitle>
        
        <MenuItem to="/" active={location.pathname === '/' ? 1 : 0}>
          <MenuIcon>📊</MenuIcon>
          <MenuItemText
            initial="closed"
            animate={open ? "open" : "closed"}
            variants={textVariants}
          >
            Dashboard
          </MenuItemText>
        </MenuItem>
        
        <MenuTitle
          initial="closed"
          animate={open ? "open" : "closed"}
          variants={textVariants}
          style={{ marginTop: "15px" }}
        >
          Gerenciamento
        </MenuTitle>
        
        <MenuItem to="/tests" active={location.pathname === '/tests' ? 1 : 0}>
          <MenuIcon>🧪</MenuIcon>
          <MenuItemText
            initial="closed"
            animate={open ? "open" : "closed"}
            variants={textVariants}
          >
            Testes
          </MenuItemText>
        </MenuItem>
        
        <MenuItem to="/qa-processes" active={location.pathname === '/qa-processes' ? 1 : 0}>
          <MenuIcon>📋</MenuIcon>
          <MenuItemText
            initial="closed"
            animate={open ? "open" : "closed"}
            variants={textVariants}
          >
            Processos QA
          </MenuItemText>
        </MenuItem>
        
        <MenuTitle
          initial="closed"
          animate={open ? "open" : "closed"}
          variants={textVariants}
          style={{ marginTop: "15px" }}
        >
          Sistema
        </MenuTitle>
        
        <MenuItem to="/settings" active={location.pathname === '/settings' ? 1 : 0}>
          <MenuIcon>⚙️</MenuIcon>
          <MenuItemText
            initial="closed"
            animate={open ? "open" : "closed"}
            variants={textVariants}
          >
            Configurações
          </MenuItemText>
        </MenuItem>
      </MenuSection>
      
      <Footer as={motion.div}
        initial="closed"
        animate={open ? "open" : "closed"}
        variants={footerVariants}
      >
        v1.0.0 &copy; 2025
      </Footer>
    </SidebarContainer>
  );
};

export default Sidebar; 