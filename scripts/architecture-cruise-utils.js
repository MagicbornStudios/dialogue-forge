const fs = require('fs');
const path = require('path');

const DEFAULT_CANDIDATES = [
  'docs/architecture/dependency-cruiser.json',
  'dependency-cruiser.json',
  'dist/dependency-cruiser.json'
];

const resolveCruisePath = (inputPath) => {
  if (inputPath) {
    const resolved = path.resolve(process.cwd(), inputPath);
    return fs.existsSync(resolved) ? resolved : null;
  }

  for (const candidate of DEFAULT_CANDIDATES) {
    const resolved = path.resolve(process.cwd(), candidate);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }

  return null;
};

const loadCruiseResult = (inputPath) => {
  const resolvedPath = resolveCruisePath(inputPath);
  if (!resolvedPath) {
    throw new Error(
      `Dependency-cruiser JSON not found. Provide --input <path> or place the file at: ${DEFAULT_CANDIDATES.join(
        ', '
      )}.`
    );
  }

  const rawData = fs.readFileSync(resolvedPath, 'utf8');
  try {
    return {
      path: resolvedPath,
      data: JSON.parse(rawData)
    };
  } catch (error) {
    throw new Error(`Invalid JSON in ${resolvedPath}: ${error.message}`);
  }
};

const getViolations = (cruiseData) => (Array.isArray(cruiseData?.violations) ? cruiseData.violations : []);

const getModules = (cruiseData) => (Array.isArray(cruiseData?.modules) ? cruiseData.modules : []);

const getSummary = (cruiseData) => cruiseData?.summary ?? null;

module.exports = {
  DEFAULT_CANDIDATES,
  getModules,
  getSummary,
  getViolations,
  loadCruiseResult,
  resolveCruisePath
};
