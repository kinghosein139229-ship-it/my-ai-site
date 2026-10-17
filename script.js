// DOM Elements
const expressionDisplay = document.getElementById('expression-display');
const mainDisplay = document.getElementById('main-display');
const keys = document.querySelectorAll('.key');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// State
let currentInput = '0';
let expression = '';
let resetInputOnNextNumber = false;
let hasCalculated = false;

// Converter Elements
const convCategory = document.getElementById('conv-category');
const convFromUnit = document.getElementById('conv-from-unit');
const convToUnit = document.getElementById('conv-to-unit');
const convFromVal = document.getElementById('conv-from-val');
const convToVal = document.getElementById('conv-to-val');
const convSwapBtn = document.getElementById('conv-swap-btn');

// Units Data
const units = {
    length: {
        base: 'meters',
        items: {
            'millimeters': 0.001,
            'centimeters': 0.01,
            'meters': 1,
            'kilometers': 1000,
            'inches': 0.0254,
            'feet': 0.3048,
            'yards': 0.9144,
            'miles': 1609.34
        }
    },
    mass: {
        base: 'grams',
        items: {
            'milligrams': 0.001,
            'grams': 1,
            'kilograms': 1000,
            'ounces': 28.3495,
            'pounds': 453.592
        }
    },
    temperature: {
        base: 'celsius',
        items: {
            'celsius': 'C',
            'fahrenheit': 'F',
            'kelvin': 'K'
        }
    },
    data: {
        base: 'bytes',
        items: {
            'bytes': 1,
            'kilobytes': 1024,
            'megabytes': 1048576,
            'gigabytes': 1073741824,
            'terabytes': 1099511627776
        }
    }
};

// Event Listeners
keys.forEach(key => {
    key.addEventListener('click', () => handleKey(key));
});

document.addEventListener('keydown', handleKeyboard);

clearHistoryBtn.addEventListener('click', () => {
    historyList.innerHTML = '';
});

// Converter Listeners
convCategory.addEventListener('change', populateUnits);
convFromUnit.addEventListener('change', convert);
convToUnit.addEventListener('change', convert);
convFromVal.addEventListener('input', convert);

convSwapBtn.addEventListener('click', () => {
    const tempUnit = convFromUnit.value;
    convFromUnit.value = convToUnit.value;
    convToUnit.value = tempUnit;
    convert();
});

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// Logic
function handleKey(key) {
    const value = key.dataset.value;
    const action = key.dataset.action;

    if (key.classList.contains('number') || (!action && value)) {
        appendValue(value);
    } else if (key.classList.contains('operator')) {
        appendOperator(value);
    } else if (action) {
        handleAction(action, value);
    }
}

function appendValue(value) {
    if (hasCalculated) {
        currentInput = '0';
        expression = '';
        hasCalculated = false;
    }

    if (resetInputOnNextNumber) {
        currentInput = '0';
        resetInputOnNextNumber = false;
    }

    if (value === '(' || value === ')') {
        if (hasCalculated) {
            expression = value + ' ';
            currentInput = '0';
            hasCalculated = false;
        } else {
            // Append current input and parenthesis to expression if not 0
            if (currentInput !== '0' && value === '(') {
                expression += currentInput + ' * ' + value + ' ';
            } else if (currentInput !== '0' && value === ')') {
                expression += currentInput + ' ' + value + ' ';
            } else {
                expression += value + ' ';
            }
        }
        resetInputOnNextNumber = true;
    } else if (value === '.') {
        if (!currentInput.includes('.')) {
            currentInput += '.';
        }
    } else if (value === 'Math.PI') {
        currentInput = Math.PI.toString();
    } else if (value === 'Math.E') {
        currentInput = Math.E.toString();
    } else {
        if (currentInput === '0') {
            currentInput = value;
        } else {
            currentInput += value;
        }
    }
    updateDisplay();
}

function appendOperator(op) {
    if (hasCalculated) {
        expression = currentInput + ' ' + op + ' ';
        hasCalculated = false;
    } else {
        expression += currentInput + ' ' + op + ' ';
    }
    resetInputOnNextNumber = true;
    updateDisplay();
}

function handleAction(action, value) {
    switch (action) {
        case 'clear-all':
            currentInput = '0';
            expression = '';
            break;
        case 'clear-entry':
            currentInput = '0';
            break;
        case 'backspace':
            if (currentInput.length > 1) {
                currentInput = currentInput.slice(0, -1);
            } else {
                currentInput = '0';
            }
            break;
        case 'calculate':
            calculate();
            break;
        case 'sin':
        case 'cos':
        case 'tan':
        case 'log':
        case 'ln':
        case 'sqrt':
            handleScientific(action);
            break;
        case 'pow':
            appendOperator('**');
            break;
    }
    updateDisplay();
}

