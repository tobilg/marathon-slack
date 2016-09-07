"use strict";

var EventEmitter = require("events").EventEmitter;
var util = require("util");
var rp = require("request-promise");
var EventSource = require("eventsource");
var helpers = require("./helpers");

/**
 * Represents a Marathon Event Listener
 * @constructor
 * @param {object} options - The option map object.
 */
function MarathonEventListener (options) {

    if (!(this instanceof MarathonEventListener)) {
        return new MarathonEventListener(options);
    }

    // Inherit from EventEmitter
    EventEmitter.call(this);

    var self = this;

    self.allowedEventTypes = ["deployment_info", "deployment_success", "deployment_failed", "deployment_step_success", "deployment_step_failure", "group_change_success", "group_change_failed", "failed_health_check_event", "health_status_changed_event", "unhealthy_task_kill_event"];

    self.options = {};

    // Master discovery
    self.options.marathonUrl = options.marathonUrl || "master.mesos";
    self.options.marathonPort = parseInt(options.marathonPort) || 8080;
    self.options.marathonProtocol = options.marathonProtocol || "http";
    self.options.slackChannel = options.slackChannel || process.env.SLACK_CHANNEL || "#marathon";
    self.options.slackWebHook = options.slackWebHook || process.env.SLACK_WEBHOOK_URL;

    // Set the used eventTypes
    if (options.eventTypes && options.eventTypes.length > 0) {
        self.options.eventTypes = [];
            options.eventTypes.forEach(function (eventType) {
            if (self.allowedEventTypes.indexOf(eventType) > -1) {
                self.options.eventTypes.push(eventType);
            }
        });
    } else {
        // Just use the deployment events by default, to avoid channel flooding
        self.options.eventTypes = ["deployment_info", "deployment_success", "deployment_failed"];
    }

    // Logging
    self.logger = helpers.getLogger((options.logging && options.logging.path ? options.logging.path : null), (options.logging && options.logging.fileName ? options.logging.fileName : null), (options.logging && options.logging.level ? options.logging.level.toLowerCase() : null));

}

// Inherit from EventEmitter
util.inherits(MarathonEventListener, EventEmitter);

/**
 * Subscribes the MarathonEventListener to the Marathon Event Bus
 */
MarathonEventListener.prototype.subscribe = function () {

    var self = this,
        url = self.options.marathonProtocol + "://" + self.options.marathonUrl + ":" + self.options.marathonPort+"/v2/events";

    // Create EventSource for Marathon /v2/events endpoint
    var es = new EventSource(url);

    es.on("open", function () {
        self.emit("connected", { "timestamp": ((new Date().getTime())/1000) })
    });

    // Add event listeners
    self.options.eventTypes.forEach(function (type) {
        es.addEventListener(type, function (e) {
            self.handleEvent({ type: e.type, data: JSON.parse(e.data) });
        });
    });

};

