"use strict";

// Check if we got the necessary info from the environment, otherwise fail directly!
require("require-environment-variables")(["SLACK_WEBHOOK_URL"]);

// Instantiate Express.js (for the Marathon health checks)
const express = require("express");
const app = express();

// Instantiate Marathon Slack Bridge
const MarathonSlackBridge = require("./lib/MarathonSlackBridge");

// Configure Marathon Slack Bridge
const marathonSlackBridge = new MarathonSlackBridge({
    marathonHost: process.env.MARATHON_HOST || "master.mesos",
    marathonPort: process.env.MARATHON_PORT || 8080,
    marathonProtocol: process.env.MARATHON_PROTOCOL || "http",
    slackWebHook: process.env.SLACK_WEBHOOK_URL, // No default!
    slackChannel: process.env.SLACK_CHANNEL || "#marathon",
    slackBotName: process.env.SLACK_BOT_NAME || "Marathon Event Bot",
    eventTypes: process.env.EVENT_TYPES || null,
    taskStatuses: process.env.TASK_STATUSES || null,
    publishTaskStatusUpdates: process.env.PUBLISH_TASK_STATUS_UPDATES || "false",
    appIdRegExes: process.env.APP_ID_REGEXES || []
});

marathonSlackBridge.on("marathon_event", function(event) {
    console.log("Marathon event: " + JSON.stringify(event));
});

marathonSlackBridge.on("sent_message", function(message) {
    console.log("Sent message: " + JSON.stringify(message));
});

marathonSlackBridge.on("received_reply", function(message) {
    console.log("Received reply: " + JSON.stringify(message));
});

marathonSlackBridge.on("subscribed", function(event) {
    console.log("Subscribed to the Marathon Event Bus: " + JSON.stringify(event));
});

marathonSlackBridge.on("unsubscribed", function(event) {
    console.log("Unsubscribed to the Marathon Event Bus: " + JSON.stringify(event));
});

marathonSlackBridge.on("error", function(event) {
    console.log("Error: " + JSON.stringify(event));
});

// Start Marathon Slack Bridge
marathonSlackBridge.start();

// Define API options
let apiOptions = {
    port: process.env.PORT || 3000
};

// Define health check route
app.get('/health', function (req, res) {
    let healthCheckStatusCode = marathonSlackBridge.getHealthStatus();
    if (healthCheckStatusCode === 200) {
        res.send("OK");
    } else {
        res.status(healthCheckStatusCode).send();
    }
});

// Start Express.js server
const server = app.listen(apiOptions.port, function () {
    console.log("Express server listening on port " + server.address().port);
});
