"""Generate access-gap mitigation recommendations from the fictional fairness audit.

Recommendations preserve mandatory safety and operational constraints. They target
access, data quality, routing operations, and monitoring rather than manipulating
rankings to force equal outcomes.
"""
import json
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent
summary = pd.read_csv(ROOT / 'outputs/fairness_by_travel_band.csv')
fairness = json.loads((ROOT / 'outputs/fairness_summary.json').read_text())

best_rate = float(summary['eligibility_rate'].max())
worst = summary.sort_values(['eligibility_rate', 'top1_selection_rate']).iloc[0]
worst_band = str(worst['travel_band'])
worst_rate = float(worst['eligibility_rate'])
gap = float(fairness['max_eligibility_rate_gap_percentage_points'])

recommendations = [
    {
        'priority': 1,
        'action': 'Improve capacity and capability coverage in the lowest-access travel band',
        'rationale': f'{worst_band} has the lowest observed eligibility rate ({worst_rate:.2f}%) versus the best observed rate ({best_rate:.2f}%).',
        'implementation': [
            'Identify which mandatory specialties, capabilities, and resources most often cause exclusion.',
            'Create mutual-aid agreements and pre-authorized transfer pathways with nearby facilities.',
            'Prioritize staffing, equipment, and surge-capacity investments for repeatedly underserved service areas.'
        ],
        'metric': 'Eligibility-rate gap by travel band',
        'target': 'Reduce the gap over successive evaluation periods without weakening mandatory constraints',
        'safety_guardrail': 'Do not mark unavailable resources as available or relax required clinical/operational capabilities.'
    },
    {
        'priority': 2,
        'action': 'Reduce travel disadvantage through coverage and dispatch interventions',
        'rationale': 'Travel suitability has a 40% ranking weight, so geographic distance can materially affect ordering among otherwise eligible hospitals.',
        'implementation': [
            'Use live traffic-aware travel estimates rather than static times.',
            'Add ambulance staging or dynamic standby locations in persistently high-travel areas.',
            'Evaluate inter-facility transport, mobile stabilization, and regional routing partnerships.'
        ],
        'metric': 'Median and 90th-percentile travel time by service area',
        'target': 'Narrow travel-time disparities while maintaining response safety',
        'safety_guardrail': 'Travel interventions must not override hospital eligibility or receiving-facility confirmation.'
    },
    {
        'priority': 3,
        'action': 'Close data-quality gaps before changing model weights',
        'rationale': 'Missing or stale availability data can lower confidence and may create apparent access gaps that are partly measurement gaps.',
        'implementation': [
            'Set freshness service-level objectives for resource updates.',
            'Alert facilities before records become stale and escalate repeated feed failures.',
            'Track missing, stale, and unverified fields by facility and travel band.',
            'Provide audited manual verification when automated feeds are unavailable.'
        ],
        'metric': 'Percentage of required resource records fresh and verified',
        'target': 'At least 95% fresh and verified records in every monitored group',
        'safety_guardrail': 'Unknown data remains unknown; never impute availability as confirmed.'
    },
    {
        'priority': 4,
        'action': 'Add constrained sensitivity testing and policy review',
        'rationale': 'The current gap may be sensitive to the travel weight and freshness thresholds, but changing them blindly could hide operational risk.',
        'implementation': [
            'Re-run the audit across approved travel-weight and freshness-threshold scenarios.',
            'Reject configurations that increase unsafe recommendations or allow missing mandatory capabilities.',
            'Document the access-versus-travel trade-off and obtain authorized operational review before deployment.'
        ],
        'metric': 'Gap, recommendation stability, and safety-constraint violation count per scenario',
        'target': 'Select only configurations with zero safety-constraint violations',
        'safety_guardrail': 'Hard eligibility rules remain invariant in every scenario.'
    },
    {
        'priority': 5,
        'action': 'Introduce ongoing fairness governance and human-review monitoring',
        'rationale': 'A one-time synthetic audit is insufficient to establish whether a persistent access disparity exists.',
        'implementation': [
            'Review eligibility, selection, stale-data, and override rates on a regular cadence.',
            'Require minimum sample sizes and confidence intervals before escalation.',
            'Investigate gaps by geography, facility type, time of day, and resource category.',
            'Log coordinator overrides and outcomes without using protected attributes for routing decisions unless legally and ethically approved for auditing.'
        ],
        'metric': 'Persistent disparity alerts and completed root-cause reviews',
        'target': 'Every material persistent gap receives a documented review and accountable owner',
        'safety_guardrail': 'Human review supplements, but does not bypass, mandatory safety checks.'
    }
]

report = {
    'observed_gap_percentage_points': round(gap, 2),
    'lowest_access_group': worst_band,
    'interpretation': 'Synthetic operational-access signal only; not evidence of unlawful or demographic discrimination.',
    'mitigation_principle': 'Fix access, capacity, travel, and data-quality causes before altering ranking behavior.',
    'recommendations': recommendations,
    'deployment_gate': [
        'Validate on representative real operational data.',
        'Review recommendations with authorized emergency operations and clinical safety stakeholders.',
        'Confirm zero weakening of hard eligibility constraints.',
        'Define owners, monitoring cadence, thresholds, and rollback criteria.'
    ]
}
(ROOT / 'outputs/access_gap_mitigation.json').write_text(json.dumps(report, indent=2))

lines = [
    '# Access-Gap Mitigation Plan', '',
    f'Observed fictional eligibility-rate gap: **{gap:.2f} percentage points**.',
    f'Lowest-access travel band: **{worst_band}** with an eligibility rate of **{worst_rate:.2f}%**.', '',
    '> This is a small synthetic audit. The gap is an investigation trigger, not proof of demographic discrimination or a causal model effect.', '',
    '## Mitigation principle', '',
    'Preserve mandatory safety constraints. Address service capacity, geographic coverage, transport, and data quality before considering changes to ranking weights.', ''
]
for rec in recommendations:
    lines += [f"## {rec['priority']}. {rec['action']}", '', f"**Why:** {rec['rationale']}", '', '**Actions:**']
    lines += [f"- {x}" for x in rec['implementation']]
    lines += ['', f"**Measure:** {rec['metric']}", '', f"**Target:** {rec['target']}", '', f"**Guardrail:** {rec['safety_guardrail']}", '']
lines += ['## Deployment gates', ''] + [f'- {x}' for x in report['deployment_gate']]
(ROOT / 'docs/ACCESS_GAP_MITIGATION.md').write_text('\n'.join(lines) + '\n')
print(json.dumps({'gap': gap, 'lowest_access_group': worst_band, 'recommendations': len(recommendations)}, indent=2))
