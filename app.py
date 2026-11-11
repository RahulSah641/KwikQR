from flask import Flask, render_template, request, jsonify, send_file, redirect, abort
from io import BytesIO
import qrcode
from qrcode.constants import ERROR_CORRECT_L, ERROR_CORRECT_M, ERROR_CORRECT_Q, ERROR_CORRECT_H
from PIL import Image, ImageDraw
import base64
import os
import secrets
import sqlite3
import time
from urllib.parse import urlparse
from werkzeug.security import generate_password_hash, check_password_hash
import base64
import binascii
import re
import logos

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 4 * 1024 * 1024  # room for an uploaded centre logo

ERROR_LEVELS = {
    "L": ERROR_CORRECT_L,
    "M": ERROR_CORRECT_M,
    "Q": ERROR_CORRECT_Q,
    "H": ERROR_CORRECT_H,
}

def clean_color(value, fallback):
    value = (value or "").strip()
    if re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        return value
    return fallback

def build_payload(kind, data):
    if kind == "url":
        value = data.get("url", "").strip()
        if not value:
            raise ValueError("Enter a website URL.")
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", value):
            value = "https://" + value
        return value
    if kind == "pdf":
        value = data.get("pdf_url", "").strip()
        if not value:
            raise ValueError("Enter a shareable PDF link.")
        if not re.match(r"^https?://", value, re.IGNORECASE):
            raise ValueError("Enter a full PDF link beginning with https:// or http://.")
        return value
    if kind == "text":
        value = data.get("text", "").strip()
        if not value:
            raise ValueError("Enter some text.")
        return value
    if kind == "email":
        email = data.get("email", "").strip()
        subject = data.get("subject", "").strip()
        body = data.get("body", "").strip()
        if not email or "@" not in email:
            raise ValueError("Enter a valid email address.")
        return f"mailto:{email}?subject={subject}&body={body}"
    if kind == "phone":
        phone = data.get("phone", "").strip()
        if not phone:
            raise ValueError("Enter a phone number.")
        return "tel:" + phone
    if kind == "sms":
        phone = data.get("sms_phone", "").strip()
        message = data.get("sms_message", "").strip()
        if not phone:
            raise ValueError("Enter a phone number.")
        return f"SMSTO:{phone}:{message}"
    if kind == "wifi":
        ssid = data.get("ssid", "").strip()
        password = data.get("password", "")
        security = data.get("security", "WPA")
        hidden = "true" if data.get("hidden") else "false"
        if not ssid:
            raise ValueError("Enter your Wi-Fi network name.")
        def esc(s):
            return s.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace(":", "\\:")
        return f"WIFI:T:{security};S:{esc(ssid)};P:{esc(password)};H:{hidden};;"
    if kind == "vcard":
        name = data.get("v_name", "").strip()
        if not name:
            raise ValueError("Enter a contact name.")
        parts = ["BEGIN:VCARD", "VERSION:3.0", f"FN:{name}"]
        for key, tag in [("v_phone", "TEL"), ("v_email", "EMAIL"), ("v_org", "ORG"), ("v_url", "URL")]:
            val = data.get(key, "").strip()
            if val:
                parts.append(f"{tag}:{val}")
        parts.append("END:VCARD")
        return "\n".join(parts)
    if kind == "whatsapp":
        phone = re.sub(r"\D", "", data.get("wa_phone", ""))
        message = data.get("wa_message", "").strip()
        if not phone:
            raise ValueError("Enter a WhatsApp number with country code.")
        from urllib.parse import quote
        return f"https://wa.me/{phone}" + (f"?text={quote(message)}" if message else "")
    if kind == "location":
        lat = data.get("latitude", "").strip()
        lon = data.get("longitude", "").strip()
        if not lat or not lon:
            raise ValueError("Enter latitude and longitude.")
        try:
            if not (-90 <= float(lat) <= 90 and -180 <= float(lon) <= 180):
                raise ValueError()
        except ValueError:
            raise ValueError("Enter valid latitude and longitude.")
        return f"geo:{lat},{lon}"
    if kind == "event":
        title = data.get("event_title", "").strip()
        start = data.get("event_start", "").strip()
        end = data.get("event_end", "").strip()
        location = data.get("event_location", "").strip()
        if not title or not start:
            raise ValueError("Enter an event title and start date/time.")
        def dt(v):
            return re.sub(r"[-:]", "", v) + ("00" if len(v) == 13 else "")
        return "\n".join([
            "BEGIN:VEVENT", f"SUMMARY:{title}", f"DTSTART:{dt(start)}",
            *( [f"DTEND:{dt(end)}"] if end else [] ),
            *( [f"LOCATION:{location}"] if location else [] ),
            "END:VEVENT"
        ])
    raise ValueError("Choose a supported QR content type.")

@app.get("/")
def index():
    return render_template("index.html")

@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "KwikQR"})


