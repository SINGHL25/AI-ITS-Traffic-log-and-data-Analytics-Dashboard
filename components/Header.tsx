
import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-8 py-4">
                <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
                    AI ITS/Traffic Analytics Dashboard
                </h1>
                <p className="text-gray-400 text-sm">Analyze logs and traffic data with the power of AI</p>
            </div>
        </header>
    );
};
