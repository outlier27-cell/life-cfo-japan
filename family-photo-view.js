(function(root) {
  'use strict';
  const escape = value => String(value).replace(/[&<>"']/g, char =>
    ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[char]);
  const media = path => root.FamilyOfflinePhotos?.[path] || path;
  const byYear = new Map(root.FamilyArchive.map(photo => [photo.year, photo]));

  function archivePhoto(photo, hero = false) {
    if (!photo) return '';
    const credit = `<a href="${escape(photo.source)}" target="_blank" rel="noopener noreferrer">${escape(photo.credit)} · 原始档案</a> · <a href="${escape(photo.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escape(photo.license)}</a>`;
    return `<figure class="archive-photo${hero ? ' era-cover' : ''}">
      <button type="button" class="photo-open" data-archive="${photo.year}" aria-label="放大历史影像 · ${escape(photo.title)}">
        <img src="${media(photo.src)}" alt="${escape(photo.caption)}" ${hero?'':'loading="lazy"'} decoding="async">
      </button>
      <figcaption><small>同年档案 · ${escape(photo.date)} · ${escape(photo.place)}</small>
        <strong>${escape(photo.title)}</strong><span>${escape(photo.caption)}</span>
        <details><summary>影像出处</summary>${credit} · 等比缩放与 WebP 转码</details>
      </figcaption></figure>`;
  }

  function yearVisual(year, title, hero = false) {
    const photo = byYear.get(year);
    if (photo) return archivePhoto(photo, hero);
    const path = 'assets/history/' + year + '.webp';
    const alt = year + ' 年历史背景插画 · ' + title;
    return `<figure class="archive-photo history-illustration${hero ? ' era-cover' : ''}">
      <button type="button" class="photo-open" data-history-photo aria-label="${escape(alt)}">
        <img src="${media(path)}" alt="${escape(alt)}" width="1280" height="576" ${hero?'':'loading="lazy"'} decoding="async">
      </button>
      <figcaption><small>${year} 年 · GPT 生成的历史情境插画</small><strong>${escape(title)}</strong></figcaption>
    </figure>`;
  }

  const extraYears = new Set([1985,1989,1990,1992,1997,2000,2008,2011,2016,2020]);
  function extraVisual(year,title) {
    if (!extraYears.has(year)) return '';
    const alt = year + ' 年家庭与社会切面 · ' + title;
    return `<figure class="archive-photo history-illustration">
      <button type="button" class="photo-open" data-history-photo data-reconstruction aria-label="${escape(alt)}">
        <img src="${media('assets/history/'+year+'-extra.webp')}" alt="${escape(alt)}" width="1280" height="576" loading="lazy" decoding="async">
      </button>
      <figcaption><small>${year} 年 · GPT 生成的写实历史复原</small><strong>当时的生活切面</strong></figcaption></figure>`;
  }

  function scenePhoto(s, e, year) {
    const route = e.routeOverride ?? s.story.threads[e.chain]?.route ?? 'first';
    const key = [s.country, e.chain, e.nodeId, route, e.personId].join('/');
    const asset = root.FamilySceneAssets[key];
    if (!asset) return '';
    const age = year - s.story.people.child.born;
    const path = asset.teen && age >= 12 ? asset.teen : asset.src;
    return `<figure class="story-scene scene-photo" data-scene-key="${escape(key)}">
      <button type="button" class="photo-open" data-story-photo aria-label="放大剧情图 · ${escape(asset.alt)}">
        <img src="${media(path)}" alt="${escape(asset.alt)}" width="960" height="432" decoding="async">
      </button><figcaption><span>${year}年 · ${escape(s.story.people[e.personId].name)}</span>
        <a href="sources.html#art">AI 剧情图</a></figcaption></figure>`;
  }

  function showPhoto(button) {
    const dialog = document.getElementById('photo-dialog');
    const image = button.querySelector('img');
    const photo = byYear.get(Number(button.dataset.archive));
    dialog.querySelector('h2').textContent = photo?.title || image.alt;
    const enlarged = dialog.querySelector('img');
    enlarged.src = image.src;
    enlarged.alt = image.alt;
    dialog.querySelector('p').textContent = photo
      ? [photo.date, photo.place, photo.credit, photo.license].join(' · ')
      : button.hasAttribute('data-reconstruction') ? 'GPT 生成的写实历史复原，参考当年的社会背景。' : button.hasAttribute('data-history-photo') ? 'GPT 生成的历史情境插画，供理解时代背景。' : 'AI 生成的家庭故事场景';
    dialog.showModal();
    dialog.querySelector('button').focus();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button[data-archive],button[data-history-photo],button[data-story-photo]');
    if (button) showPhoto(button);
  });
  root.FamilyPhotos = {media, scenePhoto, yearVisual, extraVisual};
})(globalThis);
