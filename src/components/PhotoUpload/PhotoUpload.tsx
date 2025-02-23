import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton,
  ImageList,
  ImageListItem,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Fade,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useOpenAI } from '../../hooks/useOpenAI';
import CaptionGenerationForm from './CaptionGenerationForm';
import CaptionDisplay from './CaptionDisplay';

interface ImageObject {
  file: File;
  preview: string;
  id: string;
  tags: Array<{
    name: string;
    confidence: number;
  }>;
  isProcessing: boolean;
  captions: CaptionResults | null;
}

interface CaptionIdea {
  caption: string;
  concept?: string;
  hashtag?: string;
}

interface CaptionResults {
  mainCaption: string;
  captionIdeas: CaptionIdea[];
}

interface CaptionResultsProps {
  captions: CaptionResults;
  onBack: () => void;
  onCopy: (text: string) => void;
  copiedText: string;
  onRegenerate: () => void;
  isGenerating: boolean;
}

const UploadBox = styled(Paper)(() => ({
  padding: '2rem',
  textAlign: 'center',
  backgroundColor: '#f8f9fa',
  border: '2px dashed #ccc',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#007bff',
    backgroundColor: '#f0f7ff',
  },
}));

const Input = styled('input')({
  display: 'none',
});

const ImageContainer = styled(ImageListItem)({
  width: 340,
  height: 340,
  position: 'relative',
  borderRadius: '8px 8px 0 0',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
});

const StyledImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
});

const TagsContainer = styled(Box)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
  padding: '0.5rem',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '0 0 8px 8px',
  maxHeight: '100px',
  overflowY: 'auto',
});

const NavigationArrow = styled(IconButton)({
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: '#fff',
  padding: '4px',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  '&.Mui-disabled': {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

interface TagChipProps {
  confidence: number;
}

const TagChip = styled(Chip)<TagChipProps>(({ confidence }) => ({
  backgroundColor: `rgba(25, 118, 210, ${confidence / 100})`,
  color: confidence > 50 ? '#fff' : '#333',
  '& .MuiChip-label': {
    fontWeight: confidence > 70 ? 600 : 400,
  },
}));

const LoadingOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  borderRadius: '8px',
});

const CaptionButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 8,
  left: 8,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: '#fff',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  zIndex: 2,
}));

const HashtagContainer = styled(Box)({
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
  marginTop: '1rem',
});

const CaptionResults: React.FC<CaptionResultsProps> = ({ 
  captions, 
  onBack, 
  onCopy, 
  copiedText, 
  onRegenerate, 
  isGenerating 
}) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        variant="outlined"
      >
        Back to Options
      </Button>
      <Button
        startIcon={<AutoAwesomeIcon />}
        onClick={onRegenerate}
        disabled={isGenerating}
        color="primary"
        variant="contained"
      >
        Regenerate
      </Button>
    </Box>

    <Box sx={{ mb: 4 }}>
      <Paper sx={{ p: 2, mb: 1, backgroundColor: '#f8f9fa' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography sx={{ whiteSpace: 'pre-wrap', flex: 1 }}>
            {captions.mainCaption}
          </Typography>
          <Tooltip 
            title={copiedText === captions.mainCaption ? "Copied!" : "Copy"}
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 600 }}
          >
            <IconButton onClick={() => onCopy(captions.mainCaption)} size="small">
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    </Box>

    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" color="primary" gutterBottom>
        Creative Caption Ideas
      </Typography>
      {captions.captionIdeas.map((item, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2, backgroundColor: '#f8f9fa' }}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
               
              </Typography>
              <Tooltip 
                title={copiedText === item.caption ? "Copied!" : "Copy"}
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 600 }}
              >
                <IconButton onClick={() => onCopy(item.caption)} size="small">
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Typography sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
              {item.caption}
            </Typography>

            {item.concept && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                {item.concept}
              </Typography>
            )}

            {item.hashtag && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={item.hashtag}
                  color="primary"
                  variant="outlined"
                  onClick={() => onCopy(item.hashtag)}
                  size="small"
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Click to copy
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      ))}
    </Box>
  </Box>
);

const createImageObject = (file: File): ImageObject => ({
  file,
  preview: URL.createObjectURL(file),
  id: crypto.randomUUID(),
  tags: [],
  isProcessing: true,
  captions: null,
});

const LOCAL_STORAGE_KEY = 'captionmaption_image_analysis';

