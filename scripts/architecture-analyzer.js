#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  getModules,
  getSummary,
  getViolations,
  loadCruiseResult
} = require('./architecture-cruise-utils');

console.log('🔍 Analyzing Dialogue Forge Architecture...\n');

const getArgValue = (args, flag) => {
  const exactIndex = args.indexOf(flag);
  if (exactIndex !== -1 && args[exactIndex + 1]) {
    return args[exactIndex + 1];
  }

  const prefix = `${flag}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
};

const normalizeSeverity = (severity) => severity ?? 'unknown';

class ArchitectureAnalyzer {
  constructor(inputPath) {
    this.inputPath = inputPath;
  }

  analyze() {
    try {
      const { data, path: sourcePath } = loadCruiseResult(this.inputPath);
      const report = this.buildReport(data, sourcePath);

      this.printSummary(report);
      this.saveDetailedReport(report);
      this.saveMarkdownReport(report);
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }
  }

  buildReport(cruiseData, sourcePath) {
    const modules = getModules(cruiseData);
    const violations = getViolations(cruiseData);
    const summary = getSummary(cruiseData);

    const totalDependencies = modules.reduce(
      (count, moduleEntry) => count + (moduleEntry.dependencies?.length ?? 0),
      0
    );

    const violationsBySeverity = violations.reduce((acc, violation) => {
      const severity = normalizeSeverity(violation.rule?.severity);
      acc[severity] = (acc[severity] ?? 0) + 1;
      return acc;
    }, {});

    const violationsByRule = violations.reduce((acc, violation) => {
      const ruleName = violation.rule?.name ?? 'unknown-rule';
      acc[ruleName] = acc[ruleName] ?? { count: 0, severity: normalizeSeverity(violation.rule?.severity) };
      acc[ruleName].count += 1;
      return acc;
    }, {});

    return {
      timestamp: new Date().toISOString(),
      source: sourcePath,
      metrics: {
        totalModules: modules.length,
        totalDependencies,
        totalViolations: violations.length,
        violationRate: modules.length > 0 ? ((modules.length - violations.length) / modules.length) * 100 : 0,
        dependencyCruiser: summary ?? null
      },
      violations: {
        bySeverity: violationsBySeverity,
        byRule: Object.entries(violationsByRule)
          .map(([rule, details]) => ({ rule, ...details }))
          .sort((a, b) => b.count - a.count)
      }
    };
  }

  printSummary(report) {
    console.log('📋 ARCHITECTURE ANALYSIS REPORT');
    console.log('=====================================\n');
    console.log(`📂 Source: ${report.source}`);
    console.log('\n📊 METRICS:');
    console.log(`  Total Modules: ${report.metrics.totalModules}`);
    console.log(`  Total Dependencies: ${report.metrics.totalDependencies}`);
    console.log(`  Violations: ${report.metrics.totalViolations}`);
    console.log(`  Violation Rate: ${report.metrics.violationRate.toFixed(2)}%`);

    if (report.violations.byRule.length > 0) {
      console.log('\n🚨 TOP VIOLATION RULES:');
      report.violations.byRule.slice(0, 5).forEach((rule, index) => {
        console.log(`  ${index + 1}. ${rule.rule} (${rule.count}) [${rule.severity}]`);
      });
    } else {
      console.log('\n✅ No violations reported by dependency-cruiser.');
    }

    console.log('\n📁 DETAILED REPORTS:');
    console.log('  JSON summary: docs/architecture/latest-analysis.json');
    console.log('  Markdown summary: docs/architecture/latest-analysis.md');
    console.log('=====================================\n');
  }

  saveDetailedReport(reportData) {
    try {
      const outputPath = path.join('docs', 'architecture', 'latest-analysis.json');
      fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2));
      console.log(`📄 Detailed report saved to ${outputPath}`);
    } catch (error) {
      console.error('❌ Error saving detailed report:', error.message);
    }
  }

  saveMarkdownReport(reportData) {
    const lines = [
      '# Architecture Analysis Report',
      '',
      `- Timestamp: ${reportData.timestamp}`,
      `- Source: ${reportData.source}`,
      '',
      '## Metrics',
      '',
      `- Total modules: ${reportData.metrics.totalModules}`,
      `- Total dependencies: ${reportData.metrics.totalDependencies}`,
      `- Total violations: ${reportData.metrics.totalViolations}`,
      `- Violation rate: ${reportData.metrics.violationRate.toFixed(2)}%`,
      '',
      '## Violations by Severity',
      ''
    ];

    const severityEntries = Object.entries(reportData.violations.bySeverity);
    if (severityEntries.length === 0) {
      lines.push('- None');
    } else {
      severityEntries.forEach(([severity, count]) => {
        lines.push(`- ${severity}: ${count}`);
      });
    }

    lines.push('', '## Top Rules', '');

    if (reportData.violations.byRule.length === 0) {
      lines.push('- None');
    } else {
      reportData.violations.byRule.slice(0, 10).forEach((rule) => {
        lines.push(`- ${rule.rule}: ${rule.count} (${rule.severity})`);
      });
    }

    try {
      const outputPath = path.join('docs', 'architecture', 'latest-analysis.md');
      fs.writeFileSync(outputPath, lines.join('\n'));
      console.log(`📝 Markdown report saved to ${outputPath}`);
    } catch (error) {
      console.error('❌ Error saving markdown report:', error.message);
    }
  }
}

const args = process.argv.slice(2);
const inputPath = getArgValue(args, '--input') || getArgValue(args, '-i') || args[0];

const analyzer = new ArchitectureAnalyzer(inputPath);
analyzer.analyze();
