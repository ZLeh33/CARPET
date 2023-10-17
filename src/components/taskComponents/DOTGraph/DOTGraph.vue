<template>
  <!-- element to render the DOTGraph in -->
  <div class="dotGraph" :style="props.style ?? {}" :id="completeGraphID"></div>
</template>

<script lang="ts" setup>
import { onMounted, watch, toRefs, unref, computed } from "vue";
import { DOTGraphComponent } from "@/components/taskComponents/DOTGraph/DOTGraph";
import type { DOTGraphProps } from "@/components/taskComponents/DOTGraph/DOTGraph";
import { ensurePathExists } from "@/store/taskGraph";

import { graphviz } from "d3-graphviz";

/**
 * as defineProps is not available at runtime, destructuring props reactively needs to be done in two steps
 * https://github.com/vuejs/core/issues/4994#issuecomment-984311639
 * */
const props = defineProps<DOTGraphProps>();
const reactiveProps = toRefs(props);
const { storeObject, componentID, componentPath, graphID } = reactiveProps;

const component = new DOTGraphComponent(storeObject, unref(componentID), unref(componentPath));

const componentData = component.getComponentData();

const taskData = component.getTaskData();

const currentTaskGraphNode = component.getCurrentTaskGraphNode();

const dependencyPaths = component.getDependencyPaths();

const currentNodeData = computed(() => {
  return unref(storeObject).getProperty(`nodes__${currentTaskGraphNode}`);
});

const completeGraphID = unref(graphID)
  ? `graph_${unref(componentID)}_${unref(graphID)}`
  : `graph_${unref(componentID)}_default`;

const getDOTDescription = () => {
  const dependencies = component.loadDependencies();
  // TODO: perhaps handle user Error for DJINN?
  // -> throw Error and propagate to user?
  if (unref(unref(dependencies).dotDescription)) return unref(unref(dependencies).dotDescription);
  // fallback to componentData
  if (unref(componentData) && unref(componentData).dotDescription) return unref(componentData).dotDescription;
  // fallback to empty String
  return "";
};

const renderGraph = (description: string) => {
  graphviz(`#${completeGraphID}`, {
    fit: true,
    zoom: false,
    useWorker: false
  }).renderDot(description);
};

const renderIfGraph = () => {
  let dotDescription = "";
  if (component.validate()) {
    dotDescription = <string>getDOTDescription();
  }
  renderGraph(dotDescription);
};

console.log(unref(storeObject).store.state, dependencyPaths.dotDescription);

watch(
  taskData,
  () => {
    renderIfGraph();
  },
  { deep: true }
);
watch(
  unref(storeObject).store.state[dependencyPaths.dotDescription],
  () => {
    console.log("hello");
    renderIfGraph();
  },
  { deep: true }
);

onMounted(() => {
  renderIfGraph();
});
</script>

<style>
.dotGraph {
  display: flex;
  justify-items: center;
  align-content: center;
  width: 100%;
  height: 100%;
}

.dotGraph > svg {
  display: flex;
  justify-items: center;
  align-content: center;
  width: 100%;
  height: 100%;
}

.graph {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
</style>
