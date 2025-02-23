import React, { useMemo } from 'react';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { styled } from '@mui/material/styles';

interface NavItem {
  label: string;
  path: string;
}

const StyledAppBar = styled(AppBar)({
  backgroundColor: '#ffffff',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
});

const Logo = styled(Typography)({
  color: '#333',
  fontWeight: 500,
});

const NavButton = styled(Button)({
  color: '#333',
  '&:hover': {
    color: '#007bff',
    backgroundColor: 'transparent',
  },
});

const Navigation = styled('nav')({
  display: 'flex',
  gap: '1rem',
});

const Header: React.FC = () => {
  const navItems = useMemo<NavItem[]>(() => [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ], []);

  return (
    <StyledAppBar position="fixed">
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Logo variant="h6" component="div">
            captionmaption
          </Logo>
          <Navigation>
            {navItems.map(({ label, path }) => (
              <NavButton
                key={path}
                href={path}
              >
                {label}
              </NavButton>
            ))}
          </Navigation>
        </Toolbar>
      </Container>
    </StyledAppBar>
  );
};

export default Header; 