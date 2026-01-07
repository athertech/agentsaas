export interface OfficeHours {
    isOpen: boolean;
    open: string;
    close: string;
    breaks?: { start: string; end: string }[];
}

export interface KBEntry {
    category: string;
    question?: string;
    content: string;
}

export interface AppointmentType {
    name: string;
    duration: number;
    active: boolean;
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
    voiceProvider?: string;
    greeting: string;
    tone: string;
    calcomApiKey?: string;
    calcomEventTypeId?: string;
    knowledgeBase?: KBEntry[];
    appointmentTypes?: AppointmentType[];
    afterHoursBehavior?: 'voicemail' | 'book_next' | 'transfer';
    emergencyPhoneNumber?: string;
}
