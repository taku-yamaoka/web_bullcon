// メーカー名をキーとしてリスト化
const manufacturerKeys = ["toyota", "lexus", "nissan", "honda", "mitsubishi", "subaru", "suzuki", "daihatsu", "mazda", "isuzu"];
const pdfListContainer = document.getElementById('pdf-list-container');
const loadingMessage = document.getElementById('loading-message');

/**
 * PDFファイルの最終更新日を取得する非同期関数
 * @param {string} url - PDFファイルのURL
 * @returns {Promise<string>} - フォーマットされた更新日、またはエラーメッセージ
 */
async function getPdfLastModified(url) {
    try {
        // HEADリクエストでヘッダー情報のみを取得（ファイルはダウンロードしない）
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
            const lastModified = response.headers.get('Last-Modified');
            if (lastModified) {
                const date = new Date(lastModified);
                // YYYY.MM.DD形式にフォーマット
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}.${month}.${day}`;
            }
        }
        return '日付取得失敗';
    } catch (error) {
        console.error('Error fetching file date:', error);
        return '日付取得失敗';
    }
}

/**
 * データをカテゴリごとにグループ化する
 * @param {Array<Object>} data - 製品データの配列
 * @returns {Map<string, Array<Object>>} - カテゴリ名をキーとするマップ
 */
function groupDataByCategory(data) {
    const groupedData = new Map();
    let currentCategory = null;

    for (const item of data) {
        if (item.type === "category") {
            currentCategory = item.categoryName;
            if (!groupedData.has(currentCategory)) {
                groupedData.set(currentCategory, []);
            }
        } else if (currentCategory) {
            groupedData.get(currentCategory).push(item);
        }
    }
    return groupedData;
}

/**
 * データを元にカテゴリごとのテーブルを構築し、DOMに出力する
 * @param {Array<Object>} data - 製品データの配列
 */
async function renderCategoryTables(data) {
    if (!pdfListContainer) return;

    // 最初にローディングメッセージを非表示にする
    if (loadingMessage) {
        loadingMessage.remove();
    }
    
    // カテゴリごとのデータにグループ化
    const groupedData = groupDataByCategory(data);
    
    // 既に存在する内容をクリア
    pdfListContainer.innerHTML = ''; 

    // 各カテゴリのテーブルを生成
    for (const [categoryName, products] of groupedData.entries()) {
        if (products.length === 0) continue;

        // 1. <details> 要素の作成
        const details = document.createElement('details');
        details.classList.add('category-details');

        // 2. <summary> 要素の作成 (カテゴリ名)
        const summary = document.createElement('summary');
        summary.classList.add('category-summary');
        summary.innerHTML = categoryName; 
        details.appendChild(summary);

        // 3. テーブルラッパーの作成 (横スクロール対応)
        const tableWrapper = document.createElement('div');
        tableWrapper.classList.add('table-wrapper'); 

        // 4. テーブルヘッダー (top-scroller) の作成
        const topScroller = document.createElement('div');
        topScroller.id = `top-scroller-${categoryName.replace(/[^a-zA-Z0-9]/g, '')}`;
        topScroller.classList.add('top-scroller');
        topScroller.innerHTML = '<div></div>'; // スクロール幅設定用のインナー
        
        // detailsが開かれたときにスクロール同期を設定する
        details.addEventListener('toggle', () => {
            if (details.open) {
                // 内部テーブルが描画されてから幅同期とスクロール同期を設定
                setTimeout(() => {
                    syncTableWidths(details);
                    setupScrollSynchronization(details);
                }, 0); 
            }
        });
        
        details.appendChild(topScroller);


        // 5. <table> 要素の作成
        const table = document.createElement('table');

        // 6. <thead> の作成
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>製品名</th>
                <th>区分</th>
                <th>補足</th>
                <th>トヨタ</th>
                <th>レクサス</th>
                <th>ニッサン</th>
                <th>ホンダ</th>
                <th>ミツビシ</th>
                <th>スバル</th>
                <th>スズキ</th>
                <th>ダイハツ</th>
                <th>マツダ</th>
                <th>イスズ</th>
            </tr>
        `;
        table.appendChild(thead);

        // 7. <tbody> の作成とデータ行の追加
        const tbody = document.createElement('tbody');
        for (const product of products) {
            // product.rowsをループする際にインデックス(rowIndex)を使用
            product.rows.forEach((rowData, rowIndex) => { 
                const tr = document.createElement('tr');
                
                // 製品名セルの生成ロジックを変更
                const tdProduct = document.createElement('td');
                tdProduct.classList.add('first-column'); // スタイル調整用のクラス

                if (rowIndex === 0) {
                    // 最初の行: リンク付きの製品名を表示
                    const a = document.createElement('a');
                    a.href = product.productLink;
                    a.textContent = product.productName;
                    tdProduct.appendChild(a);
                    tdProduct.classList.add('product-name-cell');
                } else {
                    // 2行目以降: 「同上」を表示 (リンクなし)
                    tdProduct.textContent = '同上';
                    tdProduct.classList.add('ditto-cell');
                }

                tr.appendChild(tdProduct);

                // 区分セル
                const tdCategory = document.createElement('td');
                tdCategory.textContent = rowData.category;
                tr.appendChild(tdCategory);

                // 区分2セル (補足)
                const tdCategory2 = document.createElement('td');
                tdCategory2.innerHTML = rowData.category2;
                tr.appendChild(tdCategory2);
                
                // 適合情報セル
                if (rowData.links.note) {
                    const tdNote = document.createElement('td');
                    tdNote.setAttribute('colspan', 10); // メーカー9列分を結合
                    tdNote.classList.add('bg-yellow');
                    const a = document.createElement('a');
                    a.href = rowData.links.link;
                    a.textContent = rowData.links.note;
                    tdNote.appendChild(a);
                    tr.appendChild(tdNote);
                } else {
                    for (const manufacturer of manufacturerKeys) {
                        const linkData = rowData.links[manufacturer];
                        const tdLink = document.createElement('td');

                        if (!linkData || linkData.pdf === "-") {
                            tdLink.textContent = "-";
                        } else if (linkData.pdf === "動作未確認") {
                            tdLink.textContent = "動作未確認";
                        } else {
                            const a = document.createElement('a');
                            a.href = linkData.pdf;
                            a.target = "_blank";
                            const img = document.createElement('img');
                            img.src = "../../images/common/pdf_icon.webp";
                            img.alt = "PDFアイコン";
                            img.classList.add('pdf-icon');
                            a.appendChild(img);

                            const dateElement = document.createElement('div');
                            dateElement.textContent = '日付取得中...'; // ローディングテキスト
                            if (window.innerWidth < 600) {
                              dateElement.style.fontSize = "0.65em";
                            } else {
                              dateElement.style.fontSize = "0.85em";
                            }
                            dateElement.style.marginTop = "5px";
                            dateElement.classList.add('date-text');
                            tdLink.appendChild(a);
                            tdLink.appendChild(dateElement);
                            
                            // 非同期で日付を取得し、表示を更新
                            getPdfLastModified(linkData.pdf).then(date => {
                                dateElement.textContent = `${date} 更新`;
                            }).catch(() => {
                                dateElement.textContent = '取得エラー';
                            });
                        }
                        tr.appendChild(tdLink);
                    }
                }
                tbody.appendChild(tr);
            });
        }
        table.appendChild(tbody);
        
        // テーブルをラッパーに追加
        tableWrapper.appendChild(table);
        // ラッパーをdetailsに追加
        details.appendChild(tableWrapper);
        
        // detailsをメインコンテナに追加
        pdfListContainer.appendChild(details);
    }
}

