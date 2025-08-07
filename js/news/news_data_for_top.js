// DOMContentLoadedはHTML要素が読み込まれた後に実行されることを保証します
document.addEventListener('DOMContentLoaded', () => {
    // トップページのお知らせを表示するHTML要素のIDを取得
    const topNewsList = document.getElementById('news-placeholder');
    
    // 最新3件のお知らせを取得
    const latestNews = newsData.slice(0, 3);

    let newsHtml = '';
    latestNews.forEach(news => {
        // urlパラメータが存在するかどうかでタグとクラスを切り替える
        const itemTag = news.url ? 'a' : 'div';
        const hrefAttribute = news.url ? `href="${news.url}"` : '';

        newsHtml += `
            <${itemTag} ${hrefAttribute} class="news-item ${news.url ? '' : 'non-clickable'}">
                <time datetime="${news.date}">${news.date}</time>
                <span class="news-title">${news.title}</span>
            </${itemTag}>
        `;
    });
    
    topNewsList.innerHTML = `<div class="news-list-container">${newsHtml}</div>`;
});