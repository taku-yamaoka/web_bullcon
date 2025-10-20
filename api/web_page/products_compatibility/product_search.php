<?php
// ProductSearchInterfaceを読み込む
require_once './products_compatibility/product_search_interface.php';

class YearFuncProductsSearch implements ProductSearchInterface
{
    private $dbTableName;
    private $directInput;
    private $maker;
    private $model;
    private $userDateTimestamp;

    private $productToTableMap = [
        'televing' => 'televing_maker',
        'magicone_bk_un' => 'magicone_bk_un_maker',
        'magicone_bk_ha' => 'magicone_bk_ha_maker',
        'magicone_rm_un' => 'magicone_rm_un_maker',
        'magicone_rm_ha' => 'magicone_rm_ha_maker',
        'magicone_vtr_hdmi' => 'magicone_vtr_hdmi_maker',
        'camera_selector' => 'camera_selector',
        'steering_swt_ctrl' => 'steering_switch_controller',
        'dvd_cd_player' => 'dvd_cd_player',
    ];

    public function __construct($product, $directInput, $maker, $model, $year, $month)
    {
        if (!isset($this->productToTableMap[$product]) || $this->productToTableMap[$product] === '') {
            throw new \InvalidArgumentException("無効な製品名またはテーブルが未定義です: " . $product);
        }
        $this->dbTableName = $this->productToTableMap[$product];
        $this->directInput = $directInput;
        $this->maker = $maker;
        $this->model = $model;
        $this->userDateTimestamp = strtotime("{$year}-{$month}-01");
    }

    public function getSql(): string
    {
        if($this->directInput) {
            return "SELECT * FROM $this->dbTableName WHERE model_number LIKE ?"; // 型式直接入力の場合
        } else {
            return "SELECT * FROM $this->dbTableName WHERE maker = ? AND car_model LIKE ?";
        }
    }

    public function getParams(): array
    {
        if($this->directInput) {
            return ["%{$this->directInput}%"];
        } else {
            return [$this->maker, "{$this->model}%"];
        }
    }

    public function postProcess(array $data): array
    {
        if ($this->userDateTimestamp === false) {
            return $data; // 年月がclientから送信されなかった場合は、全データを返却する
        }

        $filteredData = [];
        foreach ($data as $item) {
            $startDate = $item['start_date'] ?? '';
            $endDate = $item['end_date'] ?? '';

            if ($this->isDateMatch($startDate, $endDate)) {
                $filteredData[] = $item;
            }
        }
        return $filteredData;
    }

    private function isDateMatch($startDateString, $endDateString): bool
    {
        $startDate = $startDateString ? strtotime($startDateString) : false;
        $endDate = $endDateString ? strtotime("last day of {$endDateString}") : false;

        if ($startDate && $endDate) {
            return $this->userDateTimestamp >= $startDate && $this->userDateTimestamp <= $endDate;
        }
        if ($startDate) {
            return $this->userDateTimestamp >= $startDate;
        }
        if ($endDate) {
            return $this->userDateTimestamp <= $endDate;
        }
        return false;
    }
}

class ProductCodeFuncSearch implements ProductSearchInterface
{
    private $dbTableName;
    private $maker;
    private $productCode;

    private $productToTableMap = [
        'televing' => 'televing_dealer',
        'magicone_bk_un' => 'magicone_bk_un_dealer',
        'magicone_bk_ha' => 'magicone_bk_ha_dealer',
        'magicone_rm_ha' => 'magicone_rm_ha_dealer',
        'magicone_vtr_hdmi' => 'magicone_vtr_hdmi_dealer'
    ];

    public function __construct($product, $maker, $productCode)
    {
        if (!isset($this->productToTableMap[$product]) || $this->productToTableMap[$product] === '') {
            throw new \InvalidArgumentException("無効な製品名またはテーブルが未定義です: " . $product);
        }
        $this->dbTableName = $this->productToTableMap[$product];
        $this->maker = $maker;
        $this->productCode = $productCode;
    }

    public function getSql(): string
    {
        if ($this->maker) {
            return "SELECT * FROM $this->dbTableName WHERE maker = ? AND monitor_number LIKE ?";
        } else {
            return "SELECT * FROM $this->dbTableName WHERE monitor_number LIKE ?";
        }
    }

    public function getParams(): array
    {
        if ($this->maker) {
            return [$this->maker, "{$this->productCode}%"];
        } else {
            return ["%{$this->productCode}%"];
        }
        
    }

    public function postProcess(array $data): array
    {
        // ディーラーオプションの場合はフィルタリング不要
        return $data;
    }
}