import { z } from 'zod';
// Same schemas are used by Astro data collections and remote contract verification.
const https = z.string().refine(v => v.startsWith('https://') && v.slice(8).split('/')[0].length > 0, 'HTTPS URL required');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = new Date(v + 'T00:00:00Z');
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0,10) === v;
}, 'Valid ISO calendar date required');
const evidence = {
  sources: z.array(https).min(1),
  reviewed_on: date,
  verification_status: z.enum(['baseline','verified']),
};
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const state = z.string().regex(/^[A-Z]{2}$/);
const nonnegative = z.number().finite().nonnegative();
export const feeRangeSchema = z.object({
  minimum_usd: nonnegative, maximum_usd: nonnegative,
}).strict().refine(v => v.maximum_usd >= v.minimum_usd, 'Maximum must be >= minimum');
export const qiSchema = z.object({
  ...evidence, entity_id:id, name:z.string().min(1), state,
  coverage_type:z.enum(['National','Regional']),
  bonded_amount_usd:nonnegative.nullable(), escrow_type:z.string().nullable(),
  services:z.array(z.enum(['forward','reverse','improvement','dst'])).nullable(),
  base_fee_range:feeRangeSchema.nullable(), website:https,
  verified_partner:z.boolean(), parent_group:z.string().nullable(),
}).strict();
export const costSegSchema = z.object({
  ...evidence, entity_id:id, name:z.string().min(1),
  coverage:z.array(z.string()).min(1),
  accredited_engineers:z.boolean().nullable(), audit_defense_included:z.boolean().nullable(),
  typical_fee_range:feeRangeSchema.nullable(), property_specialties:z.array(z.string()).nullable(),
  contact_endpoint:https, partner_tier:z.enum(['anchor','hybrid','standard']).nullable(),
}).strict();
export const stateRulesSchema = z.object({
  ...evidence, state_code:state, state_name:z.string().min(1),
  capital_gains_tax_rate:z.number().finite().min(0).max(1).nullable(),
  clawback_rules:z.boolean(), clawback_form:z.string().nullable(),
  key_statutory_notes:z.array(z.string()).min(1), rate_description:z.string().min(1),
}).strict();
export type QI = z.infer<typeof qiSchema>;
export type CostSeg = z.infer<typeof costSegSchema>;
export type Rules = z.infer<typeof stateRulesSchema>;
export const collections = {
  qi: { type: 'data' as const, schema: qiSchema },
  costseg: { type: 'data' as const, schema: costSegSchema },
  states: { type: 'data' as const, schema: stateRulesSchema },
};
