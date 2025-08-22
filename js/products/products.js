document.addEventListener('DOMContentLoaded', function() {
    const categoryTabs = document.querySelectorAll('.category-tab');
    const productItems = document.querySelectorAll('.product-item');

    // URLからカテゴリ情報を取得
    const urlParams = new URLSearchParams(window.location.search);
    const initialCategory = urlParams.get('category') || 'all';

    function filterProducts(category) {
        // すべてのタブから 'active' クラスを削除
        categoryTabs.forEach(tab => tab.classList.remove('active'));

        // 選択されたカテゴリのタブをアクティブにする
        const activeTab = document.querySelector(`.category-tab[data-category="${category}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // 製品をフィルタリング
        productItems.forEach(item => {
            if (category === 'all' || item.classList.contains(category)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // ページ読み込み時に初期フィルタリングを実行
    filterProducts(initialCategory);

    // タブにクリックイベントリスナーを設定
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const selectedCategory = tab.getAttribute('data-category');
            filterProducts(selectedCategory);

            // URLの変更（任意）
            const newUrl = window.location.origin + window.location.pathname + `?category=${selectedCategory}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
        });
    });

    // 戻る/進むボタンでのブラウザ履歴操作に対応（任意）
    window.addEventListener('popstate', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category') || 'all';
        filterProducts(category);
    });
});