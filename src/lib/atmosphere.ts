import { getTimeOfDayPeriod, type TimeOfDayPeriod } from './date';

export const LUNARA_ARTWORK = {
  morning: '/src/assets/images/lunara_morning_sky_1795740079720.jpg',
  afternoon: '/src/assets/images/lunara_afternoon_lake_1795740080463.jpg',
  evening: '/src/assets/images/lunara_twilight_sanctuary_1795736642313.jpg',
  night: '/src/assets/images/lunara_night_constellation_1795740080977.jpg',
  krishnaWisdom: '/src/assets/images/lunara_krishna_wisdom_1795740081320.jpg',
  lotusAffirmation: '/src/assets/images/lunara_lotus_affirmation_1795740082791.jpg',
  journalBotanical: '/src/assets/images/lunara_journal_botanical_1795736643203.jpg',
} as const;

export interface TimeEnvironment {
  period: TimeOfDayPeriod;
  greeting: string;
  symbol: string;
  subtitle: string;
  backdropImage: string;
  needsEdgeCrop: boolean;
  scrimGradient: string;
  fallbackGradient: string;
}

const TIME_ENVIRONMENTS: Record<TimeOfDayPeriod, TimeEnvironment> = {
  morning: {
    period: 'morning',
    greeting: 'Good morning',
    symbol: '☀️',
    subtitle: 'May your morning unfold with clarity, softness, and purpose.',
    backdropImage: LUNARA_ARTWORK.morning,
    needsEdgeCrop: false,
    scrimGradient:
      'linear-gradient(105deg, rgba(17, 22, 61, 0.84) 0%, rgba(48, 32, 95, 0.62) 52%, rgba(48, 32, 95, 0.25) 100%)',
    fallbackGradient:
      'linear-gradient(135deg, #30205F 0%, #56348D 45%, #E5B26F 100%)',
  },
  afternoon: {
    period: 'afternoon',
    greeting: 'Good afternoon',
    symbol: '🌤️',
    subtitle: 'A quiet breath in the middle of the day belongs entirely to you.',
    backdropImage: LUNARA_ARTWORK.afternoon,
    needsEdgeCrop: false,
    scrimGradient:
      'linear-gradient(105deg, rgba(17, 22, 61, 0.84) 0%, rgba(27, 32, 86, 0.62) 55%, rgba(27, 32, 86, 0.24) 100%)',
    fallbackGradient:
      'linear-gradient(135deg, #1B2056 0%, #304A70 52%, #78A6E7 100%)',
  },
  evening: {
    period: 'evening',
    greeting: 'Good evening',
    symbol: '🌅',
    subtitle: 'Let the weight of the day soften as twilight settles around you.',
    backdropImage: LUNARA_ARTWORK.evening,
    needsEdgeCrop: true,
    scrimGradient:
      'linear-gradient(105deg, rgba(17, 22, 61, 0.86) 0%, rgba(48, 32, 95, 0.66) 54%, rgba(86, 52, 141, 0.28) 100%)',
    fallbackGradient:
      'linear-gradient(135deg, #1B2056 0%, #56348D 55%, #D99EBB 100%)',
  },
  night: {
    period: 'night',
    greeting: 'Good night',
    symbol: '🌙',
    subtitle: 'The night sky is calm now—set down whatever today held.',
    backdropImage: LUNARA_ARTWORK.night,
    needsEdgeCrop: true,
    scrimGradient:
      'linear-gradient(105deg, rgba(17, 22, 61, 0.88) 0%, rgba(27, 32, 86, 0.68) 54%, rgba(48, 32, 95, 0.3) 100%)',
    fallbackGradient:
      'linear-gradient(135deg, #11163D 0%, #1B2056 50%, #30205F 100%)',
  },
};

export function getTimeEnvironment(date: Date = new Date()): TimeEnvironment {
  return TIME_ENVIRONMENTS[getTimeOfDayPeriod(date)];
}
