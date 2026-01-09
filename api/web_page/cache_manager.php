<?php
/**
 * CacheManager クラス
 * 
 * ファイルベースのキャッシュ管理を提供します。
 * Zenlogicなどのレンタルサーバー環境で動作します。
 */

class CacheManager {
    private static $config = null;
    private static $statsFile = null;
    private static $requestCount = 0;
    
    /**
     * 設定を読み込む
     */
    private static function loadConfig() {
        if (self::$config === null) {
            self::$config = require __DIR__ . '/cache_config.php';
            self::$statsFile = self::$config['cache_dir'] . '.cache_stats.json';
        }
        return self::$config;
    }
    
    /**
     * キャッシュディレクトリを初期化
     */
    private static function ensureCacheDir() {
        $config = self::loadConfig();
        $dir = $config['cache_dir'];
        
        if (!file_exists($dir)) {
            if (!mkdir($dir, 0755, true)) {
                error_log("Failed to create cache directory: $dir");
                return false;
            }
        }
        
        // .htaccess ファイルを作成してアクセス制限
        $htaccessPath = $dir . '.htaccess';
        if (!file_exists($htaccessPath)) {
            file_put_contents($htaccessPath, "Deny from all\n");
        }
        
        return true;
    }
    
    /**
     * キャッシュキーからファイルパスを生成
     */
    private static function getCacheFilePath($key) {
        $config = self::loadConfig();
        // ファイル名を安全にする
        $safeKey = preg_replace('/[^a-zA-Z0-9_-]/', '_', $key);
        return $config['cache_dir'] . $safeKey . '.json';
    }
    
    /**
     * キャッシュが期限切れかチェック
     */
    private static function isExpired($filePath, $ttl) {
        if (!file_exists($filePath)) {
            return true;
        }
        
        $fileTime = filemtime($filePath);
        $currentTime = time();
        
        return ($currentTime - $fileTime) > $ttl;
    }
    
    /**
     * 指定されたキャッシュタイプのTTLを取得
     */
    public static function getTTL($type) {
        $config = self::loadConfig();
        return $config['ttl'][$type] ?? 3600; // デフォルト1時間
    }
    
    /**
     * キャッシュからデータを取得
     * 
     * @param string $key キャッシュキー
     * @param int $ttl 有効期限（秒）
     * @return string|false キャッシュデータ、存在しない場合はfalse
     */
    public static function get($key, $ttl = 3600) {
        $config = self::loadConfig();
        
        if (!$config['enabled']) {
            return false;
        }
        
        $filePath = self::getCacheFilePath($key);
        
        if (self::isExpired($filePath, $ttl)) {
            self::recordStats($key, 'miss');
            return false;
        }
        
        $data = @file_get_contents($filePath);
        
        if ($data === false) {
            self::recordStats($key, 'miss');
            return false;
        }
        
        self::recordStats($key, 'hit');
        return $data;
    }
    
    /**
     * キャッシュにデータを保存
     * 
     * @param string $key キャッシュキー
     * @param string $data 保存するデータ
     * @param int $ttl 有効期限（秒）※現在は使用していないが将来の拡張用
     * @return bool 成功時true
     */
    public static function set($key, $data, $ttl = 3600) {
        $config = self::loadConfig();
        
        if (!$config['enabled']) {
            return false;
        }
        
        if (!self::ensureCacheDir()) {
            return false;
        }
        
        $filePath = self::getCacheFilePath($key);
        
        $result = @file_put_contents($filePath, $data, LOCK_EX);
        
        if ($result === false) {
            error_log("Failed to write cache file: $filePath");
            return false;
        }
        
        // 自動クリーンアップの実行判定
        if ($config['auto_cleanup']) {
            self::$requestCount++;
            if (self::$requestCount % $config['cleanup_probability'] === 0) {
                self::cleanup();
            }
        }
        
        return true;
    }
    
    /**
     * 特定のキャッシュを削除
     * 
     * @param string $key キャッシュキー
     * @return bool 成功時true
     */
    public static function delete($key) {
        $filePath = self::getCacheFilePath($key);
        
        if (file_exists($filePath)) {
            return @unlink($filePath);
        }
        
        return true;
    }
    
    /**
     * パターンに一致するキャッシュを削除
     * 
     * @param string|null $pattern パターン（nullの場合は全削除）
     * @return int 削除したファイル数
     */
    public static function clear($pattern = null) {
        $config = self::loadConfig();
        $dir = $config['cache_dir'];
        
        if (!is_dir($dir)) {
            return 0;
        }
        
        $count = 0;
        $files = glob($dir . '*.json');
        
        foreach ($files as $file) {
            $basename = basename($file);
            
            // .cache_stats.json は削除しない
            if ($basename === '.cache_stats.json') {
                continue;
            }
            
            if ($pattern === null || strpos($basename, $pattern) !== false) {
                if (@unlink($file)) {
                    $count++;
                }
            }
        }
        
        return $count;
    }
    
    /**
     * 期限切れのキャッシュファイルを削除
     * 
     * @return int 削除したファイル数
     */
    public static function cleanup() {
        $config = self::loadConfig();
        $dir = $config['cache_dir'];
        
        if (!is_dir($dir)) {
            return 0;
        }
        
        $count = 0;
        $files = glob($dir . '*.json');
        $currentTime = time();
        
        foreach ($files as $file) {
            $basename = basename($file);
            
            // .cache_stats.json は削除しない
            if ($basename === '.cache_stats.json') {
                continue;
            }
            
            // ファイル名からキャッシュタイプを推測してTTLを取得
            $ttl = 86400; // デフォルト24時間
            foreach ($config['ttl'] as $type => $typeTtl) {
                if (strpos($basename, $type) !== false) {
                    $ttl = $typeTtl;
                    break;
                }
            }
            
            if (self::isExpired($file, $ttl)) {
                if (@unlink($file)) {
                    $count++;
                }
            }
        }
        
        return $count;
    }
    
    /**
     * 統計情報を記録
     * 
     * @param string $key キャッシュキー
     * @param string $result 'hit' または 'miss'
     */
    private static function recordStats($key, $result) {
        $config = self::loadConfig();
        
        if (!self::ensureCacheDir()) {
            return;
        }
        
        $stats = [];
        if (file_exists(self::$statsFile)) {
            $data = @file_get_contents(self::$statsFile);
            if ($data !== false) {
                $stats = json_decode($data, true) ?? [];
            }
        }
        
        if (!isset($stats[$key])) {
            $stats[$key] = ['hits' => 0, 'misses' => 0];
        }
        
        if ($result === 'hit') {
            $stats[$key]['hits']++;
        } else {
            $stats[$key]['misses']++;
        }
        
        @file_put_contents(self::$statsFile, json_encode($stats, JSON_PRETTY_PRINT), LOCK_EX);
    }
    
    /**
     * 統計情報を取得
     * 
     * @return array 統計情報
     */
    public static function getStats() {
        if (!file_exists(self::$statsFile)) {
            return [];
        }
        
        $data = @file_get_contents(self::$statsFile);
        if ($data === false) {
            return [];
        }
        
        return json_decode($data, true) ?? [];
    }
    
    /**
     * キャッシュが有効かチェック
     * 
     * @return bool
     */
    public static function isEnabled() {
        $config = self::loadConfig();
        return $config['enabled'];
    }
}
