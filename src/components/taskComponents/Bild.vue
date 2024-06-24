<template>
    <div>
        <img src="./FermentALADIN_bild.png" alt="Bild konnte nicht hochgeladen werden!!!">
    </div>
</template>


<script lang="ts">
    import { defineComponent, computed} from 'vue';

    export default defineComponent({
        props: {
            componentID: Number,        // ID der Komponente
            storeObject: Object         // Store-Objekt zur Datenhaltung
        },
        setup(props) {
            // Extrahiere store und getProperty Methode aus dem Store-Objekt
            const { store, getProperty } = props.storeObject;

            // den aktuellen Knoten des Zustands
            const currentNode = computed(() => store.state.currentNode);
            // Pfad zur Komponente
            const componentPath = computed(() => `nodes__${currentNode.value}__components__${props.componentID}__component`);
            

            
        }
    });
</script>


<style>

</style>