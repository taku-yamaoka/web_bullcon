document.addEventListener('DOMContentLoaded', () => {
    const announcementsList = document.getElementById('announcements-list');
    const paginationContainer = document.getElementById('pagination-container');

    let allAnnouncementsData = [];
    let currentPage = 1;
    const ITEMS_PER_PAGE = 10;

    fetch('../../api/web_page/get_announcements_title.php', {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // 新しい順に日付で並び替え
            allAnnouncementsData = data.sort((a, b) => {
                const dateA = new Date(a.date.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, '$1-$2-$3'));
                const dateB = new Date(b.date.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, '$1-$2-$3'));
                return dateB - dateA;
            });

            renderAnnouncements();
            renderPagination();
        })
        .catch(error => {
            console.error('お知らせの読み込みに失敗しました:', error);
            announcementsList.innerHTML = '<li>お知らせを読み込めませんでした。</li>';
        });

    /**
     * お知らせリストを描画する
     */
    function renderAnnouncements() {
        announcementsList.innerHTML = '';

        if (allAnnouncementsData.length === 0) {
            announcementsList.innerHTML = '<li>お知らせはありません。</li>';
            return;
        }

        // 現在の日付から1週間前の日付を計算
        const currentDate = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(currentDate.getDate() - 7);

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const announcementsToDisplay = allAnnouncementsData.slice(startIndex, endIndex);

        announcementsToDisplay.forEach(item => {
            const li = document.createElement('li');

            // 日付を正規表現を使って正しく解析し、Dateオブジェクトに変換
            const date_match = item.date.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
            let formattedDate = '日付不明';
            if (date_match) {
                const year = date_match[1];
                const month = date_match[2].padStart(2, '0');
                const day = date_match[3].padStart(2, '0');
                formattedDate = `${year}/${month}/${day}`;
            }

            const link = document.createElement('a');
            link.href = item.url;

            const dateSpan = document.createElement('span');
            dateSpan.classList.add('announcement-date');
            dateSpan.textContent = formattedDate;

            const titleSpan = document.createElement('span');
            titleSpan.classList.add('announcement-title-text');
            titleSpan.textContent = item.title;
            titleSpan.style.flexGrow = '1';

            link.appendChild(dateSpan);
            link.appendChild(titleSpan);

            // Newバッジのロジック 
            const announcementDate = new Date(date_match[1], date_match[2] - 1, date_match[3]);
            if (announcementDate > oneWeekAgo) {
                const newBadge = document.createElement('span');
                newBadge.textContent = 'New';
                newBadge.classList.add('new-badge');

                link.appendChild(newBadge);
            }

            li.appendChild(link);
            announcementsList.appendChild(li);
        });
    }

    /**
     * ページネーションのUIを生成・描画する
     */
    function renderPagination() {
        paginationContainer.innerHTML = '';

        const totalPages = Math.ceil(allAnnouncementsData.length / ITEMS_PER_PAGE);

        // 常にページネーションを表示（ユーザー要望）

        const prevButton = createPaginationButton('prev', '前へ', currentPage > 1);
        paginationContainer.appendChild(prevButton);

        const maxPageButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

        if (endPage - startPage + 1 < maxPageButtons) {
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = createPaginationButton(i, i.toString(), i === currentPage);
            paginationContainer.appendChild(pageButton);
        }

        const nextButton = createPaginationButton('next', '次へ', currentPage < totalPages);
        paginationContainer.appendChild(nextButton);

        // 総ページ数を表示
        const pageInfo = document.createElement('span');
        pageInfo.classList.add('page-info');
        pageInfo.textContent = `全 ${totalPages} ページ`;
        paginationContainer.appendChild(pageInfo);
    }

    /**
     * ページネーションボタンを作成するヘルパー関数
     */
    function createPaginationButton(value, text, isEnabled) {
        const button = document.createElement('button');
        button.classList.add('pagination-button');
        button.textContent = text;
        button.dataset.page = value;

        if (typeof value === 'number') {
            if (value === currentPage) {
                button.classList.add('active');
                button.disabled = true;
            }
        } else {
            if (!isEnabled) {
                button.classList.add('disabled');
                button.disabled = true;
            }
        }
        return button;
    }

    /**
     * ページネーションボタンのクリックイベント
     */
    paginationContainer.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('.pagination-button');
        if (clickedButton && !clickedButton.disabled) {
            const pageValue = clickedButton.dataset.page;
            let newPage = currentPage;

            if (pageValue === 'prev') {
                newPage = Math.max(1, currentPage - 1);
            } else if (pageValue === 'next') {
                const totalPages = Math.ceil(allAnnouncementsData.length / ITEMS_PER_PAGE);
                newPage = Math.min(totalPages, currentPage + 1);
            } else {
                newPage = parseInt(pageValue, 10);
            }

            currentPage = newPage;
            renderAnnouncements();
            renderPagination();

            // ページ切り替え後にページの先頭に戻る
            window.scrollTo({
                top: 0,
            });
        }
    });
});
