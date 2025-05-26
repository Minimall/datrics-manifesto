---
layout: base.njk
title: "Blog Posts"
meta_description: "Read our latest blog posts and articles"
---

# Blog Posts

Here are all our latest posts:

<div class="posts-grid">
{% for post in collections.posts %}
  <article class="post-card">
    <h2><a href="{{ post.url }}">{{ post.data.title }}</a></h2>
    {% if post.data.description %}
    <p class="post-excerpt">{{ post.data.description }}</p>
    {% endif %}
    {% if post.data.date %}
    <time class="post-date">{{ post.data.date | dateFormat }}</time>
    {% endif %}
  </article>
{% endfor %}
</div>