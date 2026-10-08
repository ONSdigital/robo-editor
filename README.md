# robo-editor

A browser-based editor for writing semi-automated ("robo-journalism") templates in [Pug](https://pugjs.org), with a live preview of the output for any area in your CSV data. Its help panel is a cheat sheet for Pug and the [robo-utils](https://github.com/ONSdigital/robo-utils) functions, with examples.

**[Try the editor](https://onsdigital.github.io/robo-editor/)**

## Part of the robo-journalism toolkit

This repository is one of a set of open-source tools from the Office for National Statistics (ONS) for producing semi-automated ("robo-journalism") content about local areas:

| Repository                                                                     | What it does                                                                                                                         |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| [robo-utils](https://github.com/ONSdigital/robo-utils)                         | A JavaScript library of functions for writing text from data, and for rendering Pug templates into JSON                              |
| [robo-editor](https://github.com/ONSdigital/robo-editor) **(this repository)** | A browser-based editor for writing and testing Pug templates against your data ([try it](https://onsdigital.github.io/robo-editor/)) |
| [robo-article](https://github.com/ONSdigital/robo-article)                     | A SvelteKit template that publishes a Pug template as a standard article page for each area                                          |
| [robo-embed](https://github.com/ONSdigital/robo-embed)                         | A SvelteKit template for content that sits within another page in an iframe                                                          |
| [robo-scrolly](https://github.com/ONSdigital/robo-scrolly)                     | A SvelteKit template for scrollytelling articles, with charts and maps that change as you scroll                                     |

Templates are usually written and tested in robo-editor, then published with one of the SvelteKit templates, with robo-utils doing the work in both.

## Running it locally

```bash
npm install
npm run dev      # run the editor at localhost:5173
npm run build    # build a static copy in /build
```
