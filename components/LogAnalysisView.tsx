
import React, { useMemo } from 'react';
import { LogEntry, LogSeverity } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface LogAnalysisViewProps {
  logs: LogEntry[];
}

const severityColors = {
  [LogSeverity.INFO]: "#34d399",
  [LogSeverity.WARNING]: "#f59e0b",
  [LogSeverity.ERROR]: "#ef4444",
  [LogSeverity.CRITICAL]: "#dc2626",
  [LogSeverity.UNKNOWN]: "#6b7280",
};

export const LogAnalysisView: React.FC<LogAnalysisViewProps> = ({ logs }) => {
    
  const eventCountsByDevice = useMemo(() => {
    const counts: { [device: string]: { [S in LogSeverity]?: number } & { name: string } } = {};
    logs.forEach(log => {
      if (!counts[log.device]) {
        counts[log.device] = { name: log.device };
      }
      counts[log.device][log.severity] = (counts[log.device][log.severity] || 0) + 1;
    });
    return Object.values(counts);
  }, [logs]);

  const timelineData = useMemo(() => {
    const countsByHour: { [hour: string]: { [S in LogSeverity]?: number } & { name: string } } = {};
    logs.forEach(log => {
        const hour = new Date(log.timestamp.getFullYear(), log.timestamp.getMonth(), log.timestamp.getDate(), log.timestamp.getHours()).toISOString();
        const hourStr = `${log.timestamp.getHours()}:00`;
        if (!countsByHour[hour]) {
            countsByHour[hour] = { name: hourStr };
        }
        countsByHour[hour][log.severity] = (countsByHour[hour][log.severity] || 0) + 1;
    });
    return Object.values(countsByHour).sort((a,b) => a.name.localeCompare(b.name));
  }, [logs]);
  
  const recentLogs = useMemo(() => {
    return [...logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 100);
  }, [logs]);

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Events by Device/Module</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={eventCountsByDevice} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                        <XAxis dataKey="name" stroke="#a0aec0" />
                        <YAxis stroke="#a0aec0" />
                        <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} cursor={{fill: 'rgba(100, 116, 139, 0.1)'}}/>
                        <Legend />
                        <Bar dataKey={LogSeverity.ERROR} stackId="a" fill={severityColors.Error} name="Errors" />
                        <Bar dataKey={LogSeverity.WARNING} stackId="a" fill={severityColors.Warning} name="Warnings" />
                        <Bar dataKey={LogSeverity.INFO} stackId="a" fill={severityColors.Info} name="Info" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Event Timeline (by Hour)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timelineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                        <XAxis dataKey="name" stroke="#a0aec0" />
                        <YAxis stroke="#a0aec0" />
                        <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} cursor={{stroke: '#4a5568', strokeWidth: 1}}/>
                        <Legend />
                        <Line type="monotone" dataKey={LogSeverity.ERROR} stroke={severityColors.Error} name="Errors" strokeWidth={2} />
                        <Line type="monotone" dataKey={LogSeverity.WARNING} stroke={severityColors.Warning} name="Warnings" strokeWidth={2} />
                        <Line type="monotone" dataKey={LogSeverity.INFO} stroke={severityColors.Info} name="Info" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Recent Log Entries</h3>
            <div className="overflow-x-auto max-h-96">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="p-3">Timestamp</th>
                            <th className="p-3">Severity</th>
                            <th className="p-3">Device</th>
                            <th className="p-3">Message</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {recentLogs.map((log, index) => (
                            <tr key={index} className="hover:bg-gray-700/40">
                                <td className="p-3 whitespace-nowrap">{log.timestamp.toLocaleString()}</td>
                                <td className="p-3">
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${severityColors[log.severity]}20`, color: severityColors[log.severity]}}>
                                        {log.severity}
                                    </span>
                                </td>
                                <td className="p-3 font-mono">{log.device}</td>
                                <td className="p-3">{log.message}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};
