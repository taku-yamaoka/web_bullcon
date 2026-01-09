document.addEventListener('DOMContentLoaded', function() {
    // ハンバーガーメニューの開閉
    const hamburger = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('.header-nav');

    if (hamburger && nav) { // 要素が存在するか確認
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });
    }

    // カルーセルの動き
    const paginationContainer = document.querySelector('.hero-pagination');
    let currentSlide = 0;
    let autoSlideInterval;
    let slides;

    // スライドとドットの表示を制御する関数
    function showSlide(index) {
        // 現在のドット要素を動的に取得
        const dots = document.querySelectorAll('.pagination-dot');
        if (!slides || !dots || slides.length === 0) {
            return;
        }
        slides.forEach(slide => slide.style.opacity = 0);
        dots.forEach(dot => dot.classList.remove('active'));
        slides[index].style.opacity = 1;
        dots[index].classList.add('active');
        currentSlide = index;
    }

    // 次のスライドに切り替える関数
    function nextSlide() {
        if (!slides || slides.length === 0) {
            return;
        }
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    // 自動スライド機能
    const startAutoSlide = () => {
        clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(nextSlide, 5000);
    };

    const resetAutoSlide = () => {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    };

    // ページネーションコンテナにイベントリスナーを追加（イベント委譲）
    if (paginationContainer) {
        paginationContainer.addEventListener('click', (event) => {
            const clickedDot = event.target.closest('.pagination-dot');
            if (clickedDot) {
                // クリックされた点のインデックスを、親要素の子要素から直接取得
                const dotsList = Array.from(paginationContainer.children);
                const index = dotsList.indexOf(clickedDot);
                if (index !== -1) {
                    showSlide(index);
                    resetAutoSlide();
                }
            }
        });
    }

    // 初回表示とリサイズイベントを扱う関数
    const handleResize = () => {
        if (!paginationContainer) {
            return;
        }
        const isMobile = window.innerWidth < 600;
        // PCまたはモバイルのスライド要素を取得し、グローバル変数に格納
        slides = document.querySelectorAll(isMobile ? '.slider-item-mobile' : '.slider-item');

        if (slides.length === 0) {
            // スライドがない場合は処理を終了
            return;
        }

        // 既存のページネーションをクリア
        paginationContainer.innerHTML = '';

        // ページネーションの点を動的に生成
        slides.forEach((slide) => {
            const dot = document.createElement('span');
            dot.classList.add('pagination-dot');
            paginationContainer.appendChild(dot);
        });

        // ページ表示時に現在のスライドを表示
        showSlide(currentSlide);
        startAutoSlide(); // 自動スライドを再開
    };

    // 初期表示とリサイズイベントを設定
    window.addEventListener('resize', handleResize);
    handleResize(); // 初回ロード時にも実行
});
