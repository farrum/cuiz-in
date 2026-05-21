import React from 'react';

interface AdSenseUnitProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /** Layout variant for in-feed/in-article formats */
  layout?: string;
  layoutKey?: string;
}

/**
 * Ads are disabled sitewide for security.
 * Keep this component as a no-op so legacy ad placements cannot execute AdSense pushes.
 */
const AdSenseUnit: React.FC<AdSenseUnitProps> = ({
  slot: _slot,
  format: _format = 'auto',
  responsive: _responsive = true,
  className: _className,
  style: _style,
  layout: _layout,
  layoutKey: _layoutKey,
}) => {
  return null;
};

export default AdSenseUnit;