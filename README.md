# Madin Blog

This repository contains the source code for the _Madin_ blog hosted at [madin.dev](https://madin.dev)

If you have questions or want to suggest a correction, please open an issue.

The blog's setup and tooling was inspired by the awesome [Writing an OS in Rust series](https://os.phil-opp.com/), highly recommended.

# Dependencies

- [Node.js 24+](https://nodejs.org/en/download)
- [Zola 0.23.6](https://www.getzola.org/documentation/getting-started/installation/)

## Local Development

```
npm install
npm start
```

## Writing posts

Zola 0.23 renders post bodies as Tera templates. Wrap any literal `{{`, `{%` or `{#` in `{% raw %}...{% endraw %}`, or the build fails.

Components usable from markdown live in `blog/templates/components.html`, e.g.:

```
{{<imgcaption path="my-post/picture.jpeg" caption="A caption" />}}
```

Run `npm run svg` after adding SVG diagrams to strip editor metadata.

## License

This project, with exception of the `blog/content` folder, is licensed under MIT license.

For licensing of the `blog/content` folder, see the [`blog/content/README.md`](blog/content/README.md).