/**
 * ヘッダーの列幅をボディの列幅に合わせて調整する & 上部スクロールバーの幅をテーブルに合わせる
 * @param {HTMLElement} detailsElement - 現在の <details> 要素
 */
function syncTableWidths(detailsElement) {
    const tableWrapper = detailsElement.querySelector('.table-wrapper');
    const table = detailsElement.querySelector('table');
    const headerCells = table ? table.querySelectorAll('thead th') : [];
    const bodyRows = table ? table.querySelectorAll('tbody tr') : [];
    const topScrollerInner = detailsElement.querySelector('.top-scroller > div');

    if (!table || bodyRows.length === 0 || !topScrollerInner) {
        return;
    }

    // colspanのない最初のデータ行を見つける (注釈行はスキップ)
    let firstDataRowCells = null;
    for (const row of bodyRows) {
        const cells = row.querySelectorAll('td');
        // ヘッダーセル数と同じ数（12列）のセルを持つ行を探す (製品名1 + 区分1 + 補足1 + メーカー9 = 12)
        if (cells.length === headerCells.length) { 
            firstDataRowCells = cells;
            break;
        }
    }

    if (firstDataRowCells) {
        // 1. ヘッダーの列幅をボディに合わせる
        headerCells.forEach((headerCell, index) => {
            if (firstDataRowCells[index]) {
                // tbodyのセルの計算済み幅を取得
                const cellWidth = firstDataRowCells[index].offsetWidth;
                headerCell.style.width = `${cellWidth}px`;
                headerCell.style.minWidth = `${cellWidth}px`;
                // ヘッダーセルの幅を固定
                headerCell.style.boxSizing = 'border-box';
            }
        });
    }

    // 2. テーブル全体の幅を上部スクロールバーに反映
    // table.scrollWidth は table-wrapperのwidthを無視した実際のコンテンツ幅を返します
    const scrollWidth = table.scrollWidth; 
    topScrollerInner.style.width = `${scrollWidth}px`;
}

