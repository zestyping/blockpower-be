import { ov_config } from './ov_config';

var _tasks = [];

function init() {
  setInterval(async () => {
    if (_tasks.length === 0) return;

    let task = _tasks.pop();
    if (!task.name || !task.execute) return;
    if (typeof task.execute !== 'function') return;

    try {
      console.log("Executing task: %s", task.name);
      await task.execute();
      console.log("Finished executing task: %s", task.name);
    } catch(err) {
      console.log('Error executing task: %s', task.name, err);
    }
  }, ov_config.fifo_wakeup);
}

function add(task) {
  _tasks.push(task);
}

module.exports = {
  init: init,
  add: add
};
