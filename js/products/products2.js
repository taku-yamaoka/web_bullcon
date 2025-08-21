document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.category-selector-sidebar .category-tab');
    const products = document.querySelectorAll('.products-grid .product-item');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // アクティブクラスの切り替え
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const category = tab.getAttribute('data-category');

            products.forEach(product => {
                if (category === 'all' || product.classList.contains(category)) {
                    product.style.display = 'flex'; // リストビューに合わせて表示方法を変更
                } else {
                    product.style.display = 'none';
                }
            });
        });
    });
});