/**
 * Newsletter Alert Service
 *
 * Sends location-based disaster alerts to subscribers
 */

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  distanceKm: number;
}

interface DisasterAlert {
  eventId: string;
  title: string;
  type: string;
  severity: string;
  location: {
    latitude: number;
    longitude: number;
    locality?: string;
    country?: string;
  };
  articleUrl?: string;
}

interface EmailProvider {
  send(to: string, subject: string, html: string): Promise<void>;
}

/**
 * Send immediate alerts to subscribers near a disaster
 */
export async function sendDisasterAlerts(
  disaster: DisasterAlert,
  subscribers: Subscriber[],
  emailProvider: EmailProvider,
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    try {
      const subject = buildAlertSubject(disaster);
      const html = buildAlertEmail(disaster, subscriber);

      await emailProvider.send(subscriber.email, subject, html);
      sent++;
    } catch (error) {
      console.error(
        `Failed to send alert to ${subscriber.email}:`,
        (error as Error).message,
      );
      failed++;
    }
  }

  return { sent, failed };
}

function buildAlertSubject(disaster: DisasterAlert): string {
  const severityEmoji: Record<string, string> = {
    minor: "⚠️",
    moderate: "🟡",
    severe: "🟠",
    catastrophic: "🔴",
  };

  const emoji = severityEmoji[disaster.severity] || "⚠️";
  const location =
    disaster.location.locality || disaster.location.country || "your area";

  return `${emoji} ${disaster.type.toUpperCase()} Alert: ${disaster.title} near ${location}`;
}

function buildAlertEmail(
  disaster: DisasterAlert,
  subscriber: Subscriber,
): string {
  const location =
    [disaster.location.locality, disaster.location.country]
      .filter(Boolean)
      .join(", ") || "Unknown location";

  const distanceText =
    subscriber.distanceKm < 1
      ? "less than 1 km"
      : `${Math.round(subscriber.distanceKm)} km`;

  const greeting = subscriber.name ? `Hi ${subscriber.name},` : "Hello,";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Disaster Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0a0f1a; color: #f0f9ff; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 24px; color: white; }
    .content { background: #1e293b; padding: 30px; border-radius: 0 0 12px 12px; }
    .alert-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .severity-severe, .severity-catastrophic { background: #ef4444; color: white; }
    .severity-moderate { background: #f59e0b; color: white; }
    .severity-minor { background: #6b7280; color: white; }
    .distance { color: #94a3b8; font-size: 14px; margin-top: 10px; }
    .cta { display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
    .cta:hover { background: #0284c7; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    .footer a { color: #38bdf8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌊 World Under Water</h1>
    </div>
    <div class="content">
      <p>${greeting}</p>

      <p>A <strong>${disaster.type}</strong> event has been detected near your location:</p>

      <h2 style="margin-top: 20px; color: #f0f9ff;">${disaster.title}</h2>

      <p>
        <span class="alert-badge severity-${disaster.severity}">${disaster.severity}</span>
      </p>

      <p><strong>Location:</strong> ${location}</p>
      <p class="distance">📍 Approximately ${distanceText} from your registered location</p>

      <h3 style="margin-top: 30px; color: #f0f9ff;">Safety Recommendations:</h3>
      <ul style="color: #cbd5e1; line-height: 1.8;">
        <li>Stay informed through official channels</li>
        <li>Follow local emergency instructions</li>
        <li>Prepare emergency supplies if you haven't already</li>
        <li>Know your evacuation routes</li>
      </ul>

      ${
        disaster.articleUrl
          ? `<a href="${disaster.articleUrl}" class="cta">Read Full Safety Guide →</a>`
          : ""
      }
    </div>
    <div class="footer">
      <p>You're receiving this because you subscribed to disaster alerts for your area.</p>
      <p><a href="https://worldunderwater.org/unsubscribe">Unsubscribe</a> | <a href="https://worldunderwater.org/preferences">Update Preferences</a></p>
      <p>© ${new Date().getFullYear()} World Under Water. Stay safe, stay prepared.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Build daily digest email for multiple events
 */
export function buildDigestEmail(
  events: DisasterAlert[],
  subscriber: Subscriber,
): string {
  const greeting = subscriber.name ? `Hi ${subscriber.name},` : "Hello,";

  const eventsList = events
    .map(
      (e) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #334155;">
        <strong>${e.title}</strong><br>
        <span style="color: #94a3b8; font-size: 13px;">${e.type} • ${e.severity}</span>
      </td>
    </tr>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0a0f1a; color: #f0f9ff; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #1e293b; padding: 30px; border-radius: 0 0 12px 12px; }
    table { width: 100%; border-collapse: collapse; }
    .cta { display: inline-block; background: #0ea5e9; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    .footer a { color: #38bdf8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌊 Your Daily Disaster Digest</h1>
    </div>
    <div class="content">
      <p>${greeting}</p>
      <p>Here's a summary of ${events.length} disaster event${events.length > 1 ? "s" : ""} near your location in the last 24 hours:</p>

      <table>
        ${eventsList}
      </table>

      <a href="https://worldunderwater.org/disasters" class="cta">View All Events →</a>
    </div>
    <div class="footer">
      <p><a href="https://worldunderwater.org/unsubscribe">Unsubscribe</a> | <a href="https://worldunderwater.org/preferences">Update Preferences</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
