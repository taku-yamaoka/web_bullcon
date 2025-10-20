<?php

interface ProductSearchInterface
{
    /**
     * SQLクエリを返します。
     * @return string
     */
    public function getSql(): string;

    /**
     * SQLクエリのパラメータを返します。
     * @return array
     */
    public function getParams(): array;

    /**
     * データベースから取得したデータを後処理します。
     * @param array $data
     * @return array
     */
    public function postProcess(array $data): array;
}