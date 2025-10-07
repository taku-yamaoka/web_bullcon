document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------
    // 1. 要素の取得 
    // ----------------------------------------------------------------
    const termsScrollArea = document.getElementById('terms-scroll-area'); 
    const agreeCheckbox = document.getElementById('agree-checkbox');
    const registerButton = document.getElementById('register-button'); 
    const revisionDate = document.querySelector('.revision-date');
    
    if (!termsScrollArea || !revisionDate || !agreeCheckbox || !registerButton) {
         console.error('必要な要素がHTMLに見つかりません。');
         return; 
    }
    
    const scrollTarget = termsScrollArea; 
    let isScrolledToBottom = false;

    // ----------------------------------------------------------------
    // 2. スクロールイベントの処理 
    // ----------------------------------------------------------------
    const checkScroll = () => {
        const scrollDifference = termsScrollArea.scrollHeight - termsScrollArea.clientHeight;
        const tolerance = 5; 

        if (termsScrollArea.scrollTop >= scrollDifference - tolerance) {
            if (!isScrolledToBottom) {
                // 規約の最後までスクロールされたら、チェックボックスを有効化
                agreeCheckbox.disabled = false; 
                isScrolledToBottom = true;
                
                scrollTarget.removeEventListener('scroll', checkScroll);
                
                console.log('利用規約の最後までスクロールされました。チェックボックスが有効になりました。');
            }
        }
    };

    scrollTarget.addEventListener('scroll', checkScroll);
    checkScroll();

    // ----------------------------------------------------------------
    // 3. チェックボックス押下時の処理 
    // ----------------------------------------------------------------
    agreeCheckbox.addEventListener('change', () => {
        if (agreeCheckbox.checked) {
            // チェックされたら、登録ボタンから無効クラスを削除し有効化
            registerButton.classList.remove('disabled-button');
            
            // アンカータグ (<a>) のhref属性を正しいURLに戻す
            registerButton.href = './regist_form.html';
            
        } else {
            // チェックが外れたら、無効クラスを再付与し無効化
            registerButton.classList.add('disabled-button');
            
            // href属性を一時的に無効な値に戻す
            registerButton.href = '#'; 
        }
    });
});