"use client";

import { useState, useEffect } from 'react';
import { HomePage } from '@/components/HomePage';
import { ResultPage } from '@/components/ResultPage';
import { client } from '@/lib/appwrite';

export default function App() {
  const [showResults, setShowResults] = useState(false);
  const [profileText, setProfileText] = useState('');
  const [fileName, setFileName] = useState('');
  const [results, setResults] = useState<any[]>([]);
  
  useEffect(() => {
    // Ping the Appwrite backend server to verify the setup
    // @ts-ignore - ping() is added per instruction
    client.ping();
  }, []);
  
  const handleAnalyze = (text: string, file?: string, analysisResults?: any[]) => {
    setProfileText(text);
    setFileName(file || 'Profil Klien');
    if (analysisResults) {
      setResults(analysisResults);
      setShowResults(true);
    }
  };
  
  const handleBack = () => {
    setShowResults(false);
  };
  
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {!showResults ? (
        <HomePage onAnalyze={handleAnalyze} />
      ) : (
        <ResultPage onBack={handleBack} profileText={profileText} fileName={fileName} recommendations={results} />
      )}
    </div>
  );
}
