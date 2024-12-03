<template>
  <input
    :class="`${elementId}__value`"
    :type="element.type"
    :value="element.value"
    :step="element.step"
    oninput="this.reportValidity()"
    @keyup="emitEvent"
    @focus="selectText"
    v-if="readOnly" readonly
  />
</template>

<script lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { evaluateValue } from "./validation";
import { delay } from "@/helpers/HelperFunctions.ts";

export default {
  name: "RangeFormField",
  props: {
    element: Object,
    elementId: String,
    /************Zakaria ***********************************/
    componentID: String,
    storeObject: Object
    /*******************end ******************************/
  },
  setup(props, { emit }) {
    
    
    const { store, getProperty, setProperty } = props.storeObject;
    const currentNode = computed(() => store.state.currentNode);
    const currentTask = computed(() => getProperty("currentTask"));
    const componentPath = `nodes__${currentNode.value}__components__${props.componentID}__component`;
    const valuepath = `${componentPath}__form__seed__value`
    const value = getProperty(valuepath);
    const lokalvalue = ref(value);
    

    
    const emitEvent = (event) => {
      delay(
        "formFill",
        () => {
          
          /**********************************Zakaria *********************************************/
          //setProperty(valuepath,value);
          setProperty({
          path: `nodes__${currentNode.value}__components__${props.componentID}__component__form__seed__value`,
          value: value
          });
          event.target.blur();
          /************************************End *************************************************/
          evaluateValue(props);
          emit("updateElement", event);
          
        },
        500
      );
    };

    const readOnly = computed(()=> `nodes__${currentNode.value}__components__${props.componentID}__component__form__seed__readOnly` );
    const selectText = (event) =>  {
      event.target.select(); // Wählt den gesamten Inhalt des Input-Felds aus

    }
    watch(lokalvalue,emitEvent);
    onMounted(() => {
      evaluateValue(props);
    });

    return { emitEvent,selectText, readOnly };
  },
};
</script>

<style scoped>
input {
  margin: 5px;
  width: 50px;
  border-radius: 5px;
  text-align: center;
  border: 3px solid black;
}

input:focus {
  outline: none;
}

input.invalid {
  border: 3px solid red;
}

input.valid {
  border: 3px solid green;
}
</style>
