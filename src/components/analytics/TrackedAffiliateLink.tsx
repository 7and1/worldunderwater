"use client";

import { type MouseEventHandler, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/client";

interface TrackedAffiliateLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  eventType?: string;
  articleId?: string;
  productId?: string | number;
  target?: string;
  rel?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export default function TrackedAffiliateLink({
  href,
  className,
  children,
  eventType = "click_product",
  articleId,
  productId,
  target,
  rel,
  onClick,
}: TrackedAffiliateLinkProps) {
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    trackEvent({ eventType, articleId, productId });
    onClick?.(event);
  };

  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
