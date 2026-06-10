#!/usr/bin/env python3
"""
Fix 1: JSON-LD Organization on index.html + en/index.html
        Fix Article JSON-LD on all article pages (image URL, publisher logo)
Fix 2: Contrast — --muted:#8A7B6F → --muted:#74665B (4.88:1 on --cream, WCAG AA)
Fix 3: Font loading — convert blocking <link rel="stylesheet"> Google Fonts to
       async preload pattern on all pages that don't already use it
"""

import os, re, json

BASE = '/Users/audekaleta/atelier-maude'

SITE = 'https://ateliermaude.github.io/atelier-maude'
INSTAGRAM = 'https://instagram.com/ateliermaude'
LOGO_URL = f'{SITE}/hero.webp'

# ── Fix 1a: Organization + WebSite JSON-LD ─────────────────────────────────

ORG_SCHEMA = '''\
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Atelier MAUDÉ",
  "url": "https://ateliermaude.github.io/atelier-maude/",
  "logo": {
    "@type": "ImageObject",
    "url": "https://ateliermaude.github.io/atelier-maude/hero.webp",
    "width": 1024,
    "height": 1536
  },
  "sameAs": ["https://instagram.com/ateliermaude"]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Atelier MAUDÉ",
  "url": "https://ateliermaude.github.io/atelier-maude/"
}
</script>'''


def add_org_schema(content):
    if '"@type": "Organization"' in content:
        return content  # already has org schema
    content = content.replace('</head>', ORG_SCHEMA + '\n</head>', 1)
    return content


# ── Fix 1b: Article JSON-LD — fix image URL + add publisher logo ───────────

PUBLISHER_LOGO = {
    "@type": "ImageObject",
    "url": "https://ateliermaude.github.io/atelier-maude/hero.webp",
    "width": 1024,
    "height": 1536
}


def fix_article_jsonld(content, filepath):
    """Fix image URL and add publisher logo in Article JSON-LD."""
    script_pattern = re.compile(
        r'(<script type="application/ld\+json">)(.*?)(</script>)',
        re.DOTALL
    )
    changed = False

    def patch_script(m):
        nonlocal changed
        raw = m.group(2)
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return m.group(0)

        if data.get('@type') != 'Article':
            return m.group(0)

        modified = False

        # Fix image URL: add /atelier-maude/ if missing
        img = data.get('image', '')
        if img and '/atelier-maude/' not in img and 'ateliermaude.github.io' in img:
            # Extract the og:image from the page as the correct URL
            og_match = re.search(
                r'<meta property="og:image" content="([^"]+)"', content
            )
            if og_match:
                data['image'] = og_match.group(1)
            else:
                data['image'] = img.replace(
                    'https://ateliermaude.github.io/',
                    'https://ateliermaude.github.io/atelier-maude/'
                )
            modified = True

        # Add publisher logo if missing
        publisher = data.get('publisher', {})
        if publisher and 'logo' not in publisher:
            publisher['logo'] = PUBLISHER_LOGO
            data['publisher'] = publisher
            modified = True

        # Add dateModified if missing
        if 'dateModified' not in data and 'datePublished' in data:
            data['dateModified'] = data['datePublished']
            modified = True

        if not modified:
            return m.group(0)

        changed = True
        new_json = json.dumps(data, ensure_ascii=False, indent=2)
        return m.group(1) + '\n' + new_json + '\n' + m.group(3)

    new_content = script_pattern.sub(patch_script, content)
    return new_content if changed else content


# ── Fix 2: Contrast — darken --muted ──────────────────────────────────────

def fix_contrast(content):
    # Replace both forms: with and without space
    content = content.replace('--muted:#8A7B6F', '--muted:#74665B')
    content = content.replace('--muted: #8A7B6F', '--muted: #74665B')
    return content


# ── Fix 3: Font loading — blocking → async preload ─────────────────────────

# Matches: <link href="https://fonts.googleapis.com/...&display=swap" rel="stylesheet">
# Also indented variants
BLOCKING_FONT_RE = re.compile(
    r'([ \t]*)(<link href="(https://fonts\.googleapis\.com/[^"]+&display=swap)" rel="stylesheet">)',
)


def fix_font_loading(content):
    """Convert blocking font load to async preload + noscript fallback."""
    if 'rel="preload"' in content and 'fonts.googleapis.com' in content:
        return content  # already async

    def replacer(m):
        indent = m.group(1)
        url = m.group(3)
        return (
            f'{indent}<link rel="preload" href="{url}" as="style" '
            f'onload="this.onload=null;this.rel=\'stylesheet\'">\n'
            f'{indent}<noscript><link href="{url}" rel="stylesheet"></noscript>'
        )

    return BLOCKING_FONT_RE.sub(replacer, content)


# ── Main ───────────────────────────────────────────────────────────────────

def process(filepath, is_en=False):
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    content = original

    filename = os.path.basename(filepath)

    # Organization schema on index pages
    if filename == 'index.html':
        content = add_org_schema(content)

    # Article JSON-LD on article pages
    if filename.startswith('article-'):
        content = fix_article_jsonld(content, filepath)

    # Contrast fix — all pages
    content = fix_contrast(content)

    # Font loading fix — all pages
    content = fix_font_loading(content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


changed = []

for filename in os.listdir(BASE):
    if not filename.endswith('.html'):
        continue
    if process(os.path.join(BASE, filename)):
        changed.append(filename)

en_dir = os.path.join(BASE, 'en')
for filename in os.listdir(en_dir):
    if not filename.endswith('.html'):
        continue
    if process(os.path.join(en_dir, filename), is_en=True):
        changed.append(f'en/{filename}')

print(f'Modified {len(changed)} files:')
for f in sorted(changed):
    print(f'  {f}')
