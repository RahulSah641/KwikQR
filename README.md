# KwikQR — Premium QR Code Generator

A responsive QR generator with a premium purple/ink interface inspired by the general layout and workflow of your reference screenshot and QRFY. This is an original implementation and does not copy QRFY branding or assets.

## Features
- KwikQR logo as favicon, header, footer and loader
- Optional password protection: the QR opens a KwikQR unlock page (/p/<id>); content shows only after the correct password (5 wrong tries = 5 min lock). Passwords are stored hashed in data/kwikqr.db. Set KWIKQR_PUBLIC_URL (e.g. https://yourdomain.com) when deploying so the QR points to your public address.
- Branded KwikQR loading screen with progress bar
- Center logo inside the QR (Instagram, WhatsApp, Telegram, Facebook, YouTube, X, LinkedIn, TikTok, Snapchat, Pinterest, Google, or your own upload) - auto-picked when you choose a social theme
- Premium template designer: Google review cards, social follow posters/tags, Wi-Fi, menu, thank-you cards with editable text, colors, borders, stars, fonts and business logo (PNG export)
- Website URL and plain text QR codes
- Email, phone, SMS, Wi-Fi
- vCard contact, WhatsApp, location, and event QR codes
- Custom foreground/background colors
- Social media color themes: Instagram, WhatsApp, Facebook, Google Reviews, YouTube, TikTok, LinkedIn, X, Telegram, Snapchat, and Pinterest
- PNG and SVG export
- Output sizes from 256 to 1024 px
- Error correction level and quiet-zone controls
- Python Flask backend using `qrcode` and Pillow
- Responsive HTML/CSS/JavaScript frontend

## Requirements
- Python 3.10+
- Internet connection is not required for QR generation after dependencies are installed.
- Google Fonts are loaded from Google Fonts CDN; if offline, the site falls back to system fonts.

## Run on Windows
1. Extract the ZIP.
2. Open the extracted folder in VS Code.
3. Open Terminal in VS Code.
4. Create a virtual environment:

   ```powershell
   py -m venv venv
   .\venv\Scripts\activate
   ```

5. Install packages:

   ```powershell
   pip install -r requirements.txt
   ```

6. Start the server:

   ```powershell
   python app.py
   ```

7. Open `http://127.0.0.1:5000` in your browser.

## Run on macOS / Linux
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000`.

## Project structure
```text
kwikqr-premium/
├── app.py
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── app.js
```

## Deploy
This is a Python Flask app, not a static-only site. Use a Python web host such as Render or Railway.

### Render
- Create a new **Web Service** and connect your GitHub repository.
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app`
- Add `gunicorn` to `requirements.txt` before deploying, or use `python app.py` only for local development.
- Set `PYTHON_VERSION` if required by the host.

For production, install gunicorn:
```bash
pip install gunicorn
```
Then use:
```bash
gunicorn app:app
```

## Privacy
QR content is sent from the browser to your own Flask backend to generate the QR image. This starter has no database and does not intentionally save QR content or generated files. For production, add HTTPS, rate limiting, request logging review, and an accurate privacy policy. Avoid encoding confidential information in a QR code: anyone who scans it may read its contents.

## Notes
- Dynamic QR codes, analytics, password-protected destinations, bulk campaigns, editable destination links, branded domains, user accounts, and subscription billing are not included in this starter.
- For QR codes with logos, choose high error correction and test scans on multiple devices.
