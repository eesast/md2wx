import DOMPurify from "dompurify";
import hljs from "highlight.js";
import Marked from "marked";
import katex from "katex";

const renderer = new Marked.Renderer();
renderer.code = (code, lang, isEscaped) => {
  if (lang === "math") {
    return katex.renderToString(code, { throwOnError: false });
  } else {
    return new Marked.Renderer().code(code, lang, isEscaped);
  }
};
renderer.codespan = code => {
  if (code.length >= 2 && code.startsWith("$") && code.endsWith("$")) {
    return katex.renderToString(code.slice(1, -1), { throwOnError: false });
  } else {
    return new Marked.Renderer().codespan(code);
  }
};

Marked.setOptions({
  highlight: code => {
    return hljs.highlightAuto(code).value;
  },
  sanitize: true,
  sanitizer: DOMPurify.sanitize,
  renderer
});

declare const preval: any;

const katexCSS = preval`
  const fs = require('fs')
  module.exports = fs.readFileSync(require.resolve('../node_modules/katex/dist/katex.min.css'), 'utf8')
`;

const hljsCSS = preval`
  const fs = require('fs')
  module.exports = fs.readFileSync(require.resolve('../node_modules/highlight.js/styles/github.css'), 'utf8')
`;

const baseCSS = preval`
  const fs = require('fs')
  module.exports = fs.readFileSync(require.resolve('../node_modules/@primer/css/dist/base.css'), 'utf8')
`;

const mdCSS = preval`
  const fs = require('fs')
  module.exports = fs.readFileSync(require.resolve('../node_modules/@primer/css/dist/markdown.css'), 'utf8')
`;

const bodyCSS = preval`
  const fs = require('fs')
  module.exports = fs.readFileSync(require.resolve('./markdown-body.css'), 'utf8')
`;

const render: (md: string, highlight?: boolean) => string = (md, highlight) => {
  if (highlight) {
    Marked.setOptions({
      highlight: code => {
        return hljs.highlightAuto(code).value;
      },
      sanitize: true,
      sanitizer: DOMPurify.sanitize
    });
  }

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1.0"/>
        <style>${baseCSS}</style>
        <style>${mdCSS}</style>
        <style>${katexCSS}</style>
        <style>${highlight ? hljsCSS : ""}</style>
        <style>${bodyCSS}</style>
      </head>
      <body>
        <article class="markdown-body">
          ${Marked(md)}
        </article>
      </body>
    </html>`;
};

export default render;
