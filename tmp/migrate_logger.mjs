/**
 * Migrate console.* calls to logger utility across production source files.
 * 
 * Skips: scripts/, tests, logger.ts itself, main.tsx (debug bootstrap)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '..', 'src');

const SKIP_DIRS = ['scripts', 'node_modules', '__tests__'];
const SKIP_FILES = ['logger.ts', 'main.tsx'];

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!SKIP_DIRS.includes(f)) walkDir(fullPath, callback);
        } else {
            callback(fullPath);
        }
    });
}

let totalReplaced = 0;
let filesChanged = 0;

walkDir(srcDir, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    if (filePath.includes('.test.') || filePath.includes('.spec.')) return;
    if (SKIP_FILES.some(s => filePath.endsWith(s))) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let count = 0;

    // Determine module name from filename
    const basename = path.basename(filePath).replace(/\.(tsx?|jsx?)$/, '');

    // Check if file has console.* calls
    if (!content.match(/console\.(log|warn|error|info)\(/)) return;

    // Add logger import if not present
    const hasLoggerImport = content.includes("from '../lib/logger'") || 
                            content.includes("from '../../lib/logger'") ||
                            content.includes("from './logger'") ||
                            content.includes("from '../logger'");

    if (!hasLoggerImport) {
        // Calculate relative path from file to src/lib/logger
        const fileDir = path.dirname(filePath);
        let relPath = path.relative(fileDir, path.join(srcDir, 'lib', 'logger')).replace(/\\/g, '/');
        if (!relPath.startsWith('.')) relPath = './' + relPath;
        
        // Find a good insertion point (after last import)
        const importRegex = /^import\s+.+$/gm;
        let lastMatch = null;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            lastMatch = match;
        }

        if (lastMatch) {
            const insertPos = lastMatch.index + lastMatch[0].length;
            content = content.slice(0, insertPos) + `\nimport { logger } from '${relPath}';` + content.slice(insertPos);
        } else {
            content = `import { logger } from '${relPath}';\n` + content;
        }
    }

    // Replace console.log('[TAG] message', ...args) → logger.debug('Tag', 'message', ...args)
    content = content.replace(
        /console\.log\(\s*(['"`])\[([^\]]+)\]\s*(.*?)\1((?:\s*,\s*[^;]+)*)\s*\)\s*;/g,
        (_match, _q, tag, msg, args) => {
            count++;
            const cleanMsg = msg.trim();
            const cleanArgs = args ? args.trim() : '';
            return `logger.debug('${tag}', '${cleanMsg}'${cleanArgs ? `, ${cleanArgs.replace(/^,\s*/, '')}` : ''});`;
        }
    );

    // Replace remaining console.log('message', ...) → logger.debug(module, 'message', ...)
    content = content.replace(
        /console\.log\((.*?)\)\s*;/g,
        (_match, args) => {
            if (args.includes('logger.')) return _match; // skip already-converted
            count++;
            return `logger.debug('${basename}', ${args});`;
        }
    );

    // Replace console.error → logger.error
    content = content.replace(
        /console\.error\(\s*(['"`])\[([^\]]+)\]\s*(.*?)\1((?:\s*,\s*[^;]+)*)\s*\)\s*;/g,
        (_match, _q, tag, msg, args) => {
            count++;
            const cleanMsg = msg.trim();
            const cleanArgs = args ? args.trim() : '';
            return `logger.error('${tag}', '${cleanMsg}'${cleanArgs ? `, ${cleanArgs.replace(/^,\s*/, '')}` : ''});`;
        }
    );

    content = content.replace(
        /console\.error\((.*?)\)\s*;/g,
        (_match, args) => {
            if (args.includes('logger.')) return _match;
            count++;
            return `logger.error('${basename}', ${args});`;
        }
    );

    // Replace console.warn → logger.warn
    content = content.replace(
        /console\.warn\((.*?)\)\s*;/g,
        (_match, args) => {
            if (args.includes('logger.')) return _match;
            count++;
            return `logger.warn('${basename}', ${args});`;
        }
    );

    if (count > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        totalReplaced += count;
        filesChanged++;
        console.log(`  ✓ ${path.relative(srcDir, filePath)} → ${count} replacements`);
    }
});

console.log(`\n✅ Done: ${totalReplaced} console.* calls replaced across ${filesChanged} files.`);
