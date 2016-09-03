# marathon-slack

Listen to Marathon's Event Bus and send selected event types to a Slack WebHook!

## Preparations

The only preparation that needs to be performed is to add a new WebHook for your Slack team. You can do this by adding an [Incoming Webhook](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) via the `Add configuration` button on the Slack configuration page.

In the next step after clicking the button, you'll have to select the Slack channel to which you want to post the Marathon Event Bus messaged to. Either choose an existing one, or create a new channel like `#marathon`.

After you did that, you'll be guided to an overview page for your new Slack Webhook. Please copy the `Webhook URL`, because you'll need it in the next step. If you want, you can go back to the `Incoming Webhooks` overview page and select the newly created Webhook again. Then, scroll down to the `Integration settings` and customize the name and the icon for this integration if you want. To add a name and icon is *not mandatory* to be able to use `marathon-slack`. 

## Usage

You can configure `marathon-slack` via environment variables.

### Environment variables

* `MARATHON_URL`: The Marathon URL (hostname or ip address) where Marathon lives. Default is `leader.mesos`, so if you don't use Mesos DNS you'll have to specify this. 
* `MARATHON_PORT`: The port under which Marathon is running. Default is `8080`.
* `MARATHON_PROTOCOL`: The protocol to access the Marathon API with. Can be either `http` or `https`. Default is `http`. 
* `SLACK_WEBHOOK_URL`: The Slack Webhook URL (**mandatory**).
* `SLACK_CHANNEL`: The name of the Slack channel to send the messages to (must contain `#`). Default is `#marathon`.
* `EVENT_TYPES`: The comma-separated list of event types you want to have sent to Slack, separated by comma. By default, all event types are activated. See below for a complete list.
* `LOG_LEVEL`: The log level (e.g. `info`, `debug`, `error`), default is `info`.

### Event types

Each of the following event types is exposed to Slack if not configured via the `EVENT_TYPES` environment variables:

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

Please also see the Marathon Event Bus [docs](https://mesosphere.github.io/marathon/docs/event-bus.html).

## Running

You can run this via Marathon

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
      "image": "tobilg/marathon-slack:0.1.0",
      "network": "HOST",
      "privileged": false,
      "parameters": [],
      "forcePullImage": true
    }
  },
  "env": {
    "SLACK_WEBHOOK_URL": "YOUR_WEBHOOK_URL"
  }
}
``` 

Please replace `YOUR_WEBHOOK_URL` with your real Webhook URL. 

It's probably useful to limit the `EVENT_TYPES` to not receive a huge amount of messages. For example, `deployment_info,deployment_success,deployment_failed,failed_health_check_event,health_status_changed_event,unhealthy_task_kill_event` should cover the most important events, without adding too much details.
