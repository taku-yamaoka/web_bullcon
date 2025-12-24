<?php
/**
 * キャッシュ設定ファイル
 * 
 * このファイルでキャッシュの動作を一元管理します。
 * TTL（有効期限）やキャッシュディレクトリのパスなどを設定できます。
 */

return [
    // キャッシュ機能の有効/無効
    'enabled' => true,
    
    // キャッシュドライバー（現在はfileのみ対応）
    'driver' => 'file',
    
    // キャッシュファイルの保存先ディレクトリ
    'cache_dir' => __DIR__ . '/../../cache/web_page/',
    
    // 各エンドポイントのTTL設定（秒単位）
    'ttl' => [
        'car_model' => 86400,      // 24時間
        'monitor_list' => 86400,   // 24時間
        'note_list' => 86400,      // 24時間
        'announcements' => 3600,   // 1時間
        'compatibility' => 1800,   // 30分
    ],
    
    // キャッシュクリア用の認証トークン
    // 本番環境では必ず変更してください
    'clear_token' => 'fuji-buru',
    
    // 期限切れファイルの自動削除
    'auto_cleanup' => true,
    
    // クリーンアップの実行確率（100リクエストに1回）
    'cleanup_probability' => 100,
];
