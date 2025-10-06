<?php
// 処理クラスを読み込む
require_once './products_compatibility/product_search.php';

class ProductSearchFactory
{
    public static function create($product, $option, array $params)
    {
        if ($option === 'maker') {
            return new YearFuncProductsSearch(
                $product,
                $params['directInput'],
                $params['maker'], 
                $params['model'],
                $params['year'], 
                $params['month']
            );
        } elseif ($option === 'dealer') {
            return new ProductCodeFuncSearch(
                $product,
                $params['maker'], 
                $params['productCode']
            );
        }
        throw new Exception('無効な製品名またはオプションタイプです。');
    }
}