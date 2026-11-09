# Watermark Grille — Website Redesign

A modern, fast, single-page redesign of https://watermarkgrille.com/ — plain HTML/CSS/JS, no WordPress or plugins.

Open `index.html` in a browser or deploy the folder to any static host (GitHub Pages, Netlify, Vercel).

## What's improved
- **Clear calls to action**: Call to Reserve, Order Online, Menu and Directions are always one tap away (sticky header + mobile action bar).
- **Live "Open now / Closed" status** using Naples (Eastern) time, and today's hours highlighted.
- **Holidays with real dates**: Easter, Mother's Day, Father's Day and Thanksgiving are calculated automatically, and the next holiday is highlighted.
- **Mobile-first, responsive layout**, accessible markup (skip link, keyboard-friendly gallery lightbox, reduced-motion support).
- **SEO**: meta description, Open Graph tags and schema.org `Restaurant` data (address, hours, phone, menu).
- **Faster**: no page builder, sliders or heavy plugins; lazy-loaded images.

## Notes
- Photos are loaded from the existing `watermarkgrille.com/wp-content/uploads/` URLs. To self-host, download them into an `img/` folder and update the paths.
- Hours use the Contact page (Sun–Thu 4–9pm, Fri–Sat 4–10pm). The old About section said "4–10pm daily" — confirm which is correct.
