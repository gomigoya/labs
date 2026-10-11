// quokkalabs.co.kr/education* 요청을 Cloudflare Pages(lumebench.pages.dev)로 넘기는 프록시.
// 메인 사이트(Railway)는 그대로 두고 /education 아래만 이 Worker가 맡는다.
// Pages 산출물이 이미 /education/... 경로에 있어서 경로를 바꾸지 않고 그대로 전달한다.
const PAGES = 'https://lumebench.pages.dev';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/education') return Response.redirect(`${url.origin}/education/${url.search}`, 301);
    const res = await fetch(new Request(PAGES + url.pathname + url.search, request), { redirect: 'manual' });
    // Pages가 주는 리다이렉트(예: /education/hydraulic-ram → .../)를 우리 도메인 주소로 돌려놓는다
    const loc = res.headers.get('location');
    if (loc) {
      const out = new Response(res.body, res);
      out.headers.set('location', loc.replace(PAGES, url.origin));
      return out;
    }
    return res;
  },
};
