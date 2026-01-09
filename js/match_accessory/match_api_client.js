// match_api_client.js
/**
 * 適合品番情報をAPIから取得する関数。
 * @param {string} apiUrl - api url
 * @param {object} params - APIに渡すクエリパラメータ。
 * @returns {Promise<object>} 適合品番データ。
 */
export async function getCompatibilityData(apiUrl, params) {
    let query;
    if (params) {
        const searchParams = new URLSearchParams(params).toString();
        query = `${apiUrl}?${searchParams}`;
    } else {
        query = `${apiUrl}`;
    }

    try {
        const response = await fetch(query, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        if (!response.ok) {
            throw new Error(`検索に失敗しました。ステータス: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API呼び出し中にエラーが発生しました:', error);
        throw error;
    }
}