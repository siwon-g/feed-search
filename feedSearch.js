// グローバル変数
let allFeeds = [];
const itemsPerPage = 20; // 1ページの表示アイテム数
let currentPage = 1;

// DOM要素の取得
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    checkAuthState();
});

function initializeApp() {
    // ログイン関連
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const loginError = document.getElementById('loginError');

    loginButton.addEventListener('click', async () => {
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;

        // エラー表示をクリア
        loginError.textContent = '';
        loginError.style.display = 'none';

        if (!identifier || !password) {
            loginError.textContent = 'ユーザーIDとパスワードを入力してください';
            loginError.style.display = 'block';
            return;
        }

        try {
            await window.BLUESKY_API.login(identifier, password);
            showSearchInterface();
        } catch (error) {
            loginError.textContent = error.message;
            loginError.style.display = 'block';
        }
    });

    logoutButton.addEventListener('click', () => {
        window.BLUESKY_API.clearSession();
        showLoginForm();
    });

    // 検索関連
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    // 検索ボタンのイベントリスナー
    searchButton.addEventListener('click', () => performSearch());

    // Enterキーでの検索
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

function checkAuthState() {
    if (window.BLUESKY_API.loadSession()) {
        showSearchInterface();
    } else {
        showLoginForm();
    }
}

function showLoginForm() {
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('searchContainer').style.display = 'none';
    document.getElementById('searchNotes').style.display = 'none';
    document.getElementById('feedsContainer').innerHTML = '';
    document.getElementById('errorMessage').innerHTML = '';
    document.getElementById('headerControls').style.display = 'none'; // ログアウトボタンを非表示
    document.querySelectorAll('.pagination').forEach(el => el.style.display = 'none');
}

function showSearchInterface() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('searchContainer').style.display = 'flex';
    document.getElementById('searchNotes').style.display = 'flex';
    document.getElementById('headerControls').style.display = 'block'; // ログアウトボタンを表示
}

// 検索実行関数
async function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const loadingElement = document.getElementById('loading');
    const containerFeed = document.getElementById('feedsContainer');
    const containerError = document.getElementById('errorMessage');
    const paginationElements = document.querySelectorAll('.pagination'); // 全てのページネーション要素を取得

    const keyword = searchInput.value.trim();
    if (!keyword) {
        showError('検索キーワードを入力してください');
        return;
    }

    try {
        loadingElement.style.display = 'block';
        containerFeed.innerHTML = ''; // 既存リストのクリア
        containerError.innerHTML = ''; // エラー表示のクリア
        paginationElements.forEach(el => el.style.display = 'none'); // 検索中は非表示

        // Bluesky APIを使用して検索
        const result = await window.BLUESKY_API.searchFeeds(keyword);
        allFeeds = result.feeds || []; // データを取得
        currentPage = 1;

        if (allFeeds.length > 0) {
            updatePagination(paginationElements); // 各ページネーションを更新
            displayFeeds();
            paginationElements.forEach(el => el.style.display = 'flex'); // 検索結果がある場合に表示
        } else {
            showError('検索結果が見つかりませんでした');
        }
    } catch (error) {
        showError('検索中にエラーが発生しました: ' + error.message);
    } finally {
        loadingElement.style.display = 'none';
    }
}

// エラーメッセージ表示関数
function showError(message) {
    const container = document.getElementById('errorMessage');
    container.innerHTML = '';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message; // textContentを使用して安全に挿入

    container.appendChild(errorDiv);
}

// フィードカード作成関数
function createFeedCard(feed) {
    const feedId = feed.uri.split('/').pop();
    const feedUrl = `https://bsky.app/profile/${feed.creator.handle}/feed/${feedId}`;

    // カード本体 (Aタグ)
    const card = document.createElement('a');
    card.href = feedUrl;
    card.target = '_blank';
    card.className = 'feed-card';

    // コンテンツコンテナ
    const content = document.createElement('div');
    content.className = 'feed-content';

    // アバター画像
    const avatar = document.createElement('img');
    avatar.className = 'feed-avatar';
    avatar.src = feed.avatar || '';
    avatar.alt = `${feed.displayName} avatar`;

    // 画像読み込みエラー時のフォールバック処理 (インラインJSを使わない)
    const fallbackSvg = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22><defs><linearGradient id=%22skyGradient%22 x1=%220%%22 y1=%220%%22 x2=%22100%%22 y2=%22100%%22><stop offset=%220%%22 style=%22stop-color:%23accbee%22/><stop offset=%22100%%22 style=%22stop-color:%2366a6ff%22/></linearGradient></defs><rect width=%2264%22 height=%2264%22 fill=%22url(%23skyGradient)%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23ffffff%22 font-size=%2212%22>No Image</text></svg>';
    avatar.addEventListener('error', () => {
        avatar.src = fallbackSvg;
    }, { once: true });

    // フィード名
    const name = document.createElement('h2');
    name.className = 'feed-name';
    name.textContent = feed.displayName;

    // 作者
    const creator = document.createElement('div');
    creator.className = 'feed-creator';
    creator.textContent = `by ${feed.creator.displayName || feed.creator.handle}`;

    // 説明文
    const description = document.createElement('p');
    description.className = 'feed-description';
    description.textContent = feed.description || 'No description available';

    // いいね数
    const likes = document.createElement('div');
    likes.className = 'feed-likes';
    likes.textContent = feed.likeCount || 0;

    // 組み立て
    content.appendChild(avatar);
    content.appendChild(name);
    content.appendChild(creator);
    content.appendChild(description);
    content.appendChild(likes);
    card.appendChild(content);

    return card;
}

// ページネーション更新関数
function updatePagination(paginationElements) {
    const totalPages = Math.ceil(allFeeds.length / itemsPerPage);

    paginationElements.forEach(pagination => {
        const currentPageElement = pagination.querySelector('.currentPage');
        const totalPagesElement = pagination.querySelector('.totalPages');
        const prevButton = pagination.querySelector('.prevPage');
        const nextButton = pagination.querySelector('.nextPage');
        const firstButton = pagination.querySelector('.firstPage');
        const lastButton = pagination.querySelector('.lastPage');

        currentPageElement.textContent = currentPage;
        totalPagesElement.textContent = totalPages;

        // ボタンの有効/無効状態を更新
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages || totalPages === 0;
        firstButton.disabled = currentPage === 1;
        lastButton.disabled = currentPage === totalPages || totalPages === 0;

        // イベントリスナーの再設定
        firstButton.onclick = () => goToPage(1, paginationElements);
        lastButton.onclick = () => goToPage(totalPages, paginationElements);
        prevButton.onclick = () => goToPage(currentPage - 1, paginationElements);
        nextButton.onclick = () => goToPage(currentPage + 1, paginationElements);
    });
}

// 共通のページ移動処理
function goToPage(page, elements) {
    const totalPages = Math.ceil(allFeeds.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    updatePagination(elements);
    displayFeeds();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// フィード表示関数
function displayFeeds() {
    const containerFeed = document.getElementById('feedsContainer');
    containerFeed.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentFeeds = allFeeds.slice(startIndex, endIndex);

    if (currentFeeds.length === 0) {
        showError('検索結果が見つかりませんでした');
        return;
    }

    currentFeeds.forEach(feed => {
        containerFeed.appendChild(createFeedCard(feed));
    });
}