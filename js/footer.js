// フッターの読み込み
fetch('/html/_footer.html')
    .then(response => {
        if (!response.ok) {
            // レスポンスが成功でなければエラーを投げる
            throw new Error('Failed to load footer: ' + response.statusText);
        }
        return response.text();
    })
    .then(data => {
        document.getElementById('footer-placeholder').innerHTML = data;
    })
    .catch(error => {
        console.error('Error fetching footer:', error);
        // エラー発生時の代替処理
        document.getElementById('footer-placeholder').innerHTML = '<p>フッターの読み込みに失敗しました。</p>';
    });