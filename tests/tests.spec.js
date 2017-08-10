"use strict";

// Testing require
const expect = require("chai").expect;
const sinon = require("sinon");
let sm = require("slack-mock");
const delay = require("delay");

const MarathonSlackBridge = require("../lib/MarathonSlackBridge");
const MarathonEventBusMockServer = require("marathon-event-bus-mock");

const deploymentInfoEvent = {"timestamp":1496674217593,"eventType":"deployment_info","data":{"plan":{"id":"f223e02f-09af-49b4-9d6e-428abf09b15d","original":{"id":"/","apps":[{"id":"/mesos-dns","cmd":null,"args":null,"user":null,"env":{"MESOS_DNS_REFRESH":"10","MESOS_IP_SOURCES":"mesos,host","MESOS_ZK":"zk://172.17.11.101:2181,172.17.11.102:2181,172.17.11.103:2181/mesos","MESOS_DNS_EXTERNAL_SERVERS":"8.8.8.8,8.8.4.4","MESOS_DNS_HTTP_ENABLED":"true"},"instances":3,"cpus":0.2,"mem":128,"disk":0,"gpus":0,"executor":"","constraints":[["hostname","UNIQUE"]],"uris":[],"fetch":[],"storeUrls":[],"backoffSeconds":1,"backoffFactor":1.15,"maxLaunchDelaySeconds":3600,"container":{"type":"DOCKER","volumes":[],"docker":{"image":"registry:5000/mesos-dns:v0.5.2","network":"HOST","portMappings":[],"privileged":false,"parameters":[],"forcePullImage":false}},"healthChecks":[{"gracePeriodSeconds":30,"intervalSeconds":10,"timeoutSeconds":20,"maxConsecutiveFailures":3,"port":8123,"path":"/v1/version","protocol":"HTTP","ignoreHttp1xx":false}],"readinessChecks":[],"dependencies":[],"upgradeStrategy":{"minimumHealthCapacity":1,"maximumOverCapacity":1},"labels":{},"ipAddress":null,"version":"2017-05-31T13:43:12.378Z","residency":null,"secrets":{},"taskKillGracePeriodSeconds":null,"unreachableStrategy":{"inactiveAfterSeconds":300,"expungeAfterSeconds":600},"killSelection":"YOUNGEST_FIRST","ports":[10000],"portDefinitions":[{"port":10000,"protocol":"tcp","name":"default","labels":{}}],"requirePorts":false,"versionInfo":{"lastScalingAt":"2017-05-31T13:43:12.378Z","lastConfigChangeAt":"2017-05-31T13:43:12.378Z"}},{"id":"/test-sdoifhsoifh","cmd":"sleep 1000","args":null,"user":null,"env":{},"instances":1,"cpus":0.1,"mem":128,"disk":0,"gpus":0,"executor":"","constraints":[],"uris":[],"fetch":[],"storeUrls":[],"backoffSeconds":1,"backoffFactor":1.15,"maxLaunchDelaySeconds":3600,"container":null,"healthChecks":[],"readinessChecks":[],"dependencies":[],"upgradeStrategy":{"minimumHealthCapacity":1,"maximumOverCapacity":1},"labels":{},"ipAddress":null,"version":"2017-06-01T15:20:37.339Z","residency":null,"secrets":{},"taskKillGracePeriodSeconds":null,"unreachableStrategy":{"inactiveAfterSeconds":300,"expungeAfterSeconds":600},"killSelection":"YOUNGEST_FIRST","ports":[10001],"portDefinitions":[{"port":10001,"protocol":"tcp","name":"default","labels":{}}],"requirePorts":false,"versionInfo":{"lastScalingAt":"2017-06-01T15:20:37.339Z","lastConfigChangeAt":"2017-06-01T15:20:37.339Z"}},{"id":"/dsfsdfsdf","cmd":"sleep 1000","args":null,"user":null,"env":{},"instances":1,"cpus":0.1,"mem":128,"disk":0,"gpus":0,"executor":"","constraints":[],"uris":[],"fetch":[],"storeUrls":[],"backoffSeconds":1,"backoffFactor":1.15,"maxLaunchDelaySeconds":3600,"container":null,"healthChecks":[],"readinessChecks":[],"dependencies":[],"upgradeStrategy":{"minimumHealthCapacity":1,"maximumOverCapacity":1},"labels":{},"ipAddress":null,"version":"2017-06-01T15:21:04.792Z","residency":null,"secrets":{},"taskKillGracePeriodSeconds":null,"unreachableStrategy":{"inactiveAfterSeconds":300,"expungeAfterSeconds":600},"killSelection":"YOUNGEST_FIRST","ports":[10002],"portDefinitions":[{"port":10002,"protocol":"tcp","name":"default","labels":{}}],"requirePorts":false,"versionInfo":{"lastScalingAt":"2017-06-01T15:21:04.792Z","lastConfigChangeAt":"2017-06-01T15:21:04.792Z"}},{"id":"/blubtest","cmd":"sleep 1000","args":null,"user":null,"env":{},"instances":2,"cpus":0.1,"mem":128,"disk":0,"gpus":0,"executor":"","constraints":[],"uris":[],"fetch":[],"storeUrls":[],"backoffSeconds":1,"backoffFactor":1.15,"maxLaunchDelaySeconds":3600,"container":null,"healthChecks":[],"readinessChecks":[],"dependencies":[],"upgradeStrategy":{"minimumHealthCapacity":1,"maximumOverCapacity":1},"labels":{},"ipAddress":null,"version":"2017-06-01T15:38:54.139Z","residency":null,"secrets":{},"taskKillGracePeriodSeconds":null,"unreachableStrategy":{"inactiveAfterSeconds":300,"expungeAfterSeconds":600},"killSelection":"YOUNGEST_FIRST","ports":[10003],"portDefinitions":[{"port":10003,"protocol":"tcp","name":"default","labels":{}}],"requirePorts":false,"versionInfo":{"lastScalingAt":"2017-06-01T15:38:54.139Z","lastConfigChangeAt":"2017-06-01T15:22:42.344Z"}}],"pods":[],"groups":[],"dependencies":[],"version":"2017-06-01T15:38:54.139Z"},"target":{"id":"/","apps":[{"id":"/mesos-dns","cmd":null,"args":null,"user":null,"env":{"MESOS_DNS_REFRESH":"10","MESOS_IP_SOURCES":"mesos,host","MESOS_ZK":"zk://172.17.11.101:2181,172.17.11.102:2181,172.17.11.103:2181/mesos","MESOS_DNS_EXTERNAL_SERVERS":"8.8.8.8,8.8.4.4","MESOS_DNS_HTTP_ENABLED":"true"},"instances":3,"cpus":0.2,"mem":128,"disk":0,"gpus":0,"executor":"","constraints":[["hostname","UNIQUE"]],"uris":[],"fetch":[],"storeUrls":[],"backoffSeconds":1,"backoffFactor":1.15,"maxLaunchDelaySeconds":3600,"container":{"type":"DOCKER","volumes":[],"docker":{"image":"registry:5000/mesos-dns:v0.5.2","network":"HOST","portMappings":[],"privileged":false,"parameters":[],"forcePullImage":false}},"healthChecks":[{"gracePeriodSeconds":30,"intervalSeconds":10,"timeoutSeconds":20,"maxConsecutiveFailures":3,"port":8123,"path":"/v1/version","protocol":"HTTP","ignoreHttp1xx":false}],"readinessChecks":[],"dependencies":[],"upgradeStrategy":{"minimumHealthCapacity":1,"maximumOverCapacity":1},"labels":{},"ipAddress":null,"version":"2017-05-31T13:43:12.378Z","residency":null,"secrets":{},"taskKillGracePeriodSeconds":null,"unreachableStrategy":{"inactiveAfterSeconds":300,"expungeAfterSeconds":600},"killSelection":"YOUNGEST_FIRST","ports":[10000],"portDefinitions":[{"port":10000,"protocol":"tcp","name":"default","labels":{}}],"requirePorts":false,"versionInfo":{"lastScalingAt":"2017-05-31T13:43:12.378Z","lastConfigChangeAt":"2017-05-31T13:43:12.378Z"}},{"id":"/test-sdoifhsoifh","cmd":"sleep 1000","args":null,"user":null,"env":{},"instances":1,"cpus":0.1,"mem":128,"disk":0,"gpus":0,"executor":"","constraints":[],"uris":[],"fetch":[],"storeUrls":[],"backoffSeconds":1,"backoffFactor":1.15,"maxLaunchDelaySeconds":3600,"container":null,"healthChecks":[],"readinessChecks":[],"dependencies":[],"upgradeStrategy":{"minimumHealthCapacity":1,"maximumOverCapacity":1},"labels":{},"ipAddress":null,"version":"2017-06-01T15:20:37.339Z","residency":null,"secrets":{},"taskKillGracePeriodSeconds":null,"unreachableStrategy":{"inactiveAfterSeconds":300,"expungeAfterSeconds":600},"killSelection":"YOUNGEST_FIRST","ports":[10001],"portDefinitions":[{"port":10001,"protocol":"tcp","name":"default","labels":{}}],"requirePorts":false,"versionInfo":{"lastScalingAt":"2017-06-01T15:20:37.339Z","lastConfigChangeAt":"2017-06-01T15:20:37.339Z"}},{"id":"/dsfsdfsdf","cmd":"sleep 1000","args":null,"user":null,"env":{},"instances":1,"cpus":0.1,"mem":128,"disk":0,"gpus":0,"executor":"","constraints":[],"uris":[],"fetch":[],"storeUrls":[],"backoffSeconds":1,"backoffFactor":1.15,"maxLaunchDelaySeconds":3600,"container":null,"healthChecks":[],"readinessChecks":[],"dependencies":[],"upgradeStrategy":{"minimumHealthCapacity":1,"maximumOverCapacity":1},"labels":{},"ipAddress":null,"version":"2017-06-01T15:21:04.792Z","residency":null,"secrets":{},"taskKillGracePeriodSeconds":null,"unreachableStrategy":{"inactiveAfterSeconds":300,"expungeAfterSeconds":600},"killSelection":"YOUNGEST_FIRST","ports":[10002],"portDefinitions":[{"port":10002,"protocol":"tcp","name":"default","labels":{}}],"requirePorts":false,"versionInfo":{"lastScalingAt":"2017-06-01T15:21:04.792Z","lastConfigChangeAt":"2017-06-01T15:21:04.792Z"}},{"id":"/blubtest","cmd":"sleep 1000","args":null,"user":null,"env":{},"instances":2,"cpus":0.1,"mem":128,"disk":0,"gpus":0,"executor":"","constraints":[],"uris":[],"fetch":[],"storeUrls":[],"backoffSeconds":1,"backoffFactor":1.15,"maxLaunchDelaySeconds":3600,"container":null,"healthChecks":[],"readinessChecks":[],"dependencies":[],"upgradeStrategy":{"minimumHealthCapacity":1,"maximumOverCapacity":1},"labels":{},"ipAddress":null,"version":"2017-06-01T17:06:01.713Z","residency":null,"secrets":{},"taskKillGracePeriodSeconds":null,"unreachableStrategy":{"inactiveAfterSeconds":300,"expungeAfterSeconds":600},"killSelection":"YOUNGEST_FIRST","ports":[10003],"portDefinitions":[{"port":10003,"protocol":"tcp","name":"default","labels":{}}],"requirePorts":false,"versionInfo":{"lastScalingAt":"2017-06-01T17:06:01.713Z","lastConfigChangeAt":"2017-06-01T15:22:42.344Z"}}],"pods":[],"groups":[],"dependencies":[],"version":"2017-06-01T17:06:01.713Z"},"steps":[{"actions":[{"action":"RestartApplication","app":"/blubtest"}]}],"version":"2017-06-01T17:06:01.713Z"},"currentStep":{"actions":[{"action":"RestartApplication","app":"/blubtest"}]},"eventType":"deployment_info","timestamp":"2017-06-01T17:06:01.751Z"}};

describe("marathon-slack tests", function() {

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
            console.log(event.message);
        });

        marathonSlackBridge.on("unsubscribed", function(event) {
            console.log(event.message);
        });

        marathonSlackBridge.on("error", function(event) {
            console.log(event.message);
        });


        marathonSlackBridge.start();

    });

    after(function () {
        return slackMock.rtm.stopServer(botToken);
    });

    afterEach(function () {
        return slackMock.incomingWebhooks.reset();
    })

    describe("Using MarathonEventBusMockServer", function () {

        this.timeout(5000);

        const port = 8080;
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

    });

});
