
import React, { useState } from 'react';
import { ParsedData, LogSeverity } from '../types';
import { LogAnalysisView } from './LogAnalysisView';
import { TrafficAnalysisView } from './TrafficAnalysisView';
import { RecommendationsView } from './RecommendationsView';
import { DocumentMagnifyingGlassIcon, ChartPieIcon, SparklesIcon, ArrowUturnLeftIcon } from './icons/Icons';

interface DashboardViewProps {
  data: ParsedData;
  fileName: string;
  onReset: () => void;
}

type Tab = 'logs' | 'traffic' | 'ai';

export const DashboardView: React.FC<DashboardViewProps> = ({ data, fileName, onReset }) => {
  const [activeTab, setActiveTab] = useState<Tab>('logs');

  const hasLogs = data.logs.length > 0;
  const hasTraffic = data.passage.length > 0 || data.ivdc.length > 0;

  // Set initial tab based on available data
  useState(() => {
    if (hasLogs) setActiveTab('logs');
    else if (hasTraffic) setActiveTab('traffic');
    else setActiveTab('ai');
  });

  const TabButton = ({ tab, label, icon }: { tab: Tab; label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === tab
          ? 'bg-cyan-600 text-white'
          : 'text-gray-300 hover:bg-gray-700'
      }`}
    >
        {icon}
        <span>{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-gray-800/60 p-4 rounded-lg border border-gray-700">
        <div className="mb-4 md:mb-0">
          <h2 className="text-xl font-bold text-white">Analysis for: <span className="text-cyan-400">{fileName}</span></h2>
        </div>
        <button onClick={onReset} className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            <ArrowUturnLeftIcon />
            <span>Analyze New File</span>
        </button>
      </div>

      <div className="bg-gray-800/60 p-2 rounded-lg border border-gray-700 flex space-x-2">
        {hasLogs && <TabButton tab="logs" label="Log Analysis" icon={<DocumentMagnifyingGlassIcon />} />}
        {hasTraffic && <TabButton tab="traffic" label="Traffic Analysis" icon={<ChartPieIcon />} />}
        <TabButton tab="ai" label="AI Recommendations" icon={<SparklesIcon />} />
      </div>

      <div className="p-1">
        {activeTab === 'logs' && hasLogs && <LogAnalysisView logs={data.logs} />}
        {activeTab === 'traffic' && hasTraffic && <TrafficAnalysisView passageData={data.passage} ivdcData={data.ivdc} />}
        {activeTab === 'ai' && <RecommendationsView data={data} />}
      </div>
    </div>
  );
};
