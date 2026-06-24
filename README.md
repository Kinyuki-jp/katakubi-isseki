# 肩首一席

近畿大学ベースキャンプ向けの予約ページです。

## 公開

この `outputs` フォルダの中身をGitHubリポジトリのルートとしてpushしてください。

```bash
git push
```

リモート未設定の場合だけ、初回に `git remote add origin <GitHub repository URL>` を実行してください。

## 時間枠

ページ下部の「時間枠を編集」から、日付と時間を自由に追加できます。
保存した枠はブラウザに保持され、JSON書き出し/読み込みで移行できます。

公開用の初期枠は `availability.json` から読み込まれます。
枠をGitHubに反映する場合は、書き出したJSONを `availability.json` として置き換えてcommitし、pushしてください。
