
  # DT Boilerplate Plugin

  This is a code bundle for DT Boilerplate Plugin. The original project is available at https://www.figma.com/design/hZniYoVtiQ7D0ocxq4JfZ3/DT-Boilerplate-Plugin.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

## Foundations, metadata and export

The LP remains canonical. Run `npm run sync:data` before `npm test` and `npm run build`. See [the synchronized preset README](src/data/presets/README.md) for native foundation support, alias behavior, Figma scopes/code syntax and DTCG extension compatibility.

After successful generation, paid plugin users can open **Export** on the result screen to preview, copy or download DTCG/JSON, CSS, SCSS, indented Sass or Tailwind. Every format uses the same final configuration payload as **Generate tokens**.
