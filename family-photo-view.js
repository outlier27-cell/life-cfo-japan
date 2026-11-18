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
        <img src="${media(photo.src)}" alt="${escape(photo.caption)}" decoding="async">
      </button>
      <figcaption><small>历史现场 · ${escape(photo.date)} · ${escape(photo.place)}</small>
        <strong>${escape(photo.title)}</strong><span>${escape(photo.caption)}</span>
        <details><summary>影像出处</summary>${credit} · 等比缩放与 WebP 转码</details>
      </figcaption></figure>`;
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
      : 'AI 生成的家庭故事场景';
    dialog.showModal();
    dialog.querySelector('button').focus();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button[data-archive],button[data-story-photo]');
    if (button) showPhoto(button);
  });
  root.FamilyPhotos = {media, scenePhoto, archivePhoto, onYear: year => byYear.get(year)};
})(globalThis);
