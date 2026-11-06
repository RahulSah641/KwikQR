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
  });

  $("sampleBtn").addEventListener("click", () => {
    const sample = {url:{url:"https://example.com"},text:{text:"Hello! Thanks for scanning this QR code."},email:{email:"hello@example.com",subject:"Hello",body:"I scanned your QR code."},phone:{phone:"+15551234567"},sms:{sms_phone:"+15551234567",sms_message:"Hello!"},wifi:{ssid:"Guest Wi-Fi",password:"welcome123",security:"WPA"},vcard:{v_name:"Alex Morgan",v_phone:"+15551234567",v_email:"alex@example.com",v_org:"Studio"},whatsapp:{wa_phone:"919876543210",wa_message:"Hello! I scanned your QR."},location:{latitude:"19.0760",longitude:"72.8777"},event:{event_title:"Community Meetup",event_start:"2026-12-12T10:00",event_end:"2026-12-12T12:00",event_location:"Pune, India"},pdf:{pdf_url:"https://example.com/sample.pdf"}};
    Object.entries(sample[kind]).forEach(([name,value]) => {const el = document.querySelector(`[name="${name}"]`);if(el){if(el.type==="checkbox")el.checked=true;else el.value=value;}});
  });

  function collect() {
    const data = {kind, size:$("qrSize").value, foreground:$("fgColor").value, background:$("bgColor").value, error_level:$("errorLevel").value, border:$("border").value, format};
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
    try {
      const response = await fetch("/api/qr", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(collect())});
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Could not generate QR code.");
      }
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
    const a = document.createElement("a");
    a.href = currentUrl;
    a.download = `kwikqr-${kind}.${format}`;
    document.body.appendChild(a);a.click();a.remove();
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
  setKind("url");
})();