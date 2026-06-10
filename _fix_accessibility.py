#!/usr/bin/env python3
"""
Fix 1: og:image / twitter:image URLs — add missing /atelier-maude/ path
Fix 2: twitter:image on index.html + en/index.html
Fix 3: skip-to-content link + anchor on all pages
Fix 4: ARIA role/modal/labelledby on popup modals (index + en/index)
Fix 5: aria-haspopup/aria-expanded on nav dropdown triggers (all pages)
Fix 6: width/height on product <img> tags (all pages)
"""

import os, re

BASE = '/Users/audekaleta/atelier-maude'
SKIP = {'404.html'}

# Image dimensions (filename → (width, height))
DIMS = {
    'yun-court-noir-face-new.png':           (720, 720),
    'yun-court-noir-dos-new.png':            (720, 720),
    'yun-court-noir-profil-new.png':         (720, 720),
    'hua-long-camel-face-new.png':           (720, 720),
    'hua-long-camel-dos-new.png':            (720, 720),
    'hua-long-camel-profil-new.png':         (720, 720),
    'hua-long-gris-face-new.png':            (539, 720),
    'hua-long-gris-dos-new.png':             (539, 720),
    'hua-long-gris-profil-new.png':          (539, 720),
    'yun-long-noir-face-new.png':            (525, 720),
    'yun-long-noir-dos-new.png':             (480, 720),
    'yun-long-noir-profil-new.png':          (525, 720),
    'yun-long-marron-face-new.png':          (480, 720),
    'yun-long-marron-dos-new.png':           (479, 720),
    'yun-long-marron-profil-new.png':        (479, 720),
    'sha-packshot-1.png':                    (537, 720),
    'sha-packshot-2.png':                    (537, 720),
    'sha-portee.png':                        (537, 720),
    'ze-packshot-1.png':                     (720, 392),
    'ze-packshot-2.png':                     (720, 392),
    'ze-packshot-3.png':                     (537, 720),
    'ze-portee.png':                         (537, 720),
    'echarpe-camel.png':                     (896, 1200),
    'echarpe-bleu-clair.png':                (896, 1200),
    'echarpe-bleu-marine.png':               (896, 1200),
    'echarpe-bleu-vert.png':                 (896, 1200),
    'echarpe-gris.png':                      (896, 1200),
    'echarpe-noir.png':                      (896, 1200),
    'echarpe-rose-pourpre.png':              (896, 1200),
    'closeup-hua-long-camel-col-v.png':      (1792, 2400),
    'closeup-hua-long-camel-epaule.png':     (1792, 2400),
    'closeup-hua-long-camel-profil-mannequin.png': (1792, 2400),
    'closeup-hua-long-gris-col-bouton.png':  (1792, 2400),
    'closeup-hua-long-gris-manchette.png':   (1792, 2400),
    'closeup-hua-long-gris-revers.png':      (1792, 2400),
    'closeup-yun-court-ceinture-noeud.png':  (1792, 2400),
    'closeup-yun-court-col-boucle.png':      (1792, 2400),
    'closeup-yun-court-poche-main.png':      (1792, 2400),
    'closeup-yun-long-marron-boucle.png':    (1792, 2400),
    'closeup-yun-long-marron-ceinture.png':  (1792, 2400),
    'closeup-yun-long-marron-epaule.png':    (1792, 2400),
    'closeup-yun-long-marron-poche.png':     (1792, 2400),
    'closeup-yun-long-noir-ceinture-drape.png': (1792, 2400),
    'closeup-yun-long-noir-ourlet-marbre.png':  (1792, 2400),
    'closeup-yun-long-noir-texture.png':     (1792, 2400),
    'hero.png':                              (1024, 1536),
    'cachemire-atelier-suzhou.png':          (1408, 768),
    'cachemire-mongolie-chevres.png':        (1408, 768),
    'cachemire-texture-zoom.png':            (1408, 768),
    'journal-fil-cachemire.png':             (1024, 1056),
    'journal-texture-cachemire.png':         (1380, 752),
}


# ── Fix 1: og:image / twitter:image URL ────────────────────────────────────
def fix_og_urls(content):
    def patch_line(m):
        line = m.group(0)
        # Only patch if /atelier-maude/ is not already there
        if '/atelier-maude/' not in line:
            line = line.replace(
                'https://ateliermaude.github.io/',
                'https://ateliermaude.github.io/atelier-maude/'
            )
        return line
    return re.sub(
        r'<meta (?:property="og:image"|name="twitter:image")[^>]+>',
        patch_line,
        content
    )


# ── Fix 2: twitter:image on index pages ────────────────────────────────────
def add_twitter_image(content, img_url):
    if 'twitter:image' not in content:
        content = content.replace(
            '<meta name="twitter:card" content="summary_large_image">',
            '<meta name="twitter:card" content="summary_large_image">\n'
            f'  <meta name="twitter:image" content="{img_url}">'
        )
    return content


