import { addDays, toDateKey } from '../lib/date';
import type {
  AdminUserPrototype,
  CheckInEntry,
  CheckInParameterConfig,
  JournalEntry,
  MoodId,
} from '../types/lunara';

export interface MoodDefinition {
  id: MoodId;
  label: string;
  emoji: string;
  description: string;
  accentHex: string;
  surfaceLight: string;
  surfaceDark: string;
  textLight: string;
  textDark: string;
}

export const MOOD_DEFINITIONS: MoodDefinition[] = [
  {
    id: 'great',
    label: 'Great',
    emoji: '✨',
    description: 'Open, grounded, or lifted',
    accentHex: '#76BBAA',
    surfaceLight: '#E3F1EC',
    surfaceDark: '#263D3A',
    textLight: '#285D53',
    textDark: '#BCE2D7',
  },
  {
    id: 'good',
    label: 'Good',
    emoji: '🌤️',
    description: 'Steady and comfortable',
    accentHex: '#78A6E7',
    surfaceLight: '#E3ECF9',
    surfaceDark: '#293B56',
    textLight: '#26446E',
    textDark: '#B9D3F4',
  },
  {
    id: 'okay',
    label: 'Okay',
    emoji: '🌙',
    description: 'Quiet, neutral, moving along',
    accentHex: '#B18ACD',
    surfaceLight: '#EEE4F5',
    surfaceDark: '#352942',
    textLight: '#583E73',
    textDark: '#D5BCE8',
  },
  {
    id: 'low',
    label: 'Low',
    emoji: '☁️',
    description: 'Tired, heavy, or subdued',
    accentHex: '#E5B26F',
    surfaceLight: '#F8EBD4',
    surfaceDark: '#453622',
    textLight: '#7A521E',
    textDark: '#F3D8A9',
  },
  {
    id: 'difficult',
    label: 'Difficult',
    emoji: '🌧️',
    description: 'Strained, tender, or carrying a lot',
    accentHex: '#DF9189',
    surfaceLight: '#F6DFDB',
    surfaceDark: '#442F35',
    textLight: '#87433C',
    textDark: '#F0BDB6',
  },
  {
    id: 'unsure',
    label: 'Unsure',
    emoji: '🧭',
    description: 'Mixed feelings or still settling',
    accentHex: '#D99EBB',
    surfaceLight: '#F7E7EE',
    surfaceDark: '#45303D',
    textLight: '#7A4763',
    textDark: '#F0C7DA',
  },
];

export const MOOD_MAP: Record<MoodId, MoodDefinition> = MOOD_DEFINITIONS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<MoodId, MoodDefinition>
);

export const DAILY_REFLECTION_NOTES = [
  'A little space for yourself today.',
  'Every day holds something worth noticing.',
  'Take today as it comes.',
  "You don't have to figure everything out today.",
  'Notice what stayed with you, without needing to fix it.',
  'Quiet days count just as much as bright ones.',
];

export const SUGGESTED_LIKES = [
  'Quiet morning',
  'Good conversation',
  'Time outdoors',
  'Restful pause',
  'Creative focus',
  'Warm meal',
  'Movement',
  'Music or reading',
];

export const SUGGESTED_DISLIKES = [
  'Poor sleep',
  'Rushed schedule',
  'Screen fatigue',
  'Overwhelmed',
  'Low patience',
  'Disconnection',
  'Physical tension',
  'Unclear boundaries',
];

export const DEFAULT_CHECKIN_PARAMETERS: CheckInParameterConfig[] = [
  {
    id: 'core-mood',
    name: 'Overall Mood',
    description: 'How the day feels overall, without forcing a label.',
    type: 'tags',
    enabled: true,
    required: false,
    order: 1,
    isCore: true,
  },
  {
    id: 'core-happiness',
    name: 'Happiness',
    description: 'Warmth, contentment, or ease felt today.',
    type: 'scale',
    enabled: true,
    required: false,
    order: 2,
    scaleLabels: ['Very low', 'Bright'],
    isCore: true,
  },
  {
    id: 'core-energy',
    name: 'Energy',
    description: 'Physical and mental capacity available today.',
    type: 'scale',
    enabled: true,
    required: false,
    order: 3,
    scaleLabels: ['Depleted', 'Rested'],
    isCore: true,
  },
  {
    id: 'core-stress',
    name: 'Stress',
    description: 'Pressure, tension, or mental load carried.',
    type: 'scale',
    enabled: true,
    required: false,
    order: 4,
    scaleLabels: ['Calm', 'Heavy'],
    isCore: true,
  },
  {
    id: 'custom-clarity',
    name: 'Mental Clarity',
    description: 'Optional custom parameter configured in workspace settings.',
    type: 'scale',
    enabled: false,
    required: false,
    order: 5,
    scaleLabels: ['Foggy', 'Clear'],
    isCore: false,
  },
];

