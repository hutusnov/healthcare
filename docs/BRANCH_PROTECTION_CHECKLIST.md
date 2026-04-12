# Branch Protection Checklist

Ap dung theo dung Task 5 trong plan: Gitflow + review truoc khi merge.

## Branches can protect

- `main`
- `develop`

## Settings for `main`

- Require a pull request before merging
- Require at least 1 approval
- Dismiss stale approvals when new commits are pushed
- Require conversation resolution before merging
- Restrict direct pushes
- Block force pushes
- Block branch deletion

## Settings for `develop`

- Require a pull request before merging
- Require at least 1 approval
- Dismiss stale approvals when new commits are pushed
- Require conversation resolution before merging
- Block force pushes
- Block branch deletion

## Recommended merge policy

- `feature/*` -> `develop`
- `bugfix/*` -> `develop`
- `release/*` -> `main`, then sync back to `develop`
- `hotfix/*` -> `main`, then sync back to `develop`

## Suggested repository rules

- Default branch: `main`
- Working integration branch: `develop`
- Prefer squash merge for feature and bugfix branches
- Delete branch after merge
- Do not commit directly to `main`

## GitHub UI path

`Repository -> Settings -> Branches -> Add branch protection rule`
