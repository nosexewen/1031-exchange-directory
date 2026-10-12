export const propertyTypes = ['Industrial','NNN Retail','Multifamily'] as const;
export type PropertyType = typeof propertyTypes[number];
export interface Inputs {
  propertyType:PropertyType; purchasePrice:number; landValue:number;
  excessBasis:number; allocationPercent:number; bonusPercent:number; placedMonth:number;
}
export function estimate(v:Inputs) {
  if (!propertyTypes.includes(v.propertyType) || Object.values(v).some(x=>typeof x==='number'&&!Number.isFinite(x))
    || v.purchasePrice<=0 || v.landValue<0 || v.landValue>=v.purchasePrice
    || v.excessBasis<=0 || v.excessBasis>v.purchasePrice-v.landValue
    || v.allocationPercent<0 || v.allocationPercent>100
    || v.bonusPercent<0 || v.bonusPercent>100
    || !Number.isInteger(v.placedMonth) || v.placedMonth<1 || v.placedMonth>12) return null;
  const life=v.propertyType==='Multifamily'?27.5:39;
  const eligible=v.excessBasis*v.allocationPercent/100;
  const bonus=eligible*v.bonusPercent/100;
  // Illustrative 80% five-year / 20% fifteen-year, half-year MACRS.
  const shortLifeRegular=(eligible-bonus)*(.8*.20+.2*.05);
  const firstYearFraction=(12-v.placedMonth+.5)/12;
  const baseline=v.excessBasis/life*firstYearFraction;
  const yearOne=bonus+shortLifeRegular+(v.excessBasis-eligible)/life*firstYearFraction;
  return { eligible,bonus,yearOne,baseline,incremental:yearOne-baseline,life };
}
