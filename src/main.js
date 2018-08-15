import Vue from 'vue'
import App from './App.vue'
import Auth from './Auth.vue'

Vue.config.debug = true;

new Vue({
    el: '#app',
    components: { App, Auth },
    data : {
        currentView : 'App'
    }
});

