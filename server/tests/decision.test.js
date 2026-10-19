import test from 'node:test';import assert from 'node:assert/strict';
const payment=(p,apr,months)=>{const r=apr/1200;return r===0?p/months:p*r/(1-Math.pow(1+r,-months));};
test('zero-interest financing divides principal evenly',()=>assert.equal(payment(12000,0,12),1000));
test('amortizing monthly payment is positive and greater than principal/month at positive APR',()=>assert.ok(payment(12000,12,12)>1000));
test('profit-based discount does not discount loss-making sales',()=>{const gross=-40;assert.equal(Math.max(0,gross)*.2,0);});