/**
 * 上部ダミーバーとメインテーブルラッパーのスクロールを同期させる
 * @param {HTMLElement} detailsElement - 現在の <details> 要素
 */
function setupScrollSynchronization(detailsElement) {
    const topScroller = detailsElement.querySelector('.top-scroller');
    const tableWrapper = detailsElement.querySelector('.table-wrapper');
    
    if (!topScroller || !tableWrapper) return;
    
    let isSyncing = false;

    // 上部スクロールバーを動かしたとき、テーブルラッパーを同期
    topScroller.addEventListener('scroll', () => {
        if (!isSyncing) {
            isSyncing = true;
            tableWrapper.scrollLeft = topScroller.scrollLeft;
            // 次のイベントループでフラグをリセットすることで、無限ループを防ぐ
            setTimeout(() => { isSyncing = false; }, 0); 
        }
    }, { passive: true }); // パフォーマンス向上のため passive を追加

    // テーブルラッパーを動かしたとき、上部スクロールバーを同期
    tableWrapper.addEventListener('scroll', () => {
        if (!isSyncing) {
            isSyncing = true;
            topScroller.scrollLeft = tableWrapper.scrollLeft;
            // 次のイベントループでフラグをリセットすることで、無限ループを防ぐ
            setTimeout(() => { isSyncing = false; }, 0);
        }
    }, { passive: true });
}


// データのロードとテーブル生成の開始
document.addEventListener('DOMContentLoaded', () => {
    
    // JSONデータを読み込む
    fetch('./match_pdf.json')
        .then(response => {
            if (!response.ok) {
                // ファイルが見つからない、またはネットワークエラー
                throw new Error(`match_pdf.json の読み込みに失敗しました (${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            renderCategoryTables(data); // カテゴリ別テーブル生成開始
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            // エラー表示処理
            if (pdfListContainer) {
                pdfListContainer.innerHTML = '<p style="color: red; text-align: left;">適合データの読み込みに失敗しました。ファイルパスまたはJSON形式を確認してください。</p>';
            }
        });
        
    // ウィンドウのリサイズ時にも幅を再同期 (全ての開いているテーブルに対して実行)
    window.addEventListener('resize', () => {
        document.querySelectorAll('.category-details[open]').forEach(details => {
            syncTableWidths(details);
        });
    });
});
