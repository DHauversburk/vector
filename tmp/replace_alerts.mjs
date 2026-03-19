import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '..', 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(srcDir, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('alert(')) return;

    console.log(`Processing ${filePath}`);
    
    // Add import if missing
    if (!content.includes("from 'sonner'") && !content.includes('from "sonner"')) {
        const importMatch = content.match(/import\s+.+from\s+['"]react['"];?/);
        if (importMatch) {
            content = content.replace(importMatch[0], `${importMatch[0]}\nimport { toast } from 'sonner';`);
        } else {
            // Prepend if no react import (unlikely in .tsx)
            content = `import { toast } from 'sonner';\n` + content;
        }
    }

    // Replace alert() logic
    // We'll use a regex that captures the message.
    // We'll try to guess if it's an error based on being inside a catch block or containing "failed/error".
    
    // Simple heuristic: if inside catch(err) { ... alert(...) ... }, use toast.error
    // This is hard with regex, so I'll do a simpler replacement first and then refine.
    
    content = content.replace(/alert\((['"`])(.*?)(\1)\);?/g, (match, quote, msg) => {
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('failed') || lowerMsg.includes('error') || lowerMsg.includes('wipe failed')) {
            return `toast.error(${quote}${msg}${quote});`;
        }
        return `toast.success(${quote}${msg}${quote});`;
    });

    // Special case for dynamic messages like alert('Error: ' + err.message)
    content = content.replace(/alert\((.*?)\);?/g, (match, msg) => {
        if (msg.startsWith('toast.')) return match; // skip already replaced
        if (msg.toLowerCase().includes('err') || msg.toLowerCase().includes('fail')) {
            return `toast.error(${msg});`;
        }
        return `toast.info(${msg});`;
    });

    fs.writeFileSync(filePath, content, 'utf8');
});
