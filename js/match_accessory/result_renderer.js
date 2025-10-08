import { getCompatibilityData } from './match_api_client.js';
import { initializeAndGetMapNotes } from './match.js';

// APIエンドポイントURL
const MATCH_API_URL = '../../api/get_products_compatibility.php';


// 特定のメーカー名
const MAKER_HONDA = 'ホンダ';

// 全検索結果を一時的にキャッシュするためのグローバル変数（チェックボックス処理で使用）
let allSearchResultsCache = [];
// 現在の検索で使われているヘッダー情報を保持する変数を追加
let currentHeaderData = [];

// =================================================================
// 適合品番保存のためのlocalStorage関連ヘルパー関数 (データオブジェクトをマップで保存)
// =================================================================

/**
 * localStorageに保存されている適合品番データのマップを取得する
 * Gets the map of saved compatibility part data from localStorage.
 * @returns {Object<string, object>} rowIdをキーとし、データオブジェクトを値とするマップ
 */
export function getSavedItemsMap() {
    // 保存キーを変更して、データオブジェクト全体を保存していることを示す
    const saved = localStorage.getItem('compatibility_saved_data_map');
    try {
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error("Error parsing saved items map from localStorage:", e);
        return {};
    }
}

/**
 * 適合品番データのマップをlocalStorageに保存する
 * Saves the map of compatibility part data to localStorage.
 * @param {Object<string, object>} map - 保存するユニークIDをキーとしたデータオブジェクトのマップ
 */
export function setSavedItemsMap(map) {
    try {
        localStorage.setItem('compatibility_saved_data_map', JSON.stringify(map));
    } catch (e) {
        console.error("Error setting saved items map to localStorage:", e);
    }
}

/**
 * データ行からユニークなIDを生成する（localStorageのキーとして使用）
 * Generates a unique ID from a data row to be used as a key for localStorage.
 * @param {object} item - データの行オブジェクト
 * @returns {string} ユニークな行ID
 */
export function getRowUniqueId(item) {
    // 複数のキーを組み合わせることで、行を一意に識別する
    const model = item.car_model || '';
    const date = item.print_date || '';
    const modelNum = item.model_number || '';
    const monitorNum = item.monitor_number || '';
    // 厳密な区切り文字を使用
    return `${model}|${date}|${modelNum}|${monitorNum}`;
}

/**
 * チェックボックスの変更イベントを処理し、localStorageを更新する
 * Handles checkbox change events and updates localStorage.
 * full data object を保存/削除するように更新
 * * @param {Event} event - changeイベントオブジェクト
 */
function handleCheckboxChange(event) {
    const checkbox = event.target;
    const rowId = checkbox.dataset.rowId;
    const productName = checkbox.dataset.productName;

    if (!rowId || !productName) return;

    let savedData = getSavedItemsMap();

    if (checkbox.checked) {
        const itemToSave = allSearchResultsCache.find(item => getRowUniqueId(item) === rowId);

        if (itemToSave) {
            // 製品グループがなければ作成
            if (!savedData[productName]) {
                savedData[productName] = {
                    headerData: currentHeaderData, // ヘッダー情報も保存
                    items: {}
                };
            }
            // アイテムを追加
            savedData[productName].items[rowId] = itemToSave;
        }
    } else {
        // アイテムを削除
        if (savedData[productName] && savedData[productName].items[rowId]) {
            delete savedData[productName].items[rowId];

            // 製品グループ内のアイテムが0になったら、製品グループ自体を削除
            if (Object.keys(savedData[productName].items).length === 0) {
                delete savedData[productName];
            }
        }
    }
    
    setSavedItemsMap(savedData);
}


// =================================================================
// 検索結果処理 (既存のコード)
// =================================================================

/**
 * 検索結果を処理してDOMに表示する関数
 * *検索結果をグローバルキャッシュに保存
 * @param {object} params - APIに渡すクエリパラメータ (Query parameters for the API)
 * @param {object} headerData - テーブルヘッダー情報 (Table header structure data)
 * @param {string} pdfPath - 適合表PDFのパス (Path to the compatibility PDF)
 */
