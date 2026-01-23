#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analyzing Dialogue Forge Architecture...\n');

class ArchitectureAnalyzer {
  constructor() {
    this.violations = {
      domainBoundary: [],
      typeSafety: [],
      circularDeps: [],
      deadCode: [],
      performance: [],
      security: []
    };
    this.metrics = {
      totalFiles: 0,
      violations: 0,
      coverage: 0
    };
  }

  analyze() {
    console.log('📊 Analyzing project structure...');
    this.analyzeProjectStructure();
    
    console.log('🚨 Checking domain boundaries...');
    this.checkDomainBoundaries();
    
    console.log('🔒 Checking type safety...');
    this.checkTypeSafety();
    
    console.log('🔄 Checking circular dependencies...');
    this.checkCircularDependencies();
    
    console.log('💀 Checking dead code...');
    this.checkDeadCode();
    
    console.log('⚡ Checking performance patterns...');
    this.checkPerformancePatterns();
    
    this.generateReport();
  }

  analyzeProjectStructure() {
    try {
      const srcFiles = execSync('find src -name "*.ts" -o -name "*.tsx"', { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean);
      
      this.metrics.totalFiles = srcFiles.length;
      
      // Analyze domain distribution
      const domains = ['forge', 'writer', 'video', 'ai', 'shared'];
      const domainCounts = {};
      
      domains.forEach(domain => {
        const count = srcFiles.filter(file => file.includes(`/src/${domain}/`)).length;
        domainCounts[domain] = count;
      });
      
      console.log(`📁 Domain Distribution:`);
      domains.forEach(domain => {
        console.log(`  ${domain}: ${domainCounts[domain]} files`);
      });
      
    } catch (error) {
      console.error('❌ Error analyzing project structure:', error.message);
    }
  }

  checkDomainBoundaries() {
    try {
      // Check for app/ imports
      const appImports = execSync(
        `grep -r "app/\\|@/app\\|@magicborn.*app\\|payload-types" src/ --include="*.ts,*.tsx" || true`,
        { encoding: 'utf8' }
      ).split('\n').filter(Boolean);
      
      if (appImports.length > 0) {
        this.violations.domainBoundary.push({
          type: 'app_import',
          severity: 'high',
          files: appImports.slice(0, 3),
          description: 'Source code importing from host app'
        });
      }
      
      // Check cross-domain imports
      const crossDomainPatterns = [
        { from: 'src/video', to: 'src/forge', pattern: 'video→forge' },
        { from: 'src/video', to: 'src/shared', pattern: 'video→shared' },
        { from: 'src/writer', to: 'src/forge', pattern: 'writer→forge' },
        { from: 'src/writer', to: 'src/shared', pattern: 'writer→shared' },
        { from: 'src/ai', to: 'src/forge', pattern: 'ai→forge' },
        { from: 'src/ai', to: 'src/shared', pattern: 'ai→shared' }
      ];
      
      crossDomainPatterns.forEach(({ from, to, pattern }) => {
        const imports = execSync(
          `grep -r "from ['\"]*${from}/['\"]" src/ --include="*.ts,*.tsx" || true`,
          { encoding: 'utf8' }
        ).split('\n').filter(Boolean);
        
        if (imports.length > 0) {
          this.violations.domainBoundary.push({
            type: 'cross_domain',
            severity: 'high',
            pattern,
            files: imports.slice(0, 3),
            description: `Cross-domain import: ${pattern}`
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Error checking domain boundaries:', error.message);
    }
  }

  checkTypeSafety() {
    try {
      // Check for string literals in type contexts
      const stringLiterals = execSync(
        `grep -rn "'npc'\\|'quest'\\|'player'\\|'conditional'" src/ --include="*.ts,*.tsx" || true`,
        { encoding: 'utf8' }
      ).split('\n').filter(Boolean);
      
      if (stringLiterals.length > 0) {
        this.violations.typeSafety.push({
          type: 'string_literal',
          severity: 'high',
          files: stringLiterals.slice(0, 5),
          description: 'String literals used instead of constants'
        });
      }
      
      // Check for 'any' types
      const anyTypes = execSync(
        'grep -rn ": any" src/ --include="*.ts,*.tsx" || true',
        { encoding: 'utf8' }
      ).split('\n').filter(Boolean);
      
      if (anyTypes.length > 0) {
        this.violations.typeSafety.push({
          type: 'any_type',
          severity: 'medium',
          files: anyTypes.slice(0, 3),
          description: 'Explicit any types used'
        });
      }
      
    } catch (error) {
      console.error('❌ Error checking type safety:', error.message);
    }
  }

  checkCircularDependencies() {
    try {
      const result = execSync(
        'npx madge --circular src/ 2>&1 || echo "No cycles found"',
        { encoding: 'utf8' }
      );
      
      if (result.includes('No circular dependency found')) {
        console.log('✅ No circular dependencies');
      } else {
        this.violations.circularDeps.push({
          type: 'circular',
          severity: 'high',
          description: 'Circular dependencies detected',
          details: result
        });
      }
      
    } catch (error) {
      console.error('❌ Error checking circular dependencies:', error.message);
    }
  }

  checkDeadCode() {
    try {
      // This would run knip, but for now we'll check for obvious patterns
      const unusedExports = execSync(
        'find src -name "index.ts" -exec grep -l "export.*from.*unused" {} \\;',
        { encoding: 'utf8' }
      ).split('\n').filter(Boolean);
      
      const todoComments = execSync(
        'grep -r "TODO\\|FIXME\\|XXX" src/ --include="*.ts,*.tsx" | wc -l',
        { encoding: 'utf8' }
      ).trim();
      
      if (parseInt(todoComments) > 0) {
        this.violations.deadCode.push({
          type: 'todo_comments',
          severity: 'medium',
          count: parseInt(todoComments),
          description: `${todoComments} TODO/FIXME comments found`
        });
      }
      
    } catch (error) {
      console.error('❌ Error checking dead code:', error.message);
    }
  }

  checkPerformancePatterns() {
    try {
      // Check for large files that might impact performance
      const largeFiles = execSync(
        'find src -name "*.ts" -o -name "*.tsx" -size +500k',
        { encoding: 'utf8' }
      ).split('\n').filter(Boolean);
      
      if (largeFiles.length > 0) {
        this.violations.performance.push({
          type: 'large_files',
          severity: 'medium',
          files: largeFiles.slice(0, 3),
          description: `${largeFiles.length} files over 500KB`
        });
      }
      
      // Check for deeply nested directories
      const deepDirs = execSync(
        'find src -type d -depth 5 | head -5',
        { encoding: 'utf8' }
      ).split('\n').filter(Boolean);
      
      if (deepDirs.length > 0) {
        this.violations.performance.push({
          type: 'deep_nesting',
          severity: 'low',
          details: deepDirs,
          description: `${deepDirs.length} deeply nested directories`
        });
      }
      
    } catch (error) {
      console.error('❌ Error checking performance patterns:', error.message);
    }
  }

  generateReport() {
    console.log('\n📋 ARCHITECTURE ANALYSIS REPORT');
    console.log('=====================================\n');
    
    // Summary metrics
    this.metrics.violations = Object.values(this.violations).reduce((sum, category) => sum + category.length, 0);
    
    console.log('📊 METRICS:');
    console.log(`  Total Files: ${this.metrics.totalFiles}`);
    console.log(`  Violations: ${this.metrics.violations}`);
    console.log(`  Violation Rate: ${((this.metrics.totalFiles - this.metrics.violations) / this.metrics.totalFiles * 100).toFixed(2)}%`);
    
    // Violations by category
    Object.entries(this.violations).forEach(([category, violations]) => {
      if (violations.length > 0) {
        console.log(`\n🚨 ${category.toUpperCase()} VIOLATIONS:`);
        violations.forEach((violation, index) => {
          console.log(`  ${index + 1}. [${violation.severity.toUpperCase()}] ${violation.type}`);
          console.log(`     Files: ${violation.files.slice(0, 2).join(', ')}`);
          console.log(`     Description: ${violation.description}`);
          if (violation.details) {
            console.log(`     Details: ${violation.details}`);
          }
        });
      }
    });
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (this.metrics.violations > 0) {
      console.log('  🔴 CRITICAL ISSUES FOUND - Address immediately before merging');
      console.log('  🟡 Schedule architecture cleanup sprint');
      console.log('  📋 Run: npm run arch:fix');
    } else {
      console.log('  ✅ Architecture is in good shape');
      console.log('  🔄 Continue monitoring with: npm run arch:check');
    }
    
    console.log('\n📁 DETAILED REPORTS:');
    console.log('  Full violation details: npm run arch:report');
    console.log('  Visual dependency graph: npm run graph:deps');
    console.log('  CI pipeline: npm run arch:ci');
    console.log('=====================================\n');
    
    // Save detailed report
    this.saveDetailedReport();
  }

  saveDetailedReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      violations: this.violations,
      recommendations: this.generateRecommendations()
    };
    
    try {
      fs.writeFileSync('docs/architecture/latest-analysis.json', JSON.stringify(reportData, null, 2));
      console.log('📄 Detailed report saved to docs/architecture/latest-analysis.json');
    } catch (error) {
      console.error('❌ Error saving detailed report:', error.message);
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Domain boundary recommendations
    if (this.violations.domainBoundary.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'domain_boundaries',
        title: 'Fix Domain Boundary Violations',
        description: 'Eliminate cross-domain imports and app/ imports',
        actions: [
          'Move shared types to src/shared/types/',
          'Remove all imports from app/ directory',
          'Use domain entrypoints for cross-domain communication'
        ]
      });
    }
    
    // Type safety recommendations
    if (this.violations.typeSafety.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'type_safety',
        title: 'Implement Type Safety Best Practices',
        description: 'Replace string literals with constants, eliminate any types',
        actions: [
          'Use NODE_TYPE, FLAG_TYPE constants instead of strings',
          'Add type guards for runtime type checking',
          'Enable strict TypeScript ESLint rules'
        ]
      });
    }
    
    return recommendations;
  }
}

// Run the analysis
const analyzer = new ArchitectureAnalyzer();
analyzer.analyze();