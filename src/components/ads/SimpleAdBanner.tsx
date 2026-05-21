import React from "react";

interface SimpleAdBannerProps {
  position: "top" | "middle" | "bottom" | "sidebar" | "header" | "content" | "footer";
  className?: string;
  slotId?: string;
  pageSection?: string;
}

/**
 * Ads are disabled sitewide for security.
 * Keep this component as a no-op so existing placements do not load third-party scripts.
 */
const SimpleAdBanner: React.FC<SimpleAdBannerProps> = ({
  position: _position,
  className: _className,
  slotId: _slotId,
}) => {
  return null;
};

export default SimpleAdBanner;

