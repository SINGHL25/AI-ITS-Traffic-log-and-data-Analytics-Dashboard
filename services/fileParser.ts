import { LogEntry, PassageData, IVDCData, ParsedData, LogSeverity, FileType } from '../types';

const parseTsmcLog = (content: string): LogEntry[] => {
    const entries: LogEntry[] = [];
    const lines = content.trim().split(':)');
    for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('/').filter(p => p);
        if (parts.length < 9) continue;
        try {
            const [date, time, _, __, device, sourceFile, ___, ____, severityChar, message] = parts;
            const timestamp = new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${time.slice(0, 8)}.${time.slice(9, 12)}Z`);
            
            let severity = LogSeverity.UNKNOWN;
            if (severityChar === 'I') severity = LogSeverity.INFO;
            else if (severityChar === 'W') severity = LogSeverity.WARNING;
            else if (severityChar === 'E') severity = LogSeverity.ERROR;

            entries.push({
                timestamp,
                device,
                severity,
                message: message.split('/')[0],
                eventType: severity === LogSeverity.INFO ? 'Info' : 'Alarm',
                sourceFile
            });
        } catch (e) {
            console.warn("Skipping malformed TSMC log line:", line);
        }
    }
    return entries;
};

const parseMcAfeeLog = (content: string): LogEntry[] => {
    const entries: LogEntry[] = [];
    const lines = content.trim().split('\n');
    const regex = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\s+([^\(]+)\(.*\)\s+([^:]+):\s+(.*)$/;
    for (const line of lines) {
        const match = line.match(regex);
        if (!match) continue;
        try {
            const [, timestampStr, device, severityStr, message] = match;
            const timestamp = new Date(timestampStr.trim() + 'Z');

            let severity = LogSeverity.UNKNOWN;
            const sLower = severityStr.toLowerCase();
            if (sLower.includes('info')) severity = LogSeverity.INFO;
            else if (sLower.includes('warn')) severity = LogSeverity.WARNING;
            else if (sLower.includes('error')) severity = LogSeverity.ERROR;

            entries.push({
                timestamp,
                device: device.trim(),
                severity,
                message: message.trim(),
                eventType: severity === LogSeverity.INFO ? 'Info' : 'Event',
            });
        } catch (e) {
            console.warn("Skipping malformed McAfee log line:", line);
        }
    }
    return entries;
};

const parseAlcLog = (content: string): LogEntry[] => {
    const entries: LogEntry[] = [];
    const lines = content.trim().split('~|[');
    for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('\t').map(p => p.trim());
        if (parts.length < 8) continue;
        try {
            const [timestampStr, severityChar, _, device, sourceFile, __, ___, message] = parts;
            const timestamp = new Date(timestampStr.replace(' ', 'T') + 'Z');
            
            let severity = LogSeverity.UNKNOWN;
            if (severityChar === 'I') severity = LogSeverity.INFO;
            else if (severityChar === 'W') severity = LogSeverity.WARNING;
            else if (severityChar === 'E') severity = LogSeverity.ERROR;
            
            entries.push({
                timestamp,
                device,
                severity,
                message: message.replace(']|~', '').trim(),
                eventType: message.toLowerCase().includes('restart') ? 'Restart' : 'Alarm',
                sourceFile
            });
        } catch (e) {
            console.warn("Skipping malformed ALC log line:", line);
        }
    }
    return entries;
};

const parsePassageCsv = (content: string): PassageData[] => {
    const data: PassageData[] = [];
    const lines = content.trim().split('\n');
    const startIndex = lines[0] && lines[0].toLowerCase().includes('timestamp') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length < 4) continue;

        try {
            const [timestampStr, laneStr, vehicleClass, revenueStr] = parts;
            const timestamp = new Date(timestampStr.trim());
            if (isNaN(timestamp.getTime())) continue; // Skip if date is invalid

            data.push({
                timestamp,
                lane: parseInt(laneStr.trim(), 10),
                vehicleClass: vehicleClass.trim(),
                revenue: parseFloat(revenueStr.trim()),
            });
        } catch (e) {
            console.warn(`Skipping malformed passage CSV line: ${line}`);
        }
    }
    return data;
};

const parseIvdcCsv = (content: string): IVDCData[] => {
    const data: IVDCData[] = [];
    const lines = content.trim().split('\n');
    const startIndex = lines[0] && lines[0].toLowerCase().includes('timestamp') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length < 5) continue;

        try {
            const [timestampStr, laneStr, occupancyStr, speedStr, vehicleCountStr] = parts;
            const timestamp = new Date(timestampStr.trim());
            if (isNaN(timestamp.getTime())) continue; // Skip if date is invalid

            data.push({
                timestamp,
                lane: parseInt(laneStr.trim(), 10),
                occupancy: parseFloat(occupancyStr.trim()),
                speed: parseFloat(speedStr.trim()),
                vehicleCount: parseInt(vehicleCountStr.trim(), 10),
            });
        } catch (e) {
            console.warn(`Skipping malformed IVDC CSV line: ${line}`);
        }
    }
    return data;
};


export const parseFile = async (fileType: FileType, file: File): Promise<ParsedData> => {
    const parsedData: ParsedData = {
        logs: [],
        passage: [],
        ivdc: []
    };
    
    const content = await file.text();

    switch(fileType) {
        case 'TSMC':
            parsedData.logs = parseTsmcLog(content);
            break;
        case 'McAfee':
            parsedData.logs = parseMcAfeeLog(content);
            break;
        case 'ALC':
            parsedData.logs = parseAlcLog(content);
            break;
        case 'Passage':
            parsedData.passage = parsePassageCsv(content);
            break;
        case 'IVDC':
            parsedData.ivdc = parseIvdcCsv(content);
            break;
        default:
            throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    if (parsedData.logs.length === 0 && parsedData.passage.length === 0 && parsedData.ivdc.length === 0) {
        throw new Error('File content could not be parsed or the file is empty. Please check the file format and selected data source type.');
    }

    return parsedData;
};