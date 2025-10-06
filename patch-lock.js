// patch-lock.js
// Usage: node patch-lock.js "<pkgName>" "<version>" "<resolvedUrl>"
// Example:
// node patch-lock.js "@aiyana-dev/legit-package" "1.0.0" "http://34.227.190.3:4873/@aiyana-dev/legit-package/-/legit-package-1.0.0.tgz"

const fs = require('fs');
const path = require('path');

if (process.argv.length < 5) {
  console.error('Usage: node patch-lock.js "<pkgName>" "<version>" "<resolvedUrl>"');
  process.exit(2);
}

const [ , , pkgName, version, resolvedUrl ] = process.argv;

const lockPath = path.resolve(process.cwd(), 'package-lock.json');
if (!fs.existsSync(lockPath)) {
  console.error('package-lock.json not found in repo root.');
  process.exit(3);
}

const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

// Support both lockfile v1 and v2-ish structures:
// - "packages" map (lockfile v2+): packages["node_modules/<pkg>"]
// - or "dependencies": dependencies["@scope/pkg"]
let modified = false;

// Try v2+ "packages"
if (lock.packages) {
  // find the package entry key like "node_modules/@aiyana-dev/legit-package"
  const key = Object.keys(lock.packages).find(k => k.endsWith(pkgName));
  if (key) {
    if (!lock.packages[key].resolved || lock.packages[key].resolved !== resolvedUrl) {
      lock.packages[key].resolved = resolvedUrl;
      modified = true;
    }
  }
}

// Try older "dependencies"
if (!modified && lock.dependencies && lock.dependencies[pkgName]) {
  if (!lock.dependencies[pkgName].resolved || lock.dependencies[pkgName].resolved !== resolvedUrl) {
    lock.dependencies[pkgName].resolved = resolvedUrl;
    modified = true;
  }
}

if (!modified) {
  console.error('Could not find package entry to patch. Check package-lock.json structure and package name.');
  process.exit(4);
}

fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n', 'utf8');
console.log('Patched package-lock.json resolved for', pkgName, '->', resolvedUrl);
process.exit(0);
