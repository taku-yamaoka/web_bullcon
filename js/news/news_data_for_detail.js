// news_list_page.js の中身
document.addEventListener('DOMContentLoaded', () => {
    const newsListSection = document.getElementById('news-section-placeholder');
    
    // newsData配列の全項目をループ処理
    const newsListHtml = newsData.map(news => {
        // urlパラメータが存在するかどうかでタグとクラスを切り替える
        const itemTag = news.url ? 'a' : 'div';
        const hrefAttribute = news.url ? `href="${news.url}"` : '';

        return `
            <${itemTag} ${hrefAttribute} class="news-list-item ${news.url ? '' : 'non-clickable'}">
                <time datetime="${news.date}">${news.date}</time>
                <span class="news-title">${news.title}</span>
                <p class="news-summary">${news.summary}</p>
            </${itemTag}>
        `;
    }).join('');

    newsListSection.innerHTML = `
        <div class="news-list-container">
            ${newsListHtml}
        </div>
    `;
});