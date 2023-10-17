import { defineStore } from "pinia";
import { reactive } from "vue";
import axios from "axios";

interface TaskOverview {
  taskList: Array<{ name: string }>;
}

export const taskOverviewStore = defineStore("taskOverview", {
  state: (): TaskOverview => ({
    taskList: reactive([])
  }),
  actions: {
    async fetchTasks() {
      const response = await axios.get("/api/fetchTasklist");
      const payload = <Array<string>>JSON.parse(response.data);
      this.taskList = payload.map((task) => ({ name: task }));
    }
  }
});