# ── Fix 3: skip-to-content ─────────────────────────────────────────────────
def add_skip_link(content, is_en):
    label = 'Skip to main content' if is_en else 'Aller au contenu principal'
    skip_html = f'<a href="#main-content" class="skip-link">{label}</a>\n'

    # Add link as first child of <body> (only if not already present)
    if 'skip-link' not in content:
        content = content.replace('<body>\n', f'<body>\n{skip_html}', 1)
        if 'skip-link' not in content:  # fallback: no newline after <body>
            content = content.replace('<body>', f'<body>\n{skip_html}', 1)

    # Add invisible anchor after </header> (only if not already present)
    if 'id="main-content"' not in content:
        content = content.replace(
            '</header>',
            '</header>\n<span id="main-content" tabindex="-1" aria-hidden="true"></span>',
            1
        )
    return content


# ── Fix 4: ARIA on popup modal ─────────────────────────────────────────────
def add_modal_aria(content):
    if 'popup-overlay' not in content:
        return content

    # Add role/aria-modal/aria-labelledby to inner .popup div
    content = content.replace(
        '<div class="popup">',
        '<div class="popup" role="dialog" aria-modal="true" aria-labelledby="popup-title">',
        1
    )

    # Add id="popup-title" to the h2 inside the popup (first h2 after popup div)
    # Match <h2> that is inside the popup (after popup-title aria was just added)
    # Use a DOTALL pattern to find first <h2> after popup-title
    content = re.sub(
        r'(aria-labelledby="popup-title"[^>]*>.*?<button[^<]*</button>\s*)<h2>',
        r'\1<h2 id="popup-title">',
        content,
        count=1,
        flags=re.DOTALL
    )

    # Add focus management to popup open code (move focus to email input)
    content = content.replace(
        "document.getElementById('popup').classList.add('show');\n    sessionStorage.setItem('popup_shown','1');",
        "document.getElementById('popup').classList.add('show');\n    sessionStorage.setItem('popup_shown','1');\n"
        "    setTimeout(function(){var el=document.querySelector('#popup input[type=\"email\"]');if(el)el.focus();},420);"
    )

    return content


# ── Fix 5: aria-haspopup + aria-expanded on nav dropdown triggers ──────────
def add_dropdown_aria(content):
    # Match <a ...> that immediately precede <span class="nav-dropdown-arrow">
    # Pattern: <a href="...">TEXT<space><span class="nav-dropdown-arrow">
    def replacer(m):
        tag_open = m.group(1)  # e.g. '<a href="manteaux.html"'
        tag_close = m.group(2)  # '>'
        rest = m.group(3)      # text + <span class="nav-dropdown-arrow">
        if 'aria-haspopup' in tag_open:
            return m.group(0)
        return f'{tag_open} aria-haspopup="true" aria-expanded="false"{tag_close}{rest}'

    return re.sub(
        r'(<a [^>]*?)(>)([^<]*<span class="nav-dropdown-arrow">)',
        replacer,
        content
    )


# ── Fix 6: width/height on <img> tags ─────────────────────────────────────
def add_img_dimensions(content):
    def replacer(m):
        full = m.group(0)
        src_val = m.group(1)
        # Extract bare filename (strip path prefix)
        fname = src_val.split('/')[-1]
        if fname not in DIMS:
            return full
        w, h = DIMS[fname]
        # Only add if width/height not already present
        if 'width=' in full or 'height=' in full:
            return full
        # Insert width height before the closing >
        return re.sub(r'(\s*/?>)$', f' width="{w}" height="{h}"\\1', full)

    return re.sub(
        r'<img\s[^>]*?src="([^"]+)"[^>]*?>',
        replacer,
        content,
        flags=re.DOTALL
    )


# ── Main processing ────────────────────────────────────────────────────────
def process_file(filepath, is_en, add_tw_image=False, add_popup_aria=False):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    content = fix_og_urls(content)

    if add_tw_image:
        img_url = 'https://ateliermaude.github.io/atelier-maude/hua-long-camel-face-new.webp'
        content = add_twitter_image(content, img_url)

    content = add_skip_link(content, is_en)
    content = add_modal_aria(content)
    content = add_dropdown_aria(content)
    content = add_img_dimensions(content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


changed = []

# FR root pages
for filename in os.listdir(BASE):
    if not filename.endswith('.html') or filename in SKIP:
        continue
    filepath = os.path.join(BASE, filename)
    is_index = filename == 'index.html'
    if process_file(filepath, is_en=False, add_tw_image=is_index, add_popup_aria=is_index):
        changed.append(filename)

# EN pages
en_dir = os.path.join(BASE, 'en')
for filename in os.listdir(en_dir):
    if not filename.endswith('.html'):
        continue
    filepath = os.path.join(en_dir, filename)
    is_index = filename == 'index.html'
    if process_file(filepath, is_en=True, add_tw_image=is_index, add_popup_aria=is_index):
        changed.append(f'en/{filename}')

print(f'Modified {len(changed)} files:')
for f in sorted(changed):
    print(f'  {f}')
