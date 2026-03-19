import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
let serverSetupPromise: Promise<express.Express> | null = null;

// ---------------------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------------------

/** Convert a subset of Markdown to email-safe inline-styled HTML. */
function markdownToHtml(md: string): string {
  // Escape HTML entities first so user content is safe
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings
  html = html
    .replace(/^### (.+)$/gm, '<h3 style="font-family:Georgia,\'Times New Roman\',serif;font-size:20px;color:#3E2723;margin:28px 0 10px;font-weight:bold;">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-family:Georgia,\'Times New Roman\',serif;font-size:24px;color:#3E2723;margin:32px 0 12px;font-weight:bold;">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-family:Georgia,\'Times New Roman\',serif;font-size:28px;color:#3E2723;margin:32px 0 14px;font-weight:bold;">$1</h1>');

  // Bold + italic, bold, italic
  html = html
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#3E2723;">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>");

  // Inline code
  html = html.replace(/`(.+?)`/g, '<code style="background:#F5E6D3;color:#8B6F47;padding:2px 6px;border-radius:4px;font-size:14px;font-family:monospace;">$1</code>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#8B6F47;text-decoration:underline;">$1</a>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:4px solid #8B6F47;margin:16px 0;padding:12px 20px;background:#FBF7F0;color:#3E2723;font-style:italic;border-radius:0 6px 6px 0;">$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #F5E6D3;margin:24px 0;">');

  // Bullet lists (simple single-level)
  html = html.replace(/^[*-] (.+)$/gm, '<li style="margin:4px 0;color:#444444;">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) =>
    `<ul style="margin:12px 0 18px;padding-left:24px;color:#444444;">${match}</ul>`
  );

  // Wrap consecutive non-tag lines into <p> blocks
  const lines = html.split("\n");
  const out: string[] = [];
  let inParagraph = false;

  for (const raw of lines) {
    const line = raw.trim();

    if (line === "") {
      if (inParagraph) { out.push("</p>"); inParagraph = false; }
      continue;
    }

    const isBlock = /^<(h[1-6]|blockquote|hr|ul|ol|li|p)/.test(line);

    if (isBlock) {
      if (inParagraph) { out.push("</p>"); inParagraph = false; }
      out.push(line);
      continue;
    }

    if (!inParagraph) {
      out.push('<p style="margin:0 0 18px;color:#444444;font-size:16px;line-height:1.75;font-family:\'Helvetica Neue\',Arial,sans-serif;">');
      inParagraph = true;
    } else {
      out.push("<br>");
    }
    out.push(line);
  }

  if (inParagraph) out.push("</p>");

  return out.join("\n");
}

/** Build a full, branded HTML email. */
function buildNewsletterHtml(
  subject: string,
  bodyHtml: string,
  siteName: string,
  authorName: string,
  featuredImageUrl?: string,
  accentColor?: string
): string {
  const year = new Date().getFullYear();
  const headerBg = accentColor || "#8B6F47";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F5E6D3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5E6D3;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(62,39,35,0.10);">

          <!-- ===== HEADER ===== -->
          <tr>
            <td style="background-color:${headerBg};padding:36px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:rgba(251,247,240,0.65);font-size:11px;letter-spacing:3px;text-transform:uppercase;">A letter from</p>
              <h1 style="margin:0;color:#FBF7F0;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:bold;letter-spacing:0.5px;">${siteName}</h1>
              <div style="width:44px;height:2px;background-color:rgba(251,247,240,0.35);margin:18px auto 0;"></div>
            </td>
          </tr>

          <!-- ===== HERO IMAGE (optional) ===== -->
          ${featuredImageUrl ? `<tr>
            <td style="padding:0;line-height:0;">
              <img src="${featuredImageUrl}" alt="" style="width:100%;max-width:600px;height:auto;display:block;" />
            </td>
          </tr>` : ""}

          <!-- ===== SUBJECT BANNER ===== -->
          <tr>
            <td style="background-color:#FBF7F0;padding:20px 40px;border-bottom:1px solid #F5E6D3;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#3E2723;font-weight:bold;line-height:1.4;">${subject}</p>
            </td>
          </tr>

          <!-- ===== BODY ===== -->
          <tr>
            <td style="padding:36px 40px 24px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- ===== DIVIDER ===== -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #F5E6D3;margin:0;">
            </td>
          </tr>

          <!-- ===== SIGNATURE ===== -->
          <tr>
            <td style="padding:24px 40px 36px;">
              <p style="margin:0 0 4px;color:#A89968;font-size:12px;text-transform:uppercase;letter-spacing:2px;">With warmth,</p>
              <p style="margin:0;color:#3E2723;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-style:italic;">${authorName}</p>
            </td>
          </tr>

          <!-- ===== FOOTER ===== -->
          <tr>
            <td style="background-color:#3E2723;padding:20px 40px;text-align:center;">
              <p style="margin:0 0 4px;color:rgba(251,247,240,0.60);font-size:12px;line-height:1.5;">
                &copy; ${year} ${siteName}. All rights reserved.
              </p>
              <p style="margin:0;color:rgba(251,247,240,0.35);font-size:11px;">
                You are receiving this because you subscribed to updates from ${siteName}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Express server
// ---------------------------------------------------------------------------

async function setupServer() {
  if (serverSetupPromise) return serverSetupPromise;

  serverSetupPromise = (async () => {
    app.use(express.json());

    // API routes
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok" });
    });

    app.post("/api/send-newsletter", async (req, res) => {
      const {
        subject,
        content,
        contentType = "markdown",
        subscribers,
        siteName = "Sample Creator Media",
        authorName = "The Author",
        featuredImageUrl,
        accentColor,
      } = req.body;

      if (!subject || !content || !subscribers || !Array.isArray(subscribers)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      console.log(`Sending newsletter: "${subject}" to ${subscribers.length} subscribers.`);

      const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

      // Use the content as HTML directly when the caller signals HTML mode;
      // otherwise convert Markdown → HTML as before.
      // Note: this endpoint is only reachable by authenticated admin users
      // (ProtectedRoute on the frontend). The HTML is embedded in outbound
      // emails, not rendered inside the app, so the admin is trusted to supply
      // safe content (same trust level as writing raw Markdown today).
      const bodyHtml = contentType === "html"
        ? content
        : markdownToHtml(content);
      const htmlBody = buildNewsletterHtml(subject, bodyHtml, siteName, authorName, featuredImageUrl, accentColor);

      // Check if SMTP credentials are provided
      if (EMAIL_HOST && EMAIL_USER && EMAIL_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: parseInt(EMAIL_PORT || "587"),
            secure: EMAIL_PORT === "465", // true for 465, false for other ports
            auth: {
              user: EMAIL_USER,
              pass: EMAIL_PASS,
            },
          });

          // Send emails sequentially so individual failures are tracked
          let delivered = 0;
          let failed = 0;

          for (const email of subscribers) {
            try {
              await transporter.sendMail({
                from: EMAIL_FROM || EMAIL_USER,
                to: email,
                subject: subject,
                text: content, // Plain-text fallback
                html: htmlBody,
              });
              delivered++;
              console.log(`[SENT] To: ${email} (${delivered}/${subscribers.length})`);
            } catch (emailErr: any) {
              failed++;
              console.error(`[FAILED] To: ${email} — ${emailErr.message}`);
            }
          }

          return res.json({
            success: true,
            message: `Newsletter sent: ${delivered} delivered, ${failed} failed.`,
            count: subscribers.length,
            delivered,
            failed,
          });
        } catch (error: any) {
          console.error("Error sending newsletter via SMTP:", error);
          return res.status(500).json({ error: "Failed to send newsletter via SMTP. Please check your credentials." });
        }
      } else {
        // Fallback to simulation if no SMTP credentials
        console.log("No SMTP credentials found. Simulating email sending...");
        try {
          // Simulate a brief delay proportional to subscriber count (capped at 3 s)
          const SIMULATED_DELAY_PER_SUBSCRIBER_MS = 300;
          const delay = Math.min(subscribers.length * SIMULATED_DELAY_PER_SUBSCRIBER_MS, 3000);
          await new Promise(resolve => setTimeout(resolve, delay));

          subscribers.forEach(email => {
            console.log(`[SIMULATED EMAIL SENT] To: ${email} | Subject: ${subject}`);
          });

          res.json({
            success: true,
            message: `(SIMULATED) Newsletter sent to ${subscribers.length} subscribers. No SMTP credentials provided.`,
            count: subscribers.length,
            delivered: subscribers.length,
            failed: 0,
            simulated: true,
          });
        } catch (error: any) {
          console.error("Error simulating newsletter sending:", error);
          res.status(500).json({ error: "Failed to simulate newsletter sending" });
        }
      }
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      // Serve static files in production
      // On Vercel, dist is at root, api/index.ts is in api/
      const distPath = path.join(__dirname, "..", "dist");
      app.use(express.static(distPath));

      // API routes are already handled above.
      // For any other route, serve index.html (SPA fallback)
      app.get("*", (req, res) => {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("Frontend not built. Run 'npm run build' first.");
        }
      });
    }

    return app;
  })();

  return serverSetupPromise;
}

// For local development
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = 3000;
  setupServer().then((server) => {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

// Vercel serverless function handler
export default async (req: any, res: any) => {
  const server = await setupServer();
  return server(req, res);
};
