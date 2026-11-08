import type { PublicTranslationKey } from '@/context/I18nContext';
import type { GuideTopic } from '@/server/guides';

export const GUIDE_TOPIC_KEYS: Record<GuideTopic, PublicTranslationKey> = {
  ferry: 'ferry',
  stays: 'stays',
  experiences: 'experiences',
  east_africa: 'eastAfrica',
  international: 'international',
};
