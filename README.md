# marathon-slack

[![NSP Status](https://nodesecurity.io/orgs/tobilg/projects/bb967956-9682-4b37-9e41-68852d242d7a/badge)](https://nodesecurity.io/orgs/tobilg/projects/bb967956-9682-4b37-9e41-68852d242d7a) [![Build Status](https://travis-ci.org/tobilg/marathon-slack.svg?branch=master)](https://travis-ci.org/tobilg/marathon-slack) 

Ben Smith: Heads up. I haven't put this on circle because we dont plan on doing active development. If you want to redeploy, you can build locally and push with the following commands.

[Log into docker] <br>
docker build -t marathon-slack . <br>
docker tag marathon-slack:latest 303214696237.dkr.ecr.us-east-1.amazonaws.com/marathon-slack:latest <br>
aws ecr get-login --region us-east-1 <br>
[run the command that gets returned] <br>
docker push 303214696237.dkr.ecr.us-east-1.amazonaws.com/marathon-slack:latest <br>

Then redeploy on marathon: http://mesos.xdotai-internal.net:8080/ui/#/apps/%2Fmarathon-slack

Listen to Marathon's Event Bus and send selected event types to a Slack WebHook!

## Preparations

The only preparation that needs to be performed is to add a new WebHook for your Slack team. You can do this by adding an [Incoming Webhook](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) via the `Add configuration` button on the Slack configuration page.

In the next step after clicking the button, you'll have to select the Slack channel to which you want to post the Marathon Event Bus messaged to. Either choose an existing one, or create a new channel like `#marathon`.

After you did that, you'll be guided to an overview page for your new Slack Webhook. Please copy the `Webhook URL`, because you'll need it in the next step. If you want, you can go back to the `Incoming Webhooks` overview page and select the newly created Webhook again. Then, scroll down to the `Integration settings` and customize the name and the icon for this integration if you want. To add a name and icon is *not mandatory* to be able to use `marathon-slack`. 

## Usage

You can configure `marathon-slack` via environment variables.

### Environment variables

* `MARATHON_HOST`: The Marathon Host (hostname or ip address) where Marathon lives. Default is `master.mesos`, so if you don't use Mesos DNS you'll have to specify this. If you want to use basic auth with Marathon, use `user:password@server.domain.com` as value. 
* `MARATHON_PORT`: The port under which Marathon is running. Default is `8080`.
* `MARATHON_PROTOCOL`: The protocol to access the Marathon API with. Can be either `http` or `https`. Default is `http`. 
* `SLACK_WEBHOOK_URL`: The Slack Webhook URL (**mandatory**).
* `SLACK_CHANNEL`: The name of the Slack channel to send the messages to (must contain `#`). Default is `#marathon`.
* `SLACK_BOT_NAME`: The name of the Slack bot to send the messages from. Default is `Marathon Event Bot`.
* `EVENT_TYPES`: The comma-separated list of event types you want to have sent to Slack. By default, all the below events are activated.
* `TASK_STATUSES`: The comma-separated list of Mesos TaskStatuses that you want to have sent to Slack. By default, the below statuses are activated if the environment variable `PUBLISH_TASK_STATUS_UPDATES` is set to `true`.
* `PUBLISH_TASK_STATUS_UPDATES`: Can be set to `true` if the TaskStatus update message should be published. Default is `false`.
* `HOST`: The IP address the API should listen on. Normally, this will be automatically provided by Marathon. Default is `0.0.0.0`.
* `PORT`: The port number on which the API should listen on. Normally, this will be automatically provided by Marathon. Default is `3000`.
* `APP_ID_REGEXES`: A string regular expression to filter events by their Marathon App Id. For example to send a slack message for **only** apps with id `"*-production"`. If you want multiple regular expressions, you can concatenate them with a comma.

### Event types

Each of the following event types is pushed to Slack if not configured via the `EVENT_TYPES` environment variables:

* `deployment_info`
* `deployment_success`
* `deployment_failed`
* `deployment_step_success`
* `deployment_step_failure`
* `group_change_success`
* `group_change_failed`
* `failed_health_check_event`
* `health_status_changed_event`
* `unhealthy_task_kill_event`

If `PUBLISH_TASK_STATUS_UPDATES` is set to `true`, the `status_update_event` event is handled as well. Please be aware that this may cause a lot of messages to be delivered to the specified Slack channel! If activated, you can use the `TASK_STATUSES` environment variable to specify the list of TaskStatuses you want to publish. If not, all the task status update messages will be published:

* `TASK_STAGING`
* `TASK_STARTING`
* `TASK_RUNNING`
* `TASK_FINISHED`
* `TASK_FAILED`
* `TASK_KILLING`
* `TASK_KILLED`
* `TASK_LOST`

An individual, formatted Slack message is currently only for these event types. If another event is received, it will be displayed with a default formatting of event type and timestamp. 

Please also see the Marathon Event Bus [docs](https://mesosphere.github.io/marathon/docs/event-bus.html).

## Running

### Installing on DC/OS as package

**Via CLI**

You need to create an `options.json` file locally, before you can install the package. This is because you have to add your individual Slack WebHook URL to the configuration.

An example:

```
{
  "marathon-slack": {
    "slack_webhook_url": "https://hooks.slack.com/services/...YOUR_WEBHOOK_URL..."
  }
}
```

The above is the minimal configuration necessary to start the `marathon-slack` package. You can also customize the Slack channel (property `slack_channel`) or the list of event types to be published (property `event_types`). For the full list of configuration options, see the [marathon.json.mustache file](https://github.com/mesosphere/universe/blob/version-3.x/repo/packages/M/marathon-slack/1/marathon.json.mustache).

Once you prepared the `options.json` file, you can install the package with the following command:

`dcos package install marathon-slack --options options.json`

You should then see the service `marathon-slack` running on the services tab in the DC/OS UI.

**Via Universe**

In the DC/OS Universe tab, either search for `slack`, or scroll down the list of package until you find the `marathon-slack` package. Then, click on the `Install` button. Once the modal window pops up, click on `Advanced Installation`. You can customize the settings for the package, the only thing you **have** to configure is the `slack_webhook_url`. This has to fit to the Slack WebHook's URL you created before. Then click on `Review and Install`, and if everything is ok, on `Install`.

You should then see the service `marathon-slack` running on the services tab in the DC/OS UI.

### Installing via Marathon

You can run this on Marathon like this:

```
{
  "id": "/marathon-slack",
  "cpus": 0.1,
  "mem": 128,
  "disk": 0,
  "instances": 1,
  "container": {
    "type": "DOCKER",
    "docker": {
      "image": "tobilg/marathon-slack:0.4.0",
      "network": "HOST",
      "privileged": false,
      "forcePullImage": true
    }
  },
  "env": {
    "SLACK_WEBHOOK_URL": "YOUR_WEBHOOK_URL"
  },
  "labels":{
    "MARATHON_SINGLE_INSTANCE_APP": "true"
  },
  "upgradeStrategy":{
    "minimumHealthCapacity": 0,
    "maximumOverCapacity": 0
  },
  "portDefinitions": [
    {
      "port": 0,
      "protocol": "tcp",
      "name": "api"
    }
  ],
  "requirePorts": false,
  "healthChecks": [
    {
      "protocol": "HTTP",
      "portIndex": 0,
      "path": "/health",
      "gracePeriodSeconds": 5,
      "intervalSeconds": 20,
      "maxConsecutiveFailures": 3
    }
  ]
}
``` 

Please replace `YOUR_WEBHOOK_URL` with your real Webhook URL. 

It's probably useful to limit the `EVENT_TYPES` to not receive a huge amount of messages. For example, `deployment_info,deployment_success,deployment_failed,failed_health_check_event,health_status_changed_event,unhealthy_task_kill_event` should cover the most important events, without adding too much details.
