
import { generateTOML } from './utils/starship';
import { ActiveModule } from './types';

const modules: ActiveModule[] = [
    {
        id: '1',
        type: 'directory',
        disabled: false,
        properties: {
            truncation_length: 3,
            substitutions: {
                '~': '🏠',
                'foo': 'bar'
            }
        }
    },
    {
        id: '2',
        type: 'os',
        disabled: false,
        properties: {
            style: 'bold white',
            symbols: {
                'Alpaquita': '🔔 ',
                'Alpine': '🏔️ '
            }
        }
    }
];

const toml = generateTOML(modules);
console.log(toml);
