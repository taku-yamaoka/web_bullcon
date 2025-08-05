document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.category-tab');
    const productItems = document.querySelectorAll('.product-item');
    const productsGrid = document.querySelector('.products-grid');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const category = tab.dataset.category;
            const visibleItems = [];

            productItems.forEach(item => {
                if (category === 'all' || item.classList.contains(category)) {
                    item.style.display = 'block';
                    visibleItems.push(item);
                } else {
                    item.style.display = 'none';
                }
            });
            
            // アイテムの数が3未満の場合、レイアウトを調整する
            if (visibleItems.length < 3) {
                productsGrid.style.justifyContent = 'flex-start';
            } else {
                productsGrid.style.justifyContent = 'space-between';
            }
        });
    });
});