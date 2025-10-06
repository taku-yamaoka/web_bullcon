// form_ui.js
import { initializeAndGetCarModel, initializeAndGetMonitorNumber } from './match.js';
import { PRODUCTS_DATA, CAR_YEARS, BASIC_YEARS, MONTHS } from './data_mapper.js';

function populateOptions(selectElement, options, emptyOptionText) {
    if (!selectElement) {
        return;
    }
    selectElement.innerHTML = `<option value="">${emptyOptionText}</option>`;
    options.forEach(option => {
        const opt = document.createElement('option');
        if (typeof option === 'object' && option !== null) {
            opt.value = option.value;
            opt.textContent = option.text;
            if (option.value === 'unknown') {
                opt.classList.add('unknown-option');
            }
        } else {
            opt.value = option;
            opt.textContent = option;
        }
        selectElement.appendChild(opt);
    });
}

/**
 * 製品ごとの特定のフォーム要素を生成する関数
 * @param {HTMLElement} formContainer - フォームを挿入するコンテナ要素
 * @param {object} productInfo - 選択された製品の情報
 * @param {object} state - 現在のフォームの状態
 */
async function generateSpecificProductForm (formContainer, productInfo, state) {
    const { selectedOptionType, selectedMaker, selectedModel, selectedYear, selectedMonth, selectedProductCode } = state;

    const carModel = await initializeAndGetCarModel();
    const monitorList = await initializeAndGetMonitorNumber();

    /* オプションタイプ */
    let currentOptionType;
    if (productInfo.name === 'リアモニター出力ユニット' ||
        productInfo.name === 'カメラセレクター') {
            currentOptionType = 'maker';
    }
    else {
        const optionGroup = document.createElement('div');
        optionGroup.className = 'form-group';
        optionGroup.innerHTML = `
            <label>オプションタイプ</label>
            <div class="option-group">
                <input type="radio" id="maker-option" name="option-type" value="maker">
                <label for="maker-option">標準装備/メーカーオプション</label>
                <input type="radio" id="dealer-option" name="option-type" value="dealer">
                <label for="dealer-option">ディーラーオプション</label>
            </div>
        `;
        formContainer.appendChild(optionGroup);
        currentOptionType = selectedOptionType || 'maker';
        if (currentOptionType) {
            document.getElementById(`${currentOptionType}-option`).checked = true;
        }
    }
    
    const currentProcessType = productInfo.optionFlows[currentOptionType]?.processType;
    
    /* メーカータイプ */
    const makerGroup = document.createElement('div');
    makerGroup.className = 'form-group';
    makerGroup.innerHTML = `
        <label for="maker-select">メーカー</label>
        <select id="maker-select" class="form-select"></select>
    `;
    formContainer.appendChild(makerGroup);
    
    let makerOptions;
    if (currentOptionType === 'maker') {
        makerOptions = Object.keys(carModel);
    } else {
        makerOptions = Object.keys(monitorList);
    }
    populateOptions(document.getElementById('maker-select'), makerOptions, 'メーカーを選択してください');
    
    if (selectedMaker) {
        document.getElementById('maker-select').value = selectedMaker;
    }
    if (selectedMaker) {
        if (currentProcessType === 'maker_process') {
            const modelGroup = document.createElement('div');
            modelGroup.className = 'form-group';
            modelGroup.innerHTML = `
                <label for="model-select">車種</label>
                <select id="model-select" class="form-select"></select>
            `;
            formContainer.appendChild(modelGroup);
            const modelNames = carModel[selectedMaker];
            populateOptions(document.getElementById('model-select'), modelNames, '車種を選択してください');
            if (selectedModel) {
                document.getElementById('model-select').value = selectedModel;
            }
            
            if (selectedModel) {
                const yearMonthGroup = document.createElement('div');
                yearMonthGroup.className = 'form-group';
                yearMonthGroup.innerHTML = `
                    <label for="year-select">年式</label>
                    <div class="year-month-group">
                        <select id="year-select" class="form-select"></select>
                        <span>/</span>
                        <select id="month-select" class="form-select"></select>
                    </div>
                `;
                formContainer.appendChild(yearMonthGroup);
                populateOptions(document.getElementById('year-select'), CAR_YEARS, '年');
                populateOptions(document.getElementById('month-select'), MONTHS, '月');
                if (selectedYear) document.getElementById('year-select').value = selectedYear;
                if (selectedMonth) document.getElementById('month-select').value = selectedMonth;
            }
        } else if (currentProcessType === 'dealer_process') {
            const yearGroup = document.createElement('div');
            yearGroup.className = 'form-group';
            yearGroup.innerHTML = `
                <label for="year-select">モニターモデル年</label>
                <select id="year-select" class="form-select"></select>
            `;
            formContainer.appendChild(yearGroup);
            
            const availableYears = monitorList[selectedMaker] ? [...new Set(monitorList[selectedMaker].map(item => String(item.year)))] : [];
            
            const processedYears = BASIC_YEARS
                .filter(year => availableYears.includes(year.match(/\d{4}/)?.[0] || year))
                .map(year => {
                    const yearMatch = year.match(/\d{4}/);
                    return {
                        value: yearMatch ? yearMatch[0] : year,
                        text: year
                    };
                });
            
            populateOptions(document.getElementById('year-select'), [{ value: 'unknown', text: '【年式不明の方はこちら】' }, ...processedYears], '年');
            if (selectedYear) {
                document.getElementById('year-select').value = selectedYear;
            }
            
            if (selectedYear) {
                const productCodeGroup = document.createElement('div');
                productCodeGroup.className = 'form-group';
                productCodeGroup.innerHTML = `<label>モニター型番</label>`;
                
                if (selectedYear === 'unknown') {
                    const inputValue = selectedProductCode !== null ? selectedProductCode : '';
                    productCodeGroup.innerHTML += `
                        <input type="search" id="product-code-input" class="form-input" placeholder="モニター型番を入力" value="${inputValue}">
                        <ul id="product-code-suggestions" class="suggestions-list"></ul>
                    `;
                    formContainer.appendChild(productCodeGroup);
                } else {
                    const selectElement = document.createElement('select');
                    selectElement.id = 'product-code-select';
                    selectElement.className = 'form-select';
                    productCodeGroup.appendChild(selectElement);
                    formContainer.appendChild(productCodeGroup);
                    
                    const codes = monitorList[selectedMaker] || [];
                    const filteredCodes = codes
                        .filter(item => String(item.year) === selectedYear)
                        .map(item => item.product_code);
                    
                    populateOptions(selectElement, filteredCodes, '品番を選択してください');
                    if (selectedProductCode) {
                        selectElement.value = selectedProductCode;
                    }
                }
            }
        }
    }
}

