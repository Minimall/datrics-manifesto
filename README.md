# Static Site with Eleventy + Decap CMS

A modern static website built with Eleventy and managed through Decap CMS, designed for deployment on Netlify.

## Features

- **Static Site Generation**: Built with Eleventy for optimal performance
- **Content Management**: Easy editing through Decap CMS at `/kitchen/`
- **Markdown Processing**: Enhanced markdown with custom attributes and containers
- **Image Management**: Drag & drop image uploads to `/static/uploads/`
- **Blog System**: Posts routed to `/posts/{slug}/` with metadata support
- **Responsive Design**: Mobile-first CSS with light/dark theme support
- **SEO Optimized**: Meta tags, structured data, and semantic HTML

## Project Structure

```
├── content/
│   ├── home.md              # Home page content
│   ├── posts.md             # Blog listing page
│   └── posts/               # Blog posts
├── _includes/
│   ├── base.njk             # Base layout template
│   └── post.njk             # Blog post template
├── admin/
│   ├── config.yml           # Decap CMS configuration
│   └── index.html           # CMS interface
├── static/uploads/          # Image uploads from CMS
├── styles/main.css          # Site styles
├── .eleventy.js             # Eleventy configuration
└── netlify.toml             # Netlify build settings
```

## Local Development

1. Install dependencies:
   ```bash
   npm install @11ty/eleventy markdown-it markdown-it-attrs markdown-it-container
   ```

2. Start development server:
   ```bash
   npx eleventy --serve --port=5000
   ```

3. Visit http://localhost:5000

## Content Management

- Access the CMS at `/kitchen/` (requires authentication)
- Upload images via drag & drop
- Posts support: title, description, date, palette (light/dark), and AI hero placeholder
- Markdown with custom attributes: `{.highlight}` and `:::subparagraph` containers

## Deployment to Netlify

### Automatic Deployment

1. Connect your Git repository to Netlify
2. Build settings are configured in `netlify.toml`:
   - **Build command**: `npm run build` (or `npx eleventy`)
   - **Publish directory**: `_site`

### Enable Content Management

1. **Enable Git Gateway**: 
   - Go to Netlify Dashboard → Site settings → Identity
   - Enable Identity service
   - Enable Git Gateway

2. **Configure Authentication**:
   - Set registration preferences (invite only recommended)
   - Enable external providers (GitHub recommended)

3. **Access CMS**:
   - Visit `https://yourdomain.netlify.app/kitchen/`
   - Authenticate and start managing content

### Security Features

- `/kitchen/` is protected from search engines via `X-Robots-Tag: noindex`
- Git Gateway restricts CMS access to authenticated users
- Image uploads are contained to `/static/uploads/`

## Customization

### Themes
- Posts support `palette: light` or `palette: dark` for theme switching
- CSS custom properties in `styles/main.css` control color schemes

### Markdown Extensions
- **Attributes**: Add classes with `{.className}`
- **Containers**: Use `:::subparagraph` for special sections
- **Auto-styling**: `<p>` tags get `class="paragraph"`, first `<h1>` gets `class="manifesto-title"`

### AI Hero Images
- Each post includes a future-ready `<div class="ai-hero">` section
- Currently displays placeholder, ready for AI image integration

## Technical Details

- **Static Generation**: Pure HTML output, no client-side JavaScript required
- **Performance**: Optimized for speed with minimal dependencies
- **SEO**: Semantic markup, meta tags, and structured URLs
- **Accessibility**: Semantic HTML with proper heading hierarchy

## Support

For issues with:
- **Content editing**: Check Netlify Identity configuration
- **Build errors**: Verify all markdown files have proper front matter
- **Image uploads**: Ensure `/static/uploads/` directory exists

Built with ❤️ using Eleventy and Decap CMS