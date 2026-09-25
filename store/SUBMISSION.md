# Chrome ウェブストア提出メモ

Developer Dashboard の各欄に貼る内容。英語が既定の掲載、日本語は追加の言語として入れる。
コードブロックの中をそのまま貼る。

## 0. 事前準備（アカウント）

- [ ] Developer Dashboard に登録（初回 $5）。Google アカウントは 2 段階認証が必須
- [ ] 連絡先メールアドレスを確認済みにする（審査結果・違反通知が届く）
- [ ] 事業者かどうかの申告（EU DSA）: 無料の個人ツールなので「非事業者（non-trader）」
- [ ] 公開リポジトリ `knagato/login-helper-for-mautrix` が公開済みで、`PRIVACY.md` が見られる

## 1. パッケージ

`./build.sh` → `dist/login-helper-for-mautrix-<version>.zip` をアップロード。

## 2. ストア掲載情報（Store listing）

名前と概要は manifest（`_locales`）から自動で入る。

**説明（English）**

```
Log in to your mautrix-slack bridge without digging through developer tools.

mautrix-slack's token login needs two values from your browser: the xoxc- token that the Slack web app keeps in local storage, and the "d" cookie, which is HttpOnly and cannot be read from the page. This extension reads both from the Slack tab you are signed in to and builds the command to send to your bridge bot:

    login token xoxc-... xoxd-...

How to use
1. Open Slack in the browser (app.slack.com) and sign in.
2. Click the extension icon, then "Get login command".
3. The first time, allow access to slack.com.
4. Copy the command for your workspace and send it to your mautrix-slack bot.

Privacy
- Tokens are never shown in full: the popup shows only the first and last 4 characters, and the full command goes only to the clipboard. Safe for screenshots and screen sharing.
- Nothing is sent anywhere, nothing is stored, no analytics.
- Access to slack.com is an optional permission requested only when you use it.
- Source code: https://github.com/knagato/login-helper-for-mautrix

The command gives full access to your Slack account. Only send it to your own bridge bot.

This is an unofficial tool. It is not affiliated with, endorsed by, or sponsored by Slack Technologies or the mautrix project.
```

**説明（日本語）**

```
開発者ツールを開かずに、mautrix-slack ブリッジにログインするための拡張機能です。

mautrix-slack のトークンログインには、ブラウザにある 2 つの値が必要です。Slack の Web アプリがローカルストレージに保存している xoxc- トークンと、ページからは読めない（HttpOnly の）「d」Cookie です。この拡張は、サインイン中の Slack のタブからこの 2 つを読み取り、ブリッジ bot に送るコマンドを組み立てます。

    login token xoxc-... xoxd-...

使い方
1. ブラウザで Slack（app.slack.com）を開き、サインインする
2. 拡張のアイコンを押し、「ログインコマンドを取得」を押す
3. 初回だけ slack.com へのアクセスを許可する
4. ワークスペースのコマンドをコピーし、mautrix-slack の bot に送る

プライバシー
- トークンは画面に全体を表示しません。先頭と末尾の4文字だけを出し、伏せていないコマンドはクリップボードにだけ入ります。スクリーンショットや画面共有にも写りません。
- 外部への送信、保存、解析は一切しません。
- slack.com へのアクセスは任意の権限で、使うときにだけ求めます。
- ソースコード: https://github.com/knagato/login-helper-for-mautrix

コマンドは Slack アカウントそのものと同じ権限を持ちます。自分のブリッジ bot 以外には送らないでください。

非公式のツールです。Slack 社および mautrix プロジェクトとは関係ありません。
```

| 欄 | 値 |
|---|---|
| カテゴリ | Developer Tools（なければ最も近いもの） |
| 言語 | English（既定）、日本語 |
| アイコン | `extension/icons/icon-128.png` |
| スクリーンショット | `store/images/screenshot-en.png`（日本語の掲載には `screenshot-ja.png`） |
| 小さいプロモーション タイル | `store/images/promo-440x280.png` |
| ホームページ URL | `https://github.com/knagato/login-helper-for-mautrix` |
| サポート URL | `https://github.com/knagato/login-helper-for-mautrix/issues` |
| 成人向けコンテンツ | いいえ |

## 3. プライバシー（Privacy practices）

**単一用途（Single purpose）**

```
Build the login command for a mautrix Matrix bridge (currently mautrix-slack) from the credentials of the Slack tab the user is signed in to, and show it in the popup so the user can copy it to their own bridge bot.
```

**権限の理由（Permission justification）**

activeTab:
```
When the user clicks the toolbar icon and presses "Get login command", the extension reads the Slack web app's local storage (localConfig_v2) in that tab to get the user's xoxc- token. activeTab limits this to the tab the user chose.
```

scripting:
```
Used with activeTab to run one function in the Slack tab that reads localStorage.localConfig_v2 and returns the workspace names and xoxc- tokens. No code is injected persistently and no page content is modified.
```

cookies:
```
mautrix-slack's token login also needs the "d" cookie for slack.com. It is HttpOnly, so it cannot be read from the page; the extension reads only this one cookie with chrome.cookies.get and puts it into the login command, which the popup shows masked and copies to the clipboard.
```

Host permission（https://*.slack.com/*、optional）:
```
Required by the cookies API to read the "d" cookie for slack.com. Declared as an optional host permission and requested only when the user first presses "Get login command"; it is not granted at install time.
```

**リモートコード**: いいえ（No, I am not using remote code）

**データ利用（Data usage）**

外部へは送らないが、認証情報を扱うため、控えめに申告しておく。

- [x] Authentication information
- それ以外はチェックしない

誓約の 3 項目はすべてチェックする:

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

**プライバシーポリシー URL**

```
https://github.com/knagato/login-helper-for-mautrix/blob/main/PRIVACY.md
```

## 4. 配布（Distribution）

| 欄 | 値 |
|---|---|
| 公開範囲 | 限定公開（Unlisted） |
| 地域 | すべての地域 |
| 価格 | 無料 |

## 5. テスト手順（「追加の手順」欄、500文字以内。ユーザー名とパスワードは空欄）

```
No bridge server or special account is needed to check the behavior.
1. Sign in to any Slack workspace at https://app.slack.com (a free workspace is fine).
2. Click the extension icon, then "Get login command". Allow access to slack.com when asked.
3. The popup shows one masked "login token xoxc***1a2b xoxd***3c4d" line per signed-in workspace, with a Copy button that copies the full command.
It makes no network requests (right-click the popup → Inspect → Network).
```

## 6. 公開後

- [x] 2026-09-26 公開。限定公開なので README にはストアの URL を書かない（利用者には個別に案内する）
- [ ] 版を上げるときは `extension/manifest.json` の `version` を上げ、`./build.sh` → アップロード（毎回審査あり）
