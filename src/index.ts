import DOMPurify from "dompurify";
import hljs from "highlight.js";
import Marked from "marked";
import katex from "katex";
import DomToImage from "dom-to-image";

const renderer = new Marked.Renderer();
renderer.code = (code: any, lang: any, isEscaped: any) => {
  if (lang === "math") {
    return `<p>${katex.renderToString(code, { throwOnError: false })}</p>`;
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

function renderHtml(md: string, highlight = true) {
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
}

async function convertSvgToPng() {
  const nodes = Array.from(
    document.getElementsByClassName("katex")
  ) as HTMLSpanElement[];

  await Promise.all(
    nodes.map(async node => {
      const bases = node.getElementsByClassName("base") as HTMLCollectionOf<
        HTMLSpanElement
      >;

      const actualSize = Array.from<HTMLSpanElement>(bases).reduce<{
        width: number;
        height: number;
      }>(
        (prev, base) => ({
          width: prev.width + base.offsetWidth,
          height: Math.max(prev.height, base.offsetHeight)
        }),
        { width: 0, height: 0 }
      );

      const ratio = actualSize.width / actualSize.height;

      let renderedHeight;
      let renderedWidth;
      if (ratio >= 1) {
        renderedHeight = Math.max(100, actualSize.height);
        renderedWidth = renderedHeight * ratio;
      } else {
        renderedWidth = Math.max(100, actualSize.width);
        renderedHeight = renderedWidth / ratio;
      }

      const visibleWidth = Math.max(13, actualSize.width);

      const dataUrl = await DomToImage.toPng(node, {
        width: renderedWidth,
        height: renderedHeight
      });
      const img = new Image();
      img.src = dataUrl;
      (img as any).style = `width:${visibleWidth}px;height:${actualSize.height}px;object-position:left top;object-fit:none;`;
      // eslint-disable-next-line
      node.outerHTML = img.outerHTML;
    })
  );
}

export default { renderHtml, convertSvgToPng };
