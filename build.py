"""Inline css/ and js/ into one self-contained file: dist/index.html."""
import pathlib, re
root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text()
html = html.replace('<link rel="stylesheet" href="css/style.css">',
                    "<style>\n" + (root / "css/style.css").read_text() + "</style>")
html = re.sub(r'<script src="(js/[^"]+)"></script>',
              lambda m: "<script>\n" + (root / m.group(1)).read_text() + "</script>", html)
import urllib.parse
svg = (root / "favicon.svg").read_text().strip()
html = html.replace('<link rel="icon" href="favicon.ico" sizes="any">\n', "")
html = html.replace('href="favicon.svg"', 'href="data:image/svg+xml,' + urllib.parse.quote(svg) + '"')
(root / "dist").mkdir(exist_ok=True)
(root / "dist/index.html").write_text(html)
print("wrote dist/index.html", len(html), "bytes")
