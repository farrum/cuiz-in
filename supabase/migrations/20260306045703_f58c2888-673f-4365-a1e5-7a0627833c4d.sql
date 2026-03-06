-- EMERGENCY: Deactivate all ad slots to stop malicious injection
UPDATE public.ad_slots SET active = false;

-- Clean the ad code: remove all data-banner-id and aclib code, keep only safe Google AdSense
-- We'll set all code to empty since all current slots contain compromised code
UPDATE public.ad_slots SET code = '<!-- ad slot deactivated for security -->' WHERE position != 'bottom';

-- For bottom slot, preserve only the Google AdSense portion if it exists
UPDATE public.ad_slots SET code = '<!-- ad slot cleaned -->', active = false WHERE position = 'bottom';