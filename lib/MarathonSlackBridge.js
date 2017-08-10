"use strict";

const EventEmitter = require("events").EventEmitter;
const util = require("util");

// Use the MarathonEventBusClient
const MarathonEventBusClient = require("marathon-event-bus-client");

// Use the SlackHandler
const SlackHandler = require("./SlackHandler");

/**
 * Represents a Marathon Slack Bridge
 * @constructor
 * @param {object} options - The option map object.
 */
function MarathonSlackBridge (options) {

    if (!(this instanceof MarathonSlackBridge)) {
        return new MarathonSlackBridge(options);
    }

    // Inherit from EventEmitter
    EventEmitter.call(this);

    let self = this;

    // Define Marathon options
    let marathonOptions = {
        marathonHost: options.marathonHost || process.env.MARATHON_HOST || "master.mesos",
        marathonPort: options.marathonPort || process.env.MARATHON_PORT || 8080,
        marathonProtocol: options.marathonProtocol || process.env.MARATHON_PROTOCOL || "http"
    };

    // Define event types
    self.eventTypes = [];

    // Define task statuses
    self.taskStatuses = [];

    // RegExes for filtering on appId
    self.appIdRegExes = [];

    // Overwrite default event types if defined via env var
    if (process.env.EVENT_TYPES) {
        // Use environment variable
        if (process.env.EVENT_TYPES.indexOf(",") > -1) {
            self.eventTypes = process.env.EVENT_TYPES.split(",");
        } else {
            self.eventTypes = [process.env.EVENT_TYPES];
        }
    } else {
        self.eventTypes = ["deployment_info", "deployment_success", "deployment_failed", "deployment_step_success", "deployment_step_failure", "group_change_success", "group_change_failed", "failed_health_check_event", "health_status_changed_event", "unhealthy_task_kill_event"];
    }

    // Check if TaskStatus updated should be published
    if (options.publishTaskStatusUpdates === "true") {
        self.eventTypes.push("status_update_event");
    }

    // Set the event types for the marathonOptions
    marathonOptions.eventTypes = self.eventTypes;

    // Handle event types if defined via options
    if (options.taskStatuses) {
        // Use environment variable
        if (options.taskStatuses.indexOf(",") > -1) {
            self.taskStatuses = options.taskStatuses.split(",");
        } else {
            self.taskStatuses = [options.taskStatuses];
        }
    } else {
        self.taskStatuses = ["TASK_STAGING", "TASK_STARTING", "TASK_RUNNING", "TASK_FINISHED", "TASK_FAILED", "TASK_KILLING", "TASK_KILLED", "TASK_LOST"]
    }

    // Handle appId RegExes
    if (process.env.APP_ID_REGEXES) {
        // Use environment variable
        if (process.env.APP_ID_REGEXES.indexOf(",") > -1) {
            process.env.APP_ID_REGEXES.split(",").forEach(function (regExp) {
                try {
                    self.appIdRegExes.push(new RegExp(regExp.toString(), "i"));
                } catch(e) {
                    console.log("The provided RegExp " + regExp + " isn't a valid regular expression!");
                }
            });
        } else {
            try {
                let regExp = process.env.APP_ID_REGEXES;
                self.appIdRegExes.push(new RegExp(regExp.toString(), "i"));
            } catch(e) {
                console.log("The provided RegExp " + regExp + " isn't a valid regular expression!");
            }
        }
    }

    // Health check status code
    self.healthCheckStatusCode = 503;

    // Instantiate SlackHandler
    self.slackHandler = new SlackHandler({
        slackWebHook: options.slackWebHook || process.env.SLACK_WEBHOOK_URL,
        slackChannel: options.slackChannel || process.env.SLACK_CHANNEL || "#marathon",
        slackBotName: options.slackBotName || process.env.SLACK_BOT_NAME || "Marathon Event Bot"
    });

    // Forward error events
    self.slackHandler.on("error", function(error) {
        self.emit("error", {
            timestamp: new Date().getTime(),
            message: "Error from SlackHandler: " + error
        });
    });

    // Forward sent_message events
    self.slackHandler.on("sent_message", function(message) {
        self.emit("sent_message", {
            timestamp: new Date().getTime(),
            message: message
        });
    });

    // Forward received_reply events
    self.slackHandler.on("received_reply", function(reply) {
        self.emit("received_reply", {
            timestamp: new Date().getTime(),
            message: reply
        });
    });

    marathonOptions.handlers = {};

    // Populate handler functions
    self.eventTypes.forEach(function (eventType) {
        // Set handler function
        marathonOptions.handlers[eventType] = function (type, data) {
            // Forward marathon_event events
            self.emit("marathon_event", {
                timestamp: new Date().getTime(),
                eventType: type,
                data: data
            });
            // Apply filter conditions
            if (self.filterEventsByAppId(data)) {
                // Apply status update filter
                if (type !== "status_update_event" || self.filterStatusUpdates(data)) {
                    // Render & send message
                    self.slackHandler.sendMessage(self.slackHandler.renderMessage({ type: type, data: data }));
                }
            }
        }
    });

    // Create MarathonEventBusClient instance
    self.mebc = new MarathonEventBusClient(marathonOptions);

    // Wait for "connected" event
    self.mebc.on("subscribed", function () {
        // Service is available
        self.healthCheckStatusCode = 200;
        // Emit subscribed event
        self.emit("subscribed", {
            timestamp: new Date().getTime(),
            message: "Subscribed to the Marathon Event Bus"
        });
    });

    // Wait for "unsubscribed" event
    self.mebc.on("unsubscribed", function () {
        // Service is unavailable
        self.healthCheckStatusCode = 503;
        // Forward unsubscribed event
        self.emit("unsubscribed", {
            timestamp: new Date().getTime(),
            message: "Unsubscribed from the Marathon Event Bus"
        });

    });

    // Catch error events
    self.mebc.on("error", function (errorObj) {
        // Forward error event
        self.emit("error", {
            timestamp: errorObj.timestamp,
            message: errorObj.error
        });
    });

}

