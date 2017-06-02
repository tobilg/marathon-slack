"use strict";

// Check if we got the necessary info from the environment, otherwise fail directly!
require("require-environment-variables")(["SLACK_WEBHOOK_URL"]);

// Use the MarathonEventBusClient
const MarathonEventBusClient = require("marathon-event-bus-client");
const SlackHandler = require("./lib/SlackHandler");

// Define Marathon options
let options = {
    marathonHost: process.env.MARATHON_HOST || "master.mesos",
    marathonPort: process.env.MARATHON_PORT || 8080,
    marathonProtocol: process.env.MARATHON_PROTOCOL || "http",
    whitelistRegEx: []
};

// Instantiate SlackHandler
const slackHandler = new SlackHandler({
    slackWebHook: process.env.SLACK_WEBHOOK_URL,
    slackChannel: process.env.SLACK_CHANNEL || "#marathon",
    slackBotName: process.env.SLACK_BOT_NAME || "Marathon Event Bot"
});

// Define relevant event types
if (process.env.EVENT_TYPES) {
    // Use environment variable
    if (process.env.EVENT_TYPES.indexOf(",") > -1) {
        options.eventTypes = process.env.EVENT_TYPES.split(",");
    } else {
        options.eventTypes = [process.env.EVENT_TYPES];
    }
} else { // Use the default
    options.eventTypes = ["deployment_info", "deployment_success", "deployment_failed", "deployment_step_success", "deployment_step_failure", "group_change_success", "group_change_failed", "failed_health_check_event", "health_status_changed_event", "unhealthy_task_kill_event"]
}

if (process.env.APP_ID_REGEX) {
    // Use environment variable
    if (process.env.APP_ID_REGEX) {
        options.whitelistRegEx = [process.env.APP_ID_REGEX];
    } else {
        options.whitelistRegEx = [];
    }
    options.whitelistRegEx = options.whitelistRegEx.map(function(rx) { return new RegExp(rx); });
} else { // Use the default
    options.whitelistRegEx = []; 
}

// Placeholder for the handler functions
let handlers = {};

// Populate handler functions
options.eventTypes.forEach(function (eventType) {
    handlers[eventType] = function (name, data) {
        if (options.whitelistRegEx.length > 0) {
          var events = slackHandler.filterEventsByAppId(data,options.whitelistRegex[0]);
          events.forEach(function(ev) { 
            slackHandler.sendMessage(slackHandler.renderMessage({ type: name, data: ev }));
        } else {
          slackHandler.sendMessage(slackHandler.renderMessage({ type: name, data: data }));
        }
    }
});

// Add handlers to options
options.handlers = handlers;

// Create MarathonEventBusClient instance
const mebc = new MarathonEventBusClient(options);

// Wait for "connected" event
mebc.on("subscribed", function () {
    console.log("Subscribed to the Marathon Event Bus");
});

// Wait for "unsubscribed" event
mebc.on("unsubscribed", function () {
    console.log("Unsubscribed from the Marathon Event Bus");
});

// Catch error events
mebc.on("error", function (errorObj) {
    console.log("Got an error on " + errorObj.timestamp + ":");
    console.log(JSON.stringify(errorObj.error));
});

// Subscribe to Marathon Event Bus
mebc.subscribe();
