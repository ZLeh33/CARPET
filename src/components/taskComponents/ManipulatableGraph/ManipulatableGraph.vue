<template>
  <ContextMenu :componentId="componentID" :methods="selectedMethods" :storeObject="storeObject">
    <div class="manipulatableGraph">
      <DOTGraph
        :style="props.style ?? {}"
        v-bind="{ componentID, storeObject, componentPath: nestedComponentPaths.DOTGraph, graphID: 'epc' }"
      />
    </div>
  </ContextMenu>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, toRefs, unref, watch } from "vue";
import type { Ref } from "vue";
import DOTGraph from "@/components/taskComponents/DOTGraph/DOTGraph.vue";
import ContextMenu from "@/components/taskComponents/mixins/ContextMenu.vue";
import { pollDOMElementRender } from "@/helpers/HelperFunctions";
import { getSelectedMethods } from "@/helpers/getSelectedMethods";
import { ManipulatableGraphComponent } from "@/components/taskComponents/ManipulatableGraph/ManipulatableGraph";
import type { ComponentProps } from "@/components/taskComponents/TaskComponent";

const props = defineProps<ComponentProps>();

const reactiveProps = toRefs(props);
const { storeObject, componentID, componentPath } = reactiveProps;
const { getProperty, setProperty } = unref(storeObject);

const component = new ManipulatableGraphComponent(storeObject, unref(componentID), unref(componentPath));
const nestedComponentPaths = component.getNestedComponentPaths();
const currentNode = component.getCurrentTaskGraphNode();

const componentData = component.getComponentData();

const dependencies = component.loadDependencies();
const dependencyPaths = component.getDependencyPaths();

const dotGraph = unref(dependencies).dotDescription;
const validationData = unref(dependencies).validationData;
const droppedElements = unref(dependencies).droppedElements;
const dragElements = unref(dependencies).dragElements;

const editableFields = unref(componentData).editableFields;
const dotUserGraph = unref(componentData).dotUserGraph;

watch(droppedElements, (newElements) => {
  if (newElements.length) {
    let newGraph = unref(dotUserGraph);
    for (const newElement of newElements) {
      const template = unref(dragElements)[newElement].dropData.dotTemplate;

      newGraph = newGraph.replace("{", `{\n${template}`);
    }
    // update userGraph
    unref(storeObject).setProperty({
      path: `${unref(componentPath)}__component__userGraph`,
      value: newGraph
    });

    // empty droppedElements
    unref(storeObject).setProperty({
      path: dependencyPaths.droppedElements,
      value: []
    });
  }
  console.log(unref(componentData).userGraph, `${unref(componentPath)}__component__userGraph`);
});

// const selectors = editableFields.map((field) => `g.node g[id="a_${field}"] text`);
const assignEventHandlers2 = () => {
  Array.from(document.querySelectorAll(selectors)).forEach((node) => {
    node.setAttribute("pointer-events", "visible");
    node.addEventListener("click", editSVGText);
  });
};

const editSVGText = (event: Event) => {
  const target = <HTMLElement>event.target;
  const propertyNode = <HTMLElement>target?.parentElement?.parentElement;
  const node = <HTMLElement>propertyNode.parentElement?.parentElement;
  const nodeProperty = <string>propertyNode.getAttribute("id")?.split("_")?.pop()?.trim();
  const nodeId = node?.getAttribute("id")?.split("_")?.pop()?.trim();

  const input = document.createElement("input");
  input.style.textAlign = "right";
  input.style.width = "20px";
  input.value = <string>target.textContent;
  input.onkeyup = (event) => {
    const input = event.target as unknown as HTMLInputElement;
    if (["Enter", "Escape"].includes(event.key)) {
      input.blur();
      return;
    }
    // TODO eventually shift logic into deep watcher, to make replays possible
    target.textContent = input.value;
    setProperty({ path: `${componentPath}__component__userValues__${nodeId}__${nodeProperty}`, value: input.value });
  };
  input.onblur = () => {
    foreignObject.remove();
    validate();
  };

  const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
  foreignObject.setAttribute("width", "100%");
  foreignObject.setAttribute("height", "100%");
  foreignObject.setAttribute("y", `${parseInt(<string>target?.getAttribute("y")) - 15}`);
  foreignObject.setAttribute("x", <string>target?.getAttribute("x"));
  foreignObject.append(input);

  const svg = target.parentNode;
  svg?.append(foreignObject);

  input.select();
};

