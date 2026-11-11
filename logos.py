"""Vector social-media logos for KwikQR.

Every logo is described once as a list of simple shapes on a 100x100 canvas.
The same description is rendered to SVG (for SVG export, thumbnails and the
template designer) and to a Pillow image (for PNG export), so the two always
match and no external image files are needed.
"""
import math
from functools import lru_cache
from PIL import Image, ImageDraw

# ---- gradients -----------------------------------------------------------
# name -> (x1, y1, x2, y2, [(offset, color), ...]) in 0-100 space
GRADIENTS = {
    "insta": (10, 100, 95, 0, [(0, "#FEDA75"), (0.28, "#FA7E1E"), (0.5, "#D62976"), (0.75, "#962FBF"), (1, "#4F5BD5")]),
    "tg": (50, 0, 50, 100, [(0, "#37AEE2"), (1, "#1E96C8")]),
}

# ---- shape helpers -------------------------------------------------------
def rrect(x, y, w, h, r, fill):
    return ("rrect", x, y, w, h, r, fill)

def circle(cx, cy, r, fill):
    return ("circle", cx, cy, r, fill)

def ring(cx, cy, r, sw, color):
    return ("ring", cx, cy, r, sw, color)

def rring(x, y, w, h, r, sw, color):
    return ("rring", x, y, w, h, r, sw, color)

def poly(points, fill, stroke=None, sw=0):
    return ("poly", points, fill, stroke, sw)

def line(x1, y1, x2, y2, w, color):
    return ("line", x1, y1, x2, y2, w, color)

def arc(cx, cy, r, sw, a0, a1, color):
    return ("arc", cx, cy, r, sw, a0, a1, color)


def _tiktok(dx, dy, color):
    return [
        ring(40 + dx, 67 + dy, 9, 8, color),
        line(53 + dx, 22 + dy, 53 + dx, 67 + dy, 9, color),
        poly([(49 + dx, 22 + dy), (62 + dx, 22 + dy), (64 + dx, 31 + dy), (74 + dx, 37 + dy),
              (74 + dx, 46 + dy), (62 + dx, 42 + dy), (49 + dx, 40 + dy)], color),
    ]


