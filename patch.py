import os
import glob

def patch_modal(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False

    if 'useFocusTrap' not in content and 'isOpen' in content and 'onClose' in content:
        content = content.replace("import { Button } from './Button';", "import { Button } from './Button';\nimport { useFocusTrap } from '../../hooks/useFocusTrap';")
        content = content.replace("import { Button } from './ui/Button';", "import { Button } from './ui/Button';\nimport { useFocusTrap } from '../../hooks/useFocusTrap';")
        content = content.replace("import { Button } from '../ui/Button';", "import { Button } from '../ui/Button';\nimport { useFocusTrap } from '../../hooks/useFocusTrap';")
        changed = True

    if 'useFocusTrap(isOpen' not in content and 'if (!isOpen)' in content:
        content = content.replace("if (!isOpen) return null;", "const containerRef = useFocusTrap(isOpen, { onEscape: onClose });\n\n    if (!isOpen) return null;")
        changed = True
        
    if 'ref={containerRef}' not in content:
        old_content = content
        content = content.replace('className="relative w-full max-w-sm bg-slate-900', 'ref={containerRef}\n                    role="dialog"\n                    aria-modal="true"\n                    className="relative w-full max-w-sm bg-slate-900')
        content = content.replace('className="relative w-full max-w-md bg-slate-900', 'ref={containerRef}\n                role="dialog"\n                aria-modal="true"\n                className="relative w-full max-w-md bg-slate-900')
        content = content.replace('className="relative w-full max-w-lg bg-slate-900', 'ref={containerRef}\n                role="dialog"\n                aria-modal="true"\n                className="relative w-full max-w-lg bg-slate-900')
        content = content.replace('className="relative w-full max-w-2xl bg-slate-900', 'ref={containerRef}\n                role="dialog"\n                aria-modal="true"\n                className="relative w-full max-w-2xl bg-slate-900')
        if old_content != content: changed = True

    if 'aria-labelledby' not in content and 'id="modal-title"' not in content:
        old_content = content
        content = content.replace('<h2 className="text-lg font-bold text-white">', '<h2 id="modal-title" className="text-lg font-bold text-white">')
        content = content.replace('<h2 className="text-xl font-bold text-white">', '<h2 id="modal-title" className="text-xl font-bold text-white">')
        content = content.replace('role="dialog"', 'role="dialog"\n                aria-labelledby="modal-title"')
        if old_content != content: changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {filepath}")

for filepath in glob.glob('src/components/**/*Modal*.tsx', recursive=True):
    # Ignore ConfirmModal as it already has useFocusTrap correctly
    if 'ConfirmModal' not in filepath and 'WelcomeModal' not in filepath:
        patch_modal(filepath)

print("done!")
