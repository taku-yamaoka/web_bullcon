<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *'); // CORS対策のため追加
header('Access-Control-Allow-Methods: GET');

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'web_page');
define('DB_USER', 'fuji23f6');
define('DB_PASS', 'fuji-buru-');
define('DB_PORT', '5432');

$tableName  = 'car_model_list';

$desiredMakerOrder = [
    'トヨタ',
    'レクサス',
    'ニッサン',
    'ホンダ',
    'ミツビシ',
    'スバル',
    'スズキ',
    'ダイハツ',
    'マツダ',
];

try {
    $dsn = 'pgsql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME;
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $sql = "SELECT * FROM $tableName";

    $stmt = $pdo->query($sql);
    $result = $stmt->fetchAll();

    $organizedData = [];

foreach ($result as $row) {
    // 必要なデータを抽出
    $makerName = $row['maker'] ?? '不明なメーカー';
    $modelName = $row['car_model'] ?? '不明な車種';
    
    $organizedData[$makerName][] = $modelName;
}

// sort() 関数を使用して、配列の値（車種名）を昇順（あいうえお順/A-Z順）でソート
foreach ($organizedData as &$modelNames) {
    sort($modelNames);
}
unset($modelNames);

// uksort() を使用して、キー（メーカー名）をカスタム比較関数でソートします。
$orderMap = array_flip($desiredMakerOrder);
uksort($organizedData, function ($keyA, $keyB) use ($orderMap) {
    // AとBがどちらも指定順に含まれている場合
    $orderA = $orderMap[$keyA] ?? null;
    $orderB = $orderMap[$keyB] ?? null;

    if ($orderA !== null && $orderB !== null) {
        // Spaceship演算子を使用して、定義した順番でソート
        return $orderA <=> $orderB;
    } 
    
    // Aだけが指定順に含まれている場合 (AをBより前にする)
    if ($orderA !== null) {
        return -1;
    }
    
    // Bだけが指定順に含まれている場合 (BをAより後にする)
    if ($orderB !== null) {
        return 1;
    }

    // どちらも指定順に含まれない場合（キー名で昇順ソート）
    return $keyA <=> $keyB;
});

// JSONオブジェクトを直接出力
echo json_encode($organizedData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
}
?>