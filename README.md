# BalconyFarm

Polish, responsive landing page with a generated film controlled by scrolling, an editable monthly balance calculator, native accessible accordions, and an email composer.

## Publishing

The website is static HTML, CSS and JavaScript. It needs no package installation, account, runtime backend or API key. Project-relative asset paths work at https://tomaszjader.github.io/balcony-farm/.

The Pages workflow retrieves a checksum-pinned archive containing the generated film, exact first-frame posters, photographs, icons and local fonts. It publishes those files together with the source files as one GitHub Pages artifact. The workflow cannot write to the source repository.

## Contact

The form prepares a message addressed to tomasz.jader@gmail.com. Visitors review and send it using their own email application, or copy its text. The website does not submit contact details to a server or claim that a message has been sent.

## Accessibility and performance

All content is present in HTML. Reduced-motion mode shows the same story without fetching video. The mobile film is a smaller encode. Video seeking is coalesced, reversible, and uses local Blob URLs; the exact first-frame poster remains visible until a video frame is painted.

## Local preview

Run a static web server from this directory, for example `python3 -m http.server 8000`, with the media archive unpacked alongside the source files. No framework build is required.

## Netlify (Polish + English)

Import this repository into Netlify and select the `main` branch. The committed `netlify.toml` supplies the settings automatically:

- Build command: `python3 scripts/build-site.py`
- Publish directory: `_site`
- Polish homepage: `/`
- English homepage: `/en/`
- Pretty URLs handles the English directory route; `/pl` and `/pl/` are aliases redirecting to the Polish homepage.

The shared build script downloads and verifies the pinned media bundle, then includes the film, photos, icons and fonts in the deployed site. No npm dependencies, API keys or server functions are needed. Missing or corrupted media causes the build to fail rather than publishing an incomplete page.

Canonical URLs, alternate-language URLs, Open Graph URLs, sitemap and robots metadata use Netlify's production `URL` or preview `DEPLOY_PRIME_URL`. Optionally set `SITE_URL` to override the site address, for example when using a custom domain. GitHub Pages keeps its existing canonical address.

Direct visits and refreshes work because `en/index.html` is a real static document. There is deliberately no `/* /index.html 200` SPA fallback that could serve Polish content for English or missing URLs.

For a manual Netlify upload, first run the build locally and upload the contents of `_site`, not the raw repository. You can reuse a downloaded media archive with `python3 scripts/build-site.py --assets-archive /path/to/balconyfarm-pages-assets-v2.zip`; its checksum is still verified.

The contact form continues to prepare an email for the visitor to send; enabling Netlify hosting does not submit or store messages through Netlify Forms.

## Russian version

Russian content is available at `/ru/`, with PL / EN / RU navigation on every page. The shared build includes all three language directories for both hosting platforms. Calculator amounts remain in PLN; Russian number formatting and quantity labels are localized.
