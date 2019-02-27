# monorepo-issue-migrator

> Migrate Github issues from multiple repos into a single repo

## Use

### 1. Install deps

```sh
yarn
```

### 2. Populate environment variables

```sh
cp dotenv .env
```

### 3. Run

```
Usage: yarn migrate [args]

Required args
  --monorepo: `owner/name` format for the target repo
  --org: github org name to migrate issues from

Optional args
  --dryrun: log the actions it would take instead of doing it
  --exclude: comma separated list of repo names to exclude

Examples
  yarn migrate --org=fusionjs --monorepo=fusionjs/fusion
```
