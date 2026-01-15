import React, { useState } from 'react';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import type { FlagDefinition, FlagValueType } from '@/forge/types/flags';
import { FLAG_TYPE, FLAG_VALUE_TYPE } from '@/forge/types/constants';
import { flagTypeColors, flagTypeLabels, flagTypes } from '@/forge/components/ForgeWorkspace/components/GraphEditors/ForgeWorkSpaceModals/components/ForgeFlagManagerModal/FlagManager/utils/flag-constants';
import { cn } from '@/shared/lib/utils';

interface ForgeFlagEditorProps {
  flag: FlagDefinition;
  categories: string[];
  onSave: (flag: FlagDefinition) => void;
  onCancel: () => void;
}

export function ForgeFlagEditor({ flag, categories, onSave, onCancel }: ForgeFlagEditorProps) {
  const [edited, setEdited] = useState<FlagDefinition>(flag);

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <Label htmlFor="flag-id" className="text-xs uppercase">
          Flag ID
        </Label>
        <Input
          id="flag-id"
          type="text"
          value={edited.id}
          onChange={(e) => setEdited({ ...edited, id: e.target.value })}
          className="font-mono mt-1"
          placeholder="quest_dragon_slayer"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use prefixes: quest_, item_, stat_, etc.
        </p>
      </div>

      <div>
        <Label htmlFor="flag-name" className="text-xs uppercase">
          Display Name
        </Label>
        <Input
          id="flag-name"
          type="text"
          value={edited.name}
          onChange={(e) => setEdited({ ...edited, name: e.target.value })}
          className="mt-1"
          placeholder="Dragon Slayer Quest"
        />
      </div>

      <div>
        <Label htmlFor="flag-description" className="text-xs uppercase">
          Description
        </Label>
        <Textarea
          id="flag-description"
          value={edited.description || ''}
          onChange={(e) => setEdited({ ...edited, description: e.target.value })}
          className="mt-1 min-h-[60px]"
          placeholder="Optional description..."
        />
      </div>

      <div>
        <Label className="text-xs uppercase block mb-2">Flag Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {flagTypes.map(type => (
            <Button
              key={type}
              type="button"
              variant={edited.type === type ? 'secondary' : 'outline'}
              onClick={() => setEdited({ ...edited, type })}
              className={cn(
                'justify-start',
                edited.type === type && flagTypeColors[type] + ' border-current'
              )}
            >
              {flagTypeLabels[type]}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {edited.type === FLAG_TYPE.DIALOGUE ? (
            <span className="text-muted-foreground">
              Temporary flag - resets after dialogue ends
            </span>
          ) : (
            <span className="text-foreground">Persistent flag - affects entire game</span>
          )}
        </p>
      </div>

      <div>
        <Label htmlFor="flag-category" className="text-xs uppercase">
          Category
        </Label>
        <Input
          id="flag-category"
          type="text"
          value={edited.category || ''}
          onChange={(e) => setEdited({ ...edited, category: e.target.value })}
          className="mt-1"
          placeholder="quests, items, stats, etc."
          list="categories"
        />
        <datalist id="categories">
          {categories.map(cat => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      </div>

      <div>
        <Label htmlFor="flag-value-type" className="text-xs uppercase">
          Value Type
        </Label>
        <Select
          value={edited.valueType || ''}
          onValueChange={(value) =>
            setEdited({
              ...edited,
              valueType: (value || undefined) as FlagValueType | undefined,
            })
          }
        >
          <SelectTrigger id="flag-value-type" className="mt-1">
            <SelectValue placeholder="Boolean (true/false)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Boolean (true/false)</SelectItem>
            <SelectItem value={FLAG_VALUE_TYPE.NUMBER}>Number</SelectItem>
            <SelectItem value={FLAG_VALUE_TYPE.STRING}>String</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {edited.valueType && (
        <div>
          <Label htmlFor="flag-default-value" className="text-xs uppercase">
            Default Value
          </Label>
          <Input
            id="flag-default-value"
            type={edited.valueType === FLAG_VALUE_TYPE.NUMBER ? 'number' : 'text'}
            value={edited.defaultValue?.toString() || ''}
            onChange={(e) => {
              let value: boolean | number | string = e.target.value;
              if (edited.valueType === FLAG_VALUE_TYPE.NUMBER) {
                value = parseFloat(value) || 0;
              } else if (edited.valueType === FLAG_VALUE_TYPE.BOOLEAN) {
                value = value === 'true';
              }
              setEdited({ ...edited, defaultValue: value });
            }}
            className="mt-1"
            placeholder={
              edited.valueType === FLAG_VALUE_TYPE.NUMBER
                ? '0'
                : edited.valueType === FLAG_VALUE_TYPE.STRING
                  ? '""'
                  : 'false'
            }
          />
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={() => onSave(edited)} className="flex-1" variant="default">
          Save Flag
        </Button>
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
      </div>
    </div>
  );
}
