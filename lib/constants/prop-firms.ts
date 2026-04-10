
export interface PropFirmChallenge {
    name: string;
    steps: {
        name: string;
        profit_target_pct: number;
        daily_drawdown_pct: number;
        max_drawdown_pct: number;
        drawdown_type?: 'static' | 'trailing' | 'trailing_high_watermark';
    }[];
}

export interface PropFirm {
    name: string;
    accounts: number[];
    challenges: PropFirmChallenge[];
}

export const PROP_FIRMS: Record<string, PropFirm> = {
    "FTMO": {
        "accounts": [10000, 25000, 50000, 100000, 200000],
        "challenges": [
            {
                "name": "2-Step (Normal)",
                "steps": [
                    { "name": "Phase 1", "profit_target_pct": 10, "daily_drawdown_pct": 5, "max_drawdown_pct": 10, "drawdown_type": "static" },
                    { "name": "Phase 2", "profit_target_pct": 5, "daily_drawdown_pct": 5, "max_drawdown_pct": 10, "drawdown_type": "static" }
                ]
            },
            {
                "name": "1-Step",
                "steps": [
                    { "name": "Evaluation", "profit_target_pct": 10, "daily_drawdown_pct": 3, "max_drawdown_pct": 10, "drawdown_type": "trailing_high_watermark" }
                ]
            }
        ]
    },
    "The Funded Trader": {
        "accounts": [5000, 10000, 25000, 50000, 100000, 200000, 300000, 400000],
        "challenges": [
            {
                "name": "Standard (2-Step)",
                "steps": [
                    { "name": "Phase 1", "profit_target_pct": 10, "daily_drawdown_pct": 5, "max_drawdown_pct": 10, "drawdown_type": "static" },
                    { "name": "Phase 2", "profit_target_pct": 5, "daily_drawdown_pct": 5, "max_drawdown_pct": 10, "drawdown_type": "static" }
                ]
            },
            {
                "name": "Royal (2-Step)",
                "steps": [
                    { "name": "Phase 1", "profit_target_pct": 8, "daily_drawdown_pct": 5, "max_drawdown_pct": 10, "drawdown_type": "static" },
                    { "name": "Phase 2", "profit_target_pct": 5, "daily_drawdown_pct": 5, "max_drawdown_pct": 10, "drawdown_type": "static" }
                ]
            },
            {
                "name": "Knight (1-Step)",
                "steps": [
                    { "name": "Evaluation", "profit_target_pct": 10, "daily_drawdown_pct": 3, "max_drawdown_pct": 6, "drawdown_type": "trailing" }
                ]
            }
        ]
    },
    "MyFundedFX": {
        "accounts": [5000, 10000, 25000, 50000, 100000, 200000],
        "challenges": [
            {
                "name": "1-Step",
                "steps": [
                    { "name": "Evaluation", "profit_target_pct": 10, "daily_drawdown_pct": 4, "max_drawdown_pct": 6, "drawdown_type": "trailing" }
                ]
            },
            {
                "name": "2-Step",
                "steps": [
                    { "name": "Phase 1", "profit_target_pct": 8, "daily_drawdown_pct": 5, "max_drawdown_pct": 8, "drawdown_type": "static" },
                    { "name": "Phase 2", "profit_target_pct": 5, "daily_drawdown_pct": 5, "max_drawdown_pct": 8, "drawdown_type": "static" }
                ]
            },
            {
                "name": "2-Step Max",
                "steps": [
                    { "name": "Phase 1", "profit_target_pct": 10, "daily_drawdown_pct": 5, "max_drawdown_pct": 10, "drawdown_type": "static" },
                    { "name": "Phase 2", "profit_target_pct": 5, "daily_drawdown_pct": 5, "max_drawdown_pct": 10, "drawdown_type": "static" }
                ]
            }
        ]
    },
    "Funding Pips": {
        "accounts": [5000, 10000, 25000, 50000, 100000],
        "challenges": [
            {
                "name": "2-Step",
                "steps": [
                    { "name": "Phase 1", "profit_target_pct": 8, "daily_drawdown_pct": 5, "max_drawdown_pct": 10, "drawdown_type": "static" },
                    { "name": "Phase 2", "profit_target_pct": 5, "daily_drawdown_pct": 5, "max_drawdown_pct": 10, "drawdown_type": "static" }
                ]
            },
            {
                "name": "1-Step",
                "steps": [
                    { "name": "Evaluation", "profit_target_pct": 10, "daily_drawdown_pct": 4, "max_drawdown_pct": 8, "drawdown_type": "trailing" }
                ]
            }
        ]
    },
    "E8 Markets": {
        "accounts": [5000, 10000, 25000, 50000, 100000, 200000],
        "challenges": [
            {
                "name": "E8 Challenge (2-Step)",
                "steps": [
                    { "name": "Phase 1", "profit_target_pct": 8, "daily_drawdown_pct": 5, "max_drawdown_pct": 8, "drawdown_type": "static" },
                    { "name": "Phase 2", "profit_target_pct": 5, "daily_drawdown_pct": 5, "max_drawdown_pct": 8, "drawdown_type": "static" }
                ]
            },
            {
                "name": "E8 One (1-Step)",
                "steps": [
                    { "name": "Evaluation", "profit_target_pct": 10, "daily_drawdown_pct": 3, "max_drawdown_pct": 6, "drawdown_type": "trailing" }
                ]
            },
            {
                "name": "E8 Track (3-Step)",
                "steps": [
                    { "name": "Phase 1", "profit_target_pct": 5, "daily_drawdown_pct": 5, "max_drawdown_pct": 8, "drawdown_type": "static" },
                    { "name": "Phase 2", "profit_target_pct": 5, "daily_drawdown_pct": 5, "max_drawdown_pct": 8, "drawdown_type": "static" },
                    { "name": "Phase 3", "profit_target_pct": 5, "daily_drawdown_pct": 5, "max_drawdown_pct": 8, "drawdown_type": "static" }
                ]
            }
        ]
    }
}
