const fetch = require('node-fetch')
const Octokit = require('@octokit/rest')

const ARGV = process.argv
  .slice(2)
  .reduce((result, arg) => {
    const [ key, value ] = arg.split('=')
    return { ...result, [key.slice(2)]: value || true }
  }, {})
const { GITHUB_TOKEN } = process.env
const github = new Octokit({
  auth: `token ${GITHUB_TOKEN}`
})

async function githubQuery (query, variables = {}) {
  const request = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${GITHUB_TOKEN}`
    },
    body: JSON.stringify({
      query: query.replace(/\n/g, ''),
      variables: JSON.stringify(variables)
    })
  })
  const json = await request.json()

  if (json.errors) {
    throw new Error(json.errors[0].message)
  }

  return json.data
}

async function main () {
  if (!ARGV.org || !ARGV.monorepo) {
    throw new Error('org and monorepo args required')
  }

  const issueData = await githubQuery(`query ($org: String!) {
    organization(login: $org) {
      repositories(first: 100) {
        nodes {
          name
          issues(states: [OPEN], first: 100) {
            nodes {
              author {
                login
              }
              body
              number
              title
            }
          }
        }
      }
    }
  }`, { org: ARGV.org })
  const [monorepoOrg, monorepoName] = ARGV.monorepo.split('/')
  const excludedRepos = ARGV.exclude ? ARGV.exclude.split(',') : []

  for (const repo of issueData.organization.repositories.nodes) {
    const repoName = repo.name

    if (excludedRepos.includes(repoName)) continue

    for (const issue of repo.issues.nodes) {
      const payload = {
        owner: monorepoOrg,
        repo: monorepoName,
        title: `[${repoName}#${issue.number}] ${issue.title}`,
        body: `This issue was migrated from ${repoName} and was originally reported by @${issue.author.login}.\n\n---\n\n${issue.body}`
      }

      if (ARGV.dryrun) {
        console.log('creating issue')
        console.log(JSON.stringify(payload, null, 2))
        console.log('')
      } else {
        await github.issues.create(payload)
      }
    }
  }
}

main().catch(console.error)
