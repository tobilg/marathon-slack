"use strict";

// Testing require
const expect = require("chai").expect;
const sm = require("slack-mock");
const delay = require("delay");

const MarathonSlackBridge = require("../lib/MarathonSlackBridge");
const MarathonEventBusMockServer = require("marathon-event-bus-mock");

describe("marathon-slack", function () {
    describe("marathon version <= 1.3", function () {
        let slackMock;
        const botToken = 'xoxb-XXXXXXXXXXXX-TTTTTTTTTTTTTT';
        let marathonSlackBridge;

        before(function () {
            // wait for bot to get bootstrapped
            this.timeout(30000);
            slackMock = sm.instance;
    
            slackMock.reset();
    
            // Configure Marathon Slack Bridge
            marathonSlackBridge = new MarathonSlackBridge({
                marathonHost: "localhost",
                marathonPort: 8080,
                marathonProtocol: "http",
                slackWebHook: "https://hooks.slack.com/services/XXX/YYY/ZZZ",
                slackChannel: "#marathon",
                slackBotName: "Marathon Event Bot",
                publishTaskStatusUpdates: "true"
            });
    
            marathonSlackBridge.on("marathon_event", function (event) {
                console.log("Marathon event: " + JSON.stringify(event));
            });
    
            marathonSlackBridge.on("sent_message", function (message) {
                console.log("Sent message: " + JSON.stringify(message));
            });
    
            marathonSlackBridge.on("received_reply", function (message) {
                console.log("Received reply: " + JSON.stringify(message));
            });
    
            marathonSlackBridge.on("subscribed", function (event) {
                console.log(event.message);
            });
    
            marathonSlackBridge.on("unsubscribed", function (event) {
                console.log(event.message);
            });
    
            marathonSlackBridge.on("error", function (event) {
                console.log(event.message);
            });
    
    
            marathonSlackBridge.start();
    
        });

        after(function () {
            return slackMock.rtm.stopServer(botToken);
        });

        afterEach(function () {
            return slackMock.incomingWebhooks.reset();
        });

        describe("Using MarathonEventBusMockServer", function () {
            this.timeout(5000);

            const port = 8080;
            const server = new MarathonEventBusMockServer(port, true);
    
            before(server.listen.bind(server));
            after(server.close.bind(server));

            it("Should connect and receive a 'deployment_info' event", () => {

                return delay(250) // Wait for Marathon Slack Bridge startup
                    .then(() => {
                        return new Promise(function (resolve, reject) {
                            server.requestEvent("deployment_info");
                            resolve();
                        })
                    })
                    .then(delay(1000))
                    .then(() => {

                        expect(slackMock.incomingWebhooks.calls).to.have.length(1);

                        const firstCall = slackMock.incomingWebhooks.calls[0];

                        expect(firstCall.params.attachments[0].title).to.equal("Deployment info");

                    });

            });

            it("Should connect and receive a 'unhealthy_task_kill_event' event", () => {

                return delay(250) // Wait for Marathon Slack Bridge startup
                    .then(() => {
                        return new Promise(function (resolve, reject) {
                            server.requestEvent("unhealthy_task_kill_event");
                            resolve();
                        })
                    })
                    .then(delay(1000))
                    .then(() => {
                        expect(slackMock.incomingWebhooks.calls).to.have.length(1);

                        const firstCall = slackMock.incomingWebhooks.calls[0];

                        expect(firstCall.params.attachments[0].title).to.equal("Unhealthy task was killed");

                    });
            });

            it("Should connect and receive a 'status_update_event' event", () => {

                return delay(250) // Wait for Marathon Slack Bridge startup
                    .then(() => {
                        return new Promise(function (resolve, reject) {
                            server.requestEvent("status_update_event");
                            resolve();
                        })
                    })
                    .then(delay(1000))
                    .then(() => {
                        expect(slackMock.incomingWebhooks.calls).to.have.length(1);

                        const firstCall = slackMock.incomingWebhooks.calls[0];

                        expect(firstCall.params.attachments[0].title).to.equal("Task Status Update - Task running");

                    });
            });

            it("Should connect and receive a 'health_status_changed_event' event", () => {
                return delay(250) // Wait for Marathon Slack Bridge startup
                    .then(() => {
                        return new Promise(function (resolve, reject) {
                            server.requestEvent("health_status_changed_event");
                            resolve();
                        })
                    })
                    .then(delay(1000))
                    .then(() => {
                        expect(slackMock.incomingWebhooks.calls).to.have.length(1);

                        const firstCall = slackMock.incomingWebhooks.calls[0];

                        expect(firstCall.params.attachments[0].title).to.equal("App health check status changed");
                        expect(firstCall.params.attachments[0].text).to.include("task id");
                        expect(firstCall.params.attachments[0].text).to.not.include("undefined");
                    });
            });
        });
    });

    describe("marathon version 1.4.x", function () {
        let slackMock;
        const botToken = 'xoxb-XXXXXXXXXXXX-TTTTTTTTTTTTTT';
        let marathonSlackBridge;

        before(function () {
            // wait for bot to get bootstrapped
            this.timeout(30000);
            slackMock = sm.instance;
    
            slackMock.reset();
    
            // Configure Marathon Slack Bridge
            marathonSlackBridge = new MarathonSlackBridge({
                marathonHost: "localhost",
                marathonPort: 8081,
                marathonProtocol: "http",
                slackWebHook: "https://hooks.slack.com/services/XXX/YYY/ZZZ",
                slackChannel: "#marathon",
                slackBotName: "Marathon Event Bot",
                publishTaskStatusUpdates: "true"
            });
    
            marathonSlackBridge.on("marathon_event", function (event) {
                console.log("Marathon event: " + JSON.stringify(event));
            });
    
            marathonSlackBridge.on("sent_message", function (message) {
                console.log("Sent message: " + JSON.stringify(message));
            });
    
            marathonSlackBridge.on("received_reply", function (message) {
                console.log("Received reply: " + JSON.stringify(message));
            });
    
            marathonSlackBridge.on("subscribed", function (event) {
                console.log(event.message);
            });
    
            marathonSlackBridge.on("unsubscribed", function (event) {
                console.log(event.message);
            });
    
            marathonSlackBridge.on("error", function (event) {
                console.log(event.message);
            });
    
    
            marathonSlackBridge.start();
    
        });

        after(function () {
            return slackMock.rtm.stopServer(botToken);
        });

        afterEach(function () {
            return slackMock.incomingWebhooks.reset();
        });

        describe("Using MarathonEventBusMockServer", function () {
            this.timeout(5000);

            const port = 8081;
            const server = new MarathonEventBusMockServer(port);
    
            before(server.listen.bind(server));
            after(server.close.bind(server));

            it("Should connect and receive a 'deployment_info' event", () => {

                return delay(250) // Wait for Marathon Slack Bridge startup
                    .then(() => {
                        return new Promise(function (resolve, reject) {
                            server.requestEvent("deployment_info");
                            resolve();
                        })
                    })
                    .then(delay(1000))
                    .then(() => {

                        expect(slackMock.incomingWebhooks.calls).to.have.length(1);

                        const firstCall = slackMock.incomingWebhooks.calls[0];

                        expect(firstCall.params.attachments[0].title).to.equal("Deployment info");

                    });

            });

            it("Should connect and receive a 'unhealthy_task_kill_event' event", () => {

                return delay(250) // Wait for Marathon Slack Bridge startup
                    .then(() => {
                        return new Promise(function (resolve, reject) {
                            server.requestEvent("unhealthy_task_kill_event");
                            resolve();
                        })
                    })
                    .then(delay(1000))
                    .then(() => {
                        expect(slackMock.incomingWebhooks.calls).to.have.length(1);

                        const firstCall = slackMock.incomingWebhooks.calls[0];

                        expect(firstCall.params.attachments[0].title).to.equal("Unhealthy task was killed");

                    });
            });

            it("Should connect and receive a 'status_update_event' event", () => {

                return delay(250) // Wait for Marathon Slack Bridge startup
                    .then(() => {
                        return new Promise(function (resolve, reject) {
                            server.requestEvent("status_update_event");
                            resolve();
                        })
                    })
                    .then(delay(1000))
                    .then(() => {
                        expect(slackMock.incomingWebhooks.calls).to.have.length(1);

                        const firstCall = slackMock.incomingWebhooks.calls[0];

                        expect(firstCall.params.attachments[0].title).to.equal("Task Status Update - Task running");

                    });
            });

            it("Should connect and receive a 'health_status_changed_event' event", () => {

                return delay(250) // Wait for Marathon Slack Bridge startup
                    .then(() => {
                        return new Promise(function (resolve, reject) {
                            server.requestEvent("health_status_changed_event");
                            resolve();
                        })
                    })
                    .then(delay(1000))
                    .then(() => {
                        expect(slackMock.incomingWebhooks.calls).to.have.length(1);

                        const firstCall = slackMock.incomingWebhooks.calls[0];

                        expect(firstCall.params.attachments[0].title).to.equal("App health check status changed");
                        expect(firstCall.params.attachments[0].text).to.include("instance id");
                        expect(firstCall.params.attachments[0].text).to.not.include("undefined");
                    });
            });
        });
    });
});
