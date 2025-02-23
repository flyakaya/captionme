import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Header from '../Header/Header';

interface PageViewProps {
  children: React.ReactNode;
}

const PageContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
});

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  paddingTop: '80px',
  backgroundColor: '#f8f9fa',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
}));

const Footer = styled(Box)({
  backgroundColor: '#333',
  color: '#fff',
  padding: '1.5rem 0',
  marginTop: 'auto',
});

const FooterText = styled(Typography)({
  margin: 0,
  fontSize: '0.9rem',
  textAlign: 'center',
});

const PageView: React.FC<PageViewProps> = ({ children }) => (
  <PageContainer>
    <Header />
    <MainContent component="main">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </MainContent>
    <Footer component="footer">
      <Container maxWidth="lg">
        <FooterText variant="body2">
          © {new Date().getFullYear()} CaptionMaption. All rights reserved.
        </FooterText>
      </Container>
    </Footer>
  </PageContainer>
);

export default PageView; 