// Bluesky API通信用モジュール
const BLUESKY_API = {
    baseUrl: 'https://bsky.social/xrpc/',
    session: null,

    // 認証情報をセッションストレージに保存
    saveSession(session) {
        sessionStorage.setItem('bluesky_session', JSON.stringify(session));
    },

    // 認証情報をセッションストレージから読み込み
    loadSession() {
        const saved = sessionStorage.getItem('bluesky_session');
        if (saved) {
            this.session = JSON.parse(saved);
            return true;
        }
        return false;
    },

    // 認証情報をクリア
    clearSession() {
        sessionStorage.removeItem('bluesky_session');
        this.session = null;
    },

    // ログイン処理
    async login(identifier, password) {
        try {
            const response = await fetch(`${this.baseUrl}com.atproto.server.createSession`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ identifier, password })
            });

            if (!response.ok) {
                throw new Error('認証に失敗しました。ユーザーIDまたはアプリパスワードを確認してください。');
            }

            this.session = await response.json();
            this.saveSession(this.session);
            return this.session;
        } catch (error) {
            console.error('ログインエラー:', error.message);
            throw error;
        }
    },

    // フィード検索
    async searchFeeds(keyword, limit = 100) {
        try {
            // セッションが無い場合はログイン
            if (!this.session?.accessJwt) {
                throw new Error('認証が必要です。再度ログインしてください。');
            }

            const response = await fetch(
                `${this.baseUrl}app.bsky.unspecced.getPopularFeedGenerators?limit=${limit}&query=${encodeURIComponent(keyword)}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.session.accessJwt}`,
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    this.clearSession();
                    throw new Error('認証の有効期限が切れました。もう一度ログインしてください。');
                }
                throw new Error(`responseコード ${response.status}）`);
            }

            return await response.json();
        } catch (error) {
            console.error('検索エラー:', error.message);
            throw error;
        }
    }
};

// グローバルスコープに公開
window.BLUESKY_API = BLUESKY_API;