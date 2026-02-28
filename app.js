// ==============================
// GTO Range Trainer - App Logic
// ==============================

(function () {
    'use strict';

    // ---- Constants ----
    const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const RANK_INDEX = {};
    RANKS.forEach((r, i) => RANK_INDEX[r] = i);

    // ---- State ----
    let rangeData = null;
    let currentMode = 'cash'; // 'cash' or 'tournament'
    let score = { excellent: 0, good: 0, wrong: 0, total: 0 };
    let currentQuiz = null;

    // ---- Mode Subtitles ----
    const MODE_SUBTITLES = {
        'cash': '6-Max Cash · 100bb · rake 5% 1.375bb cap · UTG,HJ 2BB · CO,BTN,SB 2.5BB',
        'tournament': 'Tournament · 8-Max · 100bb'
    };


    // ---- DOM refs ----
    const $ = id => document.getElementById(id);
    const categorySelect = $('category-select');
    const scenarioSelect = $('scenario-select');
    const borderlineToggle = $('borderline-toggle');
    const scoreDisplay = $('score-display');
    const resetBtn = $('reset-btn');
    const situationText = $('situation-text');
    const handText = $('hand-text');
    const answerButtons = $('answer-buttons');
    const resultArea = $('result-area');
    const resultMessage = $('result-message');
    const rangeGrid = $('range-grid');
    const nextBtn = $('next-btn');
    const quizArea = $('quiz-area');
    const subtitle = $('subtitle');
    const btnCash = $('mode-cash');
    const btnTournament = $('mode-tournament');


    // ==========================
    // Range Data Processing
    // ==========================

    /**
     * Builds a 13x13 grid object from structured range data.
     * Returns { grid[row][col]: { raise, call, fold } }
     */
    function buildGrid(scenarioData, category) {
        const grid = Array.from({ length: 13 }, () =>
            Array.from({ length: 13 }, () => ({ raise: 0, call: 0, fold: 100 }))
        );

        if (!scenarioData || !scenarioData.ranges) return grid;

        for (let hand in scenarioData.ranges) {
            const pos = handToGrid(hand);
            if (!pos) continue;

            const val = scenarioData.ranges[hand];
            if (category === 'rfi') {
                grid[pos.row][pos.col].raise = val;
                grid[pos.row][pos.col].fold = Math.max(0, 100 - val);
                grid[pos.row][pos.col].call = 0;
            } else if (category === 'bb_defense' || category === 'vs_open') {
                const r = val.raise || 0;
                const c = val.call || 0;
                grid[pos.row][pos.col].raise = r;
                grid[pos.row][pos.col].call = c;
                grid[pos.row][pos.col].fold = Math.max(0, 100 - r - c);
            }
        }
        return grid;
    }

    function handToGrid(hand) {
        const r1 = RANK_INDEX[hand[0]];
        const r2 = RANK_INDEX[hand[1]];
        if (r1 === undefined || r2 === undefined) return null;

        if (hand.length === 2) {
            return { row: r1, col: r1 };
        } else if (hand.length === 3) {
            const type = hand[2];
            if (type === 's') {
                return { row: Math.min(r1, r2), col: Math.max(r1, r2) };
            } else {
                return { row: Math.max(r1, r2), col: Math.min(r1, r2) };
            }
        }
        return null;
    }

    function gridToHand(row, col) {
        if (row === col) return RANKS[row] + RANKS[col];
        if (row < col) return RANKS[row] + RANKS[col] + 's';
        return RANKS[col] + RANKS[row] + 'o';
    }

    // ==========================
    // Quiz Engine
    // ==========================

    function getScenarios(category) {
        if (!rangeData || !rangeData[currentMode]) return [];
        const modeData = rangeData[currentMode];
        if (category === 'rfi') return modeData.open_ranges_rfi || [];
        if (category === 'bb_defense') return modeData.bb_defense_ranges || [];
        if (category === 'vs_open') return modeData.vs_open_ranges || [];
        return [];
    }


    function getScenarioLabel(scenario, category) {
        if (category === 'rfi') return `${scenario.position} RFI`;
        if (category === 'bb_defense' || category === 'vs_open') return scenario.scenario;
        return '';
    }

    function populateScenarios() {
        const category = categorySelect.value;
        const scenarios = getScenarios(category);
        scenarioSelect.innerHTML = '';

        const randomOpt = document.createElement('option');
        randomOpt.value = 'random';
        randomOpt.textContent = '🎲 ランダム';
        scenarioSelect.appendChild(randomOpt);

        scenarios.forEach((s, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = getScenarioLabel(s, category);
            scenarioSelect.appendChild(opt);
        });
    }

    function getAnswerOptions(category) {
        return [
            { label: 'Raise', value: 'raise', cssClass: 'raise' },
            { label: 'Call', value: 'call', cssClass: 'call' },
            { label: 'Fold', value: 'fold', cssClass: 'fold' }
        ];
    }

    function isBorderlineHand(row, col, grid) {
        const f = grid[row][col];
        // 1. Mixed strategy (not just one action has 100%)
        if (f.fold > 0 && f.fold < 100) return true;
        if (f.raise > 0 && f.raise < 100) return true;
        if (f.call > 0 && f.call < 100) return true;

        // 2. Pure Fold but has non-fold neighbors
        if (f.fold >= 100) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = row + dr;
                    const nc = col + dc;
                    if (nr >= 0 && nr < 13 && nc >= 0 && nc < 13) {
                        const nf = grid[nr][nc];
                        if (nf.raise > 0 || nf.call > 0) return true;
                    }
                }
            }
        }
        return false;
    }

    function generateQuiz() {
        const category = categorySelect.value;
        const scenarios = getScenarios(category);
        if (scenarios.length === 0) return;

        let scenarioIdx = scenarioSelect.value === 'random' ?
            Math.floor(Math.random() * scenarios.length) : parseInt(scenarioSelect.value);

        const scenario = scenarios[scenarioIdx];
        const grid = buildGrid(scenario, category);

        let candidates = [];
        if (borderlineToggle.checked) {
            for (let r = 0; r < 13; r++) {
                for (let c = 0; c < 13; c++) {
                    if (isBorderlineHand(r, c, grid)) {
                        candidates.push({ row: r, col: c });
                    }
                }
            }
        }

        let row, col;
        if (candidates.length > 0) {
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            row = pick.row;
            col = pick.col;
        } else {
            row = Math.floor(Math.random() * 13);
            col = Math.floor(Math.random() * 13);
        }

        const hand = gridToHand(row, col);
        const freqs = grid[row][col];

        // Correct action logic (simplified to 3 actions)
        const f = freqs;
        let bestAction = 'fold';
        let maxFreq = f.fold;

        if (f.raise > maxFreq) {
            maxFreq = f.raise;
            bestAction = 'raise';
        }
        if (f.call > maxFreq) {
            maxFreq = f.call;
            bestAction = 'call';
        }

        currentQuiz = { category, scenario, grid, row, col, hand, freqs, correctAction: bestAction };

        situationText.textContent = category === 'rfi' ?
            `${scenario.position} からオープン。このハンドは？` :
            category === 'bb_defense' ?
                `${scenario.scenario}。BBであなたのアクションは？` :
                `${scenario.scenario}。Open Raiseが来ました。あなたのアクションは？`;
        handText.textContent = hand;

        const options = getAnswerOptions(category);
        answerButtons.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'btn-answer ' + opt.cssClass;
            btn.textContent = opt.label;
            btn.onclick = () => handleAnswer(opt.value);
            answerButtons.appendChild(btn);
        });

        resultArea.classList.add('hidden');
        quizArea.style.display = '';
    }

    function handleAnswer(answer) {
        if (!currentQuiz) return;

        const f = currentQuiz.freqs;
        const chosenFreq = f[answer] || 0;

        // Find max frequency among all actions
        const maxFreq = Math.max(f.raise, f.call, f.fold);

        let resultType = 'wrong'; // ◎, ◯, ✕
        let resultMark = '✕';

        if (chosenFreq === maxFreq && chosenFreq > 0) {
            resultType = 'excellent';
            resultMark = '◎';
            score.excellent++;
        } else if (chosenFreq > 0) {
            resultType = 'good';
            resultMark = '◯';
            score.good++;
        } else {
            resultType = 'wrong';
            resultMark = '✕';
            score.wrong++;
        }

        score.total++;
        updateScore();

        const breakdown = `Raise: ${Math.round(f.raise)}%, Call: ${Math.round(f.call)}%, Fold: ${Math.round(f.fold)}%`;

        if (resultType === 'excellent') {
            resultMessage.textContent = `${resultMark} 正解！ (最善手) ${breakdown}`;
            resultMessage.className = 'result-message correct';
        } else if (resultType === 'good') {
            resultMessage.textContent = `${resultMark} 混合戦略の少数派！ ${breakdown}`;
            resultMessage.className = 'result-message borderline';
        } else {
            resultMessage.textContent = `${resultMark} 不正解。頻度0%のアクションです。(${breakdown})`;
            resultMessage.className = 'result-message wrong';
        }

        renderGrid(currentQuiz.grid, currentQuiz.row, currentQuiz.col);
        answerButtons.querySelectorAll('button').forEach(b => b.disabled = true);
        resultArea.classList.remove('hidden');
    }

    // ==========================
    // Grid Renderer
    // ==========================

    function renderGrid(grid, highlightRow, highlightCol) {
        rangeGrid.innerHTML = '';
        const corner = document.createElement('div');
        corner.className = 'grid-cell corner';
        rangeGrid.appendChild(corner);

        RANKS.forEach(r => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell header';
            cell.textContent = r;
            rangeGrid.appendChild(cell);
        });

        for (let row = 0; row < 13; row++) {
            const rowHeader = document.createElement('div');
            rowHeader.className = 'grid-cell header';
            rowHeader.textContent = RANKS[row];
            rangeGrid.appendChild(rowHeader);

            for (let col = 0; col < 13; col++) {
                const cell = document.createElement('div');
                const hand = gridToHand(row, col);
                const f = grid[row][col];
                cell.className = (row === highlightRow && col === highlightCol) ? 'grid-cell current-hand' : 'grid-cell';

                const raiseColor = 'var(--raise-bg)';
                const callColor = 'var(--call-bg)';
                const foldColor = 'var(--fold-bg)';

                if (f.raise >= 100) cell.style.background = raiseColor;
                else if (f.call >= 100) cell.style.background = callColor;
                else if (f.fold >= 100) cell.style.background = foldColor;
                else {
                    const stops = [];
                    if (f.raise > 0) stops.push(`${raiseColor} 0% ${Math.round(f.raise)}%`);
                    if (f.call > 0) stops.push(`${callColor} ${Math.round(f.raise)}% ${Math.round(f.raise + f.call)}%`);
                    if (f.fold > 0) stops.push(`${foldColor} ${Math.round(f.raise + f.call)}% 100%`);
                    cell.style.background = `linear-gradient(to right, ${stops.join(', ')})`;
                }
                cell.textContent = hand;
                cell.title = `${hand}: R:${Math.round(f.raise)}%, C:${Math.round(f.call)}%, F:${Math.round(f.fold)}%`;
                rangeGrid.appendChild(cell);
            }
        }
    }

    // ==========================
    // Init & Score
    // ==========================

    function updateScore() {
        const correctCount = score.excellent + score.good;
        const pct = score.total > 0 ? Math.round(correctCount / score.total * 100) : 0;
        scoreDisplay.innerHTML = `<span class="mark-excellent">◎</span>: ${score.excellent} | <span class="mark-good">◯</span>: ${score.good} | <span class="mark-wrong">✕</span>: ${score.wrong} &nbsp;&nbsp; (計: ${score.total}, 正解率: ${pct}%)`;
    }

    function init() {
        if (typeof RANGE_DATA === 'undefined') {
            return situationText.textContent = 'range-data.js 読み込みエラー';
        }
        rangeData = RANGE_DATA;
        populateScenarios();
        generateQuiz();
    }

    // ==========================
    // Event Listeners
    // ==========================

    categorySelect.addEventListener('change', () => {
        populateScenarios();
        generateQuiz();
    });

    scenarioSelect.addEventListener('change', () => {
        generateQuiz();
    });

    resetBtn.addEventListener('click', () => {
        score = { excellent: 0, good: 0, wrong: 0, total: 0 };
        updateScore();
        generateQuiz();
    });

    nextBtn.addEventListener('click', () => {
        generateQuiz();
    });

    function switchMode(mode) {
        if (currentMode === mode) return;
        currentMode = mode;

        // Update UI
        btnCash.classList.toggle('active', mode === 'cash');
        btnTournament.classList.toggle('active', mode === 'tournament');
        subtitle.textContent = MODE_SUBTITLES[mode];

        // Reset and refresh
        populateScenarios();
        generateQuiz();
    }

    btnCash.addEventListener('click', () => switchMode('cash'));
    btnTournament.addEventListener('click', () => switchMode('tournament'));

    borderlineToggle.addEventListener('change', () => {

        generateQuiz();
    });

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            if (!resultArea.classList.contains('hidden')) {
                e.preventDefault();
                generateQuiz();
            }
        }
    });

    init();
})();