const assignEventHandlers = () => {
  Array.from(document.querySelectorAll("g.node")).forEach((node) => {
    node.setAttribute("pointer-events", "visible");
    node.addEventListener("click", handleEdgeDrawing);
  });
};

onMounted(() => {
  pollDOMElementRender(".manipulatableGraph .node", assignEventHandlers);
  validate();
});
onUnmounted(() => {
  Array.from(document.querySelectorAll("g.node")).forEach((node) => node.removeEventListener("click", handleEdgeDrawing));
});

const handleEdgeDrawing = (event: Event) => {
  const target = <HTMLElement>event.currentTarget;
  const activeNode = document.querySelector("g.node.active");

  if (activeNode) {
    activeNode.classList.remove("active");
    activeNode.setAttribute("stroke", "");
    Array.from(activeNode.querySelectorAll("polygon")).forEach((node: SVGPolygonElement) =>
      node.setAttribute("stroke", "black")
    );

    const parentId = activeNode.id;
    const childId = target.id;
    const edge = `${parentId}:out -> ${childId}:in []`;
    const reverseEdge = `${childId}:out -> ${parentId}:in []`;
    if (parentId === childId || dotGraph.value.includes(reverseEdge)) return;

    if (dotGraph.value.includes(edge)) {
      setProperty({ path: dependencyPaths.dotDescription, value: unref(dotGraph).replace(edge, "") });
      pollDOMElementRender(".manipulatableGraph .node", () =>
        Array.from(document.querySelectorAll("g.node")).forEach((node) => node.setAttribute("pointer-events", "visible"))
      );
    } else {
      setProperty({
        path: dependencyPaths.dotDescription,
        value: unref(dotGraph).replace("}", `${edge} \n }`)
      });
      pollDOMElementRender(".manipulatableGraph .node", () =>
        Array.from(document.querySelectorAll("g.node")).forEach((node) => node.setAttribute("pointer-events", "visible"))
      );
    }
  } else {
    target.classList.add("active");
    target.setAttribute("stroke", "red");
    Array.from(target.querySelectorAll("polygon")).forEach((node: SVGPolygonElement) => node.setAttribute("stroke", "red"));
  }
  validate();
};

const validate = () => {
  // const solution = <string>unref(dependencies.validationData);
  // const expectedEdges = Array.from(solution.matchAll(/\d:out -> \d:in \[.*\]/g)).map((match) => match[0]);
  // const userGraph = unref(dependencies.dotDescription);
  // const userEdges = Array.from(userGraph.matchAll(/\d:out -> \d:in \[.*\]/g)).map((match) => match[0]);
  // const isValid =
  //   expectedEdges.every((edge) => userEdges.includes(edge)) && userEdges.every((edge) => expectedEdges.includes(edge));
  // setProperty({
  //   path: `${unref(componentPath)}__isValid`,
  //   value: isValid
  // });
};

const methods = {
  showSolution: () => {
    const solution = unref(validationData);
    setProperty({ path: dependencyPaths.dotDescription, value: solution });
    pollDOMElementRender(".manipulatableGraph .node", () =>
      Array.from(document.querySelectorAll("g.node")).forEach((node) => node.setAttribute("pointer-events", "visible"))
    );
    validate();
  }
};
const selectedMethods = getSelectedMethods(
  getProperty(`nodes__${currentNode}__components__${props.componentID}__methods`),
  methods
);
</script>

<style scoped>
.manipulatableGraph {
  width: 100%;
  height: 100%;
}
</style>
