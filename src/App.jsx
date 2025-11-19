import React, { useState } from 'react';
import { Brain, Sparkles, Upload, TrendingUp, Share2, Heart, BarChart3, Loader2, CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import { generateImageWithGemini, calculateViralityScore, saveUploadedImage } from './utils/gemini';
import { analyzeUploadedImage, enhancedImageAnalysis } from './utils/simpleRAG';
import ImageUploader from './components/ImageUploader';
import ImageComparison from './components/ImageComparison';

const Toast = ({ message, type, onClose }) => {
  const isRAGAnalysis = message.includes('RAG:');
  
  const bgColor = isRAGAnalysis ? 'bg-purple-500' : (
    type === 'error' ? 'bg-red-500' :
    type === 'warning' ? 'bg-yellow-500' :
    type === 'success' ? 'bg-green-500' :
    'bg-blue-500'
  );

  const icon = isRAGAnalysis ? <Brain className="h-5 w-5" /> : (
    type === 'error' ? <AlertCircle className="h-5 w-5" /> :
    type === 'warning' ? <AlertCircle className="h-5 w-5" /> :
    type === 'success' ? <CheckCircle2 className="h-5 w-5" /> :
    <Info className="h-5 w-5" />
  );

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-80 max-w-md z-50 animate-slide-in`}>
      {icon}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

function App() {
  const [generatedImage, setGeneratedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [generatedScore, setGeneratedScore] = useState(null);
  const [uploadedScore, setUploadedScore] = useState(null);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [toast, setToast] = useState(null);
  const [generationStatus, setGenerationStatus] = useState('');

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleImageUpload = (imageUrl) => {
    const imageId = saveUploadedImage(imageUrl);
    setUploadedImage(imageUrl);
    setUploadedScore(calculateViralityScore(imageUrl, 'uploaded image', false));
    
    if (generatedImage) {
      setCurrentStep(3);
    } else {
      setCurrentStep(2);
    }
    
    const analyzeUpload = async () => {
      const ragAnalysis = await analyzeUploadedImage('uploaded', 'user uploaded image');
      showToast(ragAnalysis, 'info');
    };
    
    analyzeUpload();
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a prompt first', 'error');
      return;
    }
    
    setLoading(true);
    setError('');
    setGenerationStatus('');
    setProgress('Starting image generation...');
    
    try {
      const result = await generateImageWithGemini(prompt, (message) => {
        setProgress(message);
      });
      
      if (result.success) {
        setGeneratedImage(result.imageUrl);
        setGeneratedScore(calculateViralityScore(result.imageUrl, prompt, true));
        setCurrentStep(3);
        setGenerationStatus('ai_success');
        
        const ragAnalysis = await enhancedImageAnalysis('generated', prompt);
        showToast(ragAnalysis, 'success');
      }
      
    } catch (error) {
      console.error('Error in image generation:', error);
      
      if (error.message === 'MODEL_OVERLOADED') {
        showToast('AI model is currently overloaded. Please try again later.', 'error');
        setError('AI service is busy. Please try again later.');
        setGenerationStatus('error');
      } else if (error.message === 'NO_WORKING_MODEL') {
        showToast('No working AI models available. Please try again later.', 'error');
        setError('No AI models available. Please try again later.');
        setGenerationStatus('error');
      } else if (error.message === 'NO_DESCRIPTION_GENERATED') {
        showToast('AI failed to generate image description. Please try again.', 'error');
        setError('AI failed to generate description. Please try again.');
        setGenerationStatus('error');
      } else if (error.message.includes('API_ERROR')) {
        const errorMsg = error.message.replace('API_ERROR: ', '');
        showToast(`AI service error: ${errorMsg}`, 'error');
        setError('Failed to connect to AI service. Please try again.');
        setGenerationStatus('error');
      } else {
        showToast('Failed to generate image. Please try again.', 'error');
        setError('Failed to generate image. Please try again.');
        setGenerationStatus('error');
      }
    }
    
    setLoading(false);
    setProgress('');
  };

  const clearAll = () => {
    setGeneratedImage(null);
    setUploadedImage(null);
    setPrompt('');
    setGeneratedScore(null);
    setUploadedScore(null);
    setError('');
    setCurrentStep(1);
    setGenerationStatus('');
    showToast('Started new comparison', 'info');
  };

  const getStepStatus = (step) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <TrendingUp className="h-8 w-8" />
            Image Virality Analyzer
          </h1>
          <p className="text-xl text-gray-600">
            Upload your image and compare with AI generated images
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className={`flex items-center gap-3 ${getStepStatus(1) === 'completed' ? 'text-green-600' : getStepStatus(1) === 'current' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                getStepStatus(1) === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                getStepStatus(1) === 'current' ? 'border-blue-500 bg-blue-500 text-white' :
                'border-gray-300'
              }`}>
                {getStepStatus(1) === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : '1'}
              </div>
              <span className="font-semibold">Upload Image</span>
            </div>

            <div className={`flex-1 h-0.5 mx-4 ${
              currentStep > 1 ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>

            <div className={`flex items-center gap-3 ${getStepStatus(2) === 'completed' ? 'text-green-600' : getStepStatus(2) === 'current' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                getStepStatus(2) === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                getStepStatus(2) === 'current' ? 'border-blue-500 bg-blue-500 text-white' :
                'border-gray-300'
              }`}>
                {getStepStatus(2) === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : '2'}
              </div>
              <span className="font-semibold">Generate AI Image</span>
            </div>

            <div className={`flex-1 h-0.5 mx-4 ${
              currentStep > 2 ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>

            <div className={`flex items-center gap-3 ${getStepStatus(3) === 'completed' ? 'text-green-600' : getStepStatus(3) === 'current' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                getStepStatus(3) === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                getStepStatus(3) === 'current' ? 'border-blue-500 bg-blue-500 text-white' :
                'border-gray-300'
              }`}>
                {getStepStatus(3) === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : '3'}
              </div>
              <span className="font-semibold">Compare Scores</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {progress && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            {progress}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Upload className="h-6 w-6 text-green-500" />
                Step 1: Upload Your Image
              </h2>
              <ImageUploader 
                onImageUpload={handleImageUpload}
                title="Upload Image for Analysis"
                disabled={false}
              />
              {!uploadedImage && (
                <p className="text-sm text-gray-500 mt-3 text-center">
                  Start by uploading your image for virality analysis
                </p>
              )}
            </div>

            {uploadedImage && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Uploaded Image
                </h3>
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700">
                    <span className="font-semibold">Image Uploaded Successfully!</span> 
                    {generatedImage ? ' Now generate AI image for comparison.' : ' Now generate AI image to compare.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-500" />
                {uploadedImage ? 'Step 2: Generate AI Image' : 'Generate AI Image'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your image
                  </label>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., a beautiful sunset over mountains, a cute cat playing..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerateImage()}
                  />
                </div>
                
                <button
                  onClick={handleGenerateImage}
                  disabled={loading || !prompt.trim()}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate AI Image
                    </>
                  )}
                </button>
              </div>
              {!uploadedImage && (
                <p className="text-sm text-gray-500 mt-3 text-center">
                  Upload an image first, then generate AI image for comparison
                </p>
              )}
            </div>

            {generatedImage && generationStatus === 'ai_success' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    AI Generated Image
                  </h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    AI Generated
                  </span>
                </div>
                
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
                
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700">
                    <span className="font-semibold">AI Image Generated Successfully!</span> Check virality scores below.
                  </p>
                </div>
              </div>
            )}

            {generationStatus === 'error' && !generatedImage && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    AI Generation Failed
                  </h3>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">
                    <span className="font-semibold">AI service is currently unavailable.</span> 
                    You can still analyze your uploaded image's virality score.
                  </p>
                </div>

                <button
                  onClick={handleGenerateImage}
                  disabled={loading}
                  className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {currentStep === 3 && generatedImage && uploadedImage && (
          <div className="mt-8 animate-fade-in">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-purple-500" />
                Virality Comparison Results
              </h2>
              <p className="text-gray-600">Compare the virality scores of both images.</p>
            </div>
            
            <ImageComparison
              generatedImage={generatedImage}
              uploadedImage={uploadedImage}
              generatedScore={generatedScore}
              uploadedScore={uploadedScore}
            />
            
            <div className="text-center mt-6">
              <button
                onClick={clearAll}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                Start New Comparison
              </button>
            </div>
          </div>
        )}

        {uploadedImage && !generatedImage && (
          <div className="mt-8 animate-fade-in">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-purple-500" />
                Image Virality Analysis
              </h2>
              <p className="text-gray-600">Virality score analysis for your uploaded image.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  className="w-full h-64 object-cover"
                />
              </div>
              
              {uploadedScore && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Uploaded Image - Virality Score
                  </h3>
                  
                  <div className="text-center mb-6">
                    <div className={`text-5xl font-bold ${
                      uploadedScore.total >= 80 ? 'text-green-500' :
                      uploadedScore.total >= 60 ? 'text-blue-500' :
                      uploadedScore.total >= 40 ? 'text-yellow-500' :
                      'text-red-500'
                    } mb-2`}>
                      {uploadedScore.total}%
                    </div>
                    <div className="text-gray-500">Overall Virality</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Share2 className="h-4 w-4" />
                        <span>Engagement</span>
                      </div>
                      <span className="font-semibold">{uploadedScore.metrics.engagement}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Heart className="h-4 w-4" />
                        <span>Shareability</span>
                      </div>
                      <span className="font-semibold">{uploadedScore.metrics.shareability}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <BarChart3 className="h-4 w-4" />
                        <span>Visual Appeal</span>
                      </div>
                      <span className="font-semibold">{uploadedScore.metrics.appeal}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center mt-6">
              <button
                onClick={clearAll}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                Analyze Another Image
              </button>
            </div>
          </div>
        )}

        {currentStep === 1 && !generatedImage && !uploadedImage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">How to Use</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mb-2">1</div>
                <span className="font-semibold text-blue-700">Upload Image</span>
                <span className="text-blue-600 mt-1">Start by uploading your image</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mb-2">2</div>
                <span className="font-semibold text-blue-700">Generate AI Image</span>
                <span className="text-blue-600 mt-1">Create AI image for comparison</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mb-2">3</div>
                <span className="font-semibold text-blue-700">Compare Scores</span>
                <span className="text-blue-600 mt-1">See virality comparison results</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;