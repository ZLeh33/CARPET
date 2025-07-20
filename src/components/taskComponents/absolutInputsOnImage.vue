<template>
    <div class="image-container-fix">
        <img :src="bildPath" alt="Bild konnte nicht hochgeladen werden!!!" class="background-image">
        <template v-if="inputFelds">
            <div class="field-container" v-for="item in inputFelds" :key="item.id"
                :style="{
                    position: 'absolute',
                    top: item.position.top,
                    left: item.position.left,
                }"
            >
                <input
                    :type="item.type" 
                    :placeholder="item.placeholder"
                    :min="item.min"
                    :max="item.max"
                    :value="handleValue(item)"
                    :style="{
                        background: 'black',
                        color: 'white',
                        height: item.height,
                        width: item.width,
                        position: 'absolute',
                        maxWidth: '100%',
                        maxHeight: '80%',
                    }"
                    @input="handleInput(item, $event)"
                    @mouseover="handleMouseOver(item,$event)" 
                    @mouseleave="handleMouseLeave(item)"
                />
                <span class="tooltiptext" :id="'tooltiptext'+ item.id" style="display: none;">{{ tooltipMessage }}</span>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
    import { get } from 'lodash';
    import { defineComponent, computed, ref, onMounted } from 'vue';
    import type { Ref } from 'vue';
    import $ from 'jquery';
    
    export default defineComponent({
        props: {
            componentID: Number,
            storeObject: Object
        },
        setup(props) {

            // Props destructuring to access storeObject and its methods
            const { store, getProperty , setProperty } = props.storeObject;

            // Computed property to get the current node from the store
            const currentNode = computed(() => store.state.currentNode);

            // Computed property to construct the component path dynamically
            const componentPath = computed(() => `nodes__${currentNode.value}__components__${props.componentID}__component`);

            /**
             * Function to load data from a given path using getProperty.
             * Converts the data to a string if it exists, otherwise returns null.
             * @param {string} path - The path to fetch data from.
             * @returns {string | null} - The fetched data as a string or null.
             */
            const loadData = (path: string) => {
                const data = getProperty(path);
                if (data !== null && data !== undefined) {
                    return data.toString();
                }
                return null;
            };

            // Computed property to fetch the image path from the component's data
            const bildPath: Ref<string| undefined> = computed(() => loadData(`${componentPath.value}__bildPath`));

            // Reactive object to store input field values
            const inputFelderValues = ref<{ [key: string]: string | number }>({});

            // Computed property to fetch input fields configuration from the component's data
            const inputFelds : Ref<Array<Object> | null> =  computed(() => getProperty(`${componentPath.value}__inputFelds`));

            // Reactive object to store values fetched from JSON
            let valuesFromJson : Object = ref({});

            // Fetches the JSON values if they exist in the component's data
            const valuesFromJson_check = getProperty(`${componentPath.value}__ValuesFromJson`);
            if(valuesFromJson_check) valuesFromJson = computed(() => getProperty(getProperty(`${componentPath.value}__ValuesFromJson`)));

            // Initializes the startValue for each input field if input fields exist
            if(inputFelds.value){
                inputFelds.value.forEach((element) => {
                    element.startValue = element.value;
                });
            }

            /**
             * Handles the value of an input field by checking if it exists in the JSON values.
             * If the key exists, it returns the corresponding value; otherwise, it returns the default value.
             * @param {Object} item - The input field object.
             * @returns {number} - The resolved value for the input field.
             */
            const handleValue = (item : Object) : number =>{
                if(valuesFromJson.value){
                    const key = item.ValueFromJson_Key;
                    if(key){
                        if(valuesFromJson.value[key]){
                            const value = valuesFromJson.value[key];
                            return value;
                        }
                    }
                }
                return item.value;
            }

            /**
             * Handles the input event for an input field.
             * Validates the input value against min and max constraints.
             * If valid, updates the input field values and sets the property in the store.
             * If invalid, resets the value to the start value after a delay.
             * @param {Object} item - The input field object.
             */
            const handleInput = (item: Object, event: Event) => {
                item.value = (event.target as HTMLInputElement).value;
                if(valuesFromJson.value)valuesFromJson.value[item.ValueFromJson_Key] = item.value;
                const value = item.value;
                if(value < item.max || value > item.min){
                    inputFelderValues.value[item.placeholder] = value;
                    setProperty({ path: `${componentPath.value}__inputFelderValues`, value: inputFelderValues });
                }
            };

            // Reactive variable to store the tooltip message
            const tooltipMessage = ref('');

            /**
             * Handles the mouse over event for an input field.
             * Displays a tooltip with min and max constraints near the input field.
             * Adjusts the tooltip position dynamically based on container boundaries.
             * @param {any} item - The input field object.
             * @param {Event} event - The mouse over event.
             */
            const handleMouseOver = (item: any, event: Event) => {
                const tooltipTextID = $(`#tooltiptext${item.id}`);
                $('.tooltiptext').hide();
                tooltipMessage.value = `min: ${item.min}, max: ${item.max}`; 
                const input = event.target as HTMLInputElement;
                if(tooltipTextID.length){
                    const rect = input.getBoundingClientRect();
                    const container = $('.image-container-fix').get(0);
                    if(container){
                        const containerBottom = container.getBoundingClientRect().bottom;
                        const tooltipHeight = tooltipTextID.outerHeight();
                        if(containerBottom && rect.bottom && tooltipHeight){
                            const inputCssHeight : number = Number(getComputedStyle(input).height.replace('px',''));
                            if (containerBottom - rect.bottom < tooltipHeight) {
                                tooltipTextID.css({top : `${inputCssHeight}%`});
                            } else {
                                tooltipTextID.css({top : `${100 - inputCssHeight}%`});
                            }
                        }
                    }
                }
                tooltipTextID.css("display", "block");
            };

            

            /**
             * Handles the mouse leave event for an input field.
             * Hides the tooltip and resets its position.
             * @param {Object} item - The input field object.
             */
            const handleMouseLeave = (item : Object) => {
                $('.tooltiptext').hide();
            };

            return {
                bildPath,
                inputFelds,
                handleInput,
                handleMouseOver,
                handleMouseLeave,
                tooltipMessage,
                handleValue
            }
        }
    });
</script>

<style>
.image-container-fix {
    position: relative;
    width: 100%;
    height: 100%;
    margin: 0 auto;
}

.background-image {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
}

.image-container-fix > template,
.image-container-fix > div {
    position: relative;
    z-index: 1;
}

.field-container{
    background-color: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100px;
    height: 100px;
    z-index: 1;
}

input:invalid {
  border: 3.5px solid red;
}
input:valid {
  border: 3.5px solid green;
}
.tooltiptext {
    width: 100%;
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 6px 12px;
    background-color: rgba(235, 227, 227, 0.85);
    color: #0c0c0c;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    white-space: normal;
    word-break: break-word;
    z-index: 9999;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    pointer-events: none;
    min-width: fit-content;
}

</style>
