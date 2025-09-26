import React, { useState, useRef } from 'react';
import { FileType } from '../types';
import { FolderArrowDownIcon, DocumentTextIcon, ChartBarIcon, CpuChipIcon } from './icons/Icons';

interface FileUploadAreaProps {
  onFileProcess: (fileType: FileType, file: File) => void;
}

const fileTypes: { name: FileType, icon: React.ReactNode, description: string }[] = [
    { name: 'TSMC', icon: <CpuChipIcon />, description: 'Controller Logs' },
    { name: 'ALC', icon: <CpuChipIcon />, description: 'Controller Logs' },
    { name: 'McAfee', icon: <DocumentTextIcon />, description: 'Security Logs' },
    { name: 'Passage', icon: <ChartBarIcon />, description: 'Transaction Data' },
    { name: 'IVDC', icon: <ChartBarIcon />, description: 'Vehicle Count Data' },
];


export const FileUploadArea: React.FC<FileUploadAreaProps> = ({ onFileProcess }) => {
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileType, setSelectedFileType] = useState<FileType | null>(null);

  const handleButtonClick = (fileType: FileType) => {
    setSelectedFileType(fileType);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedFileType) {
      onFileProcess(selectedFileType, file);
    }
    // Reset file input to allow re-uploading the same file
    if (event.target) {
        event.target.value = '';
    }
  };
  
  return (
    <div className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center transition-all duration-300 ease-in-out hover:border-cyan-500 hover:bg-gray-800/80"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".log,.txt,.csv"
      />
      <div className="flex justify-center items-center mb-6">
        <FolderArrowDownIcon className={`w-16 h-16 text-gray-500 transition-transform duration-300 ${isHovering ? 'scale-110 -translate-y-1' : ''}`} />
      </div>
      <h2 className="text-2xl font-semibold text-gray-200 mb-2">Select a Data Source to Analyze</h2>
      <p className="text-gray-400 mb-8">
        Choose one of the predefined data types below to upload a file and start the analysis.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {fileTypes.map(({name, icon, description}) => (
            <button
                key={name}
                onClick={() => handleButtonClick(name)}
                className="group flex flex-col items-center justify-center p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-cyan-900/50 hover:border-cyan-700 transition-all duration-200 transform hover:-translate-y-1"
            >
                <div className="text-cyan-400 mb-2 w-8 h-8">{icon}</div>
                <span className="font-bold text-gray-100">{name}</span>
                <span className="text-xs text-gray-400">{description}</span>
            </button>
        ))}
      </div>
    </div>
  );
};