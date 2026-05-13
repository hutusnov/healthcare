data "aws_caller_identity" "current" {}

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1"
  ]
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    sid     = "GitHubActionsAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_owner}/${var.github_repo}:ref:refs/heads/main",
        "repo:${var.github_owner}/${var.github_repo}:ref:refs/heads/develop",
        "repo:${var.github_owner}/${var.github_repo}:pull_request",
        "repo:${var.github_owner}/${var.github_repo}:workflow_dispatch"
      ]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = var.role_name
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "aws_iam_policy_document" "deploy_permissions" {
  statement {
    sid    = "SSMSendCommandToBackendOnly"
    effect = "Allow"
    actions = [
      "ssm:SendCommand"
    ]
    resources = concat(
      [
        "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:document/AWS-RunShellScript"
      ],
      [
        for id in var.backend_instance_ids :
        "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/${id}"
      ]
    )
  }

  statement {
    sid    = "SSMReadCommandStatus"
    effect = "Allow"
    actions = [
      "ssm:GetCommandInvocation",
      "ssm:ListCommandInvocations",
      "ssm:ListCommands"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "github_actions_deploy_policy" {
  name   = "${var.role_name}-policy"
  policy = data.aws_iam_policy_document.deploy_permissions.json
}

resource "aws_iam_role_policy_attachment" "attach" {
  role       = aws_iam_role.github_actions_deploy.name
  policy_arn = aws_iam_policy.github_actions_deploy_policy.arn
}
