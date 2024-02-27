/* Copyright (c) 2022-2024 Reminano */

const cron = require('node-cron');
const { spawn } = require('child_process');
const Logger = require('../../utils/logging');

function executeJob(jobLocation, args, onDoneJob) {
  Logger.info('Cron Instance', 'execute job : ' + jobLocation);
  const ls = spawn('node', [jobLocation, args]);

  ls.stdout.on('data', data => {
    Logger.info('Cron Instance', `stdout: ${data}`);
  });

  ls.stderr.on('data', data => {
    Logger.info('Cron Instance', `stderr: ${data}`);
  });

  ls.on('close', code => {
    Logger.info('Cron Instance', `child process exited with code ${code}`);
    onDoneJob && onDoneJob(code);
  });
}

module.exports = {
  CronInstance: cron,
  executeJob,
};
