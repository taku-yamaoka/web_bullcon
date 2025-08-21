document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.category-tab');
    const productItems = document.querySelectorAll('.product-item');
    const productsGrid = document.querySelector('.products-grid');

    // フィルタリング処理を統合した関数
    function applyFilter(category) {
        tabs.forEach(t => {
            if (t.dataset.category === category) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });

        const visibleItems = [];

        productItems.forEach(item => {
            if (category === 'all' || item.dataset.category === category) {
                item.style.display = 'block';
                visibleItems.push(item);
            } else {
                item.style.display = 'none';
            }
        });

        if (visibleItems.length < 3) {
            productsGrid.style.justifyContent = 'flex-start';
        } else {
            productsGrid.style.justifyContent = 'space-between';
        }
    }

    // ページの読み込み時：URLのクエリパラメータに基づいてフィルタリングを実行
    const urlParams = new URLSearchParams(window.location.search);
    const urlCategory = urlParams.get('category');

    if (urlCategory) {
        applyFilter(urlCategory);
    } else {
        applyFilter('all');
    }

    // タブのクリックイベント (この部分は残します)
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            applyFilter(category);
        });
    });
});