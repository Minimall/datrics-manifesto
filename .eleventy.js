const markdownIt = require("markdown-it");
const mdAttrs = require("markdown-it-attrs");
const mdContainer = require("markdown-it-container");

module.exports = function(eleventyConfig) {
  // Configure markdown-it with required plugins
  const md = markdownIt({
    breaks: true,
    html: true,
    linkify: true
  })
    .use(mdAttrs)
    .use(mdContainer, "subparagraph", {
      validate: function(params) {
        return params.trim().match(/^subparagraph\s+(.*)$/);
      },
      render: function(tokens, idx) {
        const m = tokens[idx].info.trim().match(/^subparagraph\s+(.*)$/);
        if (tokens[idx].nesting === 1) {
          return '<div class="subparagraph">\n';
        } else {
          return '</div>\n';
        }
      }
    });

  // ── Option B: replace [[animation]] with the HTML snippet ──
  const animationHTML = `
<section class="animation-section">
  <div class="dots-grid" id="dotsGrid"></div>
</section>`.trim();

  const defaultTextRule =
    md.renderer.rules.text ||
    function(tokens, idx, opts, env, self) {
      return self.renderToken(tokens, idx, opts);
    };

  md.renderer.rules.text = function(tokens, idx, opts, env, self) {
    if (tokens[idx].content.trim() === '[[animation]]') {
      return animationHTML;
    }
    return defaultTextRule(tokens, idx, opts, env, self);
  };

  // ⚑ register the tweaked instance with Eleventy
  eleventyConfig.setLibrary("md", md);

  return {
    dir: {
      input: "content",
      includes: "_includes",
      output: "_site"
    },
    markdownTemplateEngine: "njk"
  };
};

  eleventyConfig.setLibrary("md", md);

  // Transform to add CSS classes
  eleventyConfig.addTransform("addClasses", (content, outputPath) => {
    if (outputPath && outputPath.endsWith(".html")) {
      // Add class="paragraph" to all <p> tags
      content = content.replace(/<p>/g, '<p class="paragraph">');
      
      // Add class="manifesto-title" to the first <h1> tag
      content = content.replace(/<h1([^>]*)>/, '<h1$1 class="manifesto-title">');
      
      return content;
    }
    return content;
  });

  // Copy static files
  eleventyConfig.addPassthroughCopy({ "static/uploads": "uploads" });
  eleventyConfig.addPassthroughCopy("styles");
  eleventyConfig.addPassthroughCopy("logo.svg");
  eleventyConfig.addPassthroughCopy("admin");

  // Collections
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("content/posts/*.md").sort((a, b) => {
      return new Date(b.data.date) - new Date(a.data.date);
    });
  });

  // Filters
  eleventyConfig.addFilter("dateFormat", function(date) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  });

  // Set up permalinks for posts
  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: (data) => {
      if (data.page.inputPath.includes('/posts/')) {
        return `/posts/${data.page.fileSlug}/`;
      }
      return data.permalink;
    }
  });

  return {
    dir: {
      input: "content",
      output: "_site",
      includes: "../_includes"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
