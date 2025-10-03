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

            // 製品情報メガメニューをJSONデータから動的に生成
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
    // 製品情報メガメニューをJSONから生成する関数
    //==================================
    function buildProductMegaMenu(data) {
        const productDropdown = document.getElementById('product-dropdown');
        if (!productDropdown) return;

        const mainList = productDropdown.querySelector('.dropdown-list-container .dropdown-list');
        if (!mainList) return;

        // 既存の動的コンテンツをクリア
        mainList.innerHTML = '';
        
        // 隠しデータコンテナを作成
        const dataContainer = document.createElement('div');
        dataContainer.style.display = 'none';
        dataContainer.id = 'product-data-container';
        productDropdown.appendChild(dataContainer);

        // メインリストを構築
        // カテゴリーの<li>要素を動的に生成
        data.products_data.categories.forEach(category => {
            const listItem = document.createElement('li');
            listItem.classList.add('has-sub-list');
            listItem.setAttribute('data-category-id', category.id); // カテゴリーIDをデータ属性として追加

            const categoryLink = document.createElement('a');
            categoryLink.href = category.url;
            categoryLink.textContent = category.name;
            listItem.appendChild(categoryLink);

            mainList.appendChild(listItem);

            // サブメニューと画像データを隠しコンテナに追加
            const subMenu = document.createElement('ul');
            subMenu.classList.add('sub-dropdown-menu');
            subMenu.id = `sub-menu-${category.id}`; // カテゴリーIDでサブメニューを識別

            category.products.forEach(product => {
                const subListItem = document.createElement('li');
                const productLink = document.createElement('a');
                productLink.href = product.main_page.url;
                productLink.setAttribute('data-image-target', `image-${product.id}`);
                productLink.textContent = product.name;
                subListItem.appendChild(productLink);
                subMenu.appendChild(subListItem);

                // 製品画像のHTMLを隠し要素として追加
                const imageData = document.createElement('div');
                imageData.id = `image-${product.id}`;
                imageData.innerHTML = `
                    <img src="${product.image_path}" alt="">
                    <h4 class="product-title">${product.name}</h4>
                    <p class="product-description">${product.short_description}</p>
                `;
                dataContainer.appendChild(imageData);
            });
            dataContainer.appendChild(subMenu);
        });
    }
    
    //==================================
    // ヘッダー関連の機能を初期化する関数
    //==================================
    function initializeHeaderFunctions() {
        // モバイルナビゲーションの位置設定ロジック
        const mobileNav = document.querySelector('.mobile-nav');
        let mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
        const mainHeader = document.querySelector('.header');

        if (!mobileNavOverlay) {
            mobileNavOverlay = document.createElement('div');
            mobileNavOverlay.classList.add('mobile-nav-overlay');
            document.body.appendChild(mobileNavOverlay);
        }

        if (mainHeader && mobileNav && mobileNavOverlay) {
            const setMobileNavPosition = () => {
                mobileNav.style.top = `${mainHeader.offsetHeight}px`;
                mobileNavOverlay.style.top = `${mainHeader.offsetHeight}px`;
            };
            setMobileNavPosition();
            window.addEventListener('resize', setMobileNavPosition);
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
    // メガメニューの機能を初期化する関数
    //==================================
    function initializeMegaMenu() {
        const navItemsWithDropdown = document.querySelectorAll('.nav-item.has-dropdown');
        let activeDropdown = null;
        let timeoutId = null;
        const imageContainer = document.querySelector('.dropdown-image-container'); // 画像コンテナを取得

        navItemsWithDropdown.forEach(navItem => {
            const targetDropdown = document.getElementById(navItem.dataset.dropdownTarget);
            
            navItem.addEventListener('mouseenter', () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                if (activeDropdown && activeDropdown !== targetDropdown) {
                    activeDropdown.classList.remove('is-visible');
                    document.querySelector(`.nav-item[data-dropdown-target="${activeDropdown.id}"]`).classList.remove('is-active');
                }
                
                if (targetDropdown) {
                    targetDropdown.classList.add('is-visible');
                    navItem.classList.add('is-active');
                    activeDropdown = targetDropdown;
                    if (targetDropdown.id === 'product-dropdown') {
                        // 製品メガメニューが開かれたら、画像コンテナを空にする
                        if (imageContainer) {
                            imageContainer.innerHTML = '';
                        }
                        adjustDropdownBorderHeight(targetDropdown);
                    }
                }
            });

            navItem.addEventListener('mouseleave', () => {
                timeoutId = setTimeout(() => {
                    if (activeDropdown && !navItem.matches(':hover') && !activeDropdown.matches(':hover')) {
                        activeDropdown.classList.remove('is-visible');
                        navItem.classList.remove('is-active');
                        activeDropdown = null;
                    }
                }, 150);
            });

            if (targetDropdown) {
                targetDropdown.addEventListener('mouseenter', () => {
                    clearTimeout(timeoutId);
                    navItem.classList.add('is-active');
                });

                targetDropdown.addEventListener('mouseleave', () => {
                    timeoutId = setTimeout(() => {
                        if (!navItem.matches(':hover')) {
                            targetDropdown.classList.remove('is-visible');
                            navItem.classList.remove('is-active');
                            activeDropdown = null;
                        }
                    }, 150);
                });
            }
        });

        // サブメニューのホバー機能
        const productCategories = document.getElementById('product-dropdown').querySelector('.dropdown-list');
        const subDropdownContainer = document.querySelector('.sub-dropdown-list-container');
        const dataContainer = document.getElementById('product-data-container');

        if (productCategories && subDropdownContainer && imageContainer) {
            const listItemsWithSublist = productCategories.querySelectorAll('.has-sub-list');
            listItemsWithSublist.forEach(listItem => {
                listItem.addEventListener('mouseenter', () => {
                    // 全てのカテゴリからホバー状態を削除
                    productCategories.querySelectorAll('li').forEach(li => li.classList.remove('is-hovered'));
                    // 現在ホバーしているカテゴリにホバー状態を追加
                    listItem.classList.add('is-hovered');
                    
                    const categoryId = listItem.getAttribute('data-category-id');
                    const subList = document.getElementById(`sub-menu-${categoryId}`);

                    if (subList) {
                        subDropdownContainer.innerHTML = subList.innerHTML;
                    } else {
                        subDropdownContainer.innerHTML = '';
                    }
                    adjustDropdownBorderHeight(document.getElementById('product-dropdown'));
                });
            });

            // ホバーイベントリスナーの修正
            subDropdownContainer.addEventListener('mouseenter', (event) => {
                const link = event.target.closest('a');
                if (link) {
                    const targetId = link.getAttribute('data-image-target');
                    const dataElement = document.getElementById(targetId);
                    if (dataElement) {
                        imageContainer.innerHTML = dataElement.innerHTML;
                    } else {
                        imageContainer.innerHTML = '';
                    }
                }
            }, true);
            
            // マウスがサブドロップダウンから離れたときの処理を追加
            subDropdownContainer.addEventListener('mouseleave', () => {
                imageContainer.innerHTML = '';
            });

            const productDropdown = document.getElementById('product-dropdown');
            if (productDropdown) {
                productDropdown.addEventListener('mouseleave', () => {
                    // ここでサブメニューと画像をクリアすると、親から離れたときに画像が消えてしまう
                    // ユーザーが意図的にドロップダウン全体から離れた時のみクリアする
                });
            }
        }
    }

    //==================================
    // ボーダーの高さを調整する関数
    //==================================
    function adjustDropdownBorderHeight(dropdownMenu) {
        const leftContainer = dropdownMenu.querySelector('.dropdown-list-container');
        const middleContainer = dropdownMenu.querySelector('.sub-dropdown-list-container');
        
        if (leftContainer && middleContainer) {
            leftContainer.style.height = 'auto';
            middleContainer.style.height = 'auto';

            const leftHeight = leftContainer.offsetHeight;
            const middleHeight = middleContainer.offsetHeight;

            const maxHeight = Math.max(leftHeight, middleHeight);
            
            leftContainer.style.minHeight = `${maxHeight}px`;
            middleContainer.style.minHeight = `${maxHeight}px`;
        }
    }

    //==================================
    // スクロール時のヘッダー固定機能
    //==================================
    function initializeHeaderScroll() {
        const mainHeader = document.querySelector('.header');
        if (!mainHeader) return;

        // ヘッダーがDOMに挿入され次第、すぐに fixed 状態（is-stuck）にする。
        // スクロール時の position: fixed への切り替えをなくし、カクつきを防ぐ。
        mainHeader.classList.add('is-stuck');

        // ヘッダーが fixed になった分のスペースを body に付与する。（CSSで処理推奨だが、JSで対応する場合）
        // const headerHeight = mainHeader.offsetHeight;
        // document.body.style.paddingTop = `${headerHeight}px`;

        let lastScrollY = window.scrollY;
        let ticking = false; // requestAnimationFrame制御用フラグ

        const updateHeaderState = () => {
            const currentScrollY = window.scrollY;
            // is-stuckが適用済みのため、ヘッダーの高さは非表示判定にのみ使用
            const headerHeight = mainHeader.offsetHeight; 

            // ヘッダーの高さ分を超えて、さらにこのピクセル数スクロールしたら非表示にする閾値
            const SCROLL_THRESHOLD = 50;
            const hideTriggerPosition = headerHeight + SCROLL_THRESHOLD;

            // 【is-stuck ロジックを削除】: 既に上で fixed にしているため不要。

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
