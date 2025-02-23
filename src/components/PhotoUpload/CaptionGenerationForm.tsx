import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';

interface Tag {
  label: string;
  confidence: string;
}

interface FormData {
  mode: 'auto' | 'custom';
  location: string;
  tone: string;
  additionalInfo: string;
}

interface CaptionGenerationFormProps {
  onSubmit: (data: FormData & { customTags: Tag[] }) => void;
  isLoading: boolean;
  tags?: Tag[];
}

const TONE_OPTIONS = [
  { value: 'sarcastic', label: 'Sarcastic' },
  { value: 'deadpan', label: 'Deadpan' },
  { value: 'original', label: 'Original' },
  { value: 'unexpected', label: 'Unexpected' },
  { value: 'darkHumor', label: 'Dark Humor' }
] as const;

const CaptionGenerationForm: React.FC<CaptionGenerationFormProps> = ({ onSubmit, isLoading, tags = [] }) => {
  const [customTags, setCustomTags] = useState<Tag[]>(tags);
  const [newTag, setNewTag] = useState('');
  const { control, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      mode: 'auto',
      location: '',
      tone: 'original',
      additionalInfo: ''
    }
  });

  const mode = watch('mode');

  const handleDeleteTag = (tagToDelete: Tag) => {
    setCustomTags(customTags.filter(tag => 
      tag.label !== tagToDelete.label || tag.confidence !== tagToDelete.confidence
    ));
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setCustomTags([...customTags, { label: newTag.trim(), confidence: '100' }]);
      setNewTag('');
    }
  };

  const handleSubmitWithTags = (data: FormData) => {
    onSubmit({ ...data, customTags });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Caption Generation Options
      </Typography>
      <Box component="form" onSubmit={handleSubmit(handleSubmitWithTags)} sx={{ mt: 2 }}>
        <Controller
          name="mode"
          control={control}
          render={({ field }) => (
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Generation Mode
              </Typography>
              <RadioGroup {...field}>
                <FormControlLabel
                  value="auto"
                  control={<Radio />}
                  label="Auto-generate (using detected tags)"
                />
                <FormControlLabel
                  value="custom"
                  control={<Radio />}
                  label="Customize (add extra information)"
                />
              </RadioGroup>
            </FormControl>
          )}
        />

        {mode === 'custom' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Detected Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {customTags.map((tag, index) => (
                  <Tooltip 
                    key={`${tag.label}-${index}`}
                    title={`Confidence: ${tag.confidence}%`}
                  >
                    <Chip
                      label={tag.label}
                      onDelete={() => handleDeleteTag(tag)}
                      color="primary"
                      variant="outlined"
                      sx={{
                        opacity: Number(tag.confidence) / 100,
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  label="Add New Tag"
                  size="small"
                  onKeyPress={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <IconButton 
                  onClick={handleAddTag}
                  color="primary"
                  disabled={!newTag.trim()}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>

            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Location"
                  placeholder="e.g., Beach, City, Mountains"
                  fullWidth
                />
              )}
            />

            <Controller
              name="tone"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Preferred Tone</InputLabel>
                  <Select {...field} label="Preferred Tone">
                    {TONE_OPTIONS.map(tone => (
                      <MenuItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="additionalInfo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Additional Information"
                  placeholder="Any other details about the photo"
                  multiline
                  rows={3}
                  fullWidth
                />
              )}
            />
          </Box>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Captions'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default CaptionGenerationForm; 