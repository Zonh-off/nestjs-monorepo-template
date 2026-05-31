const fs = require('fs');
const path = require('path');

const newName = process.argv[2];
if (!newName) {
  console.error('❌ Error: Please provide a new project name.');
  console.log('Usage: node scripts/rename.js <new-name>');
  process.exit(1);
}

// Strip invalid characters to keep it kebab-case
const sanitizedNewName = newName
  .toLowerCase()
  .replace(/[^a-z0-9-_]/g, '-')
  .replace(/-+/g, '-');

const oldName = 'nestjs-monorepo-template';
const oldNameRegex = new RegExp(oldName, 'g');
const oldScope = '@' + oldName;
const newScope = '@' + sanitizedNewName;
const oldScopeRegex = new RegExp(oldScope, 'g');

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.turbo',
  'dist',
  '.next',
  'out',
  'coverage',
  'build'
]);

const IGNORED_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.pdf', '.zip', '.tar', '.gz'
]);

function renameInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (IGNORED_DIRS.has(file)) continue;
      renameInDir(fullPath);
    } else if (stat.isFile()) {
      const ext = path.extname(file).toLowerCase();
      if (IGNORED_EXTS.has(ext)) continue;
      if (file === 'rename.js') continue; // Skip the script itself

      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(oldName) || content.includes(oldScope)) {
          let updated = content.replace(oldScopeRegex, newScope);
          updated = updated.replace(oldNameRegex, sanitizedNewName);
          fs.writeFileSync(fullPath, updated, 'utf8');
          console.log(`✅ Updated: ${path.relative(process.cwd(), fullPath)}`);
        }
      } catch (e) {
        // Skip binary or unreadable files
      }
    }
  }
}

console.log(`🚀 Renaming project namespace: "${oldName}" -> "${sanitizedNewName}"...`);
renameInDir(process.cwd());
console.log('🎉 Project successfully renamed! Please run "pnpm install" to rebuild dependencies and lockfiles.');
