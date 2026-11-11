(() => {
  const $ = id => document.getElementById(id);
  let kind = "url", format = "png", currentBlob = null, currentUrl = null;
  const labels = {url:"Website URL",text:"Plain text",email:"Email",phone:"Phone number",sms:"SMS message",wifi:"Wi-Fi network",vcard:"Contact card",whatsapp:"WhatsApp",location:"Location",event:"Event",pdf:"PDF document"};
  const fields = {
    url: `<label class="field full"><span>Website URL</span><input name="url" type="url" placeholder="https://yourwebsite.com" autocomplete="url" required></label>`,
    pdf: `<label class="field full"><span>Shareable PDF URL</span><input name="pdf_url" type="url" placeholder="https://example.com/document.pdf" required></label><p class="field-help full">Upload your PDF to a service such as Google Drive or your website, enable link sharing, and paste the public link here. The QR code opens that link.</p>`,
    text: `<label class="field full"><span>Your text</span><textarea name="text" placeholder="Write a message, instructions, or any text..." required></textarea></label>`,
    email: `<label class="field"><span>Email address</span><input name="email" type="email" placeholder="hello@example.com" required></label><label class="field"><span>Subject (optional)</span><input name="subject" placeholder="Let's connect"></label><label class="field full"><span>Message (optional)</span><textarea name="body" placeholder="Type a short message..."></textarea></label>`,
    phone: `<label class="field full"><span>Phone number</span><input name="phone" type="tel" placeholder="+1 555 123 4567" required></label>`,
    sms: `<label class="field"><span>Phone number</span><input name="sms_phone" type="tel" placeholder="+1 555 123 4567" required></label><label class="field"><span>Message</span><input name="sms_message" placeholder="Hello there..."></label>`,
    wifi: `<label class="field"><span>Network name (SSID)</span><input name="ssid" placeholder="My Wi-Fi" required></label><label class="field"><span>Security</span><select name="security"><option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">No password</option></select></label><label class="field full"><span>Password</span><input name="password" type="text" placeholder="Wi-Fi password"></label><label class="field full"><span><input name="hidden" type="checkbox" value="1" style="width:auto;min-height:0;margin-right:7px"> Hidden network</span></label>`,
    vcard: `<label class="field"><span>Full name</span><input name="v_name" placeholder="Alex Morgan" required></label><label class="field"><span>Phone</span><input name="v_phone" placeholder="+1 555 123 4567"></label><label class="field"><span>Email</span><input name="v_email" type="email" placeholder="alex@example.com"></label><label class="field"><span>Organization</span><input name="v_org" placeholder="Company name"></label><label class="field full"><span>Website</span><input name="v_url" placeholder="https://example.com"></label>`,
    whatsapp: `<label class="field full"><span>WhatsApp number (include country code)</span><input name="wa_phone" type="tel" placeholder="919876543210" required></label><label class="field full"><span>Pre-filled message (optional)</span><textarea name="wa_message" placeholder="Hi! I found you through your QR code."></textarea></label>`,
    location: `<label class="field"><span>Latitude</span><input name="latitude" type="number" step="any" placeholder="19.0760" required></label><label class="field"><span>Longitude</span><input name="longitude" type="number" step="any" placeholder="72.8777" required></label>`,
    event: `<label class="field full"><span>Event title</span><input name="event_title" placeholder="Product launch" required></label><label class="field"><span>Start date & time</span><input name="event_start" type="datetime-local" required></label><label class="field"><span>End date & time (optional)</span><input name="event_end" type="datetime-local"></label><label class="field full"><span>Location (optional)</span><input name="event_location" placeholder="Venue, city"></label>`
  };

  function setKind(next) {
    kind = next;
    document.querySelectorAll(".type-tab").forEach(b => b.classList.toggle("active", b.dataset.kind === kind));
    $("contentFields").innerHTML = fields[kind];
    $("previewType").textContent = labels[kind];
    $("errorBox").hidden = true;
    if (kind === "whatsapp" && logoChoice === "none") setLogo("whatsapp");
  }
  document.querySelectorAll(".type-tab").forEach(b => b.addEventListener("click", () => setKind(b.dataset.kind)));
  document.querySelectorAll(".format-btn").forEach(b => b.addEventListener("click", () => {
    format = b.dataset.format;
    document.querySelectorAll(".format-btn").forEach(x => x.classList.toggle("active", x === b));
  }));
  function syncColors() {
    $("fgHex").textContent = $("fgColor").value.toUpperCase();
    $("bgHex").textContent = $("bgColor").value.toUpperCase();
  }
  $("fgColor").addEventListener("input", syncColors);
  $("bgColor").addEventListener("input", () => { $("socialTheme").value = "classic"; syncColors(); });
  $("fgColor").addEventListener("input", () => { $("socialTheme").value = "classic"; syncColors(); });

  const socialThemes = {
    classic: ["#17152c", "#ffffff"],
    instagram: ["#8a2387", "#fff4fb"],
    whatsapp: ["#075e54", "#eafff3"],
    facebook: ["#1877f2", "#f2f7ff"],
    google: ["#4285f4", "#ffffff"],
    youtube: ["#cc0000", "#fff5f5"],
    tiktok: ["#111111", "#e6fffb"],
    linkedin: ["#0a66c2", "#f1f7ff"],
    x: ["#000000", "#ffffff"],
    telegram: ["#229ed9", "#f0faff"],
    snapchat: ["#111111", "#fffde5"],
    pinterest: ["#bd081c", "#fff5f6"]
  };
  $("socialTheme").addEventListener("change", () => {
    const colors = socialThemes[$("socialTheme").value] || socialThemes.classic;
    $("fgColor").value = colors[0];
    $("bgColor").value = colors[1];
    syncColors();
    const t = $("socialTheme").value;
    setLogo(t === "classic" ? "none" : t);
  });

  $("sampleBtn").addEventListener("click", () => {
    const sample = {url:{url:"https://example.com"},text:{text:"Hello! Thanks for scanning this QR code."},email:{email:"hello@example.com",subject:"Hello",body:"I scanned your QR code."},phone:{phone:"+15551234567"},sms:{sms_phone:"+15551234567",sms_message:"Hello!"},wifi:{ssid:"Guest Wi-Fi",password:"welcome123",security:"WPA"},vcard:{v_name:"Alex Morgan",v_phone:"+15551234567",v_email:"alex@example.com",v_org:"Hub"},whatsapp:{wa_phone:"919876543210",wa_message:"Hello! I scanned your QR."},location:{latitude:"19.0760",longitude:"72.8777"},event:{event_title:"Community Meetup",event_start:"2026-12-12T10:00",event_end:"2026-12-12T12:00",event_location:"Pune, India"},pdf:{pdf_url:"https://example.com/sample.pdf"}};
    Object.entries(sample[kind]).forEach(([name,value]) => {const el = document.querySelector(`[name="${name}"]`);if(el){if(el.type==="checkbox")el.checked=true;else el.value=value;}});
  });

  function collect() {
    const onTpl = tplOn();
    const data = {kind, size:onTpl ? 1024 : $("qrSize").value, foreground:$("fgColor").value, background:$("bgColor").value, error_level:$("errorLevel").value, border:$("border").value, format:onTpl ? "png" : format, logo:logoChoice};
    if (logoChoice === "custom") data.logo_data = logoData;
    data.password = $("pwOn").checked ? $("pwInput").value : "";
    document.querySelectorAll("#contentFields [name]").forEach(el => {
      data[el.name] = el.type === "checkbox" ? el.checked : el.value.trim();
    });
    return data;
  }
  function showError(message) {
    $("errorBox").textContent = message;
    $("errorBox").hidden = false;
  }
  async function generate() {
    const button = $("generateBtn");
    button.disabled = true;
    button.innerHTML = '<span class="generate-icon">◌</span> Creating your QR code…';
    $("errorBox").hidden = true;
    $("noteBox").hidden = true;
    if ($("pwOn").checked && ($("pwInput").value.length < 4 || $("pwInput").value.length > 64)) {
      showError("Password must be 4 to 64 characters.");
      button.disabled = false;
      button.innerHTML = '<span class="generate-icon">▦</span> Generate QR code <span class="btn-arrow">→</span>';
      return;
    }
    try {
      const response = await fetch("/api/qr", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(collect())});
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Could not generate QR code.");
      }
      const notice = response.headers.get("X-KwikQR-Notice");
      if (notice) { $("noteBox").textContent = notice; $("noteBox").hidden = false; }
      const blob = await response.blob();
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      currentBlob = blob;
      currentUrl = URL.createObjectURL(blob);
      $("qrPreview").src = currentUrl;
      $("qrPreview").hidden = false;
      $("qrPlaceholder").hidden = true;
      $("downloadBtn").disabled = false;
      $("previewType").textContent = labels[kind];
      $("previewSize").textContent = format === "png" ? `${$("qrSize").value} × ${$("qrSize").value} px` : "Scalable vector";
      await renderCard();
    } catch (err) {
      showError(err.message || "Something went wrong. Please try again.");
    } finally {
      button.disabled = false;
      button.innerHTML = '<span class="generate-icon">▦</span> Generate QR code <span class="btn-arrow">→</span>';
    }
  }
  $("generateBtn").addEventListener("click", generate);
  $("downloadBtn").addEventListener("click", () => {
    if (!currentBlob) return;
    const save = (href, name) => {const a = document.createElement("a");a.href = href;a.download = name;document.body.appendChild(a);a.click();a.remove();};
    if (tplOn() && cardReady) {
      $("cardPreview").toBlob(b => {const u = URL.createObjectURL(b);save(u, `kwikqr-${tplState.preset || "card"}-card.png`);setTimeout(() => URL.revokeObjectURL(u), 4000);}, "image/png");
      return;
    }
    save(currentUrl, `kwikqr-${kind}.${format}`);
  });
  $("qrSize").addEventListener("change", () => {
    $("previewSize").textContent = `${$("qrSize").value} × ${$("qrSize").value} px`;
  });
  const menu = document.querySelector(".mobile-menu");
  menu.addEventListener("click", () => {
    const nav = document.querySelector(".main-nav");
    nav.style.display = nav.style.display === "flex" ? "none" : "flex";
    nav.style.position = "absolute";nav.style.top = "66px";nav.style.left = "0";nav.style.right = "0";
    nav.style.padding = "14px 22px";nav.style.background = "#fff";nav.style.flexDirection = "column";nav.style.gap = "5px";
  });

  /* ===================== Center logo picker ===================== */
  const LOGOS = [["instagram","Instagram"],["whatsapp","WhatsApp"],["telegram","Telegram"],["facebook","Facebook"],["youtube","YouTube"],["x","X"],["linkedin","LinkedIn"],["tiktok","TikTok"],["snapchat","Snapchat"],["pinterest","Pinterest"],["google","Google"]];
  let logoChoice = "none", logoData = null;

  function buildLogoPicker() {
    const box = $("logoPicker");
    let html = `<button type="button" class="logo-opt" data-logo="none" role="radio" title="No logo">None</button>`;
    LOGOS.forEach(([k, n]) => { html += `<button type="button" class="logo-opt" data-logo="${k}" role="radio" title="${n}" aria-label="${n}"><img src="/api/logo/${k}.svg?size=120" alt="" width="30" height="30"></button>`; });
    html += `<button type="button" class="logo-opt upload" data-logo="custom" role="radio" title="Upload your own logo"><span id="logoUploadLabel">＋ Upload</span></button>`;
    box.innerHTML = html;
    box.addEventListener("click", e => {
      const b = e.target.closest(".logo-opt"); if (!b) return;
      if (b.dataset.logo === "custom") { if (logoData) setLogo("custom"); else $("logoFile").click(); return; }
      setLogo(b.dataset.logo);
    });
    refreshLogoPicker();
  }
  function refreshLogoPicker() {
    document.querySelectorAll("#logoPicker .logo-opt").forEach(b => {
      const on = b.dataset.logo === logoChoice; b.classList.toggle("active", on); b.setAttribute("aria-checked", on);
    });
    const lbl = $("logoUploadLabel");
    if (lbl) lbl.innerHTML = logoData ? `<img src="${logoData}" alt="" width="30" height="30">` : "＋ Upload";
  }
  function setLogo(choice) { logoChoice = choice; refreshLogoPicker(); }

  // Downscale an uploaded image so it stays small and safe to send.
  function fileToDataUrl(file, maxPx) {
    return new Promise((resolve, reject) => {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error("Please choose a PNG, JPG or WebP image."));
      if (file.size > 5 * 1024 * 1024) return reject(new Error("That image is larger than 5 MB."));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read that image."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Could not read that image."));
        img.onload = () => {
          const k = Math.min(1, maxPx / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/png"));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  $("logoFile").addEventListener("change", async e => {
    const f = e.target.files[0]; e.target.value = ""; if (!f) return;
    try { logoData = await fileToDataUrl(f, 512); setLogo("custom"); $("errorBox").hidden = true; }
    catch (err) { showError(err.message); }
  });

  /* ===================== Template designer ===================== */
  const T = id => $(id);
  const tplState = { preset: "google", biz: null, bizName: "" };
  let cardReady = false, renderTok = 0;
  const tplOn = () => $("tplOn").checked;

  const PRESETS = {
    google:        {name:"Google Review",   badge:"google",    layout:"landscape", font:"modern",  border:"google",   bg:"#ffffff", text:"#111827", accent:"#4285f4", accent2:"#ea4335", stars:5, kicker:"Make our day,", headline:"Review us on Google", caption:"Scan the code with your phone's camera and give us feedback on Google.", footer:"", handle:""},
    googlePoster:  {name:"Review Poster",   badge:"google",    layout:"poster",    font:"elegant", border:"gradient", bg:"#ffffff", text:"#1f2937", accent:"#ea4335", accent2:"#4285f4", stars:5, kicker:"Please", headline:"Leave a review", caption:"Scan the code with your phone's camera to give feedback on Google.", footer:"Thank you!", handle:""},
    instagram:     {name:"Instagram Tag",   badge:"instagram", layout:"tag",       font:"modern",  border:"gradient", bg:"#ffffff", text:"#262626", accent:"#d62976", accent2:"#fa7e1e", stars:0, kicker:"", headline:"Follow us", caption:"", footer:"", handle:"@yourchannel"},
    whatsapp:      {name:"WhatsApp Chat",   badge:"whatsapp",  layout:"poster",    font:"bold",    border:"solid",    bg:"#effff5", text:"#0b3d2e", accent:"#25d366", accent2:"#128c7e", stars:0, kicker:"Say hello", headline:"Chat with us on WhatsApp", caption:"Scan the code to start a conversation.", footer:"We reply fast!", handle:""},
    facebook:      {name:"Facebook Page",   badge:"facebook",  layout:"poster",    font:"bold",    border:"solid",    bg:"#f2f7ff", text:"#0f2a52", accent:"#1877f2", accent2:"#42a5f5", stars:0, kicker:"", headline:"Like our Facebook page", caption:"Scan to follow us for news and offers.", footer:"See you there!", handle:""},
    youtube:       {name:"YouTube Subscribe",badge:"youtube",  layout:"landscape", font:"bold",    border:"solid",    bg:"#ffffff", text:"#111111", accent:"#ff0000", accent2:"#cc0000", stars:0, kicker:"Don't miss a video,", headline:"Subscribe to our channel", caption:"Scan the code to watch and subscribe on YouTube.", footer:"", handle:""},
    telegram:      {name:"Telegram Join",   badge:"telegram",  layout:"tag",       font:"modern",  border:"gradient", bg:"#f0faff", text:"#0f3a52", accent:"#229ed9", accent2:"#37aee2", stars:0, kicker:"", headline:"Join our channel", caption:"", footer:"", handle:"@yourchannel"},
    linkedin:      {name:"LinkedIn Connect",badge:"linkedin",  layout:"poster",    font:"elegant", border:"double",   bg:"#ffffff", text:"#0f2740", accent:"#0a66c2", accent2:"#0a66c2", stars:0, kicker:"Let's connect", headline:"Find me on LinkedIn", caption:"Scan to view my profile and connect.", footer:"", handle:""},
    tiktok:        {name:"TikTok Dark",     badge:"tiktok",    layout:"tag",       font:"bold",    border:"gradient", bg:"#0d0d12", text:"#ffffff", accent:"#25f4ee", accent2:"#fe2c55", stars:0, kicker:"", headline:"Follow us on TikTok", caption:"", footer:"", handle:"@yourchannel"},
    wifi:          {name:"Guest Wi-Fi",     badge:"none",      layout:"poster",    font:"modern",  border:"solid",    bg:"#17152c", text:"#ffffff", accent:"#a78bfa", accent2:"#6848d9", stars:0, kicker:"Stay connected", headline:"Scan to join our Wi-Fi", caption:"Point your camera at the code — no password to type.", footer:"Enjoy your stay", handle:""},
    menu:          {name:"Digital Menu",    badge:"none",      layout:"poster",    font:"elegant", border:"double",   bg:"#fbf6ec", text:"#3b2a1a", accent:"#b8893b", accent2:"#b8893b", stars:0, kicker:"Today's specials", headline:"Scan to view our menu", caption:"Order at your table — fresh, simple, delicious.", footer:"Bon appétit", handle:""},
    business:      {name:"Thank You Card",  badge:"google",    layout:"poster",    font:"script",  border:"none",     bg:"#ffffff", text:"#222222", accent:"#c08a5a", accent2:"#c08a5a", stars:5, kicker:"", headline:"thanks for your business!", caption:"Impressed with our products or services? Scan this code and make our day by leaving us a 5 star review.", footer:"", handle:""}
  };

  function buildTemplateUi() {
    let html = "";
    Object.entries(PRESETS).forEach(([id, p]) => {
      const icon = p.badge !== "none" ? `<img src="/api/logo/${p.badge}.svg?size=80" alt="">` : "";
      html += `<button type="button" class="tpl-card" data-preset="${id}" role="radio"><div class="tpl-thumb" style="background:${p.bg};color:${p.text};box-shadow:inset 0 0 0 3px ${p.accent}">${icon}</div><b>${p.name}</b></button>`;
    });
    $("tplPresets").innerHTML = html;
    $("tplBadge").innerHTML = `<option value="none">None</option>` + LOGOS.map(([k, n]) => `<option value="${k}">${n}</option>`).join("");
    $("tplPresets").addEventListener("click", e => { const b = e.target.closest(".tpl-card"); if (b) applyPreset(b.dataset.preset); });
  }
  function syncTplHex() { ["Bg","Text","Accent","Accent2"].forEach(n => { $("tpl" + n + "Hex").textContent = $("tpl" + n).value.toUpperCase(); }); }
  function applyPreset(id) {
    const p = PRESETS[id]; if (!p) return;
    tplState.preset = id;
    document.querySelectorAll(".tpl-card").forEach(b => { const on = b.dataset.preset === id; b.classList.toggle("active", on); b.setAttribute("aria-checked", on); });
    $("tplLayout").value = p.layout; $("tplFont").value = p.font; $("tplBorder").value = p.border;
    $("tplKicker").value = p.kicker; $("tplHeadline").value = p.headline; $("tplCaption").value = p.caption;
    $("tplFooter").value = p.footer; $("tplHandle").value = p.handle;
    $("tplBg").value = p.bg; $("tplText").value = p.text; $("tplAccent").value = p.accent; $("tplAccent2").value = p.accent2;
    $("tplBadge").value = p.badge; $("tplStars").value = String(p.stars);
    syncTplHex(); scheduleRender();
  }
  function readTpl() {
    return {
      layout: $("tplLayout").value, font: $("tplFont").value, border: $("tplBorder").value,
      kicker: $("tplKicker").value.trim(), headline: $("tplHeadline").value.trim(), caption: $("tplCaption").value.trim(),
      footer: $("tplFooter").value.trim(), handle: $("tplHandle").value.trim(),
      bg: $("tplBg").value, text: $("tplText").value, accent: $("tplAccent").value, accent2: $("tplAccent2").value,
      badge: $("tplBadge").value, stars: parseInt($("tplStars").value, 10) || 0, radius: parseInt($("tplRadius").value, 10),
      panel: $("tplPanel").value === "1", biz: tplState.biz
    };
  }

  // ---- image + font helpers ----
  const imgCache = new Map();
  function loadImg(src, cache) {
    if (cache && imgCache.has(src)) return imgCache.get(src);
    const p = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    if (cache) imgCache.set(src, p);
    return p;
  }
  async function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return;
    try { await Promise.all(['800 40px Manrope','700 40px "Playfair Display"','400 40px "Great Vibes"','800 40px "DM Sans"','500 30px "DM Sans"'].map(f => document.fonts.load(f, "Aa"))); } catch (e) {}
  }
  const HEAD = {
    modern:  {fam:'Manrope, "DM Sans", sans-serif', w:800, k:1},
    elegant: {fam:'"Playfair Display", Georgia, serif', w:700, k:1},
    script:  {fam:'"Great Vibes", cursive', w:400, k:1.55},
    bold:    {fam:'"DM Sans", sans-serif', w:800, k:1.05}
  };
  const SCRIPT = '"Great Vibes", cursive';
  const BODY = '"DM Sans", sans-serif';

  function rr(ctx, x, y, w, h, r) {
    const R = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath(); ctx.moveTo(x + R, y); ctx.arcTo(x + w, y, x + w, y + h, R); ctx.arcTo(x + w, y + h, x, y + h, R);
    ctx.arcTo(x, y + h, x, y, R); ctx.arcTo(x, y, x + w, y, R); ctx.closePath();
  }
  function wrapText(ctx, text, maxW) {
    const out = [];
    String(text).split(/\n/).forEach(par => {
      let line = "";
      par.split(/\s+/).filter(Boolean).forEach(word => {
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; } else line = test;
      });
      if (line) out.push(line);
    });
    return out;
  }
  function star(ctx, cx, cy, R, color) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.45 : R;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    ctx.lineJoin = "round"; ctx.lineWidth = R * 0.12; ctx.strokeStyle = color; ctx.stroke();
  }
  function starsRow(ctx, count, cx, y, size, dry) {
    if (!count) return 0;
    const gap = size * 0.28, total = count * size + (count - 1) * gap;
    if (!dry) for (let i = 0; i < count; i++) star(ctx, cx - total / 2 + size / 2 + i * (size + gap), y + size / 2, size / 2, "#FBBC05");
    return size;
  }
  // Draws text in a block; returns height used. Baseline is "top".
  function textBlock(ctx, text, x, y, o, dry) {
    if (!text) return 0;
    ctx.font = `${o.weight} ${o.size}px ${o.fam}`; ctx.textBaseline = "top"; ctx.textAlign = o.align || "center";
    const lines = wrapText(ctx, o.upper ? text.toUpperCase() : text, o.maxW);
    const lh = o.size * (o.lh || 1.2);
    if (!dry) { ctx.fillStyle = o.color; ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh)); ctx.globalAlpha = 1; }
    return lines.length * lh;
  }
  function drawQr(ctx, im, x, y, size, t, dry) {
    const pad = t.panel ? size * 0.07 : 0, full = size + pad * 2;
    if (!dry) {
      if (t.panel) { ctx.save(); ctx.shadowColor = "rgba(20,15,50,.18)"; ctx.shadowBlur = size * 0.05; ctx.shadowOffsetY = size * 0.015; ctx.fillStyle = "#fff"; rr(ctx, x, y, full, full, full * 0.07); ctx.fill(); ctx.restore(); }
      ctx.imageSmoothingEnabled = size < im.qr.width; ctx.imageSmoothingQuality = "high";
      if (!t.panel) { ctx.save(); rr(ctx, x, y, size, size, size * 0.04); ctx.clip(); }
      ctx.drawImage(im.qr, x + pad, y + pad, size, size);
      if (!t.panel) ctx.restore();
    }
    return full;
  }
  function circleImage(ctx, img, cx, cy, r) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.fillStyle = "#fff"; ctx.fill(); ctx.clip();
    const k = Math.max((r * 2) / img.width, (r * 2) / img.height) , w = img.width * k, h = img.height * k;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h); ctx.restore();
    ctx.lineWidth = r * 0.06; ctx.strokeStyle = "rgba(0,0,0,.12)"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  }

  // ---- frame (background + border) ----
  function frame(ctx, W, H, t) {
    const r = t.radius * Math.min(W, H) / 450, bw = Math.round(Math.min(W, H) * 0.014);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = t.bg; rr(ctx, 0, 0, W, H, r); ctx.fill();
    const ring = (inset, width, paint) => {
      ctx.save();
      const p = new Path2D();
      const add = (x, y, w, h, rad) => { const R = Math.max(0, Math.min(rad, w / 2, h / 2)); p.moveTo(x + R, y); p.arcTo(x + w, y, x + w, y + h, R); p.arcTo(x + w, y + h, x, y + h, R); p.arcTo(x, y + h, x, y, R); p.arcTo(x, y, x + w, y, R); p.closePath(); };
      add(inset, inset, W - inset * 2, H - inset * 2, Math.max(r - inset, 0));
      add(inset + width, inset + width, W - (inset + width) * 2, H - (inset + width) * 2, Math.max(r - inset - width, 0));
      ctx.clip(p, "evenodd"); ctx.fillStyle = paint; ctx.fillRect(0, 0, W, H); ctx.restore();
    };
    if (t.border === "solid") ring(0, bw, t.accent);
    else if (t.border === "double") { ring(0, bw * 0.55, t.accent); ring(bw * 1.5, bw * 0.3, t.accent); }
    else if (t.border === "gradient") { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, t.accent); g.addColorStop(1, t.accent2); ring(0, bw, g); }
    else if (t.border === "google") {
      let paint = t.accent;
      if (ctx.createConicGradient) {
        const th = Math.atan2(H, W), full = Math.PI * 2, a = th / full * 2, g = ctx.createConicGradient(-th, W / 2, H / 2);
        const stops = [["#4285F4", 0, a], ["#34A853", a, .5], ["#FBBC05", .5, .5 + a], ["#EA4335", .5 + a, 1]];
        stops.forEach(([c, s, e]) => { g.addColorStop(Math.min(s, 1), c); g.addColorStop(Math.min(e, 1), c); });
        paint = g;
      }
      ring(0, bw * 1.15, paint);
    }
    return r;
  }

  // ---- layouts ----
  function layoutVertical(ctx, t, im, W, dry, o) {
    const p = W * 0.09, cx = W / 2, maxW = W - p * 2, H = HEAD[t.font];
    let y = o.top;
    if (im.biz) { const r = W * 0.085; if (!dry) circleImage(ctx, im.biz, cx, y + r, r); y += r * 2 + W * 0.04; }
    y += textBlock(ctx, t.kicker, cx, y, {fam: SCRIPT, weight: 400, size: W * 0.09, color: t.text, maxW, lh: 1.15}, dry);
    y += textBlock(ctx, t.headline, cx, y, {fam: H.fam, weight: H.w, size: W * 0.068 * H.k, color: t.text, maxW, lh: 1.15}, dry) + W * 0.04;
    y += drawQr(ctx, im, cx - (W * o.qr) / 2 - (t.panel ? W * o.qr * 0.07 : 0), y, W * o.qr, t, dry) + W * 0.04;
    y += textBlock(ctx, t.caption, cx, y, {fam: BODY, weight: 500, size: W * 0.031, color: t.text, alpha: .78, maxW: maxW * .92, lh: 1.5}, dry) + (t.caption ? W * 0.035 : 0);
    if (im.badge) { const s = W * 0.1; if (!dry) ctx.drawImage(im.badge, cx - s / 2, y, s, s); y += s + W * 0.03; }
    if (t.stars) y += starsRow(ctx, t.stars, cx, y, W * 0.058, dry) + W * 0.035;
    y += textBlock(ctx, t.handle, cx, y, {fam: BODY, weight: 800, size: W * 0.04, color: t.text, maxW, lh: 1.2}, dry) + (t.handle ? W * 0.015 : 0);
    y += textBlock(ctx, t.footer, cx, y, {fam: SCRIPT, weight: 400, size: W * 0.085, color: t.accent, maxW, lh: 1.15}, dry);
    return Math.max(y + W * 0.075, o.minH);
  }
  function layoutLandscape(ctx, t, im, W, H, dry, y0) {
    const p = 100, panel = 560 + (t.panel ? 560 * 0.14 : 0), gap = 70, colW = W - p * 2 - panel - gap, hf = HEAD[t.font];
    let y = y0;
    y += textBlock(ctx, t.kicker, p, y, {fam: SCRIPT, weight: 400, size: 78, color: t.text, maxW: colW, align: "left", lh: 1.1}, dry);
    y += textBlock(ctx, t.headline, p, y, {fam: hf.fam, weight: hf.w, size: 82 * hf.k, color: t.text, maxW: colW, align: "left", lh: 1.12}, dry) + 24;
    if (t.stars) y += starsRow(ctx, t.stars, p + (t.stars * 62 + (t.stars - 1) * 17) / 2, y, 62, dry) + 26;
    y += textBlock(ctx, t.caption, p, y, {fam: BODY, weight: 500, size: 30, color: t.text, alpha: .78, maxW: colW, align: "left", lh: 1.45}, dry) + (t.caption ? 22 : 0);
    let rowH = 0;
    if (im.badge) { if (!dry) ctx.drawImage(im.badge, p, y, 84, 84); rowH = 84; }
    if (t.handle) { const hx = p + (im.badge ? 108 : 0); ctx.font = `800 36px ${BODY}`; if (!dry) { ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = t.text; ctx.fillText(t.handle, hx, y + (rowH || 40) / 2); } rowH = Math.max(rowH, 44); }
    y += rowH ? rowH + 14 : 0;
    y += textBlock(ctx, t.footer, p, y, {fam: SCRIPT, weight: 400, size: 66, color: t.accent, maxW: colW, align: "left", lh: 1.1}, dry);
    return y - y0;
  }

  function draw(canvas, t, im) {
    const sc = document.createElement("canvas").getContext("2d"), ctx = canvas.getContext("2d");
    let W, H;
    if (t.layout === "landscape") {
      W = 1500; const blockH = layoutLandscape(sc, t, im, W, 0, true, 0);
      H = Math.max(860, Math.round(blockH + 220));
      canvas.width = W; canvas.height = H;
      frame(ctx, W, H, t);
      layoutLandscape(ctx, t, im, W, H, false, Math.round((H - blockH) / 2));
      const panel = 560 + (t.panel ? 560 * 0.14 : 0);
      drawQr(ctx, im, W - 100 - panel, Math.round((H - panel) / 2), 560, t, false);
    } else {
      const tag = t.layout === "tag";
      W = tag ? 900 : 1080;
      const o = {top: tag ? 210 : (im.biz ? 110 : 120), qr: tag ? 0.62 : 0.56, minH: tag ? W * 1.3 : W * 1.3};
      H = Math.round(layoutVertical(sc, t, im, W, true, o));
      canvas.width = W; canvas.height = H;
      frame(ctx, W, H, t);
      layoutVertical(ctx, t, im, W, false, o);
      if (tag) {
        const hr = W * 0.038, hy = W * 0.095;
        ctx.save(); ctx.fillStyle = t.accent; ctx.beginPath(); ctx.arc(W / 2, hy, hr + W * 0.014, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.arc(W / 2, hy, hr, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }
    return [canvas.width, canvas.height];
  }

  let rafId = 0;
  function scheduleRender() { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(() => renderCard()); }
  async function renderCard() {
    const stage = document.querySelector(".preview-stage"), canvas = $("cardPreview");
    if (!tplOn() || !currentUrl) {
      cardReady = false; canvas.hidden = true; stage.classList.remove("has-card");
      if (currentUrl) $("previewSize").textContent = format === "png" ? `${$("qrSize").value} × ${$("qrSize").value} px` : "Scalable vector";
      return;
    }
    const tok = ++renderTok, t = readTpl();
    try {
      await ensureFonts();
      const [qr, badge, biz] = await Promise.all([
        loadImg(currentUrl, false),
        t.badge !== "none" ? loadImg(`/api/logo/${t.badge}.svg?size=512`, true) : null,
        t.biz ? loadImg(t.biz, true) : null
      ]);
      if (tok !== renderTok) return;
      const [w, h] = draw(canvas, t, {qr, badge, biz});
      canvas.hidden = false; stage.classList.add("has-card"); cardReady = true;
      $("previewSize").textContent = `${w} × ${h} px card`;
    } catch (err) { cardReady = false; showError("Could not draw the template. Please try again."); }
  }

  function initTemplates() {
    buildTemplateUi();
    $("tplOn").addEventListener("change", () => {
      $("templatePanel").hidden = !tplOn();
      if (tplOn() && !tplState.applied) { tplState.applied = true; applyPreset("google"); }
      if (currentBlob) generate(); else scheduleRender();   // regenerate at the right resolution
    });
    ["tplLayout","tplFont","tplBorder","tplKicker","tplHeadline","tplCaption","tplFooter","tplHandle","tplBg","tplText","tplAccent","tplAccent2","tplBadge","tplStars","tplRadius","tplPanel"]
      .forEach(id => { $(id).addEventListener("input", () => { syncTplHex(); scheduleRender(); }); $(id).addEventListener("change", () => { syncTplHex(); scheduleRender(); }); });
    $("tplLogoBtn").addEventListener("click", () => $("tplLogoFile").click());
    $("tplLogoFile").addEventListener("change", async e => {
      const f = e.target.files[0]; e.target.value = ""; if (!f) return;
      try { tplState.biz = await fileToDataUrl(f, 600); $("tplLogoName").textContent = f.name; $("tplLogoClear").hidden = false; scheduleRender(); }
      catch (err) { showError(err.message); }
    });
    $("tplLogoClear").addEventListener("click", () => { tplState.biz = null; $("tplLogoName").textContent = "No logo"; $("tplLogoClear").hidden = true; scheduleRender(); });
    syncTplHex();
  }

  $("pwOn").addEventListener("change", () => { $("pwPanel").hidden = !$("pwOn").checked; if ($("pwOn").checked) $("pwInput").focus(); });
  $("pwEye").addEventListener("click", () => {
    const show = $("pwInput").type === "password";
    $("pwInput").type = show ? "text" : "password"; $("pwEye").textContent = show ? "Hide" : "Show";
  });
  buildLogoPicker();
  initTemplates();
  setKind("url");
})();