import { GlassCard } from './GlassCard';
import type { Badge } from '@/store/gameStore';

export const BadgeCard = ({ badge }: { badge: Badge }) => (
  <GlassCard className={`text-center ${!badge.earned ? 'opacity-40 grayscale' : ''}`} hover={badge.earned}>
    <div className="text-3xl mb-2">{badge.icon}</div>
    <h4 className="font-display text-xs font-bold text-foreground mb-1">{badge.name}</h4>
    <p className="text-[10px] text-nq-text-muted">{badge.earned ? badge.description : badge.unlockCondition}</p>
  </GlassCard>
);