export async function handleSearchResults(params, headerData, pdfPath) {
    const tableContainer = document.getElementById('results-table-container');
    const exportPdfButton = document.getElementById('export-pdf-button');
    const messageContainer = document.getElementById('message-container');
    const pdfLinkContainer = document.getElementById('pdf-link-container');
    
    // UIを更新してロード中であることを示す
    if (messageContainer) {
        messageContainer.textContent = '適合品番を検索中...';
        messageContainer.style.display = 'block';
    }
    if (tableContainer) {
        tableContainer.style.display = 'none';
        exportPdfButton.style.display = 'none';
        exportPdfButton.disabled = true;
    }
    
    // PDFリンクの表示を更新
    updatePdfLink(pdfLinkContainer, pdfPath);

    // キャッシュをクリア
    allSearchResultsCache = [];
    currentHeaderData = headerData;

    try {
        const partsData = await getCompatibilityData(MATCH_API_URL, params);
        
        // 検索結果をグローバルキャッシュに保存 (チェックボックス処理で使用)
        allSearchResultsCache = partsData || [];

        if (partsData && Array.isArray(partsData) && partsData.length > 0) {
            // 成功: テーブルと注意事項を表示
            if (messageContainer) messageContainer.style.display = 'none';
            generateTable(partsData, headerData, params.product);
            displayNotes(partsData, params.product);
            
            if (tableContainer) {
                tableContainer.style.display = 'block';
                exportPdfButton.style.display = 'block';
                exportPdfButton.disabled = false;
            }
        } else {
            // 結果が見つからない場合
            const noResultMessage = 'お探しの条件に適合する品番は見つかりませんでした。';
            if (messageContainer) {
                messageContainer.textContent = noResultMessage;
                messageContainer.style.display = 'block';
            }
            if (tableContainer) {
                tableContainer.style.display = 'none';
                exportPdfButton.style.display = 'none';
                exportPdfButton.disabled = true;
            }
            displayNotes([], null);
            
            // 結果なしの場合のPDFリンクテキストを更新
            if (pdfLinkContainer && pdfPath) {
                const pdfLink = pdfLinkContainer.querySelector('.pdf-link');
                if (pdfLink) {
                    pdfLink.textContent = '適合品番は見つかりませんでした。一部車種マイナーチェンジの判別方法、およびPDF適合表も併せてご確認ください。';
                }
            }
        }
    } catch (error) {
        // 検索中にエラーが発生した場合
        const errorMessage = `検索中にエラーが発生しました: ${error.message}`;
        if (messageContainer) {
            messageContainer.textContent = errorMessage;
            messageContainer.style.display = 'block';
        }
        if (tableContainer) {
            tableContainer.style.display = 'none';
            exportPdfButton.style.display = 'none';
            exportPdfButton.disabled = true;
        }
        if (pdfLinkContainer && pdfPath) {
            const pdfLink = pdfLinkContainer.querySelector('.pdf-link');
            if (pdfLink) {
                pdfLink.textContent = '適合品番は見つかりませんでした。詳しくはPDFをご参照ください。';
            }
        }
    }
}

/**
 * PDFリンクのDOMを更新する。
 * Updates the PDF link element in the DOM.
 * @param {HTMLElement} container - PDFリンクのコンテナ要素
 * @param {string} path - PDFのパス
 */
