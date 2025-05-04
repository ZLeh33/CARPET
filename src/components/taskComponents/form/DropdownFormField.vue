<template>
  <div class="form-group">
    <select :class="`${elementId}__initial`" @change="emitEvent" :value="element.initial">
      <option v-for="(option, i) in element.options" :key="i">
        {{ option }}
      </option>
    </select>
  </div>
</template>

<script lang="ts">
import { add, get, type forEach } from "lodash";
import { onMounted, computed, ref,watch } from "vue";

export default {
  name: "RangeFormField",
  props: {
    element: Object,
    elementId: String,
    storeObject: Object,
    componentID: Number,
  },
  setup(props, { emit }) {
    const { store, getProperty, setProperty } = props.storeObject;
    const currentTask = getProperty("currentTask");
    const currentNode = computed(() => store.state.currentNode);
    const { action  } = props.element;
    const path = `nodes__${currentNode}__components__${props.componentID}`;
    const OptionsFromJson = ref<Object | null>(null);
    const OptionsFromJson_Key = ref<string | null>(null);
    const executeAction = () => {
      const { instruction, type, key } = action;
      store.dispatch("fetchTaskData", {
        payload: { instruction, type: currentTask, task: currentTask, parameters: { [key]: props.element.initial } },
        endpoint: `${currentTask}/${instruction}`,
      });
    };
    
    
    // Funktion, um den Wert eines Schlüssels in einem verschachtelten Objekt zu finden
    const findKey = (obj: Record<string, any>, key: string): any | undefined => {
      // Überprüfen, ob der Schlüssel im aktuellen Objekt vorhanden ist
      if (obj && key in obj) {
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
        } else if (value === key) {
          // Falls der Wert selbst dem gesuchten Schlüssel entspricht
          return value;
        }
      }

      // Falls der Schlüssel nicht gefunden wurde
      return undefined;
    };
    const buildOptionsData = (jsonData: Record<string, any>, key: string): void => {
      let data : any = findKey(jsonData,key);
      //console.log(data);
      if(Array.isArray(data)){
        let i = 0;
        const options = data.map((option) => String(option)); // Konvertiere alle Optionen zu Strings
        props.element.options = options; // Zuweisung direkt an options
        props.element.initial = options[0];
      }
      else if(!Array.isArray(data) && data){
        props.element.options  = [String(data)];
        props.element.initial = [String(data)];
        //console.log(data);
      }
      else {
        console.error(`Fehler: Schlüssel "${key}" nicht im Objekt gefunden.`);
      }
    };
    
    onMounted(async () => {
      // Annahme: getProperty gibt einen string oder null zurück
      const computedPath = computed(() => getProperty(`nodes__${currentNode.value}__components__${props.componentID}__component__form__nodeAmount__OptionsFromJson`));
      if (computedPath.value) {
        OptionsFromJson.value = getProperty(computedPath.value); // Wert zuweisen
        OptionsFromJson_Key.value  = getProperty(`nodes__${currentNode.value}__components__${props.componentID}__component__form__nodeAmount__OptionsFromJson_Key`);
        
        if(OptionsFromJson.value && OptionsFromJson_Key.value){
          buildOptionsData(OptionsFromJson.value , OptionsFromJson_Key.value);
        }
      }
      executeAction();
    });
    
    // Hier wird die Methode `emitEvent` definiert, die das Event auslöst
    // und die Aktion ausführt
    const emitEvent = (event : any) => {
      emit("updateElement", event);
      executeAction();
    };
    return { emitEvent};
  },
};
</script>

<style scoped>
select {
  width: 100%;
  border-radius: 5px;
  text-align-last: center;
  text-align: center;
}

</style>
