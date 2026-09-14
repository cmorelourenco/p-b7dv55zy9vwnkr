# C-MORE landing page

Static marketing site — `index.html` plus `assets/` (css, js, images). No build
step: the folder is served exactly as it sits here, so a commit and push is the
whole deploy.

Preview locally (no-store headers, so a plain refresh always shows your edits):

    python3 serve.py        # http://localhost:8125

`legacy/` holds the earlier canvas-based version and its helper scripts; it is
not part of the live page.
