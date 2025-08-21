document.addEventListener('DOMContentLoaded', () => {

    // 1. ヘッダーを非同期で読み込み、DOMに挿入する
    fetch('/html/_header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load header: ' + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = data;
                
                // 2. DOM挿入後に、ドロップダウンの制御スクリプトを実行する
                initializeDropdowns(headerPlaceholder);
            } else {
                console.error("Error: Element with id 'header-placeholder' not found.");
            }
        })
        .catch(error => {
            console.error('Error fetching header:', error);
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = '<p>ヘッダーの読み込みに失敗しました。</p>';
            }
        });

});

// ドロップダウンメニューの動作を初期化する関数
function initializeDropdowns(container) {
    const navItemsWithDropdown = container.querySelectorAll('.nav-item.has-dropdown');
    const dropdownMenus = container.querySelectorAll('.dropdown-menu');
    
    let activeDropdown = null;
    let timeoutId = null;

    navItemsWithDropdown.forEach(navItem => {
        const targetId = navItem.dataset.dropdownTarget;
        const targetDropdown = container.querySelector(`#${targetId}`);

        // マウスが navItem に入ったときの処理
        navItem.addEventListener('mouseenter', () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            // 全てのドロップダウンを非表示にする
            dropdownMenus.forEach(menu => {
                menu.classList.remove('is-visible');
            });

            // 該当のドロップダウンを表示
            if (targetDropdown) {
                targetDropdown.classList.add('is-visible');
                activeDropdown = targetDropdown;
            }
        });

        // マウスが navItem から出たときの処理
        navItem.addEventListener('mouseleave', () => {
            timeoutId = setTimeout(() => {
                if (activeDropdown && !navItem.matches(':hover') && !activeDropdown.matches(':hover')) {
                    activeDropdown.classList.remove('is-visible');
                    activeDropdown = null;
                }
            }, 150);
        });
    });

    // ドロップダウンメニュー自体からマウスが外れたときの処理
    dropdownMenus.forEach(menu => {
        menu.addEventListener('mouseleave', () => {
            if (activeDropdown) {
                activeDropdown.classList.remove('is-visible');
                activeDropdown = null;
            }
        });
    });
}