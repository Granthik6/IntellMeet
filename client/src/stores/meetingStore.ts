import { create } from 'zustand';
import type { Participant, ParticipantStates } from '@/types';

interface MeetingRoomState {
  participants: Participant[];
  participantStates: ParticipantStates;
  isMuted: boolean;
  cameraOff: boolean;
  isRecording: boolean;
  isScreenSharing: boolean;
  isTranscribing: boolean;

  // Actions
  setParticipants: (participants: Participant[]) => void;
  setParticipantStates: (states: ParticipantStates) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  setRecording: (value: boolean) => void;
  setScreenSharing: (value: boolean) => void;
  setTranscribing: (value: boolean) => void;
  reset: () => void;
}

export const useMeetingStore = create<MeetingRoomState>((set) => ({
  participants: [],
  participantStates: {},
  isMuted: false,
  cameraOff: false,
  isRecording: false,
  isScreenSharing: false,
  isTranscribing: false,

  setParticipants: (participants) => set({ participants }),
  setParticipantStates: (states) => set({ participantStates: states }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleCamera: () => set((state) => ({ cameraOff: !state.cameraOff })),
  setRecording: (value) => set({ isRecording: value }),
  setScreenSharing: (value) => set({ isScreenSharing: value }),
  setTranscribing: (value) => set({ isTranscribing: value }),
  reset: () =>
    set({
      participants: [],
      participantStates: {},
      isMuted: false,
      cameraOff: false,
      isRecording: false,
      isScreenSharing: false,
      isTranscribing: false,
    }),
}));
