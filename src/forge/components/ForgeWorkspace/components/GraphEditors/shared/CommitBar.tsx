"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import type { GraphValidationResult } from "@/forge/lib/graph-validation";

type CommitBarProps = {
  validation: GraphValidationResult | null;
  uncommittedChangeCount: number;
  onCommit: () => void;
  onDiscard: () => void;
  isCommitting?: boolean;
  isDiscarding?: boolean;
  className?: string;
};

type ValidationStatus = "valid" | "warning" | "error";

const STATUS_ICONS: Record<ValidationStatus, typeof CheckCircle2> = {
  valid: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const STATUS_ICON_CLASSES: Record<ValidationStatus, string> = {
  valid: "text-emerald-400",
  warning: "text-yellow-400",
  error: "text-red-400",
};

const STATUS_LABELS: Record<ValidationStatus, string> = {
  valid: "Valid",
  warning: "Warnings",
  error: "Errors",
};

export function CommitBar({
  validation,
  uncommittedChangeCount,
  onCommit,
  onDiscard,
  isCommitting = false,
  isDiscarding = false,
  className,
}: CommitBarProps) {
  const errorCount = validation?.errors.length ?? 0;
  const warningCount = validation?.warnings.length ?? 0;
  const status: ValidationStatus = errorCount > 0 ? "error" : warningCount > 0 ? "warning" : "valid";
  const StatusIcon = STATUS_ICONS[status];
  const hasChanges = uncommittedChangeCount > 0;

  const commitDisabled = errorCount > 0 || !hasChanges || isCommitting;
  const discardDisabled = !hasChanges || isDiscarding;

  return (
    <div className={cn("flex items-center gap-3 text-xs text-df-text-secondary", className)}>
      <div className="flex items-center gap-2">
        <StatusIcon className={cn("h-4 w-4", STATUS_ICON_CLASSES[status])} />
        <span className="font-semibold text-df-text-primary">{STATUS_LABELS[status]}</span>
        <span className="text-df-text-muted">Changes: {uncommittedChangeCount}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onDiscard}
          disabled={discardDisabled}
        >
          Discard
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onCommit}
          disabled={commitDisabled}
        >
          Commit
        </Button>
      </div>
    </div>
  );
}
