import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./registerServiceWorker";
import VTooltip from "v-tooltip";

import Matrix from "@/components/taskComponents/math/LinearAlgebra/Matrix.vue";
import DOTGraph from "@/components/taskComponents/DOTGraph/DOTGraph.vue";
import TaskConfiguration from "@/components/taskComponents/TaskConfiguration.vue";
import VisualGraphTraversal from "@/components/taskComponents/VisualGraphTraversal.vue";
import PathDisplay from "@/components/taskComponents/PathDisplay.vue";
import CodeEditor from "@/components/taskComponents/CodeEditor.vue";
import Output from "@/components/taskComponents/Output.vue";
import Dropdown from "@/components/taskComponents/Dropdown.vue";
import ContourPlot from "@/components/taskComponents/ContourPlot.vue";
import BackgroundGraph from "@/components/taskComponents/BackgroundGraph.vue";
import Equation from "@/components/taskComponents/math/Equation/Equation.vue";
import TexDisplay from "@/components/taskComponents/math/Equation/TexDisplay.vue";
import DijkstraTable from "@/components/taskComponents/dijkstra/DijkstraTable.vue";
import DijkstraGraph from "@/components/taskComponents/dijkstra/DijkstraGraph.vue";
import PlanGraph from "@/components/taskComponents/scheduling/PlanGraph.vue";
import EditableGraph from "@/components/taskComponents/EditableGraph.vue";
import GanttDiagram from "@/components/taskComponents/scheduling/GanttDiagram.vue";
import ManipulatableGraph from "@/components/taskComponents/ManipulatableGraph/ManipulatableGraph.vue";

const app = createApp(App);
app.use(store).use(router).use(VTooltip);
app
  .component("Matrix", TaskConfiguration)
  .component("DOTGraph", DOTGraph)
  .component("TaskConfiguration", Matrix)
  .component("VisualGraphTraversal", VisualGraphTraversal)
  .component("PathDisplay", PathDisplay)
  .component("CodeEditor", CodeEditor)
  .component("Output", Output)
  .component("Dropdown", Dropdown)
  .component("ContourPlot", ContourPlot)
  .component("BackgroundGraph", BackgroundGraph)
  .component("Equation", Equation)
  .component("TexDisplay", TexDisplay)
  .component("DijkstraTable", DijkstraTable)
  .component("DijkstraGraph", DijkstraGraph)
  .component("PlanGraph", PlanGraph)
  .component("EditableGraph", EditableGraph)
  .component("GanttDiagram", GanttDiagram)
  .component("ManipulatableGraph", ManipulatableGraph);

app.mount("#app");

declare global {
  interface Window {
    panzoom: any;
    delayed_methods: any;
    MathLex: any;
    MathJax: any;
  }
}