/**
 * フォーム全体を動的に生成し、挿入する関数。
 * @param {string} containerId - フォームを挿入する要素のID。
 * @param {object} state - 現在のフォームの状態を保持するオブジェクト。
 */
export async function renderForm(containerId, state) {
    const { selectedProduct } = state;
    const formContainer = document.getElementById(containerId);
    if (!formContainer) {
        return;
    }

    formContainer.innerHTML = '';
    
    const productGroup = document.createElement('div');
    productGroup.className = 'form-group';
    productGroup.innerHTML = `
        <label for="product-select">製品名</label>
        <select id="product-select" class="form-select"></select>
    `;
    formContainer.appendChild(productGroup);

    const productNames = Object.values(PRODUCTS_DATA).map(p => p.name);
    populateOptions(document.getElementById('product-select'), productNames, '製品を選択してください');
    if (selectedProduct) {
        document.getElementById('product-select').value = selectedProduct;
    }

    const productInfo = Object.values(PRODUCTS_DATA).find(p => p.name === selectedProduct);
    
    if (productInfo) {
        await generateSpecificProductForm(formContainer, productInfo, state);
    }
    
    const searchButton = document.createElement('button');
    searchButton.id = 'search-button';
    searchButton.className = 'btn-primary';
    searchButton.textContent = '適合品番を検索';
    searchButton.disabled = !checkFieldsFilled(state, productInfo);
    formContainer.appendChild(searchButton);
}

// 入力完了をチェックする関数 (exportして外部から利用可能にする)
export function checkFieldsFilled(state, productInfo) {
    const { selectedProduct, selectedMaker, selectedModel, selectedYear, selectedMonth, selectedOptionType, selectedProductCode } = state;
    if (!productInfo) return false;

    const currentOptionType = selectedOptionType || 'maker';
    const processType = productInfo.optionFlows[currentOptionType]?.processType;

    if (processType === 'maker_process') {
        return selectedProduct && selectedMaker && selectedModel;
    } else if (processType === 'dealer_process') {
        if (selectedYear === 'unknown') {
            return selectedProduct && selectedMaker && selectedProductCode;
        } else {
            return selectedProduct && selectedMaker && selectedYear && selectedProductCode;
        }
    }
    return selectedProduct !== null;
}