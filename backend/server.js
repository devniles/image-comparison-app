const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Available Gemini models
const GEMINI_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest', 
  'gemini-pro'
];

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let lastError = null;

    // Try each model
    for (const model of GEMINI_MODELS) {
      try {
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await axios.post(GEMINI_API_URL, {
          contents: [{
            parts: [{
              text: `Create a detailed visual description for an image about: "${prompt}". Return only the descriptive text.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          }
        }, { timeout: 10000 });

        if (response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
          const description = response.data.candidates[0].content.parts[0].text.trim();
          
          // Use Unsplash for demo images
          const searchQuery = encodeURIComponent(prompt.split(' ').slice(0, 3).join(' '));
          const imageUrl = `https://source.unsplash.com/512x512/?${searchQuery}&t=${Date.now()}`;
          
          return res.json({
            success: true,
            imageUrl: imageUrl,
            description: description,
            modelUsed: model
          });
        }
      } catch (error) {
        lastError = error;
        console.log(`Model ${model} failed:`, error.response?.data?.error?.message);
        continue;
      }
    }

    // Fallback if all models fail
    const searchQuery = encodeURIComponent(prompt);
    const fallbackImageUrl = `https://source.unsplash.com/512x512/?${searchQuery}`;
    
    res.json({
      success: true,
      imageUrl: fallbackImageUrl,
      description: `AI generated concept for: ${prompt}`,
      modelUsed: 'fallback'
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});