# ---- icon definitions ----------------------------------------------------
# Each icon: {"clip": ("circle"|"rrect", ...), "shapes": [...], "title": str}
ICONS = {
    "instagram": {
        "title": "Instagram",
        "clip": ("rrect", 0, 0, 100, 100, 26),
        "shapes": [
            rrect(0, 0, 100, 100, 26, "grad:insta"),
            rring(21, 21, 58, 58, 17, 6.5, "#ffffff"),
            ring(50, 50, 13.5, 6.5, "#ffffff"),
            circle(69, 31, 4.6, "#ffffff"),
        ],
    },
    "whatsapp": {
        "title": "WhatsApp",
        "clip": ("circle", 50, 50, 50),
        "shapes": [
            circle(50, 50, 50, "#25D366"),
            poly([(20, 82), (25, 66), (33, 76)], "#ffffff"),
            ring(51, 47, 28, 6.5, "#ffffff"),
            poly([(35, 33), (41, 32), (45, 40), (42, 44), (41, 46), (46, 54), (54, 60),
                  (57, 58), (60, 56), (67, 60), (67, 66), (62, 70), (53, 68), (41, 60),
                  (33, 47), (32, 39)], "#ffffff"),
        ],
    },
    "telegram": {
        "title": "Telegram",
        "clip": ("circle", 50, 50, 50),
        "shapes": [
            circle(50, 50, 50, "grad:tg"),
            poly([(21, 49), (77, 27), (68, 74), (52, 63), (44, 72), (43, 59)], "#ffffff"),
            poly([(43, 59), (68, 39), (51, 62), (44, 72)], "#C8DAEA"),
        ],
    },
    "facebook": {
        "title": "Facebook",
        "clip": ("circle", 50, 50, 50),
        "shapes": [
            circle(50, 50, 50, "#1877F2"),
            poly([(54, 101), (54, 62), (44, 62), (44, 50), (54, 50), (54, 43), (60, 31),
                  (70, 29), (78, 30), (78, 41), (72, 41), (67, 44), (67, 50), (77, 50),
                  (75, 62), (67, 62), (67, 101)], "#ffffff"),
        ],
    },
    "youtube": {
        "title": "YouTube",
        "clip": ("rrect", 0, 20, 100, 60, 18),
        "shapes": [
            rrect(0, 20, 100, 60, 18, "#FF0000"),
            poly([(40, 34), (40, 66), (67, 50)], "#ffffff"),
        ],
    },
    "x": {
        "title": "X",
        "clip": ("rrect", 0, 0, 100, 100, 22),
        "shapes": [
            rrect(0, 0, 100, 100, 22, "#000000"),
            line(27, 25, 73, 75, 11, "#ffffff"),
            line(73, 25, 27, 75, 11, "#ffffff"),
        ],
    },
    "linkedin": {
        "title": "LinkedIn",
        "clip": ("rrect", 0, 0, 100, 100, 18),
        "shapes": [
            rrect(0, 0, 100, 100, 18, "#0A66C2"),
            rrect(18, 38, 13, 44, 1.5, "#ffffff"),
            circle(24.5, 24.5, 7.5, "#ffffff"),
            rrect(40, 38, 12, 44, 1.5, "#ffffff"),
            rrect(56, 36, 26, 46, 12, "#ffffff"),
            rrect(66, 48, 6, 34, 0, "#0A66C2"),
        ],
    },
    "tiktok": {
        "title": "TikTok",
        "clip": ("rrect", 0, 0, 100, 100, 22),
        "shapes": [rrect(0, 0, 100, 100, 22, "#000000")]
        + _tiktok(-3, -2, "#25F4EE") + _tiktok(3, 2, "#FE2C55") + _tiktok(0, 0, "#ffffff"),
    },
    "snapchat": {
        "title": "Snapchat",
        "clip": ("rrect", 0, 0, 100, 100, 22),
        "shapes": [
            rrect(0, 0, 100, 100, 22, "#FFFC00"),
            poly([(30, 72), (34, 62), (32, 45), (38, 30), (50, 24), (62, 30), (68, 45),
                  (66, 62), (70, 72), (62, 74), (58, 80), (50, 76), (42, 80), (38, 74)],
                 "#ffffff", "#111111", 3.2),
            circle(43, 46, 3, "#111111"),
            circle(57, 46, 3, "#111111"),
        ],
    },
    "pinterest": {
        "title": "Pinterest",
        "clip": ("circle", 50, 50, 50),
        "shapes": [
            circle(50, 50, 50, "#E60023"),
            line(44, 30, 39, 86, 8, "#ffffff"),
            ring(53, 41, 13, 8.5, "#ffffff"),
        ],
    },
    "google": {
        "title": "Google",
        "clip": ("circle", 50, 50, 50),
        "shapes": [
            circle(50, 50, 50, "#ffffff"),
            arc(50, 50, 28, 13, 200, 315, "#EA4335"),
            arc(50, 50, 28, 13, 140, 200, "#FBBC05"),
            arc(50, 50, 28, 13, 40, 140, "#34A853"),
            arc(50, 50, 28, 13, 0, 40, "#4285F4"),
            rrect(50, 43.5, 30, 13, 0, "#4285F4"),
        ],
    },
}

# Theme / content kind -> logo key
THEME_LOGOS = {k: k for k in ICONS}
KIND_LOGOS = {"whatsapp": "whatsapp"}


def logo_choices():
    return {k: v["title"] for k, v in ICONS.items()}


# ---- SVG rendering -------------------------------------------------------
def _f(n):
    return ("%.2f" % n).rstrip("0").rstrip(".")


def _arc_path(cx, cy, r, a0, a1):
    x0, y0 = cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0))
    x1, y1 = cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1))
    large = 1 if (a1 - a0) % 360 > 180 else 0
    return f"M{_f(x0)} {_f(y0)}A{_f(r)} {_f(r)} 0 {large} 1 {_f(x1)} {_f(y1)}"


def _svg_fill(fill):
    return f"url(#kq-{fill[5:]})" if fill.startswith("grad:") else fill


