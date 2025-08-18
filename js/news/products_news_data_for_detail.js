// news_list_page.js の中身
document.addEventListener('DOMContentLoaded', () => {
    const newsListSection = document.getElementById('products-news-section-placeholder');
    
    // 表示するアイテムの初期数と増加数を設定
    let itemsToShow = 5;
    const itemsToAdd = 10;

    // もっと見るボタンを作成
    const loadMoreButton = document.createElement('button');
    loadMoreButton.textContent = 'もっと見る';
    loadMoreButton.className = 'load-more-button';

    const renderNews = () => {
        // 表示するお知らせの配列を切り出し
        const displayedNews = productNewsData.slice(0, itemsToShow);

        const newsListHtml = displayedNews.map(news => {
            const itemTag = news.url ? 'a' : 'div';
            const hrefAttribute = news.url ? `href="${news.url}"` : '';
            const icon = news.url ? '<img src="/images/common/new_window_icon.png" class="new-window-icon">' : '';

            return `
                <${itemTag} ${hrefAttribute} class="news-list-item ${news.url ? '' : 'non-clickable'}">
                    <time datetime="${news.date}">${news.date}</time>
                    <span class="news-title">${news.title} ${icon}</span>
                    <p class="news-summary">${news.summary}</p>
                </${itemTag}>
            `;
        }).join('');

        newsListSection.innerHTML = `
            <div class="news-list-container">
                ${newsListHtml}
            </div>
        `;

        // 全てのお知らせが表示されたらボタンを非表示にする
        if (itemsToShow < productNewsData.length) {
            newsListSection.parentElement.appendChild(loadMoreButton);
        } else {
            if (loadMoreButton.parentNode) {
                loadMoreButton.parentNode.removeChild(loadMoreButton);
            }
        }
    };

    // もっと見るボタンがクリックされた時の処理
    loadMoreButton.addEventListener('click', () => {
        itemsToShow += itemsToAdd;
        renderNews();
    });

    // 初回表示
    renderNews();
});