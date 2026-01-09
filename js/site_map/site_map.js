// sitemap_generator.js

// JSONファイルのパス
const JSON_FILE_PATH = '../../html/products/products_data.json';

// -----------------------------------------------------------
// サイトマップのHTMLを生成し、DOMに挿入する関数
// -----------------------------------------------------------
function renderSitemap(productCategories) {
    const container = document.getElementById('product-sitemap');
    if (!container) return;

    let html = '';

    productCategories.forEach(category => {
        // カテゴリカードの開始
        let cardHtml = `
            <div class="category-card">
                <h3>${category.name}</h3>
                <ul>
        `;
        
        // 製品リストの生成
        category.products.forEach(product => {
            // エスケープ処理はここでは省略していますが、実際には行うべきです
            cardHtml += `
                <li><a href="${product.main_page.url}">${product.name}</a></li>
            `;
        });

        // カテゴリカードの終了
        cardHtml += `
                </ul>
            </div>
        `;

        html += cardHtml;
    });

    // 生成したHTMLをDOMに挿入
    container.innerHTML = html;
}

// -----------------------------------------------------------
// JSONを読み込むメイン関数
// -----------------------------------------------------------
async function loadSitemapData() {
    try {
        // 外部JSONファイルを非同期で読み込む
        const response = await fetch(JSON_FILE_PATH);
        
        // HTTPエラー（404など）があれば例外を投げる
        if (!response.ok) {
            throw new Error(`Failed to fetch ${JSON_FILE_PATH}: ${response.statusText}`);
        }

        // データをJSON形式に変換
        const productData = await response.json();
        
        // 取得したデータでサイトマップをレンダリング
        renderSitemap(productData.products_data.categories);
        
    } catch (error) {
        console.error('サイトマップデータの読み込み中にエラーが発生しました:', error);
        // ユーザーに表示するためのエラーメッセージをコンテナに追加しても良い
        const container = document.getElementById('product-sitemap');
        if(container) {
             container.innerHTML = '<p style="color: red;">製品情報を読み込めませんでした。</p>';
        }
    }
}

// ページロード時に実行
document.addEventListener('DOMContentLoaded', loadSitemapData);