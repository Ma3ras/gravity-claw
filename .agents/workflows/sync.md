---
description: Start processing pending tasks synced from Gravity Claw
---

1. Start a terminal command: `cd d:\ai\gravity-claw && npm run pull-tasks`
2. Look at the output. If the JSON array is completely empty `[]`, respond to the user: "Es gibt aktuell keine neuen Aufgaben von Gravity Claw." and end the workflow.
3. If there are tasks, pick the oldest pending task (the first one in the list).
4. Read the task carefully.
5. Create a new task boundary for the task. Use your best judgement to execute the instruction fully. If it requires updating files, write the code. If it requires creating a feature, implement it. Use read_file to understand the workspace.
6. Once you are completely finished with the task and have verified everything is working, start a terminal command: `cd d:\ai\gravity-claw && npm run complete-task <task_id>` to mark it as resolved in the database.
7. Inform the user you have finished the task. If there are more tasks in the array left, tell them they can run `/sync` again to do the next one.
