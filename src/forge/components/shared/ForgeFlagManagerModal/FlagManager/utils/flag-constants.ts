import { FLAG_TYPE } from '@/forge/types/constants';
import type { FlagType } from '@/forge/types/flags';
import { BookOpen, Trophy, Package, TrendingUp, Crown, Globe, MessageSquare, LucideIcon } from 'lucide-react';

export const flagTypeColors: Record<FlagType, string> = {
  [FLAG_TYPE.DIALOGUE]: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  [FLAG_TYPE.QUEST]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  [FLAG_TYPE.ACHIEVEMENT]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  [FLAG_TYPE.ITEM]: 'bg-green-500/20 text-green-400 border-green-500/30',
  [FLAG_TYPE.STAT]: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  [FLAG_TYPE.TITLE]: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  [FLAG_TYPE.GLOBAL]: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export const flagTypeLabels: Record<FlagType, string> = {
  [FLAG_TYPE.DIALOGUE]: 'Dialogue',
  [FLAG_TYPE.QUEST]: 'Quest',
  [FLAG_TYPE.ACHIEVEMENT]: 'Achievement',
  [FLAG_TYPE.ITEM]: 'Item',
  [FLAG_TYPE.STAT]: 'Stat',
  [FLAG_TYPE.TITLE]: 'Title',
  [FLAG_TYPE.GLOBAL]: 'Global',
};

export const flagTypeIcons: Record<FlagType, LucideIcon> = {
  [FLAG_TYPE.DIALOGUE]: MessageSquare,
  [FLAG_TYPE.QUEST]: BookOpen,
  [FLAG_TYPE.ACHIEVEMENT]: Trophy,
  [FLAG_TYPE.ITEM]: Package,
  [FLAG_TYPE.STAT]: TrendingUp,
  [FLAG_TYPE.TITLE]: Crown,
  [FLAG_TYPE.GLOBAL]: Globe,
};

export const flagTypes: FlagType[] = [
  FLAG_TYPE.DIALOGUE,
  FLAG_TYPE.QUEST,
  FLAG_TYPE.ACHIEVEMENT,
  FLAG_TYPE.ITEM,
  FLAG_TYPE.STAT,
  FLAG_TYPE.TITLE,
  FLAG_TYPE.GLOBAL,
];
