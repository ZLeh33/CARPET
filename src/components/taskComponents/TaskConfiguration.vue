<template>
  <div class="taskConfiguration">
    <DifficultyPicker :storeObject="storeObject" :componentID="props.componentID" v-if="isAdvancedUser" />
    <ParameterSelection :storeObject="storeObject" :componentID="props.componentID" v-else />
    <!-- 
    <BackendFormular :storeObject="storeObject" :componentID="props.componentID" v-else />-->
  </div>
</template>

<script lang="ts">
import { computed, watch } from "vue";
import DifficultyPicker from "@/components/taskComponents/DifficultyPicker.vue";
import ParameterSelection from "@/components/taskComponents/ParameterSelection.vue";
//import BackendFormular from "@/components/taskComponents/BackendFormular.vue";

export default {
  props: {
    componentID: Number,
    storeObject: Object
  },
  components: {
    DifficultyPicker,
    ParameterSelection,
    //BackendFormular
  },
  setup(props) {
    const { store, getProperty, setProperty } = props.storeObject;
    const isAdvancedUser = false;

    //const currentNode = computed(() => getProperty("currentNode"));
    const taskData = computed(() => getProperty("taskData"));
    
    /***********************Zakaria */
    const currentNode = computed(() => store.state.currentNode);
    const currentTask = computed(() => getProperty("currentTask"));
    const componentPath = computed(() => `nodes__${currentNode.value}__components__${props.componentID}__component`);
    /*
    const komponentNameJson = computed(() => `${componentPath.value}__KomponentName`);
    let komponentName =  undefined;
    if(komponentNameJson != null){
      komponentName = computed(() => loadData(`${componentPath.value}__KomponentName`));
      
      const loadData = (path: string) => {
        console.log('drin : ');
        const data = getProperty(path);
        if (data !== null && data !== undefined) {
            return data.toString();
        }
        return null;
      };

    }
    */
    watch(taskData, () => {
      setProperty({ path: `nodes__${currentNode.value}__components__${props.componentID}__isValid`, value: true });
    });

    return { isAdvancedUser,
              props,
              //komponentName
            };
  }
};
</script>

<style>
.taskConfiguration {
  width: 100%;
  height: 100%;
}
</style>