# ---------------------------------------------------------------------------
# Password-protected QR codes
# The QR code holds a short KwikQR link (/p/<id>). The real content is stored
# here, behind a password hash, and only shown after the password is entered.
# ---------------------------------------------------------------------------
DB_PATH = os.environ.get("KWIKQR_DB", os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "kwikqr.db"))
MAX_ATTEMPTS = 5
LOCK_SECONDS = 300


def db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("""CREATE TABLE IF NOT EXISTS protected (
        id TEXT PRIMARY KEY, payload TEXT NOT NULL, pw_hash TEXT NOT NULL,
        created REAL NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, locked_until REAL NOT NULL DEFAULT 0)""")
    return con


def create_protected(payload, password):
    if not (4 <= len(password) <= 64):
        raise ValueError("Password must be 4 to 64 characters.")
    pid = secrets.token_urlsafe(8)
    with db() as con:
        con.execute("INSERT INTO protected (id, payload, pw_hash, created) VALUES (?,?,?,?)",
                    (pid, payload, generate_password_hash(password), time.time()))
    return pid


def public_base():
    return (os.environ.get("KWIKQR_PUBLIC_URL") or request.host_url).rstrip("/")


def is_local_host(url):
    host = (urlparse(url).hostname or "").lower()
    return host in ("localhost", "127.0.0.1", "::1", "0.0.0.0") or host.endswith(".local")


def unlock_ctx(row, **extra):
    return dict(pid=row["id"], **extra)


@app.route("/p/<pid>", methods=["GET", "POST"])
def unlock(pid):
    with db() as con:
        row = con.execute("SELECT * FROM protected WHERE id=?", (pid,)).fetchone()
        if not row:
            abort(404)
        now = time.time()
        if row["locked_until"] > now:
            wait = int((row["locked_until"] - now) // 60) + 1
            return render_template("unlock.html", pid=pid, error=f"Too many wrong attempts. Try again in about {wait} minute(s)."), 429
        if request.method == "GET":
            return render_template("unlock.html", pid=pid)
        if check_password_hash(row["pw_hash"], request.form.get("password", "")):
            con.execute("UPDATE protected SET attempts=0 WHERE id=?", (pid,))
            payload = row["payload"]
            scheme = (urlparse(payload).scheme or "").lower()
            if scheme in ("http", "https"):
                return redirect(payload, 303)
            link = payload if scheme in ("mailto", "tel", "sms", "geo") else None
            return render_template("unlock.html", pid=pid, content=payload, link=link)
        attempts = row["attempts"] + 1
        locked = now + LOCK_SECONDS if attempts >= MAX_ATTEMPTS else 0
        con.execute("UPDATE protected SET attempts=?, locked_until=? WHERE id=?", (0 if locked else attempts, locked, pid))
        left = MAX_ATTEMPTS - attempts
        msg = "Incorrect password." + (f" {left} attempt(s) left." if left > 0 else " Locked for 5 minutes.")
        return render_template("unlock.html", pid=pid, error=msg), 403

# Share of the QR width covered by the centre logo (the logo badge incl. padding).
LOGO_RATIO = 0.24


def parse_custom_logo(data_url):
    """Decode an uploaded image (data URL) into an RGBA PIL image."""
    m = re.fullmatch(r"data:image/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=\s]+)", data_url or "")
    if not m:
        raise ValueError("Upload a PNG, JPG or WebP image for the centre logo.")
    try:
        img = Image.open(BytesIO(base64.b64decode(m.group(2))))
        img.load()
    except (binascii.Error, OSError, Image.DecompressionBombError):
        raise ValueError("That logo image could not be read.")
    img = img.convert("RGBA")
    img.thumbnail((512, 512))
    return img


def resolve_logo(data):
    """Return ("builtin", key) / ("custom", PIL image) / None."""
    choice = (data.get("logo") or "none").strip().lower()
    if choice == "custom":
        return ("custom", parse_custom_logo(data.get("logo_data")))
    if choice in logos.ICONS:
        return ("builtin", choice)
    return None


def build_matrix(payload, level, border):
    qr = qrcode.QRCode(version=None, error_correction=level, box_size=10, border=border)
    qr.add_data(payload)
    qr.make(fit=True)
    return qr.get_matrix()  # includes the quiet zone


def svg_response(matrix, fill, back, logo, logo_style):
    n = len(matrix)
    parts = []
    for y, row in enumerate(matrix):
        x = 0
        while x < n:
            if row[x]:
                start = x
                while x < n and row[x]:
                    x += 1
                parts.append(f"M{start} {y}h{x - start}v1h-{x - start}z")
            else:
                x += 1
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" width="{n * 10}" height="{n * 10}" shape-rendering="crispEdges">',
           f'<rect width="{n}" height="{n}" fill="{back}"/>',
           f'<path d="{"".join(parts)}" fill="{fill}"/>']
    if logo:
        box = n * LOGO_RATIO
        pad = box * 0.09
        x0 = (n - box) / 2
        icon = box - 2 * pad
        pad_fill = back
        svg.append(f'<rect x="{x0:.3f}" y="{x0:.3f}" width="{box:.3f}" height="{box:.3f}" rx="{box * 0.2:.3f}" fill="{pad_fill}"/>')
        if logo[0] == "builtin":
            svg.append(f'<svg x="{x0 + pad:.3f}" y="{x0 + pad:.3f}" width="{icon:.3f}" height="{icon:.3f}" viewBox="0 0 100 100">{logos.logo_svg_inner(logo[1])}</svg>')
        else:
            buf = BytesIO()
            logo[1].save(buf, format="PNG")
            uri = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
            svg.append(f'<image x="{x0 + pad:.3f}" y="{x0 + pad:.3f}" width="{icon:.3f}" height="{icon:.3f}" preserveAspectRatio="xMidYMid meet" href="{uri}"/>')
    svg.append("</svg>")
    out = BytesIO("".join(svg).encode("utf-8"))
    return send_file(out, mimetype="image/svg+xml", as_attachment=False, download_name="kwikqr.svg")


