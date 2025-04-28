<template>
  <input
    :class="`${elementId}__value`"
    :type="element.type"
    :value="element.value"
    :step="element.step"
    oninput="this.reportValidity()"
    @keyup="emitEvent"
    @focus="selectText"
    :readonly="isreadOnly === true ? true : false" 
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
    componentID: String,
    storeObject: Object
  },
  setup(props, { emit }) {
    
    
    const { store, getProperty, setProperty } = props.storeObject;
    const currentNode = computed(() => store.state.currentNode);
    const currentTask = computed(() => getProperty("currentTask"));
    const componentPath = `nodes__${currentNode.value}__components__${props.componentID}__component`;
    const valuepath = `${componentPath}__form__seed__value`
    const value = getProperty(valuepath);
    const lokalvalue = ref(value);
    
    const valueFromJson = ref<Object | null>(null);
    const valueFromJson_Key  = ref<string | null>(null);

    
    const emitEvent = (event) => {
      delay(
        "formFill",
        () => {
          
          //setProperty(valuepath,value);
          setProperty({
          path: `nodes__${currentNode.value}__components__${props.componentID}__component__form__seed__value`,
          value: value
          });
          
          event.target.blur();
          evaluateValue(props);
          emit("updateElement", event);
          
        },
        500
      );
    };

    const isreadOnly : string | any = computed(()=> getProperty(`nodes__${currentNode.value}__components__${props.componentID}__component__form__seed__readOnly` ));
    const selectText = (event) =>  {
      event.target.select(); // Wählt den gesamten Inhalt des Input-Felds aus

    }
    watch(lokalvalue,emitEvent);

    const findKey = (obj: Record<string, any>, key: string): any | undefined => {
      // Überprüfen, ob der Schlüssel im aktuellen Objekt vorhanden ist
      if (key in obj) {
        return obj[key]; // Wert zurückgeben, wenn Schlüssel gefunden
      }

      // Rekursiv durch die Werte gehen, wenn sie Objekte oder Arrays sind
      for (let k in obj) {
        const value = obj[k];
        
        // Falls der Wert ein Objekt oder Array ist, rekursiv weiter suchen
        if (value && typeof value === 'object') {
          const result = findKey(value, key);
          if (result !== undefined) {
            return result; // Wert zurückgeben, wenn gefunden
          }
        }
      }
      // Falls der Schlüssel nicht gefunden wurde
      return undefined;
    };
    const buildValue = (jsonData: Object, key: string): void => {
      let data : any = findKey(jsonData,key);
      if(data !== undefined){
        setProperty({
          path: `nodes__${currentNode.value}__components__${props.componentID}__component__form__seed__value`,
          value: data
          });
      } else {
        console.error(`Fehler: Schlüssel "${key}" nicht im Objekt gefunden.`);
      }
    };
    onMounted(async () => {
      // Annahme: getProperty gibt einen string oder null zurück
      const computedPath = computed(() => getProperty(`nodes__${currentNode.value}__components__${props.componentID}__component__form__seed__ValueFromJson`));
      if (computedPath.value) {
        valueFromJson.value = getProperty(computedPath.value); // Wert zuweisen

        valueFromJson_Key.value = getProperty(`nodes__${currentNode.value}__components__${props.componentID}__component__form__seed__ValueFromJson_Key`);
        //const datatmp : Array<any>= await loadJSONData(computedPath.value);
        if(valueFromJson.value != null && valueFromJson_Key.value) buildValue(valueFromJson.value , valueFromJson_Key.value);
      }

      evaluateValue(props);
    });
    
    return { emitEvent,selectText, isreadOnly };
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
