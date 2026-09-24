# Privacy Policy

Last updated: 2026-09-24

This policy covers the browser extension "Login Helper for mautrix bridges" (the "extension").

## What the extension reads

Only when you click **Get login command** in the popup, on the tab you have open:

- **Slack**: the `xoxc-` session token(s) stored by the Slack web app in the tab's local storage
  (`localConfig_v2`), the workspace names and domains stored next to them, and the `d` cookie for
  `slack.com`.

## What the extension does with it

- Shows it in the popup in masked form (only the first and last 4 characters of each value).
- Copies the full value to your clipboard when you press **Copy**.

That is all. The extension:

- does **not** send any data to the developer or any third party, and makes no network requests;
- does **not** store the data (it is gone when the popup closes);
- does **not** use analytics, tracking or advertising;
- does **not** sell or transfer data, use it for any purpose other than the one above, or use it to
  determine creditworthiness or for lending.

What you do with the copied value (for example, sending it to your own mautrix bridge bot) is up to
you, and is covered by the privacy policy of that bridge's operator, not by this one.

## Permissions

The `slack.com` host permission is optional and is requested only when you first use the
extension. You can revoke it at any time from the extension's details page in your browser.

## Changes and contact

Changes to this policy are published in this file in the repository. Questions:
<https://github.com/knagato/mautrix-login-helper/issues>

---

# プライバシーポリシー（日本語）

最終更新: 2026-09-24

本ポリシーは、ブラウザ拡張「Login Helper for mautrix bridges」（以下「本拡張」）に適用されます。

## 読み取る情報

ポップアップで「ログインコマンドを取得」を押したときにだけ、開いているタブから次を読み取ります。

- **Slack**: Slack の Web アプリがタブのローカルストレージ（`localConfig_v2`）に保存している `xoxc-` セッショントークン、
  それと一緒に保存されているワークスペース名とドメイン、および `slack.com` の `d` Cookie

## 読み取った情報の扱い

- ポップアップに伏せた形（各値の先頭と末尾の4文字だけ）で表示します
- 「コピー」を押したときに、伏せていない値をクリップボードへコピーします

それ以外のことはしません。本拡張は次のことを**行いません**。

- 開発者や第三者へのデータ送信（ネットワーク通信は一切行いません）
- データの保存（ポップアップを閉じると消えます）
- 解析、トラッキング、広告
- データの販売・譲渡、上記以外の目的での利用、信用力の判定や貸付目的での利用

コピーした値をどう使うか（例: 自分の mautrix ブリッジ bot に送る）は利用者の判断によるもので、
その扱いは本ポリシーではなく、送り先のブリッジ運営者のポリシーに従います。

## 権限

`slack.com` へのアクセス権限は任意の権限で、初めて使うときにだけ求めます。ブラウザの拡張機能の詳細画面から、いつでも取り消せます。

## 変更と問い合わせ

本ポリシーの変更は、リポジトリのこのファイルで公開します。問い合わせ:
<https://github.com/knagato/mautrix-login-helper/issues>
