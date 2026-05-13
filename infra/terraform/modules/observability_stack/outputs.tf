output "alarm_names" {
  value = concat(
    [
      aws_cloudwatch_metric_alarm.alb_5xx.alarm_name,
      aws_cloudwatch_metric_alarm.alb_latency.alarm_name,
      aws_cloudwatch_metric_alarm.tg_unhealthy_hosts.alarm_name
    ],
    values(aws_cloudwatch_metric_alarm.ec2_cpu_high)[*].alarm_name,
    values(aws_cloudwatch_metric_alarm.ec2_status_check_failed)[*].alarm_name
  )
}
