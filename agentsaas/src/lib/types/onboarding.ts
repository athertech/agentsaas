export interface OfficeHours {
    isOpen: boolean;
    open: string;
    close: string;
    breaks?: { start: string; end: string }[];
}

export interface OnboardingData {
    practiceName: string;
    address: string;
    website: string;
    practiceType: string[];
    insurance: string[];
    officeHours: Record<string, OfficeHours>;
    phoneNumber: string;
    voiceId: string;
    greeting: string;
    tone: string;
    calcomApiKey?: string;
    calcomEventTypeId?: string;
}
