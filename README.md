# 통일 대표팀 메이커

남북한 선수 22명으로 대표팀을 구성하고, 7개 상대 국가에 맞는 전술과 승률을 실험하는 축구 전략 게임입니다.

## GitHub에 올리기

이 폴더 자체가 Git 저장소이며 기본 브랜치는 `main`입니다. 현재 GitHub 저장소는
[`alexyoo49-netize/tongil22`](https://github.com/alexyoo49-netize/tongil22)로 연결되어 있습니다.

```bash
git push -u origin main
```

## GitHub Pages 설정

정적 사이트 파일은 `docs/`에 포함됩니다. GitHub 저장소에서 다음과 같이 선택합니다.

1. `Settings` → `Pages`
2. `Build and deployment`의 `Source`를 `Deploy from a branch`로 선택
3. `Branch`를 `main`, 폴더를 **`/docs`**로 선택 (`/(root)`가 아님)
4. `Save`

현재 정적 자산 경로는 저장소 이름에 맞춰 `/tongil22`로 설정되어 있습니다. 저장소 이름을 바꾸면
`scripts/build-github-pages.ps1`의 `NEXT_PUBLIC_BASE_PATH`도 같은 이름으로 바꾼 뒤 `npm run build:pages`를 다시 실행해야 합니다.

## 개발

```bash
npm install
npm run dev
```

GitHub Pages용 정적 파일을 갱신하려면:

```bash
npm run build:pages
```
