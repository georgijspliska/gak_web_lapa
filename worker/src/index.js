/* ==========================================================
   Contact form handler
   POST multipart/form-data -> email, via the send_email binding.
   Edit the three constants below and you're done.
   ========================================================== */

const MAIL_TO   = "georgijspliska@gmail.com";        // must be a verified destination address
const MAIL_FROM = "form@georgijs.com";       // must be on a domain onboarded to Email Service
const ORIGIN    = "https://georgijs.com";    // only needed if the Worker is on another origin

const LIMITS = { name: 200, email: 254, message: 5000 };

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors() });
    }
    if (request.method !== "POST") {
      return reply({ ok: false, error: "Method not allowed" }, 405);
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return reply({ ok: false, error: "Malformed request" }, 400);
    }

    // Honeypot. Bots fill it, people can't see it. Answer 200 so they
    // don't learn anything from the response.
    if (field(form, "_gotcha")) return reply({ ok: true });

    const name    = field(form, "name",    LIMITS.name);
    const email   = field(form, "email",   LIMITS.email);
    const message = field(form, "message", LIMITS.message);

    if (!name || !message || !looksLikeEmail(email)) {
      return reply({ ok: false, error: "Missing or invalid fields" }, 400);
    }

    // Turnstile — only enforced if you've set the secret.
    if (env.TURNSTILE_SECRET) {
      const passed = await verifyTurnstile(
        field(form, "cf-turnstile-response"),
        env.TURNSTILE_SECRET,
        request.headers.get("CF-Connecting-IP")
      );
      if (!passed) return reply({ ok: false, error: "Verification failed" }, 403);
    }

    try {
      await env.EMAIL.send({
        to: MAIL_TO,
        from: { email: MAIL_FROM, name: "Website form" },
        replyTo: { email, name },          // hitting reply goes straight to the sender
        subject: `Site enquiry \u2014 ${name}`,
        text:
          `From: ${name} <${email}>\n` +
          `\n${message}\n` +
          `\n\u2014\nSent from the contact form at ${ORIGIN}`
      });
    } catch (err) {
      console.error("send_email failed:", err);
      return reply({ ok: false, error: "Could not send" }, 502);
    }

    return reply({ ok: true });
  }
};

/* ---------- helpers ---------- */

function field(form, key, max) {
  const v = form.get(key);
  if (typeof v !== "string") return "";
  const trimmed = v.trim();
  return max ? trimmed.slice(0, max) : trimmed;
}

function looksLikeEmail(v) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v);
}

async function verifyTurnstile(token, secret, ip) {
  if (!token) return false;
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body }
    );
    const out = await res.json();
    return out.success === true;
  } catch {
    return false;
  }
}

function cors() {
  return {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400"
  };
}

function reply(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...cors() }
  });
}