const PhotoUpload: React.FC = () => {
  const [images, setImages] = useState<ImageObject[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageObject | null>(null);
  const [copiedText, setCopiedText] = useState<string>('');
  const [captionIndex, setCaptionIndex] = useState<Record<string, number>>({});
  
  const { generateCaption, isGenerating, error: aiError } = useOpenAI();

  // Load cached responses from local storage
  const getCachedAnalysis = (imageId: string) => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        return parsedCache[imageId];
      }
    } catch (error) {
      console.error('Error reading from cache:', error);
    }
    return null;
  };

  // Save response to local storage
  const setCachedAnalysis = (imageId: string, analysis: any) => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsedCache = cached ? JSON.parse(cached) : {};
      parsedCache[imageId] = {
        tags: analysis.tags || [],
        captions: analysis.captions || null,
        isProcessing: false
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsedCache));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const processFiles = useCallback(async (files: FileList) => {
    const newImages = Array.from(files).map(createImageObject);
    setImages(prev => [...prev, ...newImages]);

    for (const image of newImages) {
      try {
        // Check cache first
        const cachedAnalysis = getCachedAnalysis(image.id);
        if (cachedAnalysis) {
          setImages(prev => prev.map(img => 
            img.id === image.id ? { 
              ...img, 
              ...cachedAnalysis,
              isProcessing: false,
              isLoadingCaptions: false 
            } : img
          ));
          continue;
        }

        // Convert image to base64
        const base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(image.file);
        });

        // If not in cache, analyze with GPT
        const result = await generateCaption(base64Image, { mode: 'auto' }, image.id);
        
        if (result) {
          const analysisResult = {
            tags: result.tags || [],
            captions: result.captions,
            isProcessing: false,
            isLoadingCaptions: false
          };
          
          setImages(prev => prev.map(img => 
            img.id === image.id ? { ...img, ...analysisResult } : img
          ));

          // Cache the result
          setCachedAnalysis(image.id, result);
        }
      } catch (error) {
        console.error('Error processing image:', error);
        setImages(prev => prev.map(img => 
          img.id === image.id ? { 
            ...img, 
            isProcessing: false, 
            tags: [],
            isLoadingCaptions: false 
          } : img
        ));
      }
    }
  }, [generateCaption]);

  const handleUpload = useCallback(({ target: { files } }) => {
    files && processFiles(files);
  }, [processFiles]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const { files } = event.dataTransfer;
    files && processFiles(files);
  }, [processFiles]);

  const handleDelete = useCallback((id: string) => {
    setImages(prev => {
      const imageToDelete = prev.find(img => img.id === id);
      imageToDelete && URL.revokeObjectURL(imageToDelete.preview);
      return prev.filter(img => img.id !== id);
    });
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleGenerateCaption = useCallback(async (imageId: string, formData: any) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    try {
      // Clear previous captions and set loading state
      const loadingImage = { 
        ...image, 
        captions: null, 
        captionError: null, 
        isLoadingCaptions: true,
        isProcessing: true
      };
      setSelectedImage(loadingImage);
      setImages(prev => prev.map(img => 
        img.id === imageId ? loadingImage : img
      ));

      // Convert image to base64
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(image.file);
      });
      
      const result = await generateCaption(base64Image, formData, imageId);
      
      if (result) {
        const updatedImage = { 
          ...image, 
          tags: result.tags || [],
          captions: result.captions, 
          captionError: null,
          isLoadingCaptions: false,
          isProcessing: false
        };
        setImages(prev => prev.map(img => 
          img.id === imageId ? updatedImage : img
        ));
        setSelectedImage(updatedImage);

        // Cache the updated analysis with captions
        setCachedAnalysis(imageId, result);
      }
    } catch (error) {
      console.error('Error generating captions:', error);
      const updatedImage = { 
        ...image, 
        captionError: error.message,
        isLoadingCaptions: false,
        isProcessing: false
      };
      setImages(prev => prev.map(img => 
        img.id === imageId ? updatedImage : img
      ));
      setSelectedImage(updatedImage);
    }
  }, [images, generateCaption]);

  const handleCopyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const handleNextCaption = useCallback((imageId: string) => {
    setCaptionIndex(prev => {
      const currentIndex = prev[imageId] || 0;
      return { ...prev, [imageId]: currentIndex + 1 };
    });
  }, []);

  const handlePrevCaption = useCallback((imageId: string) => {
    setCaptionIndex(prev => {
      const currentIndex = prev[imageId] || 0;
      return { ...prev, [imageId]: currentIndex - 1 };
    });
  }, []);

  const SocialActionsBar = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#ffffff',
    borderTop: '1px solid rgba(0, 0, 0, 0.1)',
  });

  const renderImageItem = useCallback(({ preview, id, tags, isProcessing, captions, captionError }, index) => {
    const currentCaptionIndex = captionIndex[id] || 0;
    const allCaptions = captions ? [
      { 
        text: captions.mainCaption, 
        type: 'Main Caption',
        hashtag: '#CaptionMaption'
      },
      ...captions.captionIdeas.map((idea, idx) => ({
        text: idea.caption,
        type: `Creative Idea ${idx + 1}`,
        hashtag: idea.hashtag
      }))
    ] : [];
    const currentCaption = allCaptions[currentCaptionIndex];

    return (
      <Box sx={{ 
        width: 340, 
        display: 'flex', 
        flexDirection: 'column',
        mb: 3,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#ffffff',
      }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography sx={{ fontWeight: 600, color: '#666' }}>
             C
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 700,color: '#666'  }}>
           captionmaption
          </Typography>
        </Box>

        <ImageContainer>
          <StyledImage
            src={preview}
            alt={`Upload ${index + 1}`}
            loading="lazy"
          />
          {isProcessing && (
            <LoadingOverlay>
              <CircularProgress />
            </LoadingOverlay>
          )}
          <IconButton
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
              zIndex: 2,
            }}
            onClick={() => handleDelete(id)}
          >
            <DeleteIcon sx={{ color: '#fff' }} />
          </IconButton>
          {!captions && (
            <CaptionButton
              onClick={() => handleGenerateCaption(id, { mode: 'auto' })}
              disabled={isProcessing}
              color={captionError ? "error" : "default"}
              title={captionError || "Generate captions"}
            >
              <AutoAwesomeIcon />
            </CaptionButton>
          )}
        </ImageContainer>

        <SocialActionsBar>
          <IconButton sx={{ color: '#ff3040' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </IconButton>
          <IconButton>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"/>
            </svg>
          </IconButton>
          <IconButton>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <IconButton>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </IconButton>
        </SocialActionsBar>
        
        {captions && (
          <CaptionDisplay
            caption={currentCaption}
            onNext={() => handleNextCaption(id)}
            onPrev={() => handlePrevCaption(id)}
            isFirst={currentCaptionIndex === 0}
            isLast={currentCaptionIndex === allCaptions.length - 1}
            onCopy={handleCopyText}
          />
        )}
      </Box>
    );
  }, [handleDelete, handleGenerateCaption, handleNextCaption, handlePrevCaption, captionIndex, handleCopyText]);

  return (
    <Box sx={{ width: '100%' }}>
      {images.length > 0 && (
        <Box>
          <ImageList 
            sx={{ 
              gap: 24,
              gridTemplateColumns: 'repeat(auto-fill, 340px) !important',
              justifyContent: 'center',
            }}
          >
            {images.map(renderImageItem)}
          </ImageList>
        </Box>
      )}

      {aiError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {aiError}
        </Alert>
      )}
      
      {images.length === 0 && (
        <UploadBox
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          elevation={0}
        >
          <Input
            accept="image/*"
            id="photo-upload"
            multiple
            type="file"
            onChange={handleUpload}
          />
          <label htmlFor="photo-upload">
            <Button
              component="span"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
              variant="contained"
              color="primary"
            >
              Upload Photos
            </Button>
          </label>
          <Typography variant="body1" color="textSecondary">
            or drag and drop your photos here
          </Typography>
        </UploadBox>
      )}

      <Dialog 
        open={Boolean(selectedImage)} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedImage?.captions ? 'Generated Captions' : 'Generate Captions'}
          {isGenerating && (
            <CircularProgress size={20} sx={{ ml: 2 }} />
          )}
        </DialogTitle>
        <DialogContent>
          {!selectedImage?.isLoadingCaptions && !selectedImage?.captions && !selectedImage?.captionError && (
            <CaptionGenerationForm
              onSubmit={(data) => {
                // If custom mode is selected, use the customTags from the form
                const tagsToUse = data.mode === 'custom' ? data.customTags : selectedImage.tags;
                handleGenerateCaption(selectedImage.id, { ...data, tags: tagsToUse });
              }}
              isLoading={isGenerating}
              tags={selectedImage?.tags || []}
            />
          )}
          {selectedImage?.isLoadingCaptions && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: '300px',
              gap: 2
            }}>
              <CircularProgress size={40} />
              <Typography variant="body1" color="text.secondary">
                Generating creative captions...
              </Typography>
            </Box>
          )}
          {selectedImage?.captions && !selectedImage?.captionError && !selectedImage?.isLoadingCaptions && (
            <CaptionResults
              captions={selectedImage.captions}
              onBack={() => {
                const updatedImage = { ...selectedImage, captions: null, isLoadingCaptions: false };
                setSelectedImage(updatedImage);
                setImages(prev => prev.map(img => 
                  img.id === selectedImage.id ? updatedImage : img
                ));
              }}
              onCopy={handleCopyText}
              copiedText={copiedText}
              onRegenerate={() => {
                const updatedImage = { ...selectedImage, captions: null, isLoadingCaptions: false };
                setSelectedImage(updatedImage);
                setImages(prev => prev.map(img => 
                  img.id === selectedImage.id ? updatedImage : img
                ));
              }}
              isGenerating={isGenerating}
            />
          )}
          {(aiError || selectedImage?.captionError) && (
            <Alert 
              severity="error" 
              sx={{ mt: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => {
                    setSelectedImage({ ...selectedImage, captions: null, captionError: null });
                  }}
                >
                  Try Again
                </Button>
              }
            >
              {aiError || selectedImage?.captionError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PhotoUpload; 