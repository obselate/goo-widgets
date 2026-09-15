#!/usr/bin/env python3
"""Exercise actual gallery pages in a built consumer, one native process per page.

Run inside scripts/with-isolated-wayland.py. Set GOO_CLI to a matching Goo CLI.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
PAGES = ['Combo box', 'Split pane', 'Window chrome', 'Disclosure',
         'Media transport', 'Data grid', 'Tree view', 'Menu']
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, default=ROOT / 'artifacts/gallery-feedback')
parser.add_argument('pages', nargs='*')
args = parser.parse_args()
if any(page not in PAGES for page in args.pages):
    parser.error('Supported pages: ' + ', '.join(PAGES))
output = args.output.resolve()
output.mkdir(parents=True, exist_ok=True)
rows = []
for page in args.pages or PAGES:
    env = dict(os.environ, GOO_WIDGETS_GALLERY_FEEDBACK='1',
               GOO_WIDGETS_GALLERY_FEEDBACK_PAGE=page, GOO_WIDGETS_PROOF_DIR=str(output))
    log = output / (page.lower().replace(' ', '-') + '.log')
    with log.open('w') as stream:
        try:
            result = subprocess.run(
                ['dotnet', str(ROOT / 'tests/Goo.Widgets.Consumer/bin/Release/net10.0/Goo.Widgets.Consumer.dll')],
                cwd=ROOT, env=env, stdout=stream, stderr=subprocess.STDOUT, timeout=90)
            code = result.returncode
        except subprocess.TimeoutExpired:
            stream.write('\nFAIL: native gallery case exceeded 90 seconds\n')
            code = 124
    rows.append({'page': page, 'exit_code': code, 'log': str(log)})
    print(page, 'PASS' if code == 0 else 'FAIL', flush=True)
    print(log.read_text()[-4000:], flush=True)
    (output / 'results.json').write_text(json.dumps(rows, indent=2) + '\n')
raise SystemExit(0 if all(row['exit_code'] == 0 for row in rows) else 1)
