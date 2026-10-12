import { readFileSync } from 'node:fs';
import { qiSchema, costSegSchema, stateRulesSchema } from '../src/content/config';
if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('Remote-only');
const schemas = { qi:qiSchema, costseg:costSegSchema, states:stateRulesSchema };
type Kind = keyof typeof schemas;
const contract = JSON.parse(readFileSync(process.argv[2], 'utf8')) as {
  fields:Record<Kind,string[]>; cases:{kind:Kind;record:unknown;accepted:boolean}[];
};
for (const kind of Object.keys(schemas) as Kind[]) {
  const actual = Object.keys(schemas[kind].shape).sort();
  if (JSON.stringify(actual) !== JSON.stringify(contract.fields[kind])) throw new Error('Field drift: ' + kind);
}
for (const [index,c] of contract.cases.entries()) {
  if (schemas[c.kind].safeParse(c.record).success !== c.accepted) throw new Error('Acceptance drift at ' + index);
}
console.log('Schema parity fixtures passed: ' + contract.cases.length);
