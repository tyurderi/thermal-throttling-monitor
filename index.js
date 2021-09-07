const { menubar }                   = require('menubar');
const { sprintf }                   = require('sprintf-js');
const { spawn }                     = require('child_process');
const { chunksToLinesAsync, chomp } = require('@rauschma/stringio');

const mb = menubar(
    {
        tooltip: 'Thermal Throttling Monitor',
        showDockIcon: false
    }
);

let appIsReady  = false;
let maxThrottle = -1;

mb.on('ready', () => {
    appIsReady = true;
});

async function main() {
    const source = spawn('pmset', ['-g', 'thermlog'],
        { stdio: ['ignore', 'pipe', process.stderr] }
    );

    await echoReadable(source.stdout);
}

main();

async function echoReadable(readable) {
    for await (let line of chunksToLinesAsync(readable)) {
        line = chomp(line);

        if (line.indexOf('CPU_Speed_Limit') > -1) {
            line        = line.replace(/([\s\t]+)/g, '');
            const match = line.match(/CPU_Speed_Limit=([0-9]{2,3})/);

            if (!match) {
                console.log(line);
                continue;
            }

            const currentThrottle = 100 - parseInt(match[1]);

            if (-1 === maxThrottle && currentThrottle > maxThrottle) {
                maxThrottle = currentThrottle;
            }

            mb.tray.setTitle(
                sprintf('current %d%%, max %d%%', currentThrottle, maxThrottle)
            );
        }
    }
}