function updatePdfLink(container, path) {
    if (!container) return;

    if (path) {
        const pdfLink = document.createElement('a');
        pdfLink.href = path;
        pdfLink.target = '_blank';
        pdfLink.style.borderBottom = '1px solid #337ab7';
        pdfLink.classList.add('pdf-link');
        pdfLink.textContent = '一部車種マイナーチェンジの判別方法、およびPDF適合表はこちら';
        
        container.innerHTML = '';
        container.appendChild(pdfLink);
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}


/**
 * 検索結果データをソートするための比較関数
 * Custom sort function based on car_model, print_date, year, model_number, and monitor_number.
 * @param {object} a - 比較対象A
 * @param {object} b - 比較対象B
 * @returns {number} ソート順
 */
function customSort(a, b) {
    // Helper function to safely get a string value for comparison
    const safeString = (value) => (value || '').toString();

    // 1. car_model (Car Model)
    if (safeString(a.car_model) < safeString(b.car_model)) return -1;
    if (safeString(a.car_model) > safeString(b.car_model)) return 1;

    // 2. print_date (Print Date)
    if (safeString(a.print_date) < safeString(b.print_date)) return -1;
    if (safeString(a.print_date) > safeString(b.print_date)) return 1;

    // 3. year (Model Year)
    if (safeString(a.year) < safeString(b.year)) return -1;
    if (safeString(a.year) > safeString(b.year)) return 1;

    // 4. model_number (Model Number)
    if (safeString(a.model_number) < safeString(b.model_number)) return -1;
    if (safeString(a.model_number) > safeString(b.model_number)) return 1;

    // 5. monitor_number (Monitor Number)
    if (safeString(a.monitor_number) < safeString(b.monitor_number)) return -1;
    if (safeString(a.monitor_number) > safeString(b.monitor_number)) return 1;
    
    // All conditions are the same
    return 0;
}

/**
 * 価格とオプション情報を表示するためのHTML文字列を生成する
 * Generates HTML string for displaying price and option details.
 * @param {object} item - データの行オブジェクト
 * @param {object} column - カラム定義オブジェクト
 * @returns {string} 生成されたHTML
 */
export function createPriceCellHtml(item, column) {
    // '-' または '←' の場合は、そのまま返す
    if (item[column.key] === '-' || item[column.key] === '←') {
        return item[column.key];
    }

    const value = item[column.key] || '';
    
    // 価格情報 (Price information)
    const priceExclTax = column.priceKeys?.excl ? 
        `<span style="font-size: 0.9em;">税別: ${(item[column.priceKeys.excl] || '').replace('\\', '￥')}</span>` : '';
    const priceInclTax = column.priceKeys?.incl ? 
        `<span style="font-size: 0.9em;">税込: ${(item[column.priceKeys.incl] || '').replace('\\', '￥')}</span>` : '';

    // オプション情報 (Option details)
    const navCtrl = column.option?.nav ? 
        `<br><span style="font-size: 0.9em;">ナビ操作: ${(item[column.option.nav] || '-').replace('\\', '￥')}</span>` : '';
    const vehiclePos = column.option?.vehicle_pos ? 
        `<br><span style="font-size: 0.9em;">自車位置: ${(item[column.option.vehicle_pos] || '-').replace('\\', '￥')}</span>` : '';
    const exclInput = column.option?.excl_input ? 
        `<br><span style="font-size: 0.9em;">外部入力: ${(item[column.option.excl_input] || '-').replace('\\', '￥')}</span>` : '';
    const tv = column.option?.tv ? 
        `<br><span style="font-size: 0.9em;">デジタルテレビ: ${(item[column.option.tv] || '-').replace('\\', '￥')}</span>` : '';
    const dvd = column.option?.dvd ? 
        `<br><span style="font-size: 0.9em;">DVD視聴: ${(item[column.option.dvd] || '-').replace('\\', '￥')}</span>` : '';

    return `<b>${value}</b><br>${priceExclTax}<br>${priceInclTax}${navCtrl}${vehiclePos}${exclInput}${tv}${dvd}`;
}

/**
 * 注意事項のキーを整形してHTML文字列を生成する
 * Formats the notes key (including Suzuki specific codes) and generates HTML.
 * @param {object} item - データの行オブジェクト
 * @returns {string} 整形された注意事項のHTML
 */
export function createNotesCellHtml(item) {
    const notesString = item['notes'];
    if (!notesString) {
        return '';
    }

    const rawParts = notesString.replace(/[{}]/g, '').split(',').filter(p => p.trim() !== '');
    
    // Process notes (Suzuki specific: 900-999 -> S0-S99)
    const processedParts = rawParts.map(part => {
        const partsInt = parseInt(part.trim(), 10);
        // Check for Suzuki specific range (900 <= partsInt < 1000)
        if (!isNaN(partsInt) && partsInt >= 900 && partsInt < 1000) {
            return `S${partsInt - 900}`;
        }
        return part.trim();
    });

    // Join with "※" prefix and line breaks
    return processedParts.map(str => `※${str}`).join('<br>');
}


/**
 * テーブルを生成してDOMに挿入する関数
 * Generates the result table and inserts it into the DOM.
 * * getSavedItemsMapを使用してチェックボックスの初期状態を設定
 * * @param {Array<object>} data - 検索結果データ
 * @param {Array<object>} headerData - テーブルヘッダー情報
 */
function generateTable(data, headerData, productName) {
    const selectedMaker = document.getElementById('maker-select')?.value;
    const table = document.querySelector('.result-table');
    if (!table) return;

    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // localStorageから保存済みアイテムのマップを取得 (データオブジェクトを含む)
    const savedItemsMap = getSavedItemsMap();

    // --- 1. Main Header Row (メインヘッダー行) ---
    const mainHeaderRow = document.createElement('tr');
    
    // '保存'チェックボックス用の空セル
    const emptyTh = document.createElement('th');
    emptyTh.textContent = '';
    mainHeaderRow.appendChild(emptyTh);

    headerData.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.label;
        th.setAttribute('colspan', header.subHeaders.length);
        mainHeaderRow.appendChild(th);
    });
    thead.appendChild(mainHeaderRow);

    // --- 2. Sub Header Row (サブヘッダー行) ---
    const subHeaderRow = document.createElement('tr');
    
    // チェックボックスヘッダー
    const checkboxTh = document.createElement('th');
    checkboxTh.textContent = '保存';
    checkboxTh.width = '10px';
    subHeaderRow.appendChild(checkboxTh);
    
    headerData.forEach(header => {
        header.subHeaders.forEach(subHeader => {
            const th = document.createElement('th');
            
            // メーカーに基づく 'nav_col_2' のラベル切り替え処理
            if (subHeader.label === 'nav_col_2') {
                if (selectedMaker === MAKER_HONDA){
                    th.textContent = 'LEDスイッチ切替タイプ_2';
                } else {
                    th.textContent = 'サービスホールスイッチ切替タイプ';
                }
            } else {
                th.textContent = subHeader.label;
            }
            th.width = '80px';
            subHeaderRow.appendChild(th);
        });
    });
    thead.appendChild(subHeaderRow);

    // --- 3. Table Body (データ行) ---
    const sortedData = [...data].sort(customSort);
    const allColumns = headerData.flatMap(header => header.subHeaders);

    sortedData.forEach(item => {
        const row = document.createElement('tr');
        
        // チェックボックス列
        const checkTd = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'save-checkbox';
        
        // ユニークなIDを生成し、DOM IDとdata属性に設定
        const rowId = getRowUniqueId(item);
        // DOM IDはユニークであれば良いので、data-row-idを主に使用する
        checkbox.id = `checkbox-${rowId.replace(/[^a-zA-Z0-9-]/g, '_')}`; 
        checkbox.dataset.rowId = rowId; 

        checkbox.dataset.productName = productName;

        // localStorageの状態を反映させる部分の修正
        const savedData = getSavedItemsMap();
        checkbox.checked = !!(savedData[productName] && savedData[productName].items[rowId]);

        checkbox.addEventListener('change', handleCheckboxChange); 

        checkTd.appendChild(checkbox);
        row.appendChild(checkTd);

        // データ列
        allColumns.forEach(col => {
            const td = document.createElement('td');
            
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
        tbody.appendChild(row);
    });
}


/**
 * 注意事項を表示する関数
 * Displays the unique set of notes referenced in the search results.
 * @param {Array<object>} data - 検索結果データ
 * @param {string} productName - 検索対象の製品名
 */
async function displayNotes(data, productName) {
    const notesContainer = document.getElementById('notes-list-container');
    if (!notesContainer) return;

    const noteMap = await initializeAndGetMapNotes();

    // 製品名に対応する注意事項セットを取得。ない場合は空のオブジェクトを使用。
    const noteSet = noteMap[productName] || {};

    const uniqueNotes = new Set();
    data.forEach(item => {
        if (item && item['notes']) {
            const notesString = item['notes'];
            // ブラケットを取り除き、空文字をフィルタリングして、注意事項番号を抽出
            const numbers = notesString.replace(/[{}]/g, '').split(',').filter(n => n.trim() !== '');
            numbers.forEach(num => uniqueNotes.add(num.trim()));
        }
    });

    // Setを配列に変換し、数値としてソート
    const sortedNotes = Array.from(uniqueNotes).sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (isNaN(numA) || isNaN(numB)) {
            return a.localeCompare(b);
        }
        return numA - numB;
    });

    // <li>要素のHTML文字列を保持する配列
    const noteItems = [];

    // --- 1. Common Notes (共通注意事項) ---
    if (noteSet.common?.length > 0) {
        noteSet.common.forEach(text => {
            noteItems.push(`<li><span class="note-number">※共通</span><span class="note-text">：${text.replace(/\n/g, '<br>')}</span></li>`);
        });
    }

    // --- 2. Specific Notes (個別注意事項) ---
    if (sortedNotes.length > 0) {
        sortedNotes.forEach(numStr => {
            const num = parseInt(numStr, 10);
            let noteLabel = numStr;
            
            // スズキ専用処理: 900-999 -> S0-S99
            if (!isNaN(num) && num >= 900 && num < 1000) {
                noteLabel = `S${num - 900}`;
            }

            const noteText = noteSet[numStr]; // 元の文字列キーでテキストを取得
            if (noteText) {
                noteItems.push(`<li><span class="note-number">※${noteLabel}</span><span class="note-text">：${noteText.replace(/\n/g, '<br>')}</span></li>`);
            }
        });
    }

    // --- 3. 最終的なHTML生成とDOMへの挿入 ---
    let notesHtml = '';
    if (noteItems.length > 0) {
        notesHtml = `<h3>注意事項</h3><ul class="compatibility-notes">${noteItems.join('')}</ul>`;
    }
    
    notesContainer.innerHTML = notesHtml;
    // 注意事項がある場合にのみコンテナを表示
    notesContainer.style.display = noteItems.length > 0 ? 'block' : 'none';
}
