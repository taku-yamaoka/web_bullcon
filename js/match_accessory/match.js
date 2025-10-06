// match.js
import { renderForm } from './form_ui.js';
import { setupEventListeners } from './event_handler.js';
import { exportTableToPdf } from './result_table_exporter.js'; 
import { getCompatibilityData } from './match_api_client.js';

const CAR_MODEL_API = '../../api/get_car_model.php';
const MONITOR_NUMBER_LIST_API = '../../api/get_monitor_list.php';

let carModelCache = null;
let monitorNumberCache = null;

// DOM読み込み後の初期処理
document.addEventListener('DOMContentLoaded', async() => {
    // 必要なデータをAPIから取得し、キャッシュに保存（初回アクセス時のみ実行）
    await initializeAndGetCarModel();
    await initializeAndGetMonitorNumber();

    // フォームを初期描画
    // この時点ではformStateが空なので、製品選択のみが表示されます
    renderForm('form-container', {
        selectedProduct: null,
        selectedOptionType: null,
        selectedInputType: null, 
        selectedMaker: null,
        selectedModel: null,
        selectedYear: null,
        selectedMonth: null,
        selectedProductCode: null,
    });

    // フォームの変更やクリックイベントのリスナーを設定
    setupEventListeners();

    // 適合結果テーブルのPDF出力ボタンのイベント処理
    const exportButton = document.getElementById('exportPdfButton');
    
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            // PDF出力処理を別ファイルに委譲
            exportTableToPdf('result');
        });
    }
});

/**
 * 車種モデルデータをAPIから取得し、キャッシュする
 * @returns {Promise<object>} 車種モデルデータ
 */
export const initializeAndGetCarModel = async() => {
    // キャッシュが存在する場合は、即座にキャッシュデータを返す
    if (carModelCache) {
        return carModelCache;
    }

    // キャッシュが存在しない場合は、APIからデータを取得し、キャッシュする
    const carModel = await getCompatibilityData(CAR_MODEL_API , "");
    
    // 取得したデータをキャッシュに保存
    carModelCache = carModel;
    
    return carModel;
};

/**
 * モニター品番リストをAPIから取得し、キャッシュする
 * @returns {Promise<object>} モニター品番リスト
 */
export const initializeAndGetMonitorNumber = async() => {
    // キャッシュが存在する場合は、即座にキャッシュデータを返す
    if (monitorNumberCache) {
        return monitorNumberCache;
    }

    // キャッシュが存在しない場合は、APIからデータを取得し、キャッシュする
    const monitorNumberList = await getCompatibilityData(MONITOR_NUMBER_LIST_API , "");
    
    // 取得したデータをキャッシュに保存
    monitorNumberCache = monitorNumberList;
    
    return monitorNumberList;
};
