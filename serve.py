#!/usr/bin/env python3
"""
Static server for the C-MORE landing page.

Plain `python3 -m http.server` lets the browser cache HTML, which meant edits
often didn't show up on refresh (and needed a ?cb= query to bust). This sends
no-store on everything, so a normal refresh always fetches the current file.

    python3 serve.py [port]        # default 8125
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    # Declare the encoding so nothing is decoded as latin-1 and comes out as
    # mojibake, and name the image types the page actually uses.
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):        # keep the console quiet
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8125
    ThreadingHTTPServer.allow_reuse_address = True
    with ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler) as httpd:
        print(f"serving {__file__.rsplit('/',1)[0]} on http://localhost:{port} (no-store)")
        httpd.serve_forever()
