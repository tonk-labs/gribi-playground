import { Module } from 'gribi-js';
import * as _Example from './Example';

const Example: Module<_Example.ModuleCalls> = _Example; 

const Modules = [
    Example
];

export default Modules;