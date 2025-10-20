document.addEventListener('DOMContentLoaded', () => {
    const announcementsList = document.getElementById('announcements-list');
    fetch('../../api/web_page/get_announcements_title.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // 新しい順に日付で並び替え
            const sortedData = data.sort((a, b) => {
                const dateA = new Date(a.date.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, '$1-$2-$3'));
                const dateB = new Date(b.date.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, '$1-$2-$3'));
                return dateB - dateA;
            });

            // 現在の日付から2週間前の日付を計算
            const currentDate = new Date();
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(currentDate.getDate() - 7);
            
            sortedData.forEach(item => {
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
                titleSpan.classList.add('announcement-title-text'); // クラス名を追加して識別しやすく
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
        })
        .catch(error => {
            console.error('お知らせの読み込みに失敗しました:', error);
            announcementsList.innerHTML = '<li>お知らせを読み込めませんでした。</li>';
        });
});