export const PROTOTYPE_ADMIN_USERS: AdminUserPrototype[] = [
  {
    id: 'usr-1',
    name: 'Clara Lin',
    email: 'clara@lunara.example',
    role: 'Admin',
    status: 'active',
    joinedDate: '2026-09-14',
    lastActive: 'Today',
  },
  {
    id: 'usr-2',
    name: 'Mateo Vance',
    email: 'mateo@lunara.example',
    role: 'Facilitator',
    status: 'active',
    joinedDate: '2026-10-02',
    lastActive: 'Yesterday',
  },
  {
    id: 'usr-3',
    name: 'Sora Takahashi',
    email: 'sora@lunara.example',
    role: 'Member',
    status: 'active',
    joinedDate: '2026-10-19',
    lastActive: '2 days ago',
  },
  {
    id: 'usr-4',
    name: 'Elena Rostova',
    email: 'elena@lunara.example',
    role: 'Member',
    status: 'inactive',
    joinedDate: '2026-11-04',
    lastActive: '14 days ago',
  },
];

export const DEFAULT_ADMIN_CONFIG = {
  workspaceName: 'Lunara Personal Space',
  allowCustomTags: true,
  defaultTheme: 'dark' as const,
  maintenanceNotice: '',
};

export function buildSampleJourney(): {
  checkIns: CheckInEntry[];
  journals: JournalEntry[];
} {
  const today = toDateKey();
  const now = new Date().toISOString();

  const checkIns: CheckInEntry[] = [
    {
      id: 'sample-ci-6',
      date: addDays(today, -6),
      mood: 'okay',
      happiness: 3,
      energy: 3,
      stress: 3,
      likes: ['Quiet morning', 'Warm meal'],
      dislikes: ['Rushed schedule'],
      notes: 'Started slower than planned, which actually helped the afternoon settle.',
      updatedAt: now,
      isSample: true,
    },
    {
      id: 'sample-ci-5',
      date: addDays(today, -5),
      mood: 'good',
      happiness: 4,
      energy: 4,
      stress: 2,
      likes: ['Time outdoors', 'Creative focus'],
      dislikes: ['Screen fatigue'],
      notes: 'Long walk before dusk cleared out the mid-week noise.',
      updatedAt: now,
      isSample: true,
    },
    {
      id: 'sample-ci-4',
      date: addDays(today, -4),
      mood: 'low',
      happiness: 2,
      energy: 2,
      stress: 4,
      likes: ['Restful pause'],
      dislikes: ['Poor sleep', 'Overwhelmed'],
      notes: 'A heavier day. Kept expectations small and went to bed early.',
      updatedAt: now,
      isSample: true,
    },
    {
      id: 'sample-ci-3',
      date: addDays(today, -3),
      mood: 'unsure',
      happiness: 3,
      energy: 2,
      stress: 3,
      likes: ['Music or reading', 'Good conversation'],
      dislikes: ['Physical tension'],
      notes: 'Mixed feelings after a long call, though talking it through helped.',
      updatedAt: now,
      isSample: true,
    },
    {
      id: 'sample-ci-2',
      date: addDays(today, -2),
      mood: 'good',
      happiness: 4,
      energy: 3,
      stress: 2,
      likes: ['Quiet morning', 'Movement'],
      dislikes: [],
      notes: 'Steady rhythm today. Noticed how much morning light changes my pace.',
      updatedAt: now,
      isSample: true,
    },
    {
      id: 'sample-ci-1',
      date: addDays(today, -1),
      mood: 'great',
      happiness: 5,
      energy: 4,
      stress: 1,
      likes: ['Good conversation', 'Time outdoors', 'Warm meal'],
      dislikes: [],
      notes: 'Felt genuinely present during dinner—no rushing toward tomorrow.',
      updatedAt: now,
      isSample: true,
    },
  ];

  const journals: JournalEntry[] = [
    {
      id: 'sample-j-1',
      date: addDays(today, -1),
      title: 'Small stillness before winter sets in',
      content:
        'There was a stretch of twenty minutes late this afternoon where nothing needed an immediate answer. I sat by the window with tea and watched the light shift from pale blue to slate violet.\n\nI notice I spend a lot of energy anticipating the next week instead of noticing the room I am already standing in. Today felt softer simply because I stopped rushing through the transitions between tasks.',
      tags: ['Evening', 'Presence'],
      createdAt: now,
      updatedAt: now,
      isSample: true,
    },
    {
      id: 'sample-j-2',
      date: addDays(today, -4),
      title: 'Giving a tired day permission to be tired',
      content:
        'Woke up after fragmented sleep and felt tempted to force productivity anyway. Around noon I realized pushing harder was only adding tension to my shoulders.\n\nStepping back from the non-urgent list did not make anything fall apart. It just made the evening bearable.',
      tags: ['Rest', 'Perspective'],
      createdAt: now,
      updatedAt: now,
      isSample: true,
    },
    {
      id: 'sample-j-3',
      date: addDays(today, -6),
      title: 'Notes from a quiet start',
      content:
        'Kept my phone in another room for the first forty minutes of the morning. The difference in how calm my thoughts felt before noon was unmistakable.',
      tags: ['Morning', 'Habits'],
      createdAt: now,
      updatedAt: now,
      isSample: true,
    },
  ];

  return { checkIns, journals };
}
