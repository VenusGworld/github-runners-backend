import axios from 'axios';

const fetchGitHubRunners = async () => {
  const jwtToken = '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';
  let repos = [];
  let runs_count = 0;
  let runners = [];
  let runner_count = 0;
  let bmx_runner_count = 0;

  try {
    // const { data: orgs } = await axios.get('https://api.github.com/user/orgs', {
    //   headers: {
    //     Authorization: `Bearer ${jwtToken}`,
    //   }
    // });
    const orgs=[{
      login: 'raph-innovation'
    }]

    
    for(const org of orgs) {
      const { data: reps} = await axios.get(`https://api.github.com/orgs/${org.login}/repos`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        }
      })
      repos.push(...reps);
    }

    for(const repo of repos) {
      const res = await axios.get(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/actions/runs`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        }
      })
      runs_count += res.data.total_count;
    }

    for(const repo of repos) {
      const res = await axios.get(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/actions/runners`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        }
      })
      let tmp_runners = [];
      for(const runner of res.data.runners) {
        if(runner.labels && runner.labels.length != 0) {
          for(let label of runner.labels) {
            if(label.name === 'bmx-runner') {
              bmx_runner_count ++;
              break;
            }
          }
        }
        tmp_runners.push({
          ...runner,
          repository: repo.name,
          organization: repo.owner.login
        });
      }
      runners.push(...tmp_runners);
      runner_count += tmp_runners.length;
    }

    return {
      orgs_length: orgs.length,
      run_count: runs_count,
      bmx_runner_count: bmx_runner_count,
      runner_count: runner_count,
      runners: runners,
    }
  } catch (error) {
    console.log('Cron_FetchGitHubRunners', error.message);
  }
}

export default fetchGitHubRunners;