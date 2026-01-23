#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ArchitectureValidator {
  constructor() {
    this.rules = {
      // Domain boundary rules
      noAppImports: {
        pattern: /app\/|@\/app|@magicborn.*app|payload-types/,
        message: 'Source code cannot import from host app',
        severity: 'high'
      },
      noCrossDomainImports: [
        { from: 'video', to: 'forge', forbidden: true },
        { from: 'video', to: 'shared', forbidden: false },
        { from: 'writer', to: 'forge', forbidden: true },
        { from: 'writer', to: 'shared', forbidden: false },
        { from: 'ai', to: 'forge', forbidden: true },
        { from: 'ai', to: 'shared', forbidden: false }
      ],
      // Type safety rules
      noStringLiterals: {
        patterns: [/('npc'|'quest'|'player'|'conditional')/, /: any(?![A-Z])/],
        message: 'Use constants instead of string literals, avoid explicit any types',
        severity: 'high'
      },
      // Performance rules
      noLargeFiles: { size: 500 * 1024, unit: 'bytes' },
      noDeepNesting: { maxDepth: 5 }
    };
    
    this.issues = [];
    this.summary = { passed: 0, failed: 0, warnings: 0 };
  }

  validate() {
    console.log('🔍 Validating Architecture Rules...\n');
    
    this.validateDomainBoundaries();
    this.validateTypeSafety();
    this.validatePerformance();
    this.validateSecurity();
    
    this.generateOutput();
  }

  validateDomainBoundaries() {
    console.log('🏗️ Validating domain boundaries...');
    
    try {
      // Check app/ imports
      const appImportFiles = this.findFilesMatching(this.rules.noAppImports.pattern);
      if (appImportFiles.length > 0) {
        this.addIssue('domain_boundary', 'high', 'App imports found', appImportFiles);
      }
      
      // Check cross-domain imports
      this.rules.noCrossDomainImports.forEach(rule => {
        const violatingFiles = this.findCrossDomainImports(rule.from, rule.to, rule.forbidden);
        if (violatingFiles.length > 0) {
          const description = `Cross-domain import from ${rule.from} to ${rule.to}`;
          this.addIssue('domain_boundary', rule.severity, description, violatingFiles);
        }
      });
      
    } catch (error) {
      console.error('❌ Error validating domain boundaries:', error.message);
    }
  }

  validateTypeSafety() {
    console.log('🔒 Validating type safety...');
    
    try {
      // Check string literals
      const stringLiteralFiles = this.findFilesMatching(this.rules.noStringLiterals.patterns[0]);
      const anyTypeFiles = this.findFilesMatching(this.rules.noStringLiterals.patterns[1]);
      
      if (stringLiteralFiles.length > 0) {
        this.addIssue('type_safety', 'high', 'String literals found', stringLiteralFiles);
      }
      
      if (anyTypeFiles.length > 0) {
        this.addIssue('type_safety', 'medium', 'Explicit any types found', anyTypeFiles);
      }
      
    } catch (error) {
      console.error('❌ Error validating type safety:', error.message);
    }
  }

  validatePerformance() {
    console.log('⚡ Validating performance patterns...');
    
    try {
      // Check large files
      const largeFiles = this.findFilesWithSizeGreaterThan(this.rules.noLargeFiles.size);
      if (largeFiles.length > 0) {
        this.addIssue('performance', 'medium', 'Large files found', largeFiles);
      }
      
      // Check deep nesting
      const deepDirectories = this.findDeepDirectories(this.rules.noDeepNesting.maxDepth);
      if (deepDirectories.length > 0) {
        this.addIssue('performance', 'low', 'Deep nesting found', deepDirectories);
      }
      
    } catch (error) {
      console.error('❌ Error validating performance:', error.message);
    }
  }

  validateSecurity() {
    console.log('🔒 Validating security patterns...');
    
    try {
      // Check for hardcoded secrets or sensitive data
      const secretPatterns = [
        /password\s*=\s*['"][^]/i,
        /api[_-]?key\s*=\s*['"][^]/i,
        /secret\s*=\s*['"][^]/i,
        /token\s*=\s*['"][^]/i
      ];
      
      secretPatterns.forEach(pattern => {
        const matchingFiles = this.findFilesMatching(pattern);
        if (matchingFiles.length > 0) {
          this.addIssue('security', 'critical', 'Potential secrets found', matchingFiles);
        }
      });
      
    } catch (error) {
      console.error('❌ Error validating security:', error.message);
    }
  }

  findFilesMatching(pattern) {
    try {
      return execSync(
        `grep -r "${pattern}" src/ --include="*.ts,*.tsx" -l`,
        { encoding: 'utf8' }
      ).split('\n').filter(Boolean);
    } catch (error) {
      console.error('❌ Error finding files:', error.message);
      return [];
    }
  }

  findFilesWithSizeGreaterThan(sizeInBytes) {
    try {
      return execSync(
        `find src -name "*.ts" -o -name "*.tsx" -size +${sizeInBytes}`,
        { encoding: 'utf8' }
      ).split('\n').filter(Boolean);
    } catch (error) {
      console.error('❌ Error finding large files:', error.message);
      return [];
    }
  }

  findCrossDomainImports(fromDomain, toDomain, forbidden) {
    try {
      const pattern = `from ['"]*${fromDomain}/['"]`;
      const imports = execSync(
        `grep -r "${pattern}" src/ --include="*.ts,*.tsx" -l`,
        { encoding: 'utf8' }
      ).split('\n').filter(Boolean);
      
      return imports.filter(file => {
        // Check if it imports from forbidden domain
        const fileContent = fs.readFileSync(file, 'utf8');
        const toDomainPattern = new RegExp(`from ['"]*${toDomain}/['"]`, 'g');
        const allowedPattern = new RegExp(`from ['"]*shared/['"]`, 'g');
        
        return toDomainPattern.test(fileContent) && (!allowedPattern.test(fileContent)) && forbidden;
      });
    } catch (error) {
      console.error('❌ Error checking cross-domain imports:', error.message);
      return [];
    }
  }

  findDeepDirectories(maxDepth) {
    try {
      return execSync(
        `find src -type d -depth ${maxDepth}`,
        { encoding: 'utf8' }
      ).split('\n').filter(Boolean);
    } catch (error) {
      console.error('❌ Error finding deep directories:', error.message);
      return [];
    }
  }

  addIssue(category, severity, description, files) {
    this.issues.push({
      category,
      severity,
      description,
      files: files.slice(0, 5), // Limit file list
      timestamp: new Date().toISOString()
    });
    
    // Update summary counters
    if (severity === 'critical' || severity === 'high') {
      this.summary.failed++;
    } else if (severity === 'medium' || severity === 'low') {
      this.summary.warnings++;
    } else {
      this.summary.passed++;
    }
  }

  generateOutput() {
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('=====================================\n');
    
    if (this.issues.length === 0) {
      console.log('✅ All architecture rules passed!');
      console.log('🎉 Project is in excellent shape');
      process.exit(0);
    }
    
    // Group issues by severity
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const highIssues = this.issues.filter(i => i.severity === 'high');
    const mediumIssues = this.issues.filter(i => i.severity === 'medium');
    const lowIssues = this.issues.filter(i => i.severity === 'low');
    
    if (criticalIssues.length > 0) {
      console.log(`🚨 ${criticalIssues.length} CRITICAL ISSUES FOUND`);
      console.log('These must be fixed immediately:');
      criticalIssues.forEach(issue => {
        console.log(`  ❌ ${issue.description}`);
        console.log(`     Files: ${issue.files.join(', ')}`);
      });
    }
    
    if (highIssues.length > 0) {
      console.log(`🔴 ${highIssues.length} HIGH SEVERITY ISSUES`);
      highIssues.forEach(issue => {
        console.log(`  🔴 ${issue.description}`);
        console.log(`     Files: ${issue.files.join(', ')}`);
      });
    }
    
    if (mediumIssues.length > 0) {
      console.log(`🟡 ${mediumIssues.length} MEDIUM SEVERITY ISSUES`);
      mediumIssues.forEach(issue => {
        console.log(`  ⚠️ ${issue.description}`);
        console.log(`     Files: ${issue.files.join(', ')}`);
      });
    }
    
    if (lowIssues.length > 0) {
      console.log(`🟡 ${lowIssues.length} LOW SEVERITY ISSUES`);
      lowIssues.forEach(issue => {
        console.log(`  💡 ${issue.description}`);
        console.log(`     Files: ${issue.files.join(', ')}`);
      });
    }
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`  ✅ Passed: ${this.summary.passed}`);
    console.log(`  🔴 Failed: ${this.summary.failed}`);
    console.log(`  ⚠️  Warnings: ${this.summary.warnings}`);
    
    console.log(`\n🔧 RECOMMENDATIONS:`);
    if (criticalIssues.length > 0 || highIssues.length > 0) {
      console.log('   🚨 CRITICAL: Fix all architecture violations before merging');
      console.log('  📋 Run: npm run arch:fix');
      console.log('  🔄 Re-validate with: npm run arch:check');
    } else if (mediumIssues.length > 0) {
      console.log('  ⚠️ MEDIUM: Consider addressing warnings for better maintainability');
      console.log('  📋 Run: npm run arch:report for details');
    } else {
      console.log('  ✅ Architecture validation passed - continue with current practices');
    }
    
    console.log('=====================================\n');
    
    // Save validation results
    this.saveValidationResults();
    
    // Set exit code based on critical/high issues
    if (criticalIssues.length > 0 || highIssues.length > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }

  saveValidationResults() {
    const validationResult = {
      timestamp: new Date().toISOString(),
      summary: this.summary,
      issues: this.issues,
      rules: this.rules,
      passed: this.issues.length === 0
    };
    
    try {
      fs.writeFileSync('docs/architecture/validation-results.json', JSON.stringify(validationResult, null, 2));
      console.log('📄 Validation results saved to docs/architecture/validation-results.json');
    } catch (error) {
      console.error('❌ Error saving validation results:', error.message);
    }
  }
}

// Run the validation
const validator = new ArchitectureValidator();
validator.validate();