def _svg_shape(s):
    t = s[0]
    if t == "rrect":
        _, x, y, w, h, r, fill = s
        return f'<rect x="{_f(x)}" y="{_f(y)}" width="{_f(w)}" height="{_f(h)}" rx="{_f(r)}" fill="{_svg_fill(fill)}"/>'
    if t == "circle":
        _, cx, cy, r, fill = s
        return f'<circle cx="{_f(cx)}" cy="{_f(cy)}" r="{_f(r)}" fill="{_svg_fill(fill)}"/>'
    if t == "ring":
        _, cx, cy, r, sw, col = s
        return f'<circle cx="{_f(cx)}" cy="{_f(cy)}" r="{_f(r)}" fill="none" stroke="{col}" stroke-width="{_f(sw)}"/>'
    if t == "rring":
        _, x, y, w, h, r, sw, col = s
        return f'<rect x="{_f(x)}" y="{_f(y)}" width="{_f(w)}" height="{_f(h)}" rx="{_f(r)}" fill="none" stroke="{col}" stroke-width="{_f(sw)}"/>'
    if t == "poly":
        _, pts, fill, stroke, sw = s
        p = " ".join(f"{_f(x)},{_f(y)}" for x, y in pts)
        st = f' stroke="{stroke}" stroke-width="{_f(sw)}" stroke-linejoin="round"' if stroke else ""
        return f'<polygon points="{p}" fill="{_svg_fill(fill)}"{st}/>'
    if t == "line":
        _, x1, y1, x2, y2, w, col = s
        return f'<line x1="{_f(x1)}" y1="{_f(y1)}" x2="{_f(x2)}" y2="{_f(y2)}" stroke="{col}" stroke-width="{_f(w)}" stroke-linecap="round"/>'
    if t == "arc":
        _, cx, cy, r, sw, a0, a1, col = s
        return f'<path d="{_arc_path(cx, cy, r, a0, a1)}" fill="none" stroke="{col}" stroke-width="{_f(sw)}"/>'
    return ""


def _svg_defs(key):
    icon = ICONS[key]
    used = {s[-1] for s in icon["shapes"] if s[0] in ("rrect", "circle")}
    used |= {s[2] for s in icon["shapes"] if s[0] == "poly"}
    out = []
    for fill in used:
        if isinstance(fill, str) and fill.startswith("grad:"):
            name = fill[5:]
            x1, y1, x2, y2, stops = GRADIENTS[name]
            st = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
            out.append(f'<linearGradient id="kq-{name}" gradientUnits="userSpaceOnUse" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{st}</linearGradient>')
    clip = icon["clip"]
    if clip[0] == "circle":
        cp = f'<circle cx="{clip[1]}" cy="{clip[2]}" r="{clip[3]}"/>'
    else:
        cp = f'<rect x="{clip[1]}" y="{clip[2]}" width="{clip[3]}" height="{clip[4]}" rx="{clip[5]}"/>'
    out.append(f'<clipPath id="kq-clip-{key}">{cp}</clipPath>')
    return "".join(out)


def logo_svg_inner(key):
    """Markup for the logo on a 0-100 canvas (no <svg> wrapper)."""
    icon = ICONS[key]
    body = "".join(_svg_shape(s) for s in icon["shapes"])
    return f'<defs>{_svg_defs(key)}</defs><g clip-path="url(#kq-clip-{key})">{body}</g>'


def logo_svg(key, size=100):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 100 100">'
            f'{logo_svg_inner(key)}</svg>')


# ---- Pillow rendering ----------------------------------------------------
def _gradient_image(name, size):
    x1, y1, x2, y2, stops = GRADIENTS[name]
    k = size / 100.0
    x1, y1, x2, y2 = x1 * k, y1 * k, x2 * k, y2 * k
    dx, dy = x2 - x1, y2 - y1
    den = dx * dx + dy * dy or 1
    # Build a 1-D ramp then map every pixel to it (small, so a loop is fine).
    ramp = []
    for i in range(1024):
        t = i / 1023
        for j in range(len(stops) - 1):
            if t <= stops[j + 1][0] or j == len(stops) - 2:
                o0, c0 = stops[j]
                o1, c1 = stops[j + 1]
                u = 0 if o1 == o0 else min(1, max(0, (t - o0) / (o1 - o0)))
                a = tuple(int(c0[n:n + 2], 16) for n in (1, 3, 5))
                b = tuple(int(c1[n:n + 2], 16) for n in (1, 3, 5))
                ramp.append(tuple(round(a[m] + (b[m] - a[m]) * u) for m in range(3)) + (255,))
                break
    img = Image.new("RGBA", (size, size))
    px = img.load()
    for yy in range(size):
        for xx in range(size):
            t = ((xx - x1) * dx + (yy - y1) * dy) / den
            px[xx, yy] = ramp[int(min(1, max(0, t)) * 1023)]
    return img


