import Vue from 'vue'
import VueRouter from 'vue-router'

// 懒加载路由
// const Home = () => import( /* webpackChunkName: "data-views" */ "views/Home")
// const SellerPage = () => import( /* webpackChunkName: "data-views" */ "views/SellerPage")
// const TrendPage = () => import( /* webpackChunkName: "data-views" */ "views/TrendPage")
// const MapPage = () => import( /* webpackChunkName: "data-views" */ "views/MapPage")
// const RankPage = () => import( /* webpackChunkName: "data-views" */ "views/RankPage")
// const HotPage = () => import( /* webpackChunkName: "data-views" */ "views/HotPage")
// const StockPage = () => import( /* webpackChunkName: "data-views" */ "views/StockPage")

// 普通方式
import Home from "views/Home"
import SellerPage from 'views/SellerPage'
import TrendPage from 'views/TrendPage'
import MapPage from 'views/MapPage'
import RankPage from 'views/RankPage'
import HotPage from 'views/HotPage'
import StockPage from 'views/StockPage'

Vue.use(VueRouter)

const routes = [{
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    component: Home
  },
  {
    path: '/sellerpage',
    component: SellerPage
  },
  {
    path: '/trendpage',
    component: TrendPage
  },
  {
    path: '/mappage',
    component: MapPage
  },
  {
    path: '/hotpage',
    component: HotPage
  },
  {
    path: '/stockpage',
    component: StockPage
  },
  {
    path: '/rankpage',
    component: RankPage
  }
]

const router = new VueRouter({
  routes
})

export default router