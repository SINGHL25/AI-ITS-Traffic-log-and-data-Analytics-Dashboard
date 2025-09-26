import { GoogleGenAI } from "@google/genai";
// FIX: Added IVDCData to imports to resolve type error.
import { ParsedData, LogEntry, LogSeverity, IVDCData } from '../types';

// IMPORTANT: This key is for demonstration purposes.
// In a real application, this should be handled securely and not be hardcoded.
// Assuming process.env.API_KEY is configured in the environment.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini features will not work.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const generateRecommendations = async (data: ParsedData): Promise<string> => {
    if (!ai) {
        return Promise.resolve("Gemini AI integration is disabled. Please configure the API_KEY environment variable.");
    }

    const summary = createDataSummary(data);
    
    const prompt = `
    You are a world-class AI expert in Intelligent Transportation Systems (ITS) and Traffic Analytics.
    Your task is to analyze a summary of system logs and traffic data to identify potential operational issues and provide actionable recommendations.

    Here is the data summary:
    ${summary}

    Based on this summary, please provide:
    1.  **Top 3 Key Observations:** Bullet points highlighting the most critical patterns or anomalies you've found.
    2.  **Potential Root Causes:** For any identified issues (like errors, restarts, or congestion), suggest likely underlying causes.
    3.  **Actionable Recommendations:** Provide a numbered list of concrete steps that operators or engineers should take to address the issues and improve system performance and traffic flow.

    Format your response clearly with markdown for easy readability.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Error generating recommendations from AI. The API call failed. Please check your API key and network connection.";
    }
};

export const generateRootCause = async (errorLogs: LogEntry[]): Promise<string> => {
    if (!ai) {
        return Promise.resolve("Gemini AI integration is disabled. Please configure the API_KEY environment variable.");
    }

    const logSnippets = errorLogs
        .slice(0, 10) // Use a sample of recent errors
        .map(log => `${log.timestamp.toISOString()} - ${log.device} - ${log.severity}: ${log.message}`)
        .join('\n');

    const prompt = `
    You are an ITS system diagnostics expert. Given the following sequence of error and warning logs from a traffic management system, create a plausible root-cause analysis.
    
    Log Snippets:
    ${logSnippets}

    Task:
    1.  Identify the primary failure or error event.
    2.  Describe the likely sequence of preceding events or conditions that led to this failure.
    3.  Present this as a simple, text-based flow diagram or a numbered list of events. For example:
        1. Condition A (e.g., Network Timeout) occurs.
        2. -> This leads to Component B (e.g., Queue Manager) failing.
        3. -> Resulting in System C (e.g., ALC) initiating a restart.
    
    Be concise and focus on the most probable cause-and-effect chain.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for root cause analysis:", error);
        return "Error generating root cause analysis from AI.";
    }
};


const createDataSummary = (data: ParsedData): string => {
    let summary = "Data Summary:\n";

    if (data.logs.length > 0) {
        const errorCount = data.logs.filter(l => l.severity === LogSeverity.ERROR).length;
        const warningCount = data.logs.filter(l => l.severity === LogSeverity.WARNING).length;
        const restartCount = data.logs.filter(l => l.message.toLowerCase().includes('restart')).length;
        const uniqueDevices = [...new Set(data.logs.map(l => l.device))].join(', ');

        summary += `
- **Log Analysis:**
  - Total Log Entries: ${data.logs.length}
  - Error Count: ${errorCount}
  - Warning Count: ${warningCount}
  - System Restarts Detected: ${restartCount}
  - Devices Reporting: ${uniqueDevices}
`;
    }

    if (data.passage.length > 0) {
        const totalRevenue = data.passage.reduce((acc, p) => acc + p.revenue, 0).toFixed(2);
        const totalVehicles = data.passage.length;
        const uniqueLanes = [...new Set(data.passage.map(p => p.lane))].length;
        
        summary += `
- **Passage/Transaction Analysis:**
  - Total Vehicles Processed: ${totalVehicles}
  - Total Revenue Generated: $${totalRevenue}
  - Number of Active Lanes: ${uniqueLanes}
`;
    }

    if (data.ivdc.length > 0) {
        const avgOccupancy = (data.ivdc.reduce((acc, i) => acc + i.occupancy, 0) / data.ivdc.length).toFixed(1);
        const avgSpeed = (data.ivdc.reduce((acc, i) => acc + i.speed, 0) / data.ivdc.length).toFixed(1);
        const peakHour = findPeakHour(data.ivdc);

        summary += `
- **IVDC (Vehicle Detection) Analysis:**
  - Average Lane Occupancy: ${avgOccupancy}%
  - Average Vehicle Speed: ${avgSpeed} km/h
  - Detected Peak Traffic Hour: ${peakHour}:00 - ${peakHour + 1}:00
`;
    }

    return summary;
};

const findPeakHour = (data: IVDCData[]): number => {
    const hourlyCounts: { [key: number]: number } = {};
    data.forEach(d => {
        const hour = d.timestamp.getHours();
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + d.vehicleCount;
    });

    return Object.entries(hourlyCounts).reduce((peak, [hour, count]) => 
        count > (hourlyCounts[peak[0]] || 0) ? [parseInt(hour), count] : peak
    , [-1, -1])[0];
};
