# 残響 — TYPE IN FLUX

「芸術工学部」「小倉悠悟」を素材にした、全画面のプロシージャル・タイポグラフィ作品。

03「残響」の構成で文字と帯が流れ続けます。操作パネルやヘッダーはありません。マウスの位置に透明なレンズが現れ、文字を拡大・屈折させます。スマートフォンでは指で触れている間にレンズが現れます。

HTML / CSS / Canvas 2Dのみで動作します。外部ライブラリ、外部フォント、ビルド、APIキーは不要です。OSで「視差効果を減らす」などを設定している場合は静止画になります。ポインターのレンズ操作は可能です。

## GitHub Pagesで公開

1. このフォルダーの中身を、GitHubリポジトリーのルートに置きます。`.github/workflows/pages.yml`も含めます。
2. リポジトリーの Settings → Pages → Build and deployment → Source を「GitHub Actions」にします。
3. `main`ブランチにpushします。Actionsの「Publish GitHub Pages」が公開します。既にpush済みの場合はworkflowを手動実行できます。

参考: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

公開先のリポジトリーは未指定のため、この納品時点ではGitHubへの公開は行っていません。

## ローカルで見る

このフォルダーで `python3 -m http.server 4173` を実行し、ブラウザーで `http://localhost:4173` を開きます。

## ファイル

- `index.html`: ページ情報とキャンバス
- `style.css`: 全画面レイアウト
- `art.js`: 文字の生成、流れ、ガラスの屈折
- `favicon.svg`: タブアイコン
- `.github/workflows/pages.yml`: GitHub Pages公開設定
