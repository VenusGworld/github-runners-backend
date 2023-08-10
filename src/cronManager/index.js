import cron from "node-cron";
import fetchGitHubRunners from "./jobs/fetchGitHubRunners";
import ACTIONS from "../services/config/actions";

class CronManager {
  constructor(io) {
    let result = {
      orgs_length: 0,
      run_count: 0,
      runner_count: 0,
      bmx_runner_count: 0,
      runners: []
    };

    (async () => {
      result = await fetchGitHubRunners();

      let lastIndex = result.runner_count > 5 ? 5 : result.runner_count;

      io.sockets.emit(ACTIONS.SEND_GITHUB_RUNNERS, {
        orgs_length: result.orgs_length,
        run_count: result.run_count,
        runner_count: result.runner_count,
        bmx_runner_count: result.bmx_runner_count,
        runners: result.runners.slice(0, lastIndex)
      });
    })()

    // un comment on dedicated server
    cron.schedule("0 * * * *", async () => {
      try {
        result = await fetchGitHubRunners();

        let lastIndex = result.runner_count > 5 ? 5 : result.runner_count;

        io.sockets.emit(ACTIONS.SEND_GITHUB_RUNNERS, {
          orgs_length: result.orgs_length,
          run_count: result.run_count,
          runner_count: result.runner_count,
          bmx_runner_count: result.bmx_runner_count,
          runners: result.runners.slice(0, lastIndex)
        });
      } catch (error) {
        console.log(error);
      }
    });

    io.on("connection", (socket) => {
      socket.on(ACTIONS.FETCH_GITHUB_RUNNERS, ({}) => {
        let lastIndex = result.runner_count > 5 ? 5 : result.runner_count;

        socket.emit(ACTIONS.SEND_GITHUB_RUNNERS, {
          orgs_length: result.orgs_length,
          run_count: result.run_count,
          runner_count: result.runner_count,
          bmx_runner_count: result.bmx_runner_count,
          runners: result.runners.slice(0, lastIndex)
        });
      })

      socket.on(ACTIONS.FETCH_GITHUB_PAGE_RUNNERS, ({searchValue, firstPageIndex, lastPageIndex}) => {
        if(firstPageIndex < 0 || lastPageIndex > result.runner_count) {
          return;
        }

        if(result.runners) {
          const tmpRunners = result.runners.filter((runner => {
            let flag = false;
            if(runner.os.includes(searchValue) || runner.status.includes(searchValue) || runner.name.includes(searchValue) || runner.repository.includes(searchValue) || runner.organization.includes(searchValue)) {
              flag = true;
            }
            if(runner.labels && runner.labels.length != 0) {
              for(let label of runner.labels) {
                if(label.name.includes(searchValue)) {
                  flag = true;
                }
              }
            }

            return flag;
          }))
  
          socket.emit(ACTIONS.SEND_GITHUB_RUNNERS, {
            orgs_length: result.orgs_length,
            run_count: result.run_count,
            runner_count: tmpRunners.length,
            bmx_runner_count: result.bmx_runner_count,
            runners: tmpRunners.slice(firstPageIndex, lastPageIndex)
          });
        }
      })
    })
  }
}

export default CronManager;
