document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------
    // 1. 要素の取得 
    // ----------------------------------------------------------------
    const productSelect = document.getElementById('lv11');   // 製品カテゴリ (レベル1)
    const makerSelect = document.getElementById('lv12');     // メーカー名 (レベル2)
    const documentSelect = document.getElementById('lv13');  // 資料名 (レベル3)
    const executeButton = document.getElementById('execute-button-trigger'); // 実行ボタン (input type="button")

    // レベル2とレベル3のすべてのオプションを事前に取得しておく (最初の「▼選択」は除く)
    const allMakerOptions = makerSelect.querySelectorAll('option:not([value="0"])');
    const allDocumentOptions = documentSelect.querySelectorAll('option:not([value="0"])');

    // 初期状態: すべてのメーカーと資料を非表示にし、資料選択プルダウンと実行ボタンを無効化
    const initializeSelects = () => {
        allMakerOptions.forEach(option => option.style.display = 'none');
        allDocumentOptions.forEach(option => option.style.display = 'none');
        
        // レベル2とレベル3をリセット
        makerSelect.value = '0';
        documentSelect.value = '0';
        
        // レベル3と実行ボタンを無効化
        makerSelect.disabled = true; // L1リセット時にも無効化されるが、初期状態として設定
        documentSelect.disabled = true;
        
        if (executeButton) {
            // input type="button" のため disabled 属性で制御（クラス制御も残すが、disabledが強い）
            executeButton.disabled = true;
            executeButton.classList.add('disabled-button'); 
            // input type="button" なので href は不要ですが、前のコードとの互換性確保のため削除
            // executeButton.href = '#'; 
        }
    };
    
    initializeSelects();

    // ----------------------------------------------------------------
    // 2. イベントリスナーの設定
    // ----------------------------------------------------------------

    // レベル1 (製品カテゴリ) の変更処理
    productSelect.addEventListener('change', () => {
        const productValue = productSelect.value;
        
        initializeNextSelect(makerSelect, allMakerOptions);
        initializeNextSelect(documentSelect, allDocumentOptions);
        
        if (productValue !== '0') {
            const targetClass = `p${productValue}`; 
            
            allMakerOptions.forEach(option => {
                option.style.display = option.classList.contains(targetClass) ? '' : 'none';
            });
            
            makerSelect.disabled = false;
        } else {
            makerSelect.disabled = true;
        }
    });

    // レベル2 (メーカー名) の変更処理
    makerSelect.addEventListener('change', () => {
        const makerValue = makerSelect.value;
        
        initializeNextSelect(documentSelect, allDocumentOptions);

        if (makerValue !== '0') {
            const targetClass = `p${makerValue}`; 

            allDocumentOptions.forEach(option => {
                option.style.display = option.classList.contains(targetClass) ? '' : 'none';
            });
            
            documentSelect.disabled = false;
        } else {
            documentSelect.disabled = true;
        }
    });
    
    // レベル3 (資料名) の変更処理 
    documentSelect.addEventListener('change', () => {
        if (executeButton) {
            if (documentSelect.value !== '0') {
                // 有効化: disabled属性を解除し、クラスを削除
                executeButton.disabled = false;
                executeButton.classList.remove('disabled-button');
            } else {
                // 無効化: disabled属性を設定し、クラスを再付与
                executeButton.disabled = true;
                executeButton.classList.add('disabled-button');
            }
        }
    });
    
    // 実行ボタンのクリックイベント (input type="button" 用に修正)
    if (executeButton) {
        executeButton.addEventListener('click', () => {
            // disabled属性が効いているはずだが、念のため二重チェック
            if (executeButton.disabled) {
                return;
            }

            const pdfUrl = documentSelect.value;
            
            if (pdfUrl && pdfUrl !== '0') {
                // 実行ボタンは常に新しいタブ/ウィンドウで開く
                // window.open(URL, target); を使用する
                window.open(pdfUrl, '_blank'); 
            }
        });
    }

    // ----------------------------------------------------------------
    // 3. ヘルパー関数 (実行ボタン無効化処理を input type="button" に適合)
    // ----------------------------------------------------------------
    
    /**
     * 次のプルダウンを初期状態にリセットし、すべてのオプションを非表示にします。
     */
    function initializeNextSelect(selectElement, allOptions) {
        selectElement.value = '0';
        selectElement.disabled = true;
        allOptions.forEach(option => option.style.display = 'none');
        
        // レベル3のリセット時、実行ボタンも無効化する
        if (selectElement === documentSelect && executeButton) {
            // disabled属性とクラスを設定
            executeButton.disabled = true;
            executeButton.classList.add('disabled-button');
        }
    }
});