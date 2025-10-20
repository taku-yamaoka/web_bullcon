<?php
header('Content-Type: application/json; charset=UTF-8');

// このPHPファイルからの相対パス
$directory = '../../html/news/announcements/';

// クエリパラメータから取得件数を取得。デフォルトは無制限
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : null;

// HTMLファイルのみを対象にファイルリストを取得
$files = glob($directory . '*.html');

$announcements = [];
foreach ($files as $file) {
    $content = file_get_contents($file);
    
    // <title>タグの内容を抽出
    if (preg_match('/<title>(.*?)<\/title>/', $content, $matches)) {
        $title = $matches[1];
        
        // 日付情報を抽出
        $date = null;
        if (preg_match('/<p class="announcement-date">(.*?)<\/p>/', $content, $date_matches)) {
            $date = $date_matches[1];
            $date = str_replace('公開日：', '', $date);
        }
        
        // -------------------------
        // **URLの生成ロジックを修正**
        // -------------------------
        // PHPファイルが置かれているパスを元に、正しいルート相対パスを生成
        $filePath = realpath($file);
        $documentRoot = realpath($_SERVER['DOCUMENT_ROOT']);
        if ($filePath !== false && $documentRoot !== false) {
            $url = '/' . ltrim(str_replace($documentRoot, '', $filePath), '/');
        } else {
            $url = 'URL_ERROR'; // エラー時の代替
        }
        
        $announcements[] = [
            'title' => $title,
            'url' => $url,
            'date' => $date
        ];
    }
}

// 日付で並び替え（新しい順）
usort($announcements, function($a, $b) {
    $dateA = preg_replace('/(\d{4})年(\d{1,2})月(\d{1,2})日/', '$1-$2-$3', $a['date']);
    $dateB = preg_replace('/(\d{4})年(\d{1,2})月(\d{1,2})日/', '$1-$2-$3', $b['date']);
    return strtotime($dateB) - strtotime($dateA);
});

// 指定された件数にデータを制限
if ($limit !== null && $limit > 0) {
    $announcements = array_slice($announcements, 0, $limit);
}

echo json_encode($announcements, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
