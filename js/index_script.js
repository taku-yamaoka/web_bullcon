// ハンバーガーメニューの開閉
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('.header-nav');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
    });

    // スライダー
    const sliderItems = document.querySelectorAll('.slider-item');
    let currentIndex = 0;

    function showNextSlide() {
        // 現在のスライドを非表示
        sliderItems[currentIndex].style.opacity = 0;

        // 次のスライドへ移動
        currentIndex = (currentIndex + 1) % sliderItems.length;

        // 次のスライドを表示
        sliderItems[currentIndex].style.opacity = 1;
    }

    // 4秒ごとにスライドを切り替える
    setInterval(showNextSlide, 4000);
});