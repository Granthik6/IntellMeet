// ===== User Types =====
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "Admin" | "Member";
  bio?: string;
  department?: string;
  status?: "online" | "away" | "busy" | "offline";
  createdAt?: string;
  provider?: "local" | "google";
}

// ===== Auth Types =====
export interface LoginResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: User;
}

export interface SignupResponse {
  message: string;
  user: User;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

// ===== Meeting Types =====
export interface MeetingSettings {
  muteOnEntry: boolean;
  requireApproval: boolean;
  autoRecord: boolean;
}

export interface ActionItem {
  text: string;
  assignee: string;
  dueDate?: string;
  status: "pending" | "in-progress" | "completed";
}

export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
}

export interface Meeting {
  _id: string;
  title: string;
  description: string;
  date: string;
  meetingCode: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
  type: "instant" | "scheduled" | "recurring";
  participants: string[];
  createdBy: string;
  duration: number;
  recording: string;
  transcript: TranscriptEntry[];
  summary: string;
  actionItems: ActionItem[];
  maxParticipants: number;
  settings: MeetingSettings;
  createdAt: string;
  updatedAt: string;
}

// ===== Message Types =====
export interface Message {
  _id?: string;
  sender: string;
  meetingId: string;
  text: string;
  createdAt?: string;
}

// ===== Team Types =====
export interface TeamMember {
  user: User;
  role: "owner" | "admin" | "member";
  _id: string;
}

export interface Team {
  _id: string;
  name: string;
  description: string;
  members: TeamMember[];
  createdBy: any;
  createdAt: string;
  updatedAt: string;
}

// ===== Task Types =====
export interface Task {
  _id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "review" | "done" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  assignee: any;
  team?: any;
  dueDate?: string;
  meeting?: string;
  createdBy: any;
  createdAt: string;
  updatedAt: string;
}

// ===== Notification Types =====
export interface Notification {
  _id: string;
  user: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ===== Socket Participant Types =====
export interface Participant {
  name: string;
  socketId: string;
  muted?: boolean;
  cameraOff?: boolean;
}

export interface ParticipantStates {
  [socketId: string]: Participant;
}

// ===== Analytics Types =====
export interface Analytics {
  totalMeetings: number;
  activeMeetings: number;
  completedMeetings: number;
  totalTasks: number;
  completedTasks: number;
  teamsCount: number;
  totalParticipants: number;
  avgDuration: number;
}

// ===== Chat Message (frontend) =====
export interface ChatMessage {
  sender: string;
  message: string;
  type: "message" | "system";
  createdAt?: string;
}
