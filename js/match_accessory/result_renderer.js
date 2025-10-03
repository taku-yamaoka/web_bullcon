// result_renderer.js
import { getCompatibilityData } from './match_api_client.js';
import { 
    TVING_NOTES_DATA, MAGICONE_BK_NOTES_DATA, MAGICONE_RM_VTR_NOTES_DATA,
    CAMERA_SELECTOR_NOTES_DATA,
    STEERING_SWT_CTRL_NOTES_DATA
 } from './data_mapper.js';

 const MATCH_API_URL = '../../api/get_products_compatibility.php';

/**
 * 検索結果を処理してDOMに表示する関数
 * @param {object} params - APIに渡すクエリパラメータ
 * @param {object} headerData - テーブルヘッダー情報
 * @param {string} pdfPath - 適合表PDFのパス
 */
export async function handleSearchResults(params, headerData, pdfPath) {
    const tableContainer = document.getElementById('results-table-container');
    const exportPdfButton = document.getElementById('exportPdfButton');
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
    if (pdfLinkContainer) {
        if (pdfPath) {
            const pdfLink = document.createElement('a');
            pdfLink.href = pdfPath;
            pdfLink.target = '_blank';
            pdfLink.style.borderBottom = '1px solid #337ab7';
            pdfLink.classList.add('pdf-link');
            pdfLink.textContent = '一部車種マイナーチェンジの判別方法、およびPDF適合表はこちら';
            pdfLinkContainer.innerHTML = '';
            pdfLinkContainer.appendChild(pdfLink);
            pdfLinkContainer.style.display = 'block';
        } else {
            pdfLinkContainer.style.display = 'none';
        }
    }

    try {
        const partsData = await getCompatibilityData(MATCH_API_URL, params);
        
        if (partsData && Array.isArray(partsData) && partsData.length > 0) {
            if (messageContainer) messageContainer.style.display = 'none';
            generateTable(partsData, headerData);
            displayNotes(partsData, params.product);
            if (tableContainer) {
                tableContainer.style.display = 'block';
                exportPdfButton.style.display = 'block';
                exportPdfButton.disabled = false;
            }
        } else {
            if (messageContainer) {
                messageContainer.textContent = 'お探しの条件に適合する品番は見つかりませんでした。';
                messageContainer.style.display = 'block';
            }
            if (tableContainer) {
                tableContainer.style.display = 'none';
                exportPdfButton.style.display = 'none';
                exportPdfButton.disabled = true;
            }
            displayNotes([], null);
            if (pdfLinkContainer) {
                const pdfLink = pdfLinkContainer.querySelector('.pdf-link');
                if (pdfLink) {
                    pdfLink.textContent = '適合品番は見つかりませんでした。一部車種マイナーチェンジの判別方法、およびPDF適合表も併せてご確認ください。';
                }
            }
        }
    } catch (error) {
        if (messageContainer) {
            messageContainer.textContent = `検索中にエラーが発生しました: ${error.message}`;
            messageContainer.style.display = 'block';
        }
        if (tableContainer) {
            tableContainer.style.display = 'none';
            exportPdfButton.style.display = 'none';
            exportPdfButton.disabled = true;
        }
        if (pdfLinkContainer) {
            const pdfLink = pdfLinkContainer.querySelector('.pdf-link');
            if (pdfLink) {
                pdfLink.textContent = '適合品番は見つかりませんでした。詳しくはPDFをご参照ください。';
            }
        }
    }
}

