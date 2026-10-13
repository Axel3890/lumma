import {test} from 'node:test';
import assert from 'node:assert/strict';
import {progress,dateLabel} from '../src/domain.mjs';
test('weighted progress reflects approved work only',()=>{assert.equal(progress([{status:'Aprobado',weight:30},{status:'Pendiente',weight:70}]),30);});
test('zero-weight recovery does not double count work',()=>{assert.equal(progress([{status:'Aprobado',weight:30},{status:'Aprobado',weight:0},{status:'Pendiente',weight:70}]),30);});
test('empty and zero denominators are zero',()=>{assert.equal(progress([]),0);assert.equal(progress([{status:'Aprobado',weight:0}]),0);});
test('failed assessments do not count as completed',()=>{assert.equal(progress([{status:'Desaprobado',weight:50},{status:'Completado',weight:50}]),50);});
test('dates do not shift across local midnight',()=>{assert.equal(dateLabel('2026-10-15',{day:'numeric'}),'15');});
