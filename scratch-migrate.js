import fs from 'fs';
import path from 'path';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace const { x, y } = require('z');
  content = content.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*require\((['"])(.*?)\2\);/g, (match, vars, q, modulePath) => {
    if (modulePath.startsWith('.')) modulePath += '.js';
    return `import { ${vars} } from '${modulePath}';`;
  });

  // Replace const x = require('z');
  content = content.replace(/const\s+([A-Za-z0-9_]+)\s*=\s*require\((['"])(.*?)\2\);/g, (match, varName, q, modulePath) => {
    if (modulePath.startsWith('.')) modulePath += '.js';
    return `import ${varName} from '${modulePath}';`;
  });

  // Replace module.exports = ...
  content = content.replace(/module\.exports\s*=\s*/g, 'export default ');

  // Replace exports.x = ...
  content = content.replace(/exports\.([A-Za-z0-9_]+)\s*=\s*/g, 'export const $1 = ');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed: ${filePath}`);
}

function traverseDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.js') && fullPath !== '/srv/projects/external/leadms-backend/src/server.js') {
      processFile(fullPath);
    }
  });
}

traverseDir('/srv/projects/external/leadms-backend/src');