// Inherit from EventEmitter
util.inherits(MarathonSlackBridge, EventEmitter);

// Wrapper for starting to listen to the Marathon Event Bus
MarathonSlackBridge.prototype.start = function () {
    // Subscribe to Marathon Event Bus
    this.mebc.subscribe();
};

// Wrapper for teardown
MarathonSlackBridge.prototype.stop = function () {
    // Unsubscribe from the Marathon Event Bus
    this.mebc.unsubscribe();
    setTimeout(function () {
        process.exit(0);
    }, 250);
};

// Return the health status
MarathonSlackBridge.prototype.getHealthStatus = function () {
    // Get health check status
    return this.healthCheckStatusCode;
};

MarathonSlackBridge.prototype.filterEventsByAppId = function (data) {
    let self = this;
    if (self.appIdRegExes.length === 0) {
        return true;
    } else {
        let useEvent = false;
        return self.appIdRegExes.some(function (regExp) {
            if (data.appId && regExp.test(data.appId.replace(/\//, ""))) {
                useEvent = true;
            } else if (data.currentStep && data.currentStep.actions){
                data.currentStep.actions.forEach(function(action){
                    if (regExp.test(action.app.replace(/\//, ""))) {
                        useEvent = true;
                    }
                });
            } else if (data.plan && data.plan.steps && data.plan.steps.length > 0) {
                data.plan.steps.forEach(function(step){
                    if (step.actions && step.actions.length > 0){
                        step.actions.forEach(function(action){
                            if (regExp.test(action.app.replace(/\//, ""))) {
                                useEvent = true;
                            }
                        });
                    }
                });
            }
            return useEvent === true;
        });
    }
};


MarathonSlackBridge.prototype.filterStatusUpdates = function (data) {
    let self = this;
    if (self.taskStatuses.length === 0) {
        return false;
    } else {
        return self.taskStatuses.indexOf(data.taskStatus) >= 0;
    }
};

module.exports = MarathonSlackBridge;
