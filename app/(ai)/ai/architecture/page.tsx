import { promises as fs } from 'fs';
import path from 'path';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

export const dynamic = 'force-static';

type RuleViolationGroup = {
  rule?: string;
  name?: string;
  ruleId?: string;
  ruleName?: string;
  violations?: unknown[];
  violationCount?: number;
};

type ArchitectureReport = {
  timestamp?: string;
  source?: string;
  metrics?: {
    totalModules?: number;
    totalDependencies?: number;
    totalViolations?: number;
    violationRate?: number;
  };
  violations?: {
    byRule?: RuleViolationGroup[];
  };
};

type SvgChart = {
  label: string;
  href: string;
};

type OpenCodeRangePosition = {
  line?: number;
  column?: number;
};

type OpenCodeFileRange = {
  path: string;
  start?: OpenCodeRangePosition;
  end?: OpenCodeRangePosition;
};

const chartHeight = 160;
const chartWidth = 640;

const getRuleLabel = (group: RuleViolationGroup) =>
  group.ruleName || group.ruleId || group.name || group.rule || 'Unknown rule';

const getViolationCount = (group: RuleViolationGroup) =>
  group.violationCount ?? group.violations?.length ?? 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value : undefined;

const getNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const buildOpenCodeUrl = (
  ruleId: string,
  violation: unknown,
  fileRanges: OpenCodeFileRange[]
) => {
  const params = new URLSearchParams();
  if (ruleId) {
    params.set('ruleId', ruleId);
  }
  if (violation !== undefined) {
    params.set('violation', JSON.stringify(violation));
  }
  if (fileRanges.length > 0) {
    params.set('fileRanges', JSON.stringify(fileRanges));
  }

  const query = params.toString();
  return query.length > 0 ? `/opencode?${query}` : '/opencode';
};

const extractFileRanges = (violation: unknown): OpenCodeFileRange[] => {
  if (!isRecord(violation)) {
    return [];
  }

  const segments = [violation.from, violation.to];
  const ranges = segments
    .map((segment) => {
      if (typeof segment === 'string') {
        return { path: segment };
      }

      if (!isRecord(segment)) {
        return null;
      }

      const path =
        getString(segment.path) ||
        getString(segment.file) ||
        getString(segment.filename) ||
        getString(segment.source) ||
        getString(segment.target);

      if (!path) {
        return null;
      }

      const location = isRecord(segment.location) ? segment.location : {};
      const startLocation =
        isRecord(location.start) && (location.start as Record<string, unknown>)
          ? (location.start as Record<string, unknown>)
          : {};
      const endLocation =
        isRecord(location.end) && (location.end as Record<string, unknown>)
          ? (location.end as Record<string, unknown>)
          : {};

      const startLine =
        getNumber(segment.startLine) ??
        getNumber(segment.line) ??
        getNumber(location.startLine) ??
        getNumber(startLocation.line) ??
        getNumber(location.line);
      const startColumn =
        getNumber(segment.startColumn) ??
        getNumber(segment.column) ??
        getNumber(location.startColumn) ??
        getNumber(startLocation.column) ??
        getNumber(location.column);
      const endLine =
        getNumber(segment.endLine) ??
        getNumber(location.endLine) ??
        getNumber(endLocation.line);
      const endColumn =
        getNumber(segment.endColumn) ??
        getNumber(location.endColumn) ??
        getNumber(endLocation.column);

      const start: OpenCodeRangePosition | undefined =
        startLine !== undefined || startColumn !== undefined
          ? {
              ...(startLine !== undefined && { line: startLine }),
              ...(startColumn !== undefined && { column: startColumn }),
            }
          : undefined;
      
      const end: OpenCodeRangePosition | undefined =
        endLine !== undefined || endColumn !== undefined
          ? {
              ...(endLine !== undefined && { line: endLine }),
              ...(endColumn !== undefined && { column: endColumn }),
            }
          : undefined;

      return {
        path,
        start,
        end,
      };
    })
    .filter((range): range is OpenCodeFileRange => Boolean(range));

  const uniqueRanges = new Map<string, OpenCodeFileRange>();
  ranges.forEach((range) => {
    const key = `${range.path}:${range.start?.line ?? ''}:${
      range.start?.column ?? ''
    }:${range.end?.line ?? ''}:${range.end?.column ?? ''}`;
    uniqueRanges.set(key, range);
  });

  return Array.from(uniqueRanges.values());
};

