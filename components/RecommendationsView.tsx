
import React, { useState, useEffect } from 'react';
import { ParsedData, LogSeverity } from '../types';
import { generateRecommendations, generateRootCause } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { LightBulbIcon, ExclamationTriangleIcon } from './icons/Icons';

interface RecommendationsViewProps {
  data: ParsedData;
}

// A simple markdown renderer
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n');
    return (
        <div className="prose prose-invert prose-sm md:prose-base max-w-none">
            {lines.map((line, index) => {
                if (line.startsWith('### ')) return <h3 key={index} className="!mt-4 !mb-2">{line.substring(4)}</h3>
                if (line.startsWith('## ')) return <h2 key={index} className="!mt-6 !mb-3">{line.substring(3)}</h2>
                if (line.startsWith('# ')) return <h1 key={index} className="!mt-8 !mb-4">{line.substring(2)}</h1>
                if (line.startsWith('* ')) return <li key={index}>{line.substring(2)}</li>
                if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) return <li key={index}>{line.substring(3)}</li>
                if (line.trim() === '') return <br key={index} />;
                return <p key={index}>{line}</p>;
            })}
        </div>
    );
};


export const RecommendationsView: React.FC<RecommendationsViewProps> = ({ data }) => {
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [rootCause, setRootCause] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const recsPromise = generateRecommendations(data);
        const errorLogs = data.logs.filter(l => l.severity === LogSeverity.ERROR || l.severity === LogSeverity.WARNING);
        const rootCausePromise = errorLogs.length > 0 ? generateRootCause(errorLogs) : Promise.resolve(null);
        
        const [recsResult, rootCauseResult] = await Promise.all([recsPromise, rootCausePromise]);

        setRecommendations(recsResult);
        setRootCause(rootCauseResult);

      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchInsights();
  }, [data]);

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-800/50 rounded-lg">
            <LoadingSpinner />
            <p className="text-lg text-cyan-400 mt-4">AI is analyzing the data...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="p-6 bg-red-900/50 rounded-lg border border-red-700 text-red-300">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Failed to Generate AI Insights</h3>
            <p>{error}</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
                <LightBulbIcon className="text-yellow-400"/>
                <h3 className="text-xl font-semibold text-yellow-400">AI-Generated Recommendations</h3>
            </div>
            {recommendations && <SimpleMarkdown text={recommendations} />}
        </div>
        
        {rootCause && (
             <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                    <ExclamationTriangleIcon className="text-orange-400" />
                    <h3 className="text-xl font-semibold text-orange-400">Potential Root Cause Analysis</h3>
                </div>
                {rootCause && <SimpleMarkdown text={rootCause} />}
            </div>
        )}
    </div>
  );
};
