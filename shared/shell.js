// 모든 실험실에 공통으로 주입되는 사이트 셸.
// - 공유 / 저사양 모드 / 기관용 의뢰 / 전체 실험실 링크
// - 실험실이 [data-site-slot] 요소를 두면 그 안에 그리고, 없으면 왼쪽 아래에 고정 알약으로 그린다
//   (실험실 HUD 규칙상 왼쪽 위·오른쪽 위·하단 중앙·오른쪽 아래는 이미 쓰이고 왼쪽 아래가 비어 있다.
//    모바일은 패널이 하단 시트로 내려가므로 오른쪽 위로 옮긴다)
// - 실험실 코드가 쓸 수 있는 API: window.__site.{quality, lang, share(), setVisible(bool), t(ko,en)}
(() => {
  const site = (window.__SITE__ = window.__SITE__ || {});
  window.__site = site; // 문서상 API 이름
  const lang = (document.documentElement.lang || 'ko').toLowerCase().startsWith('en') ? 'en' : 'ko';
  const t = (ko, en) => (lang === 'en' ? en : ko);

  const css = `
.lb-shell{position:fixed;left:16px;bottom:16px;z-index:2147483000;display:flex;gap:6px;align-items:center;
  font:500 11px/1 "DM Mono",ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase}
.lb-shell.lb-inline{position:static}
.lb-shell[hidden]{display:none}
.lb-btn{appearance:none;border:1px solid rgba(255,255,255,.16);background:rgba(20,18,16,.55);color:#efe7dc;
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-radius:999px;padding:8px 12px;cursor:pointer;
  font:inherit;letter-spacing:inherit;text-decoration:none;white-space:nowrap}
.lb-btn:hover{border-color:rgba(255,179,107,.6);color:#fff}
.lb-btn:focus-visible{outline:2px solid #7dd3fc;outline-offset:2px}
.lb-btn .lb-dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:6px;vertical-align:1px;background:#6b6b6b}
.lb-btn[aria-pressed="true"] .lb-dot{background:#7dd3fc;box-shadow:0 0 6px #7dd3fc}
.lb-toast{position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:2147483001;background:rgba(20,18,16,.85);
  color:#efe7dc;border-radius:10px;padding:10px 14px;font:500 13px/1.3 "Noto Sans KR",system-ui,sans-serif;opacity:0;transition:opacity .2s}
.lb-toast.on{opacity:1}
.lb-short{display:none}
@media (max-width:980px){.lb-shell:not(.lb-inline){left:auto;right:8px;bottom:auto;top:8px}.lb-btn{padding:7px 10px}
  .lb-shell:not(.lb-inline) .lb-long{display:none}.lb-shell:not(.lb-inline) .lb-short{display:inline}.lb-shell:not(.lb-inline) .lb-hide-m{display:none}}`;

  function toast(msg) {
    let el = document.querySelector('.lb-toast');
    if (!el) { el = document.createElement('div'); el.className = 'lb-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('on'), 1800);
  }

  async function share() {
    const url = location.origin + location.pathname;
    const title = document.title;
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); toast(t('링크를 복사했어요', 'Link copied')); }
    catch { prompt(t('이 링크를 복사하세요', 'Copy this link'), url); }
  }

  function setLite(on) {
    const q = new URLSearchParams(location.search);
    q.set('lite', on ? '1' : '0');
    location.search = q.toString();
  }

  function mount() {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const slot = document.querySelector('[data-site-slot]');
    const bar = document.createElement('nav');
    bar.className = 'lb-shell' + (slot ? ' lb-inline' : '');
    bar.setAttribute('aria-label', t('사이트 메뉴', 'Site menu'));

    const btn = (label, onClick, extra = {}) => {
      const b = document.createElement(extra.href ? 'a' : 'button');
      b.className = 'lb-btn';
      if (extra.href) { b.href = extra.href; if (extra.external) { b.target = '_blank'; b.rel = 'noopener'; } }
      else b.type = 'button';
      if (extra.pressed !== undefined) b.setAttribute('aria-pressed', String(extra.pressed));
      // 좁은 화면(고정 알약)에서는 짧은 이름만 보여 실험실 헤더를 가리지 않는다
      const text = extra.short ? `<span class="lb-long">${label}</span><span class="lb-short">${extra.short}</span>` : label;
      b.innerHTML = (extra.pressed !== undefined ? '<span class="lb-dot"></span>' : '') + text;
      if (extra.short) b.setAttribute('aria-label', label.replace(/^← /, ''));
      if (extra.hideMobile) b.classList.add('lb-hide-m');
      if (onClick) b.addEventListener('click', onClick);
      bar.appendChild(b);
      return b;
    };

    btn(t('← 모든 실험실', '← All labs'), null, { href: (site.base || '') + '/', short: '←' });
    btn(t('공유', 'Share'), share);
    btn(t('저사양', 'Lite'), () => setLite(site.quality !== 'low'), { pressed: site.quality === 'low' });
    if (site.requestFormUrl) {
      // 폼의 숨은 필드(lab, lang)로 어느 실험실에서 왔는지 기록한다 (docs/forms.md)
      const u = new URL(site.requestFormUrl);
      u.searchParams.set('lab', location.pathname.slice((site.base || '').length).split('/').filter(Boolean)[0] || 'home');
      u.searchParams.set('lang', lang);
      btn(t('기관용 의뢰', 'For institutions'), null, { href: u.toString(), external: true, hideMobile: true });
    }

    (slot || document.body).appendChild(bar);
    site._bar = bar;
  }

  site.lang = lang;
  site.t = t;
  site.share = share;
  site.setVisible = (v) => { if (site._bar) site._bar.hidden = !v; };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
