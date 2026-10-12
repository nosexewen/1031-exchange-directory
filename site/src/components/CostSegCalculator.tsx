import { useId, useState } from 'react';
import { estimate, propertyTypes, type Inputs, type PropertyType } from '../lib/calculator';
import LeadModal from './LeadModal';
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
export default function CostSegCalculator() {
  const id=useId();
  const [v,set]=useState<Inputs>({propertyType:'Industrial',purchasePrice:2000000,landValue:400000,excessBasis:500000,allocationPercent:20,bonusPercent:0,placedMonth:1});
  const result=estimate(v);
  const fields=[
    ['purchasePrice','Purchase price ($)',1,1000000000],
    ['landValue','Total land allocation ($)',0,1000000000],
    ['excessBasis','CPA-confirmed excess depreciable basis, excluding land ($)',1,1000000000],
    ['allocationPercent','Assumed short-life allocation (%)',0,100],
    ['bonusPercent','Confirmed eligible bonus rate (%)',0,100],
    ['placedMonth','Placed-in-service month (1–12)',1,12],
  ] as const;
  return <section className="card" aria-label="Excess basis calculator">
    <p className="notice">Illustrative excess-basis scenario only. Purchase price does not establish tax basis. Enter an excess basis already excluding land, confirmed by your CPA. Carryover basis is excluded from this estimate.</p>
    <div className="grid">
      <label htmlFor={id+'type'}>Property type<select id={id+'type'} value={v.propertyType} onChange={e=>set({...v,propertyType:e.target.value as PropertyType})}>{propertyTypes.map(t=><option key={t}>{t}</option>)}</select></label>
      {fields.map(([key,label,min,max])=><label key={key} htmlFor={id+key}>{label}<input id={id+key} type="number" min={min} max={max} step={key==='placedMonth'?1:'any'} value={Number.isNaN(v[key])?'':v[key]} onChange={e=>set({...v,[key]:e.target.valueAsNumber})} /></label>)}
    </div>
    {!result ? <p role="alert" className="error">Enter valid values. Excess depreciable basis must be positive and cannot exceed purchase price less land.</p> :
    <div aria-live="polite" aria-atomic="true">
      <h3>Estimated Year 1 depreciation on excess basis</h3><p className="result">{money(result.yearOne)}</p>
      <p>Baseline without reclassification: {money(result.baseline)}. Estimated incremental depreciation: {money(result.incremental)}.</p>
      <p>Assumed short-life basis: {money(result.eligible)}. Bonus component: {money(result.bonus)}. These are deductions, not cash savings.</p>
    </div>}
    <p className="muted">Model: 80% of reclassified basis uses 5-year property at a 20% first-year half-year MACRS rate; 20% uses 15-year property at 5%. Remaining building basis uses {v.propertyType==='Multifamily'?'27.5':'39'}-year straight-line depreciation with a mid-month convention. Allocation and bonus rate are user assumptions; default bonus is 0%. Mid-quarter convention, ADS, elections, used-property acquisition rules, state conformity, passive-loss limits, recapture and carryover-basis treatment are excluded.</p>
    <p><a href="https://www.irs.gov/publications/p946" target="_blank" rel="noopener noreferrer">IRS Publication 946: depreciation and exchange basis rules</a></p>
    {result && <LeadModal buttonText="Request Preliminary Benefit Analysis" metrics={{...v,...result}} />}
  </section>;
}
