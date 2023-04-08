import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    theme: 'darkTheme'
  },
  mutations: {
    changeTheme(state) {
      if (state.theme === 'darkTheme') {
        state.theme = 'lightTheme'
      } else {
        state.theme = 'darkTheme'
      }
    }
  },
  actions: {
  },
  modules: {
  }
})
