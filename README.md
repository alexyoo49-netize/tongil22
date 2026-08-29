# 통일 대표팀 메이커

남북한 선수 22명으로 대표팀을 구성하고, 7개 상대 국가에 맞는 전술과 승률을 실험하는 축구 전략 게임입니다.

## GitHub에 올리기

이 폴더 자체가 Git 저장소이며 기본 브랜치는 `main`입니다. GitHub에서 비어 있는 저장소를 **`tongil-xi-maker`**라는 이름으로 만든 뒤 이 저장소를 연결해 `main` 브랜치를 올리면 됩니다.

```bash
git remote add origin https://github.com/내아이디/tongil-xi-maker.git
git push -u origin main
```

## GitHub Pages 설정

정적 사이트 파일은 `docs/`에 포함됩니다. GitHub 저장소에서 다음과 같이 선택합니다.

1. `Settings` → `Pages`
2. `Build and deployment`의 `Source`를 `Deploy from a branch`로 선택
3. `Branch`를 `main`, 폴더를 `/docs`로 선택
4. `Save`

저장소 이름을 바꾸면 `scripts/build-github-pages.ps1`의 `NEXT_PUBLIC_BASE_PATH`도 같은 이름으로 바꾼 뒤 `npm run build:pages`를 다시 실행해야 합니다.

## 개발

```bash
npm install
npm run dev
```

GitHub Pages용 정적 파일을 갱신하려면:

```bash
npm run build:pages
```
