locals {
  alarm_actions = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []
}

data "aws_lb" "this" {
  arn = var.alb_arn
}

data "aws_lb_target_group" "this" {
  arn = var.target_group_arn
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.alarm_prefix}-alb-5xx"
  alarm_description   = "ALB HTTPCode_ELB_5XX_Count > 5 in 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions

  dimensions = {
    LoadBalancer = data.aws_lb.this.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_latency" {
  alarm_name          = "${var.alarm_prefix}-alb-latency-p95"
  alarm_description   = "ALB TargetResponseTime average > 1.5s in 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 1.5
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions

  dimensions = {
    LoadBalancer = data.aws_lb.this.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "tg_unhealthy_hosts" {
  alarm_name          = "${var.alarm_prefix}-tg-unhealthy-hosts"
  alarm_description   = "UnHealthyHostCount > 0 for target group"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions

  dimensions = {
    LoadBalancer = data.aws_lb.this.arn_suffix
    TargetGroup  = data.aws_lb_target_group.this.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "ec2_cpu_high" {
  for_each = toset(var.backend_instance_ids)

  alarm_name          = "${var.alarm_prefix}-ec2-${each.value}-cpu-high"
  alarm_description   = "EC2 CPUUtilization > 80% for 10 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions

  dimensions = {
    InstanceId = each.value
  }
}

resource "aws_cloudwatch_metric_alarm" "ec2_status_check_failed" {
  for_each = toset(var.backend_instance_ids)

  alarm_name          = "${var.alarm_prefix}-ec2-${each.value}-status-check-failed"
  alarm_description   = "EC2 StatusCheckFailed > 0 for 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Maximum"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions

  dimensions = {
    InstanceId = each.value
  }
}
