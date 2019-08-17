/* eslint-disable */
import { LitElement, html, css } from 'lit-element';
import pdfjs from '@bundled-es-modules/pdfjs-dist';
import viewer from '@bundled-es-modules/pdfjs-dist/web/pdf_viewer';

pdfjs.GlobalWorkerOptions.workerSrc =
  '/node_modules/@bundled-es-modules/pdfjs-dist/build/pdf.worker.min.js';

new viewer.PDFViewer({ container: document.body });
