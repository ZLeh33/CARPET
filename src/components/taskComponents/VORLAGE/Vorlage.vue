<template>
  <!-- element to render the VORLAGE in -->
  <div class="VORLAGE" :style="props.style ?? {}"></div>
</template>

<script lang="ts" setup>
import { toRefs, unref, computed, onBeforeUnmount } from "vue";
import { VORLAGEComponent } from "@/components/taskComponents/Vorlage/Vorlage";
import type { VORLAGEProps } from "@/components/taskComponents/Vorlage/Vorlage";

const props = defineProps<VORLAGEProps>();
const reactiveProps = toRefs(props);
const { storeObject, componentID, componentPath } = reactiveProps;

const component = new VORLAGEComponent(storeObject, unref(componentID), unref(componentPath));

const componentData = component.getComponentData();

const taskData = component.getTaskData();

const currentTaskGraphNode = component.getCurrentTaskGraphNode();

const dependencyPaths = component.getDependencyPaths();
</script>

<style></style>
