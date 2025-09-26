
export enum LogSeverity {
    INFO = 'Info',
    WARNING = 'Warning',
    ERROR = 'Error',
    CRITICAL = 'Critical',
    UNKNOWN = 'Unknown',
}

export interface LogEntry {
    timestamp: Date;
    device: string;
    severity: LogSeverity;
    message: string;
    eventType: string;
    sourceFile?: string;
}

export interface PassageData {
    timestamp: Date;
    lane: number;
    vehicleClass: string;
    revenue: number;
}

export interface IVDCData {
    timestamp: Date;
    lane: number;
    occupancy: number; // percentage
    speed: number; // km/h
    vehicleCount: number;
}

export interface ParsedData {
    logs: LogEntry[];
    passage: PassageData[];
    ivdc: IVDCData[];
}

export type FileType = 'TSMC' | 'McAfee' | 'ALC' | 'Passage' | 'IVDC';
