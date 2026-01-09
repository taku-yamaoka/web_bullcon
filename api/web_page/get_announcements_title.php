<?php
header('Content-Type: application/json; charset=UTF-8');

if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    header('HTTP/1.1 403 Forbidden');
    exit;
}

// キャッシュマネージャーを読み込み
require_once __DIR__ . '/cache_manager.php';

// このPHPファイルからの相対パス
$directory = '../../html/news/announcements/';

// クエリパラメータから取得件数を取得。デフォルトは無制限
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : null;

// ディレクトリの状態を取得（ファイルの追加・更新・削除を検知）
$directoryMtime = 0;
$fileCount = 0;
if (is_dir($directory)) {
    $files = glob($directory . '*.html');
    $fileCount = count($files);
    foreach ($files as $file) {
        $mtime = filemtime($file);
        if ($mtime > $directoryMtime) {
            $directoryMtime = $mtime;
        }
    }
}

// キャッシュキーを生成（limitパラメータ、ファイル数、最終更新日時を含む）
// ファイル数を含めることで、削除時にもキャッシュが無効化される
$cacheKey = 'announcements_' . ($limit ?? 'all') . '_' . $fileCount . '_' . $directoryMtime;
$cacheTTL = CacheManager::getTTL('announcements');


// キャッシュから取得を試みる
$cachedData = CacheManager::get($cacheKey, $cacheTTL);
if ($cachedData !== false) {
    echo $cachedData;
    exit;
}

// HTMLファイルのみを対象にファイルリストを取得
$files = glob($directory . '*.html');

$announcements = [];
foreach ($files as $file) {
    // ファイル全体ではなく、先頭4KBのみ読み込む（タイトルと日付は上部にあるはず）
    $content = file_get_contents($file, false, null, 0, 4096);
    
    // <title>タグの内容を抽出
    if (preg_match('/<title>(.*?)<\/title>/', $content, $matches)) {
        $title = $matches[1];
        
        // 日付情報を抽出
        $date = null;
        $sortTimestamp = 0; // ソート用のタイムスタンプ初期値

        if (preg_match('/<p class="announcement-date">(.*?)<\/p>/', $content, $date_matches)) {
            $dateStr = $date_matches[1];
            $date = str_replace('公開日：', '', $dateStr);
            
            // ソート用にタイムスタンプを計算しておく
            // "YYYY年M月D日" 形式を想定
            if (preg_match('/(\d{4})年(\d{1,2})月(\d{1,2})日/', $date, $dMatches)) {
                 $sortTimestamp = mktime(0, 0, 0, $dMatches[2], $dMatches[3], $dMatches[1]);
            } else {
                 $sortTimestamp = strtotime($date); // フォールバック
            }
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
            'date' => $date,
            '_sort_ts' => $sortTimestamp // ソート用一次データ
        ];
    }
}

// 日付で並び替え（新しい順）
// 計算済みのタイムスタンプを使用して高速化
usort($announcements, function($a, $b) {
    // 降順
    return $b['_sort_ts'] - $a['_sort_ts'];
});

// 指定された件数にデータを制限
if ($limit !== null && $limit > 0) {
    $announcements = array_slice($announcements, 0, $limit);
}

// 出力前にソート用キーを削除
foreach ($announcements as &$item) {
    unset($item['_sort_ts']);
}
unset($item);

// JSONオブジェクトを生成
$jsonOutput = json_encode($announcements, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

// キャッシュに保存
CacheManager::set($cacheKey, $jsonOutput, $cacheTTL);

// 出力
echo $jsonOutput;
