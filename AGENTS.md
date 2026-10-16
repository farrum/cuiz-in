# Architecture rules

- Admin sitemap tools share a read-only audit service that traverses the live sitemap index and compares deduplicated question IDs with the database count RPC, so categories are not limited by a hardcoded UI list; report sitemap-source coverage separately from public delivery and Google indexing.