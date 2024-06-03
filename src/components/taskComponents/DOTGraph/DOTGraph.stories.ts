import type { Meta, StoryObj } from "@storybook/vue3";

import DOTGraph from "./DOTGraph.vue";
import stores from "@/helpers/TaskGraphUtility";

const taskStore = stores.taskStore;

taskStore.setProperty({
  path: "dotDescription",
  value:
    "digraph G {\n  main -> parse -> execute;\n  main -> init;\n  main -> cleanup;\n  execute -> make_string;\n  execute -> printf\n  init -> make_string;\n  main -> printf;\n  execute -> compare;\n}"
});
taskStore.setProperty({
  path: "currentNode",
  value: 0
});
taskStore.setProperty({
  path: "nodes",
  value: []
});
taskStore.setProperty({
  path: "nodes__0",
  value: {}
});
taskStore.setProperty({
  path: "nodes__0__components",
  value: 0
});

const meta: Meta<typeof DOTGraph> = {
  component: DOTGraph,
  tags: ["autodocs"],
  title: "components/taskComponents/Graph/DOTGraph"
};

export default meta;
type Story = StoryObj<typeof DOTGraph>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/vue/api/csf
 * to learn how to use render functions.
 */
export const Default: Story = {
  render: (args) => ({
    components: { DOTGraph },
    setup() {
      return { args };
    },
    template: '<DOTGraph v-bind="args" />'
  }),
  args: {
    taskStore: taskStore,
    componentID: 0,
    dependencies: {
      DOTGraph: {
        dotDescription: "dotDescription"
      }
    }
  }
};
