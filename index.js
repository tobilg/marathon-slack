"use strict";

// Check if we got the necessary info from the environment, otherwise fail directly!
require("require-environment-variables")(["WEBHOOK_URL"]);

var MarathonEventListener = require("./lib/MarathonEventListener");

var options = {
    marathonUrl: process.env.MARATHON_URL || "leader.mesos",
    marathonPort: process.env.MARATHON_PORT || 8080,
    slackWebHook: process.env.WEBHOOK_URL,
    logging: {
        level: process.env.LOG_LEVEL || "info"
    }
};

if (process.env.EVENT_TYPES) {
    if (process.env.EVENT_TYPES.indexOf(",") > -1) {
        options.eventTypes = process.env.EVENT_TYPES.split(","); 
    }
}

var mel = new MarathonEventListener(options);

mel.on("connected", function (timestamp) {
    mel.logger.info("Connected to the Marathon Event Bus!");
});

mel.on("error", function (error) {
    mel.logger.error(JSON.stringify(error));
});

mel.subscribe();