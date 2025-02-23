import { useState, useCallback } from 'react';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Exponential backoff implementation
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const exponentialBackoff = async (fn, maxRetries = 5) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) { // Rate limit error
        const waitTime = Math.min(1000 * Math.pow(2, retries), 32000); // Max 32 seconds
        console.log(`Rate limit hit. Waiting ${waitTime}ms before retry ${retries + 1}/${maxRetries}`);
        await wait(waitTime);
        retries++;
      } else {
        throw error; // Re-throw non-rate-limit errors
      }
    }
  }
  
  throw new Error('Max retries reached for rate limit');
};

export const useOpenAI = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [requestCount, setRequestCount] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [cachedResponses, setCachedResponses] = useState({});

  // Rate limiting helper
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < 1000) {
      throw new Error('Please wait a moment before generating another caption');
    }
    
    if (requestCount >= 3 && timeSinceLastRequest < 60000) {
      throw new Error('Rate limit reached. Please wait a minute before trying again');
    }
    
    if (timeSinceLastRequest >= 60000) {
      setRequestCount(0);
    }
    
    setLastRequestTime(now);
    setRequestCount(prev => prev + 1);
  }, [lastRequestTime, requestCount]);

  const getCachedResponse = useCallback((imageId, options) => {
    const cacheKey = `${imageId}-${JSON.stringify(options)}`;
    return cachedResponses[cacheKey];
  }, [cachedResponses]);

  const setCachedResponse = useCallback((imageId, options, response) => {
    const cacheKey = `${imageId}-${JSON.stringify(options)}`;
    setCachedResponses(prev => ({
      ...prev,
      [cacheKey]: response
    }));
  }, []);

  const makeOpenAIRequest = async (params) => {
    try {
      const response = await openai.chat.completions.create(params);
      
      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response from OpenAI');
      }

      return response;
    } catch (error) {
      setError(error.message || 'Failed to generate caption');
      throw error;
    }
  };

  const analyzeImage = useCallback(async (base64Image) => {
    try {
      console.log('=== Image Analysis Request ===');
      const analysisPrompt = "Analyze this image and provide ONLY the following in a structured format:\n1. Setting: Where was this taken?\n2. Activity: What's happening in the foreground?\n3. Subject: Main subject or focus\n4. People: Number and description if any\n5. Visual Effects: Lighting, filters, or notable visual elements\n6. Summary: 50-char or less overview of the photo\n\nKeep each response brief and focused.";
      console.log('Prompt:', analysisPrompt);
      
      // Convert base64Image to string if it's not already
      const base64String = typeof base64Image === 'string' 
        ? base64Image 
        : base64Image.toString();

      // Extract MIME type if it exists in the data URL
      let imageUrl;
      if (base64String.startsWith('data:')) {
        imageUrl = base64String;
      } else {
        // Try to determine MIME type from the base64 header
        const mimeMatch = base64String.match(/^\/9j\//) ? 'jpeg' :
                         base64String.match(/^iVBOR/) ? 'png' :
                         base64String.match(/^R0lG/) ? 'gif' :
                         base64String.match(/^UklGR/) ? 'webp' : 'jpeg';
        imageUrl = `data:image/${mimeMatch};base64,${base64String}`;
      }
      
      console.log('Image URL format:', imageUrl.substring(0, 50) + '...');
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: analysisPrompt },
              {
                type: "image_url",
                image_url: { 
                  url: imageUrl,
                  detail: "low"
                }
              }
            ],
          }
        ],
        max_tokens: 300,
      });

      const analysis = response.choices[0].message.content;
      console.log('=== Image Analysis Response ===');
      console.log(analysis);
      console.log('============================');

      // Parse the analysis into tags without confidence levels
      const tags = analysis.split('\n')
        .filter(line => line.trim())
        .map(line => {
          // Clean up the line to get the label, removing any numbering or prefixes
          const label = line
            .replace(/^\d+\.\s*(Setting|Activity|Subject|People|Visual Effects|Summary):\s*/i, '')
            .replace(/^[-•*]\s*/, '')
            .trim();

          return { label };
        })
        .filter(tag => tag.label); // Remove any empty tags

      return tags;
    } catch (error) {
      console.error('Error in image analysis:', error);
      throw error;
    }
  }, []);

  const generateCaption = useCallback(async (base64Image, options = { mode: 'auto' }, imageId) => {
    if (isGenerating) {
      throw new Error('A request is already in progress');
    }

    // Check cache first
    if (imageId) {
      const cachedResponse = getCachedResponse(imageId, options);
      if (cachedResponse) {
        console.log('Using cached response for image:', imageId);
        return cachedResponse;
      }
    }

    setIsGenerating(true);
    setError(null);

    try {
      checkRateLimit();

      // First, analyze the image
      const tags = await analyzeImage(base64Image);
      
      if (!tags || tags.length === 0) {
        throw new Error('No elements detected in the image');
      }

      // Use the analyzed tags for caption generation without confidence levels
      const significantTags = tags.map(tag => tag.label);

      let promptContent = `Based on the following elements detected in an image: ${significantTags.join(', ')}`;

      if (options.mode === 'custom') {
        if (options.location) {
          promptContent += `\nThe photo was taken at: ${options.location}`;
        }
        if (options.additionalInfo) {
          promptContent += `\nAdditional context: ${options.additionalInfo}`;
        }
        if (options.tone) {
          promptContent += `\nPlease generate the captions in a ${options.tone} tone.`;
        }
      }

      promptContent += `\n\nAs a creative caption generator, think deeply and generate:
        1. A concise, natural caption describing what's likely in the image
        2. 5 unique and creative caption ideas that:
           - Play with words and concepts
           - Make unexpected connections
           - Reference pop culture, games, or trends
           - Think about deeper meanings and metaphors
           - Create surprising but relevant analogies
           - Each caption should have its own unique angle or concept
        3. For each caption, generate a matching creative hashtag that:
           - Captures the specific theme or concept of that caption
           - Is clever and memorable
           - Combines relevant words in unexpected ways

        Format the response as JSON with the following structure:
        {
          "mainCaption": "primary description",
          "captionIdeas": [
            {
              "caption": "creative caption text",
              "concept": "brief explanation of the creative concept/reference",
              "hashtag": "matching creative hashtag"
            }
          ]
        }`;

      console.log('=== Caption Generation Request ===');
      console.log('System Message:', "You are a highly creative caption generator who excels at wordplay, cultural references, and unexpected connections. Think outside the box and create surprising but relevant captions that go beyond the obvious.");
      console.log('User Message:', promptContent);
      console.log('===============================');

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a highly creative caption generator who excels at wordplay, cultural references, and unexpected connections. Think outside the box and create surprising but relevant captions that go beyond the obvious."
          },
          {
            role: "user",
            content: promptContent
          }
        ],
        temperature: 0.9,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      let parsedResponse;
      
      try {
        parsedResponse = JSON.parse(content);
      } catch (error) {
        console.error('Error parsing OpenAI response:', error);
        throw new Error('Failed to parse OpenAI response');
      }

      console.log('=== Caption Generation Response ===');
      console.log(parsedResponse);
      console.log('=================================');

      if (!parsedResponse.mainCaption || !parsedResponse.captionIdeas) {
        throw new Error('Invalid response format from OpenAI');
      }

      const formattedResponse = {
        mainCaption: parsedResponse.mainCaption.trim(),
        captionIdeas: parsedResponse.captionIdeas.map(item => ({
          caption: typeof item === 'string' ? item.trim() : item.caption.trim(),
          concept: item.concept ? item.concept.trim() : null,
          hashtag: item.hashtag ? item.hashtag.trim() : null
        })),
      };

      const result = { tags, captions: formattedResponse };

      // Cache the response if we have an imageId
      if (imageId) {
        setCachedResponse(imageId, options, result);
      }

      return result;
    } catch (error) {
      console.error('Error in generateCaption:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [checkRateLimit, isGenerating, analyzeImage, getCachedResponse, setCachedResponse]);

  const generateImageAnalysis = useCallback(async (imageUrl) => {
    if (isGenerating) {
      throw new Error('A request is already in progress');
    }

    setIsGenerating(true);
    setError(null);

    try {
      checkRateLimit();

      const response = await makeOpenAIRequest({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image in detail and describe what you see." },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ],
          }
        ],
        max_tokens: 500,
      });

      setError(null);
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error in generateImageAnalysis:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [checkRateLimit, isGenerating]);

  const clearCache = useCallback(() => {
    setCachedResponses({});
  }, []);

  return {
    generateCaption,
    generateImageAnalysis,
    isGenerating,
    error,
    requestCount,
    lastRequestTime,
    clearCache,
    cachedResponses
  };
}; 