// match.js
// このスクリプトは、2つのWeb APIエンドポイントと連携することを想定しています。
// 1. 車種情報を取得するAPI (例: /api/cars_data.php)
// 2. 適合品番を検索するAPI (例: /api/search_parts.php)

// データベースから車種情報を取得するAPIのURL
const CARS_API_URL = 'http://127.0.0.1:5500/api/get_car_type.php';
// 適合品番を検索するAPIのURL
const PARTS_API_URL = 'your_parts_api_url';

// Web APIから車種情報を取得
const carsDataPromise = fetch(CARS_API_URL)
  .then(response => {
    // HTTPステータスコードが200番台以外の場合、エラーを投げる
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // レスポンスをまずテキストとして取得
    return response.text();
  })
  .then(text => {
    try {
        text = car_type; //TODO///////////////////////////////////////テスト用！！！！
      // テキストをJSONとして解析
      console.log(text);
      const data = JSON.parse(text);
      const makers = Object.values(data);
      console.log("データベースから取得したデータ:", data);
      return makers;
    } catch (e) {
      // JSON解析に失敗した場合、具体的なエラーとサーバーの応答内容を出力
      console.error('Error parsing JSON:', e);
      console.error('Server response:', text);
      document.getElementById('result').textContent = '車種情報の取得に失敗しました。サーバーの応答が不正です。';
      return null;
    }
  })
  .catch(error => {
    console.error('Error fetching car data:', error);
    document.getElementById('result').textContent = `車種情報の取得に失敗しました: ${error.message}`;
    return null;
  });

// フォームの選択肢を動的に生成する関数
function populateOptions(selectElement, options, emptyOptionText) {
  selectElement.innerHTML = `<option value="">${emptyOptionText}</option>`;
  options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option;
    opt.textContent = option;
    selectElement.appendChild(opt);
  });
}

// ページロード時にメーカーの選択肢を生成
document.addEventListener('DOMContentLoaded', async () => {
  const data = await carsDataPromise;
  if (data) {
    const makerNames = data.map(car => car.maker);
    const makerSelect = document.getElementById('maker-select');
    populateOptions(makerSelect, makerNames, 'メーカーを選択してください');
  }
});

// メーカー選択時のイベントリスナー
document.getElementById('maker-select').addEventListener('change', async (event) => {
  const selectedMaker = event.target.value;
  const data = await carsDataPromise;
  const modelSelect = document.getElementById('model-select');
  const yearSelect = document.getElementById('year-select');
  const modelNumberSelect = document.getElementById('model-number-select');
  const searchButton = document.getElementById('search-button');
  const resultDiv = document.getElementById('result');

  modelSelect.innerHTML = '<option value="">車種を選択してください</option>';
  yearSelect.innerHTML = '<option value="">年式を選択してください</option>';
  modelNumberSelect.innerHTML = '<option value="">型式を選択してください</option>';
  resultDiv.innerHTML = '';
  
  modelSelect.disabled = !selectedMaker;
  yearSelect.disabled = true;
  modelNumberSelect.disabled = true;
  searchButton.disabled = true;

  if (selectedMaker) {
    const selectedMakerData = data.find(car => car.maker === selectedMaker);
    const modelNames = selectedMakerData.models.map(model => model.name);
    populateOptions(modelSelect, modelNames, '車種を選択してください');
  }
});

// 車種選択時のイベントリスナー
document.getElementById('model-select').addEventListener('change', async (event) => {
  const selectedModelName = event.target.value;
  const selectedMaker = document.getElementById('maker-select').value;
  const data = await carsDataPromise;
  const yearSelect = document.getElementById('year-select');
  const modelNumberSelect = document.getElementById('model-number-select');
  const searchButton = document.getElementById('search-button');
  const resultDiv = document.getElementById('result');
  
  yearSelect.innerHTML = '<option value="">年式を選択してください</option>';
  modelNumberSelect.innerHTML = '<option value="">型式を選択してください</option>';
  resultDiv.innerHTML = '';
  
  yearSelect.disabled = !selectedModelName;
  modelNumberSelect.disabled = true;
  searchButton.disabled = true;

  if (selectedModelName) {
    const selectedMakerData = data.find(car => car.maker === selectedMaker);
    const selectedModel = selectedMakerData.models.find(model => model.name === selectedModelName);
    
    if (selectedModel) {
      const yearsArray = selectedModel.years;
      populateOptions(yearSelect, yearsArray, '年式を選択してください');
    }
  }
});

// 年式選択時のイベントリスナー
document.getElementById('year-select').addEventListener('change', async (event) => {
  const selectedYear = event.target.value;
  const selectedMaker = document.getElementById('maker-select').value;
  const selectedModelName = document.getElementById('model-select').value;
  const data = await carsDataPromise;
  const modelNumberSelect = document.getElementById('model-number-select');
  const searchButton = document.getElementById('search-button');
  const resultDiv = document.getElementById('result');

  modelNumberSelect.innerHTML = '<option value="">型式を選択してください</option>';
  resultDiv.innerHTML = '';

  modelNumberSelect.disabled = !selectedYear;
  searchButton.disabled = true;
  
  if (selectedYear) {
    const selectedMakerData = data.find(car => car.maker === selectedMaker);
    const selectedModel = selectedMakerData.models.find(model => model.name === selectedModelName);
    if (selectedModel) {
      const modelNumbersString = selectedModel.model_number;
      const modelNumbersArray = modelNumbersString
        .replace(/{|}|"/g, '')
        .split(',')
        .map(s => s.trim());
      populateOptions(modelNumberSelect, modelNumbersArray, '型式を選択してください');
    }
  }
});

// 型式選択時のイベントリスナー
document.getElementById('model-number-select').addEventListener('change', (event) => {
    const selectedModelNumber = event.target.value;
    const searchButton = document.getElementById('search-button');
    searchButton.disabled = !selectedModelNumber;
});

// 適合品番検索ボタンのイベントリスナー
document.getElementById('search-button').addEventListener('click', async () => {
  const selectedMaker = document.getElementById('maker-select').value;
  const selectedModelName = document.getElementById('model-select').value;
  const selectedYear = document.getElementById('year-select').value;
  const selectedModelNumber = document.getElementById('model-number-select').value;
  const resultDiv = document.getElementById('result');

  resultDiv.innerHTML = '<p>適合品番を検索中...</p>';

  try {
    const response = await fetch(`${PARTS_API_URL}?maker=${selectedMaker}&model=${selectedModelName}&year=${selectedYear}&model_number=${selectedModelNumber}`);
    if (!response.ok) {
      throw new Error(`検索に失敗しました。ステータス: ${response.status}`);
    }
    const partsData = await response.json();

    if (partsData.length > 0) {
      const resultHtml = partsData.map(part => `
        <div class="part-result">
          <p><strong>品番:</strong> ${part.part_number}</p>
          <p><strong>適合情報:</strong> ${part.description}</p>
        </div>
      `).join('');
      resultDiv.innerHTML = `<h3>適合品番が見つかりました</h3>${resultHtml}`;
      resultDiv.style.color = 'black';
    } else {
      resultDiv.innerHTML = '<p>お探しの条件に適合する品番は見つかりませんでした。</p>';
      resultDiv.style.color = 'orange';
    }
  } catch (error) {
    console.error('Search error:', error);
    resultDiv.innerHTML = `<p>検索中にエラーが発生しました: ${error.message}</p>`;
    resultDiv.style.color = 'red';
  }
});