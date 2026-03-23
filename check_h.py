import os, glob, re

for filepath in glob.glob('src/pages/**/*.tsx', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    headings = re.findall(r'<(h[1-6])', content)
    if headings:
        print(f'\n--- {filepath} ---')
        print(' => '.join(headings))
        
        # Check for multiple h1s or missing h1
        h1_count = headings.count('h1')
        if h1_count == 0:
            print('  CRITICAL: Missing <h1>')
        elif h1_count > 1:
            print(f'  CRITICAL: Multiple <h1> tags found: {h1_count}')
            
        # Check for skipped levels
        for i in range(len(headings) - 1):
            curr = int(headings[i][1])
            next_h = int(headings[i+1][1])
            if next_h > curr + 1:
                print(f'  WARNING: Skipped level from h{curr} to h{next_h}')
