"use client";

import Link, { type LinkProps } from "next/link";
import { type MouseEventHandler, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/client";

interface TrackedLinkProps extends LinkProps {
  className?: string;
  children: ReactNode;
  eventType: string;
  articleId?: string;
  productId?: string | number;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export default function TrackedLink({
  eventType,
  articleId,
  productId,
  onClick,
  ...props
}: TrackedLinkProps) {
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    trackEvent({ eventType, articleId, productId });
    onClick?.(event);
  };

  return <Link {...props} onClick={handleClick} />;
}
