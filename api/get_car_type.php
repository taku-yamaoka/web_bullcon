<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *'); // CORS対策のため追加
header('Access-Control-Allow-Methods: GET');

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'car_type');
define('DB_USER', 'fuji23f6');
define('DB_PASS', 'fuji-buru-');
define('DB_PORT', '5432');

try {
    $dsn = 'pgsql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME;
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $sql = "
        SELECT
            m.name AS maker_name,
            md.name AS model_name,
            md.model_number,
            y.year_jp
        FROM makers AS m
        INNER JOIN models AS md ON m.id = md.maker_id
        INNER JOIN years AS y ON md.id = y.model_id
        ORDER BY m.id, md.id;
    ";

    $stmt = $pdo->query($sql);
    $result = $stmt->fetchAll();

    $organized_data = [];

foreach ($result as $row) {
    $makerName = $row['maker_name'];
    $modelName = $row['model_name'];
    $modelNumber = $row['model_number'];

    // データベースから返ってきた文字列をカンマ区切りで配列に分割し、
    // 前後のブレース {} とダブルクォーテーション " を取り除く
    $yearString = trim($row['year_jp'], '{}');
    $years = explode(',', $yearString);
    $years = array_map(function($year) {
        return trim($year, '"');
    }, $years);

    // メーカーが存在しない場合は新しいエントリーを作成
    if (!isset($organized_data[$makerName])) {
        $organized_data[$makerName] = [
            'maker' => $makerName,
            'models' => []
        ];
    }

    $foundModel = false;
    foreach ($organized_data[$makerName]['models'] as &$model) {
        if ($model['name'] === $modelName) {
            // 年式を直接配列に追加
            $model['years'] = array_merge($model['years'], $years);
            $foundModel = true;
            break;
        }
    }
    unset($model);

    // 新しい車種の場合は追加
    if (!$foundModel) {
        $organized_data[$makerName]['models'][] = [
            'name' => $modelName,
            'model_number' => $modelNumber,
            'years' => $years
        ];
    }
}

// JSONオブジェクトを直接出力
echo json_encode($organized_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
}
?>