const buildViolationChart = (groups: RuleViolationGroup[]) => {
  if (groups.length === 0) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 320 120"
        className="h-40 w-full rounded-lg border border-dashed border-border bg-muted"
      >
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-muted-foreground text-sm"
        >
          No violations to chart
        </text>
      </svg>
    );
  }

  const maxCount = Math.max(...groups.map(getViolationCount), 1);
  const barWidth = chartWidth / groups.length;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="h-48 w-full rounded-lg border border-border bg-card"
      role="img"
      aria-label="Violations per rule"
    >
      {groups.map((group, index) => {
        const count = getViolationCount(group);
        const barHeight = (count / maxCount) * (chartHeight - 32);
        const x = index * barWidth + 12;
        const y = chartHeight - barHeight - 20;
        const label = getRuleLabel(group);

        return (
          <g key={`${label}-${index}`}>
            <rect
              x={x}
              y={y}
              width={Math.max(barWidth - 24, 12)}
              height={barHeight}
              rx={4}
              className="fill-primary"
            />
            <text
              x={x + (barWidth - 24) / 2}
              y={chartHeight - 4}
              textAnchor="middle"
              className="fill-muted-foreground text-xs"
            >
              {count}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const groupViolationsByRule = (report: ArchitectureReport) => {
  const groups = report.violations?.byRule ?? [];
  return groups.map((group) => ({
    ...group,
    violationCount: getViolationCount(group),
    ruleName: getRuleLabel(group),
  }));
};

const readReport = async () => {
  const reportPath = path.join(
    process.cwd(),
    'public',
    'architecture',
    'reports',
    'latest.json'
  );

  try {
    const fileContents = await fs.readFile(reportPath, 'utf-8');
    return JSON.parse(fileContents) as ArchitectureReport;
  } catch (error) {
    return {
      timestamp: undefined,
      source: undefined,
      metrics: undefined,
      violations: { byRule: [] },
      error: error instanceof Error ? error.message : 'Unable to read report.',
    } as ArchitectureReport & { error?: string };
  }
};

const findSvgCharts = async (): Promise<SvgChart[]> => {
  const baseDir = path.join(process.cwd(), 'public', 'architecture', 'reports');
  const charts: SvgChart[] = [];

  const collectSvgs = async (directory: string, prefix = '') => {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(directory, entry.name);
        const relativePath = path.join(prefix, entry.name);
        if (entry.isDirectory()) {
          await collectSvgs(fullPath, relativePath);
        } else if (entry.isFile() && entry.name.endsWith('.svg')) {
          charts.push({
            label: entry.name.replace(/\.svg$/, ''),
            href: `/architecture/reports/${relativePath}`,
          });
        }
      })
    );
  };

  try {
    await collectSvgs(baseDir);
  } catch {
    return [];
  }

  return charts;
};

export default async function ArchitectureReportPage() {
  const report = await readReport();
  const groupedViolations = groupViolationsByRule(report);
  const charts = await findSvgCharts();
  const hasViolations = groupedViolations.some(
    (group) => getViolationCount(group) > 0
  );

  return (
    <main className="min-h-screen bg-muted/40 px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            AI Architecture Report
          </p>
          <h1 className="text-3xl font-semibold">Latest dependency health</h1>
          <p className="text-sm text-muted-foreground">
            Generated from {report.source ?? 'unknown source'} on{' '}
            {report.timestamp ?? 'unknown date'}.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
                <CardDescription>Snapshot of the latest run.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Modules</span>
                  <Badge variant="secondary">
                    {report.metrics?.totalModules ?? '—'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Dependencies</span>
                  <Badge variant="secondary">
                    {report.metrics?.totalDependencies ?? '—'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Violations</span>
                  <Badge variant={hasViolations ? 'destructive' : 'secondary'}>
                    {report.metrics?.totalViolations ?? '—'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Violation rate</span>
                  <Badge variant="outline">
                    {report.metrics?.violationRate ?? '—'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Artifacts</CardTitle>
                <CardDescription>Available SVG reports.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {charts.length === 0 ? (
                  <p className="text-muted-foreground">
                    No SVG charts were found.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {charts.map((chart) => (
                      <li key={chart.href}>
                        <a
                          href={chart.href}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {chart.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Violations by rule</CardTitle>
                <CardDescription>
                  Review the rule groups below to spot recurring architectural
                  drift.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {groupedViolations.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-sm text-muted-foreground">
                    No rule groups were found in the report.
                  </div>
                ) : (
                  groupedViolations.map((group) => (
                    <div
                      key={getRuleLabel(group)}
                      className="rounded-lg border border-border/60 bg-background p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base font-semibold">
                            {getRuleLabel(group)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {getViolationCount(group)} violations
                          </p>
                        </div>
                        <Badge
                          variant={
                            getViolationCount(group) > 0
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {getViolationCount(group)}
                        </Badge>
                      </div>
                      {Array.isArray(group.violations) &&
                      group.violations.length > 0 ? (
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {group.violations.map((violation, index) => (
                            <li key={`${getRuleLabel(group)}-${index}`}>
                              <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                                <div className="flex-1">
                                  {typeof violation === 'string'
                                    ? violation
                                    : JSON.stringify(violation)}
                                </div>
                                <Button asChild size="sm" variant="outline">
                                  <a
                                    href={buildOpenCodeUrl(
                                      getRuleLabel(group),
                                      violation,
                                      extractFileRanges(violation)
                                    )}
                                  >
                                    Open in OpenCode
                                  </a>
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">
                          No violation details listed.
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SVG graphs</CardTitle>
                <CardDescription>
                  Visual overview of violations per rule and available report
                  artifacts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {buildViolationChart(
                  groupedViolations.filter(
                    (group) => getViolationCount(group) > 0
                  )
                )}
                {!hasViolations && (
                  <p className="text-sm text-muted-foreground">
                    No violations detected, so the chart is empty.
                  </p>
                )}
                {charts.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {charts.map((chart) => (
                      <figure
                        key={chart.href}
                        className="rounded-lg border border-border bg-background p-3"
                      >
                        <img
                          src={chart.href}
                          alt={`${chart.label} chart`}
                          className="h-auto w-full"
                        />
                        <figcaption className="mt-2 text-xs text-muted-foreground">
                          {chart.label}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
