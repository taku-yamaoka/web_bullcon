import { PRODUCTS_DATA } from './data_mapper.js';
// --- 必要な関数をメインのJSファイルからインポート ---
import { getSavedItemsMap, setSavedItemsMap, getRowUniqueId,
    createPriceCellHtml, createNotesCellHtml } from './result_renderer.js'; 

// --- DOM要素の取得 ---
const savedItemsDialog = document.getElementById('saved-items-dialog');
const showDialogButton = document.getElementById('show-saved-items-button');
const closeDialogButton = document.getElementById('close-saved-items-button');
const savedItemsListContainer = document.getElementById('saved-items-list');

/**
 * 保存済み一覧のリストHTMLを生成し、コンテナに挿入する
 */
function renderSavedItemsList() {
    if (!savedItemsListContainer) return;

    // 新しいデータ構造でデータを取得
    const savedData = getSavedItemsMap();
    const productNames = Object.keys(savedData);

    savedItemsListContainer.innerHTML = ''; // リストをクリア

    if (productNames.length === 0) {
        savedItemsListContainer.innerHTML = '<p>保存されている適合リストはありません。</p>';
        return;
    }

    // 製品ごとにループ処理
    productNames.forEach(productName => {
        const productData = savedData[productName];
        const headerData = productData.headerData;
        const items = productData.items;
        const itemValues = Object.values(items);
        const allColumns = headerData.flatMap(h => h.subHeaders);

        // 製品ごとのコンテナを作成
        const productSection = document.createElement('div');
        productSection.className = 'product-section';

        // 製品名タイトル
        const title = document.createElement('h4');
        title.textContent = `製品: ${getProductName(productName)}`; // 製品名を表示
        productSection.appendChild(title);
        
        // 製品ごとのテーブルを作成
        const table = document.createElement('table');
        table.className = 'saved-items-table'; 

        // --- テーブルヘッダーの生成 ---
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerData.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header.label;
            th.setAttribute('colspan', header.subHeaders.length);
            th.className = 'saved-th saved-th-group';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // --- テーブルサブヘッダーの生成 ---
        const subHeaderRow = document.createElement('tr');
        allColumns.forEach(col => {
            const thSub = document.createElement('th');
            // メーカーに基づく 'nav_col_2' のラベル切り替え処理
            if (col.label === 'nav_col_2') {
                thSub.textContent = 'サービスホールスイッチ切替タイプ/LEDスイッチ切替タイプ_2';
            } else {
                thSub.textContent = col.label;
            }
            thSub.className = 'saved-th saved-th-sub';
            subHeaderRow.appendChild(thSub);
        });
        const actionTh = document.createElement('th');
        actionTh.textContent = '操作';
        actionTh.className = 'saved-th saved-th-action';
        subHeaderRow.appendChild(actionTh);
        thead.appendChild(subHeaderRow);
        table.appendChild(thead);

        // --- テーブルボディの生成 ---
        const tbody = document.createElement('tbody');
        itemValues.forEach(item => {
            const rowId = getRowUniqueId(item);
            const row = document.createElement('tr');
            row.className = 'saved-tr'; 
            allColumns.forEach(col => {
                const td = document.createElement('td');
                td.className = 'saved-td'; 
                if (col.priceKeys) {
                    // 価格とオプション列
                    td.innerHTML = createPriceCellHtml(item, col);
                } else if (col.key === 'notes') {
                    // 注意事項列 (番号を整形して表示)
                    td.innerHTML = createNotesCellHtml(item);
                } else {
                    // 標準データ列
                    td.innerHTML = (item[col.key] || '').replace(/\n/g, '<br>');
                }
                row.appendChild(td);
            });
            
            const actionTd = document.createElement('td');
            actionTd.className = 'saved-td saved-td-action'; 
            const removeButton = document.createElement('button');
            removeButton.textContent = '削除';
            removeButton.className = 'remove-saved-item-button';
            removeButton.dataset.rowId = rowId;
            removeButton.dataset.productName = productName; // 製品名も付与
            actionTd.appendChild(removeButton);
            row.appendChild(actionTd);
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        productSection.appendChild(table);
        savedItemsListContainer.appendChild(productSection);
    });

    // 新しく生成された「削除」ボタンにイベントリスナーを再設定
    savedItemsListContainer.querySelectorAll('.remove-saved-item-button').forEach(button => {
        button.addEventListener('click', handleRemoveSavedItem);
    });
}


/**
 * 「削除」ボタンがクリックされたときの処理
 */
function handleRemoveSavedItem(event) {
    const { rowId, productName } = event.target.dataset; // 製品名も取得
    if (!rowId || !productName) return;

    let savedData = getSavedItemsMap();
    
    if (savedData[productName] && savedData[productName].items[rowId]) {
        // アイテムを削除
        delete savedData[productName].items[rowId];
        // アイテムが0になったら製品グループごと削除
        if (Object.keys(savedData[productName].items).length === 0) {
            delete savedData[productName];
        }
        setSavedItemsMap(savedData);
    }
    
    // UIの同期
    const checkboxId = `checkbox-${rowId.replace(/[^a-zA-Z0-9-]/g, '_')}`;
    const checkboxInTable = document.getElementById(checkboxId);
    if (checkboxInTable) {
        checkboxInTable.checked = false;
    }

    renderSavedItemsList(); // リストを再描画
}

// --- イベントリスナーの設定 ---
if (showDialogButton && savedItemsDialog) {
    // 「一覧を表示」ボタンをクリックしたら、リストを更新してダイアログを開く
    showDialogButton.addEventListener('click', () => {
        renderSavedItemsList(); // ダイアログを開く直前にリストを最新の状態に更新
        savedItemsDialog.showModal(); // モーダルダイアログとして表示
    });
}

if (closeDialogButton && savedItemsDialog) {
    // 「閉じる」ボタンでダイアログを閉じる
    closeDialogButton.addEventListener('click', () => {
        savedItemsDialog.close();
    });
}

function getProductName(productName) {
    const productArray = Object.values(PRODUCTS_DATA);
    const foundProduct = productArray.find(product_data => {
        return product_data.productKey === productName; 
    });

    if (foundProduct) {
        return foundProduct.name;
    }

    return productName;
}