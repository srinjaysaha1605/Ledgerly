export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { token } = body;

    if (!token) {
      return res.status(400).json({ success: false, error: "Turnstile verification token is missing." });
    }

    // Default to Cloudflare always-pass testing secret key if TURNSTILE_SECRET_KEY is not defined
    const secretKey = process.env.TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA";

    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);

    const clientIp = req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress;
    if (clientIp) {
      formData.append("remoteip", Array.isArray(clientIp) ? clientIp[0] : clientIp);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const outcome = await response.json();
    if (outcome.success) {
      return res.status(200).json({ success: true, challenge_ts: outcome.challenge_ts });
    } else {
      return res.status(400).json({
        success: false,
        error: "Captcha verification failed. Please verify you are human.",
        details: outcome["error-codes"] || [],
      });
    }
  } catch (err: any) {
    console.warn("[API Error /api/verify-turnstile]", err?.message || err);
    return res.status(200).json({
      success: false,
      fallback: true,
      error: "Temporary verification glitch, please retry.",
    });
  }
}