function handleScientific(func) {
    let value = parseFloat(currentInput);
    if (isNaN(value)) return;

    let result = 0;
    let exprStr = '';

    switch (func) {
        case 'sin':
            result = Math.sin(value);
            exprStr = `sin(${value})`;
            break;
        case 'cos':
            result = Math.cos(value);
            exprStr = `cos(${value})`;
            break;
        case 'tan':
            result = Math.tan(value);
            exprStr = `tan(${value})`;
            break;
        case 'log':
            result = Math.log10(value);
            exprStr = `log(${value})`;
            break;
        case 'ln':
            result = Math.log(value);
            exprStr = `ln(${value})`;
            break;
        case 'sqrt':
            result = Math.sqrt(value);
            exprStr = `√(${value})`;
            break;
    }

    // Format result safely
    result = parseFloat(result.toFixed(10)).toString();

    currentInput = result;

    if (hasCalculated || expression === '') {
        expression = exprStr + ' =';
        hasCalculated = true;
    } else {
        // If in middle of expression, just update input
        resetInputOnNextNumber = true;
    }
}

function calculate() {
    try {
        // Only append currentInput if we are not just evaluating parens logic
        let evalExpression = expression;
        if (!expression.endsWith(') ')) {
             evalExpression += currentInput;
        }

        // Replace math constants and operations for eval safely
        // This handles basic arithmetic right now
        let result = new Function('return ' + evalExpression)();

        // Format result to avoid floating point errors safely
        result = parseFloat(Number(result).toFixed(10)).toString();

        expression = evalExpression + ' =';

        // Add to history
        addToHistory(evalExpression, result);

        currentInput = result;
        hasCalculated = true;
        resetInputOnNextNumber = true;
    } catch (e) {
        currentInput = 'Error';
        hasCalculated = true;
        resetInputOnNextNumber = true;
    }
    updateDisplay();
}

function updateDisplay() {
    mainDisplay.value = currentInput;
    expressionDisplay.textContent = expression;
}

function addToHistory(expr, res) {
    const li = document.createElement('li');
    li.className = 'history-item';

    const exprDiv = document.createElement('div');
    exprDiv.className = 'history-expr';
    exprDiv.textContent = expr + ' =';

    const resDiv = document.createElement('div');
    resDiv.className = 'history-result';
    resDiv.textContent = res;

    li.appendChild(exprDiv);
    li.appendChild(resDiv);

    historyList.prepend(li);
}

// Keyboard Support
function handleKeyboard(e) {
    // Only handle if active tab is calculator and not typing in an input (except main display which is readonly)
    if (document.activeElement.tagName === 'INPUT' && document.activeElement.id !== 'main-display') return;

    const keyMap = {
        'Escape': 'clear-all',
        'Backspace': 'backspace',
        'Enter': 'calculate',
        '=': 'calculate'
    };

    if (/^\d$/.test(e.key) || e.key === '.' || e.key === '(' || e.key === ')') {
        appendValue(e.key);
    } else if (['+', '-', '*', '/'].includes(e.key)) {
        appendOperator(e.key);
    } else if (keyMap[e.key]) {
        e.preventDefault(); // Prevent default enter behavior
        handleAction(keyMap[e.key]);
    }
}

// Converter Logic
function populateUnits() {
    const category = convCategory.value;
    const items = Object.keys(units[category].items);

    convFromUnit.innerHTML = '';
    convToUnit.innerHTML = '';

    items.forEach(unit => {
        const option1 = document.createElement('option');
        option1.value = unit;
        option1.textContent = unit.charAt(0).toUpperCase() + unit.slice(1);
        convFromUnit.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = unit;
        option2.textContent = unit.charAt(0).toUpperCase() + unit.slice(1);
        convToUnit.appendChild(option2);
    });

    // Select different units by default
    if (items.length > 1) {
        convToUnit.selectedIndex = 1;
    }

    convert();
}

function convert() {
    const category = convCategory.value;
    const fromUnit = convFromUnit.value;
    const toUnit = convToUnit.value;
    const val = parseFloat(convFromVal.value);

    if (isNaN(val)) {
        convToVal.value = '';
        return;
    }

    let result = 0;

    if (category === 'temperature') {
        // Special logic for temp
        let celsius = 0;

        // Convert to Celsius first
        if (fromUnit === 'celsius') celsius = val;
        else if (fromUnit === 'fahrenheit') celsius = (val - 32) * 5 / 9;
        else if (fromUnit === 'kelvin') celsius = val - 273.15;

        // Convert from Celsius to Target
        if (toUnit === 'celsius') result = celsius;
        else if (toUnit === 'fahrenheit') result = (celsius * 9 / 5) + 32;
        else if (toUnit === 'kelvin') result = celsius + 273.15;

    } else {
        // Linear conversion via base unit
        const fromFactor = units[category].items[fromUnit];
        const toFactor = units[category].items[toUnit];

        const baseVal = val * fromFactor;
        result = baseVal / toFactor;
    }

    // Format to max 6 decimal places to avoid floating point issues safely
    result = parseFloat(result.toFixed(6));

    convToVal.value = result;
}

// Init Converter
populateUnits();