MarathonEventListener.prototype.handleEvent = function (event) {

    var self = this;

    function clearDateString (dateString) {
        return "`" + dateString.replace("Z", "").replace("T", " ") + "`";
    }

    function buildUiLink (type, reference) {
        return " <http://" + self.options.marathonUrl + ":" + self.options.marathonPort + "/ui/#/" + type + "/" + encodeURIComponent(reference) + "|" + reference + ">"
    }

    function parseEvents (event) {

        var message = {
            "username": "Marathon Event Bot",
            "icon_url": "http://i.imgur.com/5FJDbGz.png",
            "mrkdwn": true
        };

        switch (event.type) {

            case "deployment_info":
                var attachment = {
                    "fallback": "Deployment was triggered.",
                    "title": "Deployment info",
                    "text": "The deployment `" + event.data.plan.id + "` triggered the following steps:",
                    "fields": [],
                    "color": "#0066cc",
                    "mrkdwn_in": ["text"],
                    "ts": (new Date().getTime()/1000)
                };
                var i = 1;
                event.data.plan.steps.forEach(function (step) {
                    step.actions.forEach(function (action) {
                        attachment.fields.push({
                            "title": i.toString() + ". " + (action.action ? action.action : (action.type ? action.type : "Step")),
                            "value": buildUiLink("apps", action.app),
                            "short": true
                        });
                        i++;
                    });
                });
                message.attachments = [attachment];
                break;
            case "deployment_success":
                var attachment = {
                    "fallback": "Deployment was successful.",
                    "title": "Deployment success",
                    "text": "The deployment `" + event.data.id + "` was completed successfully at " + clearDateString(event.data.timestamp),
                    "color": "#7CD197",
                    "mrkdwn_in": ["text"],
                    "ts": (new Date().getTime()/1000)
                };
                message.attachments = [attachment];
                break;
            case "deployment_failed":
                var attachment = {
                    "fallback": "Deployment failed.",
                    "title": "Deployment failed",
                    "text": "The deployment `" + event.data.id + "` failed at " + clearDateString(event.data.timestamp),
                    "color": "#ff0000",
                    "mrkdwn_in": ["text"],
                    "ts": (new Date().getTime()/1000)
                };
                message.attachments = [attachment];
                break;
            case "deployment_step_success":
                var attachment = {
                    "fallback": "Deployment step was completed.",
                    "title": "Deployment step(s) success",
                    "text": "The deployment `" + event.data.plan.id + "` completed the following steps:",
                    "fields": [],
                    "color": "#7CD197",
                    "mrkdwn_in": ["text"],
                    "ts": (new Date().getTime()/1000)
                };
                var i = 1;
                event.data.plan.steps.forEach(function (step) {
                    step.actions.forEach(function (action) {
                        attachment.fields.push({
                            "title": i.toString() + ". " + (action.action ? action.action : (action.type ? action.type : "Step")),
                            "value": buildUiLink("apps", action.app),
                            "short": true
                        });
                        i++;
                    });
                });
                message.attachments = [attachment];
                break;
            case "deployment_step_failure":
                var attachment = {
                    "fallback": "Deployment step failed.",
                    "title": "Deployment step(s) failed",
                    "text": "The deployment `" + event.data.plan.id + "` failed at the following steps:",
                    "fields": [],
                    "color": "#ff0000",
                    "mrkdwn_in": ["text"],
                    "ts": (new Date().getTime()/1000)
                };
                var i = 1;
                event.data.plan.steps.forEach(function (step) {
                    step.actions.forEach(function (action) {
                        attachment.fields.push({
                            "title": i.toString() + ". " + (action.action ? action.action : (action.type ? action.type : "Step")),
                            "value": buildUiLink("apps", action.app),
                            "short": true
                        });
                        i++;
                    });
                });
                message.attachments = [attachment];
                break;
            case "group_change_success":
                var attachment = {
                    "fallback": "Group change was completed.",
                    "title": "Group change completed",
                    "text": "The group `" + event.data.groupId + "` completed at " + clearDateString(event.data.timestamp) + ". See " + buildUiLink("groups", event.data.groupId),
                    "color": "#7CD197",
                    "mrkdwn_in": ["text"],
                    "ts": (new Date().getTime()/1000)
                };
                message.attachments = [attachment];
                break;
            case "group_change_failed":
                var attachment = {
                    "fallback": "Group change failed.",
                    "title": "Group change failed",
                    "text": "The group `" + event.data.groupId + "` failed at " + clearDateString(event.data.timestamp) + ". See " + buildUiLink("groups", event.data.groupId),
                    "color": "#ff0000",
                    "mrkdwn_in": ["text"],
                    "ts": (new Date().getTime()/1000)
                };
                message.attachments = [attachment];
                break;
            case "failed_health_check_event":
                var attachment = {
                    "fallback": "App health check failed.",
                    "title": "App health check failed",
                    "text": "The app `" + event.data.appId + "` (with task id `" + event.data.taskId + "`) failed it's health check at " + clearDateString(event.data.timestamp),
                    "color": "#ff9900",
                    "mrkdwn_in": ["text"],
                    "ts": (new Date().getTime()/1000)
                };
                message.attachments = [attachment];
                break;
            case "health_status_changed_event":
                var attachment = {
                    "fallback": "App health status changed.",
                    "title": "App health check status changed",
                    "text": "The app `" + event.data.appId + "` (with task id `" + event.data.taskId + "`) changed it's health check status at " + clearDateString(event.data.timestamp) + " to " + (event.data.alive ? "*healthy*" : "*unhealthy*"),
                    "color": (event.data.alive ? "#7CD197" : "#ff0000"),
                    "mrkdwn_in": ["text"],
                    "ts": (new Date().getTime()/1000)
                };
                message.attachments = [attachment];
                break;
            case "unhealthy_task_kill_event":
                var attachment = {
                    "fallback": "Unhealthy task was killed.",
                    "title": "Unhealthy task was killed",
                    "text": "The app `" + event.data.appId + "` had it's task with id `" + event.data.taskId + "` killed at " + clearDateString(event.data.timestamp) + " due to an '" + event.data.reason + "' error",
                    "color": "#ff0000",
                    "mrkdwn_in": ["text"],
                    "ts": (new Date().getTime()/1000)
                };
                message.attachments = [attachment];
                break;
            default:
                break;

        }

        return message;

    }

    function sendToSlack (message) {

        var options = {
            method: "POST",
            uri: self.options.slackWebHook,
            body: message,
            json: true // Automatically stringifies the body to JSON
        };

        rp(options)
            .then(function (parsedBody) {
                self.emit("sent_message", message);
            })
            .catch(function (error) {
                self.emit("error", error)
            });

    }

    // Filter event types
    if (self.options.eventTypes.indexOf(event.type) > -1) {
        // Emit event
        self.emit("received_event", event);
        // Parse event
        var message = parseEvents(event);
        // Log original event and parse message
        self.logger.debug("Original event: " + JSON.stringify(event));
        self.logger.debug("Parsed event message: " + JSON.stringify(message));
        // Send message to Slack
        sendToSlack(message);
    }

};

module.exports = MarathonEventListener;
