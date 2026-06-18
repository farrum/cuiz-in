UPDATE public.ad_slots
SET code = '<script>
  atOptions = {
    ''key'' : ''c7af41d35e8204cd1e8dc9dbded24a44'',
    ''format'' : ''iframe'',
    ''height'' : 90,
    ''width'' : 728,
    ''params'' : {}
  };
</script>
<script src="https://www.highperformanceformat.com/c7af41d35e8204cd1e8dc9dbded24a44/invoke.js"></script>',
    active = true,
    last_updated = now(),
    version_number = version_number + 1
WHERE position IN ('top', 'middle', 'bottom', 'sidebar');