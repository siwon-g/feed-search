# BlueSky フィード検索
[Bluesky Feeds Search](index.html "Bluesky Feeds Search")

## このサイトの目的
* 公式のフィード検索が改善されるまでの代替用
* GitHub Pagesを使ってみたかった

## 2024/11 時点の公式フィード検索の問題点
* 一度に15件しか検索出来ない
* 16件目以降の続きを検索出来ない
* いいねの多い順にしか取得出来ない

## このサイトで出来ること
* 一度に最大100件検索出来る

## このサイトで出来ないこと
* 101件目以降の続きを検索出来ない
* いいねの多い順にしか取得出来ない
* 複数キーワードやキーワード除外等の複雑な検索

### なんで出来ないの？
#### 取得上限について
* 公式と同じAPI（app.bsky.unspecced.get_popular_feed_generators）を呼んでいて、件数の条件を15件から100件に変更しただけだから
* APIで一度に取得出来る上限が100件だから（リクエストパラメータのlimitの最大値が100）
* APIが続きを取得する為のCursorを返してくれないから

#### 表示の並び順について
* APIの名称が「getPopularFeedGenerators」の通り、人気のあるフィードを取得するのを目的としているのでいいねの降順を基本としているから
* 取得後に並び替えることは一応可能だが、101件以上あった場合は取得した100件に対する並び替えになり、中途半端な結果になるから並び替え機能は追加してない

#### 複雑な検索について
* APIが対応してないから

## その他
* app.bsky.unspecced.get_popular_feed_generators については [The AT Protocol SDK](https://atproto.blue/en/latest/atproto/atproto_client.models.app.bsky.unspecced.get_popular_feed_generators.html "") を参照
  * Request, Response両方にCursorの記述があるが、実際にはResponseにCursorが返ってこないのが続きを取得出来ない原因
  * その内修正されると思う
