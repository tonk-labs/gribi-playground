import { Module } from 'gribi-js';
import * as _Loot from './Loot';

const Loot: Module<_Loot.ModuleCalls> = _Loot; 

const Modules = [
    Loot
];

export default Modules;