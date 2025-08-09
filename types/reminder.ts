export interface ReminderConfig {
  finishSchoolTime: string;
  messageTemplate: string;
  updatedAt: number;
}

export interface ReminderLog {
  parentName: string;
  studentsNames: string;
  walletAddress: string;
  status: "pending" | "sent";
  date: string; // YYYY-MM-DD
}