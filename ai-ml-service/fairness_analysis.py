"""Operational fairness audit for fictional EmergencyLink evaluation data.

No protected personal attributes are collected. This audit tests service-access
proxies at the hospital level and must not be interpreted as demographic fairness validation.
"""
import json
from pathlib import Path
import pandas as pd
from app.engine import recommend
from app.models import RecommendationRequest

ROOT = Path(__file__).resolve().parent
hospitals = json.loads((ROOT/'data/hospitals.json').read_text())
cases = json.loads((ROOT/'data/emergency_cases.json').read_text())
rows=[]
for case in cases:
    response = recommend(RecommendationRequest(**case, hospitals=hospitals))
    hospital_by_id = {h['hospital_id']: h for h in hospitals}
    for item in response.candidates:
        h=hospital_by_id[item.hospital_id]
        route=h.get('route_estimate') or {}; minutes=((route.get('minutes_low') + route.get('minutes_high')) / 2 if route.get('minutes_low') is not None and route.get('minutes_high') is not None else h.get('estimated_travel_minutes'))
        band='unknown' if minutes is None else ('near_0_15' if minutes <=15 else 'mid_16_30' if minutes<=30 else 'far_31_plus')
        rows.append({'case_id':case['case_id'],'hospital_id':item.hospital_id,'travel_band':band,
                     'eligible':item.eligible,'selected_top1':item.rank==1,'score':item.match_score,
                     'confidence':item.resource_data_reliability.level})
df=pd.DataFrame(rows)
summary=df.groupby('travel_band',dropna=False).agg(
    candidates=('hospital_id','count'), eligibility_rate=('eligible','mean'),
    top1_selection_rate=('selected_top1','mean'), mean_score=('score','mean')).reset_index()
for c in ['eligibility_rate','top1_selection_rate']:
    summary[c]=(summary[c]*100).round(2)
summary['mean_score']=summary['mean_score'].round(2)
summary.to_csv(ROOT/'outputs/fairness_by_travel_band.csv',index=False)
eligible_rates=summary.eligibility_rate
report={
 'audit_scope':'Hospital-level operational access proxies only',
 'protected_attributes_used':False,
 'groups':'Estimated travel-time bands',
 'max_eligibility_rate_gap_percentage_points':round(float(eligible_rates.max()-eligible_rates.min()),2),
 'small_sample_warning':True,
 'causal_claims_supported':False,
 'recommended_monitoring':['eligibility rate by region/travel band','top-1 selection rate by region/travel band','missing/stale data rate by facility','manual override rate by facility']
}
(ROOT/'outputs/fairness_summary.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
