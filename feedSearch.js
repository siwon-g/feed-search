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
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');

    // 検索ボタンのイベントリスナー
    searchButton.addEventListener('click', () => performSearch());

    // Enterキーでの検索
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // ページネーションのイベントリスナー
    prevButton.addEventListener('click', handlePrevPage);
    nextButton.addEventListener('click', handleNextPage);
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
        containerFeed.innerHTML = '';
        containerError.innerHTML = '';
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
    container.innerHTML = `<div class="error-message">${message}</div>`;
}

// フィードカード作成関数
function createFeedCard(feed) {
    const feedId = feed.uri.split('/').pop();
    const feedUrl = `https://bsky.app/profile/${feed.creator.handle}/feed/${feedId}`;

    const card = document.createElement('a');
    card.href = feedUrl;
    card.target = '_blank';
    card.className = 'feed-card';

    card.innerHTML = `
        <div class="feed-content">
        <img class="feed-avatar" src="${feed.avatar}" alt="${feed.displayName} avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22><defs><linearGradient id=%22skyGradient%22 x1=%220%%22 y1=%220%%22 x2=%22100%%22 y2=%22100%%22><stop offset=%220%%22 style=%22stop-color:%23accbee%22/><stop offset=%22100%%22 style=%22stop-color:%2366a6ff%22/></linearGradient></defs><rect width=%2264%22 height=%2264%22 fill=%22url(%23skyGradient)%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23ffffff%22 font-size=%2212%22>No Image</text></svg>'">
            <h2 class="feed-name">${feed.displayName}</h2>
            <div class="feed-creator">by ${feed.creator.displayName}</div>
            <p class="feed-description">${feed.description || 'No description available'}</p>
            <div class="feed-likes">${feed.likeCount || 0}</div>
        </div>
    `;

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
        nextButton.disabled = currentPage === totalPages;
        firstButton.disabled = currentPage === 1;
        lastButton.disabled = currentPage === totalPages;

        // 「最初のページ」ボタンのイベントリスナー
        firstButton.onclick = () => {
            if (currentPage !== 1) {
                currentPage = 1;
                updatePagination(paginationElements);
                displayFeeds();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        // 「最後のページ」ボタンのイベントリスナー
        lastButton.onclick = () => {
            if (currentPage !== totalPages) {
                currentPage = totalPages;
                updatePagination(paginationElements);
                displayFeeds();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        // 「前のページ」ボタンのイベントリスナー
        prevButton.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                updatePagination(paginationElements);
                displayFeeds();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        // 「次のページ」ボタンのイベントリスナー
        nextButton.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                updatePagination(paginationElements);
                displayFeeds();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
    });
}

// フィード表示関数
function displayFeeds() {
    const containerFeed = document.getElementById('feedsContainer');
    containerFeed.innerHTML = '';
    const containerError = document.getElementById('errorMessage');
    containerError.innerHTML = '';
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

// ページ移動処理関数
function handlePrevPage() {
    if (currentPage > 1) {
        currentPage--;
        updatePagination();
        displayFeeds();
    }
}

function handleNextPage() {
    const totalPages = Math.ceil(allFeeds.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
        displayFeeds();
    }
}
