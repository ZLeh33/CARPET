import type {
  SerializedTaskComponent,
  SerialisedDependencies,
  ComponentDependencies,
  ComponentProps,
  ComponentData,
  NestedComponents
} from "@/components/taskComponents/TaskComponent";
import { TaskComponent } from "@/components/taskComponents/TaskComponent";
import type { CSSIDSelector } from "@/components/taskComponents/DragDrop/DragElement/DragElement";
import type { CSSIDSelectors } from "@/components/taskComponents/DragDrop/DropZone/DropZone";
import type { DropZoneCallBackHandler } from "@/components/taskComponents/DragDrop/DropZone/DropZone";
import { unref } from "vue";
import type { InteractEvent } from "@interactjs/types";

export interface ItemPalletProps extends ComponentProps {}

export type ItemPalletComponentType = "ItemPallet";

export interface SerializedItemPalletDependencies extends SerialisedDependencies {}

export interface ItemPalletDependencies extends ComponentDependencies {}

export type DroppedElements = Array<string>;
export interface DropData {
  [key: string]: any;
}

export interface DragElements {
  [dragElement: string]: {
    componentType: string;
    props: { [key: string]: any };
    elementSelector: CSSIDSelector;
    dropData: DropData;
  };
}

export interface DropZone {
  [dropZone: string]: {
    componentType: string;
    props: { [key: string]: any };
    accept: CSSIDSelectors;
    dropZoneBehaviour: keyof DropZoneBehaviours;
    droppedElements: DroppedElements;
  };
}

export interface ItemPalletComponentData extends ComponentData {
  dragElements: DragElements;
  dropZones: DropZone;
}

export interface ItemPalletNestedComponents extends NestedComponents {
  [nestedComponentName: string]: TaskComponent;
}

export interface SerializedItemPalletComponent
  extends SerializedTaskComponent<
    ItemPalletComponentType,
    SerializedItemPalletDependencies,
    ItemPalletComponentData,
    any,
    any,
    ItemPalletNestedComponents
  > {}

export interface DropZoneBehaviours {
  StoreDragElement: DropZoneCallBackHandler;
}

export class ItemPalletComponent extends TaskComponent<
  SerializedItemPalletComponent,
  SerializedItemPalletDependencies,
  SerializedItemPalletDependencies,
  ItemPalletComponentData,
  any,
  any,
  ItemPalletNestedComponents
> {
  /**
   * The ItemPalletComponent class is a derived taskComponent, that display a set of DragElements and DropZones.
   */
  public validate() {
    const isValid = false;

    return isValid;
  }

  public getDropZoneBehaviours(): DropZoneBehaviours {
    return { StoreDragElement: this.createStoreDragElementHandler() };
  }

  private createStoreDragElementHandler() {
    /**
     * This function injects the necessary data into the StoreDragElement callback handler,
     * due to the change of context of the `this`-keyword and returns the callback handler.
     */
    const componentData = this.getComponentData();
    const storeObject = this.storeObject;
    const componentPath = this.serialisedTaskComponentPath;

    return (event: InteractEvent) => {
      const dropZoneId = event?.target?.id;

      const dragElementID = event?.relatedTarget?.id;
      const droppedElements = unref(componentData).dropZones[dropZoneId].droppedElements;
      const newDroppedElements = droppedElements ? [...droppedElements, dragElementID] : [dragElementID];

      unref(storeObject).setProperty({
        path: `${componentPath}__component__dropZones__${dropZoneId}__droppedElements`,
        value: newDroppedElements
      });
    };
  }
}
