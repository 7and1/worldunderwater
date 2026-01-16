import type { PublishedArticle } from "@/types/schema.types";
import { siteConfig } from "@/lib/seo/metadata";
import {
  enqueueJob as enqueueQueueJob,
  type JobType,
  type JobPriority,
} from "@/lib/queue";
import { isTransientError, withRetry } from "@/lib/resilience/retry";

const SOCIAL_ENABLED = process.env.SOCIAL_AUTOMATION_ENABLED === "true";

// P1-10: Job types for social media posting
enum SocialJobType {
  POST_TWITTER = "post_twitter",
  POST_TELEGRAM = "post_telegram",
  POST_WEBHOOK = "post_webhook",
}

interface SocialPostPayload {
  articleId: string;
  slug: string;
  title: string;
  text: string;
  imageUrl?: string;
}

function buildPostText(article: PublishedArticle) {
  const url = `${siteConfig.siteUrl}/article/${article.slug}`;
  const hashtags = "#ClimateChange #Survival";
  return `${article.title} ${hashtags} ${url}`;
}

async function postToTwitter(text: string): Promise<void> {
  const token =
    process.env.TWITTER_BEARER_TOKEN || process.env.TWITTER_ACCESS_TOKEN;
  if (!token) return;

  await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
}

async function postToTelegram(text: string, imageUrl?: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  if (imageUrl) {
    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, photo: imageUrl, caption: text }),
    });
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function postToWebhook(payload: Record<string, unknown>): Promise<void> {
  const webhook = process.env.SOCIAL_WEBHOOK_URL;
  if (!webhook) return;

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * P1-10: Enqueue social post to persistent queue instead of direct execution
 */
export async function enqueueSocialPost(
  article: PublishedArticle,
): Promise<void> {
  if (!SOCIAL_ENABLED) return;
  if (!article?.slug || article.status !== "published") return;

  const text = buildPostText(article);
  const imageUrl = article.featuredImage?.url || article.seo?.ogImageUrl;

  const payload: SocialPostPayload = {
    articleId: String(article.id),
    slug: article.slug,
    title: article.title,
    text,
    imageUrl,
  };

  // Enqueue individual platform posts for independent processing
  try {
    await enqueueQueueJob({
      type: SocialJobType.POST_TWITTER as unknown as JobType,
      payload,
      priority: 5,
      maxRetries: 3,
      retryDelay: 5000,
      timeoutMs: 30000,
    });
  } catch (error) {
    console.warn("Failed to enqueue Twitter post:", error);
  }

  try {
    await enqueueQueueJob({
      type: SocialJobType.POST_TELEGRAM as unknown as JobType,
      payload,
      priority: 5,
      maxRetries: 3,
      retryDelay: 5000,
      timeoutMs: 30000,
    });
  } catch (error) {
    console.warn("Failed to enqueue Telegram post:", error);
  }

  try {
    await enqueueQueueJob({
      type: SocialJobType.POST_WEBHOOK as unknown as JobType,
      payload,
      priority: 3 as JobPriority,
      maxRetries: 2,
      retryDelay: 10000,
      timeoutMs: 15000,
    });
  } catch (error) {
    console.warn("Failed to enqueue webhook post:", error);
  }
}

/**
 * Execute social post with retry logic (used by queue worker)
 */
export async function executeSocialPost(
  jobType: SocialJobType,
  payload: SocialPostPayload,
): Promise<{ success: boolean; error?: Error }> {
  try {
    const result = await withRetry(
      async () => {
        switch (jobType) {
          case SocialJobType.POST_TWITTER:
            await postToTwitter(payload.text);
            break;
          case SocialJobType.POST_TELEGRAM:
            await postToTelegram(payload.text, payload.imageUrl);
            break;
          case SocialJobType.POST_WEBHOOK:
            await postToWebhook({
              text: payload.text,
              imageUrl: payload.imageUrl,
              slug: payload.slug,
            });
            break;
        }
      },
      {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
      },
    );

    if (!result.success) {
      throw result.error || new Error("Social post failed");
    }

    console.log(
      `[Social] Successfully posted to ${jobType} for article ${payload.slug}`,
    );
    return { success: true };
  } catch (error) {
    const err = error as Error;
    const retryable = isTransientError(err);
    console.warn(`[Social] Failed to post to ${jobType}:`, err.message);
    return { success: false, error: err };
  }
}

export { SocialJobType };
