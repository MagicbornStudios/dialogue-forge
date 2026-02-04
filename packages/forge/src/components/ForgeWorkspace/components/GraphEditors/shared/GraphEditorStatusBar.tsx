"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, XCircle } from "lucide-react";

import { cn } from "@magicborn/shared/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@magicborn/shared/ui/collapsible";
import type { GraphValidationResult } from "@magicborn/forge/lib/graph-validation";

type GraphEditorStatusBarProps = {
  validation: GraphValidationResult | null;
  uncommittedChangeCount: number;
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

export function GraphEditorStatusBar({
  validation,
  uncommittedChangeCount,
  className,
}: GraphEditorStatusBarProps) {
  const errorCount = validation?.errors.length ?? 0;
  const warningCount = validation?.warnings.length ?? 0;
  const hasIssues = errorCount + warningCount > 0;

  const status: ValidationStatus = errorCount > 0 ? "error" : warningCount > 0 ? "warning" : "valid";
  const StatusIcon = STATUS_ICONS[status];

  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!hasIssues && open) {
      setOpen(false);
    }
  }, [hasIssues, open]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("relative", className)}>
      <div className="flex w-full items-center justify-center gap-2 text-xs text-df-text-secondary">
        <StatusIcon className={cn("h-4 w-4", STATUS_ICON_CLASSES[status])} />
        <span className="font-semibold text-df-text-primary">Validation</span>
        <span className="text-red-400">Errors: {errorCount}</span>
        <span className="text-yellow-400">Warnings: {warningCount}</span>
        <span className="text-df-text-muted">Changes: {uncommittedChangeCount}</span>
        {hasIssues && (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="ml-1 inline-flex items-center gap-1 rounded border border-df-control-border px-2 py-0.5 text-[11px] text-df-text-secondary transition hover:text-df-text-primary"
              aria-label={open ? "Collapse validation issues" : "Expand validation issues"}
            >
              {open ? "Hide" : "Show"} issues
              {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </CollapsibleTrigger>
        )}
      </div>
      {hasIssues && (
        <CollapsibleContent className="absolute left-0 top-full z-20 mt-2 w-[360px] rounded-md border border-df-control-border bg-df-editor-bg p-3 shadow-lg">
          {errorCount > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-400">Errors</p>
              <ul className="mt-2 space-y-1 text-xs text-df-text-secondary">
                {validation?.errors.map((issue, index) => (
                  <li key={`error-${issue.type}-${index}`} className="flex gap-2">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-red-400" />
                    <span>{issue.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {warningCount > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-yellow-400">Warnings</p>
              <ul className="mt-2 space-y-1 text-xs text-df-text-secondary">
                {validation?.warnings.map((issue, index) => (
                  <li key={`warning-${issue.type}-${index}`} className="flex gap-2">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-yellow-400" />
                    <span>{issue.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
