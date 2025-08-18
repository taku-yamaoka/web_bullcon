// DOMContentLoadedはHTML要素が読み込まれた後に実行されることを保証します
document.addEventListener('DOMContentLoaded', () => {
    // トップページのお知らせを表示するHTML要素のIDを取得
    const topNewsList = document.getElementById('products-news-placeholder');
    
    // 最新3件のお知らせを取得
    const latestNews = newsData.slice(0, 3);

    let newsHtml = '';
    latestNews.forEach(news => {
        // urlパラメータが存在するかどうかでタグとクラスを切り替える
        const itemTag = news.url ? 'a' : 'div';
        const hrefAttribute = news.url ? `href="${news.url}"` : '';
        const icon = news.url ? '<img src="/images/common/new_window_icon.png" class="new-window-icon">' : '';

        newsHtml += `
            <${itemTag} ${hrefAttribute} class="news-item ${news.url ? '' : 'non-clickable'}">
                <time datetime="${news.date}">${news.date}</time>
                <span class="news-title">${news.title}</span>
                ${icon}
            </${itemTag}>
        `;
    });
    
    topNewsList.innerHTML = `<div class="news-list-container">${newsHtml}</div>`;
});