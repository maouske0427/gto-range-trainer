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
    let score = { correct: 0, total: 0 };
    let currentQuiz = null;

    // ---- DOM refs ----
    const $ = id => document.getElementById(id);
    const categorySelect = $('category-select');
    const scenarioSelect = $('scenario-select');
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

    // ==========================
    // Range Parser
    // ==========================

    /**
     * Parse a shorthand notation like "66+", "A2s+", "K8s-K6s", "AKo" etc.
     * Returns an array of hand strings in the format: "AKs", "AKo", "AA", etc.
     */
    function parseNotation(notation) {
        // Remove frequency/mixed annotations like "(mixed)", "(bluff)", "(low freq)" etc.
        const clean = notation.replace(/\([^)]*\)/g, '').trim();
        if (!clean) return [];

        const hands = [];

        // Pair with + (e.g. "66+")
        let m = clean.match(/^([AKQJT2-9]{1,2})\+$/);
        if (m && m[1].length <= 2 && m[1][0] === (m[1][1] || m[1][0])) {
            const rank = m[1][0];
            const idx = RANK_INDEX[rank];
            if (idx !== undefined) {
                for (let i = 0; i <= idx; i++) {
                    hands.push(RANKS[i] + RANKS[i]);
                }
                return hands;
            }
        }

        // Pair range (e.g. "33-22", "JJ-99")
        m = clean.match(/^([AKQJT2-9])\1-([AKQJT2-9])\2$/);
        if (m) {
            const startIdx = RANK_INDEX[m[1]];
            const endIdx = RANK_INDEX[m[2]];
            if (startIdx !== undefined && endIdx !== undefined) {
                const lo = Math.min(startIdx, endIdx);
                const hi = Math.max(startIdx, endIdx);
                for (let i = lo; i <= hi; i++) {
                    hands.push(RANKS[i] + RANKS[i]);
                }
                return hands;
            }
        }

        // Pair range with + at low end (e.g. "22+")
        m = clean.match(/^([AKQJT2-9])\1\+$/);
        if (m) {
            const idx = RANK_INDEX[m[1]];
            for (let i = 0; i <= idx; i++) {
                hands.push(RANKS[i] + RANKS[i]);
            }
            return hands;
        }

        // Single pair (e.g. "55")
        m = clean.match(/^([AKQJT2-9])\1$/);
        if (m) {
            hands.push(clean);
            return hands;
        }

        // Suited/Offsuit with + (e.g. "A2s+", "KTo+")
        m = clean.match(/^([AKQJT2-9])([AKQJT2-9])([so])\+$/);
        if (m) {
            const high = m[1];
            const lowStart = m[2];
            const type = m[3];
            const highIdx = RANK_INDEX[high];
            const lowIdx = RANK_INDEX[lowStart];
            // Go from lowStart up to (but not including high if suited, or high-1)
            for (let i = highIdx + 1; i <= lowIdx; i++) {
                hands.push(high + RANKS[i] + type);
            }
            return hands;
        }

        // Suited/Offsuit range (e.g. "K8s-K6s", "Q7s-Q2s", "K8o-K5o")
        m = clean.match(/^([AKQJT2-9])([AKQJT2-9])([so])-([AKQJT2-9])([AKQJT2-9])([so])$/);
        if (m && m[1] === m[4] && m[3] === m[6]) {
            const high = m[1];
            const type = m[3];
            const startIdx = RANK_INDEX[m[2]];
            const endIdx = RANK_INDEX[m[5]];
            const lo = Math.min(startIdx, endIdx);
            const hi = Math.max(startIdx, endIdx);
            for (let i = lo; i <= hi; i++) {
                hands.push(high + RANKS[i] + type);
            }
            return hands;
        }

        // Offsuit range of broadways (e.g. "AQo-ATo")
        // Already covered by above pattern

        // Single hand (e.g. "AKo", "T9s", "KQs")
        m = clean.match(/^([AKQJT2-9])([AKQJT2-9])([so]?)$/);
        if (m) {
            const h = m[1];
            const l = m[2];
            const t = m[3] || '';
            if (h !== l) {
                if (t) {
                    hands.push(h + l + t);
                } else {
                    // No type specified - if it's like "AK" it could be both
                    hands.push(h + l + 's');
                    hands.push(h + l + 'o');
                }
            } else {
                hands.push(h + l);
            }
            return hands;
        }

        // Offsuit with + (e.g. "A2o+")
        m = clean.match(/^([AKQJT2-9])([AKQJT2-9])o\+$/);
        if (m) {
            const high = m[1];
            const lowStart = m[2];
            const highIdx = RANK_INDEX[high];
            const lowIdx = RANK_INDEX[lowStart];
            for (let i = highIdx + 1; i <= lowIdx; i++) {
                hands.push(high + RANKS[i] + 'o');
            }
            return hands;
        }

        return hands;
    }

    /**
     * Builds a 13x13 grid object from range data.
     * Returns { grid[row][col]: 'raise'|'mixed'|'call'|'fold'|'check'|'4bet'|'4bet_bluff'|null }
     */
    function buildGrid(scenarioData, category) {
        const grid = Array.from({ length: 13 }, () => Array(13).fill(null));

        function markHands(notations, action) {
            if (!notations) return;
            notations.forEach(notation => {
                const hands = parseNotation(notation);
                hands.forEach(hand => {
                    const pos = handToGrid(hand);
                    if (pos) {
                        // Don't overwrite higher priority actions
                        const current = grid[pos.row][pos.col];
                        if (!current || actionPriority(action) > actionPriority(current)) {
                            grid[pos.row][pos.col] = action;
                        }
                    }
                });
            });
        }

        const summary = scenarioData.range_summary || scenarioData.strategy_summary;
        if (!summary) return grid;

        if (category === 'rfi') {
            markHands(summary.pure_raise, 'raise');
            markHands(summary.mixed_raise, 'mixed');
        } else if (category === 'bb_defense') {
            // 3bet
            markHands(summary['3bet_value'], 'raise');
            markHands(summary['3bet_bluff'], 'raise');
            markHands(summary['3bet_range'], 'raise');
            // call
            markHands(summary['pure_call'], 'call');
            markHands(summary['call_range'], 'call');
            // iso raise (vs limp)
            markHands(summary['iso_raise_value'], 'raise');
            markHands(summary['iso_raise_bluff'], 'mixed');
            // check (vs limp)
            markHands(summary['check_range'], 'check');
        } else if (category === 'vs_3bet') {
            markHands(summary['4bet_value'], 'raise');
            markHands(summary['4bet_bluff'], 'mixed');
            markHands(summary['call'], 'call');
            // fold is implicit (everything else)
        }

        return grid;
    }

    function actionPriority(action) {
        const priorities = { raise: 5, '4bet': 5, mixed: 4, '4bet_bluff': 4, call: 3, check: 2, fold: 1 };
        return priorities[action] || 0;
    }

    /**
     * Convert hand notation to grid position.
     * Row = first rank, Col = second rank.
     * Suited hands: row < col (upper triangle)
     * Offsuit hands: row > col (lower triangle)
     * Pairs: row === col (diagonal)
     */
    function handToGrid(hand) {
        if (hand.length === 2) {
            // Pair
            const idx = RANK_INDEX[hand[0]];
            if (idx !== undefined) return { row: idx, col: idx };
        } else if (hand.length === 3) {
            const r1 = RANK_INDEX[hand[0]];
            const r2 = RANK_INDEX[hand[1]];
            const type = hand[2];
            if (r1 !== undefined && r2 !== undefined) {
                if (type === 's') {
                    // Suited: higher rank as row, lower as col (upper-right triangle)
                    return { row: Math.min(r1, r2), col: Math.max(r1, r2) };
                } else {
                    // Offsuit: lower-left triangle
                    return { row: Math.max(r1, r2), col: Math.min(r1, r2) };
                }
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
        if (!rangeData) return [];
        if (category === 'rfi') return rangeData.open_ranges_rfi || [];
        if (category === 'bb_defense') return rangeData.bb_defense_ranges || [];
        if (category === 'vs_3bet') return rangeData.vs_3bet_ranges || [];
        return [];
    }

    function getScenarioLabel(scenario, category) {
        if (category === 'rfi') return scenario.position + ' RFI (' + scenario.action + ')';
        if (category === 'bb_defense') return scenario.scenario;
        if (category === 'vs_3bet') return scenario.scenario;
        return '';
    }

    function populateScenarios() {
        const category = categorySelect.value;
        const scenarios = getScenarios(category);
        scenarioSelect.innerHTML = '';

        // Add "ランダム" option
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

    function getAnswerOptions(category, scenarioData) {
        if (category === 'rfi') {
            return [
                { label: 'Raise', value: 'raise', cssClass: 'raise' },
                { label: 'Fold', value: 'fold', cssClass: 'fold' }
            ];
        }
        if (category === 'bb_defense') {
            const summary = scenarioData.strategy_summary;
            // Check if this is a vs limp scenario
            if (summary.iso_raise_value || summary.check_range) {
                return [
                    { label: 'Raise', value: 'raise', cssClass: 'raise' },
                    { label: 'Check', value: 'check', cssClass: 'check' },
                ];
            }
            return [
                { label: '3Bet', value: 'raise', cssClass: 'raise' },
                { label: 'Call', value: 'call', cssClass: 'call' },
                { label: 'Fold', value: 'fold', cssClass: 'fold' }
            ];
        }
        if (category === 'vs_3bet') {
            return [
                { label: '4Bet', value: 'raise', cssClass: 'raise' },
                { label: 'Call', value: 'call', cssClass: 'call' },
                { label: 'Fold', value: 'fold', cssClass: 'fold' }
            ];
        }
        return [];
    }

    function getCorrectAction(grid, row, col, category) {
        const action = grid[row][col];
        if (!action) {
            // No action = fold (for rfi and vs_3bet)
            if (category === 'bb_defense') return 'fold';
            return 'fold';
        }
        if (action === 'raise' || action === '4bet') return 'raise';
        if (action === 'mixed' || action === '4bet_bluff') return 'raise'; // mixed is still raise
        if (action === 'call') return 'call';
        if (action === 'check') return 'check';
        return 'fold';
    }

    function generateQuiz() {
        const category = categorySelect.value;
        const scenarios = getScenarios(category);
        if (scenarios.length === 0) return;

        let scenarioIdx;
        if (scenarioSelect.value === 'random') {
            scenarioIdx = Math.floor(Math.random() * scenarios.length);
        } else {
            scenarioIdx = parseInt(scenarioSelect.value);
        }

        const scenario = scenarios[scenarioIdx];
        const grid = buildGrid(scenario, category);

        // Pick a random hand
        const row = Math.floor(Math.random() * 13);
        const col = Math.floor(Math.random() * 13);
        const hand = gridToHand(row, col);
        const correctAction = getCorrectAction(grid, row, col, category);

        currentQuiz = {
            category,
            scenario,
            scenarioIdx,
            grid,
            row,
            col,
            hand,
            correctAction
        };

        // Display question
        let sitText = '';
        if (category === 'rfi') {
            sitText = `${scenario.position} からオープン。このハンドは？`;
        } else if (category === 'bb_defense') {
            const summary = scenario.strategy_summary;
            if (summary.iso_raise_value || summary.check_range) {
                sitText = `${scenario.scenario}。BBであなたのアクションは？`;
            } else {
                sitText = `${scenario.scenario}。BBであなたのアクションは？`;
            }
        } else if (category === 'vs_3bet') {
            sitText = `${scenario.hero_position} でオープン後、3Betされた。あなたのアクションは？`;
        }

        situationText.textContent = sitText;
        handText.textContent = hand;

        // Answer buttons
        const options = getAnswerOptions(category, scenario);
        answerButtons.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'btn-answer ' + opt.cssClass;
            btn.textContent = opt.label;
            btn.addEventListener('click', () => handleAnswer(opt.value));
            answerButtons.appendChild(btn);
        });

        // Hide result, show quiz
        resultArea.classList.add('hidden');
        quizArea.style.display = '';
    }

    function handleAnswer(answer) {
        if (!currentQuiz) return;

        const isCorrect = answer === currentQuiz.correctAction;
        score.total++;
        if (isCorrect) score.correct++;

        updateScore();

        // Show result
        const correctLabel = getActionLabel(currentQuiz.correctAction, currentQuiz.category);
        if (isCorrect) {
            resultMessage.textContent = `⭕ 正解！ ${currentQuiz.hand} は ${correctLabel}`;
            resultMessage.className = 'result-message correct';
        } else {
            resultMessage.textContent = `❌ 不正解。${currentQuiz.hand} は ${correctLabel}`;
            resultMessage.className = 'result-message wrong';
        }

        // Render grid
        renderGrid(currentQuiz.grid, currentQuiz.row, currentQuiz.col, currentQuiz.category);

        // Disable answer buttons
        answerButtons.querySelectorAll('button').forEach(b => b.disabled = true);

        resultArea.classList.remove('hidden');
    }

    function getActionLabel(action, category) {
        if (category === 'rfi') {
            if (action === 'raise') return 'Raise';
            return 'Fold';
        }
        if (category === 'bb_defense') {
            if (action === 'raise') return '3Bet / Raise';
            if (action === 'call') return 'Call';
            if (action === 'check') return 'Check';
            return 'Fold';
        }
        if (category === 'vs_3bet') {
            if (action === 'raise') return '4Bet';
            if (action === 'call') return 'Call';
            return 'Fold';
        }
        return action;
    }

    // ==========================
    // Grid Renderer
    // ==========================

    function renderGrid(grid, highlightRow, highlightCol, category) {
        rangeGrid.innerHTML = '';

        // Corner cell
        const corner = document.createElement('div');
        corner.className = 'grid-cell corner';
        rangeGrid.appendChild(corner);

        // Header row
        RANKS.forEach(r => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell header';
            cell.textContent = r;
            rangeGrid.appendChild(cell);
        });

        // Grid body
        for (let row = 0; row < 13; row++) {
            // Row header
            const rowHeader = document.createElement('div');
            rowHeader.className = 'grid-cell header';
            rowHeader.textContent = RANKS[row];
            rangeGrid.appendChild(rowHeader);

            for (let col = 0; col < 13; col++) {
                const cell = document.createElement('div');
                const hand = gridToHand(row, col);
                const action = grid[row][col];

                let cls = 'grid-cell';
                if (action === 'raise' || action === '4bet') {
                    cls += ' raise-pure';
                } else if (action === 'mixed' || action === '4bet_bluff') {
                    cls += ' raise-mixed';
                } else if (action === 'call') {
                    cls += ' call-action';
                } else if (action === 'check') {
                    cls += ' check-action';
                } else {
                    // fold or unassigned
                    if (category === 'vs_3bet' || category === 'bb_defense') {
                        cls += ' fold-action';
                    }
                }

                if (row === highlightRow && col === highlightCol) {
                    cls += ' current-hand';
                }

                cell.className = cls;
                cell.textContent = hand;
                cell.title = hand + ': ' + (action || 'fold');
                rangeGrid.appendChild(cell);
            }
        }
    }

    // ==========================
    // Score
    // ==========================

    function updateScore() {
        const pct = score.total > 0 ? Math.round(score.correct / score.total * 100) : 0;
        scoreDisplay.textContent = `正解: ${score.correct} / ${score.total} (${pct}%)`;
    }

    // ==========================
    // Init
    // ==========================

    function init() {
        if (typeof RANGE_DATA === 'undefined') {
            situationText.textContent = 'range-data.js の読み込みに失敗しました。';
            handText.textContent = '⚠️';
            return;
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
        score = { correct: 0, total: 0 };
        updateScore();
        generateQuiz();
    });

    nextBtn.addEventListener('click', () => {
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
