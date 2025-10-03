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
    await initializeAndGetCarModel();
    await initializeAndGetMonitorNumber();

    // フォームを初期描画
    // この時点ではformStateが空なので、製品選択のみが表示されます
    renderForm('form-container', {
        selectedProduct: null,
        selectedOptionType: null,
        selectedMaker: null,
        selectedModel: null,
        selectedYear: null,
        selectedMonth: null,
        selectedProductCode: null
    });

    // イベントリスナーを設定
    setupEventListeners();

    // テーブルのpdf出力処理 
    const exportButton = document.getElementById('exportPdfButton');
    
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            // PDF出力処理を別ファイルに委譲
            exportTableToPdf('result');
        });
    }
});

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

export const initializeAndGetMonitorNumber = async() => {
    // キャッシュが存在する場合は、即座にキャッシュデータを返す
    if (monitorNumberCache) {
        return monitorNumberCache;
    }

    // キャッシュが存在しない場合は、APIからデータを取得し、キャッシュする
    const monitorNumList = await getCompatibilityData(MONITOR_NUMBER_LIST_API , "");
    
    // 取得したデータをキャッシュに保存
    monitorNumberCache = monitorNumList;
    
    return monitorNumList;
};