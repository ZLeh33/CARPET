import type {
  SerializedTaskComponent,
  SerialisedDependencies,
  ComponentDependencies,
  TaskGraphPath,
  ComponentProps,
  ComponentData
} from "@/components/taskComponents/TaskComponent";
import { TaskComponent } from "@/components/taskComponents/TaskComponent";
import type { ComputedRef } from "vue";
import { unref } from "vue";

export interface VORLAGEProps extends ComponentProps {
  graphID?: string | number;
}

export type VORLAGEComponentType = "DOTGraph";

export interface serialisedVORLAGEDependencies extends SerialisedDependencies {
  VORLAGE?: TaskGraphPath;
}

export interface VORLAGEDependencies extends ComponentDependencies {
  VORLAGE?: ComputedRef<string>;
}

export interface VORLAGEComponentData extends ComponentData {
  VORLAGE?: string;
}

export interface SerializedVORLAGEComponent
  extends SerializedTaskComponent<VORLAGEComponentType, VORLAGEDependencies, VORLAGEComponentData> {}

export class VORLAGEComponent extends TaskComponent<
  SerializedVORLAGEComponent,
  serialisedVORLAGEDependencies,
  VORLAGEDependencies,
  VORLAGEComponentData
> {
  /**
   * The VORLAGEComponent class is a derived taskComponent, that is a template for actual CARPET UI-Elements.
   */
  public validate() {
    let isValid = true;
    unref(this.storeObject).setProperty({ path: `${this.serialisedTaskComponentPath}__isValid`, value: isValid });

    return isValid;
  }
}
