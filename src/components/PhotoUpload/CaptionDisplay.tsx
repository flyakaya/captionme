import React from 'react';
import { Box, Typography, IconButton, Tooltip, Fade } from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface Caption {
  text: string;
  hashtag?: string;
  type: string;
}

interface CaptionDisplayProps {
  caption: Caption;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  onCopy?: (text: string) => void;
}

const NavigationArrow = styled(IconButton)({
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: '#fff',
  padding: '4px',
  width: 24,
  height: 24,
  minWidth: 24,
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  '&.Mui-disabled': {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

const CaptionDisplay: React.FC<CaptionDisplayProps> = ({ 
  caption, 
  onNext, 
  onPrev, 
  isFirst, 
  isLast,
  onCopy 
}) => {
  return (
    <Box sx={{ 
      backgroundColor: '#ffffff',
      borderTop: '1px solid rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
      }}>
        <NavigationArrow
          onClick={onPrev}
          disabled={isFirst}
          size="small"
          sx={{ mt: '20px' }}
        >
          <ArrowBackIcon fontSize="small" />
        </NavigationArrow>
        
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Typography 
            sx={{ 
              color: '#262626',
              lineHeight: 1.5,
              fontSize: '0.95rem',
              letterSpacing: '0.01em'
            }}
          >
            {caption.text}
          </Typography>
        </Box>
        
        <NavigationArrow
          onClick={onNext}
          size="small"
          disabled={isLast}
          sx={{ mt: '20px' }}
        >
          <ArrowBackIcon fontSize="small" sx={{ transform: 'rotate(180deg)' }} />
        </NavigationArrow>
      </Box>

      <Box sx={{ 
        px: 2, 
        pb: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 1,
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          pt: 1.5
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#666',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            {caption.hashtag || `#${caption.type.replace(/\s+/g, '')}`}
          </Typography>
          {onCopy && (
            <Tooltip 
              title="Copy"
              placement="top"
              TransitionComponent={Fade}
              TransitionProps={{ timeout: 600 }}
            >
              <IconButton 
                onClick={() => onCopy(`${caption.text} ${caption.hashtag}`)} 
                size="small"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 2 
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#8e8e8e',
              fontSize: '0.8rem',
              fontWeight: 500
            }}
          >
            2 hours ago
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#8e8e8e',
              fontSize: '0.8rem',
              fontWeight: 500
            }}
          >
            1.2K likes
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CaptionDisplay; 