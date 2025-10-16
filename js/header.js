document.addEventListener('DOMContentLoaded', () => {
    // ヘッダーと製品データを同時に非同期で読み込む
    Promise.all([
        fetch('/html/_header.html').then(response => {
            if (!response.ok) {
                throw new Error('Failed to load header: ' + response.statusText);
            }
            return response.text();
        }),
        fetch('/html/products/products_data.json').then(response => {
            if (!response.ok) {
                throw new Error('Failed to load products data: ' + response.statusText);
            }
            return response.json();
        })
    ])
    .then(([headerHtml, productsData]) => {
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(headerHtml, 'text/html');
            const headerContent = doc.body.innerHTML;
            headerPlaceholder.innerHTML = headerContent;

            // 製品情報メガメニューをJSONデータから動的に生成 (2分割対応)
            buildProductMegaMenu(productsData);

            // ヘッダーの全機能の初期化
            initializeHeaderFunctions();
        } else {
            console.error("Error: Element with id 'header-placeholder' not found.");
        }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            headerPlaceholder.innerHTML = '<p>ヘッダーの読み込みに失敗しました。</p>';
        }
    });

    //==================================
    // 製品情報メガメニューをJSONから生成する関数 (2分割対応)
    //==================================
    function buildProductMegaMenu(data) {
        const productDropdown = document.getElementById('product-dropdown');
        if (!productDropdown) return;

        const mainList = productDropdown.querySelector('.dropdown-list-container .dropdown-list');
        if (!mainList) return;

        // 既存の動的コンテンツをクリア
        mainList.innerHTML = '';
        
        // 隠しデータコンテナを作成/取得 (製品グリッドHTMLを格納する)
        let dataContainer = document.getElementById('product-data-container');
        if (!dataContainer) {
            dataContainer = document.createElement('div');
            dataContainer.style.display = 'none';
            dataContainer.id = 'product-data-container';
            productDropdown.appendChild(dataContainer);
        } else {
            dataContainer.innerHTML = ''; // 既存のデータをクリア
        }

        // メインリストと製品グリッドHTMLを構築
        data.products_data.categories.forEach(category => {
            // --- 左側リストの項目を構築 ---
            const listItem = document.createElement('li');
            listItem.classList.add('has-sub-list'); 
            listItem.setAttribute('data-category-id', category.id); // カテゴリーIDをデータ属性として追加

            const categoryLink = document.createElement('a');
            categoryLink.href = category.url;
            categoryLink.textContent = category.name;
            listItem.appendChild(categoryLink);

            mainList.appendChild(listItem);

            // --- 右側グリッド表示用のHTMLを隠しコンテナに格納 ---
            const productGrid = document.createElement('div');
            productGrid.classList.add('product-grid-view'); // グリッド表示用のクラス
            productGrid.id = `product-grid-${category.id}`; // カテゴリーIDでグリッドを識別

            category.products.forEach(product => {
                // グリッド内の製品アイテムHTMLを構築 (画像とタイトル)
                productGrid.innerHTML += `
                    <a href="${product.main_page.url}" class="grid-item" data-product-id="${product.id}">
                        <img src="${product.image_path}" alt="${product.name}">
                        <p class="grid-product-title">${product.name}</p>
                    </a>
                `;
            });
            
            // '全てを見る' リンクを追加 (オプション)
            if (category.products.length > 0) {
                productGrid.innerHTML += `
                    <a href="${category.url}" class="grid-view-all">全ての製品を見る &gt;</a>
                `;
            }

            // 隠しコンテナにカテゴリーごとの製品グリッドを追加
            dataContainer.appendChild(productGrid);
        });
    }
    
    //==================================
    // ヘッダー関連の機能を初期化する関数
    //==================================
    function initializeHeaderFunctions() {
        const mobileNav = document.querySelector('.mobile-nav');
        let mobileNavOverlay = document.querySelector('.mobile-nav-overlay');

        if (!mobileNavOverlay) {
            mobileNavOverlay = document.createElement('div');
            mobileNavOverlay.classList.add('mobile-nav-overlay');
            document.body.appendChild(mobileNavOverlay);
        }

        // メガメニューの初期化
        initializeMegaMenu();
        // スクロール時のヘッダー固定を初期化
        initializeHeaderScroll();

        // ハンバーガーメニューの開閉機能
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        const overlay = document.querySelector('.mobile-nav-overlay');

        if (hamburgerMenu && mobileNav && overlay) {
            const openMenu = () => {
                hamburgerMenu.classList.add('is-active');
                mobileNav.classList.add('is-visible');
                overlay.classList.add('is-visible');
                document.body.style.overflow = 'hidden';
            };

            const closeMenu = () => {
                hamburgerMenu.classList.remove('is-active');
                mobileNav.classList.remove('is-visible');
                overlay.classList.remove('is-visible');
                document.body.style.overflow = '';
            };

            hamburgerMenu.addEventListener('click', () => {
                if (mobileNav.classList.contains('is-visible')) {
                    closeMenu();
                } else {
                    openMenu();
                }
            });
            overlay.addEventListener('click', closeMenu);
        }
    }
    
    //==================================
    // メガメニューの機能を初期化する関数 (クリック開閉に改修)
    //==================================
    function initializeMegaMenu() {
        const navItemsWithDropdown = document.querySelectorAll('.nav-item.has-dropdown');
        let activeDropdown = null;

        // ドロップダウンメニュー外のクリックを処理し、メニューを閉じる
        document.addEventListener('click', (event) => {
            if (activeDropdown && !event.target.closest('.nav-item.has-dropdown') && !event.target.closest('.dropdown-menu')) {
                // 開いているドロップダウンを全て閉じる
                document.querySelectorAll('.dropdown-menu.is-visible').forEach(menu => {
                    menu.classList.remove('is-visible');
                });
                document.querySelectorAll('.nav-item.is-active').forEach(item => {
                    item.classList.remove('is-active');
                });
                activeDropdown = null;
            }
        });

        navItemsWithDropdown.forEach(navItem => {
            const targetDropdown = document.getElementById(navItem.dataset.dropdownTarget);

            // 1. クリックで開閉を制御
            navItem.addEventListener('click', (event) => {
                // ドロップダウンを持つ nav-item のリンククリックは、デフォルトの遷移を阻止する
                // （ドロップダウンを開閉するためのクリックに専念させる）
                event.preventDefault(); 
                
                if (!targetDropdown) return;

                const isCurrentlyOpen = targetDropdown.classList.contains('is-visible');

                // 現在開いているドロップダウンがあれば閉じる
                if (activeDropdown && activeDropdown !== targetDropdown) {
                    activeDropdown.classList.remove('is-visible');
                    document.querySelector(`.nav-item[data-dropdown-target="${activeDropdown.id}"]`).classList.remove('is-active');
                }

                if (isCurrentlyOpen) {
                    // 閉じる
                    targetDropdown.classList.remove('is-visible');
                    navItem.classList.remove('is-active');
                    activeDropdown = null;
                } else {
                    // 開く
                    targetDropdown.classList.add('is-visible');
                    navItem.classList.add('is-active');
                    activeDropdown = targetDropdown;
                    
                    if (targetDropdown.id === 'product-dropdown') {
                        // 製品メニューが開いたとき、最初のカテゴリの製品グリッドをロードする
                        const productDropdown = document.getElementById('product-dropdown');
                        const firstCategoryItem = productDropdown.querySelector('.dropdown-list li.has-sub-list');
                        
                        // 初回開いたときのみ、最初のカテゴリの製品をロード
                        if (firstCategoryItem) {
                            const categoryId = firstCategoryItem.getAttribute('data-category-id');
                            const productGridContainer = productDropdown.querySelector('.sub-dropdown-list-container');
                            const productGrid = document.getElementById(`product-grid-${categoryId}`);
                            
                            // 既にホバー状態がない場合のみ実行（冗長なロードを防ぐ）
                            if (!firstCategoryItem.classList.contains('is-hovered')) {
                                productDropdown.querySelectorAll('.dropdown-list li').forEach(li => li.classList.remove('is-hovered'));
                                firstCategoryItem.classList.add('is-hovered');
                                if (productGrid) {
                                    productGridContainer.innerHTML = productGrid.outerHTML;
                                } else {
                                    productGridContainer.innerHTML = '';
                                }
                            }
                        }
                        adjustDropdownBorderHeight(targetDropdown);
                    }
                }
                event.stopPropagation(); // ドロップダウン外のクリックイベントが発火しないようにする
            });

            // 2. product-dropdown内のカテゴリーリストの制御 (クリックに改修) 🌟
            if (targetDropdown && targetDropdown.id === 'product-dropdown') {
                const productCategories = targetDropdown.querySelector('.dropdown-list');
                const productGridContainer = targetDropdown.querySelector('.sub-dropdown-list-container');
                
                if (productCategories && productGridContainer) {
                    const listItemsWithSublist = productCategories.querySelectorAll('.has-sub-list');
                    
                    listItemsWithSublist.forEach(listItem => {
                        // マウスホバーイベントを削除し、クリックイベントを追加
                        listItem.removeEventListener('mouseenter', listItem.mouseenterHandler);
                        
                        // カテゴリ項目内のリンクにクリックイベントを追加
                        const categoryLink = listItem.querySelector('a');
                        if (categoryLink) {
                             categoryLink.addEventListener('click', (e) => {
                                // ページ遷移を阻止
                                e.preventDefault(); 
                                e.stopPropagation(); // 親のnavItemクリックイベントに伝播しないようにする

                                // 全てのカテゴリからアクティブ状態を削除
                                productCategories.querySelectorAll('li').forEach(li => li.classList.remove('is-hovered'));
                                // 現在クリックされたカテゴリにアクティブ状態を追加
                                listItem.classList.add('is-hovered');
                                
                                const categoryId = listItem.getAttribute('data-category-id');
                                const productGrid = document.getElementById(`product-grid-${categoryId}`);

                                if (productGrid) {
                                    productGridContainer.innerHTML = productGrid.outerHTML;
                                } else {
                                    productGridContainer.innerHTML = '';
                                }
                                
                                // ボーダーの高さを調整
                                adjustDropdownBorderHeight(targetDropdown);
                            });
                        }
                    });
                }
            }
        });
    }

    //==================================
    // ボーダーの高さを調整する関数
    //==================================
    function adjustDropdownBorderHeight(dropdownMenu) {
        const leftContainer = dropdownMenu.querySelector('.dropdown-list-container');
        // middleContainerを製品グリッドコンテナとして再定義
        const middleContainer = dropdownMenu.querySelector('.sub-dropdown-list-container'); 
        
        if (leftContainer && middleContainer) {
            leftContainer.style.height = 'auto';
            middleContainer.style.height = 'auto';

            // DOMが再描画されるのを待ってから高さを取得
            setTimeout(() => {
                const leftHeight = leftContainer.offsetHeight;
                const middleHeight = middleContainer.offsetHeight;

                const maxHeight = Math.max(leftHeight, middleHeight);
                
                leftContainer.style.minHeight = `${maxHeight}px`;
                middleContainer.style.minHeight = `${maxHeight}px`;
            }, 0); // ゼロ遅延で実行
        }
    }

    //==================================
    // スクロール時のヘッダー固定機能
    //==================================
    function initializeHeaderScroll() {
        const mainHeader = document.querySelector('.header');
        if (!mainHeader) return;

        // ヘッダーがDOMに挿入され次第、すぐに fixed 状態（is-stuck）にする。
        mainHeader.classList.add('is-stuck');

        let lastScrollY = window.scrollY;
        let ticking = false; // requestAnimationFrame制御用フラグ

        const updateHeaderState = () => {
            const currentScrollY = window.scrollY;
            const headerHeight = mainHeader.offsetHeight; 

            // ヘッダーの高さ分を超えて、さらにこのピクセル数スクロールしたら非表示にする閾値
            const SCROLL_THRESHOLD = 50;
            const hideTriggerPosition = headerHeight + SCROLL_THRESHOLD;

            // 1. スクロールダウン（下方向）の検知
            // 非表示トリガー位置を超えた場合のみ隠す
            if (currentScrollY > lastScrollY && currentScrollY > hideTriggerPosition) {
                mainHeader.classList.add('is-hidden');
            }
            // 2. スクロールアップ（上方向）の検知 OR ページ最上部近くに戻った場合 (最上部からSCROLL_THRESHOLDの範囲)
            else if (currentScrollY < lastScrollY || currentScrollY <= SCROLL_THRESHOLD) {
                mainHeader.classList.remove('is-hidden');
            }

            lastScrollY = currentScrollY;
            ticking = false; // 処理完了
        };

        const handleScroll = () => {
            if (!ticking) {
                // ブラウザの描画タイミングに合わせて処理を実行
                window.requestAnimationFrame(() => {
                    updateHeaderState();
                });
                ticking = true; // 処理中
            }
        };

        // スクロールイベントリスナーを追加 (RAF経由)
        window.addEventListener('scroll', handleScroll);

        // リサイズ時にも状態を更新（ヘッダーの高さが変わる可能性があるため）
        window.addEventListener('resize', updateHeaderState);

        // 初期化時にも一度実行
        updateHeaderState();
    }
    
    //==================================
    // 製品ページの機能
    //==================================
    const categoryTabs = document.querySelectorAll('.category-tab');
    const productItems = document.querySelectorAll('.product-item');
    const urlParams = new URLSearchParams(window.location.search);
    const initialCategory = urlParams.get('category') || 'all';

    function filterProducts(category) {
        categoryTabs.forEach(tab => tab.classList.remove('active'));
        const activeTab = document.querySelector(`.category-tab[data-category="${category}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        productItems.forEach(item => {
            if (category === 'all' || item.classList.contains(category)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    filterProducts(initialCategory);

    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const selectedCategory = tab.getAttribute('data-category');
            filterProducts(selectedCategory);
            const newUrl = window.location.origin + window.location.pathname + `?category=${selectedCategory}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
        });
    });

    window.addEventListener('popstate', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category') || 'all';
        filterProducts(category);
    });

    //==================================
    // モバイル用アコーディオンメニュー
    //==================================
    document.querySelectorAll('.category-title').forEach(title => {
        title.addEventListener('click', () => {
            const content = title.nextElementSibling;
            title.classList.toggle('is-open');
            content.classList.toggle('is-visible');
        });
    });

    const mobileCategoryLinks = document.querySelectorAll('.category-items li a');
    mobileCategoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedCategory = link.getAttribute('data-category');
            filterProducts(selectedCategory);
            
            const parentContainer = link.closest('.category-list-container');
            if (parentContainer) {
                const title = parentContainer.querySelector('.category-title');
                const content = parentContainer.querySelector('.category-items');
                if (title && content) {
                    title.classList.remove('is-open');
                    content.classList.remove('is-visible');
                }
            }
        });
    });
});