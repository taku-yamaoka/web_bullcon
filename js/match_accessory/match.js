// match.js
import { renderForm } from './form_ui.js';
import { setupEventListeners } from './event_handler.js';
import { exportTableToPdf } from './result_table_exporter.js'; 
import { getCompatibilityData } from './match_api_client.js';

const CAR_MODEL_API = '../../api/web_page/get_car_model.php';
const MONITOR_NUMBER_LIST_API = '../../api/web_page/get_monitor_list.php';
const NOTE_LIST_API = '../../api/web_page/get_note_list.php';

let carModelCache = null;
let monitorNumberCache = null;
let noteCash = null;

// DOM読み込み後の初期処理
document.addEventListener('DOMContentLoaded', async() => {
    // 必要なデータをAPIから取得し、キャッシュに保存（初回アクセス時のみ実行）
    await initializeAndGetCarModel();
    await initializeAndGetMonitorNumber();
    await initializeAndGetMapNotes();

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
    const exportButton = document.getElementById('export-pdf-button');
    
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
const initializeAndGetCarModel = async() => {
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
const initializeAndGetMonitorNumber = async() => {
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

/**
 * 注意事項リストをAPIから取得し、キャッシュする
 * @returns {Promise<object>} 注意事項リスト
 */
const initializeAndGetMapNotes = async() => {
    // キャッシュが存在する場合は、即座にキャッシュデータを返す
    if (noteCash) {
        return noteCash;
    }

    // キャッシュが存在しない場合は、APIからデータを取得し、キャッシュする
    const noteList = await getCompatibilityData(NOTE_LIST_API , "");

    // 製品名と注意事項マップの対応
    const notesMap = {
        'televing': noteList.notes_tving || [],
        'magicone_bk_un': noteList.notes_back_camera || [],
        'magicone_bk_ha': noteList.notes_back_camera || [],
        'magicone_rm_un': noteList.notes_rearmonitor_vtr_hdmi || [],
        'magicone_rm_ha': noteList.notes_rearmonitor_vtr_hdmi || [],
        'magicone_vtr_hdmi': noteList.notes_rearmonitor_vtr_hdmi || [],
        'camera_selector': noteList.notes_camera_selector || [],
        'steering_swt_ctrl': noteList.notes_steering_switch_controller || [],
        'dvd_cd_player': noteList.notes_dvd_player || []
    };
    
    // 取得したデータをキャッシュに保存
    noteCash = notesMap;
    
    return notesMap;
};

export {
    initializeAndGetCarModel,
    initializeAndGetMonitorNumber,
    initializeAndGetMapNotes
};
