# Bahi Safety GitHub Final

This build is static and GitHub Pages compatible. It tries the WooCommerce Store API first. If CORS/API access is unavailable, it automatically uses `assets/catalog.json` built from the supplied WooCommerce export so the app never stays empty.

The local catalog is a fallback only; when Store API access works, current WooCommerce products are used.
