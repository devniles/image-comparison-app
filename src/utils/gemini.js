import axios from 'axios';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const getAvailableModels = async () => {
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );
    
    const availableModels = response.data.models
      .filter(model => 
        model.name.includes('gemini') && 
        model.supportedGenerationMethods?.includes('generateContent')
      )
      .map(model => ({
        name: model.name.replace('models/', ''),
        displayName: model.displayName
      }));
    
    console.log('✅ Available Gemini Models:', availableModels);
    return availableModels;
  } catch (error) {
    console.error('❌ Error fetching models:', error);
    return [];
  }
};

export const findWorkingModel = async () => {
  const availableModels = await getAvailableModels();
  
  const priorityModels = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest', 
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.0-pro'
  ];
  
  for (const model of priorityModels) {
    const foundModel = availableModels.find(m => m.name === model);
    if (foundModel) {
      console.log(`🎯 Using model: ${foundModel.name}`);
      return foundModel;
    }
  }
  
  if (availableModels.length > 0) {
    console.log(`🎯 Using available model: ${availableModels[0].name}`);
    return availableModels[0];
  }
  
  return null;
};

export const generateImageWithGemini = async (prompt, updateProgress) => {
  let workingModel = null;
  
  try {
    updateProgress('🔍 Generating..');
    
    workingModel = await findWorkingModel();
    
    if (!workingModel) {
      updateProgress('❌ No working model found');
      throw new Error('NO_WORKING_MODEL');
    }
    
     
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${workingModel.name}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await axios.post(GEMINI_API_URL, {
      contents: [{
        parts: [{
          text: `Create a detailed visual description for an image about: "${prompt}". Return only the descriptive text. Make it creative and visual.`
        }]
      }],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 150,
      }
    }, { timeout: 15000 });

    if (!response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('NO_DESCRIPTION_GENERATED');
    }

    const description = response.data.candidates[0].content.parts[0].text.trim();
    
    updateProgress('🎨 Generating image from description...');
    
    const searchQuery = encodeURIComponent(prompt.split(' ').slice(0, 3).join(' '));
    const imageUrl = `https://source.unsplash.com/512x512/?${searchQuery}&t=${Date.now()}`;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateProgress('✅ Image generated successfully!');
    
    return {
      imageUrl: imageUrl,
      description: description,
      modelUsed: workingModel.name,
      aiGenerated: true,
      success: true
    };
    
  } catch (error) {
    console.error('Error in image generation:', error);
    
    if (error.response?.data?.error?.code === 503) {
      throw new Error('MODEL_OVERLOADED');
    }
    
    if (error.response?.data?.error?.message) {
      throw new Error(`API_ERROR: ${error.response.data.error.message}`);
    }
    
    if (error.message === 'NO_WORKING_MODEL') {
      throw new Error('NO_WORKING_MODEL');
    }
    
    if (error.message === 'NO_DESCRIPTION_GENERATED') {
      throw new Error('NO_DESCRIPTION_GENERATED');
    }
    
    // 🚨 YAHAN FALLBACK CODE REMOVE KAR DIYA
    // Ab koi fallback image generate nahi hogi
    throw new Error('GENERATION_FAILED');
  }
};

export const saveUploadedImage = (imageUrl) => {
  try {
    const storedImages = JSON.parse(localStorage.getItem('viralityAppImages') || '{}');
    const imageId = Date.now().toString();
    
    storedImages[imageId] = {
      url: imageUrl,
      prompt: 'user_uploaded',
      type: 'uploaded',
      timestamp: new Date().toISOString(),
      id: imageId
    };
    
    localStorage.setItem('viralityAppImages', JSON.stringify(storedImages));
    return imageId;
  } catch (error) {
    console.error('Error saving image to storage:', error);
    return null;
  }
};

export const calculateViralityScore = (image, prompt = '', isAI = true) => {
  const promptComplexity = Math.min(prompt.length / 30, 1.5);
  const wordCount = prompt.split(' ').length;
  
  let baseScore = isAI ? 45 : 40;
  baseScore += Math.min(wordCount * 1.5, 20);
  
  const engagement = Math.min(baseScore + (Math.random() * 25) + (promptComplexity * 10), 95);
  const shareability = Math.min(baseScore + (Math.random() * 20) + (promptComplexity * 8), 95);
  const appeal = Math.min(baseScore + (Math.random() * 30) + (promptComplexity * 12), 95);
  
  const totalScore = Math.round((engagement + shareability + appeal) / 3);
  
  return {
    total: totalScore,
    metrics: {
      engagement: Math.round(engagement),
      shareability: Math.round(shareability),
      appeal: Math.round(appeal)
    }
  };
};