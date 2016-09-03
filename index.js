"use strict";

// Check if we got the necessary info from the environment, otherwise fail directly!
require("require-environment-variables")(["SLACK_WEBHOOK_URL"]);

// Load event listener
var MarathonEventListener = require("./lib/MarathonEventListener");

// Define options
var options = {
    marathonUrl: process.env.MARATHON_URL || "leader.mesos",
    marathonPort: process.env.MARATHON_PORT || 8080,
    marathonProtocol: process.env.MARATHON_PROTOCOL || "http",
    slackWebHook: process.env.SLACK_WEBHOOK_URL,
    slackChannel: process.env.SLACK_CHANNEL || "#marathon",
    logging: {
        level: process.env.LOG_LEVEL || "info"
    }
};

if (process.env.EVENT_TYPES) {
    if (process.env.EVENT_TYPES.indexOf(",") > -1) {
        options.eventTypes = process.env.EVENT_TYPES.split(","); 
    }
}

// Create event listener
var mel = new MarathonEventListener(options);

// Report connection
mel.on("connected", function (timestamp) {
    mel.logger.info("Connected to the Marathon Event Bus!");
});

// Report errors
mel.on("error", function (error) {
    mel.logger.error(JSON.stringify(error));
});

// Subscribe to Marathon event bus
mel.subscribe();