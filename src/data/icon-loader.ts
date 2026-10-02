import type { IconLibrary } from './preset-contract/types';
import { validateIconLibrary } from './preset-contract/validate.mjs';
const files=import.meta.glob('./icons/*.json',{eager:true,import:'default'});
const index=files['./icons/catalog.json'] as {schemaVersion:1;version:string;libraries:{id:string;name:string;path:string}[]};
export const iconLibraries: IconLibrary[]=index.libraries.map(entry=>validateIconLibrary(files[`./icons/${entry.path}`]));
