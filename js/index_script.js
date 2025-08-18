// ハンバーガーメニューの開閉
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('.header-nav');

    if (hamburger && nav) { // 要素が存在するか確認
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });
    }

    // カルーセルの動き
    const slides = document.querySelectorAll('.slider-item');
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');
    const paginationContainer = document.querySelector('.hero-pagination');
    let currentSlide = 0;
    let autoSlideInterval;

    if (slides.length === 0 || !paginationContainer) {
        // スライダー関連の要素がない場合は、処理を終了
        return;
    }

    // ページネーションの点を動的に生成
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('pagination-dot');
        if (index === 0) {
            dot.classList.add('active');
        }
        dot.addEventListener('click', () => {
            showSlide(index);
            resetAutoSlide();
        });
        paginationContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.pagination-dot');

    function showSlide(index) {
        slides.forEach(slide => slide.style.opacity = 0);
        dots.forEach(dot => dot.classList.remove('active'));
        slides[index].style.opacity = 1;
        dots[index].classList.add('active');
        currentSlide = index;
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }

    // 自動スライド機能
    const startAutoSlide = () => {
        autoSlideInterval = setInterval(nextSlide, 5000);
    };

    const resetAutoSlide = () => {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    };

    // ボタンのクリックイベント（要素が存在するか確認）
    if (nextButton && prevButton) {
        nextButton.addEventListener('click', () => {
            nextSlide();
            resetAutoSlide();
        });

        prevButton.addEventListener('click', () => {
            prevSlide();
            resetAutoSlide();
        });
    }

    // 初回表示
    startAutoSlide();
});