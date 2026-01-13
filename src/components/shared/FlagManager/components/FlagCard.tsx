import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import type { FlagDefinition } from '@/src/types/flags';
import { flagTypeColors, flagTypeLabels } from '../utils/flag-constants';

interface FlagCardProps {
  flag: FlagDefinition;
  isUsed: boolean;
  onEdit: (flag: FlagDefinition) => void;
  onDelete: (flagId: string) => void;
}

export function FlagCard({ flag, isUsed, onEdit, onDelete }: FlagCardProps) {
  return (
    <Card
      className={`p-4 hover:bg-accent/50 transition-colors ${
        isUsed ? 'border-l-4 border-l-destructive' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={flagTypeColors[flag.type]}>
              {flagTypeLabels[flag.type]}
            </Badge>
            <code className="text-sm font-mono text-foreground">{flag.id}</code>
            {isUsed && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                Used
              </Badge>
            )}
          </div>
          {flag.name !== flag.id && (
            <div className="text-sm text-foreground mb-1">{flag.name}</div>
          )}
          {flag.description && (
            <div className="text-xs text-muted-foreground mt-1">{flag.description}</div>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {flag.category && (
              <span className="text-xs text-muted-foreground">Category: {flag.category}</span>
            )}
            {flag.valueType && (
              <span className="text-xs text-muted-foreground">Type: {flag.valueType}</span>
            )}
            {flag.defaultValue !== undefined && (
              <span className="text-xs text-muted-foreground">
                Default: {String(flag.defaultValue)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(flag)}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(flag.id)}
            title="Delete"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
