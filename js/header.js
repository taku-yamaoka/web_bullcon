fetch('/html/_header.html') // TODO テスト用に差し替え中
    .then(response => {
        if (!response.ok) {
            // レスポンスが成功でなければエラーを投げる
            throw new Error('Failed to load header: ' + response.statusText);
        }
        return response.text();
    })
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;
    })
    .catch(error => {
        console.error('Error fetching header:', error);
        // エラー発生時の代替処理（例: エラーメッセージを表示）
        document.getElementById('header-placeholder').innerHTML = '<p>ヘッダーの読み込みに失敗しました。</p>';
    });
