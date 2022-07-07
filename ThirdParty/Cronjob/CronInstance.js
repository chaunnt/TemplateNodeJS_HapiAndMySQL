const cron = require('node-cron');
const { spawn } = require('child_process');

function executeJob(jobLocation) {
  console.log('execute job : ' + jobLocation);
  const ls = spawn('node', [jobLocation]);

  ls.stdout.on('data', data => {
    console.log(`stdout: ${data}`);
  });

  ls.stderr.on('data', data => {
    console.error(`stderr: ${data}`);
  });

  ls.on('close', code => {
    console.log(`child process exited with code ${code}`);
  });
}

module.exports = {
  CronInstance: cron,
  executeJob
};
