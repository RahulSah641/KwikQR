from flask import Flask, render_template, request, jsonify, send_file
from io import BytesIO
import qrcode
from qrcode.constants import ERROR_CORRECT_L, ERROR_CORRECT_M, ERROR_CORRECT_Q, ERROR_CORRECT_H
from qrcode.image.svg import SvgPathImage
import re

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024

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

@app.post("/api/qr")
def generate_qr():
    data = request.get_json(silent=True) or {}
    try:
        payload = build_payload(data.get("kind", "url"), data)
        fill = clean_color(data.get("foreground"), "#17152C")
        back = clean_color(data.get("background"), "#FFFFFF")
        size = max(128, min(int(data.get("size", 320)), 1024))
        border = max(2, min(int(data.get("border", 4)), 10))
        level = data.get("error_level", "M")
        qr = qrcode.QRCode(
            version=None,
            error_correction=ERROR_LEVELS.get(level, ERROR_CORRECT_M),
            box_size=max(4, size // 64),
            border=border,
        )
        qr.add_data(payload)
        qr.make(fit=True)
        fmt = data.get("format", "png").lower()
        if fmt == "svg":
            image = qr.make_image(image_factory=SvgPathImage, fill_color=fill, back_color=back)
            output = BytesIO()
            image.save(output)
            output.seek(0)
            return send_file(output, mimetype="image/svg+xml", as_attachment=False, download_name="kwikqr.svg")
        image = qr.make_image(fill_color=fill, back_color=back).convert("RGB")
        # Resize to requested square output size for consistent downloads.
        image = image.resize((size, size), resample=0)
        output = BytesIO()
        image.save(output, format="PNG", optimize=True)
        output.seek(0)
        return send_file(output, mimetype="image/png", as_attachment=False, download_name="kwikqr.png")
    except (ValueError, TypeError) as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception:
        app.logger.exception("QR generation failed")
        return jsonify({"error": "Could not generate this QR code. Try shorter content or different settings."}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
