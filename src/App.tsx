import React from 'react'
import { Paper, Typography, Box, Container } from '@mui/material'
import { styled } from '@mui/material/styles'
import './App.css'
import PageView from './components/PageView/PageView'
import PhotoUpload from './components/PhotoUpload/PhotoUpload'

const WelcomePaper = styled(Paper)(({ theme }) => ({
  padding: '4rem 1rem',
  backgroundColor: 'white',
  borderRadius: theme.shape.borderRadius * 2,
  textAlign: 'center',
}))

const WelcomeText = styled(Typography)(() => ({
  color: '#333',
  marginBottom: (theme) => theme.spacing(2),
  fontSize: {
    xs: '2rem',
    md: '2.5rem',
  },
  fontWeight: 500,
}))

const SubText = styled(Typography)(() => ({
  color: '#666',
  fontSize: {
    xs: '1rem',
    md: '1.2rem',
  },
}))

const App: React.FC = () => (
  <PageView>
    <Container maxWidth="lg">
      <PhotoUpload />
    </Container>
  </PageView>
)

export default App
