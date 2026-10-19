import test from 'node:test';import assert from 'node:assert/strict';
test('20 percent of gross profit, not revenue',()=>{const sales=440,cogs=310;const gross=sales-cogs;const discount=Math.round(gross*.2*100)/100;assert.equal(discount,26);assert.equal(sales-discount,414);assert.equal(sales-discount-cogs,104);});
test('no discount on loss',()=>{assert.equal(Math.max(0,100-120)*.2,0);});
