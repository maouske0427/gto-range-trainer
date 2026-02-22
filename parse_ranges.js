const fs = require('fs');

function parseRanges() {
    const content = fs.readFileSync('range.txt', 'utf8');
    const lines = content.split('\n');

    const data = {
        open_ranges_rfi: [],
        bb_defense_ranges: []
    };

    let currentCategory = null; // 'rfi' or 'bb_defense'
    let currentPosition = null;
    let currentOpponent = null;
    let currentAction = null; // 'call' or 'raise'

    const posMap = {
        'UTG': 'UTG',
        'HJ': 'HJ',
        'CO': 'CO',
        'BTN': 'BTN',
        'SB': 'SB'
    };

    const scenarios = {}; // temporary storage for building BB defense

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Section Headers
        if (line.startsWith('### ')) {
            const title = line.substring(4).toLowerCase();
            if (title.includes('open')) {
                currentCategory = 'rfi';
                currentPosition = title.split(' ')[0].toUpperCase();
            } else if (title.includes('bb defence')) {
                currentCategory = 'bb_defense';
            }
        } else if (line.startsWith('#### vs ')) {
            currentOpponent = line.substring(8).toUpperCase();
        } else if (line.startsWith('##### ')) {
            currentAction = line.substring(6).toLowerCase();
        } else {
            // It's a data line
            const freqMap = extractFrequencies(line);
            const aggregated = aggregateHands(freqMap);

            if (currentCategory === 'rfi') {
                data.open_ranges_rfi.push({
                    position: currentPosition,
                    action: 'Raise',
                    ranges: aggregated
                });
            } else if (currentCategory === 'bb_defense') {
                const key = `BB vs ${currentOpponent}`;
                if (!scenarios[key]) {
                    scenarios[key] = {
                        scenario: key,
                        opponent_action: `${currentOpponent} Raise`,
                        ranges: {}
                    };
                }
                // Merge into ranges[hand][action] = freq
                for (let hand in aggregated) {
                    if (!scenarios[key].ranges[hand]) scenarios[key].ranges[hand] = {};
                    scenarios[key].ranges[hand][currentAction] = aggregated[hand];
                }
            }
        }
    }

    data.bb_defense_ranges = Object.values(scenarios);

    // Write to ranges_master.json (Generic format)
    fs.writeFileSync('ranges_master.json', JSON.stringify(data, null, 4));
    console.log('Successfully generated ranges_master.json');

    // Write to range-data.js (Browser compatibility)
    const output = `// GTO Range Data (Parsed from range.txt)\nconst RANGE_DATA = ${JSON.stringify({
        poker_strategy: {
            game_format: "6-Max Cash",
            stack_depth: "100bb"
        },
        ...data
    }, null, 4)};\n`;

    fs.writeFileSync('range-data.js', output);
    console.log('Successfully generated range-data.js');
}

function extractFrequencies(line) {
    const combos = {};
    const bracketRegex = /\[([\d.]+)\](.*?)\[\/\1\]/g;
    let match;
    let lastLine = line;

    while ((match = bracketRegex.exec(line)) !== null) {
        const freq = parseFloat(match[1]);
        const hands = match[2].split(/,\s*/).map(h => h.trim()).filter(h => h);
        hands.forEach(h => {
            combos[h] = freq;
        });
        // Replace processed part to find remaining plain combos
        lastLine = lastLine.replace(match[0], '');
    }

    // Process remaining plain combos (100% freq)
    const remaining = lastLine.split(/,\s*/);
    remaining.forEach(p => {
        const h = p.trim().replace(/^,\s*/, '').replace(/,\s*$/, '');
        if (h && h.length >= 2 && !combos[h]) {
            combos[h] = 100;
        }
    });

    return combos;
}

function aggregateHands(comboFreqMap) {
    const handGroups = {}; // 'AA' -> { totalFreq: num, count: num }

    for (let combo in comboFreqMap) {
        const hand = comboToHand(combo);
        if (!hand) continue;
        if (!handGroups[hand]) handGroups[hand] = { totalFreq: 0, count: 0 };
        handGroups[hand].totalFreq += comboFreqMap[combo];
        handGroups[hand].count += 1;
    }

    const aggregated = {};
    for (let hand in handGroups) {
        const group = handGroups[hand];
        const maxCombos = getMaxCombos(hand);
        // Frequency is average across all possible combos of that hand
        aggregated[hand] = group.totalFreq / maxCombos;
    }
    return aggregated;
}

function comboToHand(combo) {
    // combo like "AhAd" or "Ah2h"
    if (combo.length !== 4) return null;
    const r1 = combo[0];
    const s1 = combo[1];
    const r2 = combo[2];
    const s2 = combo[3];

    const RANKS = 'AKQJT98765432';
    const idx1 = RANKS.indexOf(r1);
    const idx2 = RANKS.indexOf(r2);

    if (r1 === r2) return r1 + r2; // Pair
    if (s1 === s2) {
        // Suited
        return (idx1 < idx2 ? r1 + r2 : r2 + r1) + 's';
    } else {
        // Offsuit
        return (idx1 < idx2 ? r1 + r2 : r2 + r1) + 'o';
    }
}

function getMaxCombos(hand) {
    if (hand.length === 2) return 6; // Pair
    if (hand.endsWith('s')) return 4; // Suited
    return 12; // Offsuit
}

parseRanges();
