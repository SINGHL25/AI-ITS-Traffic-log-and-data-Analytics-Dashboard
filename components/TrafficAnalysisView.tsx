
import React, { useMemo } from 'react';
import { PassageData, IVDCData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

interface TrafficAnalysisViewProps {
  passageData: PassageData[];
  ivdcData: IVDCData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-4 bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
                <p className="label text-cyan-400">{`Time: ${label}`}</p>
                {payload.map((pld: any) => (
                    <p key={pld.dataKey} style={{ color: pld.color }}>
                        {`${pld.name}: ${pld.value.toFixed(1)} ${pld.unit || ''}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export const TrafficAnalysisView: React.FC<TrafficAnalysisViewProps> = ({ passageData, ivdcData }) => {
    
    const passageSummaryByLane = useMemo(() => {
        const summary: { [lane: number]: { name: string, vehicles: number, revenue: number }} = {};
        passageData.forEach(p => {
            if (!summary[p.lane]) {
                summary[p.lane] = { name: `Lane ${p.lane}`, vehicles: 0, revenue: 0 };
            }
            summary[p.lane].vehicles++;
            summary[p.lane].revenue += p.revenue;
        });
        return Object.values(summary).sort((a,b) => a.name.localeCompare(b.name));
    }, [passageData]);

    const trafficFlowByHour = useMemo(() => {
        const data = passageData.length > 0 ? passageData : ivdcData;
        const flow: { [hour: string]: { name: string, vehicles: number }} = {};
        data.forEach(p => {
            const hour = p.timestamp.getHours();
            const hourStr = `${hour}:00`;
            if (!flow[hourStr]) {
                flow[hourStr] = { name: hourStr, vehicles: 0 };
            }
            flow[hourStr].vehicles += ('vehicleCount' in p ? p.vehicleCount : 1);
        });
        return Object.values(flow).sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    }, [passageData, ivdcData]);

    const congestionData = useMemo(() => {
        const data: { [hour: string]: { name: string, speed: number, occupancy: number, count: number }} = {};
        ivdcData.forEach(p => {
            const hour = p.timestamp.getHours();
            const hourStr = `${hour}:00`;
            if (!data[hourStr]) {
                data[hourStr] = { name: hourStr, speed: 0, occupancy: 0, count: 0 };
            }
            data[hourStr].speed += p.speed;
            data[hourStr].occupancy += p.occupancy;
            data[hourStr].count++;
        });
        return Object.values(data).map(d => ({
            name: d.name,
            speed: d.speed / d.count,
            occupancy: d.occupancy / d.count,
        })).sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    }, [ivdcData]);


  return (
    <div className="space-y-8">
        {passageData.length > 0 && 
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Passage Summary by Lane</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={passageSummaryByLane} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                        <XAxis dataKey="name" stroke="#a0aec0" />
                        <YAxis yAxisId="left" orientation="left" stroke="#34d399" />
                        <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
                        <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}/>
                        <Legend />
                        <Bar yAxisId="left" dataKey="vehicles" fill="#34d399" name="Total Vehicles" />
                        <Bar yAxisId="right" dataKey="revenue" fill="#f59e0b" name="Total Revenue ($)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        }
        
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Traffic Flow by Hour</h3>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trafficFlowByHour} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                    <XAxis dataKey="name" stroke="#a0aec0" />
                    <YAxis stroke="#a0aec0" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} />
                    <Area type="monotone" dataKey="vehicles" stroke="#22d3ee" fillOpacity={1} fill="url(#colorVehicles)" name="Vehicles" />
                </AreaChart>
            </ResponsiveContainer>
        </div>

        {ivdcData.length > 0 && 
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Congestion Patterns (Speed vs. Occupancy)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={congestionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                        <XAxis dataKey="name" stroke="#a0aec0" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="speed" stroke="#34d399" name="Avg Speed" unit="km/h" strokeWidth={2}/>
                        <Line type="monotone" dataKey="occupancy" stroke="#f59e0b" name="Avg Occupancy" unit="%" strokeWidth={2}/>
                    </LineChart>
                </ResponsiveContainer>
            </div>
        }
    </div>
  );
};
