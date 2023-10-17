<template>
  <div class="itemPallet" :style="props.style ?? {}">
    <div class="dragElements">
      <DragElement
        class="dragElement"
        v-for="(dragElement, dragElementName) in dragElements"
        :key="dragElementName"
        :elementSelector="dragElement.elementSelector"
      >
        <component
          :is="dragElement.componentType"
          v-bind="{ componentID, componentPath: nestedComponentPaths[dragElementName], storeObject, ...dragElement.props }"
        ></component>
      </DragElement>
    </div>
    <div class="dropZones">
      <DropZone
        v-for="(dropZone, dropZoneName) in dropZones"
        :key="dropZoneName"
        :dropZoneCB="dropZoneBehaviours[dropZone.dropZoneBehaviour]"
        :accept="dropZone.accept"
        :dropZoneName="String(dropZoneName)"
      >
        <component
          :is="dropZone.componentType"
          v-bind="{
            componentID,
            componentPath: nestedComponentPaths[dropZoneName],
            storeObject,
            ...dropZone.props,
            style: { width: '80%' }
          }"
        ></component>
      </DropZone>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * ItemPallet-component that provides a pallet of DragElements and DropZones.
 *
 */
import { toRefs, unref } from "vue";
import { ItemPalletComponent } from "@/components/taskComponents/DragDrop/ItemPallet/ItemPallet";
import type { ItemPalletProps } from "@/components/taskComponents/DragDrop/ItemPallet/ItemPallet";
import DropZone from "@/components/taskComponents/DragDrop/DropZone/DropZone.vue";
import DragElement from "@/components/taskComponents/DragDrop/DragElement/DragElement.vue";

const props = defineProps<ItemPalletProps>();
const reactiveProps = toRefs(props);
const { storeObject, componentID, componentPath } = reactiveProps;

const component = new ItemPalletComponent(storeObject, unref(componentID), unref(componentPath));
const componentData = component.getComponentData();
const { dragElements, dropZones } = unref(componentData);

const nestedComponentPaths = component.getNestedComponentPaths();

const dropZoneBehaviours = component.getDropZoneBehaviours();
</script>

<style scoped>
.itemPallet {
  display: flex;
  width: 100%;
  height: 100%;
  margin-right: auto;
  flex-direction: row;
  align-items: center;
}

.dragElements {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  width: 20%;
  height: 100%;
  background: darkgrey;
  box-shadow: 1px 0px 1px 0px black;
}

.dropZones {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 80%;
  height: 100%;
}
</style>
