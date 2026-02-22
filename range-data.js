// GTO Range Data (embedded from range.json for file:// compatibility)
const RANGE_DATA = {
    "poker_strategy": {
        "game_format": "6-Max Cash",
        "stack_depth": "100bb",
        "rake_environment": "NL500 (High Stakes)",
        "source": "GTO Wizard",
        "timestamp_read": "2024-05-22"
    },
    "open_ranges_rfi": [
        {
            "position": "UTG",
            "action": "Raise 2bb",
            "frequency": "17.6%",
            "range_summary": {
                "pure_raise": ["66+", "A2s+", "KTs+", "QTs+", "JTs", "T9s", "98s", "AKo", "AQo"],
                "mixed_raise": ["55", "AJo", "KQo", "K9s", "Q9s", "J9s", "87s", "76s", "65s"]
            }
        },
        {
            "position": "HJ",
            "action": "Raise 2bb",
            "frequency": "21.5%",
            "range_summary": {
                "pure_raise": ["44+", "A2s+", "K9s+", "Q9s+", "J9s+", "T9s", "98s", "87s", "76s", "AJo+", "KQo"],
                "mixed_raise": ["33-22", "ATo", "KJo", "QJo", "K8s-K6s", "Q8s", "J8s", "T8s", "65s", "54s"]
            }
        },
        {
            "position": "CO",
            "action": "Raise 2.3bb",
            "frequency": "29.3%",
            "range_summary": {
                "pure_raise": ["22+", "A2s+", "K5s+", "Q8s+", "J8s+", "T8s+", "97s+", "86s+", "76s", "65s", "54s", "ATo+", "KJo+", "QJo"],
                "mixed_raise": ["K4s-K2s", "Q7s-Q2s", "J7s-J4s", "T7s-T6s", "KTo", "QTo", "JTo"]
            }
        },
        {
            "position": "BTN",
            "action": "Raise 2.5bb",
            "frequency": "43.5%",
            "range_summary": {
                "pure_raise": ["22+", "A2s+", "K2s+", "Q2s+", "J4s+", "T6s+", "96s+", "86s+", "75s+", "65s", "54s", "A2o+", "K9o+", "Q9o+", "J9o+", "T9o"],
                "mixed_raise": ["K8o-K5o", "Q8o", "J8o", "T8o", "98o", "87o"]
            }
        },
        {
            "position": "SB",
            "action": "Raise 3bb",
            "frequency": "40.2%",
            "range_summary": {
                "pure_raise": ["22+", "A2s+", "K4s+", "Q7s+", "J7s+", "T7s+", "97s+", "86s+", "76s", "65s", "54s", "A7o+", "K9o+", "QTo+", "JTo"],
                "mixed_raise": ["K3s-K2s", "Q6s-Q4s", "J6s-J5s", "T6s", "96s", "85s", "75s", "A6o-A2o", "K8o-K6o", "Q9o", "J9o", "T9o", "98o"]
            }
        }
    ],
    "bb_defense_ranges": [
        {
            "scenario": "BB vs UTG Open",
            "opponent_action": "UTG Raise 2bb",
            "defense_frequency": { "call": "33.8%", "raise": "17.8%", "fold": "48.5%" },
            "strategy_summary": {
                "3bet_value": ["KK+", "AKo(mixed)", "AKs(mixed)"],
                "3bet_bluff": ["A5s-A4s"],
                "pure_call": ["22-QQ", "AQs-A2s", "KQs-K6s", "QJs-Q9s", "JTs-J9s", "T9s", "98s", "87s", "76s", "65s", "54s", "AQo-ATo", "KQo-KJo", "QJo"]
            }
        },
        {
            "scenario": "BB vs HJ Open",
            "opponent_action": "HJ Raise 2bb",
            "defense_frequency": { "call": "35.7%", "raise": "5.1%", "fold": "59.1%" },
            "strategy_summary": {
                "3bet_range": ["JJ+", "AQs+", "AKo", "A5s-A4s"],
                "call_range": ["22-TT", "AJs-A2s", "KQs-K6s", "QJs-Q8s", "JTs-J8s", "T9s-T8s", "98s", "87s", "76s", "65s", "54s", "AQo-ATo", "KQo-KJo", "QJo"]
            }
        },
        {
            "scenario": "BB vs CO Open",
            "opponent_action": "CO Raise 2.3bb",
            "defense_frequency": { "call": "40.6%", "raise": "6.3%", "fold": "53.2%" },
            "strategy_summary": {
                "3bet_range": ["TT+", "AJs+", "AQo+", "A5s-A2s", "T9s", "98s", "87s"],
                "call_range": ["22-99", "ATs-A2s", "KTs-K2s", "QTs-Q5s", "JTs-J7s", "T9s-T7s", "98s-96s", "87s-85s", "76s-75s", "65s", "54s", "AJo-A8o", "KQo-KTo", "QJo-QTo", "JTo"]
            }
        },
        {
            "scenario": "BB vs BTN Open",
            "opponent_action": "BTN Raise 2.5bb",
            "defense_frequency": { "call": "28.9%", "raise": "9.3%", "fold": "61.7%" },
            "strategy_summary": {
                "3bet_range": ["99+", "ATs+", "AJo+", "KQo", "A5s-A2s", "K5s-K2s", "T9s", "98s", "87s"],
                "call_range": ["22-88", "A9s-A2s", "K9s-K2s", "Q9s-Q2s", "J9s-J5s", "T9s-T6s", "98s-95s", "87s-84s", "76s-74s", "65s-63s", "54s-53s", "ATo-A2o", "KJo-K9o", "QJo-Q9o", "JTo-J9o", "T9o"]
            }
        },
        {
            "scenario": "BB vs SB Open",
            "opponent_action": "SB Raise 3bb",
            "defense_frequency": { "call": "30%", "raise": "13.8%", "fold": "56.2%" },
            "strategy_summary": {
                "3bet_range": ["TT+", "AJs+", "KQs", "AQo+", "K9s", "Q9s", "J9s", "T8s", "97s"],
                "call_range": ["22-99", "ATs-A2s", "KTs-K2s", "QTs-Q4s", "JTs-J5s", "T9s-T6s", "98s-95s", "87s-84s", "76s-74s", "65s-63s", "54s-53s", "AJo-A2o", "KQo-K9o", "QJo-Q9o", "JTo-J9o", "T9o"]
            }
        },
        {
            "scenario": "BB vs SB Limp",
            "opponent_action": "SB Call (Limp 0.5bb)",
            "defense_frequency": { "check": "61.5%", "raise_total": "38.4%", "fold": "0%" },
            "strategy_summary": {
                "iso_raise_value": ["TT+", "ATs+", "KJs+", "QJs", "JTs", "ATo+", "KJo+", "QJo", "JTo"],
                "iso_raise_bluff": ["K5o-K2o", "Q5o-Q2o", "J4o-J2o", "T3o-T2o", "54s", "43s", "32s"],
                "check_range": ["22-99", "A9s-A2s", "KTs-K2s", "QTs-Q2s", "J9s-J2s", "T9s-T2s", "98s-92s", "A9o-A2o", "K9o-K6o", "Q9o-Q6o", "J9o-J5o", "T9o-T4o", "98o-95o", "87o-84o", "76o-74o", "65o-63o", "54o"],
                "notes": "BBは中間層のハンドでチェックし、最強ハンドと最弱ハンドでレイズする「バーベル戦略」を採用。"
            }
        }
    ],
    "vs_3bet_ranges": [
        {
            "scenario": "UTG vs 3Bet",
            "hero_position": "UTG",
            "villain_position": "Any",
            "hero_open": "Raise 2bb",
            "villain_action": "3Bet",
            "strategy_summary": {
                "4bet_value": ["QQ+", "AKs"],
                "4bet_bluff": ["A5s", "A4s"],
                "call": ["JJ-TT", "AKo", "AQs", "AJs", "KQs"],
                "fold": ["99-", "ATo-", "KJs-", "QTs-"]
            }
        },
        {
            "scenario": "HJ vs 3Bet",
            "hero_position": "HJ",
            "villain_position": "Any",
            "hero_open": "Raise 2bb",
            "villain_action": "3Bet",
            "strategy_summary": {
                "4bet_value": ["QQ+", "AKs"],
                "4bet_bluff": ["A5s", "A4s", "A3s"],
                "call": ["JJ-99", "AKo", "AQs-AJs", "AQo", "KQs", "KJs", "QJs", "JTs", "T9s"],
                "fold": ["88-", "ATo-", "KTs-", "Q9s-"]
            }
        },
        {
            "scenario": "CO vs 3Bet",
            "hero_position": "CO",
            "villain_position": "Any",
            "hero_open": "Raise 2.3bb",
            "villain_action": "3Bet",
            "strategy_summary": {
                "4bet_value": ["QQ+", "AKs", "AKo"],
                "4bet_bluff": ["A5s-A2s"],
                "call": ["JJ-77", "AQs-ATs", "AQo-AJo", "KQs-KTs", "QJs-QTs", "JTs", "T9s", "98s", "87s", "76s"],
                "fold": ["66-", "A9s-", "K8s-", "Q9s-", "J9s-", "ATo-", "KJo-"]
            }
        },
        {
            "scenario": "BTN vs 3Bet",
            "hero_position": "BTN",
            "villain_position": "BB/SB",
            "hero_open": "Raise 2.5bb",
            "villain_action": "3Bet",
            "strategy_summary": {
                "4bet_value": ["JJ+", "AKs", "AKo"],
                "4bet_bluff": ["A5s-A2s", "K5s-K4s", "76s", "65s"],
                "call": ["TT-55", "AQs-A9s", "AQo-AJo", "KQs-K9s", "QJs-Q9s", "JTs-J9s", "T9s-T8s", "98s-97s", "87s", "KQo-KJo"],
                "fold": ["44-", "A8s-", "K8s-", "Q8s-", "J8s-", "ATo-", "KTo-"]
            }
        }
    ]
};
