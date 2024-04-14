import * as CUR from './CommitUpdateReveal';
import { Module, NetworkCall } from '@gribi/mud';

const CommitUpdateReveal: Module<CUR.ModuleCalls> = CUR; 

const Modules = [ 
    CommitUpdateReveal
];

export default Modules;