// テーブルを生成する関数
function generateTable(data, headerData) {
    const selectedMaker = document.getElementById('maker-select')?.value;
    const table = document.querySelector('.result-table');
    if (!table) return;

    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    const mainHeaderRow = document.createElement('tr');
    headerData.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.label;
        th.setAttribute('colspan', header.subHeaders.length);
        mainHeaderRow.appendChild(th);
    });
    thead.appendChild(mainHeaderRow);

    const subHeaderRow = document.createElement('tr');
    headerData.forEach(header => {
        header.subHeaders.forEach(subHeader => {
            const th = document.createElement('th');
            if (subHeader.label == 'nav_col_2') {
                if (selectedMaker == 'ホンダ'){
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

    const sortedData = [...data].sort(customSort);

    sortedData.forEach(item => {
        const row = document.createElement('tr');
        const allColumns = headerData.flatMap(header => header.subHeaders);
        allColumns.forEach(col => {
            const td = document.createElement('td');
            if (col.priceKeys) {
                if (item[col.key] == '-' || item[col.key] == '←') {
                    td.innerHTML = item[col.key];
                } else {
                    const priceExclTax = `<span style="font-size: 0.8em;">税別: ${(item[col.priceKeys.excl] || '').replace('\\', '￥')}</span>`;
                    const priceInclTax = `<span style="font-size: 0.8em;">税込: ${(item[col.priceKeys.incl] || '').replace('\\', '￥')}</span>`;
                    const navCtrl = col.option && col.option.nav ? `<br><span style="font-size: 0.8em;">ナビ操作: ${(item[col.option.nav] || '-').replace('\\', '￥')}</span>` : '';
                    const vehiclePos = col.option && col.option.vehicle_pos ? `<br><span style="font-size: 0.8em;">自車位置: ${(item[col.option.vehicle_pos] || '-').replace('\\', '￥')}</span>` : '';
                    const excl_input = col.option && col.option.excl_input ? `<br><span style="font-size: 0.8em;">外部入力: ${(item[col.option.excl_input] || '-').replace('\\', '￥')}</span>` : '';
                    const tv = col.option && col.option.tv ? `<br><span style="font-size: 0.8em;">デジタルテレビ: ${(item[col.option.tv] || '-').replace('\\', '￥')}</span>` : '';
                    const dvd = col.option && col.option.dvd ? `<br><span style="font-size: 0.8em;">DVD視聴: ${(item[col.option.dvd] || '-').replace('\\', '￥')}</span>` : '';
                    td.innerHTML = `<b>${item[col.key]}</b><br>${priceExclTax}<br>${priceInclTax}<br>${navCtrl}${vehiclePos}${excl_input}${tv}${dvd}`;
                }
            } else if (col.key === 'notes') {
                if (item && item[col.key]) {
                    const notesString = item[col.key];
                    const partsStr = (notesString || '').replace(/[{}]/g, '').split(',').filter(p => p.trim() !== '');
                
                    // スズキ専用注意事項
                    // 各要素に対して処理を行うための新しい配列を作成
                    const processedParts = partsStr.map(part => {
                        const partsInt = parseInt(part.trim(), 10);
                        // パースした値が有効な数値であり、900以上1000未満であることを確認
                        if (!isNaN(partsInt) && partsInt >= 900 && partsInt < 1000) {
                            // 条件を満たす場合、"S" + (値 - 900) の形式に変換
                            return `S${partsInt - 900}`;
                        }
                        // その他の場合、元の文字列をそのまま返す
                        return part.trim();
                    });
                
                    // 処理された配列の各要素に"※"を付けて、改行で結合
                    td.innerHTML = processedParts.map(str => `※${str}`).join('<br>');
                } else {
                    td.innerHTML = '';
                }
            } else {
                td.innerHTML = (item[col.key] || '').replace(/\n/g, '<br>');
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
}

// 注意事項を表示する関数
function displayNotes(data, productName) {
    const notesContainer = document.getElementById('notes-list-container');
    if (!notesContainer) return;

    const NOTES_MAP = {
      'televing': TVING_NOTES_DATA,
      'magicone_bk_un': MAGICONE_BK_NOTES_DATA,
      'magicone_bk_ha': MAGICONE_BK_NOTES_DATA,
      'magicone_rm_un': MAGICONE_RM_VTR_NOTES_DATA,
      'magicone_rm_ha': MAGICONE_RM_VTR_NOTES_DATA,
      'magicone_vtr_hdmi': MAGICONE_RM_VTR_NOTES_DATA,
      'camera_selector': CAMERA_SELECTOR_NOTES_DATA,
      'steering_swt_ctrl': STEERING_SWT_CTRL_NOTES_DATA
    };
    const noteSet = NOTES_MAP[productName] || '';

    const uniqueNotes = new Set();
    data.forEach(item => {
        if (item && item['notes']) {
            const notesString = item['notes'];
            const numbers = notesString.replace(/[{}]/g, '').split(',').filter(n => n.trim() !== '');
            numbers.forEach(num => uniqueNotes.add(num.trim()));
        }
    });

    const sortedNotes = Array.from(uniqueNotes).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    // 注意事項のHTMLを格納する配列
    const noteItems = [];

    // 共通注意事項の処理
    if (noteSet?.common?.length > 0) {
        noteSet.common.forEach(text => {
            noteItems.push(`<li><span class="note-number">※共通</span><span class="note-text">：${text.replace(/\n/g, '<br>')}</span></li>`);
        });
    }

    // 個別注意事項の処理
    if (sortedNotes?.length > 0) {
        sortedNotes.forEach(num => {
            let noteLabel = num;
            // スズキ専用処理
            if (num >= 900 && num < 1000) {
                noteLabel = `S${num - 900}`;
            }

            const noteText = noteSet[num];
            if (noteText) {
                noteItems.push(`<li><span class="note-number">※${noteLabel}</span><span class="note-text">：${noteText.replace(/\n/g, '<br>')}</span></li>`);
            }
        });
    }

    // 最終的なHTMLの生成
    let notesHtml = '';
    if (noteItems.length > 0) {
        notesHtml = `<h3>注意事項</h3><ul>${noteItems.join('')}</ul>`;
    }
    
    notesHtml += '</ul>';
    notesContainer.innerHTML = notesHtml;
    notesContainer.style.display = 'block';
}

function customSort(a, b) {
    // --- 車名 (car_model) で昇順比較 (タイブレーク) ---
    if (a.car_model < b.car_model) {
        return -1; // aをbより前に (年式が古い方が前)
    }
    if (a.car_model > b.car_model) {
        return 1;  // aをbより後に
    }
    // --- 年式 (print_date) で昇順比較 (タイブレーク) ---
    if (a.print_date < b.print_date) {
        return -1; // aをbより前に (年式が古い方が前)
    }
    if (a.print_date > b.print_date) {
        return 1;  // aをbより後に
    }
    // --- モデル年 (year) で昇順比較 (タイブレーク) ---
    if (a.year < b.year) {
        return -1; // aをbより前に (年式が古い方が前)
    }
    if (a.year > b.year) {
        return 1;  // aをbより後に
    }
    // --- 型式 (model_number) で昇順比較 (タイブレーク) ---
    if (a.model_number < b.model_number) {
        return -1; // aをbより前に (年式が古い方が前)
    }
    if (a.model_number > b.model_number) {
        return 1;  // aをbより後に
    }
    // --- モニター型式 (monitor_number) で昇順比較 (タイブレーク) ---
    if (a.monitor_number < b.monitor_number) {
        return -1; // aをbより前に (年式が古い方が前)
    }
    if (a.monitor_number > b.monitor_number) {
        return 1;  // aをbより後に
    }
    
    // 全ての条件で同じ場合
    return 0;
}