def png_response(matrix, size, fill, back, logo):
    n = len(matrix)
    img = Image.new("RGB", (size, size), back)
    d = ImageDraw.Draw(img)
    edges = [round(i * size / n) for i in range(n + 1)]
    for y, row in enumerate(matrix):
        x = 0
        while x < n:
            if row[x]:
                start = x
                while x < n and row[x]:
                    x += 1
                d.rectangle([edges[start], edges[y], edges[x] - 1, edges[y + 1] - 1], fill=fill)
            else:
                x += 1
    if logo:
        box = int(size * LOGO_RATIO)
        pad = max(2, int(box * 0.09))
        icon_px = box - 2 * pad
        x0 = (size - box) // 2
        # Supersample the rounded badge for smooth corners.
        k = 4
        badge = Image.new("L", (box * k, box * k), 0)
        ImageDraw.Draw(badge).rounded_rectangle([0, 0, box * k - 1, box * k - 1], radius=int(box * 0.2 * k), fill=255)
        badge = badge.resize((box, box), Image.LANCZOS)
        img.paste(Image.new("RGB", (box, box), back), (x0, x0), badge)
        if logo[0] == "builtin":
            icon = logos.render_logo(logo[1], icon_px)
        else:
            src = logo[1].copy()
            src.thumbnail((icon_px, icon_px), Image.LANCZOS)
            icon = Image.new("RGBA", (icon_px, icon_px), (0, 0, 0, 0))
            icon.paste(src, ((icon_px - src.width) // 2, (icon_px - src.height) // 2))
        img.paste(icon, (x0 + pad, x0 + pad), icon)
    output = BytesIO()
    img.save(output, format="PNG", optimize=True)
    output.seek(0)
    return send_file(output, mimetype="image/png", as_attachment=False, download_name="kwikqr.png")


@app.get("/api/logo/<key>.svg")
def logo_file(key):
    if key not in logos.ICONS:
        return jsonify({"error": "Unknown logo."}), 404
    try:
        size = max(16, min(int(request.args.get("size", 100)), 1024))
    except ValueError:
        size = 100
    resp = send_file(BytesIO(logos.logo_svg(key, size).encode("utf-8")), mimetype="image/svg+xml")
    resp.headers["Cache-Control"] = "public, max-age=86400"
    return resp


@app.get("/api/logos")
def logo_list():
    return jsonify(logos.logo_choices())


@app.post("/api/qr")
def generate_qr():
    data = request.get_json(silent=True) or {}
    try:
        payload = build_payload(data.get("kind", "url"), data)
        password = data.get("password") or ""
        notice = None
        if password:
            payload = public_base() + "/p/" + create_protected(payload, password)
            if is_local_host(payload):
                notice = "Password is active, but this QR points to your own computer (localhost). Other people can only unlock it after you deploy KwikQR online, or run it with KWIKQR_PUBLIC_URL set to your public address."
        fill = clean_color(data.get("foreground"), "#17152C")
        back = clean_color(data.get("background"), "#FFFFFF")
        size = max(128, min(int(data.get("size", 320)), 1024))
        border = max(2, min(int(data.get("border", 4)), 10))
        level = ERROR_LEVELS.get(data.get("error_level", "M"), ERROR_CORRECT_M)
        logo = resolve_logo(data)
        if logo:
            level = ERROR_CORRECT_H  # a centre logo hides modules, so use maximum redundancy
        matrix = build_matrix(payload, level, border)
        fmt = data.get("format", "png").lower()
        resp = svg_response(matrix, fill, back, logo, None) if fmt == "svg" else png_response(matrix, size, fill, back, logo)
        if notice:
            resp.headers["X-KwikQR-Notice"] = notice
        return resp
    except (ValueError, TypeError) as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception:
        app.logger.exception("QR generation failed")
        return jsonify({"error": "Could not generate this QR code. Try shorter content or different settings."}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
