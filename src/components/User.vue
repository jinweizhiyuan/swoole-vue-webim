<template>
    <div class="card">
        <div class="header">
            <img class="avatar" v-bind:src="currentUser.avatar" v-bind:alt="currentUser.name">
            <p class="name">{{ currentUser.nickname }} </p>
            <div class="dot" v-bind:class="[ online ? 'dot-green' : 'dot-red' ]"></div>
        </div>
        <div class="search">
            <input type="text" placeholder="Search" v-on:keyup="onKeyup">
        </div>
    </div>
</template>

<script>
    import actions from '../vuex/actions'
    import getters from '../vuex/getters'
    import _ from 'lodash'

    export default {
        vuex: {
            getters : getters,
            actions : actions
        },
        data: {
            searchQueryIsDirty: false
        },
        methods: {
            onKeyup (e) {
                this.searchQueryIsDirty = true
                this.expensiveOperation(e.target.value)
                this.searchUser(e.target.value);
            },
            // 这是 debounce 实现的地方。
            expensiveOperation: _.debounce(function (v) {
                // this.isCalculating = true
                this.searchUser(v);
                this.searchQueryIsDirty = false
                // setTimeout(function () {
                //     this.isCalculating = false
                //     this.searchQueryIsDirty = false
                // }.bind(this), 1000)
            }, 500)
        }
    }
</script>

<style lang="less">
    .card{
        display: flex;
        flex-direction: column;
        padding: 20px 15px;
        border-bottom: 1px solid #24272c;

        .header{
            display: flex;
            flex-direction: row;

            img{
                width: 40px; 
                height: 40px;
            }

            p{
                font-size: 16px;
                align-self:center;
                margin-left: 15px;
            }
            .dot{
                width: 8px;
                height: 8px;
                border-radius: 50%;
                align-self: center;
                margin-left: 10px;
                background: #eee;
            }
            .dot-green{
                background: #00ff00;
            }
            .dot-red{
                background: #ff0000;
            }
        }

        .search{
            input{
                margin-top: 10px;
                width: 100%;
                background: #26292e;
                border: 1px solid #3a3a3a;
                height: 30px;
                border-radius: 4px;
                color: #fff;
                padding: 10px;
            }
        }
    }
</style>