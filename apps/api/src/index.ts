import { ability } from '@cold-monitor/auth';

const testUser = ability.can('manage', 'User')

console.log(testUser)