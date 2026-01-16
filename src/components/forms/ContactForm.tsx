"use client";

import { useState, FormEvent } from "react";

interface ContactResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data: ContactResponse = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message ?? "Message sent successfully!");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
        setMessage(data.error ?? "Failed to send message. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <input
          type="text"
          name="name"
          placeholder="Your name"
          value={formData.name}
          onChange={handleChange}
          disabled={status === "loading"}
          className="px-4 py-3 rounded-lg bg-ocean-800 border border-ocean-600 text-foam-100 placeholder:text-foam-muted focus:outline-none focus:border-surface-400 disabled:opacity-50"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleChange}
          disabled={status === "loading"}
          className="px-4 py-3 rounded-lg bg-ocean-800 border border-ocean-600 text-foam-100 placeholder:text-foam-muted focus:outline-none focus:border-surface-400 disabled:opacity-50"
          required
        />
      </div>
      <input
        type="text"
        name="subject"
        placeholder="Subject"
        value={formData.subject}
        onChange={handleChange}
        disabled={status === "loading"}
        className="px-4 py-3 rounded-lg bg-ocean-800 border border-ocean-600 text-foam-100 placeholder:text-foam-muted focus:outline-none focus:border-surface-400 disabled:opacity-50"
      />
      <textarea
        name="message"
        rows={6}
        placeholder="How can we help?"
        value={formData.message}
        onChange={handleChange}
        disabled={status === "loading"}
        className="px-4 py-3 rounded-lg bg-ocean-800 border border-ocean-600 text-foam-100 placeholder:text-foam-muted focus:outline-none focus:border-surface-400 disabled:opacity-50"
        required
      />
      {message && (
        <p
          className={`text-sm ${
            status === "error" ? "text-coral-400" : "text-surface-400"
          }`}
        >
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="btn btn-primary w-fit disabled:opacity-50"
      >
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
