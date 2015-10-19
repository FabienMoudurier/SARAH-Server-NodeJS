var CRON = require('cron').CronJob;

// ------------------------------------------
//  CONSTRUCTOR
// ------------------------------------------

var init = function(){
  info('Starting CRONManager ...');
  
  process.on('SIGINT', function() {
	  CRONManager.stop();
	  process.exit(0);
  }
  
  process.on('uncaughtException', function() {
	  CRONManager.stop();
  }
  
  return CRONManager;
}

/**
 * Starting all jobs from properties
 */
var start = function(){
  var plugins = SARAH.PluginManager.getList();
  for (var i = 0 ; i < plugins.length ; i++){
    var plugin = plugins[i]; 
    if (!plugin.cron) continue;
    job(plugin);
  }
}

function stop(){
  var plugins = SARAH.PluginManager.getList();
  for (var i = 0 ; i < plugins.length ; i++){
    var plugin = plugins[i]; 
    if (!plugin.cronJob) continue;
	info("Stoping cron job %s", plugin.name);
	plugin.cronJob.stop();
}

var job = function(plugin) {
  if (!plugin.cron.time){ return warn('Missing cron time table');}
  info("Starting new job %s with cron %s", plugin.name, plugin.cron.time); 
  
  // Build callback
  var next = function(data){
    if (!data){ return; }
    if (data.error){ SARAH.speak(tts); }
    
    var tts = SARAH.ScriptManager.speak(data.tts);
    if (tts){ SARAH.speak(tts); }
    
    SARAH.RuleEngine.dispatch(plugin.name, data);
  }
  
  // Create job
  var job = new CRON({
    cronTime: plugin.cron.time,
    onTick: function() {
      info('Cron: %s', plugin.name);
      plugin.getInstance().cron(next, plugin.cron, SARAH);
    },
    start: true
  });
  
  // Run once
  plugin.getInstance().cron(next, plugin.cron, SARAH);
}

// ------------------------------------------
//  PUBLIC
// ------------------------------------------

var CRONManager = {
  'init' : init,
  'start': start
}

// Exports Manager
exports.init = CRONManager.init;