def _paint(canvas, mask_draw_fn, fill, size):
    """Paint `fill` (colour or gradient) through a mask drawn by mask_draw_fn."""
    mask = Image.new("L", (size, size), 0)
    mask_draw_fn(ImageDraw.Draw(mask))
    if fill.startswith("grad:"):
        src = _gradient_image(fill[5:], size)
    else:
        src = Image.new("RGBA", (size, size), fill)
    canvas.paste(src, (0, 0), mask)


def _rr(d, box, r, fill=255, width=0):
    d.rounded_rectangle(box, radius=max(r, 0), fill=fill if not width else None,
                        outline=fill if width else None, width=width)


@lru_cache(maxsize=64)
def render_logo(key, px):
    """Return an RGBA PIL image of the logo, px x px, antialiased."""
    S = max(px * 4, 400)
    k = S / 100.0
    canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    icon = ICONS[key]
    for s in icon["shapes"]:
        t = s[0]
        if t == "rrect":
            _, x, y, w, h, r, fill = s
            _paint(canvas, lambda d: _rr(d, [x * k, y * k, (x + w) * k - 1, (y + h) * k - 1], r * k), fill, S)
        elif t == "circle":
            _, cx, cy, r, fill = s
            _paint(canvas, lambda d: d.ellipse([(cx - r) * k, (cy - r) * k, (cx + r) * k, (cy + r) * k], fill=255), fill, S)
        elif t == "ring":
            _, cx, cy, r, sw, col = s
            def f(d):
                d.ellipse([(cx - r - sw / 2) * k, (cy - r - sw / 2) * k, (cx + r + sw / 2) * k, (cy + r + sw / 2) * k], fill=255)
                d.ellipse([(cx - r + sw / 2) * k, (cy - r + sw / 2) * k, (cx + r - sw / 2) * k, (cy + r - sw / 2) * k], fill=0)
            _paint(canvas, f, col, S)
        elif t == "rring":
            _, x, y, w, h, r, sw, col = s
            def f(d):
                h2 = sw / 2
                _rr(d, [(x - h2) * k, (y - h2) * k, (x + w + h2) * k, (y + h + h2) * k], (r + h2) * k)
                _rr(d, [(x + h2) * k, (y + h2) * k, (x + w - h2) * k, (y + h - h2) * k], max(r - h2, 0) * k, fill=0)
            _paint(canvas, f, col, S)
        elif t == "poly":
            _, pts, fill, stroke, sw = s
            P = [(a * k, b * k) for a, b in pts]
            _paint(canvas, lambda d: d.polygon(P, fill=255), fill, S)
            if stroke:
                _paint(canvas, lambda d: d.line(P + [P[0], P[1]], fill=255, width=int(sw * k), joint="curve"), stroke, S)
        elif t == "line":
            _, x1, y1, x2, y2, w, col = s
            def f(d):
                d.line([(x1 * k, y1 * k), (x2 * k, y2 * k)], fill=255, width=int(w * k))
                r = w * k / 2
                for (a, b) in ((x1, y1), (x2, y2)):
                    d.ellipse([a * k - r, b * k - r, a * k + r, b * k + r], fill=255)
            _paint(canvas, f, col, S)
        elif t == "arc":
            _, cx, cy, r, sw, a0, a1, col = s
            def f(d):
                d.arc([(cx - r - sw / 2) * k, (cy - r - sw / 2) * k, (cx + r + sw / 2) * k, (cy + r + sw / 2) * k],
                      a0, a1, fill=255, width=int(sw * k))
            _paint(canvas, f, col, S)
    # Clip to the icon's outline
    clip = icon["clip"]
    m = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(m)
    if clip[0] == "circle":
        d.ellipse([(clip[1] - clip[3]) * k, (clip[2] - clip[3]) * k, (clip[1] + clip[3]) * k - 1, (clip[2] + clip[3]) * k - 1], fill=255)
    else:
        _rr(d, [clip[1] * k, clip[2] * k, (clip[1] + clip[3]) * k - 1, (clip[2] + clip[4]) * k - 1], clip[5] * k)
    alpha = Image.composite(canvas.getchannel("A"), Image.new("L", (S, S), 0), m)
    canvas.putalpha(alpha)
    return canvas.resize((px, px), Image.LANCZOS)
