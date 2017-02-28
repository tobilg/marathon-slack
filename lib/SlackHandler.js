"use strict";

const EventEmitter = require("events").EventEmitter;
const util = require("util");
const rp = require("request-promise");

/**
 * Represents a Marathon Event Listener
 * @constructor
 * @param {object} options - The option map object.
 */
function SlackHandler (options) {

    if (!(this instanceof SlackHandler)) {
        return new SlackHandler(options);
    }

    // Inherit from EventEmitter
    EventEmitter.call(this);

    let self = this;

    self.slackWebHook = options.slackWebHook|| process.env.SLACK_WEBHOOK_URL;
    self.slackChannel = options.slackChannel || process.env.SLACK_CHANNEL || "#marathon";
    self.slackBotName = options.slackBotName || process.env.SLACK_BOT_NAME || "Marathon Event Bot"
    self.marathonUrl = options.marathonUrl;
    self.marathonPort = options.marathonPort;

}

// Inherit from EventEmitter
util.inherits(SlackHandler, EventEmitter);

SlackHandler.prototype.renderMessage = function (event) {

    let self = this;

    function clearDateString (dateString) {
        return "`" + dateString.replace("Z", "").replace("T", " ") + "`";
    }

    function buildUiLink (type, reference) {
        return " <http://" + self.marathonUrl + ":" + self.marathonPort + "/ui/#/" + type + "/" + encodeURIComponent(reference) + "|" + reference + ">"
    }

    function parseEvents (event) {

        let message = {
            "username": self.options.slackBotName,
            "icon_url": "http://i.imgur.com/5FJDbGz.png",
            "mrkdwn": true
        };

        let attachment = {};

        switch (event.type) {

            case "deployment_info":
                attachment = {
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
                attachment = {
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
                attachment = {
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
                attachment = {
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
                attachment = {
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
                attachment = {
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
                attachment = {
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
                attachment = {
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
                attachment = {
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
                attachment = {
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

    return parseEvents(event);

};

SlackHandler.prototype.sendMessage = function (message) {

    let self = this;

    let options = {
        method: "POST",
        uri: self.slackWebHook,
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

};

module.exports = SlackHandler;
