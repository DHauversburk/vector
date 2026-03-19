import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '..', 'src');

const hooks = ['useAuth', 'useDevice', 'useOnboarding', 'useTheme', 'useOffline'];
const contextMap = {
    'useAuth': 'AuthContext',
    'useDevice': 'DeviceContext',
    'useOnboarding': 'OnboardingContext',
    'useTheme': 'ThemeContext',
    'useOffline': 'OfflineContext'
};

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(srcDir, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    if (filePath.includes('hooks') && !filePath.endsWith('useSessionTimeout.ts')) return; // Avoid cyclic if we already split

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    hooks.forEach(hook => {
        const contextName = contextMap[hook];
        // Regex to find import { ..., hook, ... } from '.../contexts/contextName'
        // This is complex to do perfectly with regex, so I'll do a few common patterns.
        
        // Pattern 1: import { useAuth } from '../contexts/AuthContext'
        const p1 = new RegExp(`import\\s+\\{\\s*${hook}\\s*\\}\\s+from\\s+['"](.+)/contexts/${contextName}['"]`, 'g');
        if (content.match(p1)) {
            content = content.replace(p1, (match, p) => `import { ${hook} } from '${p}/hooks/${hook}'`);
            changed = true;
        }

        // Pattern 2: import { AuthProvider, useAuth } from '../contexts/AuthContext'
        const p2 = new RegExp(`import\\s+\\{(.+),\\s*${hook}\\s*\\}\\s+from\\s+['"](.+)/contexts/${contextName}['"]`, 'g');
        if (content.match(p2)) {
            content = content.replace(p2, (match, others, p) => {
                return `import { ${others.trim()} } from '${p}/contexts/${contextName}';\nimport { ${hook} } from '${p}/hooks/${hook}';`;
            });
            changed = true;
        }

        const p3 = new RegExp(`import\\s+\\{\\s*${hook},\\s*(.+)\\}\\s+from\\s+['"](.+)/contexts/${contextName}['"]`, 'g');
        if (content.match(p3)) {
            content = content.replace(p3, (match, others, p) => {
                return `import { ${others.trim()} } from '${p}/contexts/${contextName}';\nimport { ${hook} } from '${p}/hooks/${hook}';`;
            });
            changed = true;
        }
    });

    if (changed) {
        console.log(`Updating ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
});
