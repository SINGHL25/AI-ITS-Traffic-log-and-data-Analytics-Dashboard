import React, { useState, useCallback, useMemo } from 'react';
import { FileUploadArea } from './components/FileUploadArea';
import { DashboardView } from './components/DashboardView';
import { parseFile } from './services/fileParser';
import { ParsedData, FileType } from './types';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';

const App: React.FC = () => {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileProcess = useCallback(async (fileType: FileType, file: File) => {
    setIsLoading(true);
    setError(null);
    setParsedData(null);
    setFileName(file.name);

    try {
      const data = await parseFile(fileType, file);
      setParsedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during parsing.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleReset = useCallback(() => {
    setParsedData(null);
    setError(null);
    setFileName(null);
  }, []);

  const hasData = useMemo(() => parsedData && (
      parsedData.logs.length > 0 ||
      parsedData.passage.length > 0 ||
      parsedData.ivdc.length > 0
  ), [parsedData]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {!hasData && !isLoading && (
          <FileUploadArea onFileProcess={handleFileProcess} />
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64">
            <LoadingSpinner />
            <p className="text-lg text-cyan-400 mt-4">Analyzing data, please wait...</p>
          </div>
        )}

        {error && (
          <div className="text-center p-8 bg-red-900/50 rounded-lg border border-red-700">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Analysis Failed</h2>
            <p className="text-red-300">{error}</p>
            <button
              onClick={handleReset}
              className="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {hasData && (
          <DashboardView 
            data={parsedData} 
            fileName={fileName || "Uploaded Data"}
            onReset={handleReset} 
          />
        )}
      </main>
    </div>
  );
};

export default App;