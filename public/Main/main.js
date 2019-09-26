// prettier-ignore
/*eslint-disable */
import render from '../PLib/render.js';
import autoSugesstionInit from '../autoSuggestion/src/js/initiator.js';
import initCarousel from '../carousel/src/js/initiator.js';
import mainTpl from './src/mainTpl.js';
import renderHTML from '../PLib/render.js';

window.addEventListener('DOMContentLoaded', async () => {
  await renderHTML({
    currentVersion: 1,
    url: '/tpl-src-data.json',
    templateFunc: mainTpl,
  });

  autoSugesstionInit();
  initCarousel();
});
