<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// ファクトリークラスを読み込む
require_once './products_compatibility/product_search_factory.php';

// データベース接続設定
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'web_page');
define('DB_USER', 'fuji23f6');
define('DB_PASS', 'fuji-buru-');
define('DB_PORT', '5432');

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
    'product' => $_GET['product'] ?? '',
    'option' => $_GET['option'] ?? '',
    'directInput' => $_GET['directInput'] ?? '',
    'maker' => $_GET['maker'] ?? '',
    'model' => $_GET['model'] ?? '',
    'year' => $_GET['year'] ?? '',
    'month' => $_GET['month'] ?? '',
    'productCode' => $_GET['productCode'] ?? ($_GET['directInput'] ?? ''),
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