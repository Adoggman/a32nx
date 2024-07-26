import { A320_Neo_CDU_MainDisplay } from '@fmgc/cdu/CDUMainDisplay';
import { FMCMainDisplay } from './FMSMainDisplay';

export type FMS = A320_Neo_CDU_MainDisplay & FMCMainDisplay; // & DataInterface & DisplayInterface;
