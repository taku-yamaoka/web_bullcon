// ライブラリのグローバル参照
const html2canvas = window.html2canvas;
const jsPDF = window.jspdf ? window.jspdf.jsPDF : null;

// キャプチャの高さが確定するのを待つための遅延時間 (ミリ秒)
const CAPTURE_DELAY_MS = 100; 

// PDF出力用の圧縮スタイルを緩和し、視認性を重視
const PDF_COMPRESSION_STYLE = `
    /* 【新規追加】ラッパー全体にパディングを適用し、PDF端からの余白を確保 */
    #pdf-capture-wrapper {
        padding: 10px !important; 
    }

    /* テーブル全体の文字サイズを緩和 (8pt -> 10pt) */
    #pdf-capture-wrapper, #pdf-capture-wrapper table, #pdf-capture-wrapper p, #pdf-capture-wrapper li {
        font-size: 10pt !important;
        line-height: 1.3 !important;
    }
    /* セル（th, td）のパディングを適度に削減 */
    #pdf-capture-wrapper th, #pdf-capture-wrapper td {
        padding: 4px 6px !important; /* 上下左右のパディングを調整 */
    }
    /* テーブルのボーダー間隔を詰める */
    #pdf-capture-wrapper table {
        border-collapse: collapse !important;
    }
    /* 注意事項のリストの余白を詰める */
    #pdf-capture-wrapper ul, #pdf-capture-wrapper ol {
        padding-left: 15px !important;
        margin-top: 5px !important;
        margin-bottom: 5px !important;
    }
`;

/**
 * 適合結果テーブルと注意事項を統合して画像としてキャプチャし、PDFに出力
 * * @param {string} tableContainerId - テーブルコンテナのID ('results-table-container')
 */
export async function exportTableToPdf(tableContainerId) {
    const originalTableContainer = document.getElementById(tableContainerId);
    const originalNotesContainer = document.getElementById('notes-list-container');
    
    // ------------------------------------
    // 1. ライブラリと要素の確認
    // ------------------------------------
    if (!html2canvas || !jsPDF) {
        console.error('PDF出力ライブラリがロードされていません。');
        console.log('PDF出力ライブラリがロードされていません。ライブラリのロードを確認してください。');
        return;
    }
    if (!originalTableContainer) {
        console.error(`ERROR: ターゲット要素 (#${tableContainerId}) が見つかりません。`);
        console.log('PDF出力に失敗しました: テーブルコンテナが見つかりません。');
        return;
    }

    const tableElement = originalTableContainer.querySelector('table');
    if (!tableElement) {
        console.error('ERROR: 内部の<table>要素が見つかりません。');
        console.log('PDF出力に失敗しました: 内部の<table>タグを確認してください。');
        return;
    }

    const tableHeader = tableElement.querySelector('thead');
    const exportButton = document.getElementById('export-pdf-button');
    
    let originalTableContainerStyles = null;
    let originalHeaderPosition = 'static';
    let originalBodyOverflowX = 'auto';
    let tempWrapper = null;
    let originalWrapperLeft = '0'; // 画面外移動前の状態保存用

    // 処理中にボタンを無効化
    if (exportButton) exportButton.disabled = true;
    
    try {
        
        // ------------------------------------
        // 2. スタイル変更前の状態を保存と一時解除
        // ------------------------------------
        
        // コンテナのスタイルを保存 (スクロール解除用)
        originalTableContainerStyles = {
            overflowY: originalTableContainer.style.overflowY,
            overflowX: originalTableContainer.style.overflowX,
            maxHeight: originalTableContainer.style.maxHeight,
            width: originalTableContainer.style.width,
            maxWidth: originalTableContainer.style.maxWidth
        };
        
        // bodyのoverflow-x (横スクロール解除用)
        originalBodyOverflowX = document.body.style.overflowX;
        document.body.style.overflowX = 'visible';
        
        // 固定ヘッダーの解除
        if (tableHeader) {
            originalHeaderPosition = tableHeader.style.position;
            tableHeader.style.position = 'static';
        }

        // ------------------------------------
        // 3. 一時的な統合ラッパーの作成と配置
        // ------------------------------------
        
        tempWrapper = document.createElement('div');
        tempWrapper.id = 'pdf-capture-wrapper';
        
        // 圧縮用のスタイルを一時ラッパーに追加
        const styleElement = document.createElement('style');
        styleElement.textContent = PDF_COMPRESSION_STYLE;
        tempWrapper.appendChild(styleElement);
        
        // テーブル本体をクローンして追加
        const clonedTable = tableElement.cloneNode(true);
        tempWrapper.appendChild(clonedTable);
        
        // 注意事項（notes）をクローンして追加
        if (originalNotesContainer) {
            const clonedNotes = originalNotesContainer.cloneNode(true);
            tempWrapper.appendChild(clonedNotes);
        }
        
        // 一時ラッパーをDOMに追加し、画面外に配置
        document.body.appendChild(tempWrapper);

        tempWrapper.style.position = 'absolute';
        originalWrapperLeft = tempWrapper.style.left; // 後のクリーンアップ用に現在のleft値を保存
        tempWrapper.style.left = '-9999px'; // 画面外に移動
        tempWrapper.style.top = '0';
        tempWrapper.style.zIndex = '9999'; 
        
        tempWrapper.style.overflow = 'visible'; // スクロールを無効化
        tempWrapper.style.maxWidth = 'none';
        tempWrapper.style.maxHeight = 'none';
        
        // ラッパーの幅を fit-content に戻す
        tempWrapper.style.width = 'fit-content'; 
        
        // --- レイアウト計算完了のための遅延 ---
        await new Promise(resolve => setTimeout(resolve, CAPTURE_DELAY_MS));
        
        // ------------------------------------
        // 4. Canvasへのキャプチャ
        // ------------------------------------
        
        // 描画が確定した後の寸法を取得 (コンテンツ全体の幅と高さ)
        // 圧縮スタイルとパディングが適用された後の最小幅がここで確定する
        const captureWidth = tempWrapper.offsetWidth;
        const captureHeight = tempWrapper.scrollHeight; 

        // 確実なキャプチャのため、実際の幅をピクセルで固定
        tempWrapper.style.width = `${captureWidth}px`; 

        const canvasOptions = {
            scale: 2, // 高解像度化
            useCORS: true,
            allowTaint: true,
            letterRendering: true,
            width: captureWidth, 
            height: captureHeight,
            // 画面外に配置しているため、スクロールしないようx/yオフセットは不要
        };

        // キャプチャ対象を統合ラッパーに変更
        const canvas = await html2canvas(tempWrapper, canvasOptions);
        const imgData = canvas.toDataURL('image/jpeg', 0.98);

        // ------------------------------------
        // 5. PDF生成ロジック (A4横向き、ページ分割)
        // ------------------------------------
        
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasHeight / canvasWidth;

        // 画像の幅をPDF幅いっぱいに設定。これでテーブルがPDFにフィットする
        const imgWidth = pdfWidth; 
        const imgHeight = imgWidth * ratio; // PDF幅に合わせた画像の高さ

        let heightLeft = imgHeight;
        let position = 0; // ページのY軸オフセット

        // 画像の高さがPDFページの高さより大きい場合、ページを分割して出力
        while (heightLeft > 0) {
            if (position !== 0) {
                pdf.addPage();
            }

            // Y座標を負にして画像を上方向にシフトさせる
            pdf.addImage(imgData, 'JPEG', 0, -position, imgWidth, imgHeight);

            heightLeft -= pdfHeight;
            position += pdfHeight;
        }

        pdf.save('compatibility_result.pdf');

    } catch (error) {
        console.error('PDF生成中にエラーが発生しました:', error);
        console.log('PDF生成中にエラーが発生しました。コンソールを確認してください。');
    } finally {
        // ------------------------------------
        // 6. 元のスタイルに戻す (クリーンアップ)
        // ------------------------------------
        
        // bodyのoverflow-xを元に戻す
        document.body.style.overflowX = originalBodyOverflowX;

        // 固定ヘッダーの復元
        if (tableHeader) {
            tableHeader.style.position = originalHeaderPosition;
        }
        
        // 一時ラッパーが作成されていた場合、DOMから削除する
        // スタイルタグもここで削除される
        if (tempWrapper && tempWrapper.parentNode) {
            tempWrapper.parentNode.removeChild(tempWrapper);
        }
        
        if (exportButton) exportButton.disabled = false;
    }
}
