<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *'); // CORS対策のため追加
header('Access-Control-Allow-Methods: GET');

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'web_page');
define('DB_USER', 'fuji23f6');
define('DB_PASS', 'fuji-buru-');
define('DB_PORT', '5432');

$tableNameList  = [
    'notes_tving',
    'notes_rearmonitor_vtr_hdmi',
    'notes_dvd_player',
    'notes_camera_selector',
    'notes_back_camera',
    'notes_steering_switch_controller'
];


try {
    $dsn = 'pgsql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME;
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $sql = getSql($tableNameList);


    $stmt = $pdo->query($sql);
    $result = $stmt->fetchAll();
    // 1. 配列の最初の要素（インデックス 0）を取得
    $first_result = $result[0];

    // 2. 'json_build_object' キーの値（JSON文字列）を取得
    //    ここで取得されるのは、PostgreSQLが出力した「生のJSON文字列」
    $json_string_value = $first_result['json_build_object'];

    // 3. JSON文字列をPHPの連想配列にデコード
    //    これで、テーブル名（'notes_tving'など）をキーとするPHP配列が得られる
    $organizedData = json_decode($json_string_value, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        die("エラー: JSONデコードに失敗しました - " . json_last_error_msg());
    }
    
    $retData = formatNoteStructure($organizedData);

    // JSONオブジェクトを直接出力
    echo json_encode($retData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
}

function getSql(array $tableNameList): string {
    $sql_parts = [];

    foreach ($tableNameList as $name) {
        $part = "
            '{$name}', (
                SELECT json_agg(t.*)
                FROM (
                    SELECT *
                    FROM \"public\".\"{$name}\"
                ) t
            )
        ";
        $sql_parts[] = $part;
    }

    $sql = "SELECT json_build_object(\n" . implode(",\n", $sql_parts) . "\n);";
    
    return $sql;
}

function formatNoteStructure($noteMap) {
    $retList = [];
    foreach ($noteMap as $tableName => $tableData) {
        $formatted_data = [
            'common' => []
        ];
        foreach ($tableData as $note) {
            $note_num = $note['note_num'];
            $content = $note['content'];
            
            if ($note_num === 0) {
                $formatted_data['common'][] = $content;
            } else {
                $formatted_data[(string)$note_num] = $content;
            }
        }
        $retList[$tableName] = $formatted_data;
    }
    return $retList;
}