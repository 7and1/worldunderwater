"use client";

import { useState, FormEvent } from "react";

interface SubscribeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export function NewsletterSubscribe() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data: SubscribeResponse = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message ?? "Please check your email to confirm.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Subscription failed. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
    >
      <input
        type="email"
        name="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "loading"}
        className="flex-1 px-4 py-3 rounded-lg bg-ocean-800 border border-ocean-600 text-foam-100 placeholder:text-foam-muted focus:outline-none focus:border-surface-400 disabled:opacity-50"
        required
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="btn btn-primary px-6 py-3 disabled:opacity-50"
      >
        {status === "loading" ? "Subscribing..." : "Subscribe"}
      </button>
      {message && (
        <p
          className={`text-sm ${
            status === "error" ? "text-coral-400" : "text-surface-400"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
