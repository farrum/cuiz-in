-- SECURITY: Clean all malicious ad code from ad_slot_versions table
UPDATE public.ad_slot_versions 
SET active = false, code = '<!-- cleaned - malicious content removed -->' 
WHERE code LIKE '%data-banner-id%' 
   OR code LIKE '%aclib%' 
   OR code LIKE '%acscdn%' 
   OR code LIKE '%onclckbnr%' 
   OR code LIKE '%richinfo%' 
   OR code LIKE '%adexchangeclear%' 
   OR code LIKE '%wpadmngr%' 
   OR code LIKE '%onclckmn%';

-- SECURITY: Deactivate all ad_slots to prevent any ad rendering
UPDATE public.ad_slots SET active = false, code = '<!-- disabled for security -->';