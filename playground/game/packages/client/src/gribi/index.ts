import * as _Example from './Example';
import { Module, NetworkCall } from '@gribi/mud';

const Example: Module<_Example.ModuleCalls> = _Example; 

const Modules = [
    Example
];

export default Modules;