#!/usr/bin/env python3
"""
Fix 1: sitemap.xml — correct all URLs to include /atelier-maude/
Fix 2: Add defer to cursor.js and page-transitions.js on all pages
Fix 3: Add complete hreflang <link rel="alternate"> tags in <head> of all pages
"""

import os
import re

BASE = '/Users/audekaleta/atelier-maude'
SITE = 'https://ateliermaude.github.io/atelier-maude'

# FR slug → EN slug (relative paths from root)
FR_TO_EN = {
    'index.html': 'en/index.html',
    'manteaux.html': 'en/manteaux.html',
    'echarpes.html': 'en/echarpes.html',
    'ceintures.html': 'en/ceintures.html',
    'accessoires.html': 'en/accessoires.html',
    'yun-court.html': 'en/yun-court.html',
    'hua-long.html': 'en/hua-long.html',
    'yun-long.html': 'en/yun-long.html',
    'notre-histoire.html': 'en/notre-histoire.html',
    'notre-cachemire.html': 'en/notre-cachemire.html',
    'contact.html': 'en/contact.html',
    'journal.html': 'en/journal.html',
    'article-choisir-manteau.html': 'en/article-choisir-manteau.html',
    'article-entretien-cachemire.html': 'en/article-entretien-cachemire.html',
    'article-tendance-2026.html': 'en/article-tendance-2026.html',
    'article-ceinture.html': 'en/article-ceinture.html',
    'article-cachemire-mongolie.html': 'en/article-cachemire-mongolie.html',
    'article-porter-manteau-oversize.html': 'en/article-porter-manteau-oversize.html',
    'lookbook.html': 'en/lookbook.html',
    'guide-des-tailles.html': 'en/guide-des-tailles.html',
    'carte-cadeau.html': 'en/carte-cadeau.html',
    'promotions.html': 'en/promotions.html',
}

# Pages to skip for hreflang (not real pages)
SKIP = {'404.html'}


def hreflang_tags(fr_slug, en_slug=None):
    """Return the correct hreflang block for a FR page."""
    fr_url = f'{SITE}/{fr_slug}'
    lines = []
    lines.append(f'  <link rel="alternate" hreflang="fr" href="{fr_url}">')
    if en_slug:
        en_url = f'{SITE}/{en_slug}'
        lines.append(f'  <link rel="alternate" hreflang="en" href="{en_url}">')
    lines.append(f'  <link rel="alternate" hreflang="x-default" href="{fr_url}">')
    return '\n'.join(lines)


def hreflang_tags_en(fr_slug, en_slug):
    """Return the correct hreflang block for an EN page."""
    fr_url = f'{SITE}/{fr_slug}'
    en_url = f'{SITE}/{en_slug}'
    lines = [
        f'  <link rel="alternate" hreflang="fr" href="{fr_url}">',
        f'  <link rel="alternate" hreflang="en" href="{en_url}">',
        f'  <link rel="alternate" hreflang="x-default" href="{fr_url}">',
    ]
    return '\n'.join(lines)


def process_file(filepath, tags_block):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # -- Fix 2: add defer to cursor.js and page-transitions.js --
    for script in ('cursor.js', 'page-transitions.js', '../cursor.js', '../page-transitions.js'):
        # Only add defer if not already present
        pattern = f'src="{script}">'
        replacement = f'src="{script}" defer>'
        content = content.replace(pattern, replacement)

    # -- Fix 3: hreflang tags --
    # Remove any existing hreflang alternate links (to avoid duplication)
    content = re.sub(
        r'\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?',
        '\n',
        content
    )
    # Clean up double newlines that may have been left
    content = re.sub(r'\n{3,}', '\n\n', content)

    # Insert after <link rel="canonical">
    canonical_pattern = re.compile(r'(<link rel="canonical"[^>]*>)')
    if canonical_pattern.search(content):
        content = canonical_pattern.sub(
            r'\1\n' + tags_block,
            content,
            count=1
        )
    else:
        # Fallback: insert before </head>
        content = content.replace('</head>', tags_block + '\n</head>', 1)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


# ── Process FR root pages ──────────────────────────────────────────────────
changed = []

for filename in os.listdir(BASE):
    if not filename.endswith('.html'):
        continue
    if filename in SKIP:
        continue

    filepath = os.path.join(BASE, filename)
    slug = filename if filename != 'index.html' else 'index.html'

    if filename in FR_TO_EN:
        en_slug = FR_TO_EN[filename]
        tags = hreflang_tags(slug, en_slug)
    else:
        # No EN equivalent — fr + x-default only
        tags = hreflang_tags(slug)

    if process_file(filepath, tags):
        changed.append(filename)

# ── Process EN pages ───────────────────────────────────────────────────────
en_dir = os.path.join(BASE, 'en')
# Build reverse map: en slug → fr slug
en_to_fr = {v: k for k, v in FR_TO_EN.items()}

for filename in os.listdir(en_dir):
    if not filename.endswith('.html'):
        continue

    en_slug = f'en/{filename}'
    fr_slug = en_to_fr.get(en_slug)

    if fr_slug is None:
        print(f'  WARNING: no FR mapping for {en_slug}')
        continue

    filepath = os.path.join(en_dir, filename)
    tags = hreflang_tags_en(fr_slug, en_slug)

    if process_file(filepath, tags):
        changed.append(f'en/{filename}')

print(f'\nModified {len(changed)} files:')
for f in sorted(changed):
    print(f'  {f}')
