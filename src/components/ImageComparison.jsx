import React from 'react';
import { TrendingUp, Share2, Heart, BarChart3 } from 'lucide-react';

const ViralityScoreCard = ({ score, title }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        {title} - Virality Score
      </h3>
      <div className="text-center mb-6">
        <div className={`text-5xl font-bold ${getScoreColor(score.total)} mb-2`}>
          {score.total}%
        </div>
        <div className="text-gray-500">Overall Virality</div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Share2 className="h-4 w-4" />
            <span>Engagement</span>
          </div>
          <span className="font-semibold">{score.metrics.engagement}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Heart className="h-4 w-4" />
            <span>Shareability</span>
          </div>
          <span className="font-semibold">{score.metrics.shareability}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <BarChart3 className="h-4 w-4" />
            <span>Visual Appeal</span>
          </div>
          <span className="font-semibold">{score.metrics.appeal}%</span>
        </div>
      </div>
    </div>
  );
};
const ImageComparison = ({ generatedImage, uploadedImage, generatedScore, uploadedScore }) => {
  if (!generatedImage && !uploadedImage) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      {generatedImage && generatedScore && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <img 
              src={generatedImage} 
              alt="Generated" 
              className="w-full h-64 object-cover"
            />
          </div>
          <ViralityScoreCard score={generatedScore} title="AI Generated" />
        </div>
      )}
      {uploadedImage && uploadedScore && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <img 
              src={uploadedImage} 
              alt="Uploaded" 
              className="w-full h-64 object-cover"
            />
          </div>
          <ViralityScoreCard score={uploadedScore} title="Uploaded Image" />
        </div>
      )}
    </div>
  );
};
export default ImageComparison;