document.addEventListener('DOMContentLoaded', () => {
    const mainTable = document.querySelector('body > table[width="1000"]');
    const mainContentElement = document.querySelector('main'); 
    const footerPlaceholder = document.getElementById('footer-placeholder');

    // header要素の読み込みを待つ関数
    const waitForHeader = (callback) => {
        const checkElement = () => {
            const headerElement = document.getElementById('header'); 
            
            if (headerElement) {
                 // loadイベントが既に完了しているかチェック
                if (document.readyState === 'complete') {
                    // 既に完了している場合は、即座にコールバックを実行
                    callback(headerElement);
                } else {
                    // 完了していない場合は、イベントを待ち受ける
                    window.addEventListener('load', () => callback(headerElement)); 
                }
                console.log('detect header');
            } else {
                if (Date.now() - startTime > 5000) {
                    console.warn("Header element not found after 5 seconds. Assuming top offset is 10px.");
                    // ヘッダーがない場合も window.load を待つ
                    if (document.readyState === 'complete') {
                        callback(null);
                    } else {
                        window.addEventListener('load', () => callback(null));
                    }
                } else {
                    setTimeout(checkElement, 50);
                }
            }
        };
        const startTime = Date.now();
        checkElement();
    };

    // ヘッダー要素の読み込みが完了したら、サイドバーの初期化を行う
    waitForHeader((headerElement) => {
        console.log('start wfh');
        if (!(mainTable || mainContentElement) || !footerPlaceholder) {
            console.warn("主要な要素（テーブルまたはフッター）が見つかりません。");
            return;
        }

        // DOM構造の再構築
        const sidebarContainer = document.createElement('div');
        sidebarContainer.className = 'product-sidebar-container';
        sidebarContainer.classList.add('sidebar-closed'); 
        
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'product-detail-page-wrapper';
        if (mainTable) { 
            mainTable.parentNode.removeChild(mainTable); 
            console.log('maintable');
            contentWrapper.appendChild(mainTable); 
        } else if (mainContentElement) {
            mainContentElement.parentNode.removeChild(mainContentElement);
            console.log('main'); 
            contentWrapper.appendChild(mainContentElement); 
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.style.opacity = '0';
        overlay.style.display = 'none';
        
        // **********************************************
        // オーバーレイを document.body.appendChild(overlay) から変更し、
        //         contentWrapperやsidebarContainerと同じ親ノード内に挿入する
        //         (CSSのz-index調整を前提)
        // **********************************************
        footerPlaceholder.parentNode.insertBefore(sidebarContainer, footerPlaceholder);
        footerPlaceholder.parentNode.insertBefore(contentWrapper, footerPlaceholder);
        // オーバーレイを挿入: ここで overlay を挿入することで、DOM上でヘッダーやボディのコンテンツの近くに配置
        footerPlaceholder.parentNode.insertBefore(overlay, contentWrapper);
        // **********************************************


        // トグルボタンの作成
        const controlWrapper = document.createElement('div');
        controlWrapper.id = 'sidebar-control-wrapper';
        controlWrapper.style.left = '10px'; // CSSに合わせて10pxに統一
        
        const toggleButton = document.createElement('button');
        toggleButton.id = 'sidebar-toggle-button';
        toggleButton.className = 'sidebar-toggle-btn';
        toggleButton.innerHTML = '<span></span><span></span><span></span>';
        toggleButton.setAttribute('aria-label', '製品カテゴリーメニューを開く');
        
        controlWrapper.appendChild(toggleButton);
        document.body.appendChild(controlWrapper); 

        // サイドバー内の閉じるボタンを作成
        const closeButton = document.createElement('button');
        closeButton.id = 'sidebar-close-button';
        closeButton.className = 'sidebar-close-btn';
        closeButton.innerHTML = '&times;'; 
        closeButton.setAttribute('aria-label', '製品カテゴリーメニューを閉じる');
        closeButton.style.display = 'none'; 
        sidebarContainer.appendChild(closeButton); 

        // 高さ/位置の計算と設定 (is-hiddenクラス連動ロジック)
        const setSidebarPositionsAndHeight = () => {
            const isSidebarOpen = sidebarContainer.classList.contains('sidebar-open');
            let topOffset;
            
            // サイドバーが開いている場合は常に画面最上部から
            if (isSidebarOpen) {
                topOffset = 0;
            } else if (headerElement) {
                // Header要素がある場合 (PC/モバイル共通のヘッダー追従ロジック)
                const isHeaderHidden = headerElement.classList.contains('is-hidden');
                
                if (isHeaderHidden) {
                    // Headerが隠れている場合: 画面上端から 10px のマージン
                    topOffset = 10;
                } else {
                    // Headerが見えている場合: Headerの高さの直下に固定
                    // window.load 後なので、headerElement.offsetHeight は正確な値
                    const headerHeight = headerElement.offsetHeight;
                    topOffset = headerHeight + 10;
                }

            } else {
                // Headerがない場合: 常に画面上部10pxから固定
                topOffset = 10;
            }
            
            // サイドバーコンテナには !important は不要 (モバイルCSSが制御するため)
            sidebarContainer.style.top = `${topOffset}px`;
            
            // controlWrapperには常に !important を適用 (PCでの追従を確実にするため)
            controlWrapper.style.setProperty('top', `${topOffset}px`, 'important');
            
            // 最大高さを計算
            const sidebarTop = parseInt(sidebarContainer.style.top, 10) || 0;
            const calculatedHeight = window.innerHeight - sidebarTop;
            sidebarContainer.style.maxHeight = `${calculatedHeight}px`;
        };
        
        // サイドバーのトグル機能
        const toggleSidebar = () => {
            const isClosed = sidebarContainer.classList.contains('sidebar-closed');
            
            sidebarContainer.classList.toggle('sidebar-closed', !isClosed);
            sidebarContainer.classList.toggle('sidebar-open', isClosed);
            
            // 外部トグルボタンの表示/非表示を切り替え
            if (controlWrapper) {
                 controlWrapper.style.display = isClosed ? 'none' : 'block'; 
            }
            // 内部閉じるボタンは、開く時に表示
            closeButton.style.display = isClosed ? 'block' : 'none';

            // オーバーレイの表示切り替え
            if (isClosed) {
                overlay.style.display = 'block';
                setTimeout(() => { overlay.style.opacity = '1'; }, 10);
                setSidebarPositionsAndHeight();
            } else {
                overlay.style.opacity = '0';
                setTimeout(() => { 
                    overlay.style.display = 'none'; 
                    setSidebarPositionsAndHeight();
                }, 300); 
            }
        };

        toggleButton.addEventListener('click', toggleSidebar);
        closeButton.addEventListener('click', toggleSidebar); 
        overlay.addEventListener('click', toggleSidebar);

        // Headerのクラス変更を監視するための MutationObserver を設定
        if (headerElement) {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        // Headerのクラスが変更されたら、位置を再計算
                        setSidebarPositionsAndHeight();
                    }
                });
            });
            
            // class属性の変化を監視
            observer.observe(headerElement, { attributes: true });
        }

        const handleResize = () => {
            // リサイズ時に位置を再計算
            setSidebarPositionsAndHeight();
        };
        
        // リサイズイベントリスナー
        window.addEventListener('resize', handleResize);
        
        // 初回設定 & 初期表示の強制
        setSidebarPositionsAndHeight();
        if (controlWrapper) { 
            controlWrapper.style.opacity = '1'; // 位置確定後に表示
        }

        // 製品データ読み込みとリスト生成
        fetch('/html/products/products_data.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const currentUrlPath = window.location.pathname.replace(/\/+$/, '') + window.location.search;

                const title = document.createElement('h3');
                title.textContent = '製品一覧';
                sidebarContainer.appendChild(title);
                
                const caution1 = document.createElement('p');
                caution1.textContent = '※青文字は詳細ページにリンクします。';
                caution1.style.fontSize = '12px'
                caution1.style.color = '#00479d'
                sidebarContainer.appendChild(caution1);

                const productList = document.createElement('ul');
                productList.className = 'category-list';
                sidebarContainer.appendChild(productList);

                data.products_data.categories.forEach(category => {
                    const categoryItem = document.createElement('li');
                    categoryItem.className = 'category-item';

                    // カテゴリヘッダー
                    const categoryHeader = document.createElement('div');
                    categoryHeader.className = 'category-header';
                    const categoryName = document.createElement('strong');
                    categoryName.textContent = category.name;
                    const categoryToggleBtn = document.createElement('img');
                    categoryToggleBtn.src = '/images/common/right_arrow_icon.png';
                    categoryToggleBtn.alt = 'トグル';
                    categoryToggleBtn.className = 'toggle-btn';
                    categoryHeader.appendChild(categoryName);
                    categoryHeader.appendChild(categoryToggleBtn);
                    categoryItem.appendChild(categoryHeader);

                    const productsUl = document.createElement('ul');
                    productsUl.className = 'products-sublist';
                    productsUl.style.display = 'none';
                    categoryItem.appendChild(productsUl);

                    let isCurrentCategory = false;

                    category.products.forEach(product => {
                        const productListItem = document.createElement('li');
                        
                        const productDiv = document.createElement('div');
                        productDiv.className = 'product-item-header';

                        const productLink = document.createElement('a');
                        productLink.href = product.main_page.url;
                        productLink.textContent = product.name;
                        
                        productDiv.appendChild(productLink);

                        let isCurrentProduct = false;
                        const productUrlPath = product.main_page.url.replace(/\/+$/, '');
                        
                        if (currentUrlPath.endsWith(productUrlPath)) {
                            productDiv.classList.add('current-product');
                            isCurrentCategory = true;
                            isCurrentProduct = true;
                        }

                        if (product.sub_pages && product.sub_pages.length > 0) {
                            // 1. sub_pagesの中に一つでも url を持つページがあるかチェックする
                            const hasValidSubPages = product.sub_pages.some(subPage => subPage.url); 

                            // 2. 新しい条件 (hasValidSubPages) で全体を囲む
                            if (hasValidSubPages) {
                                // アイコンの作成と付与
                                const productToggleBtn = document.createElement('img');
                                productToggleBtn.src = '/images/common/right_arrow_icon.png';
                                productToggleBtn.alt = 'トグル';
                                productToggleBtn.className = 'toggle-btn sub-toggle-btn';
                                productDiv.appendChild(productToggleBtn);
                            
                                // サブページUL要素の準備
                                const subPagesUl = document.createElement('ul');
                                subPagesUl.className = 'sub-pages-list';
                                subPagesUl.style.display = 'none';
                            
                                // サブページのループ処理
                                product.sub_pages.forEach(subPage => {
                                    const subPageListItem = document.createElement('li');
                                    const subPageLink = document.createElement('a');
                                    let isInsert = false;

                                    // subPage.urlが存在するかどうかでリンクを設定
                                    if (subPage.url) {
                                        subPageLink.href = subPage.url;
                                        subPageLink.style.color = "#00479d";
                                    
                                        const subPageUrlPath = subPage.url.replace(/\/+$/, '');
                                        if (currentUrlPath.endsWith(subPageUrlPath)) {
                                            subPageLink.classList.add('current-product');
                                            productDiv.classList.add('current-product'); 
                                            isCurrentCategory = true;
                                            isCurrentProduct = true;
                                            isInsert = true;
                                        }
                                    } else {
                                        // urlがない場合はリンク無効化
                                        subPageLink.style.pointerEvents = 'none';
                                    }

                                    subPageLink.textContent = subPage.name;
                                
                                    // isInsertの条件（currentUrlPathとの一致）に関わらず、リストアイテムをULに追加
                                    subPageListItem.appendChild(subPageLink);
                                    subPagesUl.appendChild(subPageListItem);
                                });

                                // DOMに追加
                                productListItem.appendChild(productDiv);
                                productListItem.appendChild(subPagesUl);
                                productsUl.appendChild(productListItem);
                            
                                // トグル機能の追加
                                productDiv.addEventListener('click', () => {
                                    if (subPagesUl.style.display === 'none') {
                                        subPagesUl.style.display = 'block';
                                        productToggleBtn.style.transform = 'rotate(90deg)';
                                    } else {
                                        subPagesUl.style.display = 'none';
                                        productToggleBtn.style.transform = 'rotate(0deg)';
                                    }
                                });
                            } else {
                                // sub_pagesは存在するが、urlを持つページがない場合
                                productListItem.appendChild(productDiv);
                                productsUl.appendChild(productListItem);
                            }
                        } else {
                            // sub_pagesが存在しない、または要素数0の場合
                            productListItem.appendChild(productDiv);
                            productsUl.appendChild(productListItem);
                        }
                    });

                    productList.appendChild(categoryItem);

                    categoryHeader.addEventListener('click', () => {
                        if (productsUl.style.display === 'none') {
                            productsUl.style.display = 'block';
                            categoryToggleBtn.style.transform = 'rotate(90deg)';
                        } else {
                            productsUl.style.display = 'none';
                            categoryToggleBtn.style.transform = 'rotate(0deg)';
                        }
                    });
                    
                    if (isCurrentCategory) {
                        productsUl.style.display = 'block';
                        categoryToggleBtn.style.transform = 'rotate(90deg)';
                    }
                });
            })
            .catch(error => {
                console.error('製品データの読み込みに失敗しました:', error);
                sidebarContainer.style.display = 'none';
            });
    });
});