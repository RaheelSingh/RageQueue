#!/usr/bin/env python3
"""Prepare a one-file itch.io HTML5 ZIP pointing at the Netlify leaderboard.

Usage: python prepare_itch.py https://your-project.netlify.app
Creates dist/RageQueue_itch_v3.2.zip. Does not change the source index.html.
"""
import json
import sys
from pathlib import Path
from urllib.parse import urlsplit
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "index.html"
DEST = ROOT / "dist" / "RageQueue_itch_v3.2.zip"
OLD = "const NETLIFY_SITE='https://YOUR-SITE.netlify.app';"

def main():
    if len(sys.argv) != 2:
        sys.exit('Usage: python prepare_itch.py https://YOUR-SITE.netlify.app')
    url = sys.argv[1].strip().rstrip('/')
    parts = urlsplit(url)
    if parts.scheme != 'https' or not parts.netloc or parts.username or parts.password or parts.path or parts.query or parts.fragment:
        sys.exit('Enter only the complete HTTPS site origin, e.g. https://my-game.netlify.app')
    html = SOURCE.read_text(encoding='utf-8')
    if html.count(OLD) != 1:
        sys.exit('Could not find exactly one Netlify URL setting in index.html. No ZIP was written.')
    html = html.replace(OLD, 'const NETLIFY_SITE=' + json.dumps(url) + ';')
    DEST.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(DEST, 'w', ZIP_DEFLATED, compresslevel=9) as z:
        z.writestr('index.html', html)
    print(f'Prepared itch.io HTML5 ZIP: {DEST}\nLeaderboard API: {url}/api/scores?daily=1')

if __name__ == '__main__':
    main()
