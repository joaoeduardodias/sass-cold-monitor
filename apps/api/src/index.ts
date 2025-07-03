import { defineAbilityFor } from '@cold-monitor/auth';

const ability = defineAbilityFor({ role: 'ADMIN' })

console.log(ability.can('manage', 'all')); // true