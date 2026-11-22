import { spawn } from 'node:child_process';
const cmds = ['dev:api', 'dev:web'];
const children = cmds.map(name => spawn('npm', ['run', name], {stdio:'inherit', shell:process.platform === 'win32'}));
const stop = () => children.forEach(child => child.kill('SIGTERM'));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
let exited=false;
for (const child of children) child.on('exit', code => {if (!exited && code && code !== 0) {exited=true; stop(); process.exitCode=code;}});
