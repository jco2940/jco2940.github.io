# 조현정 연구 홈페이지

https://jco2940.github.io

북한 인권·교육 연구자 조현정(통일연구원 인권연구실 부연구위원)의 개인 연구 홈페이지입니다.

- 내용 수정: `site.config.ts`, `app/data/*.json`
- 발표: `app/data/talks.json`, 미디어: `app/data/media.json` (유튜브 주소를 `url`에 넣으면 썸네일이 자동으로 붙습니다)
- 공개 아카이브 (GitHub Actions `collect-archives`가 매일 06:20에 자동 수집):
  - 북한 이슈 동향: `app/data/trends/날짜.json` (나라별 Google 뉴스, `scripts/collect-trends.mjs`)
  - 북한인권 라이브러리: `app/data/library.json` (ReliefWeb, `scripts/collect-library.mjs`, 저장소 Secret `RELIEFWEB_APPNAME` 필요), 법령 등 직접 정리하는 자료는 `app/data/library-manual.json`
  - 북한 사회 연구: `app/data/studies.json` (OpenAlex·KCI, `scripts/collect-studies.mjs`). 잘못 들어온 논문은 `app/data/studies-exclude.json`에 id를 넣으면 빠집니다. KCI(국내 학술지)는 저장소 Secret `KCI_API_KEY`가 있어야 수집됩니다.
- 노동신문 브리핑: `app/data/rodong.json`, 주간 하이라이트는 `app/data/rodong-weekly.json` (작성 지침은 `docs/rodong-briefing.md`)
- 배포: `main`에 올리면 GitHub Actions가 자동으로 빌드해 GitHub Pages에 올립니다.
