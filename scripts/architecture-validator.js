#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  getSummary,
  getViolations,
  loadCruiseResult
} = require('./architecture-cruise-utils');

const SEVERITY_MAP = {
  error: 'high',
  warn: 'medium',
  info: 'low',
  ignore: 'low'
};

const DEFAULT_SEVERITY = 'low';

const getArgValue = (args, flag) => {
  const exactIndex = args.indexOf(flag);
  if (exactIndex !== -1 && args[exactIndex + 1]) {
    return args[exactIndex + 1];
  }

  const prefix = `${flag}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
};

const normalizeSeverity = (severity) => SEVERITY_MAP[severity] ?? DEFAULT_SEVERITY;

const formatViolationDescription = (violation) => {
  const ruleName = violation.rule?.name ?? 'unknown-rule';

  if (Array.isArray(violation.cycle) && violation.cycle.length > 0) {
    return `${ruleName}: circular dependency ${violation.cycle.join(' -> ')}`;
  }

  if (violation.from && violation.to) {
    return `${ruleName}: ${violation.from} -> ${violation.to}`;
  }

  if (violation.module && violation.to) {
    return `${ruleName}: ${violation.module} -> ${violation.to}`;
  }

  return `${ruleName}: dependency violation`;
};

class ArchitectureValidator {
  constructor(inputPath) {
    this.inputPath = inputPath;
    this.issues = [];
    this.summary = { passed: 0, failed: 0, warnings: 0 };
    this.sourcePath = null;
  }

  validate() {
    console.log('🔍 Validating Architecture Rules...
');

    try {
      const { data, path: sourcePath } = loadCruiseResult(this.inputPath);
      this.sourcePath = sourcePath;
      this.collectIssues(data);
      this.generateOutput(data);
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }
  }

  collectIssues(cruiseData) {
    const violations = getViolations(cruiseData);

    violations.forEach((violation) => {
      const rawSeverity = violation.rule?.severity ?? 'info';
      if (rawSeverity === 'ignore') {
        return;
      }

      const severity = normalizeSeverity(rawSeverity);
      this.addIssue(
        violation.rule?.name ?? 'dependency-rule',
        severity,
        formatViolationDescription(violation),
        [violation.from, violation.to].filter(Boolean)
      );
    });
  }

  addIssue(category, severity, description, files) {
    this.issues.push({
      category,
      severity,
      description,
      files: files.slice(0, 5),
      timestamp: new Date().toISOString()
    });

    if (severity === 'high' || severity === 'critical') {
      this.summary.failed += 1;
    } else if (severity === 'medium' || severity === 'low') {
      this.summary.warnings += 1;
    }
  }

  generateOutput(cruiseData) {
    console.log(`📂 Using dependency-cruiser output: ${this.sourcePath}`);
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('=====================================\n');

    if (this.issues.length === 0) {
      console.log('✅ All architecture rules passed!');
      console.log('🎉 Project is in excellent shape');
      this.saveValidationResults(cruiseData, true);
      process.exit(0);
    }

    const groupedIssues = this.groupIssuesBySeverity();
    this.printIssueGroup('CRITICAL', groupedIssues.critical, '🚨');
    this.printIssueGroup('HIGH', groupedIssues.high, '🔴');
    this.printIssueGroup('MEDIUM', groupedIssues.medium, '🟡');
    this.printIssueGroup('LOW', groupedIssues.low, '🟡');

    console.log(`\n📈 SUMMARY:`);
    console.log(`  ✅ Passed: ${this.summary.passed}`);
    console.log(`  🔴 Failed: ${this.summary.failed}`);
    console.log(`  ⚠️  Warnings: ${this.summary.warnings}`);

    console.log(`\n🔧 RECOMMENDATIONS:`);
    if (groupedIssues.critical.length > 0 || groupedIssues.high.length > 0) {
      console.log('   🚨 CRITICAL: Fix all architecture violations before merging');
      console.log('  📋 Re-run dependency-cruiser and validate again');
    } else if (groupedIssues.medium.length > 0) {
      console.log('  ⚠️ MEDIUM: Consider addressing warnings for better maintainability');
      console.log('  📋 Review dependency-cruiser output for details');
    } else {
      console.log('  ✅ Architecture validation passed - continue with current practices');
    }

    console.log('=====================================\n');

    this.saveValidationResults(cruiseData, false);

    const hasBlockingIssues = groupedIssues.critical.length > 0 || groupedIssues.high.length > 0;
    process.exit(hasBlockingIssues ? 1 : 0);
  }

  groupIssuesBySeverity() {
    return this.issues.reduce(
      (acc, issue) => {
        acc[issue.severity] = acc[issue.severity] || [];
        acc[issue.severity].push(issue);
        return acc;
      },
      { critical: [], high: [], medium: [], low: [] }
    );
  }

  printIssueGroup(label, issues, icon) {
    if (issues.length === 0) {
      return;
    }

    console.log(`${icon} ${issues.length} ${label} SEVERITY ISSUES`);
    issues.forEach((issue) => {
      console.log(`  ${icon} ${issue.description}`);
      if (issue.files.length > 0) {
        console.log(`     Files: ${issue.files.join(', ')}`);
      }
    });
  }

  saveValidationResults(cruiseData, passed) {
    const summary = getSummary(cruiseData);

    const validationResult = {
      timestamp: new Date().toISOString(),
      source: this.sourcePath,
      summary: {
        passed: passed ? 1 : 0,
        failed: this.summary.failed,
        warnings: this.summary.warnings,
        dependencyCruiser: summary ?? null
      },
      issues: this.issues,
      passed
    };

    try {
      const outputPath = path.join('docs', 'architecture', 'validation-results.json');
      fs.writeFileSync(outputPath, JSON.stringify(validationResult, null, 2));
      console.log(`📄 Validation results saved to ${outputPath}`);
    } catch (error) {
      console.error('❌ Error saving validation results:', error.message);
    }
  }
}

const args = process.argv.slice(2);
const inputPath = getArgValue(args, '--input') || getArgValue(args, '-i') || args[0];

const validator = new ArchitectureValidator(inputPath);
validator.validate();
