# Source artwork — not shipped

These are the editable originals. The page loads the derived files in
`assets/images/` instead; nothing here is referenced by `index.html`.

| source | shipped as | why |
|---|---|---|
| `ALMA-composicao.svg` (6.2 MB) | `alma-composicao.webp` 113 KB, `@2x` 374 KB | 516k stippled `M x y h.01` subpaths. As vector the browser parses 6.2 MB and re-rasterises it under the hero's blur filter every scroll frame. Flattened onto the white ground at PSNR 45 dB. |
| `fig-logo.png` (1087×201) | `fig-logo.webp` 224×41 | the slot is 112 px wide |
| `fig-logo-negative.png` (1087×201) | `fig-logo-negative.webp` 328×61 | the slot is 164 px wide |

Regenerate the hero raster by drawing the SVG into a canvas at 902×939 (1x)
and 1804×1878 (2x) on an opaque `#ffffff` ground, then exporting WebP q92.
Keeping the alpha channel triples the file for no visible gain — the CSS
already paints white underneath.
