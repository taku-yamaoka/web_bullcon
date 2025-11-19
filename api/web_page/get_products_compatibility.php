<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// ファクトリークラスを読み込む
require_once './products_compatibility/product_search_factory.php';

// データベース接続設定
$config = require __DIR__ . '/../../../../secret/hp_config.php'; //TODO: 本番環境では../を一つ抜く！！！
define('DB_HOST', $config['DB_HOST']);
define('DB_NAME', $config['DB_NAME']);
define('DB_USER', $config['DB_USER']);
define('DB_PASS', $config['DB_PASS']);
define('DB_PORT', $config['DB_PORT']);

$dsn = 'pgsql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME;

try {
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'データベース接続エラー: ' . $e->getMessage()]);
    exit;
}

// ユーザーからのGETパラメータを配列にまとめる
$params = [
    'product' => convertNullString($_GET['product'] ?? ''),
    'option' => convertNullString($_GET['option'] ?? ''),
    'directInput' => convertNullString($_GET['directInput'] ?? ''),
    'maker' => convertNullString($_GET['maker'] ?? ''),
    'model' => convertNullString($_GET['model'] ?? ''),
    'year' => convertNullString($_GET['year'] ?? ''),
    'month' => convertNullString($_GET['month'] ?? ''),
    'productCode' => convertNullString($_GET['productCode'] ?? ($_GET['directInput'] ?? '')),
];

try {
    // ファクトリーを使って適切な処理クラスのインスタンスを生成
    $searchProcessor = ProductSearchFactory::create($params['product'], $params['option'], $params);
    
    // SQLクエリとパラメータを取得し、データベースを実行
    $sql = $searchProcessor->getSql();
    $dbParams = $searchProcessor->getParams();
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($dbParams);
    $allPartsData = $stmt->fetchAll();

    // 後処理を実行
    $filteredData = $searchProcessor->postProcess($allPartsData);
    
    // フィルタリングされたデータをJSON形式で返す
    echo json_encode($filteredData);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

function convertNullString($value) {
    if ($value === 'null') {
        return null;
    }
